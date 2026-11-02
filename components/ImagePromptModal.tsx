import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Check, X, FileText, Wand2, 
  Image as ImageIcon, ShoppingBag, Utensils, Box, CheckCircle2 
} from 'lucide-react';
import { SubRecipe, TakeAwayDetails } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  category?: string;
  subRecipes?: SubRecipe[];
  platingInstructions?: string;
  presentation?: string;
  importantNotes?: string;
  takeAwayDetails?: TakeAwayDetails;
}

export const ImagePromptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recipeName,
  category = 'Cocina de Autor',
  subRecipes = [],
  platingInstructions = '',
  presentation = '',
  importantNotes = '',
  takeAwayDetails
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'template'>('custom');
  const [presentationMode, setPresentationMode] = useState<'dining' | 'takeaway'>('dining');

  // Si la receta tiene marcado isTakeAway, activar por defecto el modo Take Away
  useEffect(() => {
    if (takeAwayDetails?.isTakeAway) {
      setPresentationMode('takeaway');
    } else {
      setPresentationMode('dining');
    }
  }, [takeAwayDetails?.isTakeAway, isOpen]);

  if (!isOpen) return null;

  const effectivePresentation = presentation || platingInstructions || 'Emplatado contemporáneo sobre vajilla artesanal.';
  const effectiveImportantNotes = importantNotes || (takeAwayDetails?.isTakeAway && [takeAwayDetails?.packagingNotes, takeAwayDetails?.transportTips].filter(Boolean).join(' · ')) || '';

  // Extraer componentes e ingredientes para poblar el prompt
  const componentsList = subRecipes.length > 0
    ? subRecipes.map(s => {
        const ingNames = s.ingredients?.map(i => i.name).filter(Boolean).slice(0, 8).join(', ');
        return `• ${s.name}${ingNames ? ` (Ingredientes: ${ingNames})` : ''}`;
      }).join('\n')
    : `• ${recipeName || 'Componente principal del plato'}`;

  const labelsList = subRecipes.length > 0
    ? subRecipes.map(s => `  - ${s.name}`).join('\n')
    : `  - ${recipeName || 'Elaboración principal'}`;

  // Packaging para Take Away
  const packagingDesc = takeAwayDetails?.packagingType || 'Envase kraft microondable ecológico de diseño contemporáneo + tarrina hermética para salsa + sobre para crujientes';

  // =========================================================================
  // 1. Prompt Especial TAKE AWAY (Dentro de Recipientes y Packaging de Comida para Llevar)
  // =========================================================================
  const takeAwayPrompt = `Crear una lámina gastronómica publicitaria y editorial profesional en formato horizontal apaisado 16:9, especializada en TAKE AWAY, DELIVERY GOURMET Y COMIDA PARA LLEVAR.

INFORMACIÓN DE LA FICHA TÉCNICA (COMIDA PARA LLEVAR / TAKE AWAY):
- PLATO: ${recipeName || 'Plato Gourmet Take Away'}
- CATEGORÍA: ${category} (Comida para Llevar)
- RECIPIENTE Y PACKAGING DE TRANSPORTE: ${packagingDesc}
- ELEMENTOS Y ELABORACIONES DEL PLATO:
${componentsList}

PRESENTACIÓN (DISPOSICIÓN EN EL PACKAGING):
${effectivePresentation}

PUNTOS IMPORTANTES (SI LOS HAY):
${effectiveImportantNotes || 'Disponer la base ordenada, no tapar mientras emita vapor excesivo para no condensar y mantener la salsa en tarrina separada.'}

La composición debe combinar en una misma imagen dos representaciones coherentes del mismo plato dentro de su packaging y recipientes de transporte para llevar:

PANEL IZQUIERDO — ILUSTRACIÓN TÉCNICA DEL PACKAGING Y RECIPIENTES DE TAKE AWAY

Crear una ilustración técnica y editorial del envasado y packaging de Take Away para el plato "${recipeName}".
Estilo de dibujo culinario técnico dibujado a mano, con líneas de tinta fina y acuarelas suaves, sobre textura de papel kraft / algodón de alta calidad.

Mostrar el RECIPIENTE DE TAKE AWAY ABIERTO (caja rectangular de cartón kraft biodegradable de diseño contemporáneo o bowl ecológico para delivery), visualizando claramente la distribución interna:
${labelsList}
- Recipiente principal abierto con la base y guarnición del plato dispuestas con mimo y pulcritud según el apartado PRESENTACIÓN.
- Tarrina hermética pequeña para la salsa situada al lado del recipiente, con su tapadera.
- Bolsita o contenedor pequeño separado para los elementos crujientes o hierbas frescas.
- Pequeñas líneas finas con etiquetas elegantes señalando cada elemento del packaging y su contenido técnico.
Ilustración con aspecto de cuaderno de diseño de packaging culinario profesional.

PANEL DERECHO — FOTOGRAFÍA HIPERREALISTA DEL PLATO DENTRO DEL RECIPIENTE DE TAKE AWAY

Fotografía gastronómica hiperrealista de alta cocina para llevar (estilo gourmet delivery contemporáneo).

EL PLATO DEBE ESTAR DISPUESTO DIRECTAMENTE DENTRO DE SU RECIPIENTE DE TAKE AWAY ABIERTO:
- El recipiente es un envase gastronómico ecológico de alta gama (caja de cartón kraft natural de diseño limpio, bowl de bagazo de caña o envase termosellable premium abierto).
- La comida luce extremadamente fresca, jugosa, apetitosa y colocada con mimo dentro del recipiente, respetando el apartado PRESENTACIÓN y los PUNTOS IMPORTANTES.
- Al lado del envase principal abierto, mostrar la tarrina hermética de salsa abierta y destapada (dejando ver el brillo de la salsa), el elemento crujiente en su pequeña bolsita kraft abierta o recién espolvoreado, cubiertos ecológicos de madera pulida o bambú y una servilleta de papel kraft doblada con elegancia.
- Al fondo, sutilmente desenfocada, una bolsa de papel kraft de reparto sin marcas comerciales.
- REGLA CRÍTICA ESTRICTA: NO USAR PLATOS DE PORCELANA TRADICIONALES DE RESTAURANTE. La comida debe estar dentro del recipiente de take away para que se identifique inequívocamente como comida para llevar de calidad suprema.
- Iluminación lateral suave de estudio fotográfico profesional, texturas reales (vapor sutil si es caliente, brillo en la salsa, dorados crujientes, hierbas frescas).
- Ángulo gastronómico de 45 grados cenital moderado que permita ver el interior del envase y su contenido con total claridad y profundidad.

COHERENCIA Y DISEÑO GENERAL
Ambos paneles deben compartir exactamente el mismo tipo de recipiente de take away, las mismas guarniciones y la misma salsa.
Composición horizontal 16:9, dividida armónicamente (45% ilustración técnica a la izquierda, 55% fotografía hiperrealista a la derecha).
Fondo limpio, cálido y minimalista de mesa de madera clara o piedra neutra.
Sin logotipos comerciales, sin marcas de agua, sin personas ni manos.
El resultado debe transmitir alta gastronomía, modernidad, sostenibilidad y apetencia irresistible en formato de comida para llevar.`;

  // =========================================================================
  // 2. Prompt Estándar (Vajilla de Sala / Restaurante Tradicional)
  // =========================================================================
  const diningPrompt = `Crear una lámina gastronómica editorial profesional en formato horizontal apaisado 16:9, destinada a formar parte de una receta de cocina de alta gama.

INFORMACIÓN DE LA FICHA TÉCNICA:
- PLATO: ${recipeName || 'Plato de alta cocina'}
- CATEGORÍA: ${category}
- COMPONENTES Y ELABORACIONES:
${componentsList}

PRESENTACIÓN:
${effectivePresentation}

PUNTOS IMPORTANTES (SI LOS HAY):
${effectiveImportantNotes || 'Respetar los puntos de temperatura de pase y arquitectura visual del plato.'}

La composición debe combinar en una misma imagen dos representaciones coherentes del mismo plato:

PANEL IZQUIERDO — ILUSTRACIÓN TÉCNICA DEL PLATO

Crear una ilustración gastronómica técnica y elegante del emplatado, inspirada visualmente en la ficha técnica del plato "${recipeName}".

Estilo de ilustración culinaria editorial dibujada a mano, refinada y profesional, con líneas finas, acuarela y lápiz, textura de papel de alta calidad, colores naturales y realistas.

Mostrar el plato terminado desde una perspectiva que permita comprender claramente su estructura y sus diferentes componentes.

Representar visualmente y de manera reconocible todos los componentes indicados en la ficha técnica, respetando exactamente sus ingredientes, formas, cantidades relativas y posición dentro del emplatado:
${labelsList}

Utilizar líneas finas y discretas para señalar los diferentes elementos y añadir pequeñas etiquetas explicativas junto a cada componente cuando la ficha proporcione nombres concretos.

Las etiquetas deben ser limpias, elegantes y perfectamente legibles.

La ilustración debe parecer una lámina de un recetario gastronómico profesional o cuaderno de chef, no una ilustración infantil ni un dibujo genérico.

No inventar ingredientes ni elementos decorativos que no aparezcan en la ficha.

PANEL DERECHO — FOTOGRAFÍA DEL PLATO TERMINADO

Mostrar exactamente el mismo plato representado en la ilustración, convertido en una fotografía gastronómica hiperrealista de alta gama.

Fotografía realizada como por un fotógrafo gastronómico profesional para un restaurante Michelin.

Emplatado elegante, preciso y sofisticado en vajilla contemporánea.

El plato debe ser el protagonista absoluto.

Respetar exactamente todos los ingredientes, salsas, guarniciones, texturas y elementos de presentación descritos en la ficha.

Utilizar vajilla elegante y coherente con el concepto del plato.

Perspectiva gastronómica profesional de aproximadamente 45 grados, salvo que la geometría del plato requiera una vista ligeramente superior.

Iluminación lateral suave y natural de estudio, sombras delicadas, volumen realista, profundidad de campo cinematográfica y fondo discretamente desenfocado.

Texturas extremadamente realistas: pescado, carne, verduras, espumas, salsas, crujientes, emulsiones, masas y líquidos deben conservar su aspecto físico natural.

Colores naturales, apetitosos y sofisticados.

El resultado debe parecer una fotografía real tomada en un restaurante de alta gastronomía, nunca una imagen CGI, 3D o ilustración.

COHERENCIA ENTRE AMBOS PANELES
Es fundamental que la ilustración y la fotografía representen el mismo plato y el mismo concepto de emplatado.
La posición de los componentes principales debe coincidir visualmente entre ambos lados.
La ilustración funciona como explicación técnica del plato y la fotografía como resultado final del emplatado.
Crear una transición visual elegante entre ambos paneles, evitando que parezcan dos imágenes independientes pegadas una junto a otra.

DISEÑO GENERAL
Composición horizontal editorial de alta gama 16:9.
Panel izquierdo: aproximadamente 45 % del espacio.
Panel derecho: aproximadamente 55 % del espacio.
Separación sutil y elegante entre ambos.
Fondo general limpio, sofisticado y ligeramente cálido.
Sin personas, manos ni rostros. Sin logotipos. Sin marcas de agua.`;

  // =========================================================================
  // 3. Plantillas Maestras Base (Genéricas)
  // =========================================================================
  const masterTakeAwayTemplate = `Crear una lámina gastronómica publicitaria y editorial profesional en formato horizontal apaisado 16:9, especializada en TAKE AWAY, DELIVERY GOURMET Y COMIDA PARA LLEVAR.

La composición debe combinar en una misma imagen dos representaciones coherentes del mismo plato dentro de su packaging y recipientes de comida para llevar:

PANEL IZQUIERDO — ILUSTRACIÓN TÉCNICA DEL PACKAGING Y RECIPIENTES
- Ilustración técnica culinaria estilo cuaderno de diseño de packaging gastronómico dibujado a mano.
- Recipiente de Take Away abierto (caja kraft contemporánea o bowl de bagazo ecológico).
- Disposición interna de los ingredientes dibujada con líneas finas y etiquetas explicativas.
- Tarrina hermética independiente para la salsa al lado del envase.
- Contenedor o sobre pequeño para los elementos crujientes y hierbas frescas.

PANEL DERECHO — FOTOGRAFÍA HIPERREALISTA EN RECIPIENTE DE TAKE AWAY
- Fotografía gastronómica hiperrealista de delivery de alta gama.
- EL PLATO DEBE ESTAR DISPUESTO DIRECTAMENTE DENTRO DE SU RECIPIENTE DE TAKE AWAY ABIERTO (no usar platos de cerámica ni porcelana de mesa).
- Al lado del recipiente: tarrina hermética de salsa destapada, bolsa pequeña de crujientes abierta, cubiertos ecológicos de madera y servilleta kraft doblada.
- Al fondo, discretamente desenfocada, una bolsa de papel kraft de entrega.
- Iluminación suave de estudio, texturas apetitosas y ángulo de 45° que muestre la generosidad y el montaje interior del recipiente.

Composición horizontal 16:9 (45% ilustración técnica a la izquierda, 55% fotografía hiperrealista a la derecha). Fondo limpio y elegante. Sin personas, sin logotipos comerciales ni marcas de agua.`;

  const masterDiningTemplate = `Crear una lámina gastronómica editorial profesional en formato horizontal apaisado 16:9, destinada a formar parte de una receta de cocina de alta gama.

La composición debe combinar en una misma imagen dos representaciones coherentes del mismo plato:

PANEL IZQUIERDO — ILUSTRACIÓN TÉCNICA DEL PLATO
- Ilustración gastronómica técnica y elegante del emplatado, estilo cuaderno de chef, con acuarela y lápiz fino.
- Componentes señalados con líneas finas y etiquetas explicativas legibles.

PANEL DERECHO — FOTOGRAFÍA DEL PLATO TERMINADO
- Fotografía gastronómica hiperrealista estilo restaurante Michelin.
- Emplatado sofisticado en vajilla contemporánea.
- Iluminación natural suave, profundidad de campo cinematográfica y texturas hiperrealistas.

Composición horizontal 16:9 (45% ilustración a la izquierda, 55% fotografía a la derecha). Sin personas, manos, logotipos ni marcas de agua.`;

  // Determinar texto activo
  const customPrompt = presentationMode === 'takeaway' ? takeAwayPrompt : diningPrompt;
  const masterTemplate = presentationMode === 'takeaway' ? masterTakeAwayTemplate : masterDiningTemplate;
  const activeText = activeTab === 'custom' ? customPrompt : masterTemplate;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className={`p-6 text-white flex justify-between items-center border-b transition-colors ${
          presentationMode === 'takeaway' 
            ? 'bg-gradient-to-r from-amber-950 via-orange-950 to-slate-900 border-amber-500/20' 
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl shadow-lg ${
              presentationMode === 'takeaway' 
                ? 'bg-amber-600 shadow-amber-500/30' 
                : 'bg-indigo-600 shadow-indigo-500/30'
            }`}>
              {presentationMode === 'takeaway' ? <Box className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Prompt para Lámina Doble & Diseño con IA
                </h3>
                {presentationMode === 'takeaway' && (
                  <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    🥡 Recipientes Take Away
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {presentationMode === 'takeaway'
                  ? 'Especial Take Away: Genera el plato dentro de envases kraft, bowls y packaging de comida para llevar.'
                  : 'Lámina 16:9: Panel izquierdo con ilustración técnica + Panel derecho con fotografía en vajilla.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selector de Modo de Presentación: TAKE AWAY vs SALA */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Formato de Presentación:
            </span>
            <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setPresentationMode('takeaway')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  presentationMode === 'takeaway'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Box size={14} />
                <span>🥡 En Recipientes Take Away</span>
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode('dining')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  presentationMode === 'dining'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <Utensils size={14} />
                <span>🍽️ Vajilla de Restaurante</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : presentationMode === 'takeaway'
                    ? 'bg-amber-700 hover:bg-amber-800 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Prompt para la IA'}</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo si es Modo Take Away */}
        {presentationMode === 'takeaway' && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Box className="text-amber-700 mt-0.5 shrink-0" size={18} />
            <div className="text-xs text-amber-950 space-y-0.5">
              <p className="font-black uppercase tracking-wide flex items-center gap-1.5 text-amber-900">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Prompt optimizado para Comida para Llevar (Dentro de Recipientes)
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Este prompt instruye a la IA a colocar el plato <strong>directamente dentro de recipientes de take away abiertos</strong> (caja kraft biodegradable o bowl ecológico), con la salsa en tarrina hermética al lado y crujientes en bolsita separada. Prohíbe explícitamente platos tradicionales de porcelana.
              </p>
            </div>
          </div>
        )}

        {/* Pestañas: Personalizado vs Plantilla Maestra */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'custom' 
                  ? presentationMode === 'takeaway'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-lg'
                    : 'border-indigo-600 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wand2 size={14} />
              <span>Personalizado con esta Receta</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('template')}
              className={`px-4 py-2 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'template' 
                  ? 'border-slate-800 text-slate-900 bg-slate-100/70 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} />
              <span>Plantilla Maestra Base</span>
            </button>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
            Formato Horizontal 16:9
          </span>
        </div>

        {/* Cuerpo con el texto del prompt */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4 bg-slate-50/50">
          <div className="relative">
            <textarea
              readOnly
              value={activeText}
              rows={14}
              className="w-full font-mono text-xs text-slate-800 bg-white p-4 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner select-all leading-relaxed whitespace-pre-wrap"
            />
          </div>

          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-2.5">
            <ImageIcon className="text-slate-600 mt-0.5 shrink-0" size={16} />
            <div className="text-[11px] text-slate-700 leading-relaxed">
              <strong>Cómo usarlo:</strong> Copia este prompt, pégalo en tu generador de imágenes con IA (ChatGPT / DALL-E, Midjourney, Imagen 3, Leonardo) y guarda la imagen 16:9 generada. Luego podrás pegarla o arrastrarla en la portada de la ficha técnica.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === 'custom' ? `Personalizado para: ${recipeName || 'Receta'}` : 'Plantilla Maestra 16:9'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                presentationMode === 'takeaway'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              <Copy size={14} />
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
