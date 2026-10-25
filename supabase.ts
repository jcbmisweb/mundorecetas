import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { Recipe, ProRecipe, Product, MenuPlan, AppSettings, AppUser, WorkspaceInvite, DEFAULT_CATEGORIES, isUserAdmin } from './types';

// Project URL y API Key del proyecto 'recetario-jcb' (Project ID: rzmehjqihufygpsqroqe)
export const DEFAULT_SUPABASE_URL = 'https://rzmehjqihufygpsqroqe.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_QPad3QVRLe6YEdY3mrH_FQ_DtTwrxyc';

// Leer credenciales de Vite env o de localStorage (para configuración rápida en UI)
const getEnvConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_custom_url') || '' : '';
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_custom_anon_key') || '' : '';

  const url = (localUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (localKey || envKey || DEFAULT_SUPABASE_KEY).trim();

  return { url, anonKey };
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseCredentials() {
  return getEnvConfig();
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof localStorage !== 'undefined') {
    if (url) localStorage.setItem('supabase_custom_url', url.trim());
    else localStorage.removeItem('supabase_custom_url');

    if (anonKey) localStorage.setItem('supabase_custom_anon_key', anonKey.trim());
    else localStorage.removeItem('supabase_custom_anon_key');
  }
  // Reset cache
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getEnvConfig();
  return !!(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getEnvConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error("Error creating Supabase client:", err);
    return null;
  }
}

// Cliente global exportado (puede ser null si aún no se han configurado credenciales)
export const supabase = getSupabaseClient();

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN SUPABASE
// ============================================================================

export async function loginWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase no está configurado. Introduce tu URL y Anon Key.");
  }
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase no está configurado.");
  const res = await client.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return { data: res.data, error: res.error };
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase no está configurado.");
  const res = await client.auth.signUp({ email, password });
  if (res.error) throw res.error;
  return { data: res.data, error: res.error };
}

export async function logout() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut().catch(console.error);
  }
  // Clear any local simulation user
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('supabase_demo_user');
  }
}

// Modo demostración para que el usuario pueda usar la app al instante si aún no ha creado el proyecto en Supabase
export function loginDemoUser(email = 'jcbmisweb@gmail.com', name = 'Juan Codina'): AppUser {
  const demoUser: AppUser = {
    uid: 'admin_jcbmisweb',
    email,
    displayName: name,
    teacherName: name,
    teacherLogo: 'https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e',
    instituteName: 'IES La Flota',
    instituteLogo: '',
    isApproved: true,
    role: 'admin',
    createdAt: Date.now(),
    workspaceId: 'admin_jcbmisweb'
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('supabase_demo_user', JSON.stringify(demoUser));
  }
  return demoUser;
}

export function getDemoUser(): AppUser | null {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('supabase_demo_user');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  return null;
}

export function saveActiveUser(user: AppUser | null) {
  if (typeof localStorage !== 'undefined') {
    if (user) {
      localStorage.setItem('supabase_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('supabase_active_user');
      localStorage.removeItem('supabase_demo_user');
    }
  }
}

export function getActiveUser(): AppUser | null {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('supabase_active_user') || localStorage.getItem('supabase_demo_user');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  return null;
}

// Iniciar sesión directamente con correo (crea o recupera el usuario en Supabase)
export async function loginWithCustomEmail(email: string, displayName?: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();
  const isAdmin = isUserAdmin({ email: cleanEmail });
  const uid = 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const name = displayName?.trim() || cleanEmail.split('@')[0];

  let appUser: AppUser = {
    uid,
    email: cleanEmail,
    displayName: name,
    teacherName: name,
    teacherLogo: isAdmin ? 'https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e' : '',
    instituteName: 'IES La Flota',
    instituteLogo: '',
    isApproved: isAdmin, // Admins auto-aprobados, alumnos/usuarios según configuración
    role: isAdmin ? 'admin' : 'user',
    createdAt: Date.now(),
    workspaceId: uid
  };

  if (client) {
    try {
      const { data: existing } = await client
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        appUser = rowToUser(existing);
        if (isAdmin && (!appUser.isApproved || appUser.role !== 'admin')) {
          appUser.isApproved = true;
          appUser.role = 'admin';
          await client.from('users').update(userToRow(appUser)).eq('id', existing.id);
        }
      } else {
        await client.from('users').upsert(userToRow(appUser));
      }
    } catch (err) {
      console.warn("Error syncing user with Supabase table:", err);
    }
  }

  saveActiveUser(appUser);
  return appUser;
}

