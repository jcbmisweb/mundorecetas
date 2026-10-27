import React, { useRef } from 'react';
import { 
  ArrowLeft, Printer, BookOpen, Sparkles, CheckCircle2, 
  HelpCircle, Compass, Layers, Scale, Thermometer, Clock, 
  Award, AlertTriangle, FileText, Download, ChevronRight,
  Flame, ShieldCheck, HeartHandshake, Eye
} from 'lucide-react';
import { AppSettings } from '../types';

interface ProWorkshopGuideProps {
  settings: AppSettings;
  onBack: () => void;
}

export const ProWorkshopGuide: React.FC<ProWorkshopGuideProps> = ({
  settings,
  onBack
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-amber-500 selection:text-slate-950 print:bg-white print:text-slate-900 print:pb-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
          }
          .pro-print-wrapper {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          /* Páginas fijas estructuradas para A4 */
          .pro-page-1, .pro-page-2 {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
          .pro-page-3 {
            page-break-after: auto !important;
            break-after: auto !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
          /* Evitar cortes dentro de tarjetas y encabezados huérfanos */
          .pro-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .pro-avoid-break-after {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Quitar gradientes oscuros en modo impresión */
          .pro-clean-header {
            background-color: #ffffff !important;
            background-image: none !important;
            border: 1px solid #e2e8f0 !important;
            border-bottom: 3px solid #d97706 !important;
            padding: 12px 16px !important;
            border-radius: 12px !important;
            box-shadow: none !important;
          }
          .pro-clean-card {
            background-color: #ffffff !important;
            background-image: none !important;
            border: 1px solid #cbd5e1 !important;
            padding: 10px 14px !important;
            border-radius: 10px !important;
            box-shadow: none !important;
          }
          .pro-subtle-box {
            background-color: #f8fafc !important;
            background-image: none !important;
            border: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
          }
          .pro-amber-box {
            background-color: #fefce8 !important;
            background-image: none !important;
            border: 1px solid #fef08a !important;
            color: #713f12 !important;
          }
          .pro-success-box {
            background-color: #f0fdf4 !important;
            background-image: none !important;
            border: 1px solid #bbf7d0 !important;
            color: #14532d !important;
          }
          .pro-danger-box {
            background-color: #fef2f2 !important;
            background-image: none !important;
            border: 1px solid #fecaca !important;
            color: #7f1d1d !important;
          }
          .pro-print-text-dark {
            color: #0f172a !important;
          }
          .pro-print-text-muted {
            color: #475569 !important;
          }
          .pro-badge-amber {
            background-color: #fef3c7 !important;
            color: #92400e !important;
            border: 1px solid #fcd34d !important;
          }
          .pro-badge-dark {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Barra Superior de Control (Oculta en Impresión) */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-sm"
              title="Volver al Taller I+D"
            >
              <ArrowLeft size={14} /> Volver al Taller
            </button>
            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  MANUAL DIDÁCTICO Y OPERATIVO
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Guía Paso a Paso para el Chef y Docente
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
              title="Imprimir o guardar como PDF en tu navegador"
            >
              <Printer size={15} />
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal · Manual de Uso Organizado en 3 Páginas A4 Imprimibles */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pro-print-wrapper print:space-y-0">
        
        {/* ========================================================= */}
        {/* PÁGINA 1: CABECERA EDITORIAL, INTRODUCCIÓN Y 3 PASOS       */}
        {/* ========================================================= */}
        <div className="pro-page-1 space-y-6 print:space-y-4">
          
          {/* Cabecera Editorial (Limpia y nítida en impresión, sin fondos negros) */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-7 sm:p-9 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden pro-clean-header pro-avoid-break">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase pro-badge-amber">
                <Compass size={14} className="shrink-0" /> Taller I+D · Manual del Chef y Profesor
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white leading-tight pro-print-text-dark print:text-[18pt] print:leading-tight">
                Cómo entender y utilizar el Taller de Recetas Profesionales
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pro-print-text-muted print:text-[9.5pt]">
                Una guía sencilla, explicada de cocinero a cocinero, para transformar recetas tradicionales en protocolos técnicos de alta cocina sin complicarse la vida.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pro-print-text-muted print:text-[8.5pt] border-t border-slate-800 print:border-slate-200 print:pt-2">
                <span>🏛️ {settings.instituteName || 'Escuela de Hostelería'}</span>
                <span>•</span>
                <span>👨‍🍳 Chef / Docente: {settings.teacherName || 'Jefe de Cocina'}</span>
                <span>•</span>
                <span>⭐ Nivel: Alta Gastronomía / 3 Estrellas</span>
              </div>
            </div>
          </section>

          {/* 1. ¿POR QUÉ ESTE TALLER ES DIFERENTE? */}
          <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
            <div className="flex items-center gap-3 pro-avoid-break-after">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
                1
              </div>
              <div>
                <h2 className="text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                  ¿Qué es este Taller y por qué es diferente al recetario normal?
                </h2>
                <p className="text-[11px] text-slate-400 font-mono pro-print-text-muted print:text-[8pt]">
                  La diferencia entre «apuntar una receta» y «diseñar un protocolo infalible»
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Recetario Escolar Tradicional */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider pro-print-text-dark">
                  <FileText size={15} /> Recetario Escolar Tradicional
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed pro-print-text-muted print:text-[8.5pt]">
                  <li>Tiene una lista general de ingredientes: <em>«200g carne, 50g cebolla, sal al gusto»</em>.</li>
                  <li>Una explicación corrida: <em>«Sofreír, cocer a fuego medio y servir caliente»</em>.</li>
                  <li><strong className="text-white pro-print-text-dark">El problema:</strong> Si cambia de cocinero o el alumno falta, cada uno lo hace a su manera. Un día la salsa queda líquida y otro día espesa o salada.</li>
                </ul>
              </div>

              {/* Taller I+D Profesional */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 pro-amber-box pro-avoid-break">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider pro-print-text-dark">
                  <Award size={15} className="text-amber-600 print:text-amber-700" /> Taller I+D · Recetario Profesional
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed pro-print-text-muted print:text-[8.5pt]">
                  <li>Despieza el plato en sus partes reales: <em>la carne, la salsa, la crema y el crujiente</em>.</li>
                  <li>Indica <strong className="text-white pro-print-text-dark">temperaturas exactas y tiempos</strong> (ej: 54.5°C por 18 min), no «a fuego suave».</li>
                  <li>Define cómo se emplata (gramos exactos con pinzas), vajilla y temperatura de servicio.</li>
                  <li><strong className="text-white pro-print-text-dark">El resultado:</strong> El plato sale <strong className="text-amber-300 pro-print-text-dark">exactamente perfecto todos los días</strong>, esté quien esté en la partida.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. CÓMO USAR EL TALLER EN 3 PASOS FÁCILES */}
          <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4 pro-clean-card pro-avoid-break">
            <div className="flex items-center gap-3 pro-avoid-break-after">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
                2
              </div>
              <div>
                <h2 className="text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                  Cómo trabajar con el Taller en 3 Pasos Rápidos
                </h2>
                <p className="text-[11px] text-slate-400 font-mono pro-print-text-muted print:text-[8pt]">
                  Para empezar sin agobios: de lo simple a lo profesional
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                    1
                  </div>
                  <h3 className="font-bold text-white text-xs pro-print-text-dark">
                    Importa o Crea una Ficha
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">
                  No tienes que escribir todo desde cero. Pulsa <strong>«Importar Receta a Taller»</strong> y elige cualquier receta existente. El sistema la convertirá automáticamente en formato I+D. O bien pulsa <strong>«Nueva Ficha I+D»</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                    2
                  </div>
                  <h3 className="font-bold text-white text-xs pro-print-text-dark">
                    Rellena solo lo que necesites
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">
                  ¡No te asustes por los campos! Al principio puedes rellenar solo el <strong>Nivel 1 (Nombre y sabor)</strong> y el <strong>Nivel 2 (Ingredientes y pasos)</strong>. Los parámetros técnicos (pH, °Brix) son opcionales y se completan poco a poco.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                    3
                  </div>
                  <h3 className="font-bold text-white text-xs pro-print-text-dark">
                    Saca el Dossier Imprimible
                  </h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">
                  Cuando termines, pulsa el botón <strong>«Ver Dossier / Imprimir»</strong>. El sistema genera una lámina editorial digna de un restaurante de alta cocina, lista para colgar en la pared de la partida o entregar a los alumnos.
                </p>
              </div>
            </div>
          </section>

          {/* Pie de página 1 en impresión */}
          <div className="hidden print:flex items-center justify-between text-[8pt] text-slate-400 border-t border-slate-200 pt-1.5 font-mono">
            <span>Página 1 de 3 · Metodología e Introducción al Taller I+D</span>
            <span>{settings.instituteName || 'Escuela de Hostelería'}</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* PÁGINA 2: LOS 5 NIVELES EXPLICADOS AL DETALLE             */}
        {/* ========================================================= */}
        <div className="pro-page-2 space-y-4 print:space-y-3">
          
          <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card">
            <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-200 pb-2.5 pro-avoid-break-after">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                    Los 5 Niveles Explicados: ¿Qué significa cada pestaña?
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono pro-print-text-muted print:text-[8pt]">
                    Un vistazo rápido para entender qué va en cada sitio sin dudar
                  </p>
                </div>
              </div>
              <span className="hidden print:inline-block text-[8pt] font-mono text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                Estructura Técnica Integral
              </span>
            </div>

            <div className="space-y-3 print:space-y-2.5">
              
              {/* NIVEL 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40 pro-badge-amber">1</span>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-serif pro-print-text-dark">NIVEL 1 · Identidad & Perfil Sensorial (El Alma del Plato)</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el Chef y el Comensal</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8.5pt]">
                  Aquí defines <strong>qué es el plato</strong> y <strong>qué quieres transmitir</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                  <div>
                    <strong className="text-white block pro-print-text-dark print:text-[8.5pt]">• Datos básicos:</strong>
                    <span className="text-slate-400 pro-print-text-muted print:text-[8pt]">Nombre comercial (el que va en la carta), nombre técnico (para la cocina), temporada y vajilla.</span>
                  </div>
                  <div>
                    <strong className="text-white block pro-print-text-dark print:text-[8.5pt]">• El Radar de Sabores (Gráfico de tela de araña):</strong>
                    <span className="text-slate-400 pro-print-text-muted print:text-[8pt]">Puntúa del 1 al 10: Acidez, Dulzor, Salinidad, Umami, Grasa, Crujiente, Amargor y Complejidad para equilibrar el plato a simple vista.</span>
                  </div>
                </div>
              </div>

              {/* NIVEL 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40 pro-badge-amber">2</span>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-serif pro-print-text-dark">NIVEL 2 · Fichas de Elaboración (La Cocina de Producción)</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el Jefe de Partida</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8.5pt]">
                  En alta cocina, un plato no es una lista de 20 ingredientes revueltos. Se divide en sus <strong>sub-elaboraciones</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[8.5pt]">A. Elemento Principal</span>
                    <span className="text-slate-400 text-[10px] pro-print-text-muted print:text-[7.5pt]">Ej: El pichón, el lomo de corvina o el solomillo.</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[8.5pt]">B. Salsa o Jus</span>
                    <span className="text-slate-400 text-[10px] pro-print-text-muted print:text-[7.5pt]">Ej: Reducción de huesos con cacao y oporto.</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[8.5pt]">C. Guarnición o Crujiente</span>
                    <span className="text-slate-400 text-[10px] pro-print-text-muted print:text-[7.5pt]">Ej: Praliné de apionabo y teja de remolacha.</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic pro-print-text-muted print:text-[7.5pt]">
                  💡 <strong>¿Qué es el % sobre base?</strong> Es el sistema de pastelería: el ingrediente principal es el 100%, y el resto se calcula en proporción para escalar de 6 a 40 comensales automáticamente sin errores.
                </p>
              </div>

              {/* NIVEL 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40 pro-badge-amber">3</span>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-serif pro-print-text-dark">NIVEL 3 · Montaje & Pase (El Momento de Servir)</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para la Persona del Pase</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pro-print-text-muted print:text-[8.5pt]">
                  La hoja de batalla del servicio con las 4 preguntas críticas del pase:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center font-mono">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <Scale size={14} className="mx-auto mb-0.5 text-amber-400 print:text-amber-700" />
                    <span className="text-slate-300 font-bold block pro-print-text-dark print:text-[8.5pt]">Gramaje</span>
                    <span className="text-slate-400 text-[9px] pro-print-text-muted print:text-[7pt]">Gramos exactos/pax</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <Layers size={14} className="mx-auto mb-0.5 text-amber-400 print:text-amber-700" />
                    <span className="text-slate-300 font-bold block pro-print-text-dark print:text-[8.5pt]">Orden</span>
                    <span className="text-slate-400 text-[9px] pro-print-text-muted print:text-[7pt]">1º, 2º, 3º y 4º elemento</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <Thermometer size={14} className="mx-auto mb-0.5 text-amber-400 print:text-amber-700" />
                    <span className="text-slate-300 font-bold block pro-print-text-dark print:text-[8.5pt]">Temperatura</span>
                    <span className="text-slate-400 text-[9px] pro-print-text-muted print:text-[7pt]">62°C al salir del pase</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 print:bg-white print:border-slate-200">
                    <Clock size={14} className="mx-auto mb-0.5 text-amber-400 print:text-amber-700" />
                    <span className="text-slate-300 font-bold block pro-print-text-dark print:text-[8.5pt]">Tiempo Máx.</span>
                    <span className="text-slate-400 text-[9px] pro-print-text-muted print:text-[7pt]">90 seg a la mesa</span>
                  </div>
                </div>
              </div>

              {/* NIVEL 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40 pro-badge-amber">4</span>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-serif pro-print-text-dark">NIVEL 4 · Calidad & Cata (¿El plato sale a la sala o no?)</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el Chef Ejecutivo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg pro-success-box">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-0.5 print:text-emerald-800 print:text-[8.5pt]">
                      <CheckCircle2 size={13} /> Criterios de Aceptación (Aprobado):
                    </span>
                    <span className="text-slate-300 text-[10px] leading-relaxed print:text-emerald-950 print:text-[7.5pt]">
                      Salsa con textura nape, brillo natural, punto rosado uniforme en el centro (54°C), piel perfectamente crujiente.
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg pro-danger-box">
                    <span className="text-rose-400 font-bold flex items-center gap-1.5 mb-0.5 print:text-rose-800 print:text-[8.5pt]">
                      <AlertTriangle size={13} /> Criterios de Rechazo (No servir):
                    </span>
                    <span className="text-slate-300 text-[10px] leading-relaxed print:text-rose-950 print:text-[7.5pt]">
                      Temperatura inferior a 50°C, carne cocinada de más (&gt;58°C gris), emulsión cortada o presencia de fibras duras.
                    </span>
                  </div>
                </div>
              </div>

              {/* NIVEL 5 */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40 pro-badge-amber">5</span>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 font-serif pro-print-text-dark">NIVEL 5 · Trazabilidad, Caducidad & Costes</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para Gestión y Seguridad</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed pro-print-text-muted print:text-[8pt]">
                  <li><strong>Conservación validada:</strong> Abatidor, bolsa de vacío a 3°C o congelación a -18°C con registro APPCC.</li>
                  <li><strong>Vida útil aprobada:</strong> Horas o días exactos de duración antes de caducar cada sub-elaboración.</li>
                  <li><strong>Control de versiones:</strong> Si cambias vinagre de jerez por manzana, queda registrado quién lo cambió y por qué.</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Pie de página 2 en impresión */}
          <div className="hidden print:flex items-center justify-between text-[8pt] text-slate-400 border-t border-slate-200 pt-1.5 font-mono">
            <span>Página 2 de 3 · Los 5 Niveles de la Ficha Técnica Profesional</span>
            <span>{settings.instituteName || 'Escuela de Hostelería'}</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* PÁGINA 3: GLOSARIO, GUÍA DE IMPRESIÓN PDF Y PIE OFICIAL    */}
        {/* ========================================================= */}
        <div className="pro-page-3 space-y-6 print:space-y-4">
          
          {/* 4. DICCIONARIO RÁPIDO DE TÉRMINOS TÉCNICOS */}
          <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
            <div className="flex items-center gap-3 pro-avoid-break-after">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
                4
              </div>
              <div>
                <h2 className="text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                  Glosario Rápido: Términos técnicos sin misterio
                </h2>
                <p className="text-[11px] text-slate-400 font-mono pro-print-text-muted print:text-[8pt]">
                  Para que nunca dudes si ves una palabra técnica en cocina de vanguardia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 pro-subtle-box pro-avoid-break">
                <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[9pt]">°Brix (Grados Brix)</span>
                <span className="text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">Mide la concentración de azúcar o dulzor con un refractómetro. Si no tienes refractómetro, no te preocupes: puedes dejarlo en blanco.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 pro-subtle-box pro-avoid-break">
                <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[9pt]">pH (Nivel de Acidez)</span>
                <span className="text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">Mide la acidez química (de 1 a 14). Se usa en encurtidos y fermentos para garantizar que no crezcan bacterias (por debajo de pH 4.5).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 pro-subtle-box pro-avoid-break">
                <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[9pt]">Merma y Rendimiento %</span>
                <span className="text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">Lo que pesa la comida cruda vs. lo que queda tras limpiarla y cocinarla. Por ejemplo: un fondo que reduce a la mitad tiene un 50% de rendimiento.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 pro-subtle-box pro-avoid-break">
                <span className="text-amber-400 font-bold block pro-print-text-dark print:text-[9pt]">Temperatura de Corazón</span>
                <span className="text-slate-300 leading-relaxed pro-print-text-muted print:text-[8pt]">La temperatura medida con termómetro de sonda en el centro exacto de la pieza de carne o pescado para clavar el punto de cocción.</span>
              </div>
            </div>
          </section>

          {/* 5. CÓMO IMPRIMIR O GUARDAR EN PDF */}
          <section className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/30 space-y-3.5 pro-amber-box pro-avoid-break">
            <div className="flex items-center gap-3 pro-avoid-break-after">
              <Download className="text-amber-400 print:text-amber-700 shrink-0" size={22} />
              <div>
                <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[11pt]">
                  ¿Cómo guardar este manual o las fichas en PDF?
                </h2>
                <p className="text-[11px] text-amber-300/80 pro-print-text-muted font-mono print:text-[8pt]">
                  Solo 2 clics desde cualquier ordenador, tablet o teléfono
                </p>
              </div>
            </div>

            <ol className="text-xs text-slate-200 space-y-1.5 list-decimal list-inside leading-relaxed pro-print-text-muted print:text-[8.5pt]">
              <li>Haz clic en el botón superior derecho <strong>«Imprimir / Guardar en PDF»</strong>.</li>
              <li>En la ventana de impresión de tu navegador, en el campo <strong>«Destino» o «Impresora»</strong>, selecciona <strong>«Guardar como PDF»</strong>.</li>
              <li><strong className="text-white pro-print-text-dark">Paso Clave:</strong> Marca la casilla <strong>«Gráficos de fondo»</strong> (Background graphics) para que los colores, tablas y bordes salgan nítidos.</li>
              <li>Haz clic en <strong>Guardar</strong> y ¡listo! Ya tienes tu archivo PDF editorial para compartir o imprimir.</li>
            </ol>
          </section>

          {/* Pie Institucional Oficial */}
          <footer className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 pro-print-text-muted gap-3 pro-avoid-break">
            <div className="space-y-0.5">
              <span className="block font-bold">Documento Didáctico de Referencia · {settings.instituteName || 'Escuela de Hostelería'}</span>
              <span className="block text-[10px] text-slate-500 print:text-slate-600">Taller I+D de Alta Gastronomía · Formato Oficial de Escuela y Cocina de Producción</span>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/40"
              >
                <Printer size={13} /> Imprimir Guía Completa
              </button>
              <button
                onClick={onBack}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
              >
                Volver al Taller
              </button>
            </div>
            <div className="hidden print:block text-[8pt] text-slate-400 font-mono text-right">
              Página 3 de 3
            </div>
          </footer>

        </div>

      </div>
    </div>
  );
};
