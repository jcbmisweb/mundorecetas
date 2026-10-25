import { localDB, getUnsyncedLocalData } from '../db/dexieDB';
import { Recipe, Product, MenuPlan } from '../types';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

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
export const executeCloudSync = async (force: boolean = false): Promise<{ success: boolean; syncedCount: number; quotaPaused?: boolean }> => {
  if (isSyncing) return { success: false, syncedCount: 0 };

  // Guard against running sync if Firestore quota limit was previously reached unless explicitly forced by user
  if (isQuotaExceeded && !force) {
    notifyListeners('⚡ Cuota diaria de Firestore alcanzada. Las fichas están 100% seguras en Local.');
    return { success: true, syncedCount: 0, quotaPaused: true };
  }

  const unsynced = await getUnsyncedLocalData();
  if (unsynced.totalCount === 0) {
    notifyListeners('Todo actualizado en Local y Nube');
    return { success: true, syncedCount: 0 };
  }

  isSyncing = true;
  notifyListeners('Comprobando recetas existentes y sincronizando con la nube...');

  let count = 0;
  let quotaHit = false;

  try {
    // 1. Obtener IDs ya existentes en Firestore para no re-escribir ni gastar cuota innecesaria
    let existingFirestoreRecipeIds = new Set<string>();
    try {
      const snap = await getDocs(collection(db, 'recipes'));
      snap.docs.forEach(d => existingFirestoreRecipeIds.add(d.id));
    } catch (e: any) {
      if (e?.message?.includes('Quota') || e?.message?.includes('quota') || e?.code === 'resource-exhausted') {
        quotaHit = true;
        isQuotaExceeded = true;
      }
    }

    // 2. Sincronizar recetas pendientes una a una con guardián de cuota
    if (!quotaHit && unsynced.recipes.length > 0) {
      for (const recipe of unsynced.recipes) {
        // Si ya existe en Firestore, no volver a gastar cuota con setDoc: simplemente marcar como sincronizada en local
        if (existingFirestoreRecipeIds.has(recipe.id)) {
          await localDB.recipes.update(recipe.id, { synced: true });
          count++;
          continue;
        }

        try {
          const cleanRecipe = { ...recipe, synced: true };
          await setDoc(doc(db, 'recipes', recipe.id), cleanRecipe, { merge: true });
          await localDB.recipes.update(recipe.id, { synced: true });
          count++;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || err?.code === 'resource-exhausted') {
            quotaHit = true;
            isQuotaExceeded = true;
            console.warn('Cuota de Firestore alcanzada. Pausando subida de recetas...');
            break;
          } else {
            console.warn(`No se pudo sincronizar receta ${recipe.id}:`, err);
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
    notifyListeners(`✓ Sincronización completada (${count} elementos subidos)`);
    return { success: true, syncedCount: count };
  } catch (err: any) {
    console.error('Error en la sincronización:', err);
    isSyncing = false;
    notifyListeners('Sincronización diferida. Datos guardados en Local.');
    return { success: false, syncedCount: count };
  }
};

/**
 * Initializes automatic background sync interval and network status listeners.
 */
export const startAutoSync = (intervalMinutes: number = 5, batchThreshold: number = 5) => {
  if (syncIntervalId) clearInterval(syncIntervalId);

  syncIntervalId = setInterval(() => {
    if (!isQuotaExceeded) {
      executeCloudSync();
    }
  }, intervalMinutes * 60 * 1000);

  window.addEventListener('online', () => {
    if (!isQuotaExceeded) {
      console.log('Navegador en línea: comprobando sincronización...');
      executeCloudSync();
    }
  });

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

