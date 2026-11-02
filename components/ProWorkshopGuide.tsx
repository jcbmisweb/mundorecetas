import React, { useEffect, useRef } from 'react';
import { 
  ArrowLeft, Printer, BookOpen, Sparkles, CheckCircle2, 
  HelpCircle, Compass, Layers, Scale, Thermometer, Clock, 
  Award, AlertTriangle, FileText, Download, ChevronRight,
  Flame, ShieldCheck, HeartHandshake, Eye, Check, AlertCircle, Percent
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

  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Taller I+D · Manual de Ficha Técnica Profesional';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const handlePrint = () => {
    document.title = 'Taller I+D · Manual de Ficha Técnica Profesional';
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
          .pro-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .pro-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .pro-avoid-break-after {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-sm cursor-pointer"
              title="Volver al Taller I+D"
            >
              <ArrowLeft size={14} /> Volver al Taller
            </button>
            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  MANUAL DE FICHA TÉCNICA PROFESIONAL · VERSIÓN 2.0 REVISADA
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  IES La Flota · Módulo Productos Culinarios
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              title="Imprimir o guardar como PDF en tu navegador"
            >
              <Printer size={15} />
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal · Manual de Uso Organizado */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pro-print-wrapper print:space-y-4">
        
        {/* Cabecera Editorial Oficial */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-7 sm:p-9 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden pro-clean-header pro-avoid-break">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase pro-badge-amber">
              <Compass size={14} className="shrink-0" /> Taller I+D · Manual de Ficha Técnica Profesional
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white leading-tight pro-print-text-dark print:text-[20pt]">
              Taller I+D · Manual de Ficha Técnica Profesional
            </h1>
            <div className="space-y-1 text-xs sm:text-sm text-slate-300 font-sans pro-print-text-muted print:text-[9.5pt]">
              <p className="font-semibold text-amber-300 pro-print-text-dark">
                {settings.instituteName || 'IES La Flota'} · Módulo Productos Culinarios · 2º Grado Medio Cocina y Gastronomía
              </p>
              <p className="font-mono text-slate-400 pro-print-text-muted text-[11px] print:text-[8.5pt]">
                Chef / Docente: {settings.teacherName || 'Juan Codina Barranco'} · Versión 2.0 (revisada) · Fecha: ____ / ____ / ______
              </p>
              <p className="text-slate-300 italic pro-print-text-muted pt-1">
                Una guía para pasar de «apuntar una receta» a diseñar un protocolo que salga igual todos los días, con seguridad alimentaria, escandallo y criterios de evaluación incluidos.
              </p>
            </div>
          </div>
        </section>

        {/* 1. ¿QUÉ ES EL TALLER I+D Y EN QUÉ SE DIFERENCIA DE UN RECETARIO NORMAL? */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              1
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                1. ¿Qué es el Taller I+D y en qué se diferencia de un recetario normal?
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/60 print:bg-white">
              <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-slate-700 font-mono uppercase text-[10px] border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2.5 px-4 w-1/2">Recetario escolar tradicional</th>
                  <th className="py-2.5 px-4 w-1/2 text-amber-400 print:text-amber-800">Taller I+D (ficha profesional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-800 text-[11px] print:text-[8.5pt]">
                <tr>
                  <td className="py-2.5 px-4">Lista general: «200 g de carne, 50 g de cebolla, sal al gusto».</td>
                  <td className="py-2.5 px-4 font-medium">El plato se despieza en sub-elaboraciones: elemento principal, salsa, guarnición, crujiente.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">Explicación corrida: «Sofreír, cocer a fuego medio y servir caliente».</td>
                  <td className="py-2.5 px-4 font-medium">Temperaturas, tiempos y puntos de control concretos (por ejemplo, «54,5 °C de corazón durante 18 min»).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">Cada cocinero lo interpreta a su manera: un día la salsa queda líquida y otro, espesa o salada.</td>
                  <td className="py-2.5 px-4 font-medium">Se define gramaje, orden de montaje, vajilla y temperatura de servicio.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">Si el alumno falta, el plato cambia.</td>
                  <td className="py-2.5 px-4 font-medium text-amber-300 print:text-amber-900 font-bold">El resultado es reproducible esté quien esté en la partida.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 pro-amber-box">
            <strong>Idea clave para el alumnado:</strong> una ficha técnica es un contrato entre la cocina, la sala y el cliente. Si no se puede repetir, no es una receta profesional.
          </div>
        </section>

        {/* 2. CÓMO TRABAJAR CON EL TALLER: DOS NIVELES DE USO */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              2
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                2. Cómo trabajar con el Taller: dos niveles de uso
              </h2>
              <p className="text-xs text-slate-400 pro-print-text-muted print:text-[8.5pt]">
                No hace falta rellenar todo desde el primer día. Trabajamos por niveles de exigencia.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/60 print:bg-white">
              <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-slate-700 font-mono uppercase text-[10px] border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2.5 px-4 w-28">Nivel de uso</th>
                  <th className="py-2.5 px-4">Qué se rellena</th>
                  <th className="py-2.5 px-4">Cuándo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-800 text-[11px] print:text-[8.5pt]">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-amber-400 print:text-amber-800">Básico</td>
                  <td className="py-2.5 px-4">Niveles 1, 2 y 5 (identidad, elaboraciones y escandallo/seguridad).</td>
                  <td className="py-2.5 px-4">Primeras fichas del curso y prácticas del día a día.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-amber-400 print:text-amber-800">Avanzado</td>
                  <td className="py-2.5 px-4">Niveles 1 a 5 completos, más radar de sabores, pH, °Brix y rúbrica de cata.</td>
                  <td className="py-2.5 px-4">Platos de evaluación, ofertas gastronómicas y proyectos finales.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 pro-print-text-muted print:text-[8.5pt]">
            <span className="font-bold text-white pro-print-text-dark block">Los 3 pasos:</span>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li><strong>Importa o crea una ficha:</strong> Convierte una receta existente en formato I+D («Importar Receta a Taller») o empieza una nueva («Nueva Ficha I+D»).</li>
              <li><strong>Rellena solo lo que toca a tu nivel:</strong> Los parámetros técnicos (pH, °Brix) son opcionales y se completan con la práctica.</li>
              <li><strong>Saca el dossier imprimible:</strong> Pulsa «Ver Dossier / Imprimir» para colgarlo en la partida o entregarlo al grupo.</li>
            </ol>
          </div>
        </section>

        {/* 3. LOS 5 NIVELES DE LA FICHA */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4 pro-clean-card">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              3
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                3. Los 5 niveles de la ficha
              </h2>
            </div>
          </div>

          <div className="space-y-3.5 print:space-y-2.5 text-xs">
            {/* Nivel 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 pro-subtle-box pro-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 font-serif pro-print-text-dark text-xs sm:text-sm">
                  Nivel 1 · Identidad y perfil sensorial (el alma del plato)
                </h3>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el chef y el comensal</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pro-print-text-muted print:text-[8.5pt]">
                <li><strong>Datos básicos:</strong> nombre comercial (el de la carta), nombre técnico (el de cocina), temporada, vajilla y número de raciones.</li>
                <li><strong>Radar de sabores (nivel avanzado):</strong> puntúa de 1 a 10 (o 1 a 5) acidez, dulzor, salinidad, umami, grasa, crujiente, amargor y complejidad para ver el equilibrio del plato de un vistazo.</li>
                <li><strong>Foto del plato terminado (obligatoria en nivel avanzado):</strong> sirve de referencia para el pase y para la cata.</li>
              </ul>
            </div>

            {/* Nivel 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 font-serif pro-print-text-dark text-xs sm:text-sm">
                  Nivel 2 · Fichas de elaboración (la cocina de producción)
                </h3>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el jefe de partida</span>
              </div>
              <p className="text-slate-300 pro-print-text-muted print:text-[8.5pt]">
                Un plato no es una lista de 20 ingredientes revueltos. Se divide en sub-elaboraciones:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-amber-400 block pro-print-text-dark">A. Elemento principal</span>
                  <span className="text-slate-400 pro-print-text-muted">Pichón, lomo de corvina, solomillo.</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-amber-400 block pro-print-text-dark">B. Salsa o jus</span>
                  <span className="text-slate-400 pro-print-text-muted">Reducción de huesos con cacao y oporto.</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-amber-400 block pro-print-text-dark">C. Guarnición o crujiente</span>
                  <span className="text-slate-400 pro-print-text-muted">Praliné de apionabo, teja de remolacha.</span>
                </div>
              </div>
              <div className="space-y-1 text-slate-300 pro-print-text-muted print:text-[8.5pt]">
                <span className="font-bold text-white pro-print-text-dark block">Cada mini-ficha incluye:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Ingredientes con peso bruto, peso neto y % sobre base.</li>
                  <li>Alérgenos de la sub-elaboración (ver apartado 5).</li>
                  <li>Pasos numerados con temperatura y tiempo.</li>
                  <li><strong>Mise en place:</strong> qué se prepara el día antes, qué por la mañana y qué en el momento del servicio.</li>
                </ul>
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[10.5px] text-slate-300 pro-print-text-muted print:bg-white print:border-slate-200">
                <p><strong>¿Qué es el % sobre base?</strong> Es el sistema de la pastelería: el ingrediente principal es el 100 % y el resto se calcula en proporción. Permite escalar de 6 a 40 comensales sin errores.</p>
                <p className="text-amber-300 pro-print-text-dark mt-1 font-bold">Atención: indica siempre si el 100 % corresponde al peso bruto (tal como llega del proveedor) o al peso neto (limpio y listo para cocinar). Si no se indica, la ficha escala mal.</p>
              </div>
            </div>

            {/* Nivel 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 font-serif pro-print-text-dark text-xs sm:text-sm">
                  Nivel 3 · Montaje y pase (el momento de servir)
                </h3>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para la persona del pase</span>
              </div>
              <p className="text-slate-300 pro-print-text-muted print:text-[8.5pt]">
                La hoja de batalla del servicio responde a cuatro preguntas críticas:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-slate-200 block pro-print-text-dark">Gramaje</span>
                  <span className="text-slate-400 pro-print-text-muted">Carne 120 g · salsa 30 g · guarnición 40 g</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-slate-200 block pro-print-text-dark">Orden</span>
                  <span className="text-slate-400 pro-print-text-muted">Guarnición → carne → salsa → crujiente</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-slate-200 block pro-print-text-dark">Temperatura</span>
                  <span className="text-slate-400 pro-print-text-muted">Mantenimiento en caliente ≥ 65 °C</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 print:bg-white print:border-slate-200">
                  <span className="font-bold text-slate-200 block pro-print-text-dark">Tiempo máximo</span>
                  <span className="text-rose-400 font-bold">90 s de ventana</span>
                </div>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 pro-amber-box">
                <strong>Nota de seguridad:</strong> la referencia para mantener comida caliente es ≥ 65 °C (RD 3484/2000). El «punto rosado» de una pieza de carne o pescado es una cocción específica que debe justificarse con una combinación tiempo/temperatura de pasteurización. Las aves y la carne picada no admiten puntos rosados sin protocolo específico.
              </div>
            </div>

            {/* Nivel 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 pro-subtle-box pro-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 font-serif pro-print-text-dark text-xs sm:text-sm">
                  Nivel 4 · Calidad y cata (¿sale a la sala o no?)
                </h3>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para el chef ejecutivo</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg pro-success-box">
                  <span className="font-bold text-emerald-400 print:text-emerald-800 block mb-1">Criterios de aceptación (aprobado):</span>
                  <ul className="space-y-0.5 text-[10.5px] print:text-[8.5pt] text-slate-300 print:text-emerald-950">
                    <li>• Salsa con textura nappe y brillo natural.</li>
                    <li>• Punto de cocción uniforme en el centro (temperatura de corazón definida).</li>
                    <li>• Piel o costra crujiente.</li>
                    <li>• Gramaje y montaje conforme a la ficha.</li>
                  </ul>
                </div>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg pro-danger-box">
                  <span className="font-bold text-rose-400 print:text-rose-800 block mb-1">Criterios de rechazo (no servir):</span>
                  <ul className="space-y-0.5 text-[10.5px] print:text-[8.5pt] text-slate-300 print:text-rose-950">
                    <li>• Temperatura de mantenimiento inferior a 65 °C sin regeneración.</li>
                    <li>• Cocción excesiva: carne gris o fuera del rango indicado.</li>
                    <li>• Emulsión cortada.</li>
                    <li>• Presencia de fibras duras, espinas o cuerpos extraños.</li>
                  </ul>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic pro-print-text-muted">
                Estos criterios se convierten en puntuación en la rúbrica del apartado 6.
              </p>
            </div>

            {/* Nivel 5 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 pro-subtle-box pro-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 font-serif pro-print-text-dark text-xs sm:text-sm">
                  Nivel 5 · Trazabilidad, caducidad, costes y seguridad
                </h3>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full pro-badge-dark">Para gestión y seguridad alimentaria</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pro-print-text-muted print:text-[8.5pt]">
                <li><strong>Conservación validada:</strong> abatimiento de temperatura, envasado al vacío a 0-4 °C o congelación a -18 °C, con registro APPCC.</li>
                <li><strong>Vida útil aprobada:</strong> horas o días exactos para cada sub-elaboración, con fecha de elaboración y de caducidad.</li>
                <li><strong>Control de versiones:</strong> si se cambia el vinagre de Jerez por vinagre de manzana, queda anotado quién lo cambió, cuándo y por qué.</li>
                <li><strong>Escandallo:</strong> coste por ración, food cost y PVP sugerido (ver apartado 4).</li>
                <li><strong>Alérgenos y PCC:</strong> declaración obligatoria de 14 alérgenos y puntos críticos (ver apartados 5 y 7).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. ESCANDALLO Y COSTE POR RACIÓN */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              4
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                4. Escandallo y coste por ración
              </h2>
              <p className="text-xs text-slate-400 pro-print-text-muted print:text-[8.5pt]">
                Cada ficha de nivel básico o avanzado debe llevar su escandallo. Fórmulas para trabajar en clase:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">Rendimiento (%)</span>
              <span className="text-slate-300 pro-print-text-muted">peso neto ÷ peso bruto × 100</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">Merma (%)</span>
              <span className="text-slate-300 pro-print-text-muted">100 − rendimiento</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">Coste de ingrediente</span>
              <span className="text-slate-300 pro-print-text-muted">(precio de compra por kg ÷ rendimiento) × cantidad neta utilizada</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">Coste por ración</span>
              <span className="text-slate-300 pro-print-text-muted">coste total de la elaboración ÷ número de raciones</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">Food cost (%)</span>
              <span className="text-slate-300 pro-print-text-muted">coste por ración ÷ PVP sin IVA × 100</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 pro-subtle-box">
              <span className="text-amber-400 font-bold block pro-print-text-dark">PVP sugerido sin IVA</span>
              <span className="text-slate-300 pro-print-text-muted">coste por ración ÷ food cost objetivo</span>
            </div>
          </div>
        </section>

        {/* 5. ALÉRGENOS (OBLIGATORIO EN CADA SUB-ELABORACIÓN) */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              5
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                5. Alérgenos (obligatorio en cada sub-elaboración)
              </h2>
              <p className="text-xs text-slate-400 pro-print-text-muted print:text-[8.5pt]">
                Marca con una X los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011) presentes en cada sub-elaboración, incluidas trazas por contaminación cruzada:
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/60 print:bg-white">
              <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-slate-700 font-mono uppercase text-[9.5px] border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-1.5 px-3">Alérgeno (14 Oficiales UE)</th>
                  <th className="py-1.5 px-3 text-center">Elem. principal</th>
                  <th className="py-1.5 px-3 text-center">Salsa</th>
                  <th className="py-1.5 px-3 text-center">Guarnición</th>
                  <th className="py-1.5 px-3 text-center">Crujiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200 text-slate-300 print:text-slate-800 text-[10.5px] print:text-[8pt] font-mono">
                {[
                  'Cereales con gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes',
                  'Soja', 'Leche y lácteos', 'Frutos de cáscara', 'Apio', 'Mostaza',
                  'Granos de sésamo', 'Dióxido de azufre y sulfitos', 'Altramuces', 'Moluscos'
                ].map((aler, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="py-1 px-3 font-sans font-medium text-slate-200 print:text-slate-900">{aler}</td>
                    <td className="py-1 px-3 text-center text-slate-500">—</td>
                    <td className="py-1 px-3 text-center text-slate-500">—</td>
                    <td className="py-1 px-3 text-center text-slate-500">—</td>
                    <td className="py-1 px-3 text-center text-slate-500">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. RÚBRICA DE EVALUACIÓN DEL PLATO (BASADA EN EL NIVEL 4) */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              6
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                6. Rúbrica de evaluación del plato (basada en el Nivel 4)
              </h2>
              <p className="text-xs text-slate-400 pro-print-text-muted print:text-[8.5pt]">
                Puntúa cada criterio de 0 a 4 (0 = no cumple · 2 = cumple con mejoras · 4 = excelente). Ajusta los pesos al instrumento de evaluación del módulo.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/60 print:bg-white">
              <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-slate-700 font-mono uppercase text-[9.5px] border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2 px-3">Indicador</th>
                  <th className="py-2 px-3">0-1</th>
                  <th className="py-2 px-3">2</th>
                  <th className="py-2 px-3">3</th>
                  <th className="py-2 px-3">4</th>
                  <th className="py-2 px-3 text-right">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-800 text-[10.5px] print:text-[8pt]">
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Técnica y punto de cocción</td>
                  <td className="py-2 px-3">Fuera de rango</td>
                  <td className="py-2 px-3">Limitado, con desviaciones</td>
                  <td className="py-2 px-3">Correcto</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Exacto y uniforme</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">25 %</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Seguridad alimentaria y APPCC</td>
                  <td className="py-2 px-3">Incumple un límite crítico</td>
                  <td className="py-2 px-3">Registros incompletos</td>
                  <td className="py-2 px-3">Cumple con registros</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Cumple, registra y anticipa</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">25 %</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Montaje y gramaje</td>
                  <td className="py-2 px-3">No sigue la ficha</td>
                  <td className="py-2 px-3">Varias desviaciones</td>
                  <td className="py-2 px-3">Desviaciones menores</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Idéntico a la ficha</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">15 %</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Temperatura y tiempo de servicio</td>
                  <td className="py-2 px-3">Fuera de rango</td>
                  <td className="py-2 px-3">Límite</td>
                  <td className="py-2 px-3">Correcto</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Óptimo</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">10 %</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Sabor y textura (cata)</td>
                  <td className="py-2 px-3">Desequilibrado</td>
                  <td className="py-2 px-3">Mejorable</td>
                  <td className="py-2 px-3">Equilibrado</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Memorable</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">15 %</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-white pro-print-text-dark">Organización, mise en place y limpieza</td>
                  <td className="py-2 px-3">Desordenado</td>
                  <td className="py-2 px-3">Irregular</td>
                  <td className="py-2 px-3">Ordenado</td>
                  <td className="py-2 px-3 font-semibold text-emerald-400 print:text-emerald-800">Eficiente y trabaja en brigada</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-400 print:text-amber-800">10 %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. CUADRO DE PCC (PUNTOS CRÍTICOS DE CONTROL) */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              7
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                7. Cuadro de PCC (Puntos Críticos de Control)
              </h2>
              <p className="text-xs text-slate-400 pro-print-text-muted print:text-[8.5pt]">
                Una fila por cada punto crítico de la elaboración:
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/60 print:bg-white">
              <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-slate-700 font-mono uppercase text-[9.5px] border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2 px-2.5">Etapa</th>
                  <th className="py-2 px-2.5">Peligro</th>
                  <th className="py-2 px-2.5">Límite crítico</th>
                  <th className="py-2 px-2.5">Vigilancia</th>
                  <th className="py-2 px-2.5">Acción correctora</th>
                  <th className="py-2 px-2.5">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-800 text-[10.5px] print:text-[8pt]">
                <tr>
                  <td className="py-2 px-2.5 font-bold text-white pro-print-text-dark">Cocción de la pieza</td>
                  <td className="py-2 px-2.5 text-rose-300 print:text-rose-900">Supervivencia de patógenos</td>
                  <td className="py-2 px-2.5 font-mono">Temperatura de corazón y tiempo según tabla de pasteurización</td>
                  <td className="py-2 px-2.5">Termómetro de sonda en cada pieza</td>
                  <td className="py-2 px-2.5">Prolongar la cocción o descartar</td>
                  <td className="py-2 px-2.5 font-mono text-[9.5px]">Hoja de temperaturas</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-bold text-white pro-print-text-dark">Enfriamiento (abatidor)</td>
                  <td className="py-2 px-2.5 text-rose-300 print:text-rose-900">Crecimiento bacteriano</td>
                  <td className="py-2 px-2.5 font-mono">De 65 °C a ≤ 10 °C en el tiempo máximo fijado por el centro (&lt; 2 h)</td>
                  <td className="py-2 px-2.5">Sonda + reloj</td>
                  <td className="py-2 px-2.5">Repetir el abatimiento o descartar</td>
                  <td className="py-2 px-2.5 font-mono text-[9.5px]">Hoja de abatimiento</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-bold text-white pro-print-text-dark">Conservación en frío</td>
                  <td className="py-2 px-2.5 text-rose-300 print:text-rose-900">Crecimiento bacteriano</td>
                  <td className="py-2 px-2.5 font-mono">0-4 °C (o según producto)</td>
                  <td className="py-2 px-2.5">Lectura de cámara al inicio y fin de jornada</td>
                  <td className="py-2 px-2.5">Revisar equipo y evaluar el producto</td>
                  <td className="py-2 px-2.5 font-mono text-[9.5px]">Registro de cámaras</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 font-bold text-white pro-print-text-dark">Mantenimiento en caliente</td>
                  <td className="py-2 px-2.5 text-rose-300 print:text-rose-900">Crecimiento bacteriano</td>
                  <td className="py-2 px-2.5 font-mono">≥ 65 °C</td>
                  <td className="py-2 px-2.5">Sonda antes del pase</td>
                  <td className="py-2 px-2.5">Regenerar o descartar</td>
                  <td className="py-2 px-2.5 font-mono text-[9.5px]">Hoja de pase</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-slate-400 italic pro-print-text-muted">
            Confirma los valores exactos con el plan APPCC del centro, porque pueden variar según el producto y la normativa autonómica.
          </p>
        </section>

        {/* 8. GLOSARIO RÁPIDO */}
        <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-3.5 pro-clean-card pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base pro-badge-amber shrink-0">
              8
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[12pt]">
                8. Glosario rápido
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• °Brix:</strong>
              <span className="text-slate-300 pro-print-text-muted">concentración de azúcar en una disolución, medida con refractómetro. Si no tienes refractómetro, déjalo en blanco.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• pH:</strong>
              <span className="text-slate-300 pro-print-text-muted">acidez química (escala de 0 a 14). En encurtidos y fermentos se busca un pH inferior a 4,5 (criterio conservador; algunos manuales usan 4,6) para impedir el crecimiento de <em>Clostridium botulinum</em>.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• Merma y rendimiento %:</strong>
              <span className="text-slate-300 pro-print-text-muted">lo que pesa el producto crudo frente a lo que queda tras limpiarlo y cocinarlo. Un fondo que reduce a la mitad tiene un 50 % de rendimiento.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• Temperatura de corazón:</strong>
              <span className="text-slate-300 pro-print-text-muted">temperatura medida con sonda en el centro exacto de la pieza.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• Nappe:</strong>
              <span className="text-slate-300 pro-print-text-muted">textura de una salsa que cubre el dorso de una cuchara.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box">
              <strong className="text-amber-400 block pro-print-text-dark">• Mise en place:</strong>
              <span className="text-slate-300 pro-print-text-muted">organización y preparación previa de todo lo necesario antes de empezar.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 pro-subtle-box col-span-1 sm:col-span-2">
              <strong className="text-amber-400 block pro-print-text-dark">• Abatidor:</strong>
              <span className="text-slate-300 pro-print-text-muted">equipo que baja rápidamente la temperatura de un producto cocinado de 65 °C a ≤ 10 °C en menos de dos horas.</span>
            </div>
          </div>
        </section>

        {/* 9. CÓMO GUARDAR ESTE MANUAL O LAS FICHAS EN PDF */}
        <section className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/30 space-y-3 pro-amber-box pro-avoid-break">
          <div className="flex items-center gap-3 pro-avoid-break-after">
            <Download className="text-amber-400 print:text-amber-700 shrink-0" size={22} />
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white pro-print-text-dark print:text-[11pt]">
                9. Cómo guardar este manual o las fichas en PDF
              </h2>
            </div>
          </div>

          <ol className="text-xs text-slate-200 space-y-1.5 list-decimal list-inside leading-relaxed pro-print-text-muted print:text-[8.5pt]">
            <li>Pulsa <strong>«Imprimir / Guardar en PDF»</strong> (arriba a la derecha).</li>
            <li>En el campo «Destino» elige <strong>«Guardar como PDF»</strong>.</li>
            <li><strong className="text-white pro-print-text-dark">Paso clave:</strong> marca <strong>«Gráficos de fondo»</strong> para que se vean colores, tablas y bordes.</li>
            <li>Pulsa <strong>«Guardar»</strong>.</li>
          </ol>
        </section>

        {/* Pie Institucional Oficial */}
        <footer className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 pro-print-text-muted gap-3 pro-avoid-break">
          <div className="space-y-0.5">
            <span className="block font-bold">Documento didáctico de referencia · {settings.instituteName || 'IES La Flota'} · Módulo Productos Culinarios</span>
            <span className="block text-[10px] text-slate-500 print:text-slate-600">Taller I+D · Manual de Ficha Técnica Profesional · Versión 2.0 (revisada)</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/40 cursor-pointer"
            >
              <Printer size={13} /> Imprimir Manual Completo
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Volver al Taller
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
