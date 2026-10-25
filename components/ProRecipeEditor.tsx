import React, { useState } from 'react';
import { 
  ProRecipe, ProFamilyType, ProRecipeStatus, ProComponentElaboration,
  ProIngredientItem, ProProcessStep, Allergen, ALLERGEN_LIST, AppSettings
} from '../types';
import { ProSensoryRadarChart } from './ProSensoryRadarChart';
import { 
  Save, ArrowLeft, Eye, Plus, Trash2, Clock, Thermometer, 
  Sparkles, CheckCircle2, AlertTriangle, Layers, Award,
  Scale, RefreshCw, ChevronDown, ChevronUp, FileText, Compass,
  BookOpen, HelpCircle
} from 'lucide-react';

interface ProRecipeEditorProps {
  recipe: ProRecipe;
  settings: AppSettings;
  onSave: (updatedRecipe: ProRecipe) => void;
  onBack: () => void;
  onViewPrint: () => void;
  onOpenGuide?: () => void;
}

const FAMILY_OPTIONS: ProFamilyType[] = [
  'Elemento Principal',
  'Fondo / Caldo',
  'Salsa / Jugo',
  'Guarnición',
  'Emulsión / Aire',
  'Fermento / Encurtido',
  'Crujiente / Teja',
  'Infusión / Aceite',
  'Masa / Panadería',
  'Postre / Dulce',
  'Técnica Vanguardia',
  'Otro'
];