// ============================================================================
// VERIFICACIÓN DE CONEXIÓN Y DIAGNÓSTICO
// ============================================================================

export async function testSupabaseConnection(): Promise<{ 
  ok: boolean; 
  latency: number; 
  error?: string;
  details?: {
    recipes: boolean;
    products: boolean;
    settings: boolean;
  };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, latency: 0, error: 'Credenciales de Supabase no configuradas.' };
  }

  const start = Date.now();
  try {
    // Verificar en paralelo las tablas principales (recipes, products, settings)
    const [recCheck, prodCheck, settCheck] = await Promise.all([
      client.from('recipes').select('id').limit(1),
      client.from('products').select('id').limit(1),
      client.from('settings').select('id').limit(1)
    ]);

    const latency = Date.now() - start;
    const details = {
      recipes: !recCheck.error,
      products: !prodCheck.error,
      settings: !settCheck.error
    };

    if (recCheck.error && recCheck.error.code !== 'PGRST116') {
      return { ok: false, latency, error: `Error en tabla recipes: ${recCheck.error.message}`, details };
    }
    if (prodCheck.error && prodCheck.error.code !== 'PGRST116') {
      return { ok: false, latency, error: `Error en tabla products: ${prodCheck.error.message}`, details };
    }

    return { ok: true, latency, details };
  } catch (err: any) {
    return { ok: false, latency: Date.now() - start, error: err?.message || 'Error de red o CORS' };
  }
}

// ============================================================================
// ADAPTADORES / TRANSFORMADORES DE MODELOS (JavaScript <-> Postgres)
// ============================================================================

export function recipeToRow(r: Recipe) {
  const currentType: 'normal' | 'takeaway' | 'eventos' | 'pastry' = 
    r.recipeType || 
    (r as any).take_away_details?.recipeType || 
    r.takeAwayDetails?.recipeType || 
    (r.takeAwayDetails?.isTakeAway ? 'takeaway' : 'normal');

  const safeTakeAwayDetails = {
    ...(r.takeAwayDetails || {}),
    isTakeAway: currentType === 'takeaway',
    recipeType: currentType,
    pastryInfographic: r.pastryInfographic || (r as any).take_away_details?.pastryInfographic || ''
  };

  return {
    id: r.id,
    workspace_id: r.workspaceId || 'default',
    name: r.name,
    category: r.category || 'Otros',
    categories: r.categories || [],
    photo: r.photo || '',
    photo_layout: r.photoLayout || 'classic',
    creator: r.creator || '',
    creator_logo: r.creatorLogo || '',
    is_public: !!r.isPublic,
    original_author: r.originalAuthor || '',
    source_url: r.sourceUrl || '',
    videos: r.videos || [],
    video_url: r.videoUrl || '',
    yield_quantity: r.yieldQuantity ?? 4,
    yield_unit: r.yieldUnit || 'pax',
    sub_recipes: r.subRecipes || [],
    plating_instructions: r.platingInstructions || '',
    service_details: r.serviceDetails || {},
    extra_allergens: r.extraAllergens || [],
    minimalist_card: r.minimalistCard || {},
    take_away_details: safeTakeAwayDetails,
    total_cost: r.totalCost ?? 0,
    last_modified: r.lastModified || Date.now()
  };
}

