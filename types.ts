
export type Allergen = 
  | 'Gluten' | 'Crustáceos' | 'Huevos' | 'Pescado' | 'Cacahuetes' 
  | 'Soja' | 'Lácteos' | 'Frutos de cáscara' | 'Apio' | 'Mostaza' 
  | 'Sésamo' | 'Sulfitos' | 'Altramuces' | 'Moluscos';

export const ALLERGEN_LIST: Allergen[] = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 
  'Soja', 'Lácteos', 'Frutos de cáscara', 'Apio', 'Mostaza', 
  'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

export interface Product {
  id: string;
  name: string;
  allergens: Allergen[];
  category?: string;
  unit: string;
  pricePerUnit: number; 
  weightPerUnit?: number; 
  wastePercentage?: number; // % de merma estimado
  supplier?: string; // Proveedor habitual
  status?: 'approved' | 'pending'; // New: For admin approval
  requestedBy?: string; // New: Who requested it
  synced?: boolean;
  lastModified?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string; 
  unit: string;
  category?: string;
  allergens: Allergen[];
  pricePerUnit?: number;
  weightPerUnit?: number;
  baseUnit?: string;
  cost?: number;
  isInternalPrep?: boolean; // Pertenece a la ficha / Elaboración interna (no es producto de inventario)
  isNonProduct?: boolean; // No es un producto inventariable (agua, hielo, condimento sin inventario, etc.)
  notes?: string; // Anotación culinaria/variedad/función (ej: Arbequina suave, para pincelar)
  originalName?: string; // Nombre culinario original antes de homologar en inventario
}

export interface VideoLink {
  id?: string;
  title?: string;
  url: string;
}

export interface SubRecipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  photos: string[];
  videos?: VideoLink[];
  videoUrl?: string; // Legacy/single compatibility
}

export interface ServiceDetails {
  presentation: string;
  servingTemp: string;
  tempHot?: string;
  tempCold?: string;
  cutlery: string;
  passTime: string;
  serviceType: string;
  clientDescription: string;
}

export interface MinimalistCard {
  miniComment?: string;
  summaryInstructions?: string;
  platingTips?: string;
  allergens?: Allergen[];
}

// =========================================================================
// SISTEMA PROFESIONAL DE FICHAS TÉCNICAS (I+D Y ALTA GASTRONOMÍA)
// =========================================================================

export type ProFamilyType = 
  | 'Fondo / Caldo' 
  | 'Salsa / Jugo' 
  | 'Elemento Principal' 
  | 'Guarnición' 
  | 'Emulsión / Aire' 
  | 'Fermento / Encurtido' 
  | 'Crujiente / Teja' 
  | 'Infusión / Aceite' 
  | 'Masa / Panadería' 
  | 'Postre / Dulce' 
  | 'Técnica Vanguardia' 
  | 'Otro';

export type ProRecipeStatus = 'development' | 'validated' | 'in_service' | 'archived';

export interface ProSensoryRadar {
  complexity: number; // 1 - 5
  acidity: number;    // 1 - 5
  sweetness: number;  // 1 - 5
  bitterness: number; // 1 - 5
  salinity: number;   // 1 - 5
  umami: number;      // 1 - 5
  fatBalance: number; // 1 - 5
  crunchiness: number;// 1 - 5
}

export interface ProIngredientItem {
  id: string;
  name: string;
  netGrams: number;
  bakersPercentage: number; // % sobre el ingrediente base
  isBase?: boolean; // Si es el ingrediente base (100%)
  notes: string; // Variedad, calibre, origen, corte
  allergens: Allergen[];
  cost?: number;
}

export interface ProProcessStep {
  stepNumber: number;
  operation: string;
  timeMinutes?: number;
  tempCelsius?: string;
  equipment?: string;
  criticalPoint: string; // Punto final observable y medible
  rejectionCriteria?: string; // Criterios para detener o rechazar
}

export interface ProComponentStorage {
  temperature: string;
  container: string;
  shelfLife: string;
  regeneration?: string;
}

export interface ProComponentElaboration {
  id: string;
  code: string; // ej: FT-ELA-001
  name: string;
  family: ProFamilyType;
  roleInDish: string; // Función dentro del plato
  targetYieldGrams: number; // Rendimiento objetivo en gramos
  actualYieldGrams?: number; // Rendimiento real
  wastePercentage?: number; // % merma
  equipmentNeeded: string[];
  ingredients: ProIngredientItem[];
  processSteps: ProProcessStep[];
  storage: ProComponentStorage;
  cost?: number;
}

export interface ProPlatingComponentGram {
  componentId: string;
  componentName: string;
  gramsPerPax: number;
  tool: string; // Pinza, cuchara salsera, espátula, etc.
  targetTemp: string; // 60°C, ambiente, 4°C
}

