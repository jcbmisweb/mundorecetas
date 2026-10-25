
export const UNIT_FACTORS: Record<string, number> = {
  'kg': 1000,
  'g': 1,
  'mg': 0.001,
  'l': 1000,
  'ml': 1,
  'cl': 10,
  'dl': 100,
  'ud': 1,
  'unidad': 1,
  'unidades': 1,
  'docena': 12,
};

export const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim().replace(/\./g, '');
  if (u === 'kgs' || u === 'kilogramo' || u === 'kilogramos') return 'kg';
  if (u === 'gr' || u === 'grs' || u === 'gramo' || u === 'gramos') return 'g';
  if (u === 'litro' || u === 'litros') return 'l';
  if (u === 'mililitro' || u === 'mililitros') return 'ml';
  if (u === 'centilitro' || u === 'centilitros') return 'cl';
  if (u === 'decilitro' || u === 'decilitros') return 'dl';
  return u;
};

export const convertToBase = (quantity: number, unit: string): number => {
  const normalized = normalizeUnit(unit);
  const factor = UNIT_FACTORS[normalized] || 1;
  return quantity * factor;
};

export const LIQUID_KEYWORDS = [
  'leche', 'aceite', 'agua', 'vino', 'caldo', 'nata', 'zumo', 'vinagre', 
  'licor', 'salsa', 'cerveza', 'fondo', 'sirope', 'refresco', 'whisky', 
  'ron', 'brandy', 'coñac', 'cava', 'champagne', 'sidra', 'gaseosa', 
  'almíbar', 'jugo', 'bebida', 'licores', 'vodka', 'ginebra', 'vermut',
  'fumet', 'crema de leche', 'oporto', 'soja', 'mosto', 'néctar',
  'aove', 'aceites', 'caldos', 'coulis'
];

export const isLiquidIngredient = (name?: string): boolean => {
  if (!name) return false;
  const lower = name.toLowerCase();
  return LIQUID_KEYWORDS.some(kw => lower.includes(kw));
};

export const formatScaledQuantity = (
  num: number, 
  unit: string, 
  targetUnit?: string, 
  ingredientName?: string
): { quantity: string, unit: string } => {
  const normalized = normalizeUnit(unit);
  const normalizedTarget = targetUnit ? normalizeUnit(targetUnit) : '';
  const isLiquid = isLiquidIngredient(ingredientName);

  // Determine dimension: volume (l, ml, cl, dl), weight (kg, g, mg), count (ud, docena)
  const isInputVolume = (normalized === 'ml' || normalized === 'cl' || normalized === 'dl' || normalized === 'l');
  const isInputWeight = (normalized === 'g' || normalized === 'kg' || normalized === 'mg');
  const isTargetVolume = (normalizedTarget === 'ml' || normalizedTarget === 'cl' || normalizedTarget === 'dl' || normalizedTarget === 'l');
  const isTargetWeight = (normalizedTarget === 'g' || normalizedTarget === 'kg' || normalizedTarget === 'mg');

  // If the ingredient is recognized as a liquid (e.g. leche, aceite, vino, caldo),
  // its natural culinary order unit is volume (litros / ml), even if originally entered in kg or g.
  let effectiveDimension: 'volume' | 'weight' | 'other';
  if (isLiquid && (isInputVolume || isInputWeight || isTargetVolume || isTargetWeight)) {
    effectiveDimension = 'volume';
  } else if (isTargetVolume) {
    effectiveDimension = 'volume';
  } else if (isTargetWeight) {
    effectiveDimension = 'weight';
  } else if (isInputVolume) {
    effectiveDimension = 'volume';
  } else if (isInputWeight) {
    effectiveDimension = 'weight';
  } else {
    effectiveDimension = 'other';
  }

  let totalBase = convertToBase(num, unit);

  // If a liquid was entered in weight (e.g., kg or g), convert to volume (ml)
  // For standard liquids (milk, water, broth, wine, vinegar): 1 g ≈ 1 ml
  // For culinary oils: density is ~0.916 g/ml => 1000g of oil = 1092 ml of oil
  if (isLiquid && isInputWeight) {
    const isOil = ingredientName?.toLowerCase().includes('aceite');
    if (isOil) {
      // 1000 g / 0.916 ≈ 1092 ml
      totalBase = totalBase / 0.916;
    }
  }

  if (effectiveDimension === 'volume') {
    if (totalBase >= 1000) {
      const value = totalBase / 1000;
      return {
        quantity: value % 1 === 0 ? value.toString() : value.toFixed(2).replace('.', ','),
        unit: 'l'
      };
    } else {
      return {
        quantity: totalBase % 1 === 0 ? totalBase.toString() : totalBase.toFixed(1).replace('.', ','),
        unit: 'ml'
      };
    }
  }

  if (effectiveDimension === 'weight') {
    if (totalBase >= 1000) {
      const value = totalBase / 1000;
      return {
        quantity: value % 1 === 0 ? value.toString() : value.toFixed(2).replace('.', ','),
        unit: 'kg'
      };
    } else {
      return {
        quantity: totalBase % 1 === 0 ? totalBase.toString() : totalBase.toFixed(1).replace('.', ','),
        unit: 'g'
      };
    }
  }

  // Count / Units / Other
  const targetNorm = normalizedTarget || normalized;
  const factor = UNIT_FACTORS[targetNorm] || 1;
  const value = totalBase / factor;
  return {
    quantity: value % 1 === 0 ? value.toString() : value.toFixed(2).replace('.', ','),
    unit: targetUnit || unit || 'ud'
  };
};

