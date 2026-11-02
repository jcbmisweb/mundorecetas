import React, { useEffect, useRef, useMemo } from 'react';
import { ProRecipe, AppSettings, Allergen, RUBRIC_CRITERIA, DEFAULT_PCC_PLAN } from '../types';
import { ProSensoryRadarChart } from './ProSensoryRadarChart';
import { AllergenIcon } from './AllergenIcon';
import { 
  Printer, ArrowLeft, Award, Layers, Thermometer, Clock, Scale, 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, History, DollarSign,
  Compass, ChefHat, Sparkles, Image as ImageIcon, Check, Calendar, Sun, BellRing,
  FileCheck, BookOpen
} from 'lucide-react';

interface ProRecipePrintViewProps {
  recipe: ProRecipe;
  settings: AppSettings;
  onBack: () => void;
  onEdit?: () => void;
}

export const ProRecipePrintView: React.FC<ProRecipePrintViewProps> = ({
  recipe,
  settings,
  onBack,
  onEdit
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Asegurar que el título del documento (y nombre predeterminado al guardar como PDF) sea:
  // "Taller I+D - [Nombre de la ficha]"
  useEffect(() => {
    const originalTitle = document.title;
    const cleanName = (recipe.name || 'Ficha').trim();
    document.title = `Taller I+D - ${cleanName}`;
    return () => {
      document.title = originalTitle;
    };
  }, [recipe.name]);

  const handlePrint = () => {
    const cleanName = (recipe.name || 'Ficha').trim();
    document.title = `Taller I+D - ${cleanName}`;
    window.print();
  };

  const statusLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    development: { label: 'EN DESARROLLO / I+D', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
    validated: { label: 'VALIDADO TÉCNICAMENTE', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
    in_service: { label: 'EN CARTA / SERVICIO ACTIVO', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
    archived: { label: 'ARCHIVO HISTÓRICO', bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' }
  };

  const currentStatus = statusLabels[recipe.status] || statusLabels.development;

  // Resumen global de alérgenos unificados de todas las sub-elaboraciones (Reglamento UE 1169/2011)
  const allDishAllergens = useMemo(() => {
    const set = new Set<Allergen>();
    recipe.components?.forEach(c => {
      c.allergens?.forEach(a => set.add(a));
    });
    return Array.from(set);
  }, [recipe.components]);

  // Lista de PCCs para la ficha (del modelo o por defecto oficial RD 3484/2000)
  const activePccList = (recipe.pccPlan && recipe.pccPlan.length > 0) ? recipe.pccPlan : DEFAULT_PCC_PLAN;

  // Cálculo de rúbrica si está evaluada
  const rubric = recipe.rubricEvaluation;
  const weightedSum = useMemo(() => {
    if (!rubric?.scores) return null;
    let sum = 0;
    RUBRIC_CRITERIA.forEach(c => {
      const s = rubric.scores[c.key];
      if (typeof s === 'number') {
        sum += (s * c.weight) / 100;
      }
    });
    return sum;
  }, [rubric]);

  return (
    <div className="min-h-screen bg-slate-100 pb-16 print:bg-white print:pb-0">
      {/* Barra de control superior (No imprimible) */}
      <div className="print:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-white shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver al Taller
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-amber-400 font-bold">{recipe.code}</span>
            <span>·</span>
            <span>v{recipe.version}</span>
            <span>·</span>
            <span className="text-slate-300 font-sans truncate max-w-[260px]">{recipe.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 font-bold uppercase">
              {recipe.useLevel === 'basic' ? 'Nivel 1: Básico' : 'Nivel 2: I+D Avanzado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/30 cursor-pointer"
            >
              <Compass size={14} /> Editar Taller
            </button>
          )}
          <button
            onClick={handlePrint}
            title="Guardar como PDF con nombre 'Taller I+D - [Nombre de la ficha]'"
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Printer size={15} /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Estilos de impresión calibrados para impresión perfecta en A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm 7mm 7mm 7mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9.5px !important;
            line-height: 1.25 !important;
          }
          .pro-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .pro-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .pro-break-after-avoid {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* Contenedor principal de Dossier Gastronómico I+D */}
      <main 
        ref={printRef} 
        className="max-w-[210mm] mx-auto my-6 print:my-0 bg-white shadow-2xl print:shadow-none p-6 sm:p-8 print:p-0 text-slate-900 font-sans border border-slate-200 print:border-none"
      >
        
        {/* ========================================================================= */}
        {/* SECCIÓN 1: IDENTIDAD, CONCEPTO, PERFIL SENSORIAL Y REGISTRO VISUAL        */}
        {/* ========================================================================= */}
        <section className="mb-5 print:mb-4">
          
          {/* CABECERA MAESTRA: IDENTIFICACIÓN Y CONTROL OPERATIVO */}
          <header className="border-b-2 border-slate-900 pb-2.5 mb-2.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest uppercase text-slate-500 font-bold mb-1">
                  <span>ALTA GASTRONOMÍA · DOCUMENTO OPERATIVO CONTROLADO</span>
                  <span>·</span>
                  <span className="text-amber-700 font-black">
                    {recipe.useLevel === 'basic' ? 'NIVEL 1: BÁSICO OPERATIVO' : 'NIVEL 2: I+D AVANZADO'}
                  </span>
                </div>
                <h1 className="text-2xl print:text-xl font-black tracking-tight text-slate-950 font-serif leading-tight">
                  {recipe.name}
                </h1>
                {recipe.technicalName && (
                  <p className="text-xs print:text-[11px] font-medium text-slate-600 italic mt-0.5">
                    {recipe.technicalName}
                  </p>
                )}
              </div>

              {/* Logos institucionales / autor */}
              <div className="flex items-center gap-3 shrink-0">
                {settings.instituteLogo ? (
                  <img 
                    src={settings.instituteLogo} 
                    alt="IES Logo" 
                    className="h-10 print:h-8 w-auto max-w-[85px] object-contain"
                  />
                ) : (
                  <div className="text-right">
                    <div className="text-[8.5px] font-mono font-bold text-slate-400">CENTRO EDUCATIVO</div>
                    <div className="text-xs font-black text-slate-800">{settings.instituteName || 'IES La Flota'}</div>
                  </div>
                )}
                {settings.teacherLogo && (
                  <img 
                    src={settings.teacherLogo} 
                    alt="Profesor Logo" 
                    className="h-10 print:h-8 w-auto max-w-[85px] object-contain border-l border-slate-200 pl-2.5"
                  />
                )}
              </div>
            </div>

            {/* Faja de metadatos de control técnico */}
            <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-1.5 mt-2 pt-2 border-t border-slate-200 text-xs print:text-[10px]">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">Código</span>
                <span className="font-mono font-black text-slate-900 text-xs">{recipe.code}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">Versión</span>
                <span className="font-mono font-black text-slate-900 text-xs">v{recipe.version}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">Estado</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                  {currentStatus.label}
                </span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">Rendimiento</span>
                <span className="font-bold text-slate-900 text-xs">{recipe.targetPax} Raciones (Pax)</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200 col-span-2 sm:col-span-1 print:col-span-1">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">Responsable</span>
                <span className="font-medium text-slate-800 text-[10px] truncate block">{recipe.responsible || 'Chef Creativo'}</span>
              </div>
            </div>
          </header>

          {/* NIVEL 1 · IDENTIDAD DEL PLATO, CONCEPTO Y PERFIL SENSORIAL */}
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-300">
              <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">1</span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Nivel 1 · Identidad del Plato, Concepto y Perfil Sensorial
              </h2>
            </div>

            {/* Fila 1: Concepto y Storytelling (Izquierda) + Radar Sensorial Objetivo (Derecha) */}
            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 items-stretch">
              
              {/* Columna Izquierda: Concepto, Producto, Storytelling y Notas Sensoriales */}
              <div className="md:col-span-7 print:col-span-7 space-y-1.5 text-xs print:text-[9.5px] text-slate-800 leading-snug">
                <div className="bg-amber-50/50 p-2 rounded border border-amber-200/60">
                  <h3 className="text-[8.5px] font-mono uppercase font-bold text-amber-900 tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-amber-700" /> Concepto e Intención Gastronómica
                  </h3>
                  <p className="text-slate-800 italic">{recipe.concept || 'Sin definir concepto'}</p>
                </div>

                <div>
                  <h3 className="text-[8.5px] font-mono uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Producto Estrella, Origen y Temporada
                  </h3>
                  <p className="font-medium text-slate-900">{recipe.starProduct || 'No especificado'}</p>
                </div>

                <div>
                  <h3 className="text-[8.5px] font-mono uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Propuesta de Valor / Storytelling para Sala
                  </h3>
                  <p className="text-slate-700">{recipe.storytelling || 'No definido'}</p>
                </div>

                {/* Desglose sensorial descriptivo */}
                <div className="grid grid-cols-2 print:grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 text-[9px]">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8px] font-mono uppercase">Vista / Color</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.visual || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8px] font-mono uppercase">Aroma</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.aroma || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8px] font-mono uppercase">Textura en Boca</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.texture || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8px] font-mono uppercase">Retrogusto</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.aftertaste || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Radar Sensorial Organoléptico */}
              <div className="md:col-span-5 print:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1 text-center">
                  Perfil Organoléptico Objetivo
                </span>
                
                <div className="py-0.5 flex items-center justify-center">
                  <ProSensoryRadarChart 
                    radar={recipe.sensoryProfile.radar} 
                    size={160} 
                    interactive={false} 
                  />
                </div>
                
                <span className="text-[8px] text-slate-400 font-mono text-center block mt-0.5">
                  Escala de intensidades relativas (1 a 5)
                </span>
              </div>
            </div>

            {/* Fila 2: Registro Visual del Emplatado Objetivo (Fotografía y/o Croquis) */}
            {(recipe.heroPhoto || recipe.sketchPhoto) && (
              <div className="mt-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8.5px] font-mono uppercase tracking-widest text-slate-700 font-bold flex items-center gap-1.5">
                    <ImageIcon size={11} className="text-amber-700" /> Registro Visual del Emplatado Objetivo
                  </span>
                  {recipe.plating.tableware && (
                    <span className="text-[8.5px] font-mono text-slate-500">
                      Soporte: <strong className="text-slate-800">{recipe.plating.tableware}</strong>
                    </span>
                  )}
                </div>

                {recipe.heroPhoto && recipe.sketchPhoto ? (
                  <div className="grid grid-cols-2 print:grid-cols-2 gap-2">
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200 flex flex-col items-center">
                      <img
                        src={recipe.heroPhoto}
                        alt="Fotografía de pase"
                        className="w-full max-h-40 print:max-h-36 h-32 object-contain rounded"
                      />
                      <span className="text-[7.5px] text-center text-slate-500 mt-1 font-mono uppercase">
                        Fotografía Real de Pase
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200 flex flex-col items-center">
                      <img
                        src={recipe.sketchPhoto}
                        alt="Croquis técnico"
                        className="w-full max-h-40 print:max-h-36 h-32 object-contain rounded"
                      />
                      <span className="text-[7.5px] text-center text-slate-500 mt-1 font-mono uppercase">
                        Croquis Técnico / Esquema
                      </span>
                    </div>
                  </div>
                ) : recipe.heroPhoto ? (
                  <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200 flex flex-col items-center">
                    <img
                      src={recipe.heroPhoto}
                      alt={recipe.name}
                      className="w-full max-h-44 print:max-h-40 h-36 object-contain rounded"
                    />
                    <span className="text-[8px] text-center text-slate-500 mt-1 font-mono uppercase">
                      Fotografía de Emplatado Objetivo y Composición
                    </span>
                  </div>
                ) : recipe.sketchPhoto ? (
                  <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200 flex flex-col items-center">
                    <img
                      src={recipe.sketchPhoto}
                      alt={recipe.name}
                      className="w-full max-h-44 print:max-h-40 h-36 object-contain rounded"
                    />
                    <span className="text-[8px] text-center text-slate-500 mt-1 font-mono uppercase">
                      Croquis / Esquema Técnico de Montaje
                    </span>
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </section>

        {/* Salto de página suave tras la portada y Nivel 1 */}
        <div className="pro-page-break print:block hidden" />

        {/* ========================================================================= */}
        {/* SECCIÓN 2: NIVEL 2 · FICHAS DE ELABORACIÓN (SUB-COMPONENTES TÉCNICOS)     */}
        {/* ========================================================================= */}
        {recipe.components && recipe.components.length > 0 && (
          <section className="mb-5 print:mb-4">
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-300 pro-break-after-avoid">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">2</span>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Nivel 2 · Fichas de Elaboración y Producción ({recipe.components.length} Sub-elaboraciones)
                </h2>
              </div>
              <span className="text-[8.5px] font-mono text-slate-500 font-medium">
                *Formulación estandarizada con % sobre ingrediente base (Fórmula Panadera)
              </span>
            </div>

            <div className="space-y-2.5 print:space-y-2">
              {recipe.components.map((comp, idx) => {
                const hasMiseEnPlace = comp.miseEnPlace && (comp.miseEnPlace.dayBefore || comp.miseEnPlace.morning || comp.miseEnPlace.service);
                const hasAllergens = comp.allergens && comp.allergens.length > 0;
                const hasGrossOrWaste = comp.ingredients?.some(i => i.grossGrams !== undefined || i.wastePercentage !== undefined);

                return (
                  <article 
                    key={comp.id || idx} 
                    className="pro-avoid-break p-2.5 print:p-2 bg-slate-50/70 print:bg-white rounded-xl border border-slate-200 print:border-slate-300"
                  >
                    {/* Cabecera de la sub-elaboración */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 mb-1.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[8.5px] font-black rounded">
                          {comp.code || `FT-ELA-00${idx + 1}`}
                        </span>
                        <h3 className="font-bold text-slate-950 text-xs">
                          {comp.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[8.5px]">
                          {comp.family}
                        </span>
                        <span className="text-slate-600 font-mono text-[9.5px]">
                          Rendimiento: <strong className="text-slate-900">{comp.targetYieldGrams}g</strong>
                          {comp.wastePercentage !== undefined && ` (Merma ${comp.wastePercentage}%)`}
                          {comp.grossWeightGrams !== undefined && ` · Bruto ${comp.grossWeightGrams}g`}
                        </span>
                      </div>
                    </div>

                    {/* Función y equipamiento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 text-xs print:text-[9px] mb-1.5 text-slate-700">
                      <div>
                        <span className="font-mono text-[8px] font-bold text-slate-400 uppercase block">Función en el plato</span>
                        <span>{comp.roleInDish || '—'}</span>
                      </div>
                      <div>
                        <span className="font-mono text-[8px] font-bold text-slate-400 uppercase block">Equipamiento técnico</span>
                        <span>{comp.equipmentNeeded?.join(', ') || 'Utillaje de cocina profesional'}</span>
                      </div>
                    </div>

                    {/* Alérgenos específicos de esta sub-elaboración (Apartado 5) */}
                    {hasAllergens && (
                      <div className="mb-1.5 p-1 bg-amber-50/60 rounded border border-amber-200/80 flex items-center gap-2">
                        <span className="text-[8px] font-mono uppercase font-black text-amber-900 shrink-0">
                          Alérgenos Específicos:
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {comp.allergens!.map(al => (
                            <span 
                              key={al} 
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-white text-slate-800 border border-amber-300 rounded text-[8px] font-bold font-mono"
                            >
                              <AllergenIcon allergen={al} size={11} />
                              <span>{al}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mise en Place Temporalizada (Apartado 2.1 del Manual 2.0) */}
                    {hasMiseEnPlace && (
                      <div className="mb-1.5 p-1.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[8.5px] grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-1.5">
                        {comp.miseEnPlace?.dayBefore && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="font-mono font-black text-indigo-900 block text-[7.5px] uppercase flex items-center gap-1">
                              <Calendar size={10} className="text-indigo-600" /> Día antes (Preelab./Fondo)
                            </span>
                            <span className="text-slate-700 block leading-tight mt-0.5">{comp.miseEnPlace.dayBefore}</span>
                          </div>
                        )}
                        {comp.miseEnPlace?.morning && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="font-mono font-black text-indigo-900 block text-[7.5px] uppercase flex items-center gap-1">
                              <Sun size={10} className="text-indigo-600" /> Mañana (Cocción/Base)
                            </span>
                            <span className="text-slate-700 block leading-tight mt-0.5">{comp.miseEnPlace.morning}</span>
                          </div>
                        )}
                        {comp.miseEnPlace?.service && (
                          <div className="bg-white p-1 rounded border border-indigo-100">
                            <span className="font-mono font-black text-indigo-900 block text-[7.5px] uppercase flex items-center gap-1">
                              <BellRing size={10} className="text-indigo-600" /> Servicio (Pase/Acabado)
                            </span>
                            <span className="text-slate-700 block leading-tight mt-0.5">{comp.miseEnPlace.service}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tabla de formulación técnica (% sobre base y mermas) */}
                    <div className="overflow-x-auto mb-1.5">
                      <table className="w-full text-left text-xs print:text-[9px] border border-slate-200 bg-white rounded overflow-hidden">
                        <thead className="bg-slate-100 text-[8px] font-mono uppercase text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-0.5 px-1.5">Ingrediente</th>
                            {hasGrossOrWaste && <th className="py-0.5 px-1.5 text-right">P. Bruto (g)</th>}
                            {hasGrossOrWaste && <th className="py-0.5 px-1.5 text-right">Merma %</th>}
                            <th className="py-0.5 px-1.5 text-right">P. Neto (g)</th>
                            <th className="py-0.5 px-1.5 text-right">% s/Base</th>
                            <th className="py-0.5 px-1.5">Observaciones / Calibre / Origen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {comp.ingredients?.map((ing, ingIdx) => (
                            <tr key={ing.id || ingIdx} className={ing.isBase ? 'bg-amber-50/40 font-bold' : ''}>
                              <td className="py-0.5 px-1.5 text-slate-900">
                                {ing.name} {ing.isBase && <span className="text-[7.5px] text-amber-700 font-mono">(BASE)</span>}
                              </td>
                              {hasGrossOrWaste && (
                                <td className="py-0.5 px-1.5 text-right font-mono text-slate-500 text-[8.5px]">
                                  {ing.grossGrams ? `${ing.grossGrams} g` : '—'}
                                </td>
                              )}
                              {hasGrossOrWaste && (
                                <td className="py-0.5 px-1.5 text-right font-mono text-rose-700 text-[8.5px]">
                                  {ing.wastePercentage !== undefined ? `${ing.wastePercentage}%` : '—'}
                                </td>
                              )}
                              <td className="py-0.5 px-1.5 text-right font-mono font-medium text-slate-800">
                                {ing.netGrams} g
                              </td>
                              <td className="py-0.5 px-1.5 text-right font-mono text-slate-600">
                                {ing.bakersPercentage ? `${ing.bakersPercentage}%` : '—'}
                              </td>
                              <td className="py-0.5 px-1.5 text-slate-600 text-[8.5px]">
                                {ing.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Parámetros de proceso secuenciados */}
                    {comp.processSteps?.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-200 text-xs print:text-[9px]">
                        <span className="font-mono text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Parámetros de Proceso y Puntos Críticos de Control
                        </span>
                        <div className="space-y-1">
                          {comp.processSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200/80">
                              <span className="w-3.5 h-3.5 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-mono text-[7.5px] font-bold shrink-0">
                                {step.stepNumber || sIdx + 1}
                              </span>
                              <div className="flex-1 text-[9.5px] print:text-[8.5px]">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <span className="font-bold text-slate-900">{step.operation}</span>
                                  <div className="flex items-center gap-2 font-mono text-[8.5px] text-slate-500">
                                    {step.timeMinutes && <span>⏱ {step.timeMinutes} min</span>}
                                    {step.tempCelsius && <span className="text-amber-800 font-bold">🌡 {step.tempCelsius}</span>}
                                    {step.equipment && <span>⚙ {step.equipment}</span>}
                                  </div>
                                </div>
                                {step.criticalPoint && (
                                  <p className="text-emerald-800 text-[8.5px] mt-0.5">
                                    <strong>Punto final observable:</strong> {step.criticalPoint}
                                  </p>
                                )}
                                {step.rejectionCriteria && (
                                  <p className="text-rose-700 text-[8.5px]">
                                    <strong>Criterio de rechazo:</strong> {step.rejectionCriteria}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conservación y regeneración */}
                    {comp.storage && (
                      <div className="mt-1 pt-1 border-t border-slate-200 flex flex-wrap gap-2.5 text-[8.5px] text-slate-600 font-mono">
                        <span><strong>Temp Conservación:</strong> {comp.storage.temperature || '—'}</span>
                        <span><strong>Envase:</strong> {comp.storage.container || '—'}</span>
                        <span><strong>Vida Útil:</strong> {comp.storage.shelfLife || '—'}</span>
                        {comp.storage.regeneration && (
                          <span className="text-slate-800"><strong>Regeneración:</strong> {comp.storage.regeneration}</span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Salto de página para el bloque de Servicio, Rúbrica de Evaluación y APPCC */}
        <div className="pro-page-break print:block hidden" />

        {/* ========================================================================= */}
        {/* SECCIÓN 3: MONTAJE, CONTROL DE CALIDAD, RÚBRICA Y APPCC (RD 3484/2000)   */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 print:space-y-3">
          
          {/* NIVEL 3 · MONTAJE, GRAMAJES POR PAX Y PASE */}
          <section className="pro-avoid-break">
            <div className="flex items-center gap-2 pb-1 mb-1.5 border-b border-slate-300">
              <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">3</span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Nivel 3 · Protocolo de Montaje y Pase en Servicio
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-2.5 text-xs print:text-[9px]">
              {/* Tabla de gramajes por ración */}
              <div className="md:col-span-6 print:col-span-6 space-y-1">
                <h3 className="font-mono text-[8px] font-bold uppercase text-slate-500 tracking-wider">
                  Gramajes y Herramientas por Ración (Pax)
                </h3>
                <table className="w-full text-left border border-slate-200 bg-white rounded overflow-hidden">
                  <thead className="bg-slate-100 text-[8px] font-mono uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-0.5 px-1.5">Componente</th>
                      <th className="py-0.5 px-1.5 text-right">Peso/Pax</th>
                      <th className="py-0.5 px-1.5">Herramienta</th>
                      <th className="py-0.5 px-1.5">Temp. Pase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipe.plating.componentsGrammage?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5 px-1.5 font-medium text-slate-900">{item.componentName}</td>
                        <td className="py-0.5 px-1.5 text-right font-mono font-bold text-amber-900">{item.gramsPerPax} g</td>
                        <td className="py-0.5 px-1.5 text-slate-600 text-[8.5px]">{item.tool}</td>
                        <td className="py-0.5 px-1.5 font-mono text-[8.5px] text-slate-700">{item.targetTemp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-2 print:grid-cols-2 gap-1.5 pt-0.5">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">Vajilla de Pase</span>
                    <span className="font-medium text-slate-900 text-[9px]">{recipe.plating.tableware || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">Ventana Máx. Pase</span>
                    <span className="font-mono font-bold text-rose-800 text-[9.5px]">
                      ⏱ {recipe.plating.maxPassWindowSeconds || 90} Segundos
                    </span>
                  </div>
                </div>
              </div>

              {/* Secuencia numerada de montaje */}
              <div className="md:col-span-6 print:col-span-6 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <h3 className="font-mono text-[8px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                  Secuencia Cronometrada de Montaje
                </h3>
                <ol className="space-y-0.5 text-[9.5px] print:text-[8.5px] text-slate-800">
                  {recipe.plating.mountingSequence?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-1 bg-white p-0.5 px-1 rounded border border-slate-200/70">
                      <span className="font-mono font-bold text-amber-700 text-[8.5px] shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {recipe.plating.serviceNotes && (
                  <div className="mt-1 pt-0.5 border-t border-slate-200 text-[8.5px]">
                    <span className="font-mono text-[7.5px] uppercase font-bold text-slate-400 block mb-0.5">Directrices de Sala</span>
                    <p className="text-slate-600 italic">{recipe.plating.serviceNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso Técnico RD 3484/2000 (Apartado 3 del Manual 2.0) */}
            <div className="mt-1.5 p-1.5 bg-rose-50/70 rounded-lg border border-rose-200 text-[8px] flex items-center justify-between text-rose-950 font-mono">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-rose-700 shrink-0" />
                AVISO NORMATIVO RD 3484/2000 (PASE SEGURO):
              </span>
              <span>Platos calientes ≥ 65 °C continuo · Platos fríos ≤ 4 °C · Ventana de pase máx: {recipe.plating.maxPassWindowSeconds || 90}s</span>
            </div>
          </section>

          {/* NIVEL 4 · CONTROL DE CALIDAD, PARÁMETROS FISICOQUÍMICOS Y RÚBRICA */}
          <section className="pro-avoid-break">
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">4</span>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Nivel 4 · Criterios de Calidad, Tolerancias y Rúbrica Oficial
                </h2>
              </div>
              <span className="text-[8px] font-mono text-slate-500">Módulo Productos Culinarios · Grado Medio</span>
            </div>

            {/* Parámetros físico-químicos medibles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-1 mb-1.5 text-xs print:text-[8.5px]">
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">pH Objetivo</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.targetPH || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">°Brix</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.targetBrix || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">Viscosidad / Densidad</span>
                <span className="font-medium text-slate-900 text-[9px] truncate block">{recipe.qualityControl.physicochemical?.viscosityDensity || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="font-mono text-[7.5px] uppercase font-bold text-slate-500 block">Temp. Corazón</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.coreTemperature || '—'}</span>
              </div>
            </div>

            {/* Criterios de aceptación vs criterios de rechazo */}
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-1.5 text-xs print:text-[8.5px] mb-2">
              <div className="p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
                <h3 className="font-mono text-[8px] font-bold uppercase text-emerald-900 tracking-wider mb-0.5 flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-emerald-700" /> Criterios de Aceptación y Tolerancias
                </h3>
                <ul className="space-y-0.5 text-slate-800 text-[8.5px]">
                  {recipe.qualityControl.acceptanceCriteria?.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-1.5 bg-rose-50/60 rounded-lg border border-rose-200">
                <h3 className="font-mono text-[8px] font-bold uppercase text-rose-900 tracking-wider mb-0.5 flex items-center gap-1">
                  <XCircle size={10} className="text-rose-700" /> Criterios de Rechazo Inmediato
                </h3>
                <ul className="space-y-0.5 text-slate-800 text-[8.5px]">
                  {recipe.qualityControl.rejectionCriteria?.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-rose-700 font-bold shrink-0">✗</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rúbrica Oficial de Evaluación (Apartado 6 del Manual 2.0 - 6 Criterios con pesos 25/25/15/10/15/10) */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs print:text-[8.5px] mb-2">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <FileCheck size={12} className="text-amber-700" />
                  <span className="font-mono font-black text-slate-900 uppercase text-[8.5px]">
                    Rúbrica de Evaluación Práctica en Taller (6 Criterios Ponderados)
                  </span>
                </div>
                {weightedSum !== null && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] text-slate-500">Puntaje Ponderado: {weightedSum.toFixed(2)}/4</span>
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-300 font-mono font-black text-[9px] rounded">
                      Calificación: {((weightedSum / 4) * 10).toFixed(2)} / 10
                    </span>
                  </div>
                )}
              </div>

              <table className="w-full text-left border border-slate-200 bg-white rounded overflow-hidden text-[8px] font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-1.5">Criterio</th>
                    <th className="py-1 px-1 text-center w-12">Peso</th>
                    <th className="py-1 px-1 text-center">0-1 (Fuera)</th>
                    <th className="py-1 px-1 text-center">2 (Límite)</th>
                    <th className="py-1 px-1 text-center">3 (Correcto)</th>
                    <th className="py-1 px-1 text-center">4 (Exacto)</th>
                    <th className="py-1 px-1.5 text-center w-14">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RUBRIC_CRITERIA.map(crit => {
                    const score = rubric?.scores?.[crit.key];
                    return (
                      <tr key={crit.key} className="hover:bg-slate-50/50">
                        <td className="py-0.5 px-1.5 font-bold text-slate-900 font-sans text-[8.5px]">
                          {crit.label}
                        </td>
                        <td className="py-0.5 px-1 text-center font-bold text-amber-800">
                          {crit.weight}%
                        </td>
                        <td className={`py-0.5 px-1 text-center text-[7.5px] ${score === 0 || score === 1 ? 'bg-rose-100 font-bold text-rose-900' : 'text-slate-500'}`}>
                          {score === 0 || score === 1 ? `✓ (${score})` : '0 - 1'}
                        </td>
                        <td className={`py-0.5 px-1 text-center text-[7.5px] ${score === 2 ? 'bg-amber-100 font-bold text-amber-900' : 'text-slate-500'}`}>
                          {score === 2 ? '✓ (2)' : '2'}
                        </td>
                        <td className={`py-0.5 px-1 text-center text-[7.5px] ${score === 3 ? 'bg-blue-100 font-bold text-blue-900' : 'text-slate-500'}`}>
                          {score === 3 ? '✓ (3)' : '3'}
                        </td>
                        <td className={`py-0.5 px-1 text-center text-[7.5px] ${score === 4 ? 'bg-emerald-100 font-bold text-emerald-900' : 'text-slate-500'}`}>
                          {score === 4 ? '✓ (4)' : '4'}
                        </td>
                        <td className="py-0.5 px-1.5 text-center font-bold text-slate-900">
                          {typeof score === 'number' ? `${score}/4` : '[ ___ ]'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {rubric?.feedback && (
                <div className="mt-1 pt-1 border-t border-slate-200 text-[8px] text-slate-700">
                  <span className="font-bold text-slate-900">Observaciones del Profesor/Evaluador: </span>
                  <span>{rubric.feedback}</span>
                  {rubric.evaluator && <span className="text-slate-500 italic ml-2">({rubric.evaluator})</span>}
                </div>
              )}
            </div>
          </section>

          {/* NIVEL 5 · APPCC (4 ETAPAS), ALÉRGENOS GLOBALES, ESCANDALLO Y FIRMAS */}
          <section className="pro-avoid-break pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between pb-1 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[9px] font-bold">5</span>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Nivel 5 · Cuadro de PCCs (APPCC), Trazabilidad y Costes
                </h2>
              </div>
              <span className="text-[8px] font-mono text-slate-500">Reglamento CE 852/2004 · RD 3484/2000</span>
            </div>

            {/* Cuadro Oficial de Puntos Críticos de Control (Apartado 7 del Manual 2.0) */}
            <div className="mb-2">
              <span className="font-mono text-[8px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">
                Plan de Control de Puntos Críticos (APPCC)
              </span>
              <table className="w-full text-left border border-slate-200 bg-white rounded overflow-hidden text-[7.5px] font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-0.5 px-1.5 w-28">Etapa</th>
                    <th className="py-0.5 px-1">Peligro</th>
                    <th className="py-0.5 px-1">Límite Crítico</th>
                    <th className="py-0.5 px-1">Vigilancia</th>
                    <th className="py-0.5 px-1">Acción Correctora</th>
                    <th className="py-0.5 px-1.5 w-20">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePccList.map((pcc, idx) => (
                    <tr key={pcc.id || idx}>
                      <td className="py-0.5 px-1.5 font-bold text-slate-900 font-sans">{pcc.stage}</td>
                      <td className="py-0.5 px-1 text-slate-600">{pcc.hazard}</td>
                      <td className="py-0.5 px-1 font-bold text-rose-800">{pcc.criticalLimit}</td>
                      <td className="py-0.5 px-1 text-slate-600">{pcc.monitoring}</td>
                      <td className="py-0.5 px-1 text-slate-700">{pcc.correctiveAction}</td>
                      <td className="py-0.5 px-1.5 text-slate-500 text-[7px]">{pcc.record}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Global de los 14 Alérgenos UE (Apartado 5 del Manual 2.0) */}
            <div className="mb-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[8px] font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} className="text-amber-700" />
                  Alérgenos Globales del Plato (Reglamento UE 1169/2011)
                </span>
                <span className="text-[7.5px] font-mono text-slate-500">
                  {allDishAllergens.length > 0 ? `${allDishAllergens.length} alérgeno(s) presente(s)` : 'Libre de los 14 alérgenos de declaración obligatoria'}
                </span>
              </div>
              {allDishAllergens.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allDishAllergens.map(al => (
                    <div 
                      key={al}
                      className="flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 rounded text-[8px] font-bold font-mono text-slate-800"
                    >
                      <AllergenIcon allergen={al} size={12} />
                      <span>{al}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[8px] text-emerald-700 font-bold">
                  ✓ No contiene ingredientes con ninguno de los 14 alérgenos de declaración obligatoria.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-2.5 text-xs print:text-[9px]">
              {/* Historial de versiones y directrices de conservación */}
              <div className="md:col-span-7 print:col-span-7 space-y-1">
                <h3 className="font-mono text-[8px] font-bold uppercase text-slate-500 tracking-wider">
                  Control de Versiones y Directrices
                </h3>
                <div className="space-y-0.5">
                  {recipe.traceability.versionHistory?.map((ver, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-1 rounded border border-slate-200 text-[8.5px] print:text-[8px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1 py-0.2 rounded text-[7.5px]">
                          v{ver.version}
                        </span>
                        <span className="text-slate-700">{ver.changeSummary}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[7.5px] shrink-0">{ver.date} · {ver.author}</span>
                    </div>
                  ))}
                </div>

                {/* Parámetros de conservación validados */}
                {(recipe.traceability.approvedShelfLife || recipe.traceability.validatedStorage) && (
                  <div className="bg-slate-50 p-1 rounded border border-slate-200 flex flex-wrap gap-2.5 font-mono text-[8px] text-slate-600">
                    {recipe.traceability.approvedShelfLife && (
                      <span><strong>Vida Útil Validada:</strong> {recipe.traceability.approvedShelfLife}</span>
                    )}
                    {recipe.traceability.validatedStorage && (
                      <span><strong>Almacenamiento:</strong> {recipe.traceability.validatedStorage}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Escandallo y Food Cost */}
              <div className="md:col-span-5 print:col-span-5 bg-slate-900 text-white p-2 rounded-xl space-y-1">
                <h3 className="font-mono text-[8px] font-bold uppercase text-amber-400 tracking-wider">
                  Métricas de Coste Objetivo
                </h3>
                <div className="space-y-0.5 text-[9px] print:text-[8.5px] font-mono">
                  <div className="flex justify-between py-0.5 border-b border-slate-800">
                    <span className="text-slate-400">Coste MP/Pax:</span>
                    <span className="font-bold text-slate-100">
                      {typeof recipe.traceability.costPerPax === 'number' ? recipe.traceability.costPerPax.toFixed(2) : '—'} €
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800">
                    <span className="text-slate-400">PVP Objetivo Carta:</span>
                    <span className="font-bold text-amber-300">
                      {typeof recipe.traceability.salePriceObjective === 'number' ? recipe.traceability.salePriceObjective.toFixed(2) : '—'} €
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Food Cost Ratio:</span>
                    <span className="font-bold text-emerald-400">{recipe.traceability.targetFoodCostPercentage || '—'}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuadro de Validación Técnica y Homologación de Ficha */}
            <div className="mt-2 pt-1.5 border-t border-slate-200 grid grid-cols-3 print:grid-cols-3 gap-1.5 text-[8.5px] font-mono">
              <div className="p-1 bg-slate-50 rounded border border-slate-200">
                <span className="text-[7.5px] text-slate-400 block uppercase">Chef Autor / Responsable</span>
                <span className="font-bold text-slate-800 block truncate">{recipe.responsible || 'Juan Codina Barranco'}</span>
              </div>
              <div className="p-1 bg-slate-50 rounded border border-slate-200">
                <span className="text-[7.5px] text-slate-400 block uppercase">Comité I+D / Revisión</span>
                <span className="font-bold text-slate-800 block">Homologado v{recipe.version}</span>
              </div>
              <div className="p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase">Vº Bº Jefatura Cocina</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check size={11} className="stroke-[3]" /> Apto para Pase
                  </span>
                </div>
              </div>
            </div>

            {/* Pie de Ficha Técnica */}
            <footer className="mt-2.5 pt-1.5 border-t-2 border-slate-900 flex items-center justify-between text-[8px] font-mono text-slate-500">
              <div>
                <span>DOCUMENTO OPERATIVO DE ALTA GASTRONOMÍA · {settings.instituteName || 'IES La Flota'}</span>
              </div>
              <div>
                <span>CONFIDENCIAL · PROHIBIDA SU REPRODUCCIÓN NO AUTORIZADA</span>
              </div>
            </footer>
          </section>

        </div>

      </main>
    </div>
  );
};