export interface ProTastingLog {
  id: string;
  date: string;
  taster: string;
  score: number; // 1 a 10
  appearanceNotes: string;
  textureNotes: string;
  flavorNotes: string;
  approvedForMenu: boolean;
  adjustmentsNeeded?: string;
}

export interface ProVersionChange {
  version: string;
  date: string;
  author: string;
  changeSummary: string;
  reason: string;
}

export interface ProRecipe {
  id: string;
  code: string; // ej: FT-DIS-001
  version: string; // ej: "1.0"
  status: ProRecipeStatus;
  responsible: string; // Chef creativo / Jefe de partida
  workspaceId?: string;
  createdAt: number;
  lastModified: number;

  // Nivel 1 · Identidad del plato
  name: string; // Nombre gastronómico
  technicalName: string; // Nombre técnico
  category: string;
  targetPax: number;
  concept: string; // Concepto e intención gastronómica
  starProduct: string; // Producto estrella, origen, calibre, temporada
  storytelling: string; // Discurso para sala / cliente
  heroPhoto?: string; // Foto hiperrealista de pase
  sketchPhoto?: string; // Ilustración técnica del emplatado
  sensoryProfile: {
    visual: string;
    aroma: string;
    texture: string;
    flavor: string;
    aftertaste: string;
    radar: ProSensoryRadar;
  };

  // Nivel 2 · Fichas de elaboración (Componentes independientes)
  components: ProComponentElaboration[];

  // Nivel 3 · Montaje y pase
  plating: {
    componentsGrammage: ProPlatingComponentGram[];
    mountingSequence: string[];
    tableware: string; // Vajilla y soporte de pase
    passTemperature: string; // Temperatura de pase
    maxPassWindowSeconds: number; // Segundos máximos en ventana de pase (ej: 90)
    serviceCutlery: string; // Cubiertos para el comensal
    serviceNotes: string; // Instrucciones de sala
  };

  // Nivel 4 · Control de calidad y Cata
  qualityControl: {
    physicochemical: {
      targetPH?: string;
      targetBrix?: string;
      viscosityDensity?: string;
      coreTemperature?: string;
    };
    acceptanceCriteria: string[];
    rejectionCriteria: string[];
    tastingHistory: ProTastingLog[];
  };

  // Nivel 5 · Trazabilidad y mejora
  traceability: {
    approvedShelfLife: string;
    validatedStorage: string;
    versionHistory: ProVersionChange[];
    totalDishCost?: number;
    costPerPax?: number;
    salePriceObjective?: number;
    targetFoodCostPercentage?: number; // ej: 28%
  };
}

export interface TakeAwayHomeFinishing {
  summaryText?: string; // Breve descripción comercial y apetitosa para el cliente
  heatingMethod?: 'microwave' | 'oven' | 'pan' | 'cold' | 'bain_marie';
  heatingInstructions?: string; // e.g. "Microondas 2 min a 750W con tapa entreabierta" o "Horno 8 min a 180°C"
  platingSteps?: string; // e.g. "1. Verter la salsa caliente por encima. 2. Espolvorear el crujiente al final."
  storageCustomerNotes?: string; // e.g. "Conservar refrigerado a 4°C y consumir en menos de 48h."
}

export interface TakeAwayDetails {
  isTakeAway: boolean;
  recipeType?: 'normal' | 'takeaway' | 'eventos' | 'pastry';
  targetServiceMode?: 'hot_delivery' | 'cook_and_chill' | 'fifth_range'; // Reparto caliente | Refrigerado 24-48h | 5ª Gama
  packagingType?: string; // e.g. "Envase kraft microondable 750ml + tarrina 50ml para salsa"
  packagingNotes?: string; // e.g. "Salsa aparte en frío. Dejar atemperar 2 min antes de tapar para evitar vaho."
  shelfLife?: string; // e.g. "48 horas" o "Consumo inmediato"
  conservationTemp?: string; // e.g. "2°C - 4°C" o "Consumo caliente inmediato"
  transportTips?: string; // e.g. "Transportar en plano horizontal, no apilar más de 3 cajas."
  homeFinishing?: TakeAwayHomeFinishing;
  pastryInfographic?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string; 
  categories: string[]; 
  photo: string;
  photoLayout?: 'classic' | 'banner' | 'auto'; // 'classic' (lateral 1/4) o 'banner' (panorámica superior ancho completo)
  creator: string;
  creatorLogo?: string; // New: Logo of the creator
  workspaceId: string; // New: Who owns this recipe
  isPublic: boolean;   // New: Shared with community
  originalAuthor?: string; // New: If duplicated from community
  sourceUrl?: string;
  videos?: VideoLink[]; // Multiple videos at recipe level
  videoUrl?: string; // Legacy/single compatibility
  yieldQuantity: number;
  yieldUnit: string;
  subRecipes: SubRecipe[];
  platingInstructions: string;
  serviceDetails: ServiceDetails;
  extraAllergens?: Allergen[];
  minimalistCard?: MinimalistCard;
  takeAwayDetails?: TakeAwayDetails;
  recipeType?: 'normal' | 'takeaway' | 'eventos' | 'pastry';
  pastryInfographic?: string; // Infografía técnica didáctica de pastelería
  infographicUrl?: string; // Enlace directo o de Google Drive a infografía externa
  linkedRecipeIds?: string[]; // IDs de recetas enlazadas (salsas, guarniciones, cremas, bizcochos, etc.)
  lastModified: number;
  createdAt?: number;
  totalCost?: number;
  synced?: boolean;
}

