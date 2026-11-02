import { localDB, getUnsyncedLocalData } from '../db/dexieDB';
import { Recipe, Product, MenuPlan } from '../types';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ensureRecipeFitsFirestore } from './imageUtils';

export interface SyncStatus {
  isSyncing: boolean;
  unsyncedCount: number;
  syncedCount?: number;
  totalLocalCount?: number;
  lastSyncTime?: number;
  message?: string;
  isQuotaExceeded?: boolean;
}

type SyncStatusListener = (status: SyncStatus) => void;

let listeners: SyncStatusListener[] = [];
let isSyncing = false;
let lastSyncTime = Date.now();
let syncIntervalId: NodeJS.Timeout | null = null;
let isQuotaExceeded = false;

export const getIsQuotaExceeded = () => isQuotaExceeded;
export const setIsQuotaExceeded = (val: boolean) => {
  isQuotaExceeded = val;
  notifyListeners(val ? '⚡ Cuota diaria de Firestore alcanzada. Modo local activo.' : 'Estado de cuota reiniciado.');
};

export const resetQuotaStatus = () => {
  setIsQuotaExceeded(false);
};

export const subscribeSyncStatus = (listener: SyncStatusListener) => {
  listeners.push(listener);
  notifyListeners();
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const getSyncStatistics = async () => {
  try {
    const allRecipes = await localDB.recipes.toArray();
    const allProducts = await localDB.products.toArray();
    const allMenus = await localDB.menuPlans.toArray();

    const unsyncedRecipes = allRecipes.filter(r => r.synced === false);
    const unsyncedProducts = allProducts.filter(p => p.synced === false);
    const unsyncedMenus = allMenus.filter(m => m.synced === false);

    const totalLocal = allRecipes.length;
    const unsyncedCount = unsyncedRecipes.length + unsyncedProducts.length + unsyncedMenus.length;
    const syncedCount = totalLocal - unsyncedRecipes.length;

    return {
      totalLocal,
      syncedCount,
      unsyncedCount,
      isQuotaExceeded,
      allRecipes
    };
  } catch (e) {
    return {
      totalLocal: 0,
      syncedCount: 0,
      unsyncedCount: 0,
      isQuotaExceeded,
      allRecipes: []
    };
  }
};

const notifyListeners = async (msg?: string) => {
  try {
    const stats = await getSyncStatistics();
    listeners.forEach(l => l({
      isSyncing,
      unsyncedCount: stats.unsyncedCount,
      syncedCount: stats.syncedCount,
      totalLocalCount: stats.totalLocal,
      lastSyncTime,
      message: msg,
      isQuotaExceeded
    }));
  } catch (e) {
    console.error('Error notifying sync listeners:', e);
  }
};

/**
 * Executes a resilient, local-first sync operation uploading unsynced items
 * from Dexie localDB to Firebase Firestore in safe micro-batches.
 * It guards against QuotaExceeded errors and never loses or removes local data.
 */
export const executeCloudSync = async (forceParam: any = false): Promise<{ success: boolean; syncedCount: number; quotaPaused?: boolean }> => {
  if (isSyncing) return { success: false, syncedCount: 0 };

  const isForced = Boolean(forceParam);
  if (isForced) {
    isQuotaExceeded = false;
  }

  // Guard against running sync if Firestore quota limit was previously reached unless explicitly forced by user
  if (isQuotaExceeded && !isForced) {
    notifyListeners('⚡ Cuota diaria de Firestore alcanzada. Las fichas están 100% seguras en Local.');
    return { success: true, syncedCount: 0, quotaPaused: true };
  }

  const unsynced = await getUnsyncedLocalData();
  if (unsynced.totalCount === 0) {
    isQuotaExceeded = false;
    notifyListeners('✓ Todo actualizado en Local y Nube');
    return { success: true, syncedCount: 0 };
  }

  isSyncing = true;
  notifyListeners('Comprobando recetas existentes y sincronizando con la nube...');

  let count = 0;
  let quotaHit = false;

  try {
    // 1. Sincronizar recetas pendientes una a una con optimización de payload
    if (!quotaHit && unsynced.recipes.length > 0) {
      for (const recipe of unsynced.recipes) {
        try {
          const fitted = await ensureRecipeFitsFirestore({ ...recipe, synced: true });
          await setDoc(doc(db, 'recipes', recipe.id), fitted, { merge: true });
          await localDB.recipes.update(recipe.id, { ...fitted, synced: true });
          count++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            console.warn('Cuota de Firestore alcanzada. Pausando subida de recetas...');
            break;
          } else {
            console.warn(`Error al subir receta ${recipe.id}, se mantiene guardada en local:`, err);
            // NUNCA marcar como sincronizado si falló la subida; permanece seguro en disco local
          }
        }
      }
    }

    // 3. Sincronizar materias primas si no se ha agotado la cuota
    if (!quotaHit && unsynced.products.length > 0) {
      for (const product of unsynced.products) {
        try {
          const cleanProduct = { ...product, synced: true };
          await setDoc(doc(db, 'products', product.id), cleanProduct, { merge: true });
          await localDB.products.update(product.id, { synced: true });
          count++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            break;
          }
        }
      }
    }

    // 4. Sincronizar menús si no se ha agotado la cuota
    if (!quotaHit && unsynced.menuPlans.length > 0) {
      for (const plan of unsynced.menuPlans) {
        try {
          const cleanPlan = { ...plan, synced: true };
          await setDoc(doc(db, 'menuPlans', plan.id), cleanPlan, { merge: true });
          await localDB.menuPlans.update(plan.id, { synced: true });
          count++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            break;
          }
        }
      }
    }

    lastSyncTime = Date.now();
    isSyncing = false;

    if (quotaHit) {
      notifyListeners(`⚡ Cuota diaria de Firestore alcanzada. Las fichas están 100% seguras en Local.`);
      return { success: true, syncedCount: count, quotaPaused: true };
    }

    isQuotaExceeded = false;
    notifyListeners(`✓ Sincronización completada (${count} elementos actualizados)`);
    return { success: true, syncedCount: count };
  } catch (err: any) {
    console.error('Error en la sincronización:', err);
    isSyncing = false;
    notifyListeners('Sincronización diferida. Datos guardados en Local.');
    return { success: false, syncedCount: count };
  }
};

