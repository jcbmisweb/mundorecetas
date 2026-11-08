import React, { useState, useEffect } from 'react';
import { 
  Recipe, ProRecipe, AppSettings, AppBackup, Product, MenuPlan, 
  DEFAULT_CATEGORIES, SubRecipe, AppUser, isUserAdmin, DEFAULT_WORK_SCHEDULE 
} from './types';
import { Dashboard } from './components/Dashboard';
import { RecipeEditor } from './components/RecipeEditor';
import { RecipeView } from './components/RecipeView';
import { SettingsModal } from './components/SettingsModal';
import { MenuPlanner } from './components/MenuPlanner';
import { ProductDatabaseViewer } from './components/ProductDatabaseViewer';
import { LandingPage } from './components/LandingPage';
import { AIBridge } from './components/AIBridge';
import { UserManagement } from './components/UserManagement';
import { MigrationModal } from './components/MigrationModal';
import { RecipeAlphabeticalIndex } from './components/RecipeAlphabeticalIndex';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProWorkshopHub } from './components/ProWorkshopHub';
import { ProRecipeEditor } from './components/ProRecipeEditor';
import { ProRecipePrintView } from './components/ProRecipePrintView';
import { ProWorkshopGuide } from './components/ProWorkshopGuide';
import { INITIAL_PRO_RECIPES } from './data/initialProRecipes';
import { 
  compressBase64Image, 
  ensureRecipeFitsFirestore, 
  saveEmergencyDraft, 
  removeEmergencyDraft, 
  appendRecipeHistory,
  getEmergencyDrafts
} from './lib/imageUtils';
import { INITIAL_PRODUCT_DATABASE } from './data/products';
import { AppSidebar } from './components/AppSidebar';
import { FlavorLab } from './components/FlavorLab';
import { PromptHub } from './components/PromptHub';
import { Calculatox } from './components/Calculatox';
import { DatabaseAuditModal } from './components/DatabaseAuditModal';
import { 
  db,
  auth,
  loginWithGoogle,
  logout as firebaseLogout,
  testFirestoreConnection,
  loginDemoUser,
  getDemoUser,
  getActiveUser,
  saveActiveUser
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ShieldAlert, LogOut, Loader2, Server, CheckCircle2, AlertCircle, RefreshCw, X, Database, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { normalizeText, extractDifferenceNote, matchProductInCatalog, reconcileRecipeWithCatalog, reconcileIngredientWithCatalog } from './lib/productUtils';
import { calculateIngredientCost } from './lib/costUtils';
import { localDB, saveRecipeLocal, saveProductLocal, saveMenuPlanLocal, seedLocalDatabase, saveProRecipeLocal, deleteProRecipeLocal, seedProRecipesLocal } from './db/dexieDB';
import { 
  subscribeSyncStatus, 
  executeCloudSync, 
  startAutoSync, 
  checkBatchSyncThreshold, 
  getIsQuotaExceeded, 
  setIsQuotaExceeded,
  executeDailyVerification,
  isDailySyncNeeded,
  getDailySyncStatus
} from './lib/syncManager';
import { initGoogleDriveAuth } from './lib/googleDriveService';
import { parseRecipesFromCSV, parseProductsFromCSV } from './lib/csvParser';
import { separateRecipesAndProducts, executeDatabaseSeparation, isRecipeRawProduct } from './lib/recipeProductSeparator';

type ViewState = 
  | 'LANDING' 
  | 'DASHBOARD' 
  | 'EDITOR' 
  | 'VIEWER' 
  | 'MENU_PLANNER' 
  | 'PRODUCT_DB' 
  | 'CALCULATOX'
  | 'AI_BRIDGE' 
  | 'PROMPT_HUB' 
  | 'PENDING' 
  | 'USER_MANAGEMENT' 
  | 'PRO_WORKSHOP' 
  | 'PRO_EDITOR' 
  | 'PRO_VIEWER' 
  | 'PRO_GUIDE';

const PendingMessageForm = ({ appUser }: { appUser: AppUser | null }) => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
        Mensaje enviado correctamente. El administrador lo revisará pronto.
      </div>
    );
  }

  return (
    <div className="w-full mt-2">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Escribe un mensaje al administrador (quién eres, por qué necesitas acceso...)"
        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm mb-3 outline-none focus:border-amber-500 resize-none"
        rows={3}
      />
      <button
        onClick={async () => {
          if (!message.trim() || !appUser) return;
          try {
            await setDoc(doc(db, 'users', appUser.uid), { requestMessage: message }, { merge: true });
            setSent(true);
          } catch (e) {
            console.error(e);
          }
        }}
        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors text-sm"
      >
        Enviar Mensaje
      </button>
    </div>
  );
};

const defaultSettings: AppSettings = {
  instituteName: "IES LA FLOTA",
  instituteLogo: "",
  teacherName: "JUAN CODINA BARRANCO",
  teacherLogo: "",
  categories: DEFAULT_CATEGORIES,
  categoryConfigs: DEFAULT_CATEGORIES.map(name => {
    const c = name.toLowerCase();
    let colors = ['#94a3b8'];
    if (c.includes('carne') || c.includes('ave')) colors = ['#f43f5e'];
    if (c.includes('pescado') || c.includes('marisco')) colors = ['#3b82f6'];
    if (c.includes('entrante') || c.includes('ensalada')) colors = ['#10b981'];
    if (c.includes('postre') || c.includes('dulce') || c.includes('pastelería')) colors = ['#f59e0b'];
    if (c.includes('salsa') || c.includes('guarnición')) colors = ['#6366f1'];
    if (c.includes('arroz') || c.includes('pasta')) colors = ['#f97316'];
    return { name, colors };
  }),
  workSchedule: DEFAULT_WORK_SCHEDULE,
  defaultGroupCount: 4
};

const ensureRecipeType = (r: Recipe): Recipe => {
  let type = r.recipeType;
  if (!type && r.takeAwayDetails?.recipeType) {
    type = r.takeAwayDetails.recipeType;
  }
  if (!type && (r.takeAwayDetails?.isTakeAway === true)) {
    type = 'takeaway';
  }
  if (!type) {
    const text = (r.name + ' ' + (r.category || '') + ' ' + (r.categories || []).join(' ')).toLowerCase();
    if (text.includes('pasteler') || text.includes('postre') || text.includes('dulce') || text.includes('tarta') || text.includes('boller') || text.includes('reposter') || text.includes('panader')) {
      type = 'pastry';
    } else if (text.includes('evento') || text.includes('catering') || text.includes('banquet') || text.includes('buffet')) {
      type = 'eventos';
    } else if (text.includes('takeaway') || text.includes('take away') || text.includes('llevar') || text.includes('delivery')) {
      type = 'takeaway';
    } else {
      type = 'normal';
    }
  }

  let takeAwayDetails = r.takeAwayDetails;
  if (!takeAwayDetails && type === 'takeaway') {
    takeAwayDetails = { isTakeAway: true, recipeType: 'takeaway' };
  }

  return {
    ...r,
    recipeType: type,
    takeAwayDetails
  };
};

