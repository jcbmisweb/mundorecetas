import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Compass, Calendar, FlaskConical, Database, 
  Sparkles, Users, Settings, LogOut, ChevronLeft, ChevronRight, 
  Menu, X, Server, CheckCircle2, AlertCircle, RefreshCw, Plus, 
  ChefHat, Layers, ShieldCheck, Flame, Wand2, School, Calculator
} from 'lucide-react';
import { AppUser, AppSettings, isUserAdmin } from '../types';

export type ActiveWorkspace = 
  | 'DASHBOARD' 
  | 'PRO_WORKSHOP' 
  | 'MENU_PLANNER' 
  | 'PRODUCT_DB' 
  | 'CALCULATOX'
  | 'AI_BRIDGE' 
  | 'PROMPT_HUB'
  | 'USER_MANAGEMENT' 
  | 'FLAVOR_LAB';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  recipesCount: number;
  proRecipesCount: number;
  menusCount: number;
  productsCount: number;
  appUser: AppUser | null;
  settings: AppSettings;
  dbStatus: 'checking' | 'connected' | 'error';
  dbLatency: number | null;
  onOpenNewRecipe: () => void;
  onOpenNewProRecipe?: () => void;
  onOpenSettings: () => void;
  onOpenSchoolSettings?: () => void;
  onOpenDataBackup?: () => void;
  onOpenMigration?: () => void;
  onOpenFlavorLab: () => void;
  onOpenDbModal: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  syncState?: { isSyncing: boolean; unsyncedCount: number; message?: string };
  onTriggerSync?: () => void;
  onOpenAlphabeticalIndex?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  recipesCount,
  proRecipesCount,
  menusCount,
  productsCount,
  appUser,
  settings,
  dbStatus,
  dbLatency,
  onOpenNewRecipe,
  onOpenNewProRecipe,
  onOpenSettings,
  onOpenSchoolSettings,
  onOpenDataBackup,
  onOpenMigration,
  onOpenFlavorLab,
  onOpenDbModal,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
  syncState,
  onTriggerSync,
  onOpenAlphabeticalIndex
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atelier_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('atelier_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isActuallyAdmin = isUserAdmin(appUser);

  // Determinar espacio de trabajo activo actual
  const isDashboard = currentView === 'DASHBOARD' || currentView === 'VIEWER' || currentView === 'EDITOR';
  const isProWorkshop = currentView === 'PRO_WORKSHOP' || currentView === 'PRO_EDITOR' || currentView === 'PRO_VIEWER' || currentView === 'PRO_GUIDE';
  const isMenuPlanner = currentView === 'MENU_PLANNER';
  const isProductDb = currentView === 'PRODUCT_DB';
  const isCalculatox = currentView === 'CALCULATOX';
  const isAiBridge = currentView === 'AI_BRIDGE';
  const isPromptHub = currentView === 'PROMPT_HUB';
  const isUserManagement = currentView === 'USER_MANAGEMENT';

  const navItems = [
    {
      id: 'DASHBOARD',
      label: 'Recetario & Fichas',
      subtitle: 'Base de datos técnica',
      icon: BookOpen,
      isActive: isDashboard,
      count: recipesCount,
      // Identidad cromática: Azul cielo / Pizarra
      activeClass: 'bg-sky-50 text-sky-950 border-sky-600 shadow-sm font-semibold',
      iconClass: 'text-sky-700 bg-sky-100',
      badgeClass: 'bg-sky-200 text-sky-900',
      tagColor: 'border-sky-500',
      onClick: () => { onNavigate('DASHBOARD'); setIsMobileOpen(false); }
    },
    {
      id: 'ALPHABETICAL_INDEX',
      label: 'Directorio A-Z',
      subtitle: 'Buscador offline inteligente',
      icon: Layers,
      isActive: false,
      count: recipesCount,
      activeClass: 'bg-indigo-50 text-indigo-950 border-indigo-600 shadow-sm font-semibold',
      iconClass: 'text-indigo-700 bg-indigo-100',
      badgeClass: 'bg-indigo-200 text-indigo-900',
      tagColor: 'border-indigo-500',
      onClick: () => { 
        if (onOpenAlphabeticalIndex) onOpenAlphabeticalIndex();
        setIsMobileOpen(false); 
      }
    },
    {
      id: 'PRO_WORKSHOP',
      label: 'Taller I+D Michelin',
      subtitle: 'Creación de vanguardia (5 niveles)',
      icon: Compass,
      isActive: isProWorkshop,
      count: proRecipesCount,
      // Identidad cromática: Melocotón cálido / Naranja terracota
      activeClass: 'bg-amber-50/80 text-amber-950 border-amber-600 shadow-sm font-semibold',
      iconClass: 'text-amber-700 bg-amber-100',
      badgeClass: 'bg-amber-200 text-amber-900',
      tagColor: 'border-amber-500',
      onClick: () => { onNavigate('PRO_WORKSHOP'); setIsMobileOpen(false); }
    },
    {
      id: 'MENU_PLANNER',
      label: 'Creación de Menús',
      subtitle: 'Planificación & Órdenes',
      icon: Calendar,
      isActive: isMenuPlanner,
      count: menusCount,
      // Identidad cromática: Verde menta / Salvia
      activeClass: 'bg-emerald-50/80 text-emerald-950 border-emerald-600 shadow-sm font-semibold',
      iconClass: 'text-emerald-700 bg-emerald-100',
      badgeClass: 'bg-emerald-200 text-emerald-900',
      tagColor: 'border-emerald-500',
      onClick: () => { onNavigate('MENU_PLANNER'); setIsMobileOpen(false); }
    },
    {
      id: 'FLAVOR_LAB',
      label: 'Flavor Lab I+D',
      subtitle: 'Maridajes moleculares',
      icon: FlaskConical,
      isActive: false,
      count: null,
      // Identidad cromática: Lavanda / Violeta
      activeClass: 'bg-violet-50 text-violet-950 border-violet-600 shadow-sm font-semibold',
      iconClass: 'text-violet-700 bg-violet-100',
      badgeClass: 'bg-violet-200 text-violet-900',
      tagColor: 'border-violet-500',
      onClick: () => { onOpenFlavorLab(); setIsMobileOpen(false); }
    },
    {
      id: 'PRODUCT_DB',
      label: 'Inventario Maestro',
      subtitle: 'Economato & Escandallos',
      icon: Database,
      isActive: isProductDb,
      count: productsCount,
      // Identidad cromática: Ámbar / Canela
      activeClass: 'bg-amber-50 text-amber-950 border-amber-500 shadow-sm font-semibold',
      iconClass: 'text-amber-700 bg-amber-100',
      badgeClass: 'bg-amber-200 text-amber-900',
      tagColor: 'border-amber-400',
      onClick: () => { onNavigate('PRODUCT_DB'); setIsMobileOpen(false); }
    },
    {
      id: 'CALCULATOX',
      label: 'CALCULATOX 🧪',
      subtitle: 'Dosificación & 81 Aditivos SOSA',
      icon: Calculator,
      isActive: isCalculatox,
      count: null,
      // Identidad cromática: Esmeralda / Turquesa técnico
      activeClass: 'bg-emerald-50 text-emerald-950 border-emerald-600 shadow-sm font-semibold',
      iconClass: 'text-emerald-700 bg-emerald-100',
      badgeClass: 'bg-emerald-200 text-emerald-900',
      tagColor: 'border-emerald-500',
      onClick: () => { onNavigate('CALCULATOX'); setIsMobileOpen(false); }
    },
    {
      id: 'PROMPT_HUB',
      label: 'Taller de Prompts IA',
      subtitle: 'Láminas 16:9 & Digitalización',
      icon: Wand2,
      isActive: isPromptHub,
      count: null,
      // Identidad cromática: Fucsia / Rosa
      activeClass: 'bg-rose-50 text-rose-950 border-rose-600 shadow-sm font-semibold',
      iconClass: 'text-rose-700 bg-rose-100',
      badgeClass: 'bg-rose-200 text-rose-900',
      tagColor: 'border-rose-500',
      onClick: () => { onNavigate('PROMPT_HUB'); setIsMobileOpen(false); }
    },
    {
      id: 'AI_BRIDGE',
      label: 'Digitalizar con IA',
      subtitle: 'Importador inteligente',
      icon: Sparkles,
      isActive: isAiBridge,
      count: null,
      // Identidad cromática: Púrpura / Índigo
      activeClass: 'bg-purple-50 text-purple-950 border-purple-600 shadow-sm font-semibold',
      iconClass: 'text-purple-700 bg-purple-100',
      badgeClass: 'bg-purple-200 text-purple-900',
      tagColor: 'border-purple-500',
      onClick: () => { onNavigate('AI_BRIDGE'); setIsMobileOpen(false); }
    }
  ];

  return (
    <>
      {/* Overlay para móviles */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden print:hidden"
        />
      )}

      {/* Barra Lateral Principal */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-white border-r border-slate-200/90 shadow-sm transition-all duration-300 ease-in-out print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-[76px]' : 'w-[270px]'}`}
      >
        {/* Cabecera / Identidad */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              {appUser?.instituteLogo || settings.instituteLogo ? (
                <img 
                  src={appUser?.instituteLogo || settings.instituteLogo} 
                  className="w-full h-full object-cover rounded-xl" 
                  alt="" 
                />
              ) : (
                <ChefHat size={22} className="text-amber-400" />
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-serif text-sm font-bold text-slate-900 tracking-tight truncate">
                  RECETAS JCB
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {appUser?.instituteName || settings.instituteName || 'I+D & RECETARIO'}
                </p>
              </div>
            )}
          </div>

          {/* Botón de colapso en desktop / cerrar en móvil */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              title="Cerrar menú"
            >
              <X size={18} />
            </button>
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={isCollapsed ? "Expandir menú lateral" : "Plegar menú lateral"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Botón de Acción Principal destacado */}
        <div className="p-3 border-b border-slate-100">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  if (isProWorkshop && onOpenNewProRecipe) {
                    onOpenNewProRecipe();
                  } else {
                    onOpenNewRecipe();
                  }
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-sm hover:shadow transition-all group ${
                  isProWorkshop 
                    ? 'bg-amber-800 hover:bg-amber-900' 
                    : isMenuPlanner
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
                title={isProWorkshop ? "Crear nueva receta de alta gastronomía" : "Crear nueva ficha técnica"}
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform stroke-[2.5]" />
                <span>
                  {isProWorkshop ? 'Nueva Ficha I+D' : isMenuPlanner ? 'Nuevo Menú' : 'Nueva Ficha'}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (isProWorkshop && onOpenNewProRecipe) {
                  onOpenNewProRecipe();
                } else {
                  onOpenNewRecipe();
                }
              }}
              className={`w-full aspect-square flex items-center justify-center rounded-xl text-white shadow-sm transition-all ${
                isProWorkshop ? 'bg-amber-800 hover:bg-amber-900' : 'bg-slate-900 hover:bg-slate-800'
              }`}
              title="Nueva Ficha"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Lista de Navegación por Espacios de Trabajo */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Espacios de Trabajo
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={isCollapsed ? `${item.label} · ${item.subtitle}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left relative group ${
                  active 
                    ? `${item.activeClass} border-l-4` 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${item.iconClass}`}>
                  <Icon size={18} />
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.count !== null && item.count !== undefined && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${item.badgeClass || 'bg-slate-100 text-slate-700'}`}>
                          {item.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate font-normal">
                      {item.subtitle}
                    </p>
                  </div>
                )}
              </button>
            );
          })}

          {/* Sección de Gestión & Herramientas */}
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Ajustes & Gestión
              </div>
            )}

            {/* 1. Ajustes de Escuela */}
            <button
              onClick={() => {
                if (onOpenSchoolSettings) onOpenSchoolSettings();
                else onOpenSettings();
                setIsMobileOpen(false);
              }}
              title={isCollapsed ? "Ajustes de la Escuela: Centro, Docente y Horarios" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-700 hover:text-slate-900 hover:bg-amber-50/80 transition-all group font-medium"
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 group-hover:scale-105 transition-transform">
                <School size={17} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate text-slate-800">Ajustes de Escuela</span>
                  <span className="text-[10px] text-slate-400 block truncate">Centro, Docente y Horario</span>
                </div>
              )}
            </button>

            {/* 2. Datos y Backup */}
            <button
              onClick={() => {
                if (onOpenDataBackup) onOpenDataBackup();
                else onOpenSettings();
                setIsMobileOpen(false);
              }}
              title={isCollapsed ? "Datos y Backup: Copias JSON, Firestore & Migrador" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-700 hover:text-slate-900 hover:bg-sky-50 transition-all group font-medium"
            >
              <div className="p-2 rounded-lg bg-sky-100 text-sky-800 shrink-0 group-hover:scale-105 transition-transform">
                <Database size={17} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate text-slate-800">Datos y Backup</span>
                  <span className="text-[10px] text-slate-400 block truncate">Copias, Firestore & Migrador</span>
                </div>
              )}
            </button>

            {isActuallyAdmin && (
              <button
                onClick={() => { onNavigate('USER_MANAGEMENT'); setIsMobileOpen(false); }}
                title={isCollapsed ? "Gestión de Usuarios y Permisos" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                  isUserManagement 
                    ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-slate-900' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <Users size={17} />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold block truncate">Usuarios & Roles</span>
                    <span className="text-[10px] text-slate-400 block truncate">Control de accesos</span>
                  </div>
                )}
              </button>
            )}

            {onOpenMigration && (
              <button
                onClick={() => { onOpenMigration(); setIsMobileOpen(false); }}
                title={isCollapsed ? "Migrar / Copia de 150+ Recetas" : undefined}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
                  <Layers size={17} />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold block truncate">Migrador 150+</span>
                    <span className="text-[10px] text-slate-400 block truncate">Sincronización en masa</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer del Sidebar: Estado DB, Perfil & Ajustes */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
          {/* Indicador de Sincronización Local / Offline-First */}
          {syncState && (
            <button
              type="button"
              onClick={onTriggerSync}
              disabled={syncState.isSyncing}
              className={`w-full p-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-between border ${
                syncState.unsyncedCount > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                  : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={syncState.unsyncedCount > 0 ? 'Clic para sincronizar cambios pendientes con la nube' : 'Todo sincronizado en local y nube'}
            >
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw size={13} className={`${syncState.isSyncing ? 'animate-spin text-amber-600' : syncState.unsyncedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                {!isCollapsed && (
                  <span className="truncate">
                    {syncState.isSyncing
                      ? 'Sincronizando...'
                      : syncState.unsyncedCount > 0
                      ? `⚡ ${syncState.unsyncedCount} sin sincronizar`
                      : '✓ Guardado en Local'}
                  </span>
                )}
              </div>
              {!isCollapsed && syncState.unsyncedCount > 0 && !syncState.isSyncing && (
                <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[8px] font-black">
                  Sync
                </span>
              )}
            </button>
          )}

          {/* Indicador de Estado DB */}
          <button
            onClick={onOpenDbModal}
            title="Diagnóstico de Base de Datos Firebase Firestore"
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 text-[10px] font-semibold transition-all text-left shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                {dbStatus === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : dbStatus === 'checking' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              {!isCollapsed && (
                <span className="truncate text-slate-700">
                  {dbStatus === 'connected' ? 'Firebase Firestore' : dbStatus === 'checking' ? 'Conectando...' : 'Reconectar Firebase'}
                </span>
              )}
            </div>
            {!isCollapsed && dbLatency !== null && dbStatus === 'connected' && (
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold shrink-0">
                {dbLatency}ms
              </span>
            )}
          </button>

          {/* Perfil & Ajustes */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              {appUser?.photoUrl ? (
                <img 
                  src={appUser.photoUrl} 
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" 
                  alt="" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {appUser?.displayName?.[0] || 'C'}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {appUser?.displayName || 'Chef'}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {isActuallyAdmin ? 'Administrador' : 'Chef de Cocina'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={onOpenSchoolSettings || onOpenSettings}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                title="Ajustes de la Escuela"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
