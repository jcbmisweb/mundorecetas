import { Recipe, Product, Allergen } from '../types';

/**
 * Robust RFC 4180-compliant CSV parser.
 * Handles embedded quotes (""), commas within quotes, and multi-line fields (such as sub_recipes JSON with newlines).
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses recipes from the Supabase / PostgreSQL CSV export.
 * Expected columns:
 * 0: id
 * 1: workspace_id
 * 2: user_id
 * 3: name
 * 4: category
 * 5: categories
 * 6: photo
 * 7: photo_layout
 * 8: creator
 * 9: creator_logo
 * 10: is_public
 * 11: original_author
 * 12: source_url
 * 13: videos
 * 14: video_url
 * 15: yield_quantity
 * 16: yield_unit
 * 17: sub_recipes
 * 18: plating_instructions
 * 19: service_details
 * 20: extra_allergens
 * 21: minimalist_card
 * 22: take_away_details
 * 23: total_cost
 * 24: last_modified
 * 25: created_at
 */
export function parseRecipesFromCSV(
  text: string, 
  currentWorkspaceId: string, 
  defaultAuthor = 'JUAN CODINA BARRANCO'
): Recipe[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  // Defensive check: If headers indicate a Product CSV, do not parse as recipes!
  const isProductCSV = headers.includes('price_per_unit') || 
                       headers.includes('weight_per_unit') || 
                       (headers.includes('unit') && !headers.includes('sub_recipes') && !headers.includes('yield_quantity'));
  if (isProductCSV) {
    console.warn("parseRecipesFromCSV received a product CSV file. Skipping recipe creation.");
    return [];
  }
  
  // Detect column indices based on header names or fall back to known standard layout
  const colIdx = {
    id: headers.indexOf('id'),
    name: headers.indexOf('name'),
    category: headers.indexOf('category'),
    categories: headers.indexOf('categories'),
    photo: headers.indexOf('photo'),
    creator: headers.indexOf('creator'),
    is_public: headers.indexOf('is_public'),
    yield_quantity: headers.indexOf('yield_quantity'),
    yield_unit: headers.indexOf('yield_unit'),
    sub_recipes: headers.indexOf('sub_recipes'),
    plating_instructions: headers.indexOf('plating_instructions'),
    service_details: headers.indexOf('service_details'),
    extra_allergens: headers.indexOf('extra_allergens'),
    minimalist_card: headers.indexOf('minimalist_card'),
    take_away_details: headers.indexOf('take_away_details'),
    recipe_type: headers.indexOf('recipe_type'),
    total_cost: headers.indexOf('total_cost'),
    last_modified: headers.indexOf('last_modified')
  };

  // Fallbacks ONLY if headers look like a recipe file
  if (headers.includes('sub_recipes') || headers.includes('yield_quantity')) {
    if (colIdx.name === -1) colIdx.name = 3;
    if (colIdx.id === -1) colIdx.id = 0;
    if (colIdx.category === -1) colIdx.category = 4;
    if (colIdx.categories === -1) colIdx.categories = 5;
    if (colIdx.photo === -1) colIdx.photo = 6;
    if (colIdx.creator === -1) colIdx.creator = 8;
    if (colIdx.is_public === -1) colIdx.is_public = 10;
    if (colIdx.yield_quantity === -1) colIdx.yield_quantity = 15;
    if (colIdx.yield_unit === -1) colIdx.yield_unit = 16;
    if (colIdx.sub_recipes === -1) colIdx.sub_recipes = 17;
    if (colIdx.plating_instructions === -1) colIdx.plating_instructions = 18;
    if (colIdx.service_details === -1) colIdx.service_details = 19;
    if (colIdx.extra_allergens === -1) colIdx.extra_allergens = 20;
    if (colIdx.minimalist_card === -1) colIdx.minimalist_card = 21;
    if (colIdx.take_away_details === -1) colIdx.take_away_details = 22;
    if (colIdx.total_cost === -1) colIdx.total_cost = 23;
    if (colIdx.last_modified === -1) colIdx.last_modified = 24;
  } else if (colIdx.name === -1 || colIdx.id === -1) {
    // Cannot determine valid recipe columns
    return [];
  }

  const recipes: Recipe[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const rowId = row[colIdx.id]?.trim() || '';
    if (rowId.startsWith('p_') || rowId.startsWith('prod_')) {
      // Skip product IDs from being imported as recipes
      continue;
    }

    const rawName = row[colIdx.name]?.trim();
    if (!rawName) continue;

    // Sub-recipes parsing
    let subRecipes: any[] = [];
    const subRecipesRaw = row[colIdx.sub_recipes];
    if (subRecipesRaw) {
      try {
        const parsed = JSON.parse(subRecipesRaw);
        if (Array.isArray(parsed)) {
          subRecipes = parsed.map((sub: any) => ({
            ...sub,
            ingredients: Array.isArray(sub.ingredients) ? sub.ingredients.map((ing: any) => ({
              ...ing,
              allergens: Array.isArray(ing.allergens) ? ing.allergens : []
            })) : []
          }));
        }
      } catch (e) {
        console.warn(`Could not parse subRecipes JSON for row ${i}:`, e);
      }
    }

    // Categories parsing
    let categories: string[] = [];
    const catRaw = row[colIdx.categories];
    if (catRaw) {
      try {
        const parsed = JSON.parse(catRaw);
        if (Array.isArray(parsed)) categories = parsed;
      } catch {
        categories = [catRaw.replace(/^[\[\"]+|[\]\"]+$/g, '').trim()];
      }
    }
    const category = row[colIdx.category]?.trim() || categories[0] || 'Otros';
    if (categories.length === 0) categories = [category];

    // Service details parsing
    let serviceDetails: any = {};
    const serviceRaw = row[colIdx.service_details];
    if (serviceRaw) {
      try {
        const parsed = JSON.parse(serviceRaw);
        if (typeof parsed === 'object') serviceDetails = parsed;
      } catch {}
    }

    // Extra allergens parsing
    let extraAllergens: Allergen[] = [];
    const extraRaw = row[colIdx.extra_allergens];
    if (extraRaw) {
      try {
        const parsed = JSON.parse(extraRaw);
        if (Array.isArray(parsed)) extraAllergens = parsed;
      } catch {
        extraAllergens = extraRaw.split(';').map(a => a.trim()).filter(Boolean) as Allergen[];
      }
    }

    // Minimalist card parsing
    let minimalistCard: any = undefined;
    const miniRaw = row[colIdx.minimalist_card];
    if (miniRaw) {
      try {
        const parsed = JSON.parse(miniRaw);
        if (typeof parsed === 'object') minimalistCard = parsed;
      } catch {}
    }

    // Take away details parsing
    let takeAwayDetails: any = undefined;
    const takeAwayRaw = row[colIdx.take_away_details];
    if (takeAwayRaw) {
      try {
        const parsed = JSON.parse(takeAwayRaw);
        if (typeof parsed === 'object') takeAwayDetails = parsed;
      } catch {}
    }

    // Recipe type resolution and auto-detection
    let recipeType: 'normal' | 'takeaway' | 'eventos' | 'pastry' = 'normal';
    const typeRaw = colIdx.recipe_type !== -1 ? row[colIdx.recipe_type]?.trim().toLowerCase() : '';
    if (typeRaw && ['normal', 'takeaway', 'eventos', 'pastry'].includes(typeRaw)) {
      recipeType = typeRaw as any;
    } else if (takeAwayDetails?.recipeType) {
      recipeType = takeAwayDetails.recipeType;
    } else if (takeAwayDetails?.isTakeAway) {
      recipeType = 'takeaway';
    } else {
      const fullText = (rawName + ' ' + category + ' ' + categories.join(' ')).toLowerCase();
      if (fullText.includes('pasteler') || fullText.includes('postre') || fullText.includes('dulce') || fullText.includes('tarta') || fullText.includes('boller') || fullText.includes('reposter') || fullText.includes('panader')) {
        recipeType = 'pastry';
      } else if (fullText.includes('evento') || fullText.includes('catering') || fullText.includes('banquet') || fullText.includes('buffet')) {
        recipeType = 'eventos';
      } else if (fullText.includes('takeaway') || fullText.includes('take away') || fullText.includes('llevar') || fullText.includes('delivery')) {
        recipeType = 'takeaway';
      }
    }

    const yieldQty = parseFloat(row[colIdx.yield_quantity]) || 4;
    const yieldUnit = (row[colIdx.yield_unit]?.trim() || 'pax').slice(0, 30); // Prevent base64 spill
    const photo = row[colIdx.photo]?.trim() || '';

    // If sub-recipes are empty, create default elaboration so recipe displays nicely
    if (subRecipes.length === 0) {
      subRecipes = [{
        id: `sub_${Date.now()}_1`,
        name: 'Elaboración Principal',
        ingredients: [],
        instructions: '',
        photos: photo ? [photo] : [],
        videos: []
      }];
    }

    const id = row[colIdx.id]?.trim() || `rec_${Date.now()}_${i}`;
    const creator = row[colIdx.creator]?.trim() || defaultAuthor;
    const isPublic = row[colIdx.is_public]?.toLowerCase() === 'true' || row[colIdx.is_public] === 't';
    const totalCost = parseFloat(row[colIdx.total_cost]) || 0;

    let lastModified = Date.now();
    const lastModRaw = row[colIdx.last_modified];
    if (lastModRaw) {
      const parsedTime = new Date(lastModRaw).getTime();
      if (!isNaN(parsedTime)) lastModified = parsedTime;
    }

    recipes.push({
      id,
      workspaceId: currentWorkspaceId,
      name: rawName,
      category,
      categories,
      photo,
      creator,
      isPublic,
      yieldQuantity: yieldQty,
      yieldUnit,
      subRecipes,
      platingInstructions: row[colIdx.plating_instructions]?.trim() || '',
      serviceDetails,
      extraAllergens,
      minimalistCard,
      takeAwayDetails,
      recipeType,
      totalCost,
      lastModified,
      synced: false
    });
  }

  return recipes;
}

/**
 * Parses products catalog from CSV.
 * Expected columns:
 * 0: id
 * 1: name
 * 2: category
 * 3: unit
 * 4: price_per_unit
 * 5: weight_per_unit
 * 6: allergens
 * 7: status
 */
export function parseProductsFromCSV(text: string): Product[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const colIdx = {
    id: headers.indexOf('id'),
    name: headers.indexOf('name'),
    category: headers.indexOf('category'),
    unit: headers.indexOf('unit'),
    price_per_unit: headers.indexOf('price_per_unit'),
    weight_per_unit: headers.indexOf('weight_per_unit'),
    allergens: headers.indexOf('allergens'),
    status: headers.indexOf('status')
  };

  if (colIdx.id === -1) colIdx.id = 0;
  if (colIdx.name === -1) colIdx.name = 1;
  if (colIdx.category === -1) colIdx.category = 2;
  if (colIdx.unit === -1) colIdx.unit = 3;
  if (colIdx.price_per_unit === -1) colIdx.price_per_unit = 4;
  if (colIdx.weight_per_unit === -1) colIdx.weight_per_unit = 5;
  if (colIdx.allergens === -1) colIdx.allergens = 6;
  if (colIdx.status === -1) colIdx.status = 7;

  const products: Product[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const rawName = row[colIdx.name]?.trim();
    if (!rawName) continue;

    let allergens: Allergen[] = [];
    const allergRaw = row[colIdx.allergens];
    if (allergRaw) {
      try {
        const parsed = JSON.parse(allergRaw);
        if (Array.isArray(parsed)) {
          allergens = parsed.filter(a => typeof a === 'string') as Allergen[];
        }
      } catch {
        allergens = allergRaw.split(';').map(a => a.trim()).filter(Boolean) as Allergen[];
      }
    }

    const price = parseFloat(row[colIdx.price_per_unit]) || 0;
    const weight = row[colIdx.weight_per_unit] ? parseFloat(row[colIdx.weight_per_unit]) : undefined;
    const rawStatus = row[colIdx.status]?.trim();
    const status: 'approved' | 'pending' = rawStatus === 'pending' ? 'pending' : 'approved';

    products.push({
      id: row[colIdx.id]?.trim() || `prod_${Date.now()}_${i}`,
      name: rawName,
      category: row[colIdx.category]?.trim() || 'ALMACÉN',
      unit: row[colIdx.unit]?.trim() || 'kg',
      pricePerUnit: price,
      weightPerUnit: isNaN(weight as number) ? undefined : weight,
      allergens,
      status,
      synced: false
    });
  }

  return products;
}