export function rowToRecipe(row: any): Recipe {
  const takeAway = row.take_away_details || row.takeAwayDetails || {};
  const inferredType: 'normal' | 'takeaway' | 'eventos' | 'pastry' = 
    takeAway.recipeType || 
    row.recipe_type || 
    row.recipeType || 
    (takeAway.isTakeAway ? 'takeaway' : 'normal');

  const pastryInfog = takeAway.pastryInfographic || row.pastry_infographic || '';

  return {
    id: row.id,
    workspaceId: row.workspace_id || row.workspaceId || '',
    name: row.name,
    category: row.category || 'Otros',
    categories: Array.isArray(row.categories) ? row.categories : (row.category ? [row.category] : ['Otros']),
    photo: row.photo || '',
    photoLayout: row.photo_layout || row.photoLayout || 'classic',
    creator: row.creator || '',
    creatorLogo: row.creator_logo || row.creatorLogo || '',
    isPublic: !!(row.is_public ?? row.isPublic),
    originalAuthor: row.original_author || row.originalAuthor || '',
    sourceUrl: row.source_url || row.sourceUrl || '',
    videos: Array.isArray(row.videos) ? row.videos : [],
    videoUrl: row.video_url || row.videoUrl || '',
    yieldQuantity: Number(row.yield_quantity ?? row.yieldQuantity ?? 4),
    yieldUnit: row.yield_unit || row.yieldUnit || 'pax',
    subRecipes: Array.isArray(row.sub_recipes) ? row.sub_recipes : (row.subRecipes || []),
    platingInstructions: row.plating_instructions || row.platingInstructions || '',
    serviceDetails: row.service_details || row.serviceDetails || {},
    extraAllergens: Array.isArray(row.extra_allergens) ? row.extra_allergens : (row.extraAllergens || []),
    minimalistCard: row.minimalist_card || row.minimalistCard || {},
    takeAwayDetails: {
      ...takeAway,
      isTakeAway: inferredType === 'takeaway',
      recipeType: inferredType,
      pastryInfographic: pastryInfog
    },
    recipeType: inferredType,
    pastryInfographic: pastryInfog,
    totalCost: Number(row.total_cost ?? row.totalCost ?? 0),
    lastModified: Number(row.last_modified ?? row.lastModified ?? Date.now())
  };
}

export function proRecipeToRow(p: ProRecipe) {
  return {
    id: p.id,
    workspace_id: p.workspaceId || 'default',
    code: p.code || '',
    version: p.version || '1.0',
    status: p.status || 'development',
    responsible: p.responsible || '',
    name: p.name,
    technical_name: p.technicalName || '',
    category: p.category || '',
    target_pax: p.targetPax || 4,
    concept: p.concept || '',
    star_product: p.starProduct || '',
    storytelling: p.storytelling || '',
    hero_photo: p.heroPhoto || '',
    sketch_photo: p.sketchPhoto || '',
    sensory_profile: p.sensoryProfile || {},
    components: p.components || [],
    plating: p.plating || {},
    quality_control: p.qualityControl || {},
    traceability: p.traceability || {},
    last_modified: p.lastModified || Date.now(),
    created_at: p.createdAt || Date.now()
  };
}

export function rowToProRecipe(row: any): ProRecipe {
  return {
    id: row.id,
    code: row.code || 'FT-PRO-001',
    version: row.version || '1.0',
    status: row.status || 'development',
    responsible: row.responsible || '',
    workspaceId: row.workspace_id || row.workspaceId || '',
    createdAt: Number(row.created_at ?? row.createdAt ?? Date.now()),
    lastModified: Number(row.last_modified ?? row.lastModified ?? Date.now()),
    name: row.name,
    technicalName: row.technical_name || row.technicalName || '',
    category: row.category || 'Alta Gastronomía',
    targetPax: Number(row.target_pax ?? row.targetPax ?? 4),
    concept: row.concept || '',
    starProduct: row.star_product || row.starProduct || '',
    storytelling: row.storytelling || '',
    heroPhoto: row.hero_photo || row.heroPhoto || '',
    sketchPhoto: row.sketch_photo || row.sketchPhoto || '',
    sensoryProfile: row.sensory_profile || row.sensoryProfile || {
      visual: '', aroma: '', texture: '', flavor: '', aftertaste: '',
      radar: { complexity: 3, acidity: 3, sweetness: 3, bitterness: 3, salinity: 3, umami: 3, fatBalance: 3, crunchiness: 3 }
    },
    components: Array.isArray(row.components) ? row.components : [],
    plating: row.plating || {
      componentsGrammage: [], mountingSequence: [], tableware: '', passTemperature: '', maxPassWindowSeconds: 60, serviceCutlery: '', serviceNotes: ''
    },
    qualityControl: row.quality_control || row.qualityControl || {
      physicochemical: {}, acceptanceCriteria: [], rejectionCriteria: [], tastingHistory: []
    },
    traceability: row.traceability || row.traceability || {
      approvedShelfLife: '', validatedStorage: '', versionHistory: []
    }
  };
}