export const ProRecipeEditor: React.FC<ProRecipeEditorProps> = ({
  recipe: initialRecipe,
  settings,
  onSave,
  onBack,
  onViewPrint,
  onOpenGuide
}) => {
  const [recipe, setRecipe] = useState<ProRecipe>(initialRecipe);
  const [activeTab, setActiveTab] = useState<'N1' | 'N2' | 'N3' | 'N4' | 'N5'>('N1');
  const [expandedCompId, setExpandedCompId] = useState<string | null>(
    recipe.components?.[0]?.id || null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const updateRecipeField = <K extends keyof ProRecipe>(field: K, value: ProRecipe[K]) => {
    setRecipe(prev => ({
      ...prev,
      [field]: value,
      lastModified: Date.now()
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onSave(recipe);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Helper: recalculate baker's percentage for a component's ingredients
  const recalculateBakersPercentages = (ingredients: ProIngredientItem[]): ProIngredientItem[] => {
    const baseIng = ingredients.find(i => i.isBase) || ingredients[0];
    const baseWeight = baseIng ? baseIng.netGrams : 0;

    return ingredients.map((ing, idx) => {
      const isBase = baseIng ? ing.id === baseIng.id : idx === 0;
      let bakersPercentage = 0;
      if (isBase) {
        bakersPercentage = 100;
      } else if (baseWeight > 0) {
        bakersPercentage = parseFloat(((ing.netGrams / baseWeight) * 100).toFixed(1));
      }
      return {
        ...ing,
        isBase,
        bakersPercentage
      };
    });
  };

  // Synchronize components to Plating Grammages table
  const handleSyncComponentsToPlating = () => {
    const currentGrams = [...(recipe.plating.componentsGrammage || [])];
    const updated = recipe.components.map(comp => {
      const existing = currentGrams.find(g => g.componentId === comp.id);
      if (existing) return existing;
      return {
        componentId: comp.id,
        componentName: comp.name,
        gramsPerPax: Math.round(comp.targetYieldGrams / Math.max(1, recipe.targetPax)),
        tool: 'Pinzas de emplatar / Cuchara',
        targetTemp: '60°C'
      };
    });

    setRecipe(prev => ({
      ...prev,
      plating: {
        ...prev.plating,
        componentsGrammage: updated
      }
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Barra superior de control y guardado */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700"
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                {recipe.code}
              </span>
              <span className="text-xs text-slate-400 font-mono">v{recipe.version}</span>
            </div>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {recipe.name || 'Nueva Ficha Técnica Profesional'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccessMsg && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
              <CheckCircle2 size={13} /> Guardado con éxito
            </span>
          )}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/40"
              title="Abrir la Guía Didáctica / Manual explicativo en PDF"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Guía del Taller (PDF)</span>
            </button>
          )}
          <button
            onClick={onViewPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700"
            title="Vista Dossier e Impresión"
          >
            <Eye size={14} /> Ver Dossier
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Save size={14} /> Guardar Ficha
          </button>
        </div>
      </header>

      {/* Selector de Nivel de Documentación (Pestañas 1 a 5) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'N1', num: '1', title: 'Identidad & Sensorial', sub: 'Concepto y Radar' },
            { id: 'N2', num: '2', title: 'Fichas de Elaboración', sub: `${recipe.components.length} Sub-recetas (%)` },
            { id: 'N3', num: '3', title: 'Montaje & Pase', sub: 'Gramajes y Secuencia' },
            { id: 'N4', num: '4', title: 'Calidad & Cata', sub: 'Tolerancias y pH/Brix' },
            { id: 'N5', num: '5', title: 'Trazabilidad & Costes', sub: 'Versiones y Escandallo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 shadow-md'
                  : 'hover:bg-slate-800/60 text-slate-400 border border-transparent'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.num}
              </span>
              <div className="hidden sm:block">
                <span className="block text-xs font-bold leading-tight">{tab.title}</span>
                <span className="text-[10px] text-slate-400 font-mono block leading-tight">{tab.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal según Pestaña */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        
        {/* ========================================================================= */}
        {/* NIVEL 1 · IDENTIDAD Y PERFIL SENSORIAL                                     */}
        {/* ========================================================================= */}
        {activeTab === 'N1' && (
          <div className="space-y-6">
            {/* Banner Didáctico Nivel 1 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">NIVEL 1 · Identidad & Sensorial:</strong> Define el nombre y concepto de tu plato y ajusta el <strong>radar sensorial</strong> (sabores del 1 al 10). Así visualizas el equilibrio del plato antes de cocinar.
                </span>
              </div>
              {onOpenGuide && (
                <button 
                  onClick={onOpenGuide} 
                  className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px]"
                >
                  Ver Manual Completo (PDF)
                </button>
              )}
            </div>

            {/* Metadatos Generales */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Nombre Gastronómico del Plato *
                </label>
                <input
                  type="text"
                  value={recipe.name}
                  onChange={e => updateRecipeField('name', e.target.value)}
                  placeholder="Ej: Pichón de Bresse en Dos Cocciones y Fermentos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Nombre Técnico Culinario
                </label>
                <input
                  type="text"
                  value={recipe.technicalName}
                  onChange={e => updateRecipeField('technicalName', e.target.value)}
                  placeholder="Ej: Pichón asado 54.5°C / Jus reducido con cacao / Emulsión"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Código de Documento
                </label>
                <input
                  type="text"
                  value={recipe.code}
                  onChange={e => updateRecipeField('code', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-sm focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Versión Vigente
                </label>
                <input
                  type="text"
                  value={recipe.version}
                  onChange={e => updateRecipeField('version', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Estado Operativo
                </label>
                <select
                  value={recipe.status}
                  onChange={e => updateRecipeField('status', e.target.value as ProRecipeStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                >
                  <option value="development">En desarrollo / I+D</option>
                  <option value="validated">Validado técnicamente</option>
                  <option value="in_service">En carta / Pase activo</option>
                  <option value="archived">Archivo histórico</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Raciones Objetivo (Pax)
                </label>
                <input
                  type="number"
                  min="1"
                  value={recipe.targetPax}
                  onChange={e => updateRecipeField('targetPax', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Concepto, Producto y Storytelling */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Concepto e Intención Gastronómica
                </label>
                <textarea
                  rows={3}
                  value={recipe.concept}
                  onChange={e => updateRecipeField('concept', e.target.value)}
                  placeholder="Describe la idea motriz, la investigación técnica y la emoción que busca provocar la preparación..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Producto Estrella, Origen y Temporada
                  </label>
                  <textarea
                    rows={2}
                    value={recipe.starProduct}
                    onChange={e => updateRecipeField('starProduct', e.target.value)}
                    placeholder="Ej: Pichón de Bresse Label Rouge (Francia), peso 450g, maduración 5 días..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:border-amber-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Discurso para Sala / Storytelling
                  </label>
                  <textarea
                    rows={2}
                    value={recipe.storytelling}
                    onChange={e => updateRecipeField('storytelling', e.target.value)}
                    placeholder="El mensaje clave y detalles que el equipo de sala traslada al comensal en el momento del pase..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:border-amber-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Radar Sensorial y Evaluación Organoléptica */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-mono uppercase font-bold text-amber-400 mb-2">
                  Rueda Sensorial Interactiva (1 a 5)
                </span>
                <ProSensoryRadarChart
                  radar={recipe.sensoryProfile.radar}
                  size={260}
                  interactive={true}
                  onChange={updatedRadar => {
                    setRecipe(prev => ({
                      ...prev,
                      sensoryProfile: {
                        ...prev.sensoryProfile,
                        radar: updatedRadar
                      }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="md:col-span-6 space-y-3">
                <span className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1">
                  Notas Descriptivas Sensoriales
                </span>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Aspecto Visual / Cromatismo</label>
                  <input
                    type="text"
                    value={recipe.sensoryProfile.visual}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, sensoryProfile: { ...p.sensoryProfile, visual: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Rojo rubí brillante, napa espejo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Perfil Aromático</label>
                  <input
                    type="text"
                    value={recipe.sensoryProfile.aroma}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, sensoryProfile: { ...p.sensoryProfile, aroma: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Notas de leña noble, café tostado y notas lácticas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Textura en Boca</label>
                  <input
                    type="text"
                    value={recipe.sensoryProfile.texture}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, sensoryProfile: { ...p.sensoryProfile, texture: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Sedosidad extrema, piel crujiente sonoro..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Retrogusto y Persistencia</label>
                  <input
                    type="text"
                    value={recipe.sensoryProfile.aftertaste}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, sensoryProfile: { ...p.sensoryProfile, aftertaste: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Persistencia superior a 30s con recuerdos ahumados..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">URL de Fotografía de Emplatado</label>
                  <input
                    type="text"
                    value={recipe.heroPhoto || ''}
                    onChange={e => updateRecipeField('heroPhoto', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NIVEL 2 · FICHAS DE ELABORACIÓN (SUB-COMPONENTES Y % SOBRE BASE)          */}
        {/* ========================================================================= */}
        {activeTab === 'N2' && (
          <div className="space-y-6">
            {/* Banner Didáctico Nivel 2 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">NIVEL 2 · Elaboraciones de Cocina:</strong> El plato se despieza en sus componentes reales (ej: Salsa, Elemento Principal, Guarnición). Puedes anotar pesos y especificar <strong>temperatura exacta y tiempo</strong> de cocción.
                </span>
              </div>
              {onOpenGuide && (
                <button 
                  onClick={onOpenGuide} 
                  className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px]"
                >
                  Ver Manual Completo (PDF)
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-amber-400" />
                  Elaboraciones Técnicas ({recipe.components.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Cada fondo, salsa, fermento o guarnición se formula de forma independiente con % sobre base.
                </p>
              </div>

              <button
                onClick={() => {
                  const newComp: ProComponentElaboration = {
                    id: `comp-${Date.now()}`,
                    code: `FT-ELA-00${recipe.components.length + 1}`,
                    name: 'Nueva Elaboración Técnica',
                    family: 'Salsa / Jugo',
                    roleInDish: 'Vehículo de sabor y textura',
                    targetYieldGrams: 250,
                    equipmentNeeded: ['Thermomix', 'Roner'],
                    ingredients: [
                      {
                        id: `ing-${Date.now()}-1`,
                        name: 'Ingrediente Base Principal',
                        netGrams: 200,
                        bakersPercentage: 100,
                        isBase: true,
                        notes: 'Calidad superior',
                        allergens: []
                      }
                    ],
                    processSteps: [
                      {
                        stepNumber: 1,
                        operation: 'Preparación y cocción térmica',
                        timeMinutes: 20,
                        tempCelsius: '85°C',
                        criticalPoint: 'Textura homogénea',
                        rejectionCriteria: 'Separación de fases'
                      }
                    ],
                    storage: {
                      temperature: '3°C',
                      container: 'Biberón al vacío',
                      shelfLife: '48 horas'
                    }
                  };
                  setRecipe(p => ({ ...p, components: [...p.components, newComp] }));
                  setExpandedCompId(newComp.id);
                  setHasUnsavedChanges(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all"
              >
                <Plus size={14} /> Añadir Elaboración
              </button>
            </div>

            {/* Listado de elaboraciones en acordeón */}
            <div className="space-y-4">
              {recipe.components.map((comp, compIdx) => {
                const isExpanded = expandedCompId === comp.id;

                const updateComponent = (updater: (prevComp: ProComponentElaboration) => ProComponentElaboration) => {
                  setRecipe(prev => ({
                    ...prev,
                    components: prev.components.map(c => c.id === comp.id ? updater(c) : c)
                  }));
                  setHasUnsavedChanges(true);
                };

                return (
                  <div key={comp.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    {/* Barra cabecera de la elaboración */}
                    <div 
                      onClick={() => setExpandedCompId(isExpanded ? null : comp.id)}
                      className="p-4 bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                          {comp.code}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white">{comp.name}</h3>
                          <span className="text-[11px] text-slate-400">{comp.family} · {comp.targetYieldGrams}g</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar la elaboración "${comp.name}"?`)) {
                              setRecipe(p => ({ ...p, components: p.components.filter(c => c.id !== comp.id) }));
                              setHasUnsavedChanges(true);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Eliminar elaboración"
                        >
                          <Trash2 size={16} />
                        </button>
                        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Detalle expandido */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        {/* Metadatos de la elaboración */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Nombre Técnico</label>
                            <input
                              type="text"
                              value={comp.name}
                              onChange={e => updateComponent(c => ({ ...c, name: e.target.value }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Familia</label>
                            <select
                              value={comp.family}
                              onChange={e => updateComponent(c => ({ ...c, family: e.target.value as ProFamilyType }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              {FAMILY_OPTIONS.map(fam => (
                                <option key={fam} value={fam}>{fam}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Rendimiento (g)</label>
                            <input
                              type="number"
                              value={comp.targetYieldGrams}
                              onChange={e => updateComponent(c => ({ ...c, targetYieldGrams: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Función en el Plato</label>
                            <input
                              type="text"
                              value={comp.roleInDish}
                              onChange={e => updateComponent(c => ({ ...c, roleInDish: e.target.value }))}
                              placeholder="Eje proteico, napa, contraste..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Formulación Técnica: Ingredientes y % sobre base */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono uppercase font-bold text-amber-300 flex items-center gap-1.5">
                              <Scale size={13} /> Formulación (% sobre ingrediente base)
                            </span>
                            <button
                              onClick={() => {
                                const newIng: ProIngredientItem = {
                                  id: `ing-${Date.now()}`,
                                  name: 'Nuevo Ingrediente',
                                  netGrams: 50,
                                  bakersPercentage: 0,
                                  isBase: comp.ingredients.length === 0,
                                  notes: '',
                                  allergens: []
                                };
                                const updated = recalculateBakersPercentages([...comp.ingredients, newIng]);
                                updateComponent(c => ({ ...c, ingredients: updated }));
                              }}
                              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded font-bold transition-all"
                            >
                              <Plus size={12} /> Añadir Ingrediente
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                                <tr>
                                  <th className="py-2 px-2">Base</th>
                                  <th className="py-2 px-2">Ingrediente</th>
                                  <th className="py-2 px-2 text-right">Cant. Neta (g)</th>
                                  <th className="py-2 px-2 text-right">% s/ Base</th>
                                  <th className="py-2 px-2">Observaciones / Corte</th>
                                  <th className="py-2 px-2 text-center">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {comp.ingredients.map((ing, ingIdx) => (
                                  <tr key={ing.id || ingIdx} className={ing.isBase ? 'bg-amber-500/5' : ''}>
                                    <td className="py-2 px-2 text-center">
                                      <input
                                        type="radio"
                                        name={`base-ing-${comp.id}`}
                                        checked={!!ing.isBase}
                                        onChange={() => {
                                          const marked = comp.ingredients.map(i => ({ ...i, isBase: i.id === ing.id }));
                                          const recalculated = recalculateBakersPercentages(marked);
                                          updateComponent(c => ({ ...c, ingredients: recalculated }));
                                        }}
                                        title="Establecer como ingrediente base (100%)"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="text"
                                        value={ing.name}
                                        onChange={e => {
                                          const updated = comp.ingredients.map(i => i.id === ing.id ? { ...i, name: e.target.value } : i);
                                          updateComponent(c => ({ ...c, ingredients: updated }));
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={ing.netGrams}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value) || 0;
                                          const updated = comp.ingredients.map(i => i.id === ing.id ? { ...i, netGrams: val } : i);
                                          updateComponent(c => ({ ...c, ingredients: recalculateBakersPercentages(updated) }));
                                        }}
                                        className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-right font-mono text-white"
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-amber-300 font-bold">
                                      {ing.bakersPercentage}%
                                    </td>
                                    <td className="py-2 px-2">
                                      <input
                                        type="text"
                                        value={ing.notes || ''}
                                        onChange={e => {
                                          const updated = comp.ingredients.map(i => i.id === ing.id ? { ...i, notes: e.target.value } : i);
                                          updateComponent(c => ({ ...c, ingredients: updated }));
                                        }}
                                        placeholder="Variedad, origen..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300"
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const filtered = comp.ingredients.filter(i => i.id !== ing.id);
                                          updateComponent(c => ({ ...c, ingredients: recalculateBakersPercentages(filtered) }));
                                        }}
                                        className="p-1 text-slate-600 hover:text-rose-400"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Parámetros de Proceso y Puntos Críticos */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                              <Clock size={13} /> Secuencia de Proceso y Control Térmico
                            </span>
                            <button
                              onClick={() => {
                                const newStep: ProProcessStep = {
                                  stepNumber: comp.processSteps.length + 1,
                                  operation: '',
                                  timeMinutes: 10,
                                  tempCelsius: '65°C',
                                  criticalPoint: '',
                                  rejectionCriteria: ''
                                };
                                updateComponent(c => ({ ...c, processSteps: [...c.processSteps, newStep] }));
                              }}
                              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded font-bold"
                            >
                              <Plus size={12} /> Añadir Paso
                            </button>
                          </div>

                          <div className="space-y-3">
                            {comp.processSteps.map((step, sIdx) => (
                              <div key={sIdx} className="p-3 bg-slate-900 rounded-lg border border-slate-850 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="w-5 h-5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] flex items-center justify-center font-bold">
                                      {step.stepNumber}
                                    </span>
                                    <input
                                      type="text"
                                      value={step.operation}
                                      onChange={e => {
                                        const steps = [...comp.processSteps];
                                        steps[sIdx] = { ...step, operation: e.target.value };
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      placeholder="Descripción de la operación técnica..."
                                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      placeholder="min"
                                      value={step.timeMinutes || ''}
                                      onChange={e => {
                                        const steps = [...comp.processSteps];
                                        steps[sIdx] = { ...step, timeMinutes: parseInt(e.target.value) || undefined };
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-center text-slate-300"
                                      title="Minutos"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Temp (°C)"
                                      value={step.tempCelsius || ''}
                                      onChange={e => {
                                        const steps = [...comp.processSteps];
                                        steps[sIdx] = { ...step, tempCelsius: e.target.value };
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-center text-amber-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const steps = comp.processSteps.filter((_, idx) => idx !== sIdx);
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      className="p-1 text-slate-600 hover:text-rose-400"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="text-[10px] font-mono text-emerald-400 block">Punto Final Observable (Criterio de éxito):</label>
                                    <input
                                      type="text"
                                      value={step.criticalPoint}
                                      onChange={e => {
                                        const steps = [...comp.processSteps];
                                        steps[sIdx] = { ...step, criticalPoint: e.target.value };
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      placeholder="Ej: Emulsión homogénea, 62° Brix..."
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-emerald-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-mono text-rose-400 block">Criterio de Rechazo Inmediato:</label>
                                    <input
                                      type="text"
                                      value={step.rejectionCriteria || ''}
                                      onChange={e => {
                                        const steps = [...comp.processSteps];
                                        steps[sIdx] = { ...step, rejectionCriteria: e.target.value };
                                        updateComponent(c => ({ ...c, processSteps: steps }));
                                      }}
                                      placeholder="Ej: Si hierve o se corta la grasa..."
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-rose-300"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Conservación y Regeneración */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Temperatura Conservación</label>
                            <input
                              type="text"
                              value={comp.storage?.temperature || ''}
                              onChange={e => updateComponent(c => ({ ...c, storage: { ...c.storage, temperature: e.target.value } }))}
                              placeholder="Ej: 2–4°C o -18°C"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Envase / Recipiente</label>
                            <input
                              type="text"
                              value={comp.storage?.container || ''}
                              onChange={e => updateComponent(c => ({ ...c, storage: { ...c.storage, container: e.target.value } }))}
                              placeholder="Ej: Biberón hermético al vacío"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Vida Útil Aprobada</label>
                            <input
                              type="text"
                              value={comp.storage?.shelfLife || ''}
                              onChange={e => updateComponent(c => ({ ...c, storage: { ...c.storage, shelfLife: e.target.value } }))}
                              placeholder="Ej: 48 horas"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NIVEL 3 · MONTAJE Y PASE                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'N3' && (
          <div className="space-y-6">
            {/* Banner Didáctico Nivel 3 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">NIVEL 3 · Montaje & Pase:</strong> La hoja del pase de cocina: gramos exactos de cada componente por plato, orden de montaje, vajilla caliente y tiempo máximo hasta la mesa del cliente.
                </span>
              </div>
              {onOpenGuide && (
                <button 
                  onClick={onOpenGuide} 
                  className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px]"
                >
                  Ver Manual Completo (PDF)
                </button>
              )}
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale size={16} className="text-amber-400" />
                    Gramajes por Ración (Pax) y Herramientas de Pase
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control milimétrico del gramaje de cada componente que llega a sala.
                  </p>
                </div>
                <button
                  onClick={handleSyncComponentsToPlating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-xs transition-all border border-amber-500/30"
                >
                  <RefreshCw size={13} /> Sincronizar desde Elaboraciones
                </button>
              </div>

              {/* Tabla de gramajes */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2">Componente</th>
                      <th className="py-2 px-2 text-right">Gramos / Pax</th>
                      <th className="py-2 px-2">Herramienta de Emplatado</th>
                      <th className="py-2 px-2">Temperatura Objetivo</th>
                      <th className="py-2 px-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {recipe.plating.componentsGrammage?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.componentName}
                            onChange={e => {
                              const list = [...recipe.plating.componentsGrammage];
                              list[idx] = { ...item, componentName: e.target.value };
                              setRecipe(p => ({ ...p, plating: { ...p.plating, componentsGrammage: list } }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            value={item.gramsPerPax}
                            onChange={e => {
                              const list = [...recipe.plating.componentsGrammage];
                              list[idx] = { ...item, gramsPerPax: parseFloat(e.target.value) || 0 };
                              setRecipe(p => ({ ...p, plating: { ...p.plating, componentsGrammage: list } }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-right font-mono text-amber-300"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.tool}
                            onChange={e => {
                              const list = [...recipe.plating.componentsGrammage];
                              list[idx] = { ...item, tool: e.target.value };
                              setRecipe(p => ({ ...p, plating: { ...p.plating, componentsGrammage: list } }));
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="Pinzas, cuchara..."
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.targetTemp}
                            onChange={e => {
                              const list = [...recipe.plating.componentsGrammage];
                              list[idx] = { ...item, targetTemp: e.target.value };
                              setRecipe(p => ({ ...p, plating: { ...p.plating, componentsGrammage: list } }));
                              setHasUnsavedChanges(true);
                            }}
                            placeholder="55°C, fría..."
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = recipe.plating.componentsGrammage.filter((_, i) => i !== idx);
                              setRecipe(p => ({ ...p, plating: { ...p.plating, componentsGrammage: filtered } }));
                              setHasUnsavedChanges(true);
                            }}
                            className="p-1 text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Secuencia de montaje, vajilla y pase */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Secuencia Numerada de Montaje en Pase
                    </label>
                    <button
                      onClick={() => {
                        const seq = [...(recipe.plating.mountingSequence || []), ''];
                        setRecipe(p => ({ ...p, plating: { ...p.plating, mountingSequence: seq } }));
                        setHasUnsavedChanges(true);
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Plus size={11} /> Añadir Paso
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recipe.plating.mountingSequence?.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-400 font-bold">{idx + 1}.</span>
                        <input
                          type="text"
                          value={step}
                          onChange={e => {
                            const seq = [...recipe.plating.mountingSequence];
                            seq[idx] = e.target.value;
                            setRecipe(p => ({ ...p, plating: { ...p.plating, mountingSequence: seq } }));
                            setHasUnsavedChanges(true);
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const seq = recipe.plating.mountingSequence.filter((_, i) => i !== idx);
                            setRecipe(p => ({ ...p, plating: { ...p.plating, mountingSequence: seq } }));
                            setHasUnsavedChanges(true);
                          }}
                          className="text-slate-600 hover:text-rose-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Vajilla y Soporte de Pase
                  </label>
                  <input
                    type="text"
                    value={recipe.plating.tableware}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, plating: { ...p.plating, tableware: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: Plato cerámico de gres negro mate 28cm..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Temp. de Pase Plato
                    </label>
                    <input
                      type="text"
                      value={recipe.plating.passTemperature}
                      onChange={e => {
                        const v = e.target.value;
                        setRecipe(p => ({ ...p, plating: { ...p.plating, passTemperature: v } }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Ej: 55°C caliente"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Ventana Máx. (Segundos)
                    </label>
                    <input
                      type="number"
                      value={recipe.plating.maxPassWindowSeconds}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 60;
                        setRecipe(p => ({ ...p, plating: { ...p.plating, maxPassWindowSeconds: v } }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="90"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-rose-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Instrucciones Especiales para Sala
                  </label>
                  <textarea
                    rows={3}
                    value={recipe.plating.serviceNotes}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, plating: { ...p.plating, serviceNotes: v } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Salseado en mesa, retirada de campana al unísono, advertencia de temperatura..."
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-300 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NIVEL 4 · CONTROL DE CALIDAD Y CATA                                       */}
        {/* ========================================================================= */}
        {activeTab === 'N4' && (
          <div className="space-y-6">
            {/* Banner Didáctico Nivel 4 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">NIVEL 4 · Calidad & Cata:</strong> Define cómo el jefe de partida o tú sabéis si el plato está perfecto o debe repetirse. Los parámetros fisicoquímicos (pH, Brix) son opcionales si no dispones de esos instrumentos.
                </span>
              </div>
              {onOpenGuide && (
                <button 
                  onClick={onOpenGuide} 
                  className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px]"
                >
                  Ver Manual Completo (PDF)
                </button>
              )}
            </div>

            {/* Parámetros físico-químicos */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Thermometer size={16} className="text-amber-400" />
                Parámetros Fisicoquímicos y Medibles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">pH Objetivo</label>
                  <input
                    type="text"
                    value={recipe.qualityControl.physicochemical?.targetPH || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, physicochemical: { ...p.qualityControl.physicochemical, targetPH: v } } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: 3.8"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">°Brix (Azúcar/Densidad)</label>
                  <input
                    type="text"
                    value={recipe.qualityControl.physicochemical?.targetBrix || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, physicochemical: { ...p.qualityControl.physicochemical, targetBrix: v } } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: 62° Brix"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Viscosidad</label>
                  <input
                    type="text"
                    value={recipe.qualityControl.physicochemical?.viscosityDensity || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, physicochemical: { ...p.qualityControl.physicochemical, viscosityDensity: v } } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: Napa densa 1800 cP"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Temp. Corazón</label>
                  <input
                    type="text"
                    value={recipe.qualityControl.physicochemical?.coreTemperature || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, physicochemical: { ...p.qualityControl.physicochemical, coreTemperature: v } } }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Ej: 53.5°C"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-amber-300"
                  />
                </div>
              </div>
            </div>

            {/* Criterios de Aceptación vs Rechazo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Criterios de Aceptación */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Criterios de Aceptación
                  </h3>
                  <button
                    onClick={() => {
                      const list = [...(recipe.qualityControl.acceptanceCriteria || []), ''];
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, acceptanceCriteria: list } }));
                      setHasUnsavedChanges(true);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} /> Añadir
                  </button>
                </div>
                <div className="space-y-2">
                  {recipe.qualityControl.acceptanceCriteria?.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={crit}
                        onChange={e => {
                          const list = [...recipe.qualityControl.acceptanceCriteria];
                          list[idx] = e.target.value;
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, acceptanceCriteria: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Criterio de aprobación visual, gustativo..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = recipe.qualityControl.acceptanceCriteria.filter((_, i) => i !== idx);
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, acceptanceCriteria: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        className="text-slate-600 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criterios de Rechazo */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Criterios de Rechazo Inmediato
                  </h3>
                  <button
                    onClick={() => {
                      const list = [...(recipe.qualityControl.rejectionCriteria || []), ''];
                      setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, rejectionCriteria: list } }));
                      setHasUnsavedChanges(true);
                    }}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} /> Añadir
                  </button>
                </div>
                <div className="space-y-2">
                  {recipe.qualityControl.rejectionCriteria?.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={crit}
                        onChange={e => {
                          const list = [...recipe.qualityControl.rejectionCriteria];
                          list[idx] = e.target.value;
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, rejectionCriteria: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Si supera los 56°C en corazón, si la salsa corta..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-rose-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = recipe.qualityControl.rejectionCriteria.filter((_, i) => i !== idx);
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, rejectionCriteria: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        className="text-slate-600 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registro de Catas Técnicas */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" /> Registro de Catas y Aprobación
                </h3>
                <button
                  onClick={() => {
                    const newLog = {
                      id: `taste-${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      taster: settings.teacherName || 'Comité de Cata',
                      score: 9.0,
                      appearanceNotes: 'Excelente equilibrio visual.',
                      textureNotes: 'Textura acorde al estándar.',
                      flavorNotes: 'Sabor redondo y balanceado.',
                      approvedForMenu: true,
                      adjustmentsNeeded: ''
                    };
                    const history = [...(recipe.qualityControl.tastingHistory || []), newLog];
                    setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, tastingHistory: history } }));
                    setHasUnsavedChanges(true);
                  }}
                  className="flex items-center gap-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded"
                >
                  <Plus size={12} /> Nueva Cata
                </button>
              </div>

              <div className="space-y-3">
                {recipe.qualityControl.tastingHistory?.map((log, idx) => (
                  <div key={log.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{log.date}</span>
                        <span className="text-white font-bold">{log.taster}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-amber-300 font-bold text-sm">
                          {log.score} / 10
                        </span>
                        <label className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <input
                            type="checkbox"
                            checked={log.approvedForMenu}
                            onChange={e => {
                              const list = [...recipe.qualityControl.tastingHistory];
                              list[idx] = { ...log, approvedForMenu: e.target.checked };
                              setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, tastingHistory: list } }));
                              setHasUnsavedChanges(true);
                            }}
                          />
                          Aprobado para Servicio
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={log.flavorNotes}
                        onChange={e => {
                          const list = [...recipe.qualityControl.tastingHistory];
                          list[idx] = { ...log, flavorNotes: e.target.value };
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, tastingHistory: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Notas gustativas..."
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
                      />
                      <input
                        type="text"
                        value={log.textureNotes}
                        onChange={e => {
                          const list = [...recipe.qualityControl.tastingHistory];
                          list[idx] = { ...log, textureNotes: e.target.value };
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, tastingHistory: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Notas de textura..."
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
                      />
                      <input
                        type="text"
                        value={log.adjustmentsNeeded || ''}
                        onChange={e => {
                          const list = [...recipe.qualityControl.tastingHistory];
                          list[idx] = { ...log, adjustmentsNeeded: e.target.value };
                          setRecipe(p => ({ ...p, qualityControl: { ...p.qualityControl, tastingHistory: list } }));
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Ajustes o mejoras requeridas..."
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-amber-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NIVEL 5 · TRAZABILIDAD, VERSIONES Y COSTES                                */}
        {/* ========================================================================= */}
        {activeTab === 'N5' && (
          <div className="space-y-6">
            {/* Banner Didáctico Nivel 5 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">NIVEL 5 · Trazabilidad & Conservación:</strong> Registra la caducidad y envasado de cada elaboración (vida útil), las versiones y cambios que hagas con el tiempo, y el escandallo de costes por comensal.
                </span>
              </div>
              {onOpenGuide && (
                <button 
                  onClick={onOpenGuide} 
                  className="text-amber-300 hover:text-white underline font-bold shrink-0 text-[11px]"
                >
                  Ver Manual Completo (PDF)
                </button>
              )}
            </div>

            {/* Control de Versiones */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-400" /> Historial de Versiones y Modificaciones
                </h3>
                <button
                  onClick={() => {
                    const newVer = {
                      version: `1.${(recipe.traceability.versionHistory?.length || 0) + 1}`,
                      date: new Date().toISOString().split('T')[0],
                      author: settings.teacherName || 'Chef I+D',
                      changeSummary: 'Ajuste de parámetros técnicos',
                      reason: 'Optimización de proceso'
                    };
                    const hist = [...(recipe.traceability.versionHistory || []), newVer];
                    setRecipe(p => ({ ...p, traceability: { ...p.traceability, versionHistory: hist } }));
                    setHasUnsavedChanges(true);
                  }}
                  className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2 py-1 rounded"
                >
                  <Plus size={12} /> Registrar Versión
                </button>
              </div>

              <div className="space-y-2">
                {recipe.traceability.versionHistory?.map((ver, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                        v{ver.version}
                      </span>
                      <input
                        type="text"
                        value={ver.changeSummary}
                        onChange={e => {
                          const hist = [...recipe.traceability.versionHistory];
                          hist[idx] = { ...ver, changeSummary: e.target.value };
                          setRecipe(p => ({ ...p, traceability: { ...p.traceability, versionHistory: hist } }));
                          setHasUnsavedChanges(true);
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs w-64"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                      <span>{ver.date}</span>
                      <span>·</span>
                      <span>{ver.author}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const hist = recipe.traceability.versionHistory.filter((_, i) => i !== idx);
                          setRecipe(p => ({ ...p, traceability: { ...p.traceability, versionHistory: hist } }));
                          setHasUnsavedChanges(true);
                        }}
                        className="text-slate-600 hover:text-rose-400 ml-2"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escandallo y Food Cost */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Coste Materia Prima por Ración (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={recipe.traceability.costPerPax || ''}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setRecipe(p => ({ ...p, traceability: { ...p.traceability, costPerPax: v } }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  PVP Objetivo en Carta (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={recipe.traceability.salePriceObjective || ''}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setRecipe(p => ({ ...p, traceability: { ...p.traceability, salePriceObjective: v } }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-amber-300 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Food Cost Ratio Objetivo (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={recipe.traceability.targetFoodCostPercentage || ''}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setRecipe(p => ({ ...p, traceability: { ...p.traceability, targetFoodCostPercentage: v } }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 font-mono text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