export interface WorkScheduleDay {
  day: string; // 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  enabled: boolean;
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "14:30"
  notes?: string;    // e.g. "Pre-elaboraciones", "Día de Pase"
}

export const DEFAULT_WORK_SCHEDULE: WorkScheduleDay[] = [
  { day: 'Lunes', enabled: true, startTime: '08:30', endTime: '14:30', notes: 'Pre-elaboraciones y fondos' },
  { day: 'Martes', enabled: true, startTime: '08:30', endTime: '14:30', notes: 'Cocciones y mise en place' },
  { day: 'Miércoles', enabled: true, startTime: '08:30', endTime: '14:30', notes: 'Preparación fresca de partidas' },
  { day: 'Jueves', enabled: true, startTime: '08:30', endTime: '15:30', notes: 'Servicio en Comedor / Pase' },
  { day: 'Viernes', enabled: false, startTime: '08:30', endTime: '14:30', notes: 'Balance y limpieza profunda' },
  { day: 'Sábado', enabled: false, startTime: '09:00', endTime: '14:00', notes: '' },
  { day: 'Domingo', enabled: false, startTime: '09:00', endTime: '14:00', notes: '' }
];

export interface DishExtraIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
  pricePerUnit?: number;
  weightPerUnit?: number;
  baseUnit?: string;
  allergens?: Allergen[];
  notes?: string;
}

export interface MenuPlan {
  id: string;
  title: string;
  date: string;
  pax: number;
  recipeIds: string[];
  lastModified: number;
  workspaceId: string; // New: Who owns this menu plan
  recipeRoles?: Record<string, string>; // recipeId -> e.g. 'Aperitivo 1', 'Pescado', 'Carne'
  dishExtraIngredients?: Record<string, DishExtraIngredient[]>; // recipeId -> extra ingredients
  dishApprovals?: Record<string, boolean>; // recipeId -> true/false
  workSchedule?: WorkScheduleDay[]; // Días y horas lectivas
  groupCount?: number; // Cantidad de grupos (ej: 4)
  dishGroupAssignments?: Record<string, number>; // recipeId -> group number (1..N)
  groupNotes?: Record<number, string>; // notas por grupo
  workOrderAdvanceNotes?: {
    fifteenDaysBefore?: string;
    twoDaysBefore?: string;
    serviceDayNotes?: string;
  };
  customMenuRoles?: string[]; // Teacher-defined custom apartados/roles
  dishIngredientOverrides?: Record<string, Record<string, { quantity: string; unit: string; notes?: string; replacedName?: string; originalName?: string }>>; // recipeId -> ingredientKey -> override (including substitutions)
  kitchenChecklist?: Record<string, Record<string, boolean>>; // recipeId -> checkKey -> checked
  serviceDetailsOverrides?: Record<string, Partial<ServiceDetails>>; // recipeId -> field overrides
  generalExtraItems?: Array<{ id: string; name: string; quantity: number; unit: string; family: string; notes?: string }>; // Extra supplies/notes in purchase order
  ignoredPurchaseItems?: string[]; // Excluded ingredients from purchase order (e.g. sal, agua)
  synced?: boolean;
}

export interface CategoryConfig {
  name: string;
  colors: string[]; // Up to 3 colors
}

export interface WorkspaceSettings {
  workspaceId: string;
  categories: string[];
  categoryConfigs?: CategoryConfig[];
}

export interface AppSettings {
  instituteName: string;
  instituteLogo: string;
  teacherName?: string;
  teacherLogo?: string;
  categories: string[];
  categoryConfigs?: CategoryConfig[];
  workSchedule?: WorkScheduleDay[];
  defaultGroupCount?: number;
  menuRoles?: string[];
  lastModified?: number;
}

export interface AppBackup {
  version: number;
  timestamp: number;
  settings: AppSettings;
  recipes: Recipe[];
  productDatabase: Product[];
  savedMenus?: MenuPlan[];
}

