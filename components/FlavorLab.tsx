import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Beaker, Sparkles, Search, Plus, X, ArrowLeft, Zap, 
  FlaskConical, Microscope, Wine, ChefHat, Target, 
  Layers, Link2, Lightbulb, RefreshCw, CheckCircle2, ArrowRight, BookOpen, Trash2, Wand2
} from 'lucide-react';
import { Recipe, AppSettings, Product } from '../types';
import { 
  analyzeIngredientsMesaID, 
  analyzeRecipeInternalHarmony, 
  generateRecipeAI, 
  MesaIDAnalysis, 
  RecipeMolecularHarmony 
} from '../services/pairingService';

interface Props {
  recipes: Recipe[];
  productDatabase?: Product[];
  settings: AppSettings;
  onBack: () => void;
  onCreateRecipeWithIngredients?: (ingredients: string[]) => void;
}

const INSPIRATIONAL_COMBINATIONS = [
  { name: "Mar y Huerto", ingredients: ["Merluza", "Perejil", "Ajo", "Vino Blanco"] },
  { name: "Cacao y Umami", ingredients: ["Chocolate Negro", "Queso Azul", "Nuez"] },
  { name: "Bosque y Humo", ingredients: ["Boletus Edulis", "Romero", "Ajo Negro", "Mantequilla"] },
  { name: "Frescura Cítrica", ingredients: ["Fresa", "Albahaca", "Pimienta Negra", "Lima"] },
  { name: "Pato y Dulzor", ingredients: ["Pato", "Naranja", "Cardamomo", "Zanahoria"] }
];

