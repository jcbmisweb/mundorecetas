import React, { useState } from 'react';
import { ProRecipe, Recipe, AppSettings, ProRecipeStatus } from '../types';
import { ProSensoryRadarChart } from './ProSensoryRadarChart';
import { 
  Plus, Search, ArrowLeft, Award, Layers, Clock, Eye, 
  Trash2, Copy, Sparkles, Filter, ChevronRight, FileText,
  Import, Compass, CheckCircle2, ShieldCheck, Flame, BookOpen
} from 'lucide-react';

interface ProWorkshopHubProps {
  proRecipes: ProRecipe[];
  academicRecipes: Recipe[];
  settings: AppSettings;
  onSelectProRecipe: (recipe: ProRecipe) => void;
  onViewPrintProRecipe: (recipe: ProRecipe) => void;
  onNewProRecipe: () => void;
  onImportFromAcademic: (academicRecipe: Recipe) => void;
  onDeleteProRecipe: (recipeId: string) => void;
  onDuplicateProRecipe: (recipe: ProRecipe) => void;
  onOpenGuide: () => void;
  onBackToAcademic: () => void;
}

export const ProWorkshopHub: React.FC<ProWorkshopHubProps> = ({
  proRecipes,
  academicRecipes,
  settings,
  onSelectProRecipe,
  onViewPrintProRecipe,
  onNewProRecipe,
  onImportFromAcademic,
  onDeleteProRecipe,
  onDuplicateProRecipe,
  onOpenGuide,
  onBackToAcademic
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSearch, setImportSearch] = useState('');

  // Status statistics
  const totalCount = proRecipes.length;
  const inServiceCount = proRecipes.filter(r => r.status === 'in_service').length;
  const validatedCount = proRecipes.filter(r => r.status === 'validated').length;
  const devCount = proRecipes.filter(r => r.status === 'development').length;

  const filteredRecipes = proRecipes.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technicalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.concept?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAcademicRecipes = academicRecipes.filter(r =>
    r.name.toLowerCase().includes(importSearch.toLowerCase()) ||
    r.category?.toLowerCase().includes(importSearch.toLowerCase())
  );

  const getStatusBadge = (status: ProRecipeStatus) => {
    switch (status) {
      case 'in_service':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">En Servicio / Carta</span>;
      case 'validated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-800 border border-sky-200">Validado I+D</span>;
      case 'development':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">En Desarrollo</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200">Histórico</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-slate-800 pb-24 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Cabecera del Módulo de Taller I+D (Tonos Melocotón Cálido y Terracota) */}
      <header className="border-b border-amber-200/80 bg-white sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToAcademic}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              title="Volver al recetario estándar de la escuela"
            >
              <ArrowLeft size={14} /> Recetario Escolar
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-800 font-bold uppercase bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  ALTA GASTRONOMÍA · 3 ESTRELLAS
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  Sistema de 5 Niveles
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5 font-serif">
                <Compass className="text-amber-700" size={20} />
                Taller I+D · Fichas Técnicas Profesionales
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition-all border border-amber-300 shadow-2xs"
              title="Abrir la Guía Didáctica y Manual del Taller para imprimir en PDF"
            >
              <BookOpen size={15} className="text-amber-700" />
              <span className="hidden sm:inline">Manual y Guía (PDF)</span>
              <span className="sm:hidden">Guía PDF</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50 text-slate-700 font-bold rounded-xl text-xs transition-all border border-amber-200 shadow-2xs"
              title="Transformar una receta estándar existente a Ficha Profesional"
            >
              <Import size={15} /> Importar Receta
            </button>
            <button
              onClick={onNewProRecipe}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              <Plus size={16} /> Nueva Ficha I+D
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Banner Didáctico para el Chef */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  ¿Primera vez en el Taller I+D? Te lo explicamos de cocinero a cocinero
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold border border-amber-200">
                  Guía Rápida
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Este sistema profesional divide cada plato en 5 pasos sencillos: 1. Identidad y sabores, 2. Ingredientes con temperaturas exactas, 3. Gramajes al pase, 4. Control de calidad y 5. Caducidad. ¡Rellena solo lo que necesites a tu ritmo!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenGuide}
              className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
            >
              <BookOpen size={14} /> Abrir Manual / Imprimir PDF
            </button>
          </div>
        </div>

        {/* Banner de Métricas del Taller */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Total Proyectos I+D</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
              <span className="text-xs text-slate-500">platos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">En Servicio / Carta</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">{inServiceCount}</span>
              <span className="text-xs text-emerald-600">activos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-sky-200/80 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-sky-700 font-bold block">Validados Técnicamente</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-sky-700 font-mono">{validatedCount}</span>
              <span className="text-xs text-sky-600">listos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-amber-700 font-bold block">En Desarrollo / Pruebas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700 font-mono">{devCount}</span>
              <span className="text-xs text-amber-600">fase I+D</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (FT-...), nombre del plato, producto o concepto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'in_service', label: 'En Servicio' },
              { id: 'validated', label: 'Validados' },
              { id: 'development', label: 'I+D' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Fichas Profesionales */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-amber-200/70 p-8 space-y-4 shadow-2xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Compass size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay proyectos de taller que coincidan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Puedes crear una nueva ficha técnica con la plantilla de 5 niveles o importar una receta académica existente para comenzar.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onNewProRecipe}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                Crear Primera Ficha I+D
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-white hover:bg-amber-50 text-slate-700 font-bold rounded-xl text-xs transition-all border border-amber-200"
              >
                Importar desde Escuela
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <article
                key={recipe.id}
                className="group bg-white rounded-3xl border border-amber-200/80 hover:border-amber-400 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md"
              >
                <div>
                  {/* Foto superior si existe, o banner técnico con radar */}
                  {recipe.heroPhoto ? (
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={recipe.heroPhoto}
                        alt={recipe.name}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black bg-white/95 backdrop-blur-xs text-amber-900 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                          {recipe.code}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-700 px-1.5 py-0.5 rounded shadow-2xs">
                          v{recipe.version}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(recipe.status)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          {recipe.code}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">v{recipe.version}</span>
                      </div>
                      {getStatusBadge(recipe.status)}
                    </div>
                  )}

                  {/* Información textual del plato */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block mb-1">
                        {recipe.category || 'Alta Gastronomía'} · {recipe.targetPax} Pax
                      </span>
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 font-serif leading-snug">
                        {recipe.name}
                      </h2>
                      {recipe.technicalName && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">
                          {recipe.technicalName}
                        </p>
                      )}
                    </div>

                    {recipe.concept && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {recipe.concept}
                      </p>
                    )}

                    {/* Chips de datos técnicos */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200/60 text-amber-900">
                        <Layers size={12} className="text-amber-700" />
                        {recipe.components.length} Sub-recetas
                      </span>
                      {recipe.plating.maxPassWindowSeconds && (
                        <span className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-200/60 text-rose-800">
                          <Clock size={12} className="text-rose-700" />
                          Pase: {recipe.plating.maxPassWindowSeconds}s
                        </span>
                      )}
                      {recipe.traceability.costPerPax && (
                        <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 text-emerald-800">
                          {recipe.traceability.costPerPax.toFixed(2)} €/pax
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones del pie de la tarjeta */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewPrintProRecipe(recipe)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-all"
                      title="Ver Dossier / Imprimir"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onDuplicateProRecipe(recipe)}
                      className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-100/60 rounded-xl transition-all"
                      title="Duplicar como nueva versión"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la ficha técnica "${recipe.name}"?`)) {
                          onDeleteProRecipe(recipe.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Eliminar proyecto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectProRecipe(recipe)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs transition-all shadow-2xs"
                  >
                    Abrir Taller <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      </main>

      {/* Modal: Importar Receta Académica a Taller Profesional */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Import size={18} className="text-amber-400" />
                  Importar Receta Académica al Taller I+D
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona una de tus recetas estándar para convertirla en Ficha Profesional de 5 Niveles.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-500 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
              <input
                type="text"
                value={importSearch}
                onChange={e => setImportSearch(e.target.value)}
                placeholder="Buscar receta de la escuela..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredAcademicRecipes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No se encontraron recetas escolares para importar.
                </div>
              ) : (
                filteredAcademicRecipes.map(academic => (
                  <div
                    key={academic.id}
                    className="p-3 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {academic.photo ? (
                        <img
                          src={academic.photo}
                          alt={academic.name}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono font-bold">
                          REC
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{academic.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {academic.category} · {academic.subRecipes?.length || 0} sub-recetas · {academic.yieldQuantity} {academic.yieldUnit}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onImportFromAcademic(academic);
                        setShowImportModal(false);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shrink-0"
                    >
                      Convertir a I+D
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