export interface FullBackup extends AppBackup {
  users?: AppUser[];
  invites?: WorkspaceInvite[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  teacherName?: string;
  teacherLogo?: string;
  instituteName?: string; // New: User's school name
  instituteLogo?: string; // New: User's school logo
  isApproved: boolean;
  role: 'admin' | 'user';
  createdAt: number;
  workspaceId: string; // New: To group users
  requestMessage?: string; // New: Message from pending users
}

export interface WorkspaceInvite {
  email: string;
  workspaceId: string;
  inviterName: string;
  createdAt: number;
}

export const DEFAULT_CATEGORIES = [
  "Entrantes", "Ensaladas", "Sopas y Cremas", "Carnes", "Aves", 
  "Pescados", "Mariscos", "Pastas y Arroces", "Guarniciones", 
  "Salsas", "Postres", "Panadería", "Bebidas", "Otros"
];

export const SERVICE_TYPES = [
  { id: "americana", name: "Servicio a la Americana", desc: "Práctico, rápido, plato montado en cocina." },
  { id: "inglesa", name: "Servicio a la Inglesa", desc: "Similar al americano, pero con mayor énfasis en presentación." },
  { id: "francesa", name: "Servicio a la Francesa", desc: "Tradicional, todos los platos al mismo tiempo en fuentes." },
  { id: "gueridon", name: "Servicio al Gueridón (o a la Rusa)", desc: "Teatral, preparación parcial en mesa frente al cliente." },
  { id: "milieu", name: "Servicio de Plat de Milieu", desc: "Platos servidos en el centro de la mesa (similar a familiar)." },
  { id: "buffet", name: "Servicio de Buffet", desc: "Autoservicio, alimentos expuestos en mesas o mostradores." },
  { id: "directa", name: "Sin Servicio / Venta Directa", desc: "Productos para llevar o despacho directo (bollería, pastelería)." }
];

export const CUTLERY_DICTIONARY = {
  "Carnes": "Cuchillo trinchero + Tenedor trinchero (Para cortar y sujetar)",
  "Pescado": "Pala de pescado + Tenedor de pescado (Hoja flexible, sin filo)",
  "Entremeses": "Tenedor pequeño (+ cuchillo mini si se necesita) (Para entradas frías/ligeras)",
  "Sopas": "Cuchara de sopa o de consomé (Forma según tipo de caldo)",
  "Postres": "Cuchillo + tenedor y/o cuchara de postre (Se colocan arriba del plato)",
  "Quesos": "Cuchillo(s) de queso (+ tenedor pequeño) (Varía según dureza)"
};

export const TEMPERATURE_DICTIONARY = {
  "Carnes Rojas": [
    { label: "Jugoso", value: "52–55 °C" },
    { label: "Medio", value: "57–60 °C" },
    { label: "Al Punto", value: "60–63 °C" },
    { label: "Bien Hecho", value: "68–72 °C" }
  ],
  "Aves (Pollo, Pavo)": [
    { label: "Mínimo Seguro", value: "74 °C (sin rosa)" }
  ],
  "Cerdo": [
    { label: "Jugoso y Seguro", value: "63–65 °C" },
    { label: "Bien Hecho", value: "70–72 °C" }
  ],
  "Cordero": [
    { label: "Jugoso", value: "52–55 °C" },
    { label: "Al Punto", value: "60–63 °C" }
  ],
  "Pescado Blanco": [
    { label: "Merluza/Lenguado", value: "55–60 °C (suave)" }
  ],
  "Pescado Azul": [
    { label: "A la plancha", value: "50–55 °C (rosado)" },
    { label: "Bien Cocido", value: "60–65 °C" }
  ],
  "Mariscos": [
    { label: "Gambas/Langostinos", value: "60–65 °C (nacarado)" },
    { label: "Calamares/Pulpo", value: "70–75 °C (tiernos)" }
  ],
  "Arroces y Pastas": [
    { label: "Servicio Caliente", value: "65–70 °C" }
  ],
  "Verduras": [
    { label: "Asadas/Vapor", value: "60–65 °C (crujientes)" }
  ],
  "Sopas y Cremas": [
    { label: "Ligeras", value: "60–65 °C" },
    { label: "Contundentes", value: "70–75 °C" }
  ],
  "Fríos": [
    { label: "Ensaladas/Tartares", value: "4–8 °C" }
  ]
};

export const ADMIN_EMAILS: string[] = [
  'jcbmisweb@gmail.com',
  'jcbrecetas@gmail.com',
  'jcbprofesor@gmail.com',
  'juan.codina@murciaeduca.es',
  'jcbbinger@gmail.com'
];

export const isUserAdmin = (user?: { role?: string; email?: string | null } | null): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
};

export const isUserOwner = (user?: { email?: string | null } | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
};
