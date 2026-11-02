
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
  importantNotes?: string; // Puntos importantes (si los hay)
}

export interface MinimalistCard {
  miniComment?: string;
  summaryInstructions?: string;
  platingTips?: string;
  presentation?: string; // Apartado PRESENTACIÓN
  importantNotes?: string; // Puntos importantes (si los hay)
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
  grossGrams?: number; // Peso bruto antes de mermas
  bakersPercentage: number; // % sobre el ingrediente base
  yieldPercentage?: number; // Rendimiento (%) = (peso neto ÷ peso bruto) × 100
  wastePercentage?: number; // Merma (%) = 100 − rendimiento
  unitPrice?: number; // Precio de compra por kg (€/kg)
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

export interface ProMiseEnPlace {
  dayBefore?: string; // Qué se prepara el día antes
  morning?: string;   // Qué por la mañana
  service?: string;   // Qué en el momento del servicio
}

export interface ProComponentElaboration {
  id: string;
  code: string; // ej: FT-ELA-001
  name: string;
  family: ProFamilyType;
  roleInDish: string; // Función dentro del plato
  targetYieldGrams: number; // Rendimiento objetivo en gramos
  actualYieldGrams?: number; // Rendimiento real
  grossWeightGrams?: number; // Peso bruto total estimado
  wastePercentage?: number; // % merma
  equipmentNeeded: string[];
  ingredients: ProIngredientItem[];
  processSteps: ProProcessStep[];
  storage: ProComponentStorage;
  miseEnPlace?: ProMiseEnPlace; // Mise en place temporalizada (apartado 3 Nivel 2)
  allergens?: Allergen[]; // Alérgenos propios de esta sub-elaboración (apartado 5)
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

export interface ProPCCItem {
  id: string;
  stage: string;           // Etapa (Cocción, Enfriamiento/Abatidor, Conservación frío, Mantenimiento caliente)
  hazard: string;          // Peligro (Supervivencia de patógenos, Crecimiento bacteriano)
  criticalLimit: string;   // Límite crítico (Temp corazón, 65°C a <=10°C <2h, 0-4°C, >=65°C)
  monitoring: string;      // Vigilancia (Termómetro sonda, Sonda + reloj, Lectura cámara)
  correctiveAction: string;// Acción correctora (Prolongar cocción, descartar, regenerar)
  record: string;          // Registro (Hoja temperaturas, Hoja abatimiento, Registro cámaras, Hoja pase)
  verified?: boolean;
}

export interface ProRubricEvaluation {
  scores: {
    techniqueCooking: number;        // Técnica y punto de cocción (25% - escala 0..4)
    foodSafetyHaccp: number;         // Seguridad alimentaria y APPCC (25% - escala 0..4)
    platingGrammage: number;         // Montaje y gramaje (15% - escala 0..4)
    serviceTempTime: number;         // Temperatura y tiempo de servicio (10% - escala 0..4)
    flavorTexture: number;           // Sabor y textura / cata (15% - escala 0..4)
    organizationMiseEnPlace: number; // Organización, mise en place y limpieza (10% - escala 0..4)
  };
  evaluator?: string;
  date?: string;
  weightedScore?: number; // Nota ponderada sobre 4 o 10
  feedback?: string;
}

export const DEFAULT_PCC_PLAN: ProPCCItem[] = [
  {
    id: 'pcc-1',
    stage: 'Cocción de la pieza',
    hazard: 'Supervivencia de patógenos',
    criticalLimit: 'Temperatura de corazón y tiempo según tabla de pasteurización',
    monitoring: 'Termómetro de sonda en cada pieza',
    correctiveAction: 'Prolongar la cocción o descartar',
    record: 'Hoja de temperaturas'
  },
  {
    id: 'pcc-2',
    stage: 'Enfriamiento (abatidor)',
    hazard: 'Crecimiento bacteriano',
    criticalLimit: 'De 65 °C a ≤ 10 °C en el tiempo máximo fijado por el centro (< 2 h)',
    monitoring: 'Sonda + reloj',
    correctiveAction: 'Repetir el abatimiento o descartar',
    record: 'Hoja de abatimiento'
  },
  {
    id: 'pcc-3',
    stage: 'Conservación en frío',
    hazard: 'Crecimiento bacteriano',
    criticalLimit: '0-4 °C (o según producto)',
    monitoring: 'Lectura de cámara al inicio y fin de jornada',
    correctiveAction: 'Revisar equipo y evaluar el producto',
    record: 'Registro de cámaras'
  },
  {
    id: 'pcc-4',
    stage: 'Mantenimiento en caliente',
    hazard: 'Crecimiento bacteriano',
    criticalLimit: '≥ 65 °C',
    monitoring: 'Sonda antes del pase',
    correctiveAction: 'Regenerar o descartar',
    record: 'Hoja de pase'
  }
];

export const RUBRIC_CRITERIA: { key: keyof ProRubricEvaluation['scores']; label: string; weight: number; desc01: string; desc2: string; desc3: string; desc4: string }[] = [
  {
    key: 'techniqueCooking',
    label: 'Técnica y punto de cocción',
    weight: 25,
    desc01: 'Fuera de rango',
    desc2: 'Limitado, con desviaciones',
    desc3: 'Correcto',
    desc4: 'Exacto y uniforme'
  },
  {
    key: 'foodSafetyHaccp',
    label: 'Seguridad alimentaria y APPCC',
    weight: 25,
    desc01: 'Incumple un límite crítico',
    desc2: 'Registros incompletos',
    desc3: 'Cumple con registros',
    desc4: 'Cumple, registra y anticipa'
  },
  {
    key: 'platingGrammage',
    label: 'Montaje y gramaje',
    weight: 15,
    desc01: 'No sigue la ficha',
    desc2: 'Varias desviaciones',
    desc3: 'Desviaciones menores',
    desc4: 'Idéntico a la ficha'
  },
  {
    key: 'serviceTempTime',
    label: 'Temperatura y tiempo de servicio',
    weight: 10,
    desc01: 'Fuera de rango',
    desc2: 'Límite',
    desc3: 'Correcto',
    desc4: 'Óptimo'
  },
  {
    key: 'flavorTexture',
    label: 'Sabor y textura (cata)',
    weight: 15,
    desc01: 'Desequilibrado',
    desc2: 'Mejorable',
    desc3: 'Equilibrado',
    desc4: 'Memorable'
  },
  {
    key: 'organizationMiseEnPlace',
    label: 'Organización, mise en place y limpieza',
    weight: 10,
    desc01: 'Desordenado',
    desc2: 'Irregular',
    desc3: 'Ordenado',
    desc4: 'Eficiente y trabaja en brigada'
  }
];

export interface ProRecipe {
  id: string;
  code: string; // ej: FT-DIS-001
  version: string; // ej: "1.0"
  status: ProRecipeStatus;
  useLevel?: 'basic' | 'advanced'; // Nivel de uso: Básico (1, 2, 5) vs Avanzado (1 a 5 + cata/PCC)
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

  // Rúbrica oficial de evaluación del plato (Apartado 6)
  rubricEvaluation?: ProRubricEvaluation;

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

  // Cuadro oficial de Puntos Críticos de Control APPCC (Apartado 7)
  pccPlan?: ProPCCItem[];
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
  presentation?: string; // Apartado PRESENTACIÓN (emplatado, vajilla y pase)
  importantNotes?: string; // Apartado PUNTOS IMPORTANTES (si los hay)
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
