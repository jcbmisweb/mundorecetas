import { Recipe, Product, Allergen } from '../types';
import { localDB } from '../db/dexieDB';
import { db } from '../firebase';
import { collection, doc, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { getIsQuotaExceeded, setIsQuotaExceeded } from './syncManager';

/**
 * Raw product categories that distinguish ingredients from culinary recipes.
 */
export const RAW_PRODUCT_CATEGORIES = new Set([
  'ALMACÉN', 'ALMACEN', 'ESPECIAS', 'GRASAS', 'ACEITES', 
  'PESCADOS Y MARISCOS', 'CARNES Y AVES', 'VERDURAS Y HORTALIZAS', 
  'FRUTAS', 'LÁCTEOS', 'LACTEOS', 'CONGELADOS', 'LIMPIEZA', 
  'SOSA', 'OTROS', 'BEBIDAS', 'PANADERÍA (MATERIA PRIMA)'
]);

/**
 * Checks whether a Recipe object is actually a misclassified raw Product / Ingredient.
 */
/**
 * Checks whether a Recipe object is actually a misclassified raw Product / Ingredient.
 */
export const isRecipeRawProduct = (recipe: Recipe): boolean => {
  if (!recipe || !recipe.name) return false;

  const id = (recipe.id || '').toLowerCase();
  
  // 1. Explicit product ID prefixes
  if (id.startsWith('prod_') || id.startsWith('p_csv_') || id.startsWith('p_prod_')) {
    return true;
  }

  // 2. Check recipe indicators: if ANY exist, this is a genuine recipe, NOT a raw product.
  const subRecipes = Array.isArray(recipe.subRecipes) ? recipe.subRecipes : [];
  const hasSubRecipes = subRecipes.length > 0 && subRecipes.some(s => 
    (Array.isArray(s.ingredients) && s.ingredients.length > 0) || 
    (typeof s.instructions === 'string' && s.instructions.trim().length > 0)
  );
  const hasPlating = typeof recipe.platingInstructions === 'string' && recipe.platingInstructions.trim().length > 0;
  const hasYield = recipe.yieldQuantity !== undefined && recipe.yieldQuantity !== null && Number(recipe.yieldQuantity) > 0;
  const hasMinimalistCard = !!recipe.minimalistCard && (
    (Array.isArray(recipe.minimalistCard.allergens) && recipe.minimalistCard.allergens.length > 0) ||
    (typeof recipe.minimalistCard.miniComment === 'string' && recipe.minimalistCard.miniComment.trim().length > 0) ||
    (typeof recipe.minimalistCard.summaryInstructions === 'string' && recipe.minimalistCard.summaryInstructions.trim().length > 0) ||
    (typeof recipe.minimalistCard.platingTips === 'string' && recipe.minimalistCard.platingTips.trim().length > 0)
  );

  // If it has ANY recipe indicator, it is definitely a recipe!
  if (hasSubRecipes || hasPlating || hasYield || hasMinimalistCard) {
    return false;
  }

  // 3. If it has explicit product pricing/weight fields and zero recipe indicators, it's a raw product
  const hasPricePerUnit = (recipe as any).pricePerUnit !== undefined && typeof (recipe as any).pricePerUnit === 'number';
  const hasWeightPerUnit = (recipe as any).weightPerUnit !== undefined && typeof (recipe as any).weightPerUnit === 'number';
  if (hasPricePerUnit || hasWeightPerUnit) {
    return true;
  }

  // 4. If category is strictly a raw non-culinary store category and has zero recipe indicators
  const mainCat = (recipe.category || (recipe.categories && recipe.categories[0]) || '').toUpperCase().trim();
  const STRICT_RAW_CATEGORIES = new Set([
    'ALMACÉN', 'ALMACEN', 'ESPECIAS', 'GRASAS', 'ACEITES', 
    'CONGELADOS', 'LIMPIEZA', 'SOSA', 'BEBIDAS', 'PANADERÍA (MATERIA PRIMA)'
  ]);
  
  if (STRICT_RAW_CATEGORIES.has(mainCat)) {
    return true;
  }

  return false;
};

/**
 * Converts a misclassified Recipe object into a canonical Product object.
 */
export const convertRecipeToProduct = (recipe: Recipe): Product => {
  const allergens: Allergen[] = [
    ...(recipe.extraAllergens || []),
    ...(recipe.minimalistCard?.allergens || [])
  ];

  // Derive unit from yieldUnit or default to 'kg'
  let unit = (recipe.yieldUnit || 'kg').trim();
  if (!unit || unit === 'pax') unit = 'kg';

  // Derive price per unit from totalCost or legacy pricePerUnit
  const price = typeof (recipe as any).pricePerUnit === 'number' 
    ? (recipe as any).pricePerUnit 
    : (recipe.totalCost || 0);

  return {
    id: recipe.id.startsWith('p_') || recipe.id.startsWith('prod_') ? recipe.id : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: recipe.name.trim(),
    category: recipe.category || 'ALMACÉN',
    unit: unit,
    pricePerUnit: price,
    weightPerUnit: (recipe as any).weightPerUnit,
    allergens: Array.from(new Set(allergens)),
    status: 'approved',
    synced: false
  };
};

export interface SeparationResult {
  cleanRecipes: Recipe[];
  extractedProducts: Product[];
  movedCount: number;
}

/**
 * Separates an array of recipes into genuine culinary recipes and extracted raw products.
 * Merges extracted products into existing products without duplicate IDs or names.
 */
export const separateRecipesAndProducts = (
  allRecipes: Recipe[],
  existingProducts: Product[]
): SeparationResult => {
  const cleanRecipes: Recipe[] = [];
  const extractedProductsMap = new Map<string, Product>();

  // Add existing products to map
  existingProducts.forEach(p => {
    if (p.id) extractedProductsMap.set(p.id, p);
    if (p.name) extractedProductsMap.set(p.name.trim().toLowerCase(), p);
  });

  let movedCount = 0;

  for (const r of allRecipes) {
    if (isRecipeRawProduct(r)) {
      movedCount++;
      const prod = convertRecipeToProduct(r);
      const nameKey = prod.name.trim().toLowerCase();
      if (!extractedProductsMap.has(prod.id) && !extractedProductsMap.has(nameKey)) {
        extractedProductsMap.set(prod.id, prod);
        extractedProductsMap.set(nameKey, prod);
      }
    } else {
      cleanRecipes.push(r);
    }
  }

  const extractedProducts = Array.from(new Set(extractedProductsMap.values()));

  return {
    cleanRecipes,
    extractedProducts,
    movedCount
  };
};

/**
 * Executes a full database cleanup: updates local state, Dexie IndexedDB, localStorage, and Firestore.
 */
export const executeDatabaseSeparation = async (
  currentRecipes: Recipe[],
  currentProducts: Product[]
): Promise<{ cleanRecipes: Recipe[]; cleanProducts: Product[]; movedCount: number }> => {
  const result = separateRecipesAndProducts(currentRecipes, currentProducts);

  if (result.movedCount === 0) {
    return {
      cleanRecipes: currentRecipes,
      cleanProducts: currentProducts,
      movedCount: 0
    };
  }

  // 1. Update localStorage cache
  try {
    localStorage.setItem('cached_recipes', JSON.stringify(result.cleanRecipes));
    localStorage.setItem('cached_products', JSON.stringify(result.extractedProducts));
  } catch (e) {
    console.warn('Could not update localStorage cache during separation:', e);
  }

  // 2. Update Dexie IndexedDB
  try {
    for (const p of result.extractedProducts) {
      await localDB.recipes.delete(p.id);
    }
    if (result.cleanRecipes.length > 0) {
      await localDB.recipes.bulkPut(result.cleanRecipes);
    }
    if (result.extractedProducts.length > 0) {
      await localDB.products.bulkPut(result.extractedProducts);
    }
  } catch (e) {
    console.warn('Could not update Dexie localDB during separation:', e);
  }

  // 3. Update Firestore if accessible and quota is available
  if (!getIsQuotaExceeded()) {
    try {
      const misclassifiedRecipes = currentRecipes.filter(isRecipeRawProduct);
      for (const r of misclassifiedRecipes) {
        if (getIsQuotaExceeded()) break;
        // Delete misclassified document from /recipes
        try {
          await deleteDoc(doc(db, 'recipes', r.id));
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (msg.includes('Quota') || msg.includes('quota') || err?.code === 'resource-exhausted') {
            setIsQuotaExceeded(true);
            break;
          }
        }
        // Save converted product to /products
        try {
          const prod = convertRecipeToProduct(r);
          await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (msg.includes('Quota') || msg.includes('quota') || err?.code === 'resource-exhausted') {
            setIsQuotaExceeded(true);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Firestore cloud cleanup warning:', e);
    }
  }

  return {
    cleanRecipes: result.cleanRecipes,
    cleanProducts: result.extractedProducts,
    movedCount: result.movedCount
  };
};
