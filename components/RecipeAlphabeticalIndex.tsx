import React, { useState, useMemo } from 'react';
import { Recipe, AppSettings, AppUser } from '../types';
import { 
  X, Search, Database, Cloud, HardDrive, RefreshCw, 
  Eye, Edit2, CheckCircle2, AlertCircle, ArrowUpRight, 
  BookOpen, Layers, ChefHat, Sparkles, Filter, WifiOff
} from 'lucide-react';
import { localDB } from '../db/dexieDB';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface RecipeAlphabeticalIndexProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onViewRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onTriggerSync?: () => Promise<any> | void;
  syncState?: {
    isSyncing: boolean;
    unsyncedCount: number;
    syncedCount?: number;
    totalLocalCount?: number;
    message?: string;
    isQuotaExceeded?: boolean;
  };
}

const ALPHABET = [
  'TODAS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 
  'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 
  'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

export const RecipeAlphabeticalIndex: React.FC<RecipeAlphabeticalIndexProps> = ({
  isOpen,
  onClose,
  recipes,
  onViewRecipe,
  onEditRecipe,
  onTriggerSync,
  syncState
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'unsynced'>('all');
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);

  // Normalización y ordenación alfabética estricta A-Z
  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      const nameA = (a.name || '').trim().toLowerCase();
      const nameB = (b.name || '').trim().toLowerCase();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [recipes]);

  // Filtrado compuesto: Letra inicial + Búsqueda por texto + Estado de sincronización
  const filteredRecipes = useMemo(() => {
    return sortedRecipes.filter(recipe => {
      const cleanName = (recipe.name || '').trim();
      const firstChar = cleanName.charAt(0).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // 1. Filtro por letra del abecedario
      if (selectedLetter !== 'TODAS') {
        if (selectedLetter === '#') {
          if (/^[A-Z]$/.test(firstChar)) return false;
        } else {
          if (firstChar !== selectedLetter) return false;
        }
      }

      // 2. Filtro por estado
      if (statusFilter === 'synced' && recipe.synced === false) return false;
      if (statusFilter === 'unsynced' && recipe.synced !== false) return false;

      // 3. Filtro por término de búsqueda (nombre, categoría o ingredientes)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = cleanName.toLowerCase().includes(term);
        const matchesCat = (recipe.category || '').toLowerCase().includes(term) ||
          (recipe.categories || []).some(c => c.toLowerCase().includes(term));
        const matchesIng = (recipe.subRecipes || []).some(sub =>
          (sub.ingredients || []).some(i => (i.name || '').toLowerCase().includes(term))
        );
        return matchesName || matchesCat || matchesIng;
      }

      return true;
    });
  }, [sortedRecipes, selectedLetter, statusFilter, searchTerm]);

  // Agrupación alfabética para renderizado
  const groupedByLetter = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    filteredRecipes.forEach(r => {
      const firstChar = (r.name || '').trim().charAt(0).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const key = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [filteredRecipes]);

  // Estadísticas globales de persistencia
  const totalCount = recipes.length;
  const unsyncedCount = recipes.filter(r => r.synced === false).length;
  const syncedCount = totalCount - unsyncedCount;

  // Apertura bajo demanda: consulta primero en local y luego en la nube
  const handleOpenRecipeSmart = async (recipe: Recipe, mode: 'view' | 'edit') => {
    setLoadingRecipeId(recipe.id);
    try {
      // 1. Buscar en Dexie IndexedDB local (0 ms de latencia)
      const localRecipe = await localDB.recipes.get(recipe.id);
      if (localRecipe && localRecipe.subRecipes && localRecipe.subRecipes.length > 0) {
        if (mode === 'view') onViewRecipe(localRecipe);
        else onEditRecipe(localRecipe);
        onClose();
        return;
      }

      // 2. Si no estuviera completo en local, consultar en Firestore y cachear
      try {
        const docRef = doc(db, 'recipes', recipe.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = { id: snap.id, ...snap.data() } as Recipe;
          await localDB.recipes.put({ ...remoteData, synced: true });
          if (mode === 'view') onViewRecipe(remoteData);
          else onEditRecipe(remoteData);
          onClose();
          return;
        }
      } catch (cloudErr) {
        console.warn('Error consultando en nube, usando versión en memoria:', cloudErr);
      }

      // 3. Fallback a la instancia en memoria
      if (mode === 'view') onViewRecipe(recipe);
      else onEditRecipe(recipe);
      onClose();
    } catch (e) {
      console.error('Error abriendo receta:', e);
      if (mode === 'view') onViewRecipe(recipe);
      else onEditRecipe(recipe);
      onClose();
    } finally {
      setLoadingRecipeId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Cabecera Principal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black uppercase tracking-tight">
                  Directorio Alfabético (A - Z)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Offline-First
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Consulta instantánea de recetas ordenadas por nombre. Acceso en local (0ms) y sincronización con la nube.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onTriggerSync && (
              <button
                onClick={onTriggerSync}
                disabled={syncState?.isSyncing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                title="Sincronizar cambios pendientes con la nube"
              >
                <RefreshCw size={13} className={syncState?.isSyncing ? 'animate-spin text-amber-400' : ''} />
                <span>{syncState?.isSyncing ? 'Sincronizando...' : 'Sincronizar Nube'}</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Métricas y Estado de Almacenamiento */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
              <strong>{totalCount}</strong> recetas en recetario
            </span>
            <span className="flex items-center gap-1.5 text-blue-700">
              <HardDrive size={14} />
              <strong>{totalCount}</strong> guardadas en local (offline)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Cloud size={14} />
              <strong>{syncedCount}</strong> en la nube
            </span>
            {unsyncedCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-300 font-bold">
                ⚡ <strong>{unsyncedCount}</strong> pendientes de subir
              </span>
            )}
          </div>

          {syncState?.message && (
            <span className="text-[11px] text-slate-500 italic">
              {syncState.message}
            </span>
          )}
        </div>

        {/* Buscador y Filtros */}
        <div className="p-5 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de receta, ingrediente o categoría..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('synced')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'synced' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ☁️ Nube ({syncedCount})
              </button>
              <button
                onClick={() => setStatusFilter('unsynced')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'unsynced' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Pendientes ({unsyncedCount})
              </button>
            </div>
          </div>

          {/* Abecedario de Salto Rápido */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 custom-scrollbar">
            {ALPHABET.map(letter => {
              const countForLetter = letter === 'TODAS'
                ? totalCount
                : (groupedByLetter.get(letter)?.length || 0);

              const isSelected = selectedLetter === letter;

              return (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                      : countForLetter > 0 || letter === 'TODAS'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-transparent text-slate-300 cursor-not-allowed'
                  }`}
                  disabled={countForLetter === 0 && letter !== 'TODAS'}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuerpo con Listado Alfabético */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 space-y-6 custom-scrollbar">
          {filteredRecipes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Search size={26} />
              </div>
              <p className="text-sm font-bold text-slate-700">No se encontraron fichas técnicas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay recetas que coincidan con la letra "{selectedLetter}" o el término buscado.
              </p>
            </div>
          ) : (
            Array.from(groupedByLetter.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, groupList]) => (
                <div key={letter} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-serif font-black text-sm flex items-center justify-center shadow-xs">
                      {letter}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {groupList.length} receta{groupList.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupList.map(recipe => {
                      const isSynced = recipe.synced !== false;
                      const ingredientsCount = (recipe.subRecipes || []).reduce(
                        (acc, sub) => acc + (sub.ingredients?.length || 0), 0
                      );

                      return (
                        <div
                          key={recipe.id}
                          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {recipe.photo ? (
                              <img
                                src={recipe.photo}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 font-bold text-sm">
                                {recipe.name?.charAt(0) || 'R'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                                {recipe.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {recipe.category || 'Cocina'}
                                </span>
                                <span>{recipe.yieldQuantity || 4} {recipe.yieldUnit || 'pax'}</span>
                                <span>• {ingredientsCount} ingredientes</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Insignia de persistencia */}
                            {isSynced ? (
                              <span 
                                title="Guardada en Local y Sincronizada en Firestore" 
                                className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-200"
                              >
                                <Cloud size={13} />
                              </span>
                            ) : (
                              <span 
                                title="Guardada 100% en tu navegador (Local). Pendiente de subir a la nube." 
                                className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-amber-300 animate-pulse"
                              >
                                <HardDrive size={13} />
                              </span>
                            )}

                            {/* Botón Ver */}
                            <button
                              onClick={() => handleOpenRecipeSmart(recipe, 'view')}
                              disabled={loadingRecipeId === recipe.id}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              {loadingRecipeId === recipe.id ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Eye size={12} />
                              )}
                              <span>Ver</span>
                            </button>

                            {/* Botón Editar */}
                            <button
                              onClick={() => handleOpenRecipeSmart(recipe, 'edit')}
                              disabled={loadingRecipeId === recipe.id}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                              title="Editar ficha"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pie de Página */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            ⚡ Carga instantánea: las recetas se consultan primero en tu memoria local (IndexedDB) y se actualizan en segundo plano.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Cerrar Directorio
          </button>
        </div>

      </div>
    </div>
  );
};