const DAILY_SYNC_KEY = 'gastronomy_last_daily_sync_date';

export const isDailySyncNeeded = (): boolean => {
  try {
    const lastSyncDate = localStorage.getItem(DAILY_SYNC_KEY);
    const today = new Date().toISOString().slice(0, 10);
    return lastSyncDate !== today;
  } catch {
    return true;
  }
};

export const markDailySyncCompleted = () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(DAILY_SYNC_KEY, today);
  } catch {}
};

export const getDailySyncStatus = () => {
  try {
    const lastSyncDate = localStorage.getItem(DAILY_SYNC_KEY);
    const today = new Date().toISOString().slice(0, 10);
    return {
      isCompletedToday: lastSyncDate === today,
      lastSyncDate: lastSyncDate || 'Nunca'
    };
  } catch {
    return { isCompletedToday: false, lastSyncDate: 'Nunca' };
  }
};

/**
 * Realiza la comprobación diaria única al comenzar el día:
 * - Comprueba si ya se hizo hoy. Si ya se hizo, NO LO VUELVE A HACER (evita revisiones constantes y ahorro de cuota).
 * - Compara las recetas del disco local con las de la base de datos de Firebase.
 * - Sube las recetas locales que falten o que tengan modificaciones pendientes (synced: false).
 * - Descarga recetas remotas que falten en el equipo SIN SOBRESCRIBIR las locales modificadas.
 * - Marca el día como verificado para no volver a ejecutar revisiones durante el resto del día.
 */