function App() {
  const [user, setUser] = useState<{ id: string; email?: string; displayName?: string } | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const cached = localStorage.getItem('cached_recipes');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed.map(ensureRecipeType) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem('app_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error loading cached settings:", e);
    }
    return defaultSettings;
  });
  const [productDatabase, setProductDatabase] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('cached_products');
      return cached ? JSON.parse(cached) : INITIAL_PRODUCT_DATABASE;
    } catch {
      return INITIAL_PRODUCT_DATABASE;
    }
  });
  const [savedMenus, setSavedMenus] = useState<MenuPlan[]>(() => {
    try {
      const cached = localStorage.getItem('cached_menus');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [proRecipes, setProRecipes] = useState<ProRecipe[]>(() => {
    try {
      const cached = localStorage.getItem('cached_pro_recipes');
      return cached ? JSON.parse(cached) : INITIAL_PRO_RECIPES;
    } catch {
      return INITIAL_PRO_RECIPES;
    }
  });
  
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [currentProRecipe, setCurrentProRecipe] = useState<ProRecipe | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'school' | 'backup'>('school');
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isAlphabeticalIndexOpen, setIsAlphabeticalIndexOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showFlavorLab, setShowFlavorLab] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<{ isSyncing: boolean; unsyncedCount: number; message?: string }>({
    isSyncing: false,
    unsyncedCount: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOpenSettings = (tab: 'school' | 'backup' = 'school') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const checkDb = async () => {
    setDbStatus('checking');
    const result = await testFirestoreConnection();
    setDbLatency(result.latency);
    setDbStatus(result.ok ? 'connected' : 'error');
  };

  const handleRefreshAllData = async () => {
    try {
      // 1. Recipes (Local + Cloud merge)
      const localRecipes = await localDB.recipes.toArray();
      let rLoaded: Recipe[] = [];
      try {
        const rSnap = await getDocs(collection(db, 'recipes'));
        rLoaded = rSnap.docs.map(d => ({ id: d.id, ...d.data(), synced: true } as Recipe));
      } catch (err) {
        console.warn("Firestore recipes getDocs warning (quota limit reached, reading from localDB):", err);
      }
      const recipeMap = new Map<string, Recipe>();
      // Marcar primero las que están en Firestore como online (synced: true)
      rLoaded.map(ensureRecipeType).forEach(r => { if (r.id) recipeMap.set(r.id, { ...r, synced: true }); });
      
      // Integrar recetas de localDB: si ya están en la nube quedan como synced: true, si solo están en local quedan synced: false
      localRecipes.map(ensureRecipeType).forEach(r => {
        if (r.id) {
          if (recipeMap.has(r.id)) {
            const cloudDoc = recipeMap.get(r.id)!;
            if (r.synced === false || (r.lastModified || 0) > (cloudDoc.lastModified || 0)) {
              recipeMap.set(r.id, { ...cloudDoc, ...r, synced: false });
            } else {
              recipeMap.set(r.id, { ...cloudDoc, ...r, synced: true });
            }
          } else {
            recipeMap.set(r.id, { ...r, synced: false });
          }
        }
      });

      const rawMergedRecipes = Array.from(recipeMap.values()).map(ensureRecipeType);
      
      // 2. Products (Local + Cloud merge)
      const localProducts = await localDB.products.toArray();
      let pLoaded: Product[] = [];
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        pLoaded = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch (err) {
        console.warn("Firestore products getDocs warning:", err);
      }
      const productMap = new Map<string, Product>();
      pLoaded.forEach(p => { if (p.id) productMap.set(p.id, p); });
      localProducts.forEach(p => { if (p.id) productMap.set(p.id, p); });
      const rawMergedProducts = Array.from(productMap.values());

      // 2b. Separar automáticamente cualquier ingrediente/producto que haya entrado erróneamente en recetas
      const { cleanRecipes, extractedProducts, movedCount } = separateRecipesAndProducts(rawMergedRecipes, rawMergedProducts);
      if (movedCount > 0) {
        console.info(`[Auto-Separación] Se han extraído ${movedCount} ingredientes de la lista de recetas y movido al catálogo.`);
        executeDatabaseSeparation(rawMergedRecipes, rawMergedProducts);
      }

      let finalRecipes = cleanRecipes;
      if (finalRecipes.length < 5) {
        try {
          const resp = await fetch('/data/bundledRecipes.json');
          if (resp.ok) {
            const parsed = (await resp.json()).map(ensureRecipeType);
            if (parsed.length > 0) {
              finalRecipes = parsed;
              await localDB.recipes.bulkPut(parsed);
            }
          } else {
            const respCsv = await fetch('/assets/aistudio/recipes_rows_d32d099c.csv');
            if (respCsv.ok) {
              const text = await respCsv.text();
              const parsed = parseRecipesFromCSV(text, 'user_admin', 'JUAN CODINA BARRANCO').map(ensureRecipeType);
              if (parsed.length > 0) {
                finalRecipes = parsed;
                await localDB.recipes.bulkPut(parsed);
              }
            }
          }
        } catch (e) {
          console.warn('Refresh fallback warning:', e);
        }
      }

      setRecipes(finalRecipes);
      try { localStorage.setItem('cached_recipes', JSON.stringify(finalRecipes)); } catch {}

      setProductDatabase(extractedProducts);
      try { localStorage.setItem('cached_products', JSON.stringify(extractedProducts)); } catch {}

      // 3. Menus
      let mLoaded: MenuPlan[] = [];
      try {
        const mSnap = await getDocs(collection(db, 'menuPlans'));
        mLoaded = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuPlan));
        if (mLoaded.length > 0) {
          setSavedMenus(mLoaded);
          try { localStorage.setItem('cached_menus', JSON.stringify(mLoaded)); } catch {}
        }
      } catch (err) {
        console.warn("Firestore menus getDocs warning:", err);
      }

      // 4. Pro Recipes
      let proLoaded: ProRecipe[] = [];
      try {
        const proSnap = await getDocs(collection(db, 'proRecipes'));
        proLoaded = proSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProRecipe));
        if (proLoaded.length === 0) {
          const altSnap = await getDocs(collection(db, 'pro_recipes'));
          proLoaded = altSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProRecipe));
        }
        if (proLoaded.length > 0) {
          setProRecipes(prev => {
            const remoteMap = new Map(proLoaded.map(p => [p.id, p]));
            const merged = [...proLoaded];
            prev.forEach(localP => {
              if (!remoteMap.has(localP.id) || localP.synced === false) {
                const idx = merged.findIndex(p => p.id === localP.id);
                if (idx >= 0) merged[idx] = localP;
                else merged.push(localP);
              }
            });
            try { localStorage.setItem('cached_pro_recipes', JSON.stringify(merged)); } catch {}
            return merged;
          });
          await seedProRecipesLocal(proLoaded);
        }
      } catch (err) {
        console.warn("Firestore proRecipes getDocs warning:", err);
      }

      // Seed Dexie DB
      seedLocalDatabase(cleanRecipes, extractedProducts, mLoaded, proLoaded);
    } catch (e) {
      console.warn("Error refreshing all data:", e);
    }
  };

  useEffect(() => {
    checkDb();

    // Init Google Drive Auth
    initGoogleDriveAuth();

    // Load Dexie localDB instantly on startup (con auto-seed si está vacío)
    const loadDexieData = async () => {
      try {
        let localRecipes = await localDB.recipes.toArray();
        if (localRecipes.length >= 10) {
          const normalized = localRecipes.map(ensureRecipeType);
          setRecipes(normalized);
        } else {
          // Si localDB tiene pocas recetas, auto-cargar desde el JSON pre-compilado instantáneo
          try {
            const resp = await fetch('/data/bundledRecipes.json');
            if (resp.ok) {
              const parsed = (await resp.json()).map(ensureRecipeType);
              if (parsed.length > 0) {
                await localDB.recipes.bulkPut(parsed);
                setRecipes(parsed);
                localRecipes = parsed;
              }
            } else {
              const respCsv = await fetch('/assets/aistudio/recipes_rows_d32d099c.csv');
              if (respCsv.ok) {
                const text = await respCsv.text();
                const parsed = parseRecipesFromCSV(text, 'user_admin', 'JUAN CODINA BARRANCO').map(ensureRecipeType);
                if (parsed.length > 0) {
                  await localDB.recipes.bulkPut(parsed);
                  setRecipes(parsed);
                  localRecipes = parsed;
                }
              }
            }
          } catch (e) {
            console.warn('Auto-seed recipes warning:', e);
          }
        }

        const localProducts = await localDB.products.toArray();
        if (localProducts.length > 0) {
          setProductDatabase(localProducts);
        } else {
          try {
            const respP = await fetch('/assets/aistudio/products_rows_0a86eda6.csv');
            if (respP.ok) {
              const textP = await respP.text();
              const parsedP = parseProductsFromCSV(textP);
              if (parsedP.length > 0) {
                await localDB.products.bulkPut(parsedP);
                setProductDatabase(parsedP);
              }
            }
          } catch (e) {
            console.warn('Auto-seed products CSV warning:', e);
          }
        }

        const localMenus = await localDB.menuPlans.toArray();
        if (localMenus.length > 0) setSavedMenus(localMenus);

        const localPro = await localDB.proRecipes.toArray();
        if (localPro.length > 0) {
          setProRecipes(localPro);
        } else {
          try {
            const cached = localStorage.getItem('cached_pro_recipes');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProRecipes(parsed);
                await seedProRecipesLocal(parsed);
              }
            }
          } catch {}
        }

        // Verificación de auto-separación tras carga inicial
        const currentRecs = localRecipes.length > 0 ? localRecipes.map(ensureRecipeType) : [];
        const currentProds = localProducts.length > 0 ? localProducts : [];
        if (currentRecs.some(isRecipeRawProduct)) {
          const sep = await executeDatabaseSeparation(currentRecs, currentProds);
          setRecipes(sep.cleanRecipes);
          setProductDatabase(sep.cleanProducts);
        }
      } catch (e) {
        console.warn('Dexie DB load error:', e);
      }
    };
    loadDexieData().then(async () => {
      // Optimización de cuota de Firebase: Solo descargar de la nube si el almacenamiento local está vacío (nuevo ordenador/navegador)
      try {
        const currentLocal = await localDB.recipes.toArray();
        if (currentLocal.length < 5) {
          console.info('Base de datos local vacía o insuficiente (nuevo ordenador). Descargando recetas de Firestore...');
          await handleRefreshAllData();
        }
      } catch (err) {
        console.warn('Auto-refresh cloud data on startup warning:', err);
      }

      // Comprobación diaria única al comenzar el día (si ya se hizo hoy, no lo vuelve a hacer)
      executeDailyVerification().then(res => {
        if (res.executed) {
          localDB.recipes.toArray().then(items => {
            if (items.length > 0) {
              setRecipes(items.map(ensureRecipeType));
            }
          });
        }
      });
    });

    // Subscribe to SyncManager
    const unsubSync = subscribeSyncStatus((st) => {
      setSyncState({
        isSyncing: st.isSyncing,
        unsyncedCount: st.unsyncedCount,
        message: st.message
      });
    });

    // Iniciar gestor de sincronización (sin intervalos agresivos de sondeo)
    startAutoSync();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-descubrimiento de categorías asociadas a recetas para asegurar que NUNCA falte ninguna en el panel
  useEffect(() => {
    if (recipes.length > 0) {
      const foundCats = new Set<string>();
      recipes.forEach(r => {
        if (Array.isArray(r.categories)) {
          r.categories.forEach(c => { if (c && c.trim()) foundCats.add(c.trim()); });
        }
        if (r.category && r.category.trim()) {
          foundCats.add(r.category.trim());
        }
      });

      if (foundCats.size > 0) {
        setSettings(prev => {
          const currentCats = new Set(prev.categories || []);
          let newFound = false;
          foundCats.forEach(c => {
            if (!currentCats.has(c)) {
              currentCats.add(c);
              newFound = true;
            }
          });

          if (newFound) {
            const nextCats = Array.from(currentCats);
            const nextConfigs = [...(prev.categoryConfigs || [])];
            nextCats.forEach(c => {
              if (!nextConfigs.some(conf => conf.name === c)) {
                nextConfigs.push({ name: c, colors: ['#94a3b8'] });
              }
            });
            const updated: AppSettings = {
              ...prev,
              categories: nextCats,
              categoryConfigs: nextConfigs,
              lastModified: Date.now()
            };
            try { localStorage.setItem('app_settings', JSON.stringify(updated)); } catch {}
            return updated;
          }
          return prev;
        });
      }
    }
  }, [recipes]);

  // Auth Listener (Firebase Auth + Active / Demo User)
  useEffect(() => {
    // 1. Check for Active / Demo User in local storage for instant offline boot
    const activeUser = getActiveUser();
    if (activeUser) {
      setUser({ id: activeUser.uid, email: activeUser.email, displayName: activeUser.displayName });
      setAppUser(activeUser);
      if (activeUser.isApproved) {
        setViewState('DASHBOARD');
      } else {
        setViewState('PENDING');
      }
      setIsLoading(false);
    }

    // 2. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isAdminEmail = isUserAdmin({ email: fbUser.email || '' });
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as AppUser;
            let currentProfile: AppUser = { ...data, uid: fbUser.uid };
            if (isAdminEmail && (!currentProfile.isApproved || currentProfile.role !== 'admin')) {
              currentProfile.isApproved = true;
              currentProfile.role = 'admin';
              await setDoc(userDocRef, currentProfile, { merge: true });
            }
            saveActiveUser(currentProfile);
            setAppUser(currentProfile);
            setUser({ id: currentProfile.uid, email: currentProfile.email, displayName: currentProfile.displayName });
            setViewState(currentProfile.isApproved ? 'DASHBOARD' : 'PENDING');
          } else {
            const newUser: AppUser = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Chef',
              teacherName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Chef',
              teacherLogo: fbUser.photoURL || (isAdminEmail ? 'https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e' : ''),
              instituteName: 'IES La Flota',
              instituteLogo: '',
              isApproved: isAdminEmail,
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: Date.now(),
              workspaceId: fbUser.uid
            };
            await setDoc(userDocRef, newUser);
            saveActiveUser(newUser);
            setAppUser(newUser);
            setUser({ id: newUser.uid, email: newUser.email, displayName: newUser.displayName });
            setViewState(newUser.isApproved ? 'DASHBOARD' : 'PENDING');
          }
        } catch (e) {
          console.warn("Error fetching user profile from Firestore:", e);
          const fallbackUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Chef',
            teacherName: fbUser.displayName || 'Chef',
            isApproved: true,
            role: isAdminEmail ? 'admin' : 'user',
            createdAt: Date.now(),
            workspaceId: fbUser.uid
          };
          saveActiveUser(fallbackUser);
          setAppUser(fallbackUser);
          setUser({ id: fallbackUser.uid, email: fallbackUser.email, displayName: fallbackUser.displayName });
          setViewState('DASHBOARD');
        } finally {
          setIsLoading(false);
        }
      } else {
        const active = getActiveUser();
        if (active) {
          setUser({ id: active.uid, email: active.email, displayName: active.displayName });
          setAppUser(active);
          setViewState('DASHBOARD');
        } else {
          const defaultUser = loginDemoUser('jcbmisweb@gmail.com', 'Juan Codina');
          setUser({ id: defaultUser.uid, email: defaultUser.email, displayName: defaultUser.displayName });
          setAppUser(defaultUser);
          setViewState('DASHBOARD');
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase Firestore Data Sync & Realtime Subscriptions
  useEffect(() => {
    const isActuallyAdmin = isUserAdmin(appUser);
    const isActuallyApproved = appUser?.isApproved || isActuallyAdmin;

    if (!user || (!isActuallyApproved && !isActuallyAdmin)) {
      if (user && appUser && !isActuallyApproved && !isActuallyAdmin) {
        setViewState('PENDING');
      }
      return;
    }

    setViewState('DASHBOARD');

    // 1. Recipes: La comprobación se realiza una sola vez al comenzar el día (executeDailyVerification).
    // NO se ejecuta un onSnapshot continuo para evitar saturar la cuota de Firebase y garantizar que el disco local NUNCA sea sobrescrito.
    const unsubRecipes = () => {};

    // 2. Products subscription (with localDB merge)
    const unsubProducts = onSnapshot(collection(db, 'products'), async (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      try {
        const localItems = await localDB.products.toArray();
        const map = new Map<string, Product>();
        loaded.forEach(p => { if (p.id) map.set(p.id, p); });
        localItems.forEach(p => { if (p.id) map.set(p.id, p); });
        const merged = Array.from(map.values());
        if (merged.length > 0) {
          setProductDatabase(merged);
          try { localStorage.setItem('cached_products', JSON.stringify(merged)); } catch {}
        }
      } catch (_) {
        if (loaded.length > 0) {
          setProductDatabase(loaded);
          try { localStorage.setItem('cached_products', JSON.stringify(loaded)); } catch {}
        }
      }
    }, (err) => console.warn("Firestore products onSnapshot warning:", err));

    // 3. MenuPlans subscription
    const unsubMenus = onSnapshot(collection(db, 'menuPlans'), (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuPlan));
      if (loaded.length > 0) {
        setSavedMenus(loaded);
        try { localStorage.setItem('cached_menus', JSON.stringify(loaded)); } catch {}
      }
    }, (err) => console.warn("Firestore menuPlans onSnapshot warning:", err));

    // 4. Settings subscription (con fusión inteligente de categorías y protección de timestamp)
    const targetWorkspace = appUser?.workspaceId || user?.id || 'default';
    const mergeIncomingSettings = (loaded: AppSettings) => {
      setSettings(prev => {
        const localTime = prev.lastModified || 0;
        const remoteTime = loaded.lastModified || 0;

        // Fusión unión de categorías: NUNCA perder ninguna categoría existente en local ni en remoto
        const unionCategories = Array.from(new Set([
          ...(prev.categories || []),
          ...(loaded.categories || [])
        ])).filter(Boolean);

        const unionConfigs = [...(prev.categoryConfigs || [])];
        (loaded.categoryConfigs || []).forEach(rc => {
          if (!unionConfigs.some(lc => lc.name === rc.name)) {
            unionConfigs.push(rc);
          }
        });

        const merged: AppSettings = {
          ...loaded,
          ...prev,
          categories: unionCategories,
          categoryConfigs: unionConfigs,
          lastModified: Math.max(localTime, remoteTime)
        };

        try { localStorage.setItem('app_settings', JSON.stringify(merged)); } catch {}
        return merged;
      });
    };

    const unsubSettingsGlobal = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        mergeIncomingSettings(snap.data() as AppSettings);
      }
    }, (err) => console.warn("Firestore global settings onSnapshot warning:", err));

    let unsubSettingsWorkspace = () => {};
    if (targetWorkspace && targetWorkspace !== 'global') {
      unsubSettingsWorkspace = onSnapshot(doc(db, 'settings', targetWorkspace), (snap) => {
        if (snap.exists()) {
          mergeIncomingSettings(snap.data() as AppSettings);
        }
      }, (err) => console.warn("Firestore workspace settings onSnapshot warning:", err));
    }

    // 5. ProRecipes subscription
    const unsubPro = onSnapshot(collection(db, 'proRecipes'), (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProRecipe));
      if (loaded.length > 0) {
        setProRecipes(prev => {
          const remoteMap = new Map(loaded.map(p => [p.id, p]));
          const merged = [...loaded];
          prev.forEach(localP => {
            if (!remoteMap.has(localP.id) || localP.synced === false) {
              const idx = merged.findIndex(p => p.id === localP.id);
              if (idx >= 0) merged[idx] = localP;
              else merged.push(localP);
            }
          });
          try { localStorage.setItem('cached_pro_recipes', JSON.stringify(merged)); } catch {}
          return merged;
        });
        seedProRecipesLocal(loaded);
      }
    }, (err) => {
      console.warn("Firestore proRecipes onSnapshot warning:", err);
    });

    return () => {
      unsubRecipes();
      unsubProducts();
      unsubMenus();
      unsubSettingsGlobal();
      unsubSettingsWorkspace();
      unsubPro();
    };
  }, [user, appUser]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      alert('Error al iniciar sesión con Google: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEnterDemo = () => {
    const demo = loginDemoUser('jcbmisweb@gmail.com', 'Juan Codina');
    setUser({ id: demo.uid, email: demo.email, displayName: demo.displayName });
    setAppUser(demo);
    setViewState('DASHBOARD');
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    saveActiveUser(null);
    setUser(null);
    setAppUser(null);
    setViewState('LANDING');
    setCurrentRecipe(null);
  };

  const handleCreateNew = () => { setCurrentRecipe(null); setViewState('EDITOR'); };

  const migrateRecipeIfNeeded = (r: Recipe): Recipe => {
    if (!r) return r;
    const legacy = r as any;
    const updatedSubRecipes = (legacy.subRecipes || []).map((sr: any, idx: number) => {
      let photos = sr.photos;
      if (!photos && sr.photo) photos = [sr.photo];
      if (!photos) photos = [];
      return {
        id: sr.id || `sub-${idx + 1}`,
        name: sr.name || `Elaboración ${idx + 1}`,
        ingredients: Array.isArray(sr.ingredients) ? sr.ingredients : [],
        instructions: sr.instructions || '',
        photos
      };
    });

    const migrated: Recipe = {
      ...r,
      name: r.name || 'Sin título',
      yieldQuantity: r.yieldQuantity || 4,
      yieldUnit: r.yieldUnit || 'pax',
      creator: legacy.creator || appUser?.teacherName || appUser?.displayName || settings.instituteName,
      subRecipes: updatedSubRecipes.length > 0 ? updatedSubRecipes : [{
        id: 'legacy-1',
        name: 'Elaboración Principal',
        ingredients: legacy.ingredients || [],
        instructions: legacy.instructions || '',
        photos: legacy.photo ? [legacy.photo] : []
      }],
      serviceDetails: r.serviceDetails || {
        presentation: '',
        servingTemp: '',
        cutlery: '',
        passTime: '',
        serviceType: '',
        clientDescription: ''
      },
      platingInstructions: legacy.platingInstructions || ''
    };

    if (productDatabase && productDatabase.length > 0) {
      return reconcileRecipeWithCatalog(migrated, productDatabase);
    }
    return migrated;
  };

  const handleEdit = async (recipe: Recipe) => {
    let recipeToEdit = migrateRecipeIfNeeded(recipe);

    // Si viene del listado ligero y no tiene subRecetas cargadas, recuperarlas bajo demanda
    if (recipe.id && (!recipe.subRecipes || recipe.subRecipes.length === 0)) {
      try {
        const docSnap = await getDoc(doc(db, 'recipes', recipe.id));
        if (docSnap.exists()) {
          recipeToEdit = migrateRecipeIfNeeded({ id: docSnap.id, ...docSnap.data() } as Recipe);
        }
      } catch (err) {
        console.warn("No se pudieron cargar subrecetas adicionales para editar:", err);
      }
    }

    const isActuallyAdmin = isUserAdmin(appUser);
    if (!isActuallyAdmin && appUser && recipeToEdit.workspaceId && recipeToEdit.workspaceId !== appUser.workspaceId) {
      // Duplicate community recipe for standard non-admin users
      recipeToEdit = {
        ...recipeToEdit,
        id: Date.now().toString(),
        workspaceId: appUser.workspaceId,
        isPublic: false,
        originalAuthor: recipeToEdit.creator,
        name: `${recipeToEdit.name} (Copia)`
      };
    }
    setCurrentRecipe(recipeToEdit);
    setViewState('EDITOR');
  };

  const handleView = async (recipe: Recipe) => {
    const migrated = migrateRecipeIfNeeded(recipe);
    setCurrentRecipe(migrated);
    setViewState('VIEWER');

    // Si la receta viene del índice sin subRecetas o si estamos en equipo personal, asegurar descarga completa
    try {
      const mode = localStorage.getItem('app_device_mode') || 'ies';
      if (recipe.id) {
        // Si falta contenido pesado (subRecipes vacías), traerlo de Firestore
        if (!recipe.subRecipes || recipe.subRecipes.length === 0) {
          const docSnap = await getDoc(doc(db, 'recipes', recipe.id));
          if (docSnap.exists()) {
            const full = { id: docSnap.id, ...docSnap.data() } as Recipe;
            const migratedFull = migrateRecipeIfNeeded(full);
            setCurrentRecipe(migratedFull);
            if (mode === 'personal') {
              await saveRecipeLocal(migratedFull, true);
            }
          }
        } else if (mode === 'personal') {
          // En modo personal se conserva en IndexedDB para disponibilidad offline
          await saveRecipeLocal(migrated, true);
        }
      }
    } catch (e) {
      console.warn("Lazy fetch recipe details warning:", e);
    }
  };

  const handleSave = async (recipe: Recipe, redirect = true) => {
    try {
      const currentUid = user?.id || appUser?.uid || 'user_admin';
      const userWorkspace = appUser?.workspaceId || currentUid;

      // Reconciliación automática y blindada de todos los ingredientes con el catálogo
      const reconciled = (productDatabase && productDatabase.length > 0)
        ? reconcileRecipeWithCatalog(recipe, productDatabase)
        : recipe;

      const recipeToSave: Recipe = {
        ...reconciled,
        workspaceId: reconciled.workspaceId || userWorkspace,
        isPublic: reconciled.isPublic || false,
        creator: appUser?.teacherName || appUser?.displayName || reconciled.creator || settings.teacherName || 'Profesor',
        creatorLogo: appUser?.teacherLogo || reconciled.creatorLogo || '',
        lastModified: Date.now(),
        synced: false
      };

      // 1. PASO 1 (INSTANTÁNEO, 0ms): Actualizar estado de React con la lista completa sin recortes
      setRecipes(prev => {
        const next = [recipeToSave, ...prev.filter(r => r.id !== recipeToSave.id)];
        return next;
      });

      // 2. PASO 2 (INSTANTÁNEO): Redirigir de inmediato al Dashboard
      if (redirect) {
        setViewState('DASHBOARD');
        setCurrentRecipe(null);
      }

      // 3. PASO 3: Guardar en Dexie (disco local del PC) de forma prioritaria
      (async () => {
        try {
          await saveRecipeLocal(recipeToSave, false);
          removeEmergencyDraft(recipeToSave.id);
          appendRecipeHistory(recipeToSave);

          const safeRecipe = await ensureRecipeFitsFirestore(recipeToSave);

          // Si hay conexión y no está agotada la cuota de Firebase, sincronizar en la nube
          if (navigator.onLine && !getIsQuotaExceeded()) {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout de sincronización Firebase')), 10000)
            );
            try {
              await Promise.race([
                setDoc(doc(db, 'recipes', safeRecipe.id), safeRecipe, { merge: true }),
                timeoutPromise
              ]);
              await saveRecipeLocal(safeRecipe, true);
              setRecipes(prev => prev.map(r => r.id === safeRecipe.id ? { ...r, synced: true } : r));
            } catch (syncErr: any) {
              const msg = syncErr?.message || String(syncErr);
              if (msg.includes('Quota') || msg.includes('quota') || syncErr?.code === 'resource-exhausted') {
                console.warn('⚡ Límite de cuota diaria de Firestore alcanzado. La receta queda 100% segura en Local.');
                setIsQuotaExceeded(true);
              } else {
                console.warn('La sincronización con Firebase se completará en segundo plano:', syncErr);
              }
            }
          }
        } catch (bgError) {
          console.warn('Guardado en local completado con éxito. Pendiente de subida a la nube:', bgError);
        }
      })();
    } catch (err: any) {
      console.error("Error al guardar receta:", err);
      setRecipes(prev => [{ ...recipe, synced: false }, ...prev.filter(r => r.id !== recipe.id)]);
      if (redirect) {
        setViewState('DASHBOARD');
        setCurrentRecipe(null);
      }
    }
  };

  const handleTogglePublic = async (recipe: Recipe) => {
    try {
      const newIsPublic = !recipe.isPublic;
      await updateDoc(doc(db, 'recipes', recipe.id), { isPublic: newIsPublic });
      setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, isPublic: newIsPublic } : r));
    } catch (err) {
      console.error("Error toggling public status:", err);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta receta?')) {
      try {
        await deleteDoc(doc(db, 'recipes', id));
        await localDB.recipes.delete(id);
        setRecipes(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error("Error deleting recipe:", err);
      }
    }
  };

  // Handlers para el Taller I+D Profesional
  const handleSelectProRecipe = (recipe: ProRecipe) => {
    setCurrentProRecipe(recipe);
    setViewState('PRO_EDITOR');
  };

  const handleViewPrintProRecipe = (recipe: ProRecipe) => {
    setCurrentProRecipe(recipe);
    setViewState('PRO_VIEWER');
  };

  const handleNewProRecipe = () => {
    const currentUid = user?.id || appUser?.uid || 'chef_id';
    const newPro: ProRecipe = {
      id: `pro-${Date.now()}`,
      code: `FT-DIS-00${proRecipes.length + 1}`,
      version: '1.0',
      status: 'development',
      responsible: appUser?.teacherName || appUser?.displayName || 'Chef I+D',
      workspaceId: appUser?.workspaceId || currentUid,
      createdAt: Date.now(),
      lastModified: Date.now(),
      name: 'Nueva Creación Gastronómica',
      technicalName: '',
      category: 'Platos Principales',
      targetPax: 4,
      concept: 'Investigación culinaria y formulación técnica.',
      starProduct: '',
      storytelling: '',
      heroPhoto: '',
      sketchPhoto: '',
      sensoryProfile: {
        visual: '',
        aroma: '',
        texture: '',
        flavor: '',
        aftertaste: '',
        radar: {
          complexity: 4,
          acidity: 3,
          sweetness: 2,
          bitterness: 2,
          salinity: 3,
          umami: 4,
          fatBalance: 3,
          crunchiness: 3
        }
      },
      components: [
        {
          id: `comp-${Date.now()}-1`,
          code: 'FT-ELA-001',
          name: 'Elaboración Principal',
          family: 'Elemento Principal',
          roleInDish: 'Eje de sabor del plato',
          targetYieldGrams: 300,
          equipmentNeeded: ['Roner', 'Sartén'],
          ingredients: [
            {
              id: `ing-${Date.now()}-1`,
              name: 'Ingrediente Base',
              netGrams: 300,
              bakersPercentage: 100,
              isBase: true,
              notes: 'Fresco de temporada',
              allergens: []
            }
          ],
          processSteps: [
            {
              stepNumber: 1,
              operation: 'Cocción y acabado',
              timeMinutes: 15,
              tempCelsius: '60°C',
              criticalPoint: 'Textura óptima',
              rejectionCriteria: 'Sobrecalentamiento'
            }
          ],
          storage: {
            temperature: '3°C',
            container: 'Gastronorm cerrado',
            shelfLife: '48h'
          }
        }
      ],
      plating: {
        componentsGrammage: [
          {
            componentId: `comp-${Date.now()}-1`,
            componentName: 'Elaboración Principal',
            gramsPerPax: 75,
            tool: 'Pinzas de pase',
            targetTemp: '60°C'
          }
        ],
        mountingSequence: ['1. Disponer en el centro del plato caliente.'],
        tableware: 'Plato cerámico artesanal',
        passTemperature: '55°C',
        maxPassWindowSeconds: 60,
        serviceCutlery: 'Cuchillo y tenedor de diseño',
        serviceNotes: ''
      },
      qualityControl: {
        physicochemical: {
          targetPH: '5.5',
          targetBrix: '',
          viscosityDensity: '',
          coreTemperature: '54°C'
        },
        acceptanceCriteria: ['Punto de cocción preciso', 'Temperatura uniforme'],
        rejectionCriteria: ['Plato frío', 'Desviación estética'],
        tastingHistory: []
      },
      traceability: {
        approvedShelfLife: '48h en cámara controlada',
        validatedStorage: 'Cámara 2-4°C',
        versionHistory: [
          {
            version: '1.0',
            date: new Date().toISOString().split('T')[0],
            author: appUser?.teacherName || 'Chef I+D',
            changeSummary: 'Apertura de ficha técnica',
            reason: 'Nueva línea creativa'
          }
        ]
      }
    };

    handleSaveProRecipe(newPro);
    setCurrentProRecipe(newPro);
    setViewState('PRO_EDITOR');
  };

  const handleSaveProRecipe = async (updated: ProRecipe) => {
    try {
      const toSave: ProRecipe = {
        ...updated,
        lastModified: Date.now(),
        synced: false
      };

      // 1. Guardar de forma inmediata en el estado de React y localStorage (0ms)
      setProRecipes(prev => {
        const next = [toSave, ...prev.filter(p => p.id !== toSave.id)];
        try {
          localStorage.setItem('cached_pro_recipes', JSON.stringify(next));
        } catch (e) {
          console.warn("localStorage cached_pro_recipes error:", e);
        }
        return next;
      });
      setCurrentProRecipe(toSave);

      // 2. Guardar prioritariamente en Dexie IndexedDB en el disco local del PC
      await saveProRecipeLocal(toSave, false);

      // 3. Sincronización en la nube (Firestore) en segundo plano
      (async () => {
        try {
          if (navigator.onLine && !getIsQuotaExceeded()) {
            // Limpiar valores undefined para que Firestore no rechace el payload
            const cleanToSave = JSON.parse(JSON.stringify(toSave));

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout de sincronización Firebase')), 10000)
            );

            await Promise.race([
              Promise.all([
                setDoc(doc(db, 'proRecipes', cleanToSave.id), cleanToSave, { merge: true }),
                setDoc(doc(db, 'pro_recipes', cleanToSave.id), cleanToSave, { merge: true })
              ]),
              timeoutPromise
            ]);

            // Marcar como sincronizado localmente
            await saveProRecipeLocal(cleanToSave, true);
            setProRecipes(prev => prev.map(p => p.id === cleanToSave.id ? { ...p, synced: true } : p));
          }
        } catch (syncErr: any) {
          const msg = syncErr?.message || String(syncErr);
          if (msg.includes('Quota') || msg.includes('quota') || syncErr?.code === 'resource-exhausted') {
            console.warn('⚡ Límite de cuota diaria de Firestore alcanzado. La ficha I+D queda 100% segura en Local.');
            setIsQuotaExceeded(true);
          } else {
            console.warn('Sincronización de ficha I+D con Firebase en segundo plano:', syncErr);
          }
        }
      })();
    } catch (err: any) {
      console.error("Error al guardar ficha I+D:", err);
      setProRecipes(prev => [updated, ...prev.filter(p => p.id !== updated.id)]);
      try {
        await saveProRecipeLocal(updated, false);
      } catch {}
    }
  };

  const handleDeleteProRecipe = async (id: string) => {
    try {
      setProRecipes(prev => {
        const next = prev.filter(p => p.id !== id);
        try {
          localStorage.setItem('cached_pro_recipes', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      await deleteProRecipeLocal(id);

      if (navigator.onLine && !getIsQuotaExceeded()) {
        try {
          await Promise.all([
            deleteDoc(doc(db, 'proRecipes', id)),
            deleteDoc(doc(db, 'pro_recipes', id))
          ]);
        } catch (syncErr) {
          console.warn("Firestore delete pro recipe warning:", syncErr);
        }
      }
    } catch (err: any) {
      console.error("Error deleting pro recipe:", err);
    }
  };

  const handleDuplicateProRecipe = async (original: ProRecipe) => {
    const newVersion = `${parseFloat(original.version) + 0.1}`.slice(0, 3);
    const duplicated: ProRecipe = {
      ...original,
      id: `pro-${Date.now()}`,
      code: `${original.code}-BIS`,
      version: newVersion,
      status: 'development',
      createdAt: Date.now(),
      lastModified: Date.now(),
      traceability: {
        ...original.traceability,
        versionHistory: [
          ...(original.traceability?.versionHistory || []),
          {
            version: newVersion,
            date: new Date().toISOString().split('T')[0],
            author: appUser?.teacherName || 'Chef I+D',
            changeSummary: `Duplicado a partir de ${original.code} v${original.version}`,
            reason: 'Nueva variante de investigación'
          }
        ]
      }
    };
    await handleSaveProRecipe(duplicated);
  };

  const handleDuplicateRecipe = (original: Recipe) => {
    const duplicated: Recipe = {
      ...original,
      id: `recipe-${Date.now()}`,
      name: `${original.name} (Copia)`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      isPublic: false
    };
    setCurrentRecipe(duplicated);
    setViewState('EDITOR');
  };

  const handleImportFromAcademic = (academic: Recipe) => {
    const currentUid = user?.id || appUser?.uid || '';
    const newProId = `pro-imp-${Date.now()}`;
    
    const components = (academic.subRecipes || []).map((sub, sIdx) => {
      const rawIngs = (sub.ingredients || []).map((ing, iIdx) => {
        const net = parseFloat(ing.quantity) || (iIdx === 0 ? 200 : 50);
        return {
          id: `ing-${Date.now()}-${sIdx}-${iIdx}`,
          name: ing.name,
          netGrams: net,
          bakersPercentage: 0,
          isBase: iIdx === 0,
          notes: ing.category || '',
          allergens: ing.allergens || []
        };
      });

      const baseWeight = rawIngs[0]?.netGrams || 100;
      const ingredientsWithPct = rawIngs.map((ing, iIdx) => ({
        ...ing,
        bakersPercentage: iIdx === 0 ? 100 : parseFloat(((ing.netGrams / baseWeight) * 100).toFixed(1))
      }));

      const lines = (sub.instructions || '').split('\n').filter(l => l.trim().length > 0);
      const processSteps = lines.length > 0 
        ? lines.map((line, pIdx) => ({
            stepNumber: pIdx + 1,
            operation: line.replace(/^\d+[\.\-\)]\s*/, '').trim(),
            timeMinutes: 15,
            tempCelsius: '65°C',
            criticalPoint: 'Textura y cocción homogénea',
            rejectionCriteria: 'Cocción irregular'
          }))
        : [
            {
              stepNumber: 1,
              operation: sub.instructions || 'Elaboración y cocción técnica',
              timeMinutes: 20,
              tempCelsius: '70°C',
              criticalPoint: 'Punto óptimo',
              rejectionCriteria: 'Sobrecalentamiento'
            }
          ];

      return {
        id: `comp-${Date.now()}-${sIdx}`,
        code: `FT-ELA-00${sIdx + 1}`,
        name: sub.name || `Componente ${sIdx + 1}`,
        family: (sIdx === 0 ? 'Elemento Principal' : sIdx === 1 ? 'Salsa / Jugo' : 'Guarnición') as any,
        roleInDish: `Componente ${sIdx + 1} del plato`,
        targetYieldGrams: Math.round(ingredientsWithPct.reduce((acc, i) => acc + i.netGrams, 0)),
        equipmentNeeded: ['Utillaje de cocina profesional'],
        ingredients: ingredientsWithPct,
        processSteps,
        storage: {
          temperature: '3°C',
          container: 'Recipiente gastronorm sellado',
          shelfLife: '48 horas'
        }
      };
    });

    const importedPro: ProRecipe = {
      id: newProId,
      code: `FT-PRO-00${proRecipes.length + 1}`,
      version: '1.0',
      status: 'development',
      responsible: appUser?.teacherName || appUser?.displayName || 'Chef I+D',
      workspaceId: appUser?.workspaceId || currentUid,
      createdAt: Date.now(),
      lastModified: Date.now(),
      name: academic.name,
      technicalName: `${academic.name} · Protocolo I+D`,
      category: academic.category || 'Alta Gastronomía',
      targetPax: academic.yieldQuantity || 4,
      concept: academic.serviceDetails?.clientDescription || 'Adaptación técnica a estándar de alta gastronomía.',
      starProduct: academic.name,
      storytelling: academic.serviceDetails?.clientDescription || '',
      heroPhoto: academic.photo || '',
      sketchPhoto: '',
      sensoryProfile: {
        visual: academic.serviceDetails?.presentation || 'Emplatado contemporáneo',
        aroma: 'Aroma fresco y equilibrado',
        texture: 'Contraste armonioso de texturas',
        flavor: 'Sabor intenso con acidez calibrada',
        aftertaste: 'Persistente y limpio',
        radar: {
          complexity: 4,
          acidity: 3,
          sweetness: 2,
          bitterness: 2,
          salinity: 3,
          umami: 4,
          fatBalance: 3,
          crunchiness: 3
        }
      },
      components,
      plating: {
        componentsGrammage: components.map(c => ({
          componentId: c.id,
          componentName: c.name,
          gramsPerPax: Math.round(c.targetYieldGrams / Math.max(1, academic.yieldQuantity || 4)),
          tool: 'Pinzas / Cuchara de pase',
          targetTemp: academic.serviceDetails?.servingTemp || '60°C'
        })),
        mountingSequence: academic.platingInstructions ? academic.platingInstructions.split('\n').filter(l => l.trim()) : ['1. Emplatar con precisión milimétrica'],
        tableware: academic.serviceDetails?.cutlery || 'Vajilla contemporánea de diseño',
        passTemperature: academic.serviceDetails?.servingTemp || '60°C',
        maxPassWindowSeconds: 60,
        serviceCutlery: academic.serviceDetails?.cutlery || 'Cubiertos de alta gama',
        serviceNotes: academic.serviceDetails?.passTime ? `Tiempo en pase: ${academic.serviceDetails.passTime}` : ''
      },
      qualityControl: {
        physicochemical: {
          targetPH: '5.5',
          targetBrix: '—',
          viscosityDensity: 'Equilibrada',
          coreTemperature: academic.serviceDetails?.tempHot || '58°C'
        },
        acceptanceCriteria: [
          'Temperatura de servicio estricta en pase',
          'Textura y brillo impecables en salsas y guarniciones'
        ],
        rejectionCriteria: [
          'Desviación térmica superior a 5°C',
          'Falta de pulcritud en el ala del plato'
        ],
        tastingHistory: []
      },
      traceability: {
        approvedShelfLife: '48 horas en cámara técnica',
        validatedStorage: 'Cámara 2-4°C en recipientes rotulados con fecha y lote',
        versionHistory: [
          {
            version: '1.0',
            date: new Date().toISOString().split('T')[0],
            author: appUser?.teacherName || 'Chef I+D',
            changeSummary: `Importación inicial desde recetario escolar ("${academic.name}")`,
            reason: 'Apertura de ficha técnica para taller de alta gastronomía'
          }
        ],
        totalDishCost: academic.totalCost,
        costPerPax: academic.totalCost ? academic.totalCost / (academic.yieldQuantity || 4) : undefined,
        targetFoodCostPercentage: 25
      }
    };

    handleSaveProRecipe(importedPro);
    setCurrentProRecipe(importedPro);
    setViewState('PRO_EDITOR');
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const settingsToSave: AppSettings = {
        ...newSettings,
        lastModified: Date.now()
      };

      // 1. Guardado local-first inmediato (0ms de latencia en React + memoria de navegador)
      setSettings(settingsToSave);
      try {
        localStorage.setItem('app_settings', JSON.stringify(settingsToSave));
      } catch (e) {
        console.warn("Error saving settings to localStorage:", e);
      }

      // 2. Guardado en Firestore en segundo plano (en 'global' y en el workspace del usuario)
      const targetWorkspace = appUser?.workspaceId || user?.id || 'default';
      await setDoc(doc(db, 'settings', 'global'), settingsToSave, { merge: true });
      if (targetWorkspace && targetWorkspace !== 'global') {
        await setDoc(doc(db, 'settings', targetWorkspace), settingsToSave, { merge: true });
      }
    } catch (err) {
      console.warn("Ajustes guardados en local. Sincronización en la nube pendiente:", err);
    }
  };

  const handleUpdateUser = async (updatedUser: Partial<AppUser>) => {
    if (!appUser) return;
    try {
      const merged = { ...appUser, ...updatedUser };
      await updateDoc(doc(db, 'users', appUser.uid), updatedUser);
      setAppUser(merged);
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!appUser) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Tus fichas pasarán a la comunidad.")) return;

    try {
      await deleteDoc(doc(db, 'users', appUser.uid));
      await firebaseLogout();
      setAppUser(null);
      setUser(null);
      setViewState('LANDING');
    } catch (e: any) {
      console.error(e);
      alert("Hubo un error al eliminar la cuenta.");
    }
  };

  const handleInviteUser = async (email: string) => {
    if (!appUser) return;
    try {
      const inviteId = Date.now().toString();
      await setDoc(doc(db, 'workspace_invites', inviteId), {
        id: inviteId,
        email: email.toLowerCase(),
        workspaceId: appUser.workspaceId,
        inviterName: appUser.displayName || appUser.email,
        createdAt: Date.now()
      });
      alert(`Invitación enviada a ${email}`);
    } catch (err) {
      console.error("Error inviting user:", err);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      const validId = product.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const currentUid = user?.id || appUser?.uid || 'local-user';
      const isActuallyAdmin = isUserAdmin(appUser);
      const parsedPrice = typeof product.pricePerUnit === 'number'
        ? product.pricePerUnit
        : (parseFloat(String(product.pricePerUnit || 0).replace(',', '.')) || 0);

      const productToSave: Product = {
        ...product,
        id: validId,
        name: (product.name || '').trim().toUpperCase(),
        category: (product.category || 'VARIOS').trim().toUpperCase(),
        pricePerUnit: parsedPrice,
        unit: product.unit || 'kg',
        allergens: Array.isArray(product.allergens) ? product.allergens : [],
        status: isActuallyAdmin ? 'approved' : (product.status || 'pending'),
        requestedBy: product.requestedBy || currentUid,
        lastModified: Date.now(),
        synced: false
      };

      // 1. Guardar de forma inmediata en el estado de React y localStorage (0ms)
      setProductDatabase(prev => {
        const next = [productToSave, ...prev.filter(p => p.id !== productToSave.id)];
        try {
          localStorage.setItem('cached_products', JSON.stringify(next));
        } catch (e) {
          console.warn("localStorage cached_products error:", e);
        }
        return next;
      });

      // 2. Guardar prioritariamente en Dexie IndexedDB en el disco local
      await saveProductLocal(productToSave, false);

      // 3. Sincronizar automáticamente con todas las fichas técnicas locales que contengan este ingrediente
      const cleanProdName = normalizeText(productToSave.name);
      const updatedRecipes: Recipe[] = [];

      for (const recipe of recipes) {
        let changed = false;
        const newSubRecipes = (recipe.subRecipes || []).map(sub => {
          let subChanged = false;
          const newIngs = (sub.ingredients || []).map(ing => {
            if (normalizeText(ing.name) === cleanProdName) {
              changed = true;
              subChanged = true;
              const cost = calculateIngredientCost(
                ing.quantity,
                ing.unit || productToSave.unit,
                productToSave.pricePerUnit,
                productToSave.unit,
                productToSave.weightPerUnit
              );
              return {
                ...ing,
                name: productToSave.name,
                category: productToSave.category || ing.category,
                pricePerUnit: productToSave.pricePerUnit,
                baseUnit: productToSave.unit,
                unit: ing.unit || productToSave.unit,
                weightPerUnit: productToSave.weightPerUnit ?? ing.weightPerUnit,
                allergens: productToSave.allergens || [],
                cost: cost || ing.cost,
                isInternalPrep: false,
                isNonProduct: false
              };
            }
            return ing;
          });
          return subChanged ? { ...sub, ingredients: newIngs } : sub;
        });

        if (changed) {
          let totalCost = 0;
          newSubRecipes.forEach(sub => {
            sub.ingredients?.forEach(ing => {
              if (ing.cost) totalCost += ing.cost;
            });
          });

          const updatedRecipe: Recipe = {
            ...recipe,
            subRecipes: newSubRecipes,
            totalCost: totalCost > 0 ? totalCost : recipe.totalCost,
            lastModified: Date.now()
          };
          updatedRecipes.push(updatedRecipe);
          await saveRecipeLocal(updatedRecipe, false);
        }
      }

      if (updatedRecipes.length > 0) {
        setRecipes(prev => prev.map(r => {
          const found = updatedRecipes.find(u => u.id === r.id);
          return found || r;
        }));
        try {
          const allUpdated = recipes.map(r => {
            const found = updatedRecipes.find(u => u.id === r.id);
            return found || r;
          });
          localStorage.setItem('cached_recipes', JSON.stringify(allUpdated));
        } catch (e) {}
      }

      // 4. Sincronización en la nube (Firestore) en segundo plano sin bloquear la interfaz
      (async () => {
        try {
          if (navigator.onLine && !getIsQuotaExceeded()) {
            const cleanToSave = JSON.parse(JSON.stringify(productToSave));
            await setDoc(doc(db, 'products', cleanToSave.id), cleanToSave, { merge: true });
            await saveProductLocal(cleanToSave, true);
            setProductDatabase(prev => prev.map(p => p.id === cleanToSave.id ? { ...p, synced: true } : p));

            for (const ur of updatedRecipes) {
              try {
                const cleanRecipe = JSON.parse(JSON.stringify(ur));
                await setDoc(doc(db, 'recipes', cleanRecipe.id), cleanRecipe, { merge: true });
                await saveRecipeLocal(cleanRecipe, true);
              } catch {}
            }
          }
        } catch (syncErr: any) {
          console.warn("Sincronización en la nube de producto (Firebase):", syncErr);
        }
      })();
    } catch (err) {
      console.error("Error al procesar alta de producto:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await localDB.products.delete(id);
      setProductDatabase(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleReplaceIngredientInRecipes = async (oldName: string, newProduct: Product) => {
    setIsLoading(true);
    try {
      const cleanOld = normalizeText(oldName);
      const updatedRecipes: Recipe[] = [];
      
      for (const recipe of recipes) {
        let changed = false;
        const newSubRecipes = (recipe.subRecipes || []).map(sub => {
          let subChanged = false;
          const newIngs = (sub.ingredients || []).map(ing => {
            if (normalizeText(ing.name) === cleanOld) {
              changed = true;
              subChanged = true;
              const cost = calculateIngredientCost(
                ing.quantity, 
                ing.unit || newProduct.unit, 
                newProduct.pricePerUnit, 
                newProduct.unit, 
                newProduct.weightPerUnit
              );
              const diffNote = extractDifferenceNote(ing.name, newProduct.name);
              return {
                ...ing,
                originalName: ing.originalName || ing.name,
                name: newProduct.name,
                notes: diffNote || ing.notes,
                allergens: newProduct.allergens || ing.allergens || [],
                pricePerUnit: newProduct.pricePerUnit,
                baseUnit: newProduct.unit,
                weightPerUnit: newProduct.weightPerUnit || ing.weightPerUnit,
                cost: cost || ing.cost
              };
            }
            return ing;
          });
          return subChanged ? { ...sub, ingredients: newIngs } : sub;
        });

        if (changed) {
          let totalCost = 0;
          newSubRecipes.forEach(sub => {
            sub.ingredients?.forEach(ing => {
              if (ing.cost) totalCost += ing.cost;
            });
          });

          const updatedRecipe: Recipe = {
            ...recipe,
            subRecipes: newSubRecipes,
            totalCost: totalCost > 0 ? totalCost : recipe.totalCost,
            lastModified: Date.now()
          };
          updatedRecipes.push(updatedRecipe);
          await setDoc(doc(db, 'recipes', updatedRecipe.id), updatedRecipe, { merge: true });
          await saveRecipeLocal(updatedRecipe, true);
        }
      }

      if (updatedRecipes.length > 0) {
        setRecipes(prev => prev.map(r => {
          const found = updatedRecipes.find(u => u.id === r.id);
          return found || r;
        }));
        try {
          const allUpdated = recipes.map(r => {
            const found = updatedRecipes.find(u => u.id === r.id);
            return found || r;
          });
          localStorage.setItem('cached_recipes', JSON.stringify(allUpdated));
        } catch (e) {}
        alert(`✅ Se ha cambiado "${oldName}" por "${newProduct.name}" en ${updatedRecipes.length} receta(s) con éxito.\nSe han actualizado automáticamente sus alérgenos y precios.`);
      } else {
        alert(`No se encontraron recetas activas que contengan "${oldName}".`);
      }
    } catch (err) {
      console.error("Error sustituyendo ingrediente:", err);
      alert("Hubo un error al actualizar las recetas con el producto seleccionado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkIngredientAsInternalPrep = async (ingName: string) => {
    setIsLoading(true);
    try {
      const cleanTarget = normalizeText(ingName);
      const updatedRecipes: Recipe[] = [];
      
      for (const recipe of recipes) {
        let changed = false;
        const newSubRecipes = (recipe.subRecipes || []).map(sub => {
          let subChanged = false;
          const newIngs = (sub.ingredients || []).map(ing => {
            if (normalizeText(ing.name) === cleanTarget) {
              changed = true;
              subChanged = true;
              return {
                ...ing,
                isInternalPrep: true
              };
            }
            return ing;
          });
          return subChanged ? { ...sub, ingredients: newIngs } : sub;
        });

        if (changed) {
          const updatedRecipe: Recipe = {
            ...recipe,
            subRecipes: newSubRecipes,
            lastModified: Date.now()
          };
          updatedRecipes.push(updatedRecipe);
          await setDoc(doc(db, 'recipes', updatedRecipe.id), updatedRecipe, { merge: true });
          await saveRecipeLocal(updatedRecipe, true);
        }
      }

      if (updatedRecipes.length > 0) {
        setRecipes(prev => prev.map(r => {
          const found = updatedRecipes.find(u => u.id === r.id);
          return found || r;
        }));
        try {
          const allUpdated = recipes.map(r => {
            const found = updatedRecipes.find(u => u.id === r.id);
            return found || r;
          });
          localStorage.setItem('cached_recipes', JSON.stringify(allUpdated));
        } catch (e) {}
        alert(`🍽️ "${ingName}" marcado como "Pertenece a la ficha / Elaboración interna" en ${updatedRecipes.length} receta(s).\nYa no figurará como producto pendiente de inventario.`);
      }
    } catch (err) {
      console.error("Error marcando ingrediente como elaboración interna:", err);
      alert("Hubo un error al actualizar las recetas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkIngredientAsNonProduct = async (ingName: string) => {
    setIsLoading(true);
    try {
      const cleanTarget = normalizeText(ingName);
      const updatedRecipes: Recipe[] = [];
      
      for (const recipe of recipes) {
        let changed = false;
        const newSubRecipes = (recipe.subRecipes || []).map(sub => {
          let subChanged = false;
          const newIngs = (sub.ingredients || []).map(ing => {
            if (normalizeText(ing.name) === cleanTarget) {
              changed = true;
              subChanged = true;
              return {
                ...ing,
                isNonProduct: true,
                isInternalPrep: false
              };
            }
            return ing;
          });
          return subChanged ? { ...sub, ingredients: newIngs } : sub;
        });

        if (changed) {
          const updatedRecipe: Recipe = {
            ...recipe,
            subRecipes: newSubRecipes,
            lastModified: Date.now()
          };
          updatedRecipes.push(updatedRecipe);
          await setDoc(doc(db, 'recipes', updatedRecipe.id), updatedRecipe, { merge: true });
          await saveRecipeLocal(updatedRecipe, true);
        }
      }

      if (updatedRecipes.length > 0) {
        setRecipes(prev => prev.map(r => {
          const found = updatedRecipes.find(u => u.id === r.id);
          return found || r;
        }));
        try {
          const allUpdated = recipes.map(r => {
            const found = updatedRecipes.find(u => u.id === r.id);
            return found || r;
          });
          localStorage.setItem('cached_recipes', JSON.stringify(allUpdated));
        } catch (e) {}
        alert(`🚫 "${ingName}" marcado como "No es un producto inventariable" en ${updatedRecipes.length} receta(s).\nYa no figurará como pendiente de inventario.`);
      }
    } catch (err) {
      console.error("Error marcando ingrediente como no producto:", err);
      alert("Hubo un error al actualizar las recetas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMenu = async (menu: MenuPlan) => {
    try {
      const currentUid = user?.id || appUser?.uid;
      if (!currentUid) return;
      const userWorkspace = appUser?.workspaceId || currentUid;
      const menuToSave = {
        ...menu,
        workspaceId: menu.workspaceId || userWorkspace
      };
      await setDoc(doc(db, 'menu_plans', menuToSave.id), menuToSave, { merge: true });
      await saveMenuPlanLocal(menuToSave, true);
      setSavedMenus(prev => [menuToSave, ...prev.filter(m => m.id !== menuToSave.id)]);
    } catch (err) {
      console.error("Error saving menu to Firestore:", err);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu_plans', id));
      await localDB.menuPlans.delete(id);
      setSavedMenus(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error deleting menu:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
        <p className="text-slate-400 font-medium">Iniciando conexión con Firebase Firestore...</p>
      </div>
    );
  }

  return (
    <>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        initialTab={settingsTab}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        recipes={recipes}
        productDatabase={productDatabase}
        savedMenus={savedMenus}
        appUser={appUser}
        onSave={handleSaveSettings}
        onUpdateUser={handleUpdateUser}
        onInviteUser={handleInviteUser}
        onDeleteAccount={handleDeleteAccount}
        onOpenMigration={() => setIsMigrationOpen(true)}
        onRestore={async (backup: any) => {
          try {
            let count = 0;
            const currentUserId = user?.id || appUser?.uid || '';
            const userWorkspaceId = appUser?.workspaceId || currentUserId;

            if (backup.recipes && Array.isArray(backup.recipes)) {
              for (const r of backup.recipes) {
                const clean = {
                  ...r,
                  id: r.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  workspaceId: userWorkspaceId,
                  creator: r.creator || appUser?.teacherName || 'Profesor',
                  lastModified: Date.now()
                };
                await setDoc(doc(db, 'recipes', clean.id), clean, { merge: true });
                await saveRecipeLocal(clean, true);
                count++;
              }
            }

            if (backup.productDatabase && Array.isArray(backup.productDatabase)) {
              for (const p of backup.productDatabase) {
                await setDoc(doc(db, 'products', p.id), p, { merge: true });
                await saveProductLocal(p, true);
                count++;
              }
            }

            alert(`¡Restauración completada con éxito en Firebase Firestore! (${count} elementos guardados).`);
            setIsSettingsOpen(false);
          } catch (err) {
            console.error("Error restoring backup:", err);
            alert("Error general al procesar el archivo.");
          }
        }}
      />

      {/* Modal de Migración Directa y Respaldo Confiable */}
      <MigrationModal
        isOpen={isMigrationOpen}
        onClose={() => setIsMigrationOpen(false)}
        appUser={appUser}
        settings={settings}
        onRefreshData={handleRefreshAllData}
      />

      {viewState === 'LANDING' ? (
        <LandingPage 
          settings={settings} 
          appUser={appUser} 
          onEnter={handleLogin}
          onEnterDemo={handleEnterDemo}
          onOpenConfig={() => setShowDbModal(true)}
          onLoginSuccess={(loggedUser) => {
            setUser({ id: loggedUser.uid, email: loggedUser.email, displayName: loggedUser.displayName });
            setAppUser(loggedUser);
            if (loggedUser.isApproved) {
              setViewState('DASHBOARD');
            } else {
              setViewState('PENDING');
            }
          }}
        />
      ) : viewState === 'PENDING' ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-amber-500/10 p-6 rounded-full border border-amber-500/20 mb-8">
            <ShieldAlert size={64} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4">Acceso Restringido</h1>
          <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
            Hola <span className="text-white font-bold">{user?.displayName || user?.email}</span>. Tu cuenta ha sido registrada en Firebase Firestore, pero necesitas la aprobación de un administrador para acceder al sistema.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="bg-slate-900 border border-white/5 p-4 rounded-xl text-sm text-slate-500 italic">
              "Ponte en contacto con Juan Codina para que autorice tu acceso."
            </div>
            
            <PendingMessageForm appUser={appUser} />

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-100 flex flex-row">
          {/* Barra Lateral Persistente y Colapsable */}
          <AppSidebar 
            currentView={viewState}
            onNavigate={(newView) => setViewState(newView)}
            recipesCount={recipes.length}
            proRecipesCount={proRecipes.length}
            menusCount={savedMenus.length}
            productsCount={productDatabase.length}
            appUser={appUser}
            settings={settings}
            dbStatus={dbStatus}
            dbLatency={dbLatency}
            onLogout={handleLogout}
            onOpenNewRecipe={handleCreateNew}
            onOpenNewProRecipe={handleNewProRecipe}
            onOpenSettings={() => handleOpenSettings('school')}
            onOpenSchoolSettings={() => handleOpenSettings('school')}
            onOpenDataBackup={() => handleOpenSettings('backup')}
            onOpenMigration={() => setIsMigrationOpen(true)}
            onOpenFlavorLab={() => setShowFlavorLab(true)}
            onOpenDbModal={() => setShowDbModal(true)}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
            syncState={syncState}
            onTriggerSync={() => executeCloudSync(true)}
            onOpenAlphabeticalIndex={() => setIsAlphabeticalIndexOpen(true)}
          />

          {/* Área Principal de Trabajo */}
          <div className="flex-1 min-w-0 flex flex-col">
            {viewState === 'VIEWER' && currentRecipe ? (
              <ErrorBoundary fallbackTitle="Error al cargar la ficha técnica" onReset={() => setViewState('DASHBOARD')}>
                <RecipeView 
                  recipe={currentRecipe} 
                  onBack={() => setViewState('DASHBOARD')} 
                  settings={settings} 
                  onEdit={handleEdit} 
                  appUser={appUser} 
                  onUpgradeToPro={handleImportFromAcademic}
                  onDuplicate={handleDuplicateRecipe}
                  allRecipes={recipes}
                  productDatabase={productDatabase}
                  onSelectRecipe={(r) => { setCurrentRecipe(r); setViewState('VIEWER'); }}
                />
              </ErrorBoundary>
            ) : viewState === 'EDITOR' ? (
              <RecipeEditor 
                initialRecipe={currentRecipe} 
                productDatabase={productDatabase} 
                settings={settings} 
                appUser={appUser}
                onSave={handleSave} 
                onCancel={() => setViewState('DASHBOARD')} 
                onAddProduct={handleSaveProduct}
                allRecipes={recipes}
              />
            ) : viewState === 'AI_BRIDGE' ? (
              <AIBridge 
                settings={settings}
                appUser={appUser}
                productDatabase={productDatabase}
                onBack={() => setViewState('DASHBOARD')}
                onImport={async (recipe) => {
                  await handleSave(recipe);
                  setViewState('DASHBOARD');
                }}
              />
            ) : viewState === 'MENU_PLANNER' ? (
              <MenuPlanner 
                recipes={recipes} 
                settings={settings} 
                appUser={appUser}
                onBack={() => setViewState('DASHBOARD')} 
                productDatabase={productDatabase}
                savedMenus={savedMenus}
                onSaveMenu={handleSaveMenu}
                onDeleteMenu={handleDeleteMenu}
                onUpdateRecipe={handleSave}
              />
            ) : viewState === 'PRODUCT_DB' ? (
              <ErrorBoundary fallbackTitle="Error al cargar el Inventario Maestro" onReset={() => setViewState('DASHBOARD')}>
                <ProductDatabaseViewer 
                  products={productDatabase} 
                  recipes={recipes}
                  appUser={appUser}
                  onBack={() => setViewState('DASHBOARD')} 
                  onAdd={handleSaveProduct} 
                  onEdit={handleSaveProduct} 
                  onDelete={handleDeleteProduct} 
                  onReplaceIngredient={handleReplaceIngredientInRecipes} 
                  onMarkInternalPrep={handleMarkIngredientAsInternalPrep} 
                  onMarkNonProduct={handleMarkIngredientAsNonProduct} 
                  onImport={async (list) => {
                    try {
                      setIsLoading(true);
                      for (const p of list) {
                        await setDoc(doc(db, 'products', p.id), p, { merge: true });
                        await saveProductLocal(p, true);
                      }
                      setProductDatabase(list);
                      alert(`Importación completada: ${list.length} productos sincronizados con Firebase Firestore.`);
                    } catch (err) {
                      console.error("Error importing products:", err);
                      alert("Hubo un error al sincronizar el inventario.");
                    } finally {
                      setIsLoading(false);
                    }
                  }} 
                />
              </ErrorBoundary>
            ) : viewState === 'CALCULATOX' ? (
              <Calculatox onBack={() => setViewState('DASHBOARD')} />
            ) : viewState === 'USER_MANAGEMENT' ? (
              <UserManagement recipes={recipes} onBack={() => setViewState('DASHBOARD')} />
            ) : viewState === 'PRO_WORKSHOP' ? (
              <ProWorkshopHub
                proRecipes={proRecipes}
                academicRecipes={recipes}
                settings={settings}
                onSelectProRecipe={handleSelectProRecipe}
                onViewPrintProRecipe={handleViewPrintProRecipe}
                onNewProRecipe={handleNewProRecipe}
                onImportFromAcademic={handleImportFromAcademic}
                onDeleteProRecipe={handleDeleteProRecipe}
                onDuplicateProRecipe={handleDuplicateProRecipe}
                onOpenGuide={() => setViewState('PRO_GUIDE')}
                onBackToAcademic={() => setViewState('DASHBOARD')}
              />
            ) : viewState === 'PRO_GUIDE' ? (
              <ProWorkshopGuide
                settings={settings}
                onBack={() => setViewState('PRO_WORKSHOP')}
              />
            ) : viewState === 'PRO_EDITOR' && currentProRecipe ? (
              <ProRecipeEditor
                recipe={currentProRecipe}
                settings={settings}
                onSave={handleSaveProRecipe}
                onBack={() => setViewState('PRO_WORKSHOP')}
                onViewPrint={() => setViewState('PRO_VIEWER')}
                onOpenGuide={() => setViewState('PRO_GUIDE')}
              />
            ) : viewState === 'PRO_VIEWER' && currentProRecipe ? (
              <ProRecipePrintView
                recipe={currentProRecipe}
                settings={settings}
                appUser={appUser}
                onBack={() => setViewState('PRO_WORKSHOP')}
                onEdit={() => setViewState('PRO_EDITOR')}
              />
            ) : viewState === 'PROMPT_HUB' ? (
              <PromptHub
                recipes={recipes}
                settings={settings}
                onBack={() => setViewState('DASHBOARD')}
                onNavigateToAIBridge={() => setViewState('AI_BRIDGE')}
              />
            ) : (
              <Dashboard 
                recipes={recipes} 
                settings={settings} 
                savedMenus={savedMenus}
                productDatabase={productDatabase}
                appUser={appUser}
                proRecipesCount={proRecipes.length}
                onNew={handleCreateNew} 
                onEdit={handleEdit} 
                onView={handleView} 
                onDelete={handleDeleteRecipe} 
                onTogglePublic={handleTogglePublic}
                onImport={handleSave} 
                onOpenSettings={() => handleOpenSettings('school')} 
                onOpenMenuPlanner={() => setViewState('MENU_PLANNER')} 
                onOpenProductDB={() => setViewState('PRODUCT_DB')} 
                onOpenAIBridge={() => setViewState('AI_BRIDGE')}
                onOpenPromptHub={() => setViewState('PROMPT_HUB')}
                onOpenAuditModal={() => setIsAuditModalOpen(true)}
                onOpenUserManagement={() => setViewState('USER_MANAGEMENT')}
                onOpenMigration={() => setIsMigrationOpen(true)}
                onOpenProWorkshop={() => setViewState('PRO_WORKSHOP')}
                onLogout={handleLogout} 
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                onDuplicate={handleDuplicateRecipe}
                onOpenAlphabeticalIndex={() => setIsAlphabeticalIndexOpen(true)}
                syncState={syncState}
                onTriggerSync={() => executeCloudSync(true)}
                onRefreshAllData={handleRefreshAllData}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal Flavor Lab (Maridajes y Ciencia del Sabor) */}
      {showFlavorLab && (
        <FlavorLab
          recipes={recipes}
          productDatabase={productDatabase}
          settings={settings}
          onBack={() => setShowFlavorLab(false)}
          onCreateRecipeWithIngredients={() => {
            setShowFlavorLab(false);
            handleCreateNew();
          }}
        />
      )}

      {/* Modal Auditoría de Base de Datos */}
      {isAuditModalOpen && (
        <DatabaseAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          recipes={recipes}
          proRecipes={proRecipes}
          products={productDatabase}
          menus={savedMenus}
          appUser={appUser}
          onRestoreRecipes={async (restored) => {
            for (const r of restored) {
              await handleSave(r, false);
            }
          }}
        />
      )}

      {/* Modal Global de Estado de Base de Datos */}
      {showDbModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Database size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Estado de la Base de Datos</h3>
                <p className="text-xs text-slate-500 font-mono">Firebase Firestore Cloud</p>
              </div>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Conexión Firestore:</span>
                <span className={`font-bold flex items-center gap-1 ${dbStatus === 'connected' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {dbStatus === 'connected' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {dbStatus === 'connected' ? 'En Línea (24/7)' : 'Comprobando...'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Latencia de Respuesta:</span>
                <span className="font-mono font-bold text-slate-900">{dbLatency !== null ? `${dbLatency} ms` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Recetas en Memoria:</span>
                <span className="font-bold text-slate-900">{recipes.length} fichas</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Productos en Inventario:</span>
                <span className="font-bold text-slate-900">{productDatabase.length} ingredientes</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={checkDb} 
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw size={14} className={dbStatus === 'checking' ? 'animate-spin' : ''} />
                Comprobar Conexión
              </button>
              <button 
                onClick={() => setShowDbModal(false)} 
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación / Migración (Local-First IndexedDB + Cloud Sync) */}
      <ErrorBoundary fallbackTitle="Error al abrir el Migrador">
        <MigrationModal
          isOpen={isMigrationOpen}
          onClose={() => setIsMigrationOpen(false)}
          appUser={appUser}
          settings={settings}
          onRefreshData={handleRefreshAllData}
        />
      </ErrorBoundary>

      {/* Modal Directorio Alfabético A-Z de Recetas (Local-First) */}
      <ErrorBoundary fallbackTitle="Error en el Directorio A-Z">
        <RecipeAlphabeticalIndex
          isOpen={isAlphabeticalIndexOpen}
          onClose={() => setIsAlphabeticalIndexOpen(false)}
          recipes={recipes}
          onViewRecipe={(recipe) => {
            setCurrentRecipe(recipe);
            setViewState('VIEWER');
            setIsAlphabeticalIndexOpen(false);
          }}
          onEditRecipe={(recipe) => {
            setCurrentRecipe(recipe);
            setViewState('EDITOR');
            setIsAlphabeticalIndexOpen(false);
          }}
          onTriggerSync={() => executeCloudSync(true)}
          syncState={syncState}
        />
      </ErrorBoundary>
    </>
  );
}

export default App;
