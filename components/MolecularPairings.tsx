import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ChevronDown, ChevronUp, Beaker, Zap, 
  FlaskConical, CheckCircle2, RefreshCw, ArrowRight, Lightbulb, Link2 
} from 'lucide-react';
import { Recipe } from '../types';
import { analyzeRecipeInternalHarmony, RecipeMolecularHarmony } from '../services/pairingService';

interface Props {
  recipe: Recipe;
  onOpenInFlavorLab?: (ingredients: string[]) => void;
  includeInPrint?: boolean;
}

export const MolecularPairings: React.FC<Props> = ({ recipe, onOpenInFlavorLab, includeInPrint = true }) => {
  const [data, setData] = useState<RecipeMolecularHarmony | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Extract ingredients list from recipe
  const recipeIngredients = React.useMemo(() => {
    const list: string[] = [];
    recipe.subRecipes?.forEach(sub => {
      sub.ingredients?.forEach(ing => {
        if (ing.name && ing.name.trim().length > 1) {
          list.push(ing.name.trim().toUpperCase());
        }
      });
    });
    return Array.from(new Set(list));
  }, [recipe]);

  const handleFetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRecipeInternalHarmony(recipe);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('No se pudo completar el análisis molecular.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar automáticamente en segundo plano para que esté disponible instantáneamente al imprimir
  useEffect(() => {
    if (!data && !loading) {
      handleFetchAnalysis();
    }
  }, [recipe.id]);

  useEffect(() => {
    if (expanded && !data && !loading) {
      handleFetchAnalysis();
    }
  }, [expanded]);

  return (
    <>
      {/* VISTA EN PANTALLA (Interactivo y desplegable) */}
      <div className="mt-8 border-t-2 border-slate-900 pt-6 no-print">
        <button 
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all border border-indigo-500/30 group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <FlaskConical size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Ciencia del Sabor y Armonía Molecular (FlavorDB)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Enlaces del Plato
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                Evaluación científica de compuestos volátiles y sinergia entre los ingredientes de esta receta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-xs font-mono font-black">
                <Zap size={13} className="text-emerald-400" />
                <span>{data.cohesionScore}% Armonía</span>
              </div>
            )}
            {expanded ? (
              <ChevronUp className="text-indigo-300 transition-transform" size={20} />
            ) : (
              <ChevronDown className="text-indigo-300 group-hover:translate-y-0.5 transition-transform" size={20} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm space-y-6">
                
                {loading && (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                    <RefreshCw size={28} className="animate-spin text-indigo-600" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Calculando enlaces moleculares entre ingredientes...
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Consultando espectro de moléculas volátiles compartidas y familias aromáticas
                    </p>
                  </div>
                )}

                {error && !loading && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex justify-between items-center text-xs">
                    <span>{error}</span>
                    <button 
                      onClick={handleFetchAnalysis}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {data && !loading && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Resumen Principal de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Score */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase text-indigo-900 tracking-wider">
                            Cohesión Aromática
                          </span>
                          <Zap size={14} className="text-indigo-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black font-mono text-indigo-950">
                            {data.cohesionScore}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {data.cohesionScore > 80 ? 'Alta Armonía' : 'Armonía Moderada'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${data.cohesionScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Perfil */}
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-slate-50 rounded-2xl border border-amber-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase text-amber-900 tracking-wider">
                            Perfil Aromático Dominante
                          </span>
                          <Sparkles size={14} className="text-amber-600" />
                        </div>
                        <p className="text-sm font-black text-slate-900 uppercase leading-snug">
                          {data.dominantProfile}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {data.volatileFamilies?.map((fam, idx) => (
                            <span key={idx} className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                              {fam}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Ingrediente Puente */}
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase text-emerald-900 tracking-wider">
                            Ingrediente Puente del Plato
                          </span>
                          <Link2 size={14} className="text-emerald-600" />
                        </div>
                        <p className="text-sm font-black text-emerald-950 uppercase">
                          {data.bridgeIngredient?.name}
                        </p>
                        <p className="text-[10px] text-slate-600 italic leading-tight mt-1">
                          {data.bridgeIngredient?.role}
                        </p>
                      </div>
                    </div>

                    {/* Resumen Organoléptico Didáctico */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                        <Lightbulb size={13} className="text-amber-500" />
                        Fundamento Didáctico (¿Por qué funciona este plato en boca?)
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                        "{data.organolepticSummary}"
                      </p>
                    </div>

                    {/* Red de Enlaces Moleculares entre Ingredientes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Beaker size={14} className="text-indigo-600" />
                          Enlaces y Moléculas Compartidas entre Ingredientes
                        </h5>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {data.molecularLinks?.length || 0} nexos detectados
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.molecularLinks?.map((link, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase">
                                  {link.source}
                                </span>
                                <span className="text-slate-300 font-bold">↔</span>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded text-[9px] font-black uppercase">
                                  {link.target}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-black text-indigo-600 shrink-0">
                                {link.affinityScore}%
                              </span>
                            </div>

                            <div className="text-[9px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700 uppercase">Molécula / Familia: </span>
                              <span className="text-indigo-700 font-bold">{link.sharedCompound}</span>
                            </div>

                            <p className="text-[10px] text-slate-600 italic leading-snug">
                              {link.culinaryReason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sugerencia de Potenciador Molecular */}
                    {data.enhancerSuggestion && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-2xl border-2 border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-purple-600 text-white">
                            Potenciador Molecular Opcional
                          </span>
                          <h6 className="text-xs font-black uppercase text-purple-950">
                            {data.enhancerSuggestion.ingredient}
                          </h6>
                          <p className="text-[10px] text-purple-900/80 leading-snug">
                            {data.enhancerSuggestion.technique} (Aporta: <span className="font-mono font-bold">{data.enhancerSuggestion.compound}</span>)
                          </p>
                        </div>

                        {onOpenInFlavorLab && (
                          <button
                            type="button"
                            onClick={() => onOpenInFlavorLab(recipeIngredients)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            <span>Mesa de I+D</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Botón para recalcular */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleFetchAnalysis}
                        disabled={loading}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={11} />
                        <span>Volver a analizar</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* VISTA EN IMPRESIÓN (Visible al imprimir si includeInPrint está activado)     */}
      {/* ========================================================================= */}
      {includeInPrint && data && (
        <div className="hidden print:block mt-6 pt-6 border-t-2 border-slate-900 break-inside-avoid no-break space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <span className="border border-slate-900 text-slate-900 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                FlavorDB
              </span>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xs">
                ANÁLISIS MOLECULAR Y CIENCIA DEL SABOR
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-slate-500">Cohesión Aromática:</span>
              <span className="text-xs font-black font-mono text-slate-900 px-2 py-0.5 border border-slate-900 rounded">
                {data.cohesionScore}% Armonía
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 text-[9px]">
            <div className="col-span-4 p-2.5 border border-slate-300 rounded-lg">
              <p className="font-black text-slate-400 uppercase text-[7px] tracking-wider mb-1">Perfil Dominante</p>
              <p className="font-black text-slate-900 uppercase text-[10px] leading-tight">{data.dominantProfile}</p>
              <p className="text-[8px] text-slate-500 mt-1 font-mono">
                {data.volatileFamilies?.join(' • ')}
              </p>
            </div>

            <div className="col-span-4 p-2.5 border border-slate-300 rounded-lg">
              <p className="font-black text-slate-400 uppercase text-[7px] tracking-wider mb-1">Ingrediente Puente</p>
              <p className="font-black text-slate-900 uppercase text-[10px] leading-tight">{data.bridgeIngredient?.name}</p>
              <p className="text-[8px] text-slate-600 italic mt-1 leading-snug">{data.bridgeIngredient?.role}</p>
            </div>

            <div className="col-span-4 p-2.5 border border-slate-300 rounded-lg">
              <p className="font-black text-slate-400 uppercase text-[7px] tracking-wider mb-1">Potenciador Sugerido</p>
              <p className="font-black text-slate-900 uppercase text-[10px] leading-tight">
                {data.enhancerSuggestion?.ingredient || 'No requerido'}
              </p>
              <p className="text-[8px] text-slate-600 italic mt-1 leading-snug">
                {data.enhancerSuggestion?.technique}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[9px]">
            <p className="font-black text-slate-500 uppercase text-[8px] tracking-wider mb-1">
              Fundamento Organoléptico (Por qué funciona el plato en boca):
            </p>
            <p className="text-slate-700 italic leading-snug">
              "{data.organolepticSummary}"
            </p>
          </div>

          {data.molecularLinks && data.molecularLinks.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-black text-slate-500 uppercase text-[8px] tracking-wider">
                Enlaces Moleculares Directos entre Ingredientes:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {data.molecularLinks.slice(0, 6).map((link, lIdx) => (
                  <div key={lIdx} className="p-2 border border-slate-200 rounded-lg text-[8px] leading-tight">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-slate-900 uppercase">{link.source} ↔ {link.target}</span>
                      <span className="font-mono font-bold text-slate-600">{link.affinityScore}%</span>
                    </div>
                    <p className="text-slate-500 font-mono text-[7px]">Compuesto: <strong className="text-slate-700">{link.sharedCompound}</strong></p>
                    <p className="text-slate-600 italic mt-0.5">{link.culinaryReason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