export const FlavorLab: React.FC<Props> = ({ 
  recipes, 
  productDatabase = [], 
  settings, 
  onBack, 
  onCreateRecipeWithIngredients 
}) => {
  const [activeTab, setActiveTab] = useState<'mesa' | 'auditoria' | 'arquitecto'>('mesa');
  
  // Mesa de I+D State
  const [ingredients, setIngredients] = useState<string[]>(["Merluza", "Ajo", "Perejil"]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [mesaAnalysis, setMesaAnalysis] = useState<MesaIDAnalysis | null>(null);
  const [loadingMesa, setLoadingMesa] = useState(false);

  // Auditoría State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [recipeAnalysis, setRecipeAnalysis] = useState<RecipeMolecularHarmony | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Arquitecto AI State
  const [genVibe, setGenVibe] = useState('Alta Gastronomía / Vanguardia');
  const [genLevel, setGenLevel] = useState('Professional');
  const [genGoal, setGenGoal] = useState('Plato principal en menú degustación');
  const [genConstraints, setGenConstraints] = useState<string[]>([]);
  const [constraintInput, setConstraintInput] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [loadingGen, setLoadingGen] = useState(false);

  // Autocompletado de ingredientes desde el inventario del centro
  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.trim().length > 1) {
      const q = val.toLowerCase().trim();
      const matches = productDatabase
        .map(p => p.name)
        .filter(n => n.toLowerCase().includes(q) && !ingredients.map(i => i.toLowerCase()).includes(n.toLowerCase()))
        .slice(0, 6);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleAddIngredient = (nameToAdd?: string) => {
    const raw = (nameToAdd || input).trim();
    if (raw && !ingredients.some(i => i.toLowerCase() === raw.toLowerCase())) {
      setIngredients([...ingredients, raw]);
      setInput('');
      setSuggestions([]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleLoadCombination = (comboIngredients: string[]) => {
    setIngredients(comboIngredients);
    setMesaAnalysis(null);
  };

  // Analizar en la Mesa de I+D
  const handleRunMesaAnalysis = async () => {
    if (ingredients.length < 2) return;
    setLoadingMesa(true);
    try {
      const res = await analyzeIngredientsMesaID(ingredients);
      setMesaAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMesa(false);
    }
  };

  // Analizar receta existente
  const handleAnalyzeSelectedRecipe = async () => {
    const rec = recipes.find(r => r.id === selectedRecipeId);
    if (!rec) return;
    setLoadingRecipe(true);
    try {
      const res = await analyzeRecipeInternalHarmony(rec);
      setRecipeAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Generar con Arquitecto IA
  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) return;
    setLoadingGen(true);
    try {
      const res = await generateRecipeAI({
        ingredients,
        vibe: genVibe,
        level: genLevel,
        goal: genGoal,
        constraints: genConstraints
      });
      setGeneratedRecipe(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F5FE] z-[120] flex flex-col text-slate-800 overflow-hidden font-sans animate-fadeIn selection:bg-violet-200 selection:text-violet-950">
      {/* Top Header (Identidad Lavanda / Violeta Científico) */}
      <div className="px-6 py-4 bg-white border-b border-violet-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700 hover:text-slate-950"
            title="Volver al Panel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="bg-violet-700 p-2 rounded-xl shadow-xs text-white">
                <FlaskConical size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                Laboratorio <span className="text-violet-700">Molecular & I+D</span>
              </h1>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Ciencia del Sabor • FlavorDB & Foodpairing Aplicado a Cocina
            </p>
          </div>
        </div>

        {/* Pestañas de Modo */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          {[
            { id: 'mesa', label: 'Mesa de I+D (Banco de Pruebas)', icon: Beaker },
            { id: 'auditoria', label: 'Auditoría de Recetas', icon: BookOpen },
            { id: 'arquitecto', label: 'Arquitecto IA', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isSel 
                    ? 'bg-violet-700 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* ======================================================== */}
          {/* MODO 1: MESA DE I+D (BANCO DE PRUEBAS DE INGREDIENTES)    */}
          {/* ======================================================== */}
          {activeTab === 'mesa' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Columna Izquierda: Ingredientes incorporados */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                        <Beaker size={15} /> Mesa de Experimentación
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Añade los ingredientes que deseas cruzar molecularmente.
                      </p>
                    </div>
                    {ingredients.length > 0 && (
                      <button
                        onClick={() => setIngredients([])}
                        className="text-[9px] font-bold text-slate-500 hover:text-rose-400 uppercase transition-colors"
                      >
                        Vaciar Mesa
                      </button>
                    )}
                  </div>

                  {/* Input con sugerencias del catálogo */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input 
                          type="text" 
                          value={input}
                          onChange={e => handleInputChange(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          placeholder="Escribe o busca un ingrediente..."
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => handleAddIngredient()}
                        disabled={!input.trim()}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus size={16} />
                        <span>Añadir</span>
                      </button>
                    </div>

                    {/* Menú de sugerencias autocompletadas */}
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-700/50">
                        {suggestions.map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleAddIngredient(s)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span>{s}</span>
                            <span className="text-[8px] uppercase font-black text-slate-400">Catálogo IES</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lista de chips en la mesa */}
                  <div className="min-h-[100px] p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        Ingredientes en la Mesa ({ingredients.length})
                      </span>
                    </div>

                    {ingredients.length === 0 ? (
                      <p className="text-xs text-slate-600 italic text-center py-6">
                        No hay ingredientes en la mesa todavía. Teclea arriba o elige un ejemplo abajo.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {ingredients.map((ing, idx) => (
                          <span 
                            key={idx} 
                            className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-xs"
                          >
                            <span>{ing}</span>
                            <button 
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-indigo-400 hover:text-rose-400 transition-colors"
                              title="Quitar"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Combinaciones de inspiración */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
                      Ejemplos de Inspiración Molecular:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {INSPIRATIONAL_COMBINATIONS.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleLoadCombination(c.ingredients)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-slate-700/60"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botón Principal de Ejecución */}
                  <button 
                    onClick={handleRunMesaAnalysis}
                    disabled={loadingMesa || ingredients.length < 2}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingMesa ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Mapeando Sinergias Aromáticas...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Calcular Enlaces y Compatibilidad</span>
                      </>
                    )}
                  </button>

                  {ingredients.length > 0 && onCreateRecipeWithIngredients && (
                    <button
                      onClick={() => onCreateRecipeWithIngredients(ingredients)}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <ChefHat size={14} className="text-amber-400" />
                      <span>Crear Nueva Ficha con estos Ingredientes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Resultados del análisis */}
              <div className="lg:col-span-7">
                {loadingMesa ? (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center">
                    <Microscope size={48} className="text-indigo-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-black uppercase text-white tracking-wider">
                        Cruzando Moléculas Volátiles y Bases FlavorDB
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Analizando solapamiento de terpenos, pirazinas, aldehídos y lípidos entre los ingredientes seleccionados...
                      </p>
                    </div>
                  </div>
                ) : mesaAnalysis ? (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Score y Resumen de Compatibilidad */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">
                            Índice Global de Compatibilidad Molecular
                          </span>
                          <h4 className="text-xl font-black text-white uppercase mt-0.5">
                            {mesaAnalysis.profileSummary}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-indigo-500/30 shrink-0">
                          <Zap size={18} className="text-indigo-400" />
                          <span className="text-2xl font-black font-mono text-indigo-300">
                            {mesaAnalysis.overallCompatibility}%
                          </span>
                        </div>
                      </div>

                      {/* Desglose de Familias Aromáticas */}
                      {mesaAnalysis.aromaFamilies && mesaAnalysis.aromaFamilies.length > 0 && (
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                            Familias Aromáticas Dominantes en el Conjunto:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {mesaAnalysis.aromaFamilies.map((fam, idx) => (
                              <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-[9px] font-bold text-slate-400 block truncate uppercase">
                                  {fam.name}
                                </span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs font-mono font-black text-white">
                                    {fam.percentage}%
                                  </span>
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: fam.color || '#6366f1' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Matriz de Enlaces Par a Par (Flavor Network) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Link2 size={15} className="text-indigo-400" />
                          Red de Enlaces Moleculares (Flavor Network)
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {mesaAnalysis.links?.length || 0} enlaces identificados
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
                        {mesaAnalysis.links?.map((link, idx) => (
                          <div 
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase">
                                  {link.source}
                                </span>
                                <span className="text-indigo-400 font-bold">↔</span>
                                <span className="px-2.5 py-0.5 bg-indigo-900/60 text-indigo-200 rounded-lg text-[10px] font-black uppercase border border-indigo-500/30">
                                  {link.target}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-black text-indigo-400 shrink-0">
                                {link.affinity}% Afinidad
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-300 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                              <span className="text-slate-400 uppercase font-bold text-[8px]">Compuesto compartido:</span>
                              <span className="text-emerald-400 font-bold">{link.compound}</span>
                            </div>

                            <p className="text-[11px] text-slate-400 italic leading-snug">
                              {link.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ingredientes Puente Sugeridos */}
                    {mesaAnalysis.bridgeSuggestions && mesaAnalysis.bridgeSuggestions.length > 0 && (
                      <div className="bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={16} className="text-amber-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">
                            Ingredientes Puente Recomendados por I+D
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Si deseas redondear la combinación y cerrar el triángulo aromático, incorpora:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {mesaAnalysis.bridgeSuggestions.map((b, idx) => (
                            <div 
                              key={idx} 
                              className="bg-slate-950/80 border border-indigo-400/20 p-3.5 rounded-2xl space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-amber-300">
                                  + {b.ingredient}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddIngredient(b.ingredient)}
                                  className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600/50 hover:bg-indigo-600 text-white transition-colors"
                                >
                                  Añadir a Mesa
                                </button>
                              </div>
                              <p className="text-[9px] font-bold text-indigo-200">
                                {b.bridgesWhat}
                              </p>
                              <p className="text-[10px] text-slate-400 italic leading-tight">
                                {b.scientificReason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Maridaje Líquido y Veredicto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mesaAnalysis.recommendedDrinkPairing && (
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                          <div className="flex items-center gap-2 text-purple-400">
                            <Wine size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Maridaje Líquido Molecular
                            </span>
                          </div>
                          <h5 className="text-xs font-black uppercase text-white">
                            {mesaAnalysis.recommendedDrinkPairing.drink}
                          </h5>
                          <p className="text-[10px] font-mono text-purple-300">
                            Molécula: {mesaAnalysis.recommendedDrinkPairing.sharedCompound}
                          </p>
                          <p className="text-[10px] text-slate-400 italic">
                            {mesaAnalysis.recommendedDrinkPairing.pairingNotes}
                          </p>
                        </div>
                      )}

                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Veredicto del Chef Investigador
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          "{mesaAnalysis.culinaryVerdict}"
                        </p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center">
                    <FlaskConical size={48} className="text-slate-700" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Mesa de I+D Lista para Experimentar
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-sm">
                        Añade 2 o más ingredientes en la columna izquierda y pulsa «Calcular Enlaces y Compatibilidad» para mapear las sinergias aromáticas.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 2: AUDITORÍA DE RECETA EXISTENTE                     */}
          {/* ======================================================== */}
          {activeTab === 'auditoria' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-grow w-full sm:w-auto">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Selecciona una Receta del Recetario del Centro:
                  </label>
                  <select 
                    value={selectedRecipeId}
                    onChange={e => setSelectedRecipeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500"
                  >
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAnalyzeSelectedRecipe}
                  disabled={loadingRecipe || !selectedRecipeId}
                  className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {loadingRecipe ? <RefreshCw size={14} className="animate-spin" /> : <Microscope size={14} />}
                  <span>Auditar Receta</span>
                </button>
              </div>

              {recipeAnalysis && !loadingRecipe && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">
                        Perfil Molecular de la Receta
                      </span>
                      <h3 className="text-xl font-black text-white uppercase mt-0.5">
                        {recipeAnalysis.dominantProfile}
                      </h3>
                    </div>
                    <div className="px-4 py-2 bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center gap-2">
                      <Zap size={16} className="text-emerald-400" />
                      <span className="text-xl font-mono font-black text-emerald-300">
                        {recipeAnalysis.cohesionScore}% Armonía
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest block mb-1">
                      Ingrediente Puente Clave
                    </span>
                    <p className="text-sm font-black text-white uppercase">
                      {recipeAnalysis.bridgeIngredient?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 italic mt-0.5">
                      {recipeAnalysis.bridgeIngredient?.role}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Enlaces entre los Ingredientes Reales de la Receta
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recipeAnalysis.molecularLinks?.map((l, idx) => (
                        <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white uppercase">
                              {l.source} ↔ {l.target}
                            </span>
                            <span className="text-xs font-mono font-black text-indigo-400">
                              {l.affinityScore}%
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-emerald-400">
                            Molécula: {l.sharedCompound}
                          </p>
                          <p className="text-[10px] text-slate-400 italic leading-snug">
                            {l.culinaryReason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                    <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest block mb-1">
                      Fundamento Didáctico Organoléptico
                    </span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{recipeAnalysis.organolepticSummary}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 3: ARQUITECTO IA DE VANGUARDIA                      */}
          {/* ======================================================== */}
          {activeTab === 'arquitecto' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Sparkles size={15} /> Parámetros de Diseño Culinario
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Concepto / Vibe
                    </label>
                    <input 
                      type="text" 
                      value={genVibe} 
                      onChange={e => setGenVibe(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Nivel Técnico
                    </label>
                    <select 
                      value={genLevel} 
                      onChange={e => setGenLevel(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                    >
                      <option>Taller de Escuela / Intermedio</option>
                      <option>Professional</option>
                      <option>Alta Gastronomía / Vanguardia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Objetivo
                    </label>
                    <input 
                      type="text" 
                      value={genGoal} 
                      onChange={e => setGenGoal(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Ingredientes Fijos a Incluir ({ingredients.length})
                    </label>
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {ingredients.map((ing, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateRecipe}
                  disabled={loadingGen || ingredients.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  {loadingGen ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  <span>Diseñar Receta Completa</span>
                </button>
              </div>

              <div className="lg:col-span-8">
                {generatedRecipe ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
                    <div className="p-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-lg">
                        {generatedRecipe.category || 'Creación I+D'}
                      </span>
                      <h2 className="text-3xl font-black uppercase tracking-tight mt-2">
                        {generatedRecipe.name}
                      </h2>
                      <p className="text-xs text-white/80 italic mt-2">
                        {generatedRecipe.description}
                      </p>
                    </div>

                    <div className="p-8 space-y-6">
                      {generatedRecipe.subRecipes?.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                            {sub.name}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {sub.ingredients?.map((ing: any, iIdx: number) => (
                              <div key={iIdx} className="flex justify-between p-2 bg-slate-900 rounded-lg">
                                <span className="font-bold text-white">{ing.name}</span>
                                <span className="font-mono text-indigo-300">{ing.quantity} {ing.unit}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed border-t border-slate-800 pt-3">
                            {Array.isArray(sub.steps) ? sub.steps.map((st: any) => st.step || st).join('\n') : sub.instructions}
                          </div>
                        </div>
                      ))}

                      {generatedRecipe.chefTips && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs italic">
                          <span className="font-black uppercase block mb-1">Nota Técnica del Chef:</span>
                          "{generatedRecipe.chefTips}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center">
                    <Sparkles size={40} className="text-slate-700" />
                    <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                      Arquitecto de Recetas IA preparado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
