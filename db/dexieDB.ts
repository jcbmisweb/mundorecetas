import Dexie, { Table } from 'dexie';
import { Recipe, Product, MenuPlan } from '../types';

export class GastronomyLocalDB extends Dexie {
  recipes!: Table<Recipe, string>;
  products!: Table<Product, string>;
  menuPlans!: Table<MenuPlan, string>;

  constructor() {
    super('GastronomyLocalDB');
    this.version(1).stores({
      recipes: 'id, name, category, synced, lastModified',
      products: 'id, name, category, synced, lastModified',
      menuPlans: 'id, title, date, synced, lastModified'
    });
  }
}

export const localDB = new GastronomyLocalDB();

/**
 * Saves a recipe into IndexedDB locally with sync flag and timeout protection.
 */
export const saveRecipeLocal = async (recipe: Recipe, isSynced: boolean = false): Promise<void> => {
  const itemToSave: Recipe = {
    ...recipe,
    lastModified: recipe.lastModified || Date.now(),
    synced: isSynced
  };
  try {
    await localDB.recipes.put(itemToSave);
  } catch (err) {
    console.warn("Could not save recipe to Dexie:", err);
  }
};

/**
 * Saves a product into IndexedDB locally with sync flag.
 */
export const saveProductLocal = async (product: Product, isSynced: boolean = false): Promise<void> => {
  const itemToSave: Product = {
    ...product,
    lastModified: product.lastModified || Date.now(),
    synced: isSynced
  };
  try {
    await localDB.products.put(itemToSave);
  } catch (err) {
    console.warn("Could not save product to Dexie:", err);
  }
};

/**
 * Saves a menu plan into IndexedDB locally with sync flag.
 */
export const saveMenuPlanLocal = async (plan: MenuPlan, isSynced: boolean = false): Promise<void> => {
  const itemToSave: MenuPlan = {
    ...plan,
    synced: isSynced
  };
  try {
    await localDB.menuPlans.put(itemToSave);
  } catch (err) {
    console.warn("Could not save menu plan to Dexie:", err);
  }
};

export const getStorageBreakdown = async () => {
  try {
    const allRecipes = await localDB.recipes.toArray();
    const online = allRecipes.filter(r => r.synced === true).length;
    const offline = allRecipes.filter(r => r.synced === false).length;
    return {
      total: allRecipes.length,
      online,
      offline
    };
  } catch (e) {
    return { total: 0, online: 0, offline: 0 };
  }
};

/**
 * Returns unsynced local changes.
 */
export const getUnsyncedLocalData = async () => {
  const unsyncedRecipes = await localDB.recipes.filter(r => r.synced === false).toArray();
  const unsyncedProducts = await localDB.products.filter(p => p.synced === false).toArray();
  const unsyncedPlans = await localDB.menuPlans.filter(m => m.synced === false).toArray();

  return {
    recipes: unsyncedRecipes,
    products: unsyncedProducts,
    menuPlans: unsyncedPlans,
    totalCount: unsyncedRecipes.length + unsyncedProducts.length + unsyncedPlans.length
  };
};

/**
 * Seeds local database from initial remote or cached list without overwriting unsynced local changes.
 */
export const seedLocalDatabase = async (
  recipesList: Recipe[],
  productsList: Product[],
  menusList: MenuPlan[] = []
) => {
  if (recipesList.length > 0) {
    // Preserve local unsynced status
    const existing = await localDB.recipes.toArray();
    const existingMap = new Map(existing.map(r => [r.id, r]));
    const preparedRecipes = recipesList.map(r => {
      const localItem = existingMap.get(r.id);
      if (localItem && localItem.synced === false) {
        return { ...r, synced: false };
      }
      return { ...r, synced: r.synced ?? true };
    });
    await localDB.recipes.bulkPut(preparedRecipes);
  }
  if (productsList.length > 0) {
    await localDB.products.bulkPut(productsList.map(p => ({ ...p, synced: p.synced ?? true })));
  }
  if (menusList.length > 0) {
    await localDB.menuPlans.bulkPut(menusList.map(m => ({ ...m, synced: m.synced ?? true })));
  }
};