/**
 * Formats a quantity that is already in base units (grams, milliliters, or units).
 * Automatically converts liquids (leche, aceite, caldos, vino, etc.) to volume (litros o ml)
 * with oil density correction (~0.916), and solids to weight (kg o g).
 */
export const formatBaseQuantity = (
  baseQty: number,
  unitHint?: string,
  ingredientName?: string
): { quantity: string; unit: string } => {
  const normHint = normalizeUnit(unitHint || '');
  const isLiquid = isLiquidIngredient(ingredientName);
  const isHintVolume = (normHint === 'l' || normHint === 'ml' || normHint === 'cl' || normHint === 'dl');
  const isHintWeight = (normHint === 'kg' || normHint === 'g' || normHint === 'mg');

  let effectiveDimension: 'volume' | 'weight' | 'other';
  if (isLiquid) {
    effectiveDimension = 'volume';
  } else if (isHintVolume) {
    effectiveDimension = 'volume';
  } else if (isHintWeight) {
    effectiveDimension = 'weight';
  } else if (normHint === 'ud' || normHint === 'unidad' || normHint === 'unidades' || normHint === 'docena') {
    effectiveDimension = 'other';
  } else {
    effectiveDimension = 'weight';
  }

  let totalBase = baseQty;
  if (isLiquid && (isHintWeight || !isHintVolume)) {
    const isOil = ingredientName?.toLowerCase().includes('aceite');
    if (isOil) {
      totalBase = totalBase / 0.916;
    }
  }

  if (effectiveDimension === 'volume') {
    if (totalBase >= 1000) {
      const val = totalBase / 1000;
      return {
        quantity: val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.', ','),
        unit: 'l'
      };
    } else {
      return {
        quantity: totalBase % 1 === 0 ? totalBase.toString() : totalBase.toFixed(1).replace('.', ','),
        unit: 'ml'
      };
    }
  }

  if (effectiveDimension === 'weight') {
    if (totalBase >= 1000) {
      const val = totalBase / 1000;
      return {
        quantity: val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.', ','),
        unit: 'kg'
      };
    } else {
      return {
        quantity: totalBase % 1 === 0 ? totalBase.toString() : totalBase.toFixed(1).replace('.', ','),
        unit: 'g'
      };
    }
  }

  // Count / other
  return {
    quantity: totalBase % 1 === 0 ? totalBase.toString() : totalBase.toFixed(2).replace('.', ','),
    unit: unitHint || 'ud'
  };
};

