
import React, { useState } from 'react';
import { Recipe, AppSettings, SubRecipe, Ingredient, AppUser, TakeAwayDetails, Product, Allergen } from '../types';
import { normalizeVideos, sanitizeVideoUrl } from '../lib/videoUtils';
import { isLiquidIngredient } from '../lib/unitUtils';
import { matchProductInCatalog, reconcileRecipeWithCatalog } from '../lib/productUtils';
import { calculateIngredientCost } from '../lib/costUtils';
import { ArrowLeft, Sparkles, Copy, Check, FileJson, AlertCircle, ShoppingBag, Utensils, Box, Clock } from 'lucide-react';

interface AIBridgeProps {
  settings: AppSettings;
  appUser: AppUser | null;
  productDatabase?: Product[];
  onBack: () => void;
  onImport: (recipe: Recipe) => void | Promise<void>;
}

export const AIBridge: React.FC<AIBridgeProps> = ({ settings, appUser, productDatabase, onBack, onImport }) => {
  const [bridgeMode, setBridgeMode] = useState<'standard' | 'takeaway'>('standard');
  const [jsonInput, setJsonInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const standardPrompt = `Actúa como un Chef Ejecutivo y experto en digitalización de datos gastronómicos.
Tu tarea es convertir el texto o imagen de una receta que te voy a proporcionar en un objeto JSON compatible con mi sistema de gestión de cocina.

REGLAS DE FORMATO:
1. Devuelve ÚNICAMENTE el código JSON, sin explicaciones ni texto adicional.
2. Esquema exacto:
{
  "name": "NOMBRE DE LA RECETA EN MAYÚSCULAS",
  "category": "${settings.categories?.join('|') || 'Entrantes|Carnes|Pescados|Postres'}",
  "yieldQuantity": 4, 
  "yieldUnit": "raciones",
  "allergens": ["Gluten", "Lácteos"],
  "presentation": "PRESENTACIÓN: Instrucciones detalladas de emplatado, arquitectura del plato, vajilla seleccionada y acabado visual antes del pase.",
  "importantNotes": "PUNTOS IMPORTANTES (SI LOS HAY): Puntos críticos de cocción, temperaturas límite de pase, control sanitario o advertencias.",
  "minimalistCard": {
    "miniComment": "Descripción sugerente y comercial del plato (máximo 1-2 frases elegantes para carta, destacando texturas y matices).",
    "summaryInstructions": "1. Síntesis paso 1... 2. Síntesis paso 2... 3. Acabado...",
    "platingTips": "Notas clave y directas de montaje y emplatado en pase."
  },
  "elaborations": [
    {
      "name": "Nombre de la elaboración (ej: Masa, Salsa, Principal)",
      "ingredients": [{"name": "BACALAO", "quantity": "0.960", "unit": "kg", "notes": "Lomo fresco desespinado (6 unidades de 160 g)"}],
      "instructions": "Pasos detallados..."
    }
  ],
  "notes": "Puntos críticos o consejos de emplatado",
  "serviceDetails": {
    "presentation": "Cómo emplatar",
    "importantNotes": "Puntos importantes si los hay",
    "servingTemp": "Temp ideal",
    "cutlery": "Cubiertos",
    "passTime": "Tiempo estimado",
    "serviceType": "Servicio a la Americana",
    "clientDescription": "Descripción sugerente para carta"
  }
}

REGLAS TÉCNICAS:
- "presentation": Apartado fundamental de PRESENTACIÓN (vajilla, disposición y pase).
- "importantNotes": Apartado de PUNTOS IMPORTANTES (SI LOS HAY) (temperatura, advertencias críticas).
- "notes" EN INGREDIENTES: Usa el campo "notes" para cualquier aclaración, corte, peso por unidad, calibre o especificación gastronómica (ej: "Lomo fresco desespinado (6 unidades de 160 g)"), dejando en "name" la denominación limpia del producto (ej: "BACALAO") para favorecer el casamiento con el inventario.
- "yieldQuantity" es el Rendimiento (PAX), SIEMPRE numérico.
- "yieldUnit" es la Unidad de Medida (ej: raciones, pax, personas).
- REGLA CRÍTICA DE UNIDADES: Ingredientes líquidos (leche, aceite, agua, vinos, caldos, nata, vinagre, etc.) deben expresarse SIEMPRE en volumen ('l' o 'ml'), NUNCA en 'kg' ni 'g'. Los sólidos en 'kg' o 'g'. Unidades sueltas en 'ud'.
- "allergens": Array con los alérgenos presentes entre los 14 de declaración obligatoria: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos.
- "minimalistCard": Sección obligatoria para la lámina de 1 solo folio A4:
  * "miniComment": 1 o 2 frases ultra-sugerentes y comerciales.
  * "summaryInstructions": Pasos de elaboración condensados y sintetizados para que quepan holgadamente en 1 folio.
  * "platingTips": Claves de emplatado rápido en el pase.
- Cantidades de ingredientes siempre numéricas o strings limpios (ej: "0.500").
- Si no hay datos de "servingTemp", "cutlery" o "passTime", deja esos campos vacíos "".

RECETA A DIGITALIZAR:
[PEGA AQUÍ TU RECETA O ESCANEO]`;

  const takeAwayPrompt = `Actúa como un Chef Ejecutivo especializado en TAKE AWAY, DELIVERY y COCINA DE 5ª GAMA (elaboración con consumo no inmediato y regeneración en casa).
Tu tarea es convertir o adaptar la receta que te voy a proporcionar en una Ficha Técnica Profesional para Take Away / Comida para Llevar en formato JSON compatible.

CRITERIOS CULINARIOS CRÍTICOS PARA TAKE AWAY:
1. DESFASE TEMPORAL Y CONSUMO DIFERIDO: El producto NO se consume de inmediato. Viaja de 20 a 45 min o se conserva refrigerado (24h-48h a 3-4°C).
2. TRATAMIENTO DE LOS ELEMENTOS:
   - Separar salsas y jugos en tarrinas herméticas independientes (para que el elemento principal no se humedezca ni absorba la salsa en exceso).
   - Separar crujientes, tejas y hierbas frescas en bolsitas o envases secos aparte para coronar en casa en el último segundo.
   - Puntos de cocción adaptados (ej: pasta al dente -2 minutos; pescados al 85% para no quedar secos al regenerar).
3. PACKAGING RECOMENDADO: Especificar envase (ej: cartón kraft termosellable microondable, tarrinas herméticas 50ml, caja ventilada para fritos).
4. PRESENTACIÓN Y PUNTOS IMPORTANTES:
   - PRESENTACIÓN: Disposición cuidada en el envase principal, separación de salsas y crujientes secos.
   - PUNTOS IMPORTANTES (SI LOS HAY): Directrices críticas de envasado, transporte sin vuelco y regeneración.
5. ENCARTE / INSTRUCCIONES PARA EL CLIENTE (CÓMO TERMINAR EN CASA):
   - Explicar método de regeneración (Microondas, Horno, Sartén, Baño María o Consumo en Frío) con tiempos y potencia precisos.
   - Explicar el emplatado final en casa ("verter la salsa caliente", "añadir el crujiente reservado").
6. ALÉRGENOS: Identificar con total rigor los alérgenos presentes entre los 14 legales.

REGLAS DE FORMATO:
Devuelve ÚNICAMENTE el código JSON, sin explicaciones ni texto adicional.
Esquema exacto:
{
  "name": "NOMBRE DEL PLATO PARA TAKE AWAY",
  "category": "${settings.categories?.join('|') || 'Entrantes|Carnes|Pescados|Arroces y Pastas|Postres'}",
  "yieldQuantity": 2,
  "yieldUnit": "raciones",
  "allergens": ["Gluten", "Lácteos"],
  "presentation": "PRESENTACIÓN: Disposición cuidada en el envase de take away principal, salsa en tarrina y crujientes aparte.",
  "importantNotes": "PUNTOS IMPORTANTES (SI LOS HAY): Dejar atemperar 2 min antes de tapar para evitar condensación, transportar en plano horizontal sin apilar más de 3 cajas.",
  "minimalistCard": {
    "miniComment": "Descripción sugerente y tentadora para la carta online o etiqueta del envase.",
    "summaryInstructions": "Pasos de cocina en el obrador para empaquetar.",
    "platingTips": "Instrucciones de disposición dentro del envase de transporte."
  },
  "elaborations": [
    {
      "name": "BASE O ELEMENTO PRINCIPAL (PRE-COCCIÓN AL 85%)",
      "ingredients": [{"name": "BACALAO", "quantity": "0.960", "unit": "kg", "notes": "Lomo fresco desespinado (6 unidades de 160 g)"}],
      "instructions": "Cocción cuidada para que no se pase en el transporte o regeneración..."
    },
    {
      "name": "SALSA / GUARNICIÓN (ENVASADO SEPARADO)",
      "ingredients": [{"name": "Producto", "quantity": "50", "unit": "g|ml"}],
      "instructions": "Elaboración de la salsa a envasar en tarrina hermética..."
    }
  ],
  "takeAwayDetails": {
    "isTakeAway": true,
    "targetServiceMode": "cook_and_chill",
    "packagingType": "Envase kraft microondable 750ml + tarrina hermética 60ml para salsa",
    "packagingNotes": "Dejar atemperar 2 min antes de tapar para evitar condensación de vapor. Salsa aparte en frío.",
    "shelfLife": "48 horas entre 2°C y 4°C",
    "conservationTemp": "2°C - 4°C en refrigeración",
    "transportTips": "Transportar en plano horizontal en bolsa térmica. No apilar más de 3 envases.",
    "homeFinishing": {
      "summaryText": "Breve frase apetitosa para el cliente (ej: 'Disfruta de este meloso terminado al punto en tu mesa').",
      "heatingMethod": "microwave",
      "heatingInstructions": "Abrir ligeramente la tapa del envase principal y calentar 2 minutos a 750W en microondas. Calentar la salsa 30 segundos aparte.",
      "platingSteps": "1. Verter la salsa caliente sobre el plato. 2. Abrir la bolsa del crujiente y espolvorear por encima antes de servir.",
      "storageCustomerNotes": "Conservar en nevera a 4°C si no se va a consumir de inmediato."
    }
  },
  "serviceDetails": {
    "presentation": "Embalaje y presentación en bolsa de reparto",
    "importantNotes": "Puntos importantes take away: cadena de frío, transporte horizontal, regeneración",
    "servingTemp": "Temp de entrega",
    "cutlery": "Kit cubiertos biodegradables",
    "passTime": "15 min",
    "serviceType": "Take Away / Delivery",
    "clientDescription": "Descripción comercial para web/carta delivery"
  }
}

RECETA O IDEA A ADAPTAR PARA TAKE AWAY:
[PEGA AQUÍ TU RECETA, INGREDIENTES O TEXTO]`;

  const activePrompt = bridgeMode === 'takeaway' ? takeAwayPrompt : standardPrompt;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePrompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleProcessJSON = async () => {
    try {
      setError(null);
      let rawInput = jsonInput.trim();

      // 1. Limpieza de bloques Markdown (```json ... ```)
      if (rawInput.includes('```')) {
        const match = rawInput.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (match && match[1]) {
          rawInput = match[1];
        }
      }

      // 2. Limpieza agresiva de Citas de IA (ej: [cite_start], [cite: 2])
      let cleaned = rawInput
        .replace(/\[cite_start\]/gi, '')
        .replace(/\[cite_end\]/gi, '')
        .replace(/\[cite:.*?\]/gi, '')
        .replace(/\\\[cite:.*?\\\]/gi, '');

      // 3. Extracción de bloque JSON: Buscar desde el primer { hasta el último }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No se ha detectado un objeto JSON válido (falta '{' o '}').");
      }

      const jsonString = cleaned.substring(firstBrace, lastBrace + 1);

      // 4. Parseo final
      const data = JSON.parse(jsonString);
      
      if (!data.name || (!data.elaborations && !data.subRecipes)) {
        throw new Error("El JSON no tiene la estructura de receta esperada.");
      }

      // Extraer alérgenos explícitos
      const validAllergens = [
        'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 
        'Soja', 'Lácteos', 'Frutos de cáscara', 'Apio', 'Mostaza', 
        'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
      ];
      const parsedAllergens: any[] = [];
      const rawAllergens = Array.isArray(data.allergens) 
        ? data.allergens 
        : (Array.isArray(data.minimalistCard?.allergens) ? data.minimalistCard.allergens : []);
      rawAllergens.forEach((a: string) => {
        const match = validAllergens.find(v => v.toLowerCase() === String(a).toLowerCase().trim());
        if (match && !parsedAllergens.includes(match)) {
          parsedAllergens.push(match);
        }
      });

      // Compatibilidad con campos que la IA podría nombrar diferente
      const rawSubRecipes = data.elaborations || data.subRecipes || [];

      // Convertir el formato de la IA al formato interno de la App
      const subRecipes: SubRecipe[] = rawSubRecipes.map((elab: any, idx: number) => ({
        id: `sr_${Date.now()}_${idx}`,
        name: (elab.name || 'Elaboración').toUpperCase(),
        instructions: elab.instructions || '',
        photos: [],
        videos: normalizeVideos(elab.videos, elab.videoUrl),
        ingredients: (elab.ingredients || []).map((ing: any, iIdx: number) => {
          const ingName = (ing.name || '').toUpperCase().trim();
          const matched = (productDatabase && productDatabase.length > 0) ? matchProductInCatalog(ingName, productDatabase) : undefined;
          const unit = ing.unit || matched?.unit || 'kg';
          const pricePerUnit = matched?.pricePerUnit || 0;
          const baseUnit = matched?.unit;
          const weightPerUnit = matched?.weightPerUnit;
          const allergens = matched?.allergens || [];
          const cost = calculateIngredientCost(String(ing.quantity || '0'), unit, pricePerUnit, baseUnit, weightPerUnit);
          const notes = ing.notes || ing.specification || ing.clarification || ing.note || '';
          return {
            id: `ing_${Date.now()}_${idx}_${iIdx}`,
            name: ingName,
            quantity: String(ing.quantity || '0'),
            unit,
            notes,
            allergens,
            pricePerUnit,
            baseUnit,
            weightPerUnit,
            category: matched?.category,
            cost: cost || 0
          };
        })
      }));

      const clientDesc = data.minimalistCard?.miniComment || 
                         data.serviceDetails?.clientDescription || 
                         '';

      const platingNotes = data.minimalistCard?.platingTips || 
                           data.notes || 
                           data.platingInstructions || 
                           '';

      const presentationNotes = data.presentation || 
                                data.serviceDetails?.presentation || 
                                data.minimalistCard?.presentation || 
                                platingNotes || 
                                '';

      const importantNotesText = data.importantNotes || 
                                 data.serviceDetails?.importantNotes || 
                                 data.minimalistCard?.importantNotes || 
                                 data.takeAwayDetails?.transportTips || 
                                 '';

      // Construir detalles de Take Away si el JSON los incluye o si estamos en modo take away
      let finalTakeAwayDetails: TakeAwayDetails | undefined = undefined;
      if (data.takeAwayDetails || bridgeMode === 'takeaway') {
        const rawTA = data.takeAwayDetails || {};
        const rawHF = rawTA.homeFinishing || {};
        finalTakeAwayDetails = {
          isTakeAway: true,
          targetServiceMode: rawTA.targetServiceMode || 'cook_and_chill',
          packagingType: rawTA.packagingType || 'Envase kraft microondable termosellable + tarrina para salsa',
          packagingNotes: rawTA.packagingNotes || '',
          shelfLife: rawTA.shelfLife || '48 horas',
          conservationTemp: rawTA.conservationTemp || '2°C - 4°C',
          transportTips: rawTA.transportTips || '',
          homeFinishing: {
            summaryText: rawHF.summaryText || clientDesc,
            heatingMethod: rawHF.heatingMethod || 'microwave',
            heatingInstructions: rawHF.heatingInstructions || (rawTA.heatingInstructions || 'Calentar 2 minutos a 750W en microondas con tapa entreabierta.'),
            platingSteps: rawHF.platingSteps || (rawTA.platingSteps || presentationNotes || platingNotes || 'Verter la salsa caliente y añadir los crujientes al final.'),
            storageCustomerNotes: rawHF.storageCustomerNotes || 'Conservar refrigerado si no se consume al instante.'
          }
        };
      }

      const newRecipe: Recipe = {
        id: `ai_${Date.now()}`,
        name: data.name.toUpperCase(),
        categories: [data.category || settings.categories?.[0] || 'Otros'],
        category: data.category || settings.categories?.[0] || 'Otros',
        photo: '',
        creator: appUser?.teacherName || appUser?.displayName || '',
        workspaceId: appUser?.workspaceId || '',
        isPublic: false,
        yieldQuantity: Number(data.yieldQuantity) || 1,
        yieldUnit: data.yieldUnit || 'raciones',
        subRecipes: subRecipes,
        videos: normalizeVideos(data.videos, data.sourceUrl || data.videoUrl),
        sourceUrl: sanitizeVideoUrl(data.sourceUrl) || '',
        presentation: presentationNotes,
        platingInstructions: presentationNotes || platingNotes,
        importantNotes: importantNotesText,
        extraAllergens: parsedAllergens,
        minimalistCard: {
          miniComment: clientDesc,
          summaryInstructions: data.minimalistCard?.summaryInstructions || '',
          platingTips: presentationNotes || platingNotes,
          presentation: presentationNotes,
          importantNotes: importantNotesText,
          allergens: parsedAllergens
        },
        serviceDetails: {
          presentation: presentationNotes,
          importantNotes: importantNotesText,
          servingTemp: data.serviceDetails?.servingTemp || '',
          cutlery: data.serviceDetails?.cutlery || '',
          passTime: data.serviceDetails?.passTime || '',
          serviceType: data.serviceDetails?.serviceType || (bridgeMode === 'takeaway' ? 'Take Away / Delivery' : 'Servicio a la Americana'),
          clientDescription: clientDesc
        },
        takeAwayDetails: finalTakeAwayDetails,
        lastModified: Date.now()
      };

      const reconciledRecipe = (productDatabase && productDatabase.length > 0)
        ? reconcileRecipeWithCatalog(newRecipe, productDatabase)
        : newRecipe;

      setIsProcessing(true);
      await onImport(reconciledRecipe);
      setJsonInput(''); 
    } catch (err: any) {
      console.error("Parse or save error:", err);
      setError("Error de Sintaxis o Guardado: Asegúrate de copiar el bloque JSON completo generado por la IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto w-full">
        {/* Cabecera y Selector de Modo de Digitalización */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white shadow-lg transition-colors ${bridgeMode === 'takeaway' ? 'bg-amber-600' : 'bg-emerald-500'}`}>
                {bridgeMode === 'takeaway' ? <ShoppingBag size={24} /> : <Sparkles size={24} />}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase">
                  Puente de Digitalización IA
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  {bridgeMode === 'takeaway' 
                    ? 'Protocolo Especial: Take Away, Delivery y Regeneración en Casa' 
                    : 'Digitalización Estándar para Servicio en Sala y Taller'}
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Modo */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
            <button
              onClick={() => setBridgeMode('standard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                bridgeMode === 'standard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Utensils size={14} /> Ficha Estándar (Sala)
            </button>
            <button
              onClick={() => setBridgeMode('takeaway')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                bridgeMode === 'takeaway'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag size={14} /> Take Away & Delivery 🥡
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* PASO 1: Prompt Maestro */}
          <div className={`rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group transition-colors ${
            bridgeMode === 'takeaway' ? 'bg-slate-950 border border-amber-500/20' : 'bg-slate-900'
          }`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 transition-all ${
              bridgeMode === 'takeaway' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
            }`}></div>
            
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className={`text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block ${
                  bridgeMode === 'takeaway' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}>Paso 1</span>
                {bridgeMode === 'takeaway' && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    Regeneración + Packaging + Alérgenos
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight mb-5">
                Copia el<br/>
                <span className={bridgeMode === 'takeaway' ? 'text-amber-400' : 'text-emerald-400'}>
                  {bridgeMode === 'takeaway' ? 'Prompt Especial Take Away' : 'Prompt Maestro Estándar'}
                </span>
              </h2>
              
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 mb-6 space-y-2">
                <div className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-wider ${
                  bridgeMode === 'takeaway' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {bridgeMode === 'takeaway' ? <ShoppingBag size={15} /> : <Sparkles size={15} />}
                  <span>{bridgeMode === 'takeaway' ? 'Ingeniería de Consumo Diferido' : 'Generación Gastronómica'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {bridgeMode === 'takeaway' ? (
                    <>
                      Este prompt instruye a la IA a <strong>separar salsas y crujientes</strong>, ajustar tiempos de precocción al 85%, especificar <strong>packaging óptimo</strong> y redactar el <strong>encarte con instrucciones de calentado y emplatado para el cliente en casa</strong>.
                    </>
                  ) : (
                    <>
                      Estructura los ingredientes, costes, tiempos de pase y descripción sugerente para servicio convencional en comedor o taller.
                    </>
                  )}
                </p>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
                Copia este prompt, pégalo en Gemini o ChatGPT junto con la receta que deseas digitalizar y luego vuelve con el código JSON.
              </p>
            </div>

            <button 
              onClick={handleCopyPrompt}
              className={`w-full py-4.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${
                copySuccess 
                  ? 'bg-emerald-500 text-white' 
                  : bridgeMode === 'takeaway'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                    : 'bg-white text-slate-900 hover:bg-emerald-50'
              }`}
            >
              {copySuccess ? <><Check size={20}/> ¡Prompt Copiado al Portapapeles!</> : <><Copy size={20}/> Copiar Prompt {bridgeMode === 'takeaway' ? 'Take Away' : 'Maestro'}</>}
            </button>
          </div>

          {/* PASO 2: Importación */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col shadow-xl border border-slate-100">
            <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block self-start">Paso 2</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-4">
              Importa el<br/>
              <span className={bridgeMode === 'takeaway' ? 'text-amber-600' : 'text-emerald-600'}>
                Resultado JSON
              </span>
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">
              Pega el código generado por la IA. El sistema limpiará las citas y estructurará automáticamente la ficha {bridgeMode === 'takeaway' ? 'con su protocolo de envasado y encarte de cliente' : 'técnica'}.
            </p>

            <div className="flex-grow flex flex-col gap-4">
              <div className="relative flex-grow">
                 <textarea 
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  className="w-full h-full min-h-[280px] p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none transition-all placeholder:text-slate-300"
                  placeholder={bridgeMode === 'takeaway' ? 'Pega el código JSON de la receta Take Away aquí...' : 'Pega el código JSON aquí...'}
                 />
              </div>

              {error && (
                <div className="flex items-start gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-fadeIn">
                   <AlertCircle size={20} className="shrink-0 mt-0.5" />
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tight">Error de Sintaxis Detectado</p>
                      <p className="text-[9px] font-bold opacity-80 leading-tight">{error}</p>
                   </div>
                </div>
              )}

              <button 
                onClick={handleProcessJSON}
                disabled={!jsonInput.trim() || isProcessing}
                className={`w-full py-4.5 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  bridgeMode === 'takeaway' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Guardando en recetario local...</span>
                  </>
                ) : (
                  <>
                    <FileJson size={20}/> Procesar e Importar {bridgeMode === 'takeaway' ? 'Ficha Take Away' : 'Receta'}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
