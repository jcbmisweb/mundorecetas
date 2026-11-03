import { Product, Ingredient, SubRecipe, Recipe, Allergen } from '../types';
import { calculateIngredientCost } from './costUtils';

/**
 * Normaliza una cadena de texto para comparaciones culinarias:
 * quita tildes, signos de puntuación y pasa a mayúsculas.
 */
export const normalizeText = (text: string): string => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const STOP_WORDS = new Set([
  'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'EN', 'PARA', 'POR', 
  'Y', 'O', 'SIN', 'TIPO', 'AL', 'A', 'UN', 'UNA', 'UNOS', 'UNAS'
]);

/**
 * Busca productos existentes en el catálogo que sean similares a un nombre dado.
 * Maneja pequeñas variaciones de una palabra, orden de palabras, faltas o sinónimos.
 */
export const findSimilarProducts = (queryName: string, products: Product[], maxResults = 5): Product[] => {
  if (!queryName || !queryName.trim()) return [];

  const cleanQuery = normalizeText(queryName);
  if (cleanQuery.length < 2) return [];

  const queryWords = cleanQuery.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    const cleanProd = normalizeText(product.name);
    if (!cleanProd) continue;

    // Si es idéntico, no es un "similar", es exacto
    if (cleanProd === cleanQuery) continue;

    let score = 0;

    // 1. Subcadena directa (ej: "ACEITE DE OLIVA" dentro de "ACEITE DE OLIVA VIRGEN")
    if (cleanProd.includes(cleanQuery) || cleanQuery.includes(cleanProd)) {
      score += 70;
    }

    // 2. Coincidencia por palabras clave significativas
    const prodWords = cleanProd.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (queryWords.length > 0 && prodWords.length > 0) {
      let matchedWords = 0;
      for (const qw of queryWords) {
        if (prodWords.some(pw => pw === qw || pw.startsWith(qw) || qw.startsWith(pw))) {
          matchedWords++;
        }
      }

      if (matchedWords > 0) {
        const overlapRatio = matchedWords / Math.max(queryWords.length, prodWords.length);
        score += Math.round(overlapRatio * 60);
      }
    }

    if (score >= 30) {
      scored.push({ product, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.product);
};

/**
 * Extrae la nota culinaria diferencial entre el nombre original del ingrediente
 * y el producto homologado en el catálogo.
 * Ejemplo:
 *   originalName: "(AOVE) ARBEQUINA O PICUAL SUAVE (RESTANTE)"
 *   canonicalName: "ACEITE DE OLIVA VIRGEN EXTRA"
 *   Retorna: "Arbequina o Picual suave (Restante)"
 */
export const extractDifferenceNote = (originalName: string, canonicalName: string): string => {
  if (!originalName || !canonicalName) return '';
  const cleanOrig = originalName.trim();
  const cleanCanon = canonicalName.trim();

  if (cleanOrig.toUpperCase() === cleanCanon.toUpperCase()) return '';

  // Remove common acronyms like (AOVE), (aove), etc.
  let diff = cleanOrig;
  
  // Strip the canonical name words if they appear directly
  const canonTokens = cleanCanon.split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t.toUpperCase()));
  for (const token of canonTokens) {
    const reg = new RegExp(`\\b${token}\\b`, 'gi');
    diff = diff.replace(reg, '');
  }

  // Also remove common abbreviations like (AOVE), AOVE
  diff = diff.replace(/\(?\bAOVE\b\)?/gi, '');
  diff = diff.replace(/\s+/g, ' ').replace(/^[\s,;:\-\(\)]+|[\s,;:\-\(\)]+$/g, '').trim();

  // If the extracted difference is too short or empty, return the clean original name
  if (diff.length >= 2) {
    // Capitalize first letter
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  }
  return cleanOrig;
};

/**
 * Busca un producto en el catálogo que coincida exactamente o por alta similitud
 * con el nombre de un ingrediente (ignorando mayúsculas, tildes, plurales y puntuación).
 */