export function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category || '',
    unit: p.unit || 'g',
    price_per_unit: p.pricePerUnit ?? 0,
    weight_per_unit: p.weightPerUnit ?? null,
    allergens: p.allergens || [],
    status: p.status || 'approved',
    requested_by: p.requestedBy || null
  };
}

export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit || 'g',
    pricePerUnit: Number(row.price_per_unit ?? row.pricePerUnit ?? 0),
    weightPerUnit: row.weight_per_unit ?? row.weightPerUnit,
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    status: row.status || 'approved',
    requestedBy: row.requested_by || row.requestedBy
  };
}

export function menuPlanToRow(m: MenuPlan) {
  return {
    id: m.id,
    workspace_id: m.workspaceId,
    title: m.title,
    date: m.date,
    pax: m.pax,
    recipe_ids: m.recipeIds || [],
    recipe_roles: m.recipeRoles || {},
    dish_extra_ingredients: m.dishExtraIngredients || {},
    dish_approvals: m.dishApprovals || {},
    work_schedule: m.workSchedule || [],
    group_count: m.groupCount || 4,
    dish_group_assignments: m.dishGroupAssignments || {},
    group_notes: m.groupNotes || {},
    work_order_advance_notes: m.workOrderAdvanceNotes || {},
    custom_menu_roles: m.customMenuRoles || [],
    dish_ingredient_overrides: m.dishIngredientOverrides || {},
    kitchen_checklist: m.kitchenChecklist || {},
    service_details_overrides: m.serviceDetailsOverrides || {},
    last_modified: m.lastModified || Date.now()
  };
}

export function rowToMenuPlan(row: any): MenuPlan {
  return {
    id: row.id,
    workspaceId: row.workspace_id || row.workspaceId,
    title: row.title,
    date: row.date,
    pax: Number(row.pax ?? 20),
    recipeIds: Array.isArray(row.recipe_ids) ? row.recipe_ids : (row.recipeIds || []),
    recipeRoles: row.recipe_roles || row.recipeRoles || {},
    dishExtraIngredients: row.dish_extra_ingredients || row.dishExtraIngredients || {},
    dishApprovals: row.dish_approvals || row.dishApprovals || {},
    workSchedule: Array.isArray(row.work_schedule) ? row.work_schedule : (row.workSchedule || []),
    groupCount: Number(row.group_count ?? row.groupCount ?? 4),
    dishGroupAssignments: row.dish_group_assignments || row.dishGroupAssignments || {},
    groupNotes: row.group_notes || row.groupNotes || {},
    workOrderAdvanceNotes: row.work_order_advance_notes || row.workOrderAdvanceNotes || {},
    customMenuRoles: Array.isArray(row.custom_menu_roles) ? row.custom_menu_roles : (row.customMenuRoles || []),
    dishIngredientOverrides: row.dish_ingredient_overrides || row.dishIngredientOverrides || {},
    kitchenChecklist: row.kitchen_checklist || row.kitchenChecklist || {},
    serviceDetailsOverrides: row.service_details_overrides || row.serviceDetailsOverrides || {},
    lastModified: Number(row.last_modified ?? row.lastModified ?? Date.now())
  };
}

export function settingsToRow(s: AppSettings) {
  return {
    id: 'global',
    institute_name: s.instituteName,
    institute_logo: s.instituteLogo || '',
    teacher_name: s.teacherName || '',
    teacher_logo: s.teacherLogo || '',
    categories: s.categories || DEFAULT_CATEGORIES,
    category_configs: s.categoryConfigs || [],
    work_schedule: s.workSchedule || [],
    default_group_count: s.defaultGroupCount || 4,
    menu_roles: s.menuRoles || []
  };
}

