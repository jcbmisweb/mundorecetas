import React, { useEffect, useRef } from 'react';
import { ProRecipe, AppSettings } from '../types';
import { ProSensoryRadarChart } from './ProSensoryRadarChart';
import { 
  Printer, ArrowLeft, Award, Layers, Thermometer, Clock, Scale, 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, History, DollarSign,
  Compass, ChefHat, Sparkles, Image as ImageIcon, Check
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
            margin: 8mm 8mm 8mm 8mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
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
        className="max-w-[210mm] mx-auto my-6 print:my-0 bg-white shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 text-slate-900 font-sans border border-slate-200 print:border-none"
      >
        
        {/* ========================================================================= */}
        {/* PÁGINA 1: IDENTIDAD, CONCEPTO, PERFIL SENSORIAL Y REGISTRO VISUAL         */}
        {/* ========================================================================= */}
        <section className="mb-6 print:mb-0">
          
          {/* CABECERA MAESTRA: IDENTIFICACIÓN Y CONTROL OPERATIVO */}
          <header className="border-b-2 border-slate-900 pb-3 mb-3 print:pb-2.5 print:mb-2.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-slate-500 font-bold mb-1">
                  <span>ALTA GASTRONOMÍA · DOCUMENTO OPERATIVO CONTROLADO</span>
                  <span>·</span>
                  <span className="text-amber-700 font-black">I+D Y PRODUCCIÓN</span>
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
                    className="h-11 print:h-9 w-auto max-w-[85px] object-contain"
                  />
                ) : (
                  <div className="text-right">
                    <div className="text-[9px] font-mono font-bold text-slate-400">CENTRO EDUCATIVO</div>
                    <div className="text-xs font-black text-slate-800">{settings.instituteName || 'IES La Flota'}</div>
                  </div>
                )}
                {settings.teacherLogo && (
                  <img 
                    src={settings.teacherLogo} 
                    alt="Profesor Logo" 
                    className="h-11 print:h-9 w-auto max-w-[85px] object-contain border-l border-slate-200 pl-2.5"
                  />
                )}
              </div>
            </div>

            {/* Faja de metadatos de control técnico */}
            <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200 text-xs print:text-[10px]">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-500 font-bold">Código</span>
                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">{recipe.code}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-500 font-bold">Versión</span>
                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">v{recipe.version}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-500 font-bold">Estado</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-black border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                  {currentStatus.label}
                </span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-500 font-bold">Rendimiento</span>
                <span className="font-bold text-slate-900">{recipe.targetPax} Raciones (Pax)</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200 col-span-2 sm:col-span-1 print:col-span-1">
                <span className="block text-[8.5px] font-mono uppercase tracking-wider text-slate-500 font-bold">Responsable</span>
                <span className="font-medium text-slate-800 text-[10.5px] truncate block">{recipe.responsible || 'Chef Creativo'}</span>
              </div>
            </div>
          </header>

          {/* NIVEL 1 · IDENTIDAD DEL PLATO, CONCEPTO Y PERFIL SENSORIAL */}
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">1</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                Nivel 1 · Identidad del Plato, Concepto y Perfil Sensorial
              </h2>
            </div>

            {/* Fila 1: Concepto y Storytelling (Izquierda) + Radar Sensorial Objetivo (Derecha) */}
            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3.5 items-stretch">
              
              {/* Columna Izquierda: Concepto, Producto, Storytelling y Notas Sensoriales */}
              <div className="md:col-span-7 print:col-span-7 space-y-2 text-xs print:text-[10px] text-slate-800 leading-snug">
                <div className="bg-amber-50/50 p-2 rounded border border-amber-200/60">
                  <h3 className="text-[9px] font-mono uppercase font-bold text-amber-900 tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-amber-700" /> Concepto e Intención Gastronómica
                  </h3>
                  <p className="text-slate-800 italic">{recipe.concept || 'Sin definir concepto'}</p>
                </div>

                <div>
                  <h3 className="text-[9px] font-mono uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Producto Estrella, Origen y Temporada
                  </h3>
                  <p className="font-medium text-slate-900">{recipe.starProduct || 'No especificado'}</p>
                </div>

                <div>
                  <h3 className="text-[9px] font-mono uppercase font-bold text-slate-500 tracking-wider mb-0.5">
                    Propuesta de Valor / Storytelling para Sala
                  </h3>
                  <p className="text-slate-700">{recipe.storytelling || 'No definido'}</p>
                </div>

                {/* Desglose sensorial descriptivo */}
                <div className="grid grid-cols-2 print:grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 text-[9.5px]">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8.5px] font-mono uppercase">Vista / Color</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.visual || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8.5px] font-mono uppercase">Aroma</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.aroma || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8.5px] font-mono uppercase">Textura en Boca</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.texture || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200/60">
                    <span className="font-bold text-slate-900 block text-[8.5px] font-mono uppercase">Retrogusto</span>
                    <span className="text-slate-600 line-clamp-2">{recipe.sensoryProfile.aftertaste || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Radar Sensorial Organoléptico (Centrado y autónomo) */}
              <div className="md:col-span-5 print:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1 text-center">
                  Perfil Organoléptico Objetivo
                </span>
                
                <div className="py-0.5 flex items-center justify-center">
                  <ProSensoryRadarChart 
                    radar={recipe.sensoryProfile.radar} 
                    size={175} 
                    interactive={false} 
                  />
                </div>
                
                <span className="text-[8.5px] text-slate-400 font-mono text-center block mt-1">
                  Escala de intensidades relativas (1 a 5)
                </span>
              </div>
            </div>

            {/* Fila 2: Registro Visual del Emplatado Objetivo (Fotografía y/o Croquis) */}
            {(recipe.heroPhoto || recipe.sketchPhoto) && (
              <div className="mt-3 pt-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-700 font-bold flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-amber-700" /> Registro Visual del Emplatado Objetivo
                  </span>
                  {recipe.plating.tableware && (
                    <span className="text-[9px] font-mono text-slate-500">
                      Soporte: <strong className="text-slate-800">{recipe.plating.tableware}</strong>
                    </span>
                  )}
                </div>

                {recipe.heroPhoto && recipe.sketchPhoto ? (
                  <div className="grid grid-cols-2 print:grid-cols-2 gap-2.5">
                    <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                      <img
                        src={recipe.heroPhoto}
                        alt="Fotografía de pase"
                        className="w-full max-h-48 print:max-h-44 h-40 object-contain rounded-lg"
                      />
                      <span className="text-[8px] text-center text-slate-500 mt-1 font-mono uppercase">
                        Fotografía Real de Pase
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                      <img
                        src={recipe.sketchPhoto}
                        alt="Croquis técnico"
                        className="w-full max-h-48 print:max-h-44 h-40 object-contain rounded-lg"
                      />
                      <span className="text-[8px] text-center text-slate-500 mt-1 font-mono uppercase">
                        Croquis Técnico / Esquema
                      </span>
                    </div>
                  </div>
                ) : recipe.heroPhoto ? (
                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                    <img
                      src={recipe.heroPhoto}
                      alt={recipe.name}
                      className="w-full max-h-52 print:max-h-48 h-44 object-contain rounded-lg"
                    />
                    <span className="text-[8.5px] text-center text-slate-500 mt-1 font-mono uppercase">
                      Fotografía de Emplatado Objetivo y Composición
                    </span>
                  </div>
                ) : recipe.sketchPhoto ? (
                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                    <img
                      src={recipe.sketchPhoto}
                      alt={recipe.name}
                      className="w-full max-h-52 print:max-h-48 h-44 object-contain rounded-lg"
                    />
                    <span className="text-[8.5px] text-center text-slate-500 mt-1 font-mono uppercase">
                      Croquis / Esquema Técnico de Montaje
                    </span>
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </section>

        {/* Salto de página controlado: La carátula (Header + Nivel 1) queda 100% en Página 1 */}
        <div className="pro-page-break print:block hidden" />

        {/* ========================================================================= */}
        {/* PÁGINA 2: NIVEL 2 · FICHAS DE ELABORACIÓN (SUB-COMPONENTES TÉCNICOS)      */}
        {/* ========================================================================= */}
        {recipe.components && recipe.components.length > 0 && (
          <section className="mb-6 print:mb-0">
            <div className="flex items-center justify-between pb-1 mb-2.5 border-b border-slate-300 pro-break-after-avoid">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  Nivel 2 · Fichas de Elaboración y Producción ({recipe.components.length} Sub-elaboraciones)
                </h2>
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-medium">
                *Formulación con % sobre ingrediente base
              </span>
            </div>

            <div className="space-y-3 print:space-y-2.5">
              {recipe.components.map((comp, idx) => (
                <article 
                  key={comp.id || idx} 
                  className="pro-avoid-break p-3 print:p-2.5 bg-slate-50/80 print:bg-white rounded-xl border border-slate-200 print:border-slate-300"
                >
                  {/* Cabecera de la sub-elaboración */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 mb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[9px] font-black rounded">
                        {comp.code || `FT-ELA-00${idx + 1}`}
                      </span>
                      <h3 className="font-bold text-slate-950 text-xs sm:text-sm">
                        {comp.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                        {comp.family}
                      </span>
                      <span className="text-slate-600 font-mono text-[10px]">
                        Rendimiento: <strong className="text-slate-900">{comp.targetYieldGrams}g</strong>
                        {comp.wastePercentage !== undefined && ` (Merma ${comp.wastePercentage}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Función y equipamiento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 text-xs print:text-[9.5px] mb-1.5 text-slate-700">
                    <div>
                      <span className="font-mono text-[8.5px] font-bold text-slate-400 uppercase block">Función en el plato</span>
                      <span>{comp.roleInDish || '—'}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[8.5px] font-bold text-slate-400 uppercase block">Equipamiento técnico</span>
                      <span>{comp.equipmentNeeded?.join(', ') || 'Utillaje de cocina profesional'}</span>
                    </div>
                  </div>

                  {/* Tabla de formulación técnica (% sobre base) */}
                  <div className="overflow-x-auto mb-1.5">
                    <table className="w-full text-left text-xs print:text-[9.5px] border border-slate-200 bg-white rounded overflow-hidden">
                      <thead className="bg-slate-100 text-[9px] font-mono uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-1 px-2">Ingrediente</th>
                          <th className="py-1 px-2 text-right">Cant. Neta (g)</th>
                          <th className="py-1 px-2 text-right">% sobre Base</th>
                          <th className="py-1 px-2">Observaciones / Origen / Calibre</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comp.ingredients?.map((ing, ingIdx) => (
                          <tr key={ing.id || ingIdx} className={ing.isBase ? 'bg-amber-50/40 font-bold' : ''}>
                            <td className="py-0.5 px-2 text-slate-900">
                              {ing.name} {ing.isBase && <span className="text-[8px] text-amber-700 font-mono">(BASE)</span>}
                            </td>
                            <td className="py-0.5 px-2 text-right font-mono font-medium text-slate-800">
                              {ing.netGrams} g
                            </td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-600">
                              {ing.bakersPercentage ? `${ing.bakersPercentage}%` : '—'}
                            </td>
                            <td className="py-0.5 px-2 text-slate-600 text-[9.5px]">
                              {ing.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Parámetros de proceso secuenciados */}
                  {comp.processSteps?.length > 0 && (
                    <div className="mt-1.5 pt-1 border-t border-slate-200 text-xs print:text-[9.5px]">
                      <span className="font-mono text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Parámetros de Proceso y Puntos Críticos de Control
                      </span>
                      <div className="space-y-1">
                        {comp.processSteps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200/80">
                            <span className="w-3.5 h-3.5 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-mono text-[8px] font-bold shrink-0">
                              {step.stepNumber || sIdx + 1}
                            </span>
                            <div className="flex-1 text-[10px] print:text-[9px]">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className="font-bold text-slate-900">{step.operation}</span>
                                <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                                  {step.timeMinutes && <span>⏱ {step.timeMinutes} min</span>}
                                  {step.tempCelsius && <span className="text-amber-800 font-bold">🌡 {step.tempCelsius}</span>}
                                  {step.equipment && <span>⚙ {step.equipment}</span>}
                                </div>
                              </div>
                              {step.criticalPoint && (
                                <p className="text-emerald-800 text-[9px] mt-0.5">
                                  <strong>Punto final observable:</strong> {step.criticalPoint}
                                </p>
                              )}
                              {step.rejectionCriteria && (
                                <p className="text-rose-700 text-[9px]">
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
                    <div className="mt-1.5 pt-1 border-t border-slate-200 flex flex-wrap gap-3 text-[9px] text-slate-600 font-mono">
                      <span><strong>Temp Conservación:</strong> {comp.storage.temperature || '—'}</span>
                      <span><strong>Envase:</strong> {comp.storage.container || '—'}</span>
                      <span><strong>Vida Útil:</strong> {comp.storage.shelfLife || '—'}</span>
                      {comp.storage.regeneration && (
                        <span className="text-slate-800"><strong>Regeneración:</strong> {comp.storage.regeneration}</span>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Salto de página controlado: Nivel 3, 4 y 5 se ubican de forma balanceada en la página 3 */}
        {recipe.components && recipe.components.length > 0 && (
          <div className="pro-page-break print:block hidden" />
        )}

        {/* ========================================================================= */}
        {/* PÁGINA 3: SERVICIO, CONTROL DE CALIDAD, TRAZABILIDAD Y COSTES             */}
        {/* ========================================================================= */}
        <div className="space-y-4 print:space-y-3">
          
          {/* NIVEL 3 · MONTAJE, GRAMAJES POR PAX Y PASE */}
          <section className="pro-avoid-break">
            <div className="flex items-center gap-2 pb-1 mb-2 border-b border-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">3</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                Nivel 3 · Protocolo de Montaje y Pase en Servicio
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 text-xs print:text-[9.5px]">
              {/* Tabla de gramajes por ración */}
              <div className="md:col-span-6 print:col-span-6 space-y-1.5">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-slate-500 tracking-wider">
                  Gramajes y Herramientas por Ración (Pax)
                </h3>
                <table className="w-full text-left border border-slate-200 bg-white rounded overflow-hidden">
                  <thead className="bg-slate-100 text-[8.5px] font-mono uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-2">Componente</th>
                      <th className="py-1 px-2 text-right">Peso/Pax</th>
                      <th className="py-1 px-2">Herramienta</th>
                      <th className="py-1 px-2">Temp. Pase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipe.plating.componentsGrammage?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5 px-2 font-medium text-slate-900">{item.componentName}</td>
                        <td className="py-0.5 px-2 text-right font-mono font-bold text-amber-900">{item.gramsPerPax} g</td>
                        <td className="py-0.5 px-2 text-slate-600 text-[9px]">{item.tool}</td>
                        <td className="py-0.5 px-2 font-mono text-[9px] text-slate-700">{item.targetTemp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-2 print:grid-cols-2 gap-1.5 pt-0.5">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">Vajilla de Pase</span>
                    <span className="font-medium text-slate-900 text-[9.5px]">{recipe.plating.tableware || '—'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">Ventana Máx. Pase</span>
                    <span className="font-mono font-bold text-rose-800 text-[10px]">
                      ⏱ {recipe.plating.maxPassWindowSeconds || 90} Segundos
                    </span>
                  </div>
                </div>
              </div>

              {/* Secuencia numerada de montaje */}
              <div className="md:col-span-6 print:col-span-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                  Secuencia Cronometrada de Montaje
                </h3>
                <ol className="space-y-1 text-[10px] print:text-[9px] text-slate-800">
                  {recipe.plating.mountingSequence?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200/70">
                      <span className="font-mono font-bold text-amber-700 text-[9.5px] shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {recipe.plating.serviceNotes && (
                  <div className="mt-1.5 pt-1 border-t border-slate-200 text-[9.5px]">
                    <span className="font-mono text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Directrices de Sala</span>
                    <p className="text-slate-600 italic">{recipe.plating.serviceNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* NIVEL 4 · CONTROL DE CALIDAD, PARÁMETROS FISICOQUÍMICOS Y CATA */}
          <section className="pro-avoid-break">
            <div className="flex items-center gap-2 pb-1 mb-2 border-b border-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">4</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                Nivel 4 · Criterios de Aceptación, Tolerancias y Registro de Cata
              </h2>
            </div>

            {/* Parámetros físico-químicos medibles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-1.5 mb-2 text-xs print:text-[9.5px]">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">pH Objetivo</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.targetPH || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">°Brix</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.targetBrix || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">Viscosidad / Densidad</span>
                <span className="font-medium text-slate-900 text-[10px] truncate block">{recipe.qualityControl.physicochemical?.viscosityDensity || '—'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-mono text-[8px] uppercase font-bold text-slate-500 block">Temp. Corazón</span>
                <span className="font-mono font-bold text-slate-900">{recipe.qualityControl.physicochemical?.coreTemperature || '—'}</span>
              </div>
            </div>

            {/* Criterios de aceptación vs criterios de rechazo */}
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2 text-xs print:text-[9.5px] mb-2">
              <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-emerald-900 tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-700" /> Criterios de Aceptación y Tolerancias
                </h3>
                <ul className="space-y-0.5 text-slate-800 text-[10px] print:text-[9px]">
                  {recipe.qualityControl.acceptanceCriteria?.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2 bg-rose-50/60 rounded-xl border border-rose-200">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-rose-900 tracking-wider mb-1 flex items-center gap-1.5">
                  <XCircle size={11} className="text-rose-700" /> Criterios de Rechazo Inmediato
                </h3>
                <ul className="space-y-0.5 text-slate-800 text-[10px] print:text-[9px]">
                  {recipe.qualityControl.rejectionCriteria?.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-rose-700 font-bold shrink-0">✗</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Historial de cata */}
            {recipe.qualityControl.tastingHistory?.length > 0 && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs print:text-[9.5px]">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                  Última Validación de Cata en Comité
                </h3>
                {recipe.qualityControl.tastingHistory.slice(-1).map(taste => (
                  <div key={taste.id} className="space-y-0.5 text-[10px] print:text-[9px]">
                    <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-500 pb-0.5 border-b border-slate-200">
                      <span>Catador: <strong className="text-slate-800">{taste.taster}</strong> ({taste.date})</span>
                      <span className="font-bold text-amber-800 text-[10px]">Puntuación: {taste.score}/10</span>
                    </div>
                    <p className="text-slate-700 pt-0.5"><strong>Sabor & Armonía:</strong> {taste.flavorNotes}</p>
                    {taste.adjustmentsNeeded && (
                      <p className="text-amber-900 bg-amber-50 p-1 rounded border border-amber-200 text-[9px]">
                        <strong>Ajuste acordado:</strong> {taste.adjustmentsNeeded}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* NIVEL 5 · TRAZABILIDAD, CONTROL DE VERSIONES Y ESCANDALLO */}
          <section className="pro-avoid-break pt-1.5 border-t border-slate-200">
            <div className="flex items-center gap-2 pb-1 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">5</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                Nivel 5 · Trazabilidad, Control de Versiones y Costes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 text-xs print:text-[9.5px]">
              {/* Historial de versiones y directrices de conservación */}
              <div className="md:col-span-7 print:col-span-7 space-y-1.5">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-slate-500 tracking-wider">
                  Control de Cambios Autorizados
                </h3>
                <div className="space-y-1">
                  {recipe.traceability.versionHistory?.map((ver, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-200 text-[10px] print:text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1 py-0.2 rounded text-[8.5px]">
                          v{ver.version}
                        </span>
                        <span className="text-slate-700">{ver.changeSummary}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[8.5px] shrink-0">{ver.date} · {ver.author}</span>
                    </div>
                  ))}
                </div>

                {/* Parámetros de conservación validados */}
                {(recipe.traceability.approvedShelfLife || recipe.traceability.validatedStorage) && (
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200 flex flex-wrap gap-3 font-mono text-[8.5px] text-slate-600">
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
              <div className="md:col-span-5 print:col-span-5 bg-slate-900 text-white p-2.5 rounded-xl space-y-1">
                <h3 className="font-mono text-[8.5px] font-bold uppercase text-amber-400 tracking-wider">
                  Métricas de Coste Objetivo
                </h3>
                <div className="space-y-0.5 text-[10px] print:text-[9px] font-mono">
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
            <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-3 print:grid-cols-3 gap-2 text-[9px] font-mono">
              <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-[8px] text-slate-400 block uppercase">Chef Autor / Responsable</span>
                <span className="font-bold text-slate-800 block truncate">{recipe.responsible || 'Juan Codina Barranco'}</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-[8px] text-slate-400 block uppercase">Comité I+D / Revisión</span>
                <span className="font-bold text-slate-800 block">Homologado v{recipe.version}</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-slate-400 block uppercase">Vº Bº Jefatura Cocina</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check size={11} className="stroke-[3]" /> Apto para Pase
                  </span>
                </div>
              </div>
            </div>

            {/* Pie de Ficha Técnica */}
            <footer className="mt-3 pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[8.5px] font-mono text-slate-500">
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
