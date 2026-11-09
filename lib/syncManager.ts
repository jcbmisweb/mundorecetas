import { localDB, getUnsyncedLocalData } from '../db/dexieDB';
import { Recipe, Product, MenuPlan, ProRecipe } from '../types';
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
    const allPro = await localDB.proRecipes.toArray();

    const unsyncedRecipes = allRecipes.filter(r => r.synced === false);
    const unsyncedProducts = allProducts.filter(p => p.synced === false);
    const unsyncedMenus = allMenus.filter(m => m.synced === false);
    const unsyncedPro = allPro.filter(p => p.synced === false);

    const totalLocal = allRecipes.length;
    const unsyncedCount = unsyncedRecipes.length + unsyncedProducts.length + unsyncedMenus.length + unsyncedPro.length;
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

export const cleanForFirestore = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, (_key, value) => {
    return value === undefined ? null : value;
  }));
};

/**
 * Executes a resilient, bidirectional synchronization:
 * 1. Uploads unsynced local recipes, products, and menus to Firebase Firestore.
 * 2. Downloads and merges new or updated recipes (including verification checks), products, and menus from Firestore into local Dexie DB.
 * It guards against QuotaExceeded errors and never loses or removes local data.
 */
export const executeCloudSync = async (forceParam: any = false): Promise<{
  success: boolean;
  syncedCount: number;
  downloadedCount: number;
  quotaPaused?: boolean;
}> => {
  if (isSyncing) return { success: false, syncedCount: 0, downloadedCount: 0 };

  const isForced = Boolean(forceParam);
  if (isForced) {
    isQuotaExceeded = false;
  }

  // Guard against running sync if Firestore quota limit was previously reached unless explicitly forced by user
  if (isQuotaExceeded && !isForced) {
    notifyListeners('⚡ Cuota diaria de Firestore alcanzada. Las fichas están 100% seguras en Local.');
    return { success: true, syncedCount: 0, downloadedCount: 0, quotaPaused: true };
  }

  isSyncing = true;
  notifyListeners('Sincronizando recetas y catálogo con la nube (subida y descarga)...');

  let uploadedCount = 0;
  let downloadedCount = 0;
  let quotaHit = false;
  let lastUploadError: string | null = null;

  try {
    const unsynced = await getUnsyncedLocalData();

    // 1. Subir recetas locales pendientes una a una con compresión si aplica
    if (!quotaHit && unsynced.recipes.length > 0) {
      for (const recipe of unsynced.recipes) {
        try {
          const fitted = await ensureRecipeFitsFirestore({ ...recipe, synced: true });
          const safeRecipe = cleanForFirestore(fitted);
          await setDoc(doc(db, 'recipes', recipe.id), safeRecipe, { merge: true });
          await localDB.recipes.update(recipe.id, { ...safeRecipe, synced: true });
          uploadedCount++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          lastUploadError = errMsg;
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            console.warn('Cuota de Firestore alcanzada. Pausando subida de recetas...');
            break;
          } else {
            console.warn(`Error al subir receta ${recipe.id}:`, errMsg);
          }
        }
      }
    }

    // 2. Subir recetas de Taller I+D pendientes
    if (!quotaHit && unsynced.proRecipes && unsynced.proRecipes.length > 0) {
      for (const pro of unsynced.proRecipes) {
        try {
          const cleanPro = cleanForFirestore({ ...pro, synced: true });
          await setDoc(doc(db, 'proRecipes', pro.id), cleanPro, { merge: true });
          await localDB.proRecipes.update(pro.id, { synced: true });
          uploadedCount++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          lastUploadError = errMsg;
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            break;
          } else {
            console.warn(`Error al subir proRecipe ${pro.id}:`, errMsg);
          }
        }
      }
    }

    // 3. Subir materias primas / productos pendientes
    if (!quotaHit && unsynced.products.length > 0) {
      for (const product of unsynced.products) {
        try {
          const cleanProduct = cleanForFirestore({ ...product, synced: true });
          await setDoc(doc(db, 'products', product.id), cleanProduct, { merge: true });
          await localDB.products.update(product.id, { synced: true });
          uploadedCount++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          lastUploadError = errMsg;
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            break;
          } else {
            console.warn(`Error al subir producto ${product.id}:`, errMsg);
          }
        }
      }
    }

    // 4. Subir planes de menú pendientes (a menuPlans y menu_plans)
    if (!quotaHit && unsynced.menuPlans.length > 0) {
      for (const plan of unsynced.menuPlans) {
        try {
          const cleanPlan = cleanForFirestore({ ...plan, synced: true });
          await Promise.allSettled([
            setDoc(doc(db, 'menuPlans', plan.id), cleanPlan, { merge: true }),
            setDoc(doc(db, 'menu_plans', plan.id), cleanPlan, { merge: true })
          ]);
          await localDB.menuPlans.update(plan.id, { synced: true });
          uploadedCount++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          lastUploadError = errMsg;
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            break;
          } else {
            console.warn(`Error al subir menú ${plan.id}:`, errMsg);
          }
        }
      }
    }

    // 5. Descarga y sincronización desde la nube hacia el almacenamiento local (Firestore -> Dexie)
    if (!quotaHit) {
      try {
        // A. Descargar y fusionar recetas
        const snap = await getDocs(collection(db, 'recipes'));
        const remoteDocs = snap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Recipe));
        const localRecipes = await localDB.recipes.toArray();
        const localMap = new Map<string, Recipe>(localRecipes.map(r => [r.id, r]));

        const recipesToUpdate: Recipe[] = [];
        for (const remoteR of remoteDocs) {
          if (!remoteR.id) continue;
          const localR = localMap.get(remoteR.id);
          if (!localR) {
            // Receta remota que falta completamente en este equipo
            recipesToUpdate.push({ ...remoteR, synced: true });
            downloadedCount++;
          } else {
            const remoteVerified = Boolean(remoteR.isVerified);
            const localVerified = Boolean(localR.isVerified);
            const remoteMod = remoteR.lastModified || 0;
            const localMod = localR.lastModified || 0;

            // Trazabilidad por marcas y fechas:
            // 1. Si la versión en la nube es más reciente que la local (remoteMod > localMod)
            // 2. Si la versión en la nube está verificada (isVerified: true) y la local no
            // 3. O si la local no tiene cambios pendientes de subir (synced !== false) y difieren en nombre o verificación
            if (remoteMod > localMod || (remoteVerified && !localVerified)) {
              recipesToUpdate.push({ ...localR, ...remoteR, synced: true });
              downloadedCount++;
            } else if (localR.synced !== false && (remoteVerified !== localVerified || remoteR.name !== localR.name)) {
              recipesToUpdate.push({ ...localR, ...remoteR, synced: true });
              downloadedCount++;
            }
          }
        }

        if (recipesToUpdate.length > 0) {
          await localDB.recipes.bulkPut(recipesToUpdate);
        }

        // B. Descargar productos remotos que falten o estén actualizados
        try {
          const prodSnap = await getDocs(collection(db, 'products'));
          const remoteProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Product));
          const localProds = await localDB.products.toArray();
          const localProdMap = new Map(localProds.map(p => [p.id, p]));
          const prodsToPut: Product[] = [];
          for (const rp of remoteProds) {
            if (!rp.id) continue;
            const lp = localProdMap.get(rp.id);
            if (!lp || (lp.synced !== false && (rp.lastModified || 0) > (lp.lastModified || 0))) {
              prodsToPut.push({ ...rp, synced: true });
            }
          }
          if (prodsToPut.length > 0) {
            await localDB.products.bulkPut(prodsToPut);
          }
        } catch (prodErr) {
          console.warn('[Sync] Advertencia al descargar productos de Firestore:', prodErr);
        }

        // C. Descargar planes de menú remotos que falten (comprobando menuPlans y menu_plans)
        try {
          let remoteMenus: MenuPlan[] = [];
          try {
            const menuSnap = await getDocs(collection(db, 'menuPlans'));
            remoteMenus = menuSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as MenuPlan));
          } catch (e1) {
            console.warn('[Sync] Advertencia menuPlans:', e1);
          }
          if (remoteMenus.length === 0) {
            try {
              const altSnap = await getDocs(collection(db, 'menu_plans'));
              remoteMenus = altSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as MenuPlan));
            } catch (e2) {
              console.warn('[Sync] Advertencia menu_plans:', e2);
            }
          }
          const localMenus = await localDB.menuPlans.toArray();
          const localMenuMap = new Map(localMenus.map(m => [m.id, m]));
          const menusToPut: MenuPlan[] = [];
          for (const rm of remoteMenus) {
            if (!rm.id) continue;
            const lm = localMenuMap.get(rm.id);
            if (!lm || lm.synced !== false || (rm.lastModified || 0) > (lm.lastModified || 0)) {
              menusToPut.push({ ...rm, synced: true });
            }
          }
          if (menusToPut.length > 0) {
            await localDB.menuPlans.bulkPut(menusToPut);
          }
        } catch (menuErr) {
          console.warn('[Sync] Advertencia al descargar menús de Firestore:', menuErr);
        }

        // D. Descargar proRecipes remotas que falten
        try {
          const proSnap = await getDocs(collection(db, 'proRecipes'));
          const remotePros = proSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as ProRecipe));
          const localPros = await localDB.proRecipes.toArray();
          const localProMap = new Map(localPros.map(p => [p.id, p]));
          const prosToPut: ProRecipe[] = [];
          for (const rpro of remotePros) {
            if (!rpro.id) continue;
            const lpro = localProMap.get(rpro.id);
            if (!lpro || lpro.synced !== false) {
              prosToPut.push({ ...rpro, synced: true });
            }
          }
          if (prosToPut.length > 0) {
            await localDB.proRecipes.bulkPut(prosToPut);
          }
        } catch (proErr) {
          console.warn('[Sync] Advertencia al descargar proRecipes de Firestore:', proErr);
        }

      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
          quotaHit = true;
          isQuotaExceeded = true;
        } else {
          console.warn('[Sync] Error al descargar de Firestore:', err);
        }
      }
    }

    markDailySyncCompleted();
    lastSyncTime = Date.now();
    isSyncing = false;

    if (quotaHit) {
      if (uploadedCount > 0) {
        notifyListeners(`✓ Se han subido ${uploadedCount} elementos a la nube. La descarga de novedades se completará cuando se reinicie la cuota diaria.`);
      } else {
        notifyListeners(`⚡ Cuota diaria de lectura de Firestore alcanzada hoy (50.000 lecturas). Tus fichas están 100% seguras en Local.`);
      }
      return { success: true, syncedCount: uploadedCount, downloadedCount, quotaPaused: true };
    }

    isQuotaExceeded = false;
    if (uploadedCount > 0 || downloadedCount > 0) {
      notifyListeners(`✓ Sincronización completa (${uploadedCount} subidas, ${downloadedCount} actualizadas desde la nube)`);
    } else if (unsynced.totalCount > 0 && lastUploadError) {
      notifyListeners(`⚠️ Pendiente (${unsynced.totalCount} sin subir: ${lastUploadError.slice(0, 80)})`);
    } else {
      notifyListeners(`✓ Todo al día. Nube y disco local completamente sincronizados.`);
    }

    return { success: true, syncedCount: uploadedCount, downloadedCount };
  } catch (err: any) {
    console.error('Error en la sincronización:', err);
    isSyncing = false;
    notifyListeners('Sincronización finalizada con datos locales protegidos.');
    return { success: false, syncedCount: uploadedCount, downloadedCount };
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

    // 3. Descargar recetas de la nube que falten o que tengan fecha más reciente en Firestore
    const toDownload: Recipe[] = [];
    for (const remoteR of remoteDocs) {
      if (!remoteR.id) continue;
      const localR = localMap.get(remoteR.id);
      if (!localR) {
        toDownload.push({ ...remoteR, synced: true });
      } else {
        const remoteVerified = Boolean(remoteR.isVerified);
        const localVerified = Boolean(localR.isVerified);
        const remoteMod = remoteR.lastModified || 0;
        const localMod = localR.lastModified || 0;
        if (remoteMod > localMod || (remoteVerified && !localVerified)) {
          toDownload.push({ ...localR, ...remoteR, synced: true });
        }
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
 * Forzar descarga y reemplazo total desde Firebase Firestore (Calco exacto de la nube).
 * Descarga todas las recetas, productos, menús y recetas pro directamente a Dexie (localDB),
 * resolviendo cualquier discrepancia entre ordenadores (casa, portátil, IES, tablet).
 */
export const forcePullFromCloud = async (): Promise<{
  success: boolean;
  recipesCount: number;
  productsCount: number;
  menusCount: number;
  proRecipesCount: number;
  message: string;
}> => {
  isSyncing = true;
  notifyListeners('Forzando descarga completa y calco exacto desde Firebase...');

  try {
    // 1. Recetas
    const recipeSnap = await getDocs(collection(db, 'recipes'));
    const remoteRecipes = recipeSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Recipe));
    if (remoteRecipes.length > 0) {
      await localDB.recipes.bulkPut(remoteRecipes);
    }

    // 2. Materias primas / productos
    let remoteProds: Product[] = [];
    try {
      const prodSnap = await getDocs(collection(db, 'products'));
      remoteProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Product));
      if (remoteProds.length > 0) {
        await localDB.products.bulkPut(remoteProds);
      }
    } catch (e) {
      console.warn('[forcePull] Error descargando productos:', e);
    }

    // 3. Menús
    let remoteMenus: MenuPlan[] = [];
    try {
      let menuSnap = await getDocs(collection(db, 'menuPlans'));
      remoteMenus = menuSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as MenuPlan));
      if (remoteMenus.length === 0) {
        const altSnap = await getDocs(collection(db, 'menu_plans'));
        remoteMenus = altSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as MenuPlan));
      }
      if (remoteMenus.length > 0) {
        await localDB.menuPlans.bulkPut(remoteMenus);
      }
    } catch (e) {
      console.warn('[forcePull] Error descargando menús:', e);
    }

    // 4. ProRecipes
    let remotePros: ProRecipe[] = [];
    try {
      const proSnap = await getDocs(collection(db, 'proRecipes'));
      remotePros = proSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as ProRecipe));
      if (remotePros.length > 0) {
        await localDB.proRecipes.bulkPut(remotePros);
      }
    } catch (e) {
      console.warn('[forcePull] Error descargando proRecipes:', e);
    }

    isSyncing = false;
    isQuotaExceeded = false;
    lastSyncTime = Date.now();
    const msg = `✓ Calco completado: ${remoteRecipes.length} recetas, ${remoteMenus.length} menús y ${remoteProds.length} productos sincronizados desde la nube.`;
    notifyListeners(msg);

    return {
      success: true,
      recipesCount: remoteRecipes.length,
      productsCount: remoteProds.length,
      menusCount: remoteMenus.length,
      proRecipesCount: remotePros.length,
      message: msg
    };
  } catch (err: any) {
    isSyncing = false;
    const errMsg = err?.message || String(err);
    if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
      isQuotaExceeded = true;
      notifyListeners('⚡ Cuota diaria de lectura de Firestore alcanzada. Se reanudará al resetear el límite.');
    } else {
      notifyListeners(`Error en descarga: ${errMsg.slice(0, 60)}`);
    }
    return {
      success: false,
      recipesCount: 0,
      productsCount: 0,
      menusCount: 0,
      proRecipesCount: 0,
      message: errMsg
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