export const executeDailyVerification = async (force: boolean = false): Promise<{
  executed: boolean;
  uploadedCount: number;
  downloadedCount: number;
  message: string;
}> => {
  const today = new Date().toISOString().slice(0, 10);
  if (!force && !isDailySyncNeeded()) {
    console.info(`[DailySync] Verificación diaria ya completada hoy (${today}). Usando datos locales de alta velocidad.`);
    return {
      executed: false,
      uploadedCount: 0,
      downloadedCount: 0,
      message: `Comprobación del día completada (${today}). Base de datos local activa.`
    };
  }

  isSyncing = true;
  notifyListeners('Comprobando recetas locales con la base de datos (verificación del día)...');

  let uploadedCount = 0;
  let downloadedCount = 0;

  try {
    const localRecipes = await localDB.recipes.toArray();
    const localMap = new Map<string, Recipe>(localRecipes.map(r => [r.id, r]));

    let remoteDocs: Recipe[] = [];
    try {
      const snap = await getDocs(collection(db, 'recipes'));
      remoteDocs = snap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Recipe));
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
        setIsQuotaExceeded(true);
      }
      console.warn('[DailySync] Firestore no disponible o cuota alcanzada, manteniendo datos locales intactos:', err);
    }

    const remoteMap = new Map<string, Recipe>(remoteDocs.map(r => [r.id, r]));

    // 1. Identificar recetas locales que necesitan subirse a la base de datos
    const toUpload: Recipe[] = [];
    for (const localR of localRecipes) {
      if (!localR.id) continue;
      const remoteR = remoteMap.get(localR.id);
      if (!remoteR) {
        // No existe en Firebase
        toUpload.push(localR);
      } else if (localR.synced === false || (localR.lastModified || 0) > (remoteR.lastModified || 0)) {
        // Modificada en el PC
        toUpload.push(localR);
      }
    }

    // 2. Subir las recetas pendientes a Firestore si no hay bloqueo de cuota
    if (!isQuotaExceeded && toUpload.length > 0) {
      for (const r of toUpload) {
        try {
          const fitted = await ensureRecipeFitsFirestore({ ...r, synced: true });
          await setDoc(doc(db, 'recipes', r.id), fitted, { merge: true });
          await localDB.recipes.update(r.id, { ...fitted, synced: true });
          localMap.set(r.id, { ...fitted, synced: true });
          uploadedCount++;
        } catch (uploadErr: any) {
          const errMsg = uploadErr?.message || String(uploadErr);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || uploadErr?.code === 'resource-exhausted') {
            setIsQuotaExceeded(true);
            break;
          }
          console.warn(`[DailySync] No se pudo subir ${r.name || r.id}, conservada segura en local:`, uploadErr);
        }
      }
    }

    // 3. Descargar recetas de la nube que falten por completo en local
    const toDownload: Recipe[] = [];
    for (const remoteR of remoteDocs) {
      if (!localMap.has(remoteR.id)) {
        toDownload.push({ ...remoteR, synced: true });
      }
    }

    if (toDownload.length > 0) {
      await localDB.recipes.bulkPut(toDownload);
      downloadedCount = toDownload.length;
    }

    // Marcar verificación diaria como completada para no volver a hacerlo hoy
    markDailySyncCompleted();
    lastSyncTime = Date.now();
    isSyncing = false;
    notifyListeners(`✓ Verificación diaria completada (${uploadedCount} subidas, ${downloadedCount} descargadas). No se volverá a comprobar hoy.`);

    return {
      executed: true,
      uploadedCount,
      downloadedCount,
      message: `Comprobación diaria finalizada con éxito.`
    };
  } catch (err: any) {
    console.error('[DailySync] Error durante la comprobación diaria:', err);
    markDailySyncCompleted(); // Evitar bucle repetitivo de reintentos
    isSyncing = false;
    notifyListeners('Comprobación finalizada. Datos guardados en Local.');
    return {
      executed: false,
      uploadedCount,
      downloadedCount,
      message: 'Comprobación finalizada con datos locales protegidos.'
    };
  }
};

/**
 * Registra los listeners de sincronización sin ejecutar intervalos periódicos agresivos.
 */
export const startAutoSync = (_intervalMinutes: number = 5, _batchThreshold: number = 5) => {
  if (syncIntervalId) clearInterval(syncIntervalId);
  syncIntervalId = null;

  // Ya NO se ejecuta el bucle de sondeo constante cada 5 minutos para ahorrar cuota
  notifyListeners();
};

/**
 * Checks if unsynced items reach the batch threshold and triggers immediate sync.
 */
export const checkBatchSyncThreshold = async (threshold: number = 5) => {
  if (isQuotaExceeded) {
    notifyListeners();
    return;
  }
  const unsynced = await getUnsyncedLocalData();
  if (unsynced.totalCount >= threshold) {
    executeCloudSync();
  } else {
    notifyListeners();
  }
};

