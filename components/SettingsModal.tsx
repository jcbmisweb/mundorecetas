import React, { useState, useEffect, useRef } from 'react';
import { 
  AppSettings, AppBackup, Recipe, Product, AppUser, MenuPlan, 
  isUserAdmin, DEFAULT_WORK_SCHEDULE, WorkScheduleDay 
} from '../types';
import { 
  X, Save, Upload, School, User, Database, Download, Tag, 
  Plus, Trash2, Mail, Clock, Users, ShieldAlert, CheckCircle2,
  Layers, HardDrive
} from 'lucide-react';
import { compressImage } from '../lib/imageUtils';
import { db, testFirestoreConnection } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'school' | 'backup';
  settings: AppSettings;
  recipes: Recipe[];
  productDatabase: Product[];
  savedMenus: MenuPlan[];
  appUser: AppUser | null;
  onSave: (settings: AppSettings) => void;
  onUpdateUser: (user: Partial<AppUser>) => void;
  onRestore: (backup: AppBackup) => void;
  onInviteUser: (email: string) => void;
  onDeleteAccount: () => void;
  onOpenMigration?: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'school',
  settings, 
  recipes, 
  productDatabase, 
  savedMenus, 
  appUser, 
  onSave, 
  onUpdateUser, 
  onRestore, 
  onInviteUser, 
  onDeleteAccount, 
  onOpenMigration, 
  onOpenSupabaseConfig 
}) => {
  const [activeTab, setActiveTab] = useState<'school' | 'backup'>(initialTab);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localUser, setLocalUser] = useState<Partial<AppUser>>(appUser || {});
  const [newCat, setNewCat] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    recipes: true,
    products: true,
    menus: true,
    settings: true,
    users: false,
    invites: false
  });
  const [pingStatus, setPingStatus] = useState<{ loading?: boolean; success?: boolean; latencyMs?: number; error?: string }>({});

  
  const instituteLogoInputRef = useRef<HTMLInputElement>(null);
  const teacherLogoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const isActuallyAdmin = isUserAdmin(appUser);

  useEffect(() => {
    setLocalSettings(settings);
    if (appUser) {
      setLocalUser({
        ...appUser,
        instituteName: appUser.instituteName || settings.instituteName || 'IES LA FLOTA',
        teacherName: appUser.teacherName || settings.teacherName || 'JUAN CODINA BARRANCO',
        instituteLogo: appUser.instituteLogo || settings.instituteLogo || '',
        teacherLogo: appUser.teacherLogo || settings.teacherLogo || ''
      });
    }
  }, [settings, appUser, isOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'teacherLogo' | 'instituteLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400);
        setLocalUser(prev => ({ ...prev, [field]: compressed }));
        setLocalSettings(prev => ({ ...prev, [field]: compressed }));
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }
  };

  const handleRemoveImage = (field: 'teacherLogo' | 'instituteLogo') => {
    setLocalUser(prev => ({ ...prev, [field]: '' }));
    setLocalSettings(prev => ({ ...prev, [field]: '' }));
    if (field === 'instituteLogo' && instituteLogoInputRef.current) {
      instituteLogoInputRef.current.value = '';
    }
    if (field === 'teacherLogo' && teacherLogoInputRef.current) {
      teacherLogoInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const instituteName = localUser.instituteName?.trim() || localSettings.instituteName?.trim() || 'IES LA FLOTA';
    const teacherName = localUser.teacherName?.trim() || localSettings.teacherName?.trim() || 'JUAN CODINA BARRANCO';
    const instituteLogo = localUser.instituteLogo || localSettings.instituteLogo || '';
    const teacherLogo = localUser.teacherLogo || localSettings.teacherLogo || '';

    const updatedSettings: AppSettings = {
      ...localSettings,
      instituteName,
      teacherName,
      instituteLogo,
      teacherLogo
    };

    const updatedUser: Partial<AppUser> = {
      ...localUser,
      instituteName,
      teacherName,
      instituteLogo,
      teacherLogo
    };

    onSave(updatedSettings);
    onUpdateUser(updatedUser);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleDownloadBackup = async () => {
    let exportRecipes = recipes;

    if (backupOptions.recipes) {
      try {
        const snapshot = await getDocs(collection(db, 'recipes'));
        if (!snapshot.empty) {
          const allDbRecipes = snapshot.docs.map(d => d.data() as Recipe);
          exportRecipes = isActuallyAdmin 
            ? allDbRecipes 
            : allDbRecipes.filter(r => r.workspaceId === appUser?.workspaceId || r.isPublic);
        }
      } catch (err) {
        console.warn("Using local recipes state as fallback for backup:", err);
        exportRecipes = isActuallyAdmin ? recipes : recipes.filter(r => r.workspaceId === appUser?.workspaceId);
      }
    }

    const backup: any = {
      version: 2,
      timestamp: Date.now(),
    };

    if (backupOptions.settings) backup.settings = localSettings;
    if (backupOptions.recipes) backup.recipes = exportRecipes;
    if (backupOptions.products) backup.productDatabase = productDatabase;
    if (backupOptions.menus) {
      backup.savedMenus = isActuallyAdmin 
        ? savedMenus 
        : savedMenus.filter(m => m.workspaceId === appUser?.workspaceId);
    }

    if (isActuallyAdmin) {
      try {
        if (backupOptions.users) {
          const usersSnap = await getDocs(collection(db, 'users'));
          if (!usersSnap.empty) {
            backup.users = usersSnap.docs.map(d => d.data());
          }
        }
        if (backupOptions.invites) {
          const invitesSnap = await getDocs(collection(db, 'workspace_invites'));
          if (!invitesSnap.empty) {
            backup.invites = invitesSnap.docs.map(d => d.data());
          }
        }
      } catch (e) {
        console.error("Error fetching admin data for backup:", e);
      }
    }

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const prefix = isActuallyAdmin ? 'FULL_DATABASE' : 'MIS_RECETAS';
    downloadAnchorNode.download = `${prefix}_backup_${dateStr}.json`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    URL.revokeObjectURL(url);
  };

  const addCategory = () => {
    if (newCat.trim()) {
      const name = newCat.trim();
      setLocalSettings({
        ...localSettings,
        categories: [...(localSettings.categories || []), name],
        categoryConfigs: [...(localSettings.categoryConfigs || []), { name, colors: ['#94a3b8'] }]
      });
      setNewCat('');
    }
  };

  const updateCategory = (index: number, newName: string) => {
    const oldName = localSettings.categories[index];
    const updated = [...localSettings.categories];
    updated[index] = newName;
    
    const configs = [...(localSettings.categoryConfigs || [])];
    const configIdx = configs.findIndex(c => c.name === oldName);
    if (configIdx !== -1) {
      configs[configIdx].name = newName;
    } else {
      configs.push({ name: newName, colors: ['#94a3b8'] });
    }
    
    setLocalSettings({ ...localSettings, categories: updated, categoryConfigs: configs });
  };

  const removeCategory = (cat: string) => {
    if (confirm(`¿Eliminar la categoría "${cat}"?`)) {
      setLocalSettings({
        ...localSettings,
        categories: localSettings.categories.filter(c => c !== cat),
        categoryConfigs: (localSettings.categoryConfigs || []).filter(c => c.name !== cat)
      });
    }
  };

  const updateCategoryColors = (catName: string, colors: string[]) => {
    const configs = [...(localSettings.categoryConfigs || [])];
    const idx = configs.findIndex(c => c.name === catName);
    if (idx !== -1) {
      configs[idx].colors = colors;
    } else {
      configs.push({ name: catName, colors });
    }
    setLocalSettings({ ...localSettings, categoryConfigs: configs });
  };

  const currentInstituteName = localUser.instituteName || localSettings.instituteName || 'IES LA FLOTA';
  const currentTeacherName = localUser.teacherName || localSettings.teacherName || 'JUAN CODINA BARRANCO';
  const currentInstituteLogo = localUser.instituteLogo || localSettings.instituteLogo || '';
  const currentTeacherLogo = localUser.teacherLogo || localSettings.teacherLogo || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Cabecera Principal con Pestañas de Navegación Claras */}
        <div className="bg-slate-900 text-white shrink-0">
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Panel de Configuración
              </h2>
              <p className="text-xs text-slate-400">
                Gestión integral de escuela, docencia y datos del recetario
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X size={22} />
            </button>
          </div>

          {/* Selector de Pestañas: 1. Ajustes de Escuela  |  2. Datos y Backup */}
          <div className="flex border-t border-slate-800/80 bg-slate-950/60 px-4">
            <button
              onClick={() => setActiveTab('school')}
              className={`flex items-center gap-2.5 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'school'
                  ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <School size={16} className={activeTab === 'school' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Ajustes de Escuela</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2.5 py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'backup'
                  ? 'border-sky-400 text-sky-300 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Database size={16} className={activeTab === 'backup' ? 'text-sky-400' : 'text-slate-400'} />
              <span>Datos y Backup</span>
            </button>
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          
          {/* ======================================================== */}
          {/* APARTADO 1: AJUSTES DE ESCUELA                           */}
          {/* ======================================================== */}
          {activeTab === 'school' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Bloque 1 & 2: Escuela / Centro y Profesor / Responsable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. ESCUELA / CENTRO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <School size={18} className="text-amber-600" />
                    <span className="text-sm uppercase tracking-wide">Escuela / Centro</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Nombre del Centro:
                    </label>
                    <input 
                      type="text" 
                      value={currentInstituteName} 
                      onChange={e => {
                        const val = e.target.value;
                        setLocalUser(prev => ({ ...prev, instituteName: val }));
                        setLocalSettings(prev => ({ ...prev, instituteName: val }));
                      }} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
                      placeholder="Ej: IES LA FLOTA" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Logotipo del Centro:
                    </label>

                    {/* Previsualización del Logo si existe */}
                    {currentInstituteLogo ? (
                      <div className="relative aspect-video max-h-32 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group mb-2">
                        <img 
                          src={currentInstituteLogo} 
                          className="h-full w-full object-contain p-2" 
                          alt="Logo del Centro" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('instituteLogo')}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm opacity-90 hover:opacity-100 transition-all text-xs font-bold flex items-center gap-1"
                          title="Quitar logotipo"
                        >
                          <Trash2 size={13} /> Quitar
                        </button>
                      </div>
                    ) : null}

                    {/* Selector de Archivo Nativo y Claro */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="cursor-pointer px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0">
                        <Upload size={14} /> Seleccionar archivo
                        <input 
                          type="file" 
                          ref={instituteLogoInputRef}
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'instituteLogo')} 
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate font-medium">
                        {currentInstituteLogo ? "Archivo de logo seleccionado" : "Ningún archivo seleccionado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PROFESOR / RESPONSABLE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <User size={18} className="text-amber-600" />
                    <span className="text-sm uppercase tracking-wide">Profesor / Responsable</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Nombre del Profesor / Responsable:
                    </label>
                    <input 
                      type="text" 
                      value={currentTeacherName} 
                      onChange={e => {
                        const val = e.target.value;
                        setLocalUser(prev => ({ ...prev, teacherName: val }));
                        setLocalSettings(prev => ({ ...prev, teacherName: val }));
                      }} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
                      placeholder="Ej: JUAN CODINA BARRANCO" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Foto o Firma del Profesor:
                    </label>

                    {/* Previsualización Circular */}
                    {currentTeacherLogo ? (
                      <div className="relative w-24 h-24 mx-auto bg-slate-100 rounded-full border-2 border-amber-300 flex items-center justify-center overflow-hidden group mb-2 shadow-xs">
                        <img 
                          src={currentTeacherLogo} 
                          className="h-full w-full object-cover" 
                          alt="Foto del Profesor" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('teacherLogo')}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                          title="Eliminar foto"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}

                    {/* Selector de Archivo Nativo y Claro */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="cursor-pointer px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0">
                        <Upload size={14} /> Seleccionar archivo
                        <input 
                          type="file" 
                          ref={teacherLogoInputRef}
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'teacherLogo')} 
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate font-medium">
                        {currentTeacherLogo ? "Foto seleccionada" : "Ningún archivo seleccionado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 3: GESTIÓN DE CATEGORÍAS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Tag size={18} className="text-indigo-600" />
                    <span className="text-sm uppercase tracking-wide">Gestión de Categorías</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {localSettings.categories?.length || 0} categorías
                  </span>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCat} 
                    onChange={e => setNewCat(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                    className="flex-grow px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="Nueva categoría culinaria (ej: Pastelería Salada)..." 
                  />
                  <button 
                    onClick={addCategory} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                  >
                    <Plus size={16} /> Añadir
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {localSettings.categories?.map((c, idx) => {
                    const config = localSettings.categoryConfigs?.find(conf => conf.name === c) || { name: c, colors: ['#94a3b8'] };
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <input 
                            type="text" 
                            value={c} 
                            onChange={(e) => updateCategory(idx, e.target.value)} 
                            className="bg-transparent border-none text-xs font-black text-slate-800 flex-grow focus:ring-0 p-0 uppercase tracking-tight"
                          />
                          <button 
                            onClick={() => removeCategory(c)} 
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Color:</span>
                            <div className="flex gap-1 items-center">
                              {config.colors.map((color, cIdx) => (
                                <div key={cIdx} className="relative group/color">
                                  <input 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => {
                                      const newColors = [...config.colors];
                                      newColors[cIdx] = e.target.value;
                                      updateCategoryColors(c, newColors);
                                    }}
                                    className="w-5 h-5 rounded-full border border-white shadow-xs cursor-pointer p-0"
                                    title="Modificar color"
                                  />
                                  {config.colors.length > 1 && (
                                    <button 
                                      onClick={() => {
                                        const newColors = config.colors.filter((_, i) => i !== cIdx);
                                        updateCategoryColors(c, newColors);
                                      }}
                                      className="absolute -top-1 -right-1 bg-white text-slate-500 rounded-full shadow-xs hover:text-rose-500 opacity-0 group-hover/color:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {config.colors.length < 3 && (
                                <button 
                                  onClick={() => updateCategoryColors(c, [...config.colors, '#94a3b8'])}
                                  className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-700 transition-all text-[10px]"
                                  title="Añadir franja adicional"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex h-3 w-14 rounded-full overflow-hidden border border-white shadow-2xs">
                            {config.colors.map((color, cIdx) => (
                              <div key={cIdx} style={{ backgroundColor: color }} className="flex-grow h-full" />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bloque 4: HORARIO SEMANAL DE TALLER Y GRUPOS PREDETERMINADO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Clock size={18} className="text-indigo-600" />
                    <span className="text-sm uppercase tracking-wide">
                      Horario Semanal de Taller y Grupos (Predeterminado)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                    <Users size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">Brigadas habituales:</span>
                    <select 
                      value={localSettings.defaultGroupCount || 4} 
                      onChange={e => setLocalSettings({ ...localSettings, defaultGroupCount: Number(e.target.value) })}
                      className="bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-xs font-black text-indigo-700 outline-none"
                    >
                      {[1,2,3,4,5,6,7,8,10,12].map(n => (
                        <option key={n} value={n}>{n} grupos</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Marca los días lectivos de taller y sus horas de servicio. Este horario se precargará de manera automática en todos los menús semanales.
                </p>

                <div className="space-y-2">
                  {(localSettings.workSchedule || DEFAULT_WORK_SCHEDULE).map((item, idx) => {
                    const currentSchedule = localSettings.workSchedule || DEFAULT_WORK_SCHEDULE;
                    const updateDay = (field: keyof WorkScheduleDay, value: any) => {
                      const next = [...currentSchedule];
                      next[idx] = { ...next[idx], [field]: value };
                      setLocalSettings({ ...localSettings, workSchedule: next });
                    };

                    return (
                      <div 
                        key={item.day} 
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          item.enabled 
                            ? 'bg-white border-indigo-200 shadow-2xs' 
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer shrink-0 min-w-[140px]">
                          <input 
                            type="checkbox" 
                            checked={item.enabled} 
                            onChange={e => updateDay('enabled', e.target.checked)} 
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                          />
                          <span className={`text-xs font-black uppercase tracking-wider ${item.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                            {item.day}
                          </span>
                        </label>

                        {item.enabled ? (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400 font-bold text-[10px] uppercase">De:</span>
                              <input 
                                type="time" 
                                value={item.startTime || '08:30'} 
                                onChange={e => updateDay('startTime', e.target.value)} 
                                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                              />
                              <span className="text-slate-400 font-bold text-[10px] uppercase">A:</span>
                              <input 
                                type="time" 
                                value={item.endTime || '14:30'} 
                                onChange={e => updateDay('endTime', e.target.value)} 
                                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                              />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Sesión (ej: Pase de Comedor, Fondos...)"
                              value={item.notes || ''} 
                              onChange={e => updateDay('notes', e.target.value)} 
                              className="flex-grow sm:w-48 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase italic">
                            Sin taller docente este día
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bloque 5: EQUIPO Y COLABORADORES */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                  <Mail size={18} className="text-emerald-600" />
                  <span className="text-sm uppercase tracking-wide">Equipo y Colaboradores</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
                  <p className="text-xs text-emerald-900 mb-3 leading-relaxed">
                    Invita a otros profesores del centro o alumnos a tu espacio de trabajo. Compartirán tus fichas técnicas, recetas y menús de taller.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="email" 
                      placeholder="Correo electrónico del profesor o alumno..." 
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="flex-grow px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                    <button 
                      onClick={() => {
                        if (inviteEmail) {
                          onInviteUser(inviteEmail);
                          setInviteEmail('');
                          alert('Invitación enviada. Cuando el usuario inicie sesión, se unirá automáticamente a tu espacio.');
                        }
                      }}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={15} /> Invitar
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* APARTADO 2: DATOS Y BACKUP                               */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fadeIn">
              
               {/* Tarjeta 1: Conexión Firebase Firestore Cloud */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded text-[9px] font-black uppercase tracking-wider">
                      Google Cloud Firestore Activo
                    </span>
                    <h4 className="text-xs font-black uppercase tracking-tight text-white">
                      Base de Datos en Tiempo Real Firebase
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-lg">
                    Conexión empresarial gestionada con Google Cloud Firestore. Almacena recetas, productos e historiales con persistencia continua 24/7 sin pausas por inactividad.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setPingStatus({ loading: true });
                    try {
                      const res = await testFirestoreConnection();
                      setPingStatus({ loading: false, success: res.ok, latencyMs: res.latency });
                    } catch (err: any) {
                      setPingStatus({ loading: false, success: false, error: err?.message || 'Error' });
                    }
                  }}
                  disabled={pingStatus.loading}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <Database size={15} /> {pingStatus.loading ? 'Comprobando...' : 'Comprobar Firestore'}
                </button>
              </div>

              {/* Tarjeta: Estado de Alta Disponibilidad */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded text-[9px] font-black uppercase tracking-wider">
                      Disponibilidad Continua 24/7
                    </span>
                    <h4 className="text-xs font-black uppercase tracking-tight text-white">
                      Sin Pausas por Inactividad (Sin Sleep)
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-100 font-medium leading-relaxed max-w-lg">
                    A diferencia de servicios con suspensiones por 7 días de inactividad, Firebase Firestore permanece siempre despierto y activo permanentemente. Las consultas responden de forma inmediata.
                  </p>
                  {pingStatus.success !== undefined && (
                    <div className="text-[11px] font-bold mt-1">
                      {pingStatus.success ? (
                        <span className="text-emerald-300">✓ Conectado a Firestore (Latencia: {pingStatus.latencyMs}ms)</span>
                      ) : (
                        <span className="text-rose-300">✗ Error: {pingStatus.error}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 2: Migrador Masivo a Firebase */}
              {onOpenMigration && (
                <div className="bg-white border border-amber-300/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black uppercase tracking-wider">
                        Sincronización Masiva
                      </span>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">
                        Migrador a Firebase Firestore (150+ Recetas e Inventario)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Traspasa automáticamente todo el recetario escolar y economato desde copias locales o JSON directamente a la nube de Firestore.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMigration();
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Layers size={15} /> Abrir Migrador
                  </button>
                </div>
              )}

              {/* Tarjeta 3: Copia de Seguridad & Restauración (JSON) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <HardDrive size={18} className="text-sky-600" />
                    <span className="text-sm uppercase tracking-wide">Copia de Seguridad & Restauración</span>
                  </div>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                    Formato JSON Universal
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {isActuallyAdmin 
                    ? 'Como administrador, puedes descargar una copia integral de toda la base de datos o seleccionar los módulos específicos que deseas respaldar.' 
                    : 'Descarga una copia de seguridad personal con tus recetas, productos y menús del centro.'}
                </p>

                {/* Opciones de selección para el Backup */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={backupOptions.recipes} 
                      onChange={e => setBackupOptions({...backupOptions, recipes: e.target.checked})} 
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-700">Recetas ({recipes.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={backupOptions.products} 
                      onChange={e => setBackupOptions({...backupOptions, products: e.target.checked})} 
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-700">Productos ({productDatabase.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={backupOptions.menus} 
                      onChange={e => setBackupOptions({...backupOptions, menus: e.target.checked})} 
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-700">Menús ({savedMenus.length})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={backupOptions.settings} 
                      onChange={e => setBackupOptions({...backupOptions, settings: e.target.checked})} 
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-700">Ajustes & Escuela</span>
                  </label>

                  {isActuallyAdmin && (
                    <>
                      <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={backupOptions.users} 
                          onChange={e => setBackupOptions({...backupOptions, users: e.target.checked})} 
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-slate-700">Usuarios & Roles</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={backupOptions.invites} 
                          onChange={e => setBackupOptions({...backupOptions, invites: e.target.checked})} 
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-slate-700">Invitaciones</span>
                      </label>
                    </>
                  )}
                </div>

                {/* Acciones de Exportación e Importación */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    onClick={handleDownloadBackup} 
                    className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                  >
                    <Download size={15}/> Exportar Selección (JSON)
                  </button>

                  <button 
                    onClick={() => backupInputRef.current?.click()} 
                    className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                  >
                    <Upload size={15}/> Importar Backup (JSON)
                  </button>

                  <input 
                    type="file" 
                    ref={backupInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            onRestore(parsed);
                            alert("¡Copia de seguridad restaurada correctamente!");
                          } catch (err) {
                            alert("El archivo seleccionado no es un JSON de backup válido.");
                          }
                        };
                        reader.readAsText(file);
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Tarjeta 4: Zona de Peligro */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-700">
                    <ShieldAlert size={16} /> Zona de Peligro
                  </div>
                  <p className="text-rose-700/90 font-medium">
                    Eliminar cuenta permanentemente. Tus fichas públicas se conservarán para la comunidad educativa.
                  </p>
                </div>
                <button 
                  onClick={onDeleteAccount} 
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 size={14} /> Eliminar mi cuenta
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Pie del Modal con Guardado */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-slate-200 shrink-0">
          <div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
                <CheckCircle2 size={15} /> Ajustes guardados correctamente
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cerrar
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow"
            >
              <Save size={16} /> Guardar Ajustes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
