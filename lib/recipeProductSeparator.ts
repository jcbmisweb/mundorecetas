import { Recipe, Product, Allergen } from '../types';
import { localDB } from '../db/dexieDB';
import { db } from '../firebase';
import { collection, doc, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';

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
export const isRecipeRawProduct = (recipe: Recipe): boolean => {
  if (!recipe || !recipe.name) return false;

  const id = (recipe.id || '').toLowerCase();
  
  // 1. Check ID pattern typical of products
  if (id.startsWith('p_') || id.startsWith('prod_') || id.startsWith('p_csv_')) {
    return true;
  }

  // 2. Check explicit product fields attached to recipe object
  if ((recipe as any).pricePerUnit !== undefined || (recipe as any).weightPerUnit !== undefined) {
    return true;
  }

  // 3. Check if category is a raw product category AND it lacks culinary sub-recipes/instructions
  const mainCat = (recipe.category || (recipe.categories && recipe.categories[0]) || '').toUpperCase().trim();
  const isProdCategory = RAW_PRODUCT_CATEGORIES.has(mainCat);

  const subRecipes = recipe.subRecipes || [];
  const hasRealSubRecipes = subRecipes.some(sub => {
    const hasIngredients = Array.isArray(sub.ingredients) && sub.ingredients.length > 0;
    const hasInstructions = typeof sub.instructions === 'string' && sub.instructions.trim().length > 15;
    return hasIngredients || hasInstructions;
  });

  const hasPlating = typeof recipe.platingInstructions === 'string' && recipe.platingInstructions.trim().length > 15;

  if (isProdCategory && !hasRealSubRecipes && !hasPlating) {
    return true;
  }

  // 4. Fallback: single word item with 0 ingredients and 0 instructions in raw category
  if (!hasRealSubRecipes && !hasPlating) {
    const isSingleWordUpper = recipe.name.trim() === recipe.name.trim().toUpperCase() && recipe.name.trim().split(/\s+/).length <= 3;
    if (isProdCategory || isSingleWordUpper) {
      return true;
    }
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
    await localDB.recipes.clear();
    if (result.cleanRecipes.length > 0) {
      await localDB.recipes.bulkPut(result.cleanRecipes);
    }
    if (result.extractedProducts.length > 0) {
      await localDB.products.bulkPut(result.extractedProducts);
    }
  } catch (e) {
    console.warn('Could not update Dexie localDB during separation:', e);
  }

  // 3. Update Firestore if accessible
  try {
    const misclassifiedRecipes = currentRecipes.filter(isRecipeRawProduct);
    for (const r of misclassifiedRecipes) {
      // Delete misclassified document from /recipes
      try {
        await deleteDoc(doc(db, 'recipes', r.id));
      } catch (err) {
        // Ignore permission or quota errors
      }
      // Save converted product to /products
      try {
        const prod = convertRecipeToProduct(r);
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      } catch (err) {
        // Ignore quota errors
      }
    }
  } catch (e) {
    console.warn('Firestore cloud cleanup warning:', e);
  }

  return {
    cleanRecipes: result.cleanRecipes,
    cleanProducts: result.extractedProducts,
    movedCount: result.movedCount
  };
};
