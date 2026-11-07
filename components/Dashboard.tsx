import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Recipe, AppSettings, Product, MenuPlan, AppUser, isUserAdmin, isUserOwner } from '../types';
import { testFirestoreConnection } from '../firebase';
import { 
  Plus, Search, Eye, Edit2, Trash2, ChefHat, Settings, Calendar, 
  Database, LogOut, FileJson, Sparkles, Users, Coins, Tag, ShoppingCart, 
  UserCheck, Lock, Unlock, Copy, FlaskConical, Server, CheckCircle2, AlertCircle, RefreshCw, X, Compass,
  LayoutGrid, Maximize2, Wand2, ShieldCheck, BookOpen, Layers, Cloud, HardDrive, Upload, Wifi, WifiOff, FileSpreadsheet,
  List, Laptop, School, Check
} from 'lucide-react';
import { CategoryStripe } from './CategoryStripe';
import { AllergenIcon } from './AllergenIcon';
import { FlavorLab } from './FlavorLab';
import { getEmergencyDrafts, removeEmergencyDraft } from '../lib/imageUtils';

interface DashboardProps {
  recipes: Recipe[];
  settings: AppSettings;
  savedMenus: MenuPlan[];
  productDatabase: Product[];
  appUser: AppUser | null;
  proRecipesCount?: number;
  syncState?: { isSyncing: boolean; unsyncedCount: number; message?: string };
  onTriggerSync?: () => Promise<any> | void;
  onRefreshAllData?: () => Promise<void> | void;
  onNew: () => void;
  onEdit: (recipe: Recipe) => void;
  onView: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onTogglePublic: (recipe: Recipe) => void;
  onImport: (recipe: Recipe) => void;
  onOpenSettings: () => void;
  onOpenMenuPlanner: () => void;
  onOpenProductDB: () => void;
  onOpenAIBridge: () => void;
  onOpenPromptHub?: () => void;
  onOpenAuditModal?: () => void;
  onOpenUserManagement: () => void;
  onOpenMigration?: () => void;
  onOpenProWorkshop?: () => void;
  onLogout: () => void;
  onToggleMobileSidebar?: () => void;
  onDuplicate: (recipe: Recipe) => void;
  onOpenAlphabeticalIndex?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  recipes, settings, savedMenus, productDatabase, appUser, proRecipesCount,
  syncState, onTriggerSync, onRefreshAllData,
  onNew, onEdit, onView, onDelete, onTogglePublic, onImport, onOpenSettings, 
  onOpenMenuPlanner, onOpenProductDB, onOpenAIBridge, onOpenPromptHub, onOpenAuditModal, 
  onOpenUserManagement, onOpenMigration, onOpenProWorkshop, onLogout, 
  onToggleMobileSidebar, onDuplicate, onOpenAlphabeticalIndex
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [offlineStatusFilter, setOfflineStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [displayLimit, setDisplayLimit] = useState(12);
  const [showFlavorLab, setShowFlavorLab] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'list' | 'compact' | 'large'>(() => {
    return (localStorage.getItem('recipe_card_view') as 'list' | 'compact' | 'large') || 'list';
  });
  const [deviceMode, setDeviceMode] = useState<'personal' | 'ies'>(() => {
    return (localStorage.getItem('app_device_mode') as 'personal' | 'ies') || 'ies';
  });
  const [showDeviceBanner, setShowDeviceBanner] = useState(() => {
    return localStorage.getItem('app_device_mode_confirmed') !== 'true';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSetCardViewMode = (mode: 'list' | 'compact' | 'large') => {
    setCardViewMode(mode);
    try {
      localStorage.setItem('recipe_card_view', mode);
    } catch (_) {}
  };

  const handleSelectDeviceMode = (mode: 'personal' | 'ies') => {
    setDeviceMode(mode);
    setShowDeviceBanner(false);
    try {
      localStorage.setItem('app_device_mode', mode);
      localStorage.setItem('app_device_mode_confirmed', 'true');
    } catch (_) {}
  };

  const checkDb = async () => {
    setDbStatus('checking');
    const res = await testFirestoreConnection();
    setDbLatency(res.latency);
    setDbStatus(res.ok ? 'connected' : 'error');
  };

  useEffect(() => {
    checkDb();
  }, []);

  const sortedRecipes = [...recipes].sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

  const isActuallyAdmin = isUserAdmin(appUser);
  const isOwner = isUserOwner(appUser);

  const [emergencyDrafts, setEmergencyDrafts] = useState<any[]>(() => getEmergencyDrafts());

  const allCategories = React.useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach(r => {
      if (r.categories) r.categories.forEach(c => cats.add(c));
      else if (r.category) cats.add(r.category);
    });
    return Array.from(cats);
  }, [recipes]);

  const pastryRecipesCount = React.useMemo(() => {
    return recipes.filter(r => r.recipeType === 'pastry').length;
  }, [recipes]);

  const eventosRecipesCount = React.useMemo(() => {
    return recipes.filter(r => r.recipeType === 'eventos').length;
  }, [recipes]);

  const takeAwayRecipesCount = React.useMemo(() => {
    return recipes.filter(r => r.recipeType === 'takeaway' || r.takeAwayDetails?.isTakeAway === true).length;
  }, [recipes]);

  const normalRecipesCount = React.useMemo(() => {
    return recipes.filter(r => r.recipeType === 'normal' || (!r.recipeType && !r.takeAwayDetails?.isTakeAway)).length;
  }, [recipes]);

  const getRecipeTypeInfo = (recipe: Recipe) => {
    if (recipe.recipeType === 'pastry') {
      return {
        label: '🧁 Pastelería',
        border: 'border-rose-300 hover:border-rose-500',
        gradient: 'bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#be185d] text-rose-50 border-[#500724] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-1.5px_0_rgba(0,0,0,0.3),0_2px_4px_rgba(157,23,77,0.25)]',
        badgeBg: 'bg-rose-300 text-rose-950'
      };
    }
    if (recipe.recipeType === 'eventos') {
      return {
        label: '🔹 Eventos',
        border: 'border-emerald-300 hover:border-emerald-500',
        gradient: 'bg-gradient-to-r from-[#044e39] via-[#065f46] to-[#047857] text-white border-[#022c22] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-1.5px_0_rgba(0,0,0,0.3),0_2px_4px_rgba(4,120,87,0.25)]',
        badgeBg: 'bg-emerald-300 text-emerald-950'
      };
    }
    if (recipe.recipeType === 'takeaway' || recipe.takeAwayDetails?.isTakeAway) {
      return {
        label: '🥡 Take Away',
        border: 'border-amber-300 hover:border-amber-500',
        gradient: 'bg-gradient-to-r from-[#5a2507] via-[#6d2f09] to-[#7a350f] text-amber-50 border-[#3d1904] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),inset_0_-1.5px_0_rgba(0,0,0,0.4),0_2px_4px_rgba(40,16,5,0.25)]',
        badgeBg: 'bg-amber-400 text-amber-950'
      };
    }
    // Normal -> Blue
    return {
      label: '🍽️ Normal',
      border: 'border-blue-300 hover:border-blue-500',
      gradient: 'bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] text-white border-[#172554] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-1.5px_0_rgba(0,0,0,0.3),0_2px_4px_rgba(29,78,216,0.25)]',
      badgeBg: 'bg-blue-300 text-blue-950'
    };
  };

  const totalRecipesCount = recipes.length;
  const onlineRecipesCount = useMemo(() => recipes.filter(r => r.synced === true).length, [recipes]);
  const offlineRecipesCount = useMemo(() => recipes.filter(r => r.synced === false).length, [recipes]);

  const filteredRecipes = sortedRecipes.filter(r => {
    const recipeCategories = r.categories || [r.category];
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      recipeCategories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = 
      selectedCategory === 'all' || 
      (selectedCategory === 'normal' ? (r.recipeType === 'normal' || (!r.recipeType && !r.takeAwayDetails?.isTakeAway)) :
       selectedCategory === 'takeaway' ? (r.recipeType === 'takeaway' || r.takeAwayDetails?.isTakeAway === true) :
       selectedCategory === 'eventos' ? r.recipeType === 'eventos' :
       selectedCategory === 'pastry' ? r.recipeType === 'pastry' :
       recipeCategories.includes(selectedCategory));
    
    // Filtro por Estado: Todas vs Solo Online vs Solo Offline (Local)
    const matchesOfflineStatus = 
      offlineStatusFilter === 'all' || 
      (offlineStatusFilter === 'online' && r.synced === true) || 
      (offlineStatusFilter === 'offline' && r.synced === false);

    // Garantizar visibilidad total de todas las recetas del catálogo escolar
    const isVisible = true;
    return matchesSearch && matchesCategory && matchesOfflineStatus && isVisible;
  });

  const visibleRecipes = filteredRecipes.slice(0, displayLimit);

  const handleImportClick = () => fileInputRef.current?.click();
  
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 pb-24 font-sans selection:bg-sky-200 selection:text-slate-900">
      {/* Selector de Entorno de Trabajo: Ordenador IES (Consulta Ligera) vs Ordenador Personal (Taller) */}
      {showDeviceBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 border-b border-indigo-500/30 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Laptop size={15} />
              </div>
              <div>
                <span className="font-bold text-white block sm:inline mr-2">¿Desde qué equipo estás accediendo hoy?</span>
                <span className="text-slate-300 text-[11px]">Adapta el consumo de datos y fotos a tu ubicación.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { handleSelectDeviceMode('ies'); handleSetCardViewMode('list'); }}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5 ${
                  deviceMode === 'ies'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Modo Consulta IES: Carga ultra ligera en lista, sin descargar fotos pesadas ni saturar la red del instituto"
              >
                <School size={12} />
                <span>🏫 Ordenador del IES (Consulta Ligera)</span>
              </button>
              <button
                onClick={() => handleSelectDeviceMode('personal')}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-1.5 ${
                  deviceMode === 'personal'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Modo Personal / Casa: Guarda en local permanentemente para trabajar offline"
              >
                <Laptop size={12} />
                <span>💻 Mi Ordenador Personal</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cabecera Limpia del Espacio de Trabajo: Base de Datos & Recetario */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {onToggleMobileSidebar && (
                <button
                  onClick={onToggleMobileSidebar}
                  className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                  title="Abrir menú de navegación"
                >
                  <Compass size={20} />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs">
                <ChefHat size={22} className="text-sky-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Recetario & Fichas Técnicas
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    Base de Datos Normal
                  </span>
                  <button
                    onClick={() => {
                      const next = deviceMode === 'ies' ? 'personal' : 'ies';
                      handleSelectDeviceMode(next);
                      if (next === 'ies') handleSetCardViewMode('list');
                    }}
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                      deviceMode === 'ies'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                    }`}
                    title="Haz clic para alternar entre Modo Ordenador IES (Ligero) y Modo Ordenador Personal"
                  >
                    {deviceMode === 'ies' ? <School size={10} /> : <Laptop size={10} />}
                    <span>{deviceMode === 'ies' ? 'Entorno: IES (Consulta Ligera)' : 'Entorno: Mi Ordenador'}</span>
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  {filteredRecipes.length} recetas disponibles · Costes, escandallos y alérgenos
                </p>
              </div>
            </div>

            {/* Botón de acción contrastado, Auditoría y acceso al Taller de Prompts */}
            <div className="flex items-center gap-2">
              {onOpenAuditModal && (
                <button
                  onClick={onOpenAuditModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition-all font-bold text-xs uppercase tracking-wider shadow-2xs"
                  title="Auditoría de persistencia, verificación de Firebase y recuperador de recetas"
                >
                  <ShieldCheck size={15} className="text-emerald-700" />
                  <span className="hidden md:inline">Auditoría & Recuperador</span>
                  <span className="md:hidden">Auditoría</span>
                </button>
              )}
              {onOpenPromptHub && (
                <button
                  onClick={onOpenPromptHub}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
                  title="Abrir Taller Exclusivo de Prompts para Láminas 16:9 y Digitalización"
                >
                  <Wand2 size={15} className="text-rose-600" />
                  <span>Prompts IA</span>
                </button>
              )}
              <button 
                onClick={onNew} 
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl hover:scale-102 active:scale-98 transition-all font-bold text-xs uppercase tracking-wider shadow-sm group"
                title="Crear nueva ficha técnica culinaria"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform stroke-[2.5]" /> 
                <span>Nueva Ficha</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showFlavorLab && (
        <FlavorLab 
          recipes={recipes} 
          productDatabase={productDatabase}
          settings={settings} 
          onBack={() => setShowFlavorLab(false)} 
          onCreateRecipeWithIngredients={() => {
            setShowFlavorLab(false);
            onNew();
          }}
        />
      )}

      {/* Banner de Recuperación de Borradores si existen en el navegador */}
      {emergencyDrafts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-sm text-amber-950">
                  Recuperación de Borradores Locales ({emergencyDrafts.length} detectados)
                </h4>
                <p className="text-xs text-amber-800">
                  Se han encontrado recetas guardadas de forma segura en la memoria de este navegador que puedes sincronizar a la base de datos de Firebase Firestore con un solo clic.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                for (const draft of emergencyDrafts) {
                  await onImport(draft);
                  removeEmergencyDraft(draft.id);
                }
                setEmergencyDrafts([]);
                alert("¡Todas las recetas locales han sido sincronizadas con éxito en Firebase Firestore!");
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0"
            >
              Sincronizar a la nube ({emergencyDrafts.length})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL DE CONTROL DE ALMACENAMIENTO: TOTAL / ONLINE (NUBE) / OFFLINE (LOCAL) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Título & Explicación de Arquitectura de Trabajo (Casa vs IES) */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                    Almacenamiento del Recetario: Local & Nube
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Persistencia Local Garantizada
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Tus fichas quedan <strong>guardadas en este equipo (IndexedDB)</strong> para que puedas trabajar en casa 100% offline. El respaldo en la nube de Firebase te permite descargar o sincronizar cuando estés conectado en el IES.
                </p>
              </div>
            </div>

            {/* Acciones Rápidas del Panel */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onTriggerSync && (
                <button
                  type="button"
                  onClick={async () => {
                    if (onTriggerSync) {
                      await onTriggerSync();
                      if (onRefreshAllData) onRefreshAllData();
                    }
                  }}
                  disabled={syncState?.isSyncing}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Sincronizar recetas locales pendientes con la nube de Firebase Firestore"
                >
                  <RefreshCw size={14} className={syncState?.isSyncing ? 'animate-spin' : ''} />
                  <span>{syncState?.isSyncing ? 'Sincronizando...' : 'Subir Pendientes a Nube'}</span>
                  {offlineRecipesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-bold">
                      {offlineRecipesCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenMigration && (
                <button
                  type="button"
                  onClick={onOpenMigration}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                  title="Abrir Migrador y Carga de Archivos CSV"
                >
                  <Upload size={14} className="text-slate-600" />
                  <span>Migrador CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjetas de Métricas & Filtro Interactivo de Estado: TOTAL, ONLINE, OFFLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            
            {/* 1. TOTAL FICHAS */}
            <button
              type="button"
              onClick={() => setOfflineStatusFilter('all')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                offlineStatusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${offlineStatusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Total Fichas
                </span>
                <Layers size={16} className={offlineStatusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'} />
              </div>
              <div className="text-2xl font-black font-mono mt-1 leading-none">
                {totalRecipesCount}
              </div>
              <p className={`text-[11px] font-medium mt-1.5 truncate ${offlineStatusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                Todas las fichas en la aplicación
              </p>
            </button>

            {/* 2. ONLINE (EN LA NUBE / IES) */}
            <button
              type="button"
              onClick={() => setOfflineStatusFilter('online')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                offlineStatusFilter === 'online'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/80 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${offlineStatusFilter === 'online' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Online (En la Nube)
                </span>
                <Cloud size={16} className={offlineStatusFilter === 'online' ? 'text-emerald-100' : 'text-emerald-600'} />
              </div>
              <div className="text-2xl font-black font-mono mt-1 leading-none">
                {onlineRecipesCount}
              </div>
              <p className={`text-[11px] font-medium mt-1.5 truncate ${offlineStatusFilter === 'online' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                Sincronizadas en Firebase / IES
              </p>
            </button>

            {/* 3. OFFLINE (LOCAL / EN ESTE EQUIPO) */}
            <button
              type="button"
              onClick={() => setOfflineStatusFilter('offline')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                offlineStatusFilter === 'offline'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-amber-50/60 hover:bg-amber-50 border-amber-200/80 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${offlineStatusFilter === 'offline' ? 'text-amber-100' : 'text-amber-800'}`}>
                  Offline (Local / Casa)
                </span>
                <HardDrive size={16} className={offlineStatusFilter === 'offline' ? 'text-amber-100' : 'text-amber-600'} />
              </div>
              <div className="text-2xl font-black font-mono mt-1 leading-none">
                {offlineRecipesCount}
              </div>
              <p className={`text-[11px] font-medium mt-1.5 truncate ${offlineStatusFilter === 'offline' ? 'text-amber-100' : 'text-amber-800'}`}>
                {offlineRecipesCount === 0 ? 'Todas respaldadas en nube' : 'En tu navegador (listas sin internet)'}
              </p>
            </button>
          </div>

          {/* Barra de filtrado activo si no está en 'all' */}
          {offlineStatusFilter !== 'all' && (
            <div className="mt-3 flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl text-xs text-slate-700 border border-slate-200 animate-fadeIn">
              <span className="font-semibold flex items-center gap-1.5">
                {offlineStatusFilter === 'online' ? (
                  <>
                    <Cloud size={14} className="text-emerald-600" />
                    <span>Filtrando: <strong>Solo Fichas Online en Nube</strong> ({filteredRecipes.length} recetas)</span>
                  </>
                ) : (
                  <>
                    <HardDrive size={14} className="text-amber-600" />
                    <span>Filtrando: <strong>Solo Fichas Offline Locales</strong> ({filteredRecipes.length} recetas)</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setOfflineStatusFilter('all')}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                Ver todas ({totalRecipesCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex gap-2.5 flex-wrap w-full md:w-auto">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
                 <div className="w-7 h-7 bg-sky-50 border border-sky-200/80 rounded-lg flex items-center justify-center text-sky-700">
                   <Tag size={14}/>
                 </div>
                 <div>
                    <div className="text-xs font-black text-slate-900 font-mono leading-none">{recipes.length}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Recetas</div>
                 </div>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
                 <div className="w-7 h-7 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-center text-amber-700">
                   <ShoppingCart size={14}/>
                 </div>
                 <div>
                    <div className="text-xs font-black text-slate-900 font-mono leading-none">{productDatabase.length}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Productos</div>
                 </div>
              </div>
              <div 
                onClick={onOpenMenuPlanner}
                className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all group"
                title="Abrir Planificador de Menús"
              >
                 <div className="w-7 h-7 bg-emerald-50 border border-emerald-200/80 rounded-lg flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                   <Calendar size={14}/>
                 </div>
                 <div>
                    <div className="text-xs font-black text-slate-900 font-mono leading-none">{savedMenus?.length || 0}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Menús</div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-2 w-full md:w-auto">
             {onOpenAlphabeticalIndex && (
               <button
                 type="button"
                 onClick={onOpenAlphabeticalIndex}
                 className="px-3 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                 title="Abrir buscador alfabético y directorio A-Z de recetas (Local-First)"
               >
                 <BookOpen size={14} className="text-sky-200" />
                 <span>Índice A-Z</span>
                 <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-mono leading-none">
                   {recipes.length}
                 </span>
               </button>
             )}

             <div className="relative w-full md:w-72 lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar receta, ingrediente..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" 
                />
             </div>

             {/* Selector de Vista: 12 Compactas (4x4 cm) vs Foto Grande */}
             <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetCardViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    cardViewMode === 'list'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Listado ligero sin fotos: Cero consumo, ideal para ordenadores del IES"
                >
                  <List size={13} />
                  <span className="hidden sm:inline">Listado Ligero</span>
                  <span className="sm:hidden">Lista</span>
                </button>
               <button
                 type="button"
                 onClick={() => handleSetCardViewMode('compact')}
                 className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                   cardViewMode === 'compact'
                     ? 'bg-slate-900 text-white shadow-2xs'
                     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                 }`}
                 title="Vista compacta de 4x4 cm para ver 12 recetas de una pasada"
               >
                 <LayoutGrid size={13} />
                 <span className="hidden sm:inline">12 de una pasada (4x4 cm)</span>
                 <span className="sm:hidden">4x4 cm</span>
               </button>
               <button
                 type="button"
                 onClick={() => handleSetCardViewMode('large')}
                 className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                   cardViewMode === 'large'
                     ? 'bg-slate-900 text-white shadow-2xs'
                     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                 }`}
                 title="Vista con foto grande"
               >
                 <Maximize2 size={13} />
                 <span className="hidden sm:inline">Foto Grande</span>
                 <span className="sm:hidden">Grande</span>
               </button>
             </div>
           </div>
        </div>

        {/* Chips de Categorías */}
        {allCategories.length > 0 && (
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Todas ({recipes.length})
            </button>
            <button
              onClick={() => setSelectedCategory('normal')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'normal'
                  ? 'bg-blue-900 text-white shadow-2xs font-black'
                  : 'bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 font-bold'
              }`}
            >
              <span>🍽️ Normales</span>
              <span className="text-[9px] opacity-80">({normalRecipesCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('takeaway')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'takeaway'
                  ? 'bg-[#7a350f] text-white shadow-2xs font-black'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-bold'
              }`}
            >
              <span>🥡 Take Away</span>
              <span className="text-[9px] opacity-80">({takeAwayRecipesCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('eventos')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'eventos'
                  ? 'bg-[#044e39] text-white shadow-2xs font-black'
                  : 'bg-emerald-50 text-[#044e39] border border-emerald-300 hover:bg-emerald-100 font-bold'
              }`}
            >
              <span>🔹 Eventos</span>
              <span className="text-[9px] opacity-80">({eventosRecipesCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('pastry')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'pastry'
                  ? 'bg-rose-900 text-white shadow-2xs font-black'
                  : 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 font-bold'
              }`}
            >
              <span>🧁 Pastelería</span>
              <span className="text-[9px] opacity-80">({pastryRecipesCount})</span>
            </button>
            {allCategories.map(cat => {
              const count = recipes.filter(r => (r.categories || [r.category]).includes(cat)).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className={cardViewMode === 'list' ? "space-y-2.5" : cardViewMode === 'compact' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}>
          {visibleRecipes.length > 0 ? visibleRecipes.map(recipe => {
            const info = getRecipeTypeInfo(recipe);
            const costPerPortion = recipe.totalCost && recipe.yieldQuantity ? (recipe.totalCost / recipe.yieldQuantity).toFixed(2).replace('.', ',') : '0,00';
            
            const allAllergens = new Set<string>();
            recipe.subRecipes.forEach(sub => sub.ingredients.forEach(ing => ing.allergens.forEach(a => allAllergens.add(a))));

            const isMine = appUser?.workspaceId && (recipe.workspaceId === appUser.workspaceId || (isActuallyAdmin && !recipe.workspaceId));
            const isCommunity = !isMine;

            if (cardViewMode === 'list') {
              return (
                <div
                  key={recipe.id}
                  onClick={() => onView(recipe)}
                  className={`bg-white rounded-2xl border hover:border-sky-500/80 shadow-2xs hover:shadow-md transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer ${info.border}`}
                >
                  {/* Lado izquierdo: Identificador y Título */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${info.gradient} text-white font-mono`}>
                      {recipe.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${info.badgeBg}`}>
                          {info.label}
                        </span>
                        <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 transition-colors uppercase tracking-tight truncate">
                          {recipe.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 flex-wrap">
                        <span className="font-bold uppercase text-slate-600">{recipe.category || 'General'}</span>
                        <span>•</span>
                        <span>{recipe.yieldQuantity} {recipe.yieldUnit || 'PAX'}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-700">{costPerPortion}€ / ración</span>
                        {recipe.creator && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-[120px]">Chef: {recipe.creator}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Alérgenos + Estado + Acciones directas */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {allAllergens.size > 0 && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl">
                        {Array.from(allAllergens).slice(0, 3).map(a => (
                          <AllergenIcon key={a} allergen={a as any} size={13} />
                        ))}
                        {allAllergens.size > 3 && (
                          <span className="text-[8px] font-bold text-slate-400">+{allAllergens.size - 3}</span>
                        )}
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${recipe.synced ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      {recipe.synced ? 'Nube' : 'Local'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                      title="Editar Ficha"
                    >
                      <Edit2 size={13} />
                    </button>
                    <div className="px-2.5 py-1 bg-slate-900 group-hover:bg-sky-700 text-white rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-colors">
                      <span>Ver</span>
                      <Eye size={11} />
                    </div>
                  </div>
                </div>
              );
            }
            return cardViewMode === 'compact' ? (
              /* ========================================================================= */
              /* VISTA COMPACTA 4x4 CM: 12 Recetas de una pasada con Cabecera Biselada     */
              /* ========================================================================= */
              <div 
                key={recipe.id} 
                onClick={() => onView(recipe)}
                className={`bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all duration-300 border overflow-hidden flex flex-col group cursor-pointer relative ${info.border}`}
              >
                {/* Cabecera Biselada con Relieve y Sombra */}
                <div className={`px-3 py-2 border-b transition-all flex items-center justify-between gap-2 ${info.gradient}`}>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded ${info.badgeBg} font-black text-[7.5px] uppercase tracking-wider shadow-2xs`}>
                      {info.label}
                    </span>
                    <h3 
                      className="font-serif text-xs font-black uppercase tracking-tight truncate text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" 
                      title={recipe.name}
                    >
                      {recipe.name}
                    </h3>
                  </div>

                  {/* Badges de Privacidad y Sync */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-black/20 backdrop-blur-xs rounded-md p-0.5 border border-white/20 shrink-0">
                      <div className={`px-1 py-0.2 rounded text-[6.5px] font-bold uppercase tracking-tight flex items-center gap-0.5 ${!recipe.isPublic ? 'bg-emerald-500 text-white' : 'text-white/60'}`}>
                        <Lock size={7} />
                        <span>Priv</span>
                      </div>
                      <div className={`px-1 py-0.2 rounded text-[6.5px] font-bold uppercase tracking-tight flex items-center gap-0.5 ${recipe.isPublic ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/60'}`}>
                        <Users size={7} />
                        <span>Púb</span>
                      </div>
                    </div>

                    <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tight flex items-center gap-0.5 shadow-2xs ${recipe.synced ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-amber-300 border border-amber-400/50'}`}>
                      {recipe.synced ? <Wifi size={7} /> : <HardDrive size={7} />}
                      <span>{recipe.synced ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta Compacta: Foto 4x4 cm a la izquierda + Datos a la derecha */}
                <div className="p-2.5 flex gap-2.5 min-w-0 flex-grow bg-white">
                  {/* Foto 4x4 cm (104px x 104px) - object-right para enfocar exclusivamente la foto terminada de la derecha */}
                  <div className="w-[104px] h-[104px] min-w-[104px] max-w-[104px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs shrink-0 relative group/img">
                    {recipe.photo ? (
                      <img 
                        src={recipe.photo} 
                        className="w-full h-full object-cover object-right group-hover/img:scale-105 transition-transform duration-300" 
                        alt={recipe.name} 
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/50 text-slate-400 p-1 text-center">
                        <ChefHat size={22} className="text-slate-400 mb-0.5" />
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Sin Foto</span>
                      </div>
                    )}

                    {/* Coste y PAX en badge sobre la foto de 4x4cm */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/85 via-slate-900/60 to-transparent p-1 px-1.5 flex items-center justify-between text-white pointer-events-none">
                      <span className="text-[7.5px] font-mono font-bold text-slate-200">{recipe.yieldQuantity} {recipe.yieldUnit || 'PAX'}</span>
                      <span className="text-[8.5px] font-mono font-black text-amber-300">{costPerPortion}€</span>
                    </div>
                  </div>

                  {/* Contenido derecho de la tarjeta */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Categorías */}
                      <div className="flex flex-wrap gap-1 items-center mb-1">
                        {(recipe.categories || [recipe.category]).slice(0, 2).map(cat => (
                          <span key={cat} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[7.5px] font-bold uppercase tracking-tight border border-slate-200/80 truncate max-w-[95px]">
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Creador */}
                      <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                        {recipe.creatorLogo ? (
                          <img src={recipe.creatorLogo} className="w-3.5 h-3.5 rounded-full object-cover border border-slate-200 shrink-0" alt="" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Users size={7} />
                          </div>
                        )}
                        <span className="text-[8.5px] font-medium text-slate-500 truncate">
                          {recipe.creator || 'Chef de Partida'}
                        </span>
                      </div>

                      {/* Alérgenos */}
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {Array.from(allAllergens).slice(0, 4).map(a => (
                          <div key={a} title={a} className="opacity-90 hover:opacity-100 transition-opacity">
                            <AllergenIcon allergen={a as any} size={14} />
                          </div>
                        ))}
                        {allAllergens.size > 4 && (
                          <span className="text-[7.5px] font-bold text-slate-400">+{allAllergens.size - 4}</span>
                        )}
                      </div>
                    </div>

                    {/* Barra de Acciones */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between mt-1">
                      <div className="flex items-center gap-0.5">
                        {isCommunity && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onEdit({
                                ...recipe, 
                                id: '', 
                                workspaceId: appUser?.workspaceId || '',
                                isPublic: false
                              }); 
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                            title="Duplicar a mis recetas"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDuplicate(recipe); }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                          title="Duplicar receta (para cambiar tipo a Eventos, Take Away, Pastelería, etc.)"
                        >
                          <Copy size={12} />
                        </button>
                        {(isMine || appUser?.role === 'admin') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all"
                            title="Editar Receta"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {(isMine || appUser?.role === 'admin') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onTogglePublic(recipe); }}
                            className={`p-1 rounded transition-all ${recipe.isPublic ? 'text-sky-600 hover:bg-sky-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                            title={recipe.isPublic ? "Pública (Click para hacer privada)" : "Privada (Click para hacer pública)"}
                          >
                            {recipe.isPublic ? <Unlock size={12} /> : <Lock size={12} />}
                          </button>
                        )}
                        {(isMine || appUser?.role === 'admin') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirm(`¿Borrar ${recipe.name}?`) && onDelete(recipe.id); }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Borrar"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div className={`px-2 py-0.5 bg-slate-900 ${recipe.takeAwayDetails?.isTakeAway ? 'group-hover:bg-amber-700' : 'group-hover:bg-emerald-700'} text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-colors`}>
                        Ver <Eye size={9} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* VISTA FOTO GRANDE (con la misma cabecera biselada identificativa)         */
              /* ========================================================================= */
              <div 
                key={recipe.id} 
                onClick={() => onView(recipe)}
                className={`bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all duration-300 border overflow-hidden flex flex-col group cursor-pointer relative ${info.border}`}
              >
                {/* Cabecera Biselada con Relieve y Sombra */}
                <div className={`px-4 py-2.5 border-b transition-all flex items-center justify-between gap-2 ${info.gradient}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`shrink-0 px-2 py-0.5 rounded ${info.badgeBg} font-black text-[8px] uppercase tracking-wider shadow-2xs`}>
                      {info.label}
                    </span>
                    <h3 
                      className="font-serif text-sm font-black uppercase tracking-tight truncate text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" 
                      title={recipe.name}
                    >
                      {recipe.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-black/20 backdrop-blur-xs rounded-lg p-0.5 border border-white/20 shrink-0">
                      <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight flex items-center gap-1 ${!recipe.isPublic ? 'bg-emerald-500 text-white' : 'text-white/60'}`}>
                        <Lock size={8} />
                        <span>Privado</span>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight flex items-center gap-1 ${recipe.isPublic ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/60'}`}>
                        <Users size={8} />
                        <span>Público</span>
                      </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded-md text-[7.5px] font-black uppercase tracking-tight flex items-center gap-1 shadow-2xs ${recipe.synced ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-amber-300 border border-amber-400/50'}`}>
                      {recipe.synced ? <Wifi size={8} /> : <HardDrive size={8} />}
                      <span>{recipe.synced ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Imagen Grande - object-right para enfocar exclusivamente la foto terminada de la derecha */}
                <div className="w-full aspect-[16/10] relative overflow-hidden bg-slate-100 shrink-0">
                  {recipe.photo ? (
                    <img 
                      src={recipe.photo} 
                      className="w-full h-full object-cover object-right group-hover:scale-104 transition-transform duration-500" 
                      alt="" 
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/50 text-slate-400">
                      <ChefHat size={34} strokeWidth={1.3} className="text-slate-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold mt-1 text-slate-400">Sin Fotografía</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>

                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider font-mono drop-shadow">
                      {recipe.yieldQuantity} {recipe.yieldUnit}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-black text-white font-mono leading-none block drop-shadow">{costPerPortion}€</span>
                      <span className="text-[7px] font-bold text-slate-200 uppercase tracking-wider drop-shadow">Coste / Ración</span>
                    </div>
                  </div>
                </div>

                {/* Contenido Central */}
                <div className="p-4 flex-grow flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {recipe.creatorLogo ? (
                        <img src={recipe.creatorLogo} className="w-4 h-4 rounded-full object-cover border border-slate-200" alt="" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Users size={8} />
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-slate-500 truncate">
                        {recipe.creator || 'Chef de Partida'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(recipe.categories || [recipe.category]).slice(0, 2).map(cat => (
                        <span key={cat} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[8px] font-bold text-slate-800 uppercase tracking-tight">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(allAllergens).slice(0, 5).map(a => (
                        <div key={a} title={a} className="opacity-90 hover:opacity-100 transition-opacity">
                          <AllergenIcon allergen={a as any} size={16} />
                        </div>
                      ))}
                      {allAllergens.size > 5 && (
                        <span className="text-[8px] font-bold text-slate-400 flex items-center">+{allAllergens.size - 5}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isCommunity && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onEdit({
                              ...recipe, 
                              id: '', 
                              workspaceId: appUser?.workspaceId || '',
                              isPublic: false
                            }); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Duplicar a mis recetas"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDuplicate(recipe); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Duplicar receta (para cambiar tipo a Eventos, Take Away, etc.)"
                      >
                        <Copy size={14} />
                      </button>
                      {(isMine || appUser?.role === 'admin') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                          title="Editar Receta"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {(isMine || appUser?.role === 'admin') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onTogglePublic(recipe); }}
                          className={`p-1.5 rounded-lg transition-all ${recipe.isPublic ? 'text-sky-600 hover:bg-sky-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                          title={recipe.isPublic ? "Pública (Click para hacer privada)" : "Privada (Click para hacer pública)"}
                        >
                          {recipe.isPublic ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                      )}
                      {(isMine || appUser?.role === 'admin') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirm(`¿Borrar ${recipe.name}?`) && onDelete(recipe.id); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className={`px-2.5 py-1 bg-slate-900 ${recipe.takeAwayDetails?.isTakeAway ? 'group-hover:bg-amber-700' : 'group-hover:bg-emerald-700'} text-white rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-colors ml-1`}>
                        Ver <Eye size={11} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
              <ChefHat size={44} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron fichas</h3>
              <p className="text-xs text-slate-500 mt-1">Prueba con otros términos de búsqueda o añade una nueva ficha.</p>
              <button
                onClick={onNew}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={15} /> Crear Nueva Ficha
              </button>
            </div>
          )}
        </div>

        {filteredRecipes.length > displayLimit && (
          <div className="mt-10 flex justify-center">
            <button 
              onClick={() => setDisplayLimit(prev => prev + 12)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xs transition-all"
            >
              Cargar más recetas
            </button>
          </div>
        )}

        {/* Modal de Diagnóstico de Base de Datos */}
        {showDbModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 relative text-slate-800">
              <button 
                onClick={() => setShowDbModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                  <Server size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Estado de la Base de Datos</h3>
                  <p className="text-xs text-slate-500 font-mono">Firebase Firestore Cloud</p>
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Conexión en Directo:</span>
                  <span className={`font-bold flex items-center gap-1 ${dbStatus === 'connected' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {dbStatus === 'connected' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {dbStatus === 'connected' ? 'En Línea' : 'Error de Conexión'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Latencia de Respuesta:</span>
                  <span className="font-mono font-bold text-slate-900">{dbLatency !== null ? `${dbLatency} ms` : 'Desconocida'}</span>
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
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                >
                  <RefreshCw size={14} /> Recomprobar
                </button>
                <button 
                  onClick={() => setShowDbModal(false)} 
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