export const matchProductInCatalog = (queryName: string, products: Product[]): Product | undefined => {
  if (!queryName || !queryName.trim() || !products || products.length === 0) return undefined;

  const cleanQuery = normalizeText(queryName);
  if (!cleanQuery) return undefined;

  // 1. Coincidencia exacta directa (ignorando mayúsculas/espacios/tildes)
  const exact = products.find(p => normalizeText(p.name) === cleanQuery);
  if (exact) return exact;

  // 2. Coincidencia por singular/plural en español (ej: HUEVOS -> HUEVO, MANTEQUILLAS -> MANTEQUILLA)
  const stripPlural = (s: string) => {
    if (s.length > 4 && s.endsWith('ES')) return s.slice(0, -2);
    if (s.length > 3 && s.endsWith('S')) return s.slice(0, -1);
    return s;
  };
  const singularQuery = stripPlural(cleanQuery);
  const pluralMatch = products.find(p => {
    const cleanP = normalizeText(p.name);
    return stripPlural(cleanP) === singularQuery;
  });
  if (pluralMatch) return pluralMatch;

  // 3. Coincidencia si el producto tiene nombre compuesto y coincide exactamente quitando prefijo o sufijo trivial
  const cleanTokens = cleanQuery.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w)).join(' ');
  if (cleanTokens.length > 3) {
    const tokenMatch = products.find(p => {
      const pTokens = normalizeText(p.name).split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w)).join(' ');
      return pTokens === cleanTokens;
    });
    if (tokenMatch) return tokenMatch;
  }

  return undefined;
};

/**
 * Reconcilia un ingrediente con su ficha de producto en el catálogo:
 * Asegura que los alérgenos declarados en el producto del catálogo se incorporen
 * automáticamente al ingrediente, además de su precio, unidad base y categoría si procede.
 */
export const reconcileIngredientWithCatalog = (ing: Ingredient, products: Product[]): Ingredient => {
  if (!ing || !ing.name || !products || products.length === 0) return ing;
  
  // Si está marcado como elaboración interna o no-producto, no forzamos producto
  if (ing.isInternalPrep || ing.isNonProduct) return ing;

  const matched = matchProductInCatalog(ing.name, products);
  if (!matched) return ing;

  // Fusionar alérgenos: garantizar que todos los alérgenos del catálogo estén presentes
  const currentAllergens = Array.isArray(ing.allergens) ? [...ing.allergens] : [];
  const productAllergens = Array.isArray(matched.allergens) ? matched.allergens : [];
  
  const mergedAllergens = Array.from(new Set([...currentAllergens, ...productAllergens])) as Allergen[];

  const baseUnit = ing.baseUnit || matched.unit;
  const unit = ing.unit || matched.unit || 'kg';
  const pricePerUnit = (ing.pricePerUnit !== undefined && ing.pricePerUnit > 0) ? ing.pricePerUnit : (matched.pricePerUnit || 0);
  const weightPerUnit = ing.weightPerUnit || matched.weightPerUnit;
  const category = ing.category || matched.category;
  const cost = calculateIngredientCost(ing.quantity, unit, pricePerUnit, baseUnit, weightPerUnit);

  return {
    ...ing,
    allergens: mergedAllergens,
    pricePerUnit,
    baseUnit,
    unit,
    weightPerUnit,
    category,
    cost: cost || ing.cost || 0
  };
};

/**
 * Reconcilia todas las elaboraciones e ingredientes de una receta con el catálogo.
 */
export const reconcileRecipeWithCatalog = (recipe: Recipe, products: Product[]): Recipe => {
  if (!recipe || !recipe.subRecipes || !products || products.length === 0) return recipe;

  let totalCost = 0;
  const updatedSubRecipes = recipe.subRecipes.map(sub => {
    const updatedIngs = (sub.ingredients || []).map(ing => {
      const reconciled = reconcileIngredientWithCatalog(ing, products);
      if (reconciled.cost) totalCost += reconciled.cost;
      return reconciled;
    });
    return {
      ...sub,
      ingredients: updatedIngs
    };
  });

  // Recolectar todos los alérgenos consolidados
  const allAllergensSet = new Set<Allergen>();
  updatedSubRecipes.forEach(s => {
    s.ingredients?.forEach(i => {
      i.allergens?.forEach(a => allAllergensSet.add(a));
    });
  });
  recipe.extraAllergens?.forEach(a => allAllergensSet.add(a));
  const consolidatedAllergens = Array.from(allAllergensSet);

  return {
    ...recipe,
    subRecipes: updatedSubRecipes,
    totalCost: totalCost > 0 ? totalCost : recipe.totalCost,
    extraAllergens: consolidatedAllergens,
    minimalistCard: {
      ...(recipe.minimalistCard || {}),
      allergens: consolidatedAllergens
    }
  };
};

