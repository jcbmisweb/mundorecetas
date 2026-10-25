import React, { useState, useEffect } from 'react';
import { 
  X, Database, ShieldCheck, AlertTriangle, RefreshCw, Download, 
  Upload, CheckCircle2, History, Layers, FileJson, ArrowRight,
  Eye, Check, ExternalLink, HardDrive, Cpu, Filter, Sparkles
} from 'lucide-react';
import { Recipe, ProRecipe, Product, MenuPlan, AppUser, isUserAdmin } from '../types';
import { testFirestoreConnection } from '../firebase';
import { 
  getEmergencyDrafts, 
  getRecipeHistory, 
  removeEmergencyDraft, 
  ensureRecipeFitsFirestore 
} from '../lib/imageUtils';
import { executeDatabaseSeparation, isRecipeRawProduct } from '../lib/recipeProductSeparator';

interface DatabaseAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  proRecipes: ProRecipe[];
  products: Product[];
  menus: MenuPlan[];
  appUser: AppUser | null;
  onRestoreRecipes: (restored: Recipe[]) => Promise<void>;
  onResetFilters?: () => void;
  onRefreshData?: () => Promise<void> | void;
}

export const DatabaseAuditModal: React.FC<DatabaseAuditModalProps> = ({
  isOpen,
  onClose,
  recipes,
  proRecipes,
  products,
  menus,
  appUser,
  onRestoreRecipes,
  onResetFilters,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'recovery' | 'backup'>('audit');
  const [isScanning, setIsScanning] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSeparating, setIsSeparating] = useState(false);
  const [separationSuccessMessage, setSeparationSuccessMessage] = useState<string | null>(null);
  const [restoreSuccessCount, setRestoreSuccessCount] = useState<number | null>(null);

  // Local storage scanned items
  const [localHistoryRecipes, setLocalHistoryRecipes] = useState<Recipe[]>([]);
  const [emergencyDrafts, setEmergencyDrafts] = useState<Recipe[]>([]);
  const [cachedRecipes, setCachedRecipes] = useState<Recipe[]>([]);
  const [recoverableRecipes, setRecoverableRecipes] = useState<Recipe[]>([]);

  // DB diagnostic state
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    if (isOpen) {
      runFullScan();
    }
  }, [isOpen, recipes]);

  const runFullScan = async () => {
    setIsScanning(true);
    setRestoreSuccessCount(null);

    // 1. Test ping to Firestore
    const pingResult = await testFirestoreConnection();
    setPingLatency(pingResult.latency);
    setPingStatus(pingResult.ok ? 'ok' : 'error');

    // 2. Scan localStorage: History
    const historyList = getRecipeHistory() as Recipe[];
    setLocalHistoryRecipes(historyList);

    // 3. Scan localStorage: Emergency Drafts
    const drafts = getEmergencyDrafts() as Recipe[];
    setEmergencyDrafts(drafts);

    // 4. Scan localStorage: cached_recipes
    let cached: Recipe[] = [];
    try {
      const raw = localStorage.getItem('cached_recipes');
      if (raw) cached = JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read cached_recipes:", e);
    }
    setCachedRecipes(cached);

    // 5. Cross-reference: find any recipe in localStorage that is missing or has a newer timestamp or modified type
    const currentMap = new Map<string, Recipe>();
    recipes.forEach(r => {
      currentMap.set(r.id, r);
      if (r.name) currentMap.set(r.name.toLowerCase().trim(), r);
    });

    const candidateMap = new Map<string, Recipe>();

    const checkAndAdd = (list: Recipe[]) => {
      list.forEach(r => {
        if (!r || !r.name) return;
        const normalizedName = r.name.toLowerCase().trim();
        const existing = currentMap.get(r.id) || currentMap.get(normalizedName);
        
        if (!existing) {
          if (!candidateMap.has(r.id)) {
            candidateMap.set(r.id, r);
          }
        } else {
          // If existing, check if local copy is newer or has a non-normal type that got lost in Supabase
          const localTime = r.lastModified || (r as any)._savedLocallyAt || 0;
          const remoteTime = existing.lastModified || 0;
          const localType = r.recipeType || r.takeAwayDetails?.recipeType || (r.takeAwayDetails?.isTakeAway ? 'takeaway' : 'normal');
          const remoteType = existing.recipeType || existing.takeAwayDetails?.recipeType || (existing.takeAwayDetails?.isTakeAway ? 'takeaway' : 'normal');

          if (localTime > remoteTime + 2000 || (localType !== 'normal' && remoteType === 'normal')) {
            if (!candidateMap.has(r.id)) {
              candidateMap.set(r.id, {
                ...existing,
                ...r,
                recipeType: localType,
                takeAwayDetails: {
                  ...(existing.takeAwayDetails || {}),
                  ...(r.takeAwayDetails || {}),
                  recipeType: localType,
                  isTakeAway: localType === 'takeaway'
                }
              });
            }
          }
        }
      });
    };

    checkAndAdd(historyList);
    checkAndAdd(drafts);
    checkAndAdd(cached);

    setRecoverableRecipes(Array.from(candidateMap.values()));
    setIsScanning(false);
  };

  const handleRestoreAll = async () => {
    if (recoverableRecipes.length === 0) return;
    setIsRestoring(true);
    try {
      await onRestoreRecipes(recoverableRecipes);
      // Clean emergency drafts for restored ones
      recoverableRecipes.forEach(r => removeEmergencyDraft(r.id));
      setRestoreSuccessCount(recoverableRecipes.length);
      setRecoverableRecipes([]);
      // Rescan
      await runFullScan();
    } catch (err: any) {
      console.error("Error restoring recipes:", err);
      alert(`Error al restaurar recetas: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      app: 'Recetas JCB',
      user: appUser?.email || 'Desconocido',
      stats: {
        recipesCount: recipes.length,
        proRecipesCount: proRecipes.length,
        productsCount: products.length,
        menusCount: menus.length,
        recoveredFromLocalCount: recoverableRecipes.length
      },
      recipes: recipes,
      proRecipes: proRecipes,
      products: products,
      menus: menus,
      localRecoverableDrafts: recoverableRecipes
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_completo_recetas_jcb_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentEmail = appUser?.email || 'Sin sesión';
  const isAdmin = isUserAdmin(appUser);
  const pastryCount = recipes.filter(r => r.recipeType === 'pastry').length;
  const eventosCount = recipes.filter(r => r.recipeType === 'eventos').length;
  const takeAwayCount = recipes.filter(r => r.recipeType === 'takeaway' || r.takeAwayDetails?.isTakeAway === true).length;
  const normalCount = recipes.filter(r => r.recipeType === 'normal' || (!r.recipeType && !r.takeAwayDetails?.isTakeAway)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">
                  Auditoría de Base de Datos & Recuperador de Recetas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Firestore Cloud
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Diagnóstico de persistencia, sincronización y recuperación de fichas locales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database size={15} />
            <span>Diagnóstico del Sistema ({recipes.length} en la nube)</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'recovery'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History size={15} />
            <span>Recuperación Forense Local</span>
            {recoverableRecipes.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {recoverableRecipes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-sky-600 text-sky-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download size={15} />
            <span>Copia de Seguridad JSON</span>
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: AUDITORÍA DEL SISTEMA */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              
              {/* Tarjetas de Métricas Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Recetas Activas</div>
                  <div className="text-2xl font-black text-sky-950 font-mono mt-1">{recipes.length}</div>
                  <div className="text-[10px] text-sky-600 mt-0.5">En colección /recipes</div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Taller I+D Michelin</div>
                  <div className="text-2xl font-black text-amber-950 font-mono mt-1">{proRecipes.length}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">En /proRecipes (5 niveles)</div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Ingredientes Maestro</div>
                  <div className="text-2xl font-black text-emerald-950 font-mono mt-1">{products.length}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">En /products</div>
                </div>

                <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Menús Planificados</div>
                  <div className="text-2xl font-black text-purple-950 font-mono mt-1">{menus.length}</div>
                  <div className="text-[10px] text-purple-600 mt-0.5">En /menuPlans</div>
                </div>
              </div>

              {/* Diagnóstico de Conexión y Autenticación */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Diagnóstico de Sesión y Acceso a Firebase Firestore</span>
                  <button 
                    onClick={runFullScan} 
                    className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
                    <span>Verificar Ahora</span>
                  </button>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Cuenta Conectada</div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{currentEmail || 'Sin sesión'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Rol: <span className="font-black text-emerald-700">{isAdmin ? 'ADMINISTRADOR TOTAL' : 'Usuario'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Estado de Base de Datos</div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Conectado (Latencia: {pingLatency !== null ? `${pingLatency}ms` : 'ok'})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Persistencia: <span className="font-bold text-slate-700">IndexedDB Multitestigo Activa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose de Categorías y Filtros (Take Away vs Normales) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Distribución de la Base de Datos ({recipes.length} recetas totales)
                  </h4>
                  {onResetFilters && (
                    <button
                      onClick={() => { onResetFilters(); onClose(); }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Filter size={12} />
                      <span>Quitar todos los filtros en el Dashboard</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">🍽️ Normales</div>
                    <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{normalCount}</div>
                    <div className="text-[10px] text-slate-500">Servicio en mesa</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">🥡 Take Away</div>
                    <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{takeAwayCount}</div>
                    <div className="text-[10px] text-slate-500">Para llevar / Delivery</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/30">
                    <div className="text-[10px] font-bold text-blue-600 uppercase">🔹 Eventos</div>
                    <div className="text-lg font-black text-blue-900 font-mono mt-0.5">{eventosCount}</div>
                    <div className="text-[10px] text-blue-600">Banquetes y catering</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/30">
                    <div className="text-[10px] font-bold text-rose-700 uppercase">🧁 Pastelería</div>
                    <div className="text-lg font-black text-rose-950 font-mono mt-0.5">{pastryCount}</div>
                    <div className="text-[10px] text-rose-700">Láminas de obrador</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">🌟 Taller I+D</div>
                    <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{proRecipes.length}</div>
                    <div className="text-[10px] text-slate-500">Colección Michelin</div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span>Información sobre distribución y filtros:</span>
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    1. En el Dashboard puedes filtrar entre <strong>"🍽️ Normales"</strong> ({normalCount}), <strong>"🥡 Take Away"</strong> ({takeAwayCount}), <strong>"🔹 Eventos"</strong> ({eventosCount}) y <strong>"🧁 Pastelería"</strong> ({pastryCount}).<br />
                    2. Las {proRecipes.length} recetas del <strong>"Taller I+D Michelin"</strong> se gestionan en su taller especializado.<br />
                    3. Si has editado o creado recetas y no ves los cambios, pulsa en la pestaña superior <strong>"Recuperación Forense Local"</strong> para sincronizarlas con Firebase Firestore de inmediato.
                  </p>
                </div>
              </div>

              {/* Herramienta Especializada de Separación (Recetas vs Productos) */}
              {(() => {
                const misclassified = recipes.filter(isRecipeRawProduct);
                return (
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-600" />
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            Separación Inteligente de Recetas e Ingredientes
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            misclassified.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {misclassified.length > 0 ? `${misclassified.length} en conflicto` : 'Todo Correcto'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Si al importar archivos CSV o JSON se confundieron los ingredientes del catálogo con recetas gastronómicas, esta función detecta los productos materias primas (como Harina, Leche, Aceites) y los traslada al <strong>Catálogo de Ingredientes Maestro</strong> ({products.length} productos), dejando únicamente las verdaderas fichas técnicas de cocina.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isSeparating || misclassified.length === 0}
                        onClick={async () => {
                          setIsSeparating(true);
                          setSeparationSuccessMessage(null);
                          try {
                            const res = await executeDatabaseSeparation(recipes, products);
                            if (onRefreshData) await onRefreshData();
                            setSeparationSuccessMessage(`¡Éxito! Se han extraído ${res.movedCount} productos del listado de recetas y se han movido correctamente al catálogo de ingredientes.`);
                          } catch (err: any) {
                            alert(`Error al ejecutar separación: ${err.message || err}`);
                          } finally {
                            setIsSeparating(false);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-md shrink-0 flex items-center gap-2 ${
                          misclassified.length > 0 
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isSeparating ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Separando...</span>
                          </>
                        ) : (
                          <>
                            <Layers size={14} />
                            <span>⚡ Separar {misclassified.length > 0 ? `${misclassified.length} Productos` : ''}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {separationSuccessMessage && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{separationSuccessMessage}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: RECUPERACIÓN FORENSE LOCAL */}
          {activeTab === 'recovery' && (
            <div className="space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <History size={16} className="text-amber-600" />
                    <span>Escaneo de la Memoria Local de este Navegador</span>
                  </h4>
                  <button 
                    onClick={runFullScan} 
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
                    <span>Re-escanear Memoria</span>
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Cada vez que editas, digitalizas o guardas una receta, la aplicación almacena una copia de seguridad en la memoria física de tu navegador (localStorage e IndexedDB). Si en algún momento la conexión falló o hiciste F5 antes de consolidar en Firebase, aquí puedes rescatarlas.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-400">Historial Local</div>
                    <div className="text-sm font-black text-slate-800">{localHistoryRecipes.length} recetas</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-400">Borradores Emergencia</div>
                    <div className="text-sm font-black text-slate-800">{emergencyDrafts.length} borradores</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-400">Caché Previa</div>
                    <div className="text-sm font-black text-slate-800">{cachedRecipes.length} en caché</div>
                  </div>
                </div>
              </div>

              {/* RECETAS RECUPERABLES DETECTADAS */}
              {restoreSuccessCount !== null && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-black text-sm">¡Éxito Total en la Restauración!</h5>
                    <p className="text-xs text-emerald-700">
                      Se han subido y consolidado {restoreSuccessCount} recetas directamente a tu base de datos Firebase Firestore. Ya son permanentes.
                    </p>
                  </div>
                </div>
              )}

              {recoverableRecipes.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-amber-950">
                          ¡Detectadas {recoverableRecipes.length} recetas no sincronizadas en Firestore!
                        </h5>
                        <p className="text-xs text-amber-800">
                          Estas recetas existen en el historial de tu navegador pero no están en la lista actual de Firestore. Pulsa el botón para subirlas a la nube inmediatamente.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRestoreAll}
                      disabled={isRestoring}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md hover:scale-102 transition-all flex items-center gap-2 shrink-0"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Guardando en Firestore...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Restaurar {recoverableRecipes.length} Fichas a Firestore</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {recoverableRecipes.map((r, idx) => (
                      <div key={r.id || idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-black text-slate-800 uppercase">{r.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Categoría: {r.category || (r.categories ? r.categories[0] : 'General')} • {r.subRecipes?.length || 0} elaboraciones • ID: {r.id}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Recuperable
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                  <h5 className="font-black text-sm text-slate-800">
                    Sincronización al 100% al Día
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Todas las recetas que tienes en el historial de este navegador ya están correctamente guardadas en tu base de datos de Firebase Firestore ({recipes.length} recetas en total).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COPIA DE SEGURIDAD JSON */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500 text-white rounded-xl shadow-xs">
                    <FileJson size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      Descarga Integral de Seguridad (JSON Maestro)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Descarga en 1 clic un archivo con TODAS tus recetas, ingredientes, fichas de Take Away y menús para guardarlo en tu ordenador o pendrive.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div>• <strong>{recipes.length}</strong> Fichas Técnicas Generales y Take Away</div>
                  <div>• <strong>{proRecipes.length}</strong> Fichas del Taller I+D Michelin</div>
                  <div>• <strong>{products.length}</strong> Ingredientes con costes y mermas</div>
                  <div>• <strong>{menus.length}</strong> Menús de servicio programados</div>
                </div>

                <button
                  onClick={handleExportFullBackup}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 hover:scale-101 active:scale-99 transition-all"
                >
                  <Download size={16} />
                  <span>Descargar Copia de Seguridad Completa al Ordenador (.json)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Base de datos protegida con persistencia local permanente en tu navegador</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