export function rowToSettings(row: any): AppSettings {
  return {
    instituteName: row.institute_name || row.instituteName || 'IES La Flota',
    instituteLogo: row.institute_logo || row.instituteLogo || '',
    teacherName: row.teacher_name || row.teacherName,
    teacherLogo: row.teacher_logo || row.teacherLogo,
    categories: Array.isArray(row.categories) ? row.categories : DEFAULT_CATEGORIES,
    categoryConfigs: Array.isArray(row.category_configs) ? row.category_configs : row.categoryConfigs,
    workSchedule: Array.isArray(row.work_schedule) ? row.work_schedule : row.workSchedule,
    defaultGroupCount: Number(row.default_group_count ?? row.defaultGroupCount ?? 4),
    menuRoles: Array.isArray(row.menu_roles) ? row.menu_roles : row.menuRoles
  };
}

export function userToRow(u: AppUser) {
  return {
    id: u.uid,
    uid: u.uid,
    email: u.email,
    display_name: u.displayName,
    teacher_name: u.teacherName || u.displayName,
    teacher_logo: u.teacherLogo || '',
    institute_name: u.instituteName || 'IES La Flota',
    institute_logo: u.instituteLogo || '',
    is_approved: u.isApproved,
    role: u.role,
    created_at: u.createdAt || Date.now(),
    workspace_id: u.workspaceId,
    request_message: u.requestMessage || null
  };
}

export function rowToUser(row: any): AppUser {
  return {
    uid: row.uid || row.id,
    email: row.email,
    displayName: row.display_name || row.displayName || '',
    teacherName: row.teacher_name || row.teacherName || row.display_name,
    teacherLogo: row.teacher_logo || row.teacherLogo || '',
    instituteName: row.institute_name || row.instituteName || 'IES La Flota',
    instituteLogo: row.institute_logo || row.instituteLogo || '',
    isApproved: !!(row.is_approved ?? row.isApproved),
    role: row.role || 'user',
    createdAt: Number(row.created_at ?? row.createdAt ?? Date.now()),
    workspaceId: row.workspace_id || row.workspaceId || row.uid || row.id,
    requestMessage: row.request_message || row.requestMessage
  };
}

// Antidormidor / Keep-Alive para Supabase (evita que la base de datos se pause por inactividad de 7 días)
export async function pingSupabaseKeepAlive(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está configurado' };
  }
  const start = performance.now();
  try {
    const { error } = await client.from('recipes').select('id', { count: 'exact', head: true }).limit(1);
    const latencyMs = Math.round(performance.now() - start);
    if (error) {
      return { success: true, latencyMs };
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('supabase_last_keepalive', Date.now().toString());
    }
    return { success: true, latencyMs };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

// Comprobación automática al iniciar la app (si han pasado más de 2 días desde el último keep-alive)
export function autoPingSupabaseIfDue() {
  if (typeof localStorage === 'undefined') return;
  const lastStr = localStorage.getItem('supabase_last_keepalive');
  const now = Date.now();
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
  if (!lastStr || now - Number(lastStr) > TWO_DAYS) {
    pingSupabaseKeepAlive().catch(() => {});
  }
}

// Función para recuperar todas las filas superando el límite de 1000 de Supabase PostgREST mediante paginación en lotes
export async function fetchAllRows(
  client: SupabaseClient, 
  table: string, 
  modifyQuery?: (q: any) => any,
  batchSize?: number
): Promise<any[]> {
  let allData: any[] = [];
  let page = 0;
  // Para recipes y pro_recipes que contienen fotos en base64 de gran tamaño, usamos lotes de 20 para evitar el timeout (57014) de Postgres
  const pageSize = batchSize || (table === 'recipes' || table === 'pro_recipes' ? 20 : 500);
  let fetchMore = true;

  while (fetchMore) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    let query = client.from(table).select('*').range(start, end);
    if (modifyQuery) {
      query = modifyQuery(query);
    }
    const { data, error } = await query;
    if (error) {
      console.warn(`Error al recuperar lote de ${table} [${start}-${end}]:`, error.message);
      fetchMore = false;
    } else if (!data || data.length === 0) {
      fetchMore = false;
    } else {
      allData = allData.concat(data);
      if (data.length < pageSize) {
        fetchMore = false;
      } else {
        page++;
      }
    }
  }
  return allData;
}

