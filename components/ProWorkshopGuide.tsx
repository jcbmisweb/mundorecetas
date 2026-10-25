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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-amber-500 selection:text-slate-950 print:bg-white print:text-black print:pb-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 11pt;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pro-guide-page-break {
            page-break-before: always;
            break-before: page;
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

      {/* Contenido Principal · Manual de Uso */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        
        {/* Portada / Cabecera Editorial */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-8 sm:p-10 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-0 print:text-black">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase print:text-black print:border-gray-300">
              <Compass size={14} /> Taller I+D · Manual del Chef y Profesor
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white leading-tight print:text-black">
              Cómo entender y utilizar el Taller de Recetas Profesionales
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans print:text-gray-700">
              Una guía sencilla, explicada de cocinero a cocinero, para transformar recetas tradicionales en protocolos técnicos de alta cocina sin complicarse la vida.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 print:text-gray-600">
              <span>🏛️ {settings.instituteName || 'Escuela de Hostelería'}</span>
              <span>•</span>
              <span>👨‍🍳 Chef / Docente: {settings.teacherName || 'Jefe de Cocina'}</span>
              <span>•</span>
              <span>⭐ Nivel: Alta Gastronomía / 3 Estrellas</span>
            </div>
          </div>
        </section>

        {/* 1. ¿POR QUÉ ESTE TALLER PARECE TAN MODERNO? */}
        <section className="bg-slate-900/70 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4 print:bg-white print:border-gray-200 print:text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg print:text-black">
              1
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-white print:text-black">
                ¿Qué es este Taller y por qué es diferente al recetario normal?
              </h2>
              <p className="text-xs text-slate-400 font-mono print:text-gray-500">
                La diferencia entre «apuntar una receta» y «diseñar un protocolo infalible»
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 print:bg-gray-50 print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider print:text-gray-700">
                <FileText size={16} /> Recetario Escolar Tradicional
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed print:text-gray-800">
                <li>Tiene una lista general de ingredientes: «200g carne, 50g cebolla, sal al gusto».</li>
                <li>Una explicación corrida: «Sofreír, cocer a fuego medio y servir caliente».</li>
                <li><strong>El problema:</strong> Si cambia de cocinero o el alumno falta, cada uno lo hace a su manera. Un día la salsa queda líquida y otro día queda espesa o salada.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5 print:bg-amber-50/50 print:border-amber-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider print:text-amber-800">
                <Award size={16} /> Taller I+D · Recetario Profesional
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed print:text-gray-800">
                <li>Despieza el plato en sus partes reales: <em>la carne, la salsa, la crema y el crujiente</em>.</li>
                <li>Indica <strong>temperaturas exactas y tiempos</strong> (ej: 54.5°C por 18 min), no «a fuego suave».</li>
                <li>Define cómo se emplata (gramos exactos con pinzas), vajilla y temperatura de servicio.</li>
                <li><strong>El resultado:</strong> El plato sale <strong>exactamente perfecto todos los días</strong>, esté quien esté en la partida.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. CÓMO USAR EL TALLER EN 3 PASOS FÁCILES */}
        <section className="bg-slate-900/70 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 print:bg-white print:border-gray-200 print:text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg print:text-black">
              2
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-white print:text-black">
                Cómo trabajar con el Taller en 3 Pasos Rápidos
              </h2>
              <p className="text-xs text-slate-400 font-mono print:text-gray-500">
                Para empezar sin agobios: de lo simple a lo profesional
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative print:bg-gray-50 print:border-gray-300">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-white text-sm print:text-black">
                Importa o Crea una Ficha
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                No tienes que escribir todo desde cero. Pulsa <strong>«Importar Receta a Taller»</strong> y elige cualquier receta que ya tengas en la escuela. El sistema la convertirá automáticamente en formato I+D. O bien pulsa <strong>«Nueva Ficha I+D»</strong> para empezar un plato nuevo.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative print:bg-gray-50 print:border-gray-300">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-white text-sm print:text-black">
                Rellena solo lo que necesites
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                ¡No te asustes por la cantidad de campos! Al principio puedes rellenar solo el <strong>Nivel 1 (Nombre y sabor)</strong> y el <strong>Nivel 2 (Ingredientes y pasos)</strong>. Los parámetros más técnicos (pH, °Brix, tolerancias) son opcionales y los puedes ir completando poco a poco.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative print:bg-gray-50 print:border-gray-300">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-white text-sm print:text-black">
                Saca el Dossier Imprimible
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                Cuando termines, pulsa el botón <strong>«Ver Dossier / Imprimir»</strong>. El sistema genera una lámina editorial digna de un restaurante 3 estrellas Michelin, lista para imprimir o guardar en PDF y colgarla en la pared de la partida de cocina o entregar a los alumnos.
              </p>
            </div>
          </div>
        </section>

        {/* 3. LOS 5 NIVELES EXPLICADOS CON MANZANAS Y PERAS */}
        <section className="bg-slate-900/70 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 print:bg-white print:border-gray-200 print:text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg print:text-black">
              3
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-white print:text-black">
                Los 5 Niveles Explicados: ¿Qué significa cada pestaña?
              </h2>
              <p className="text-xs text-slate-400 font-mono print:text-gray-500">
                Un vistazo rápido para entender qué va en cada sitio sin dudar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* NIVEL 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40">1</span>
                  <h3 className="text-base font-bold text-amber-400 font-serif print:text-black">NIVEL 1 · Identidad & Perfil Sensorial (El Alma del Plato)</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full print:border print:border-gray-300">Para el Chef y el Comensal</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                Aquí defines <strong>qué es el plato</strong> y <strong>qué quieres transmitir</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
                <div>
                  <strong className="text-white block print:text-black">• Datos básicos:</strong>
                  <span className="text-slate-400 print:text-gray-600">Nombre comercial (el que va en la carta), nombre técnico (para la cocina), temporada y vajilla.</span>
                </div>
                <div>
                  <strong className="text-white block print:text-black">• El Radar de Sabores (Gráfico de tela de araña):</strong>
                  <span className="text-slate-400 print:text-gray-600">Puntúa del 1 al 10: Acidez, Dulzor, Salinidad, Umami, Grasa, Crujiente, Amargor y Complejidad. Sirve para ver a simple vista si un plato es armónico o si le falta chispa.</span>
                </div>
              </div>
            </div>

            {/* NIVEL 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40">2</span>
                  <h3 className="text-base font-bold text-amber-400 font-serif print:text-black">NIVEL 2 · Fichas de Elaboración (La Cocina de Producción)</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full print:border print:border-gray-300">Para el Jefe de Partida</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                En alta cocina, un plato no es una lista única de 20 ingredientes revueltos. Se divide en sus <strong>sub-elaboraciones</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <span className="text-amber-400 font-bold block print:text-black">A. Elemento Principal</span>
                  <span className="text-slate-400 text-[11px] print:text-gray-600">Ej: El pichón, el lomo de corvina o el solomillo.</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <span className="text-amber-400 font-bold block print:text-black">B. Salsa o Jus</span>
                  <span className="text-slate-400 text-[11px] print:text-gray-600">Ej: Reducción de huesos con cacao y oporto.</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <span className="text-amber-400 font-bold block print:text-black">C. Guarnición o Crujiente</span>
                  <span className="text-slate-400 text-[11px] print:text-gray-600">Ej: Praliné de apionabo y teja de remolacha.</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 italic print:text-gray-600">
                💡 <strong>¿Qué es el % sobre base?</strong> Es el sistema de pastelería: el ingrediente principal es el 100%, y el resto se calcula en proporción. Así, si mañana tienes 30 comensales en vez de 6, ¡el sistema escala las cantidades automáticamente sin errores!
              </p>
            </div>

            {/* NIVEL 3 */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40">3</span>
                  <h3 className="text-base font-bold text-amber-400 font-serif print:text-black">NIVEL 3 · Montaje & Pase (El Momento de Servir)</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full print:border print:border-gray-300">Para la Persona del Pase</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                Esta es la hoja de batalla del servicio. Responde a las 4 preguntas críticas del pase:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center font-mono">
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <Scale size={16} className="mx-auto mb-1 text-amber-400 print:text-black" />
                  <span className="text-slate-300 font-bold block print:text-black">Gramaje</span>
                  <span className="text-slate-400 text-[10px]">Gramos exactos/pax</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <Layers size={16} className="mx-auto mb-1 text-amber-400 print:text-black" />
                  <span className="text-slate-300 font-bold block print:text-black">Orden</span>
                  <span className="text-slate-400 text-[10px]">1º, 2º, 3º y 4º elemento</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <Thermometer size={16} className="mx-auto mb-1 text-amber-400 print:text-black" />
                  <span className="text-slate-300 font-bold block print:text-black">Temperatura</span>
                  <span className="text-slate-400 text-[10px]">62°C al salir del pase</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-gray-50">
                  <Clock size={16} className="mx-auto mb-1 text-amber-400 print:text-black" />
                  <span className="text-slate-300 font-bold block print:text-black">Tiempo Máximo</span>
                  <span className="text-slate-400 text-[10px]">90 seg a la mesa</span>
                </div>
              </div>
            </div>

            {/* NIVEL 4 */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40">4</span>
                  <h3 className="text-base font-bold text-amber-400 font-serif print:text-black">NIVEL 4 · Calidad & Cata (¿El plato sale a la sala o no?)</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full print:border print:border-gray-300">Para el Chef Ejecutivo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                Aquí se especifican los <strong>criterios de aceptación y rechazo</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl print:bg-green-50 print:border-green-300">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1 print:text-green-800">
                    <CheckCircle2 size={14} /> Criterios de Aceptación (Aprobado):
                  </span>
                  <span className="text-slate-300 text-[11px] print:text-gray-700">
                    Salsa con textura nape, brillo natural, punto rosado uniforme en el centro (54°C), piel perfectamente crujiente.
                  </span>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl print:bg-red-50 print:border-red-300">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5 mb-1 print:text-red-800">
                    <AlertTriangle size={14} /> Criterios de Rechazo (No servir):
                  </span>
                  <span className="text-slate-300 text-[11px] print:text-gray-700">
                    Temperatura inferior a 50°C, carne cocinada de más (&gt;58°C gris), emulsión cortada o presencia de fibras duras.
                  </span>
                </div>
              </div>
            </div>

            {/* NIVEL 5 */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/40">5</span>
                  <h3 className="text-base font-bold text-amber-400 font-serif print:text-black">NIVEL 5 · Trazabilidad, Caducidad & Costes</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full print:border print:border-gray-300">Para Gestión y Seguridad</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed print:text-gray-700">
                La garantía sanitaria y económica:
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed print:text-gray-700">
                <li><strong>Conservación validada:</strong> ¿Se guarda en abatidor? ¿Bolsa de vacío a 3°C? ¿Congelado a -18°C?</li>
                <li><strong>Vida útil aprobada:</strong> Cuántas horas o días dura exactamente cada sub-elaboración antes de caducar.</li>
                <li><strong>Control de versiones:</strong> Si cambias el vinagre de jerez por vinagre de manzana, aquí queda registrado quién lo cambió y por qué.</li>
              </ul>
            </div>

          </div>
        </section>

        {/* 4. DICCIONARIO RÁPIDO DE PALABRAS «RARAS» */}
        <section className="bg-slate-900/70 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4 print:bg-white print:border-gray-200 print:text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg print:text-black">
              4
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-white print:text-black">
                Glosario Rápido: Términos técnicos sin misterio
              </h2>
              <p className="text-xs text-slate-400 font-mono print:text-gray-500">
                Para que nunca dudes si ves una palabra extraña
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-amber-400 font-bold block print:text-black">°Brix (Grados Brix)</span>
              <span className="text-slate-300 print:text-gray-700">Mide la concentración de azúcar o dulzor con un refractómetro. Si no tienes refractómetro, no te preocupes: puedes dejarlo en blanco.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-amber-400 font-bold block print:text-black">pH (Nivel de Acidez)</span>
              <span className="text-slate-300 print:text-gray-700">Mide la acidez química (de 1 a 14). Se usa en encurtidos y fermentos para garantizar que no crezcan bacterias malas (por debajo de pH 4.5).</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-amber-400 font-bold block print:text-black">Merma y Rendimiento %</span>
              <span className="text-slate-300 print:text-gray-700">Lo que pesa la comida cruda vs. lo que queda tras limpiarla y cocinarla. Por ejemplo: un caldo que reduce a la mitad tiene un 50% de rendimiento.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-amber-400 font-bold block print:text-black">Temperatura de Corazón</span>
              <span className="text-slate-300 print:text-gray-700">La temperatura medida con termómetro de sonda en el centro exacto de la pieza de carne o pescado para clavar el punto de cocción.</span>
            </div>
          </div>
        </section>

        {/* 5. CÓMO IMPRIMIR O GUARDAR EN PDF */}
        <section className="bg-amber-500/10 p-6 sm:p-8 rounded-2xl border border-amber-500/30 space-y-4 print:bg-amber-50 print:border-amber-400 print:text-black">
          <div className="flex items-center gap-3">
            <Download className="text-amber-400 print:text-amber-800" size={24} />
            <div>
              <h2 className="text-lg font-black font-serif text-white print:text-black">
                ¿Cómo guardar este manual o las fichas en PDF?
              </h2>
              <p className="text-xs text-amber-300/80 print:text-amber-900 font-mono">
                Solo 2 clics desde cualquier ordenador o tablet
              </p>
            </div>
          </div>

          <ol className="text-xs text-slate-200 space-y-2 list-decimal list-inside leading-relaxed print:text-gray-800">
            <li>Haz clic en el botón superior derecho <strong>«Imprimir / Guardar en PDF»</strong>.</li>
            <li>En la ventana que se abre en tu navegador, en el campo <strong>«Destino» o «Impresora»</strong>, selecciona <strong>«Guardar como PDF»</strong>.</li>
            <li>Asegúrate de marcar la casilla <strong>«Gráficos de fondo»</strong> para que salgan todos los colores y tablas perfectamente formateadas.</li>
            <li>Haz clic en <strong>Guardar</strong> y ¡listo! Ya tienes tu archivo PDF para compartir con tus alumnos o guardarlo en tu pendrive.</li>
          </ol>
        </section>

        {/* Pie de Firma y Autorización */}
        <footer className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4 print:text-black print:border-gray-300">
          <div>
            <span>Documento Didáctico de Referencia · {settings.instituteName || 'Escuela de Hostelería'}</span>
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
        </footer>

      </div>
    </div>
  );
};
