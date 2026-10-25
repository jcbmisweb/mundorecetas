import React, { useState } from 'react';
import { 
  ArrowLeft, Copy, Check, Sparkles, Wand2, Download, 
  Image as ImageIcon, Box, FileText, ExternalLink, BookOpen,
  ChevronRight, Lightbulb, CheckCircle2, Layers, ChefHat
} from 'lucide-react';
import { Recipe, AppSettings } from '../types';

interface PromptHubProps {
  recipes: Recipe[];
  settings: AppSettings;
  onBack: () => void;
  onNavigateToAIBridge?: () => void;
}

type PromptTab = 'image_standard' | 'image_takeaway' | 'digitalize_standard' | 'digitalize_takeaway' | 'pastry_infographic';

export const PromptHub: React.FC<PromptHubProps> = ({
  recipes,
  settings,
  onBack,
  onNavigateToAIBridge
}) => {
  const [activeTab, setActiveTab] = useState<PromptTab>('image_standard');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) || null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper para construir el texto de una receta para incrustar en el prompt
  const formatRecipeForPrompt = (r: Recipe | null): string => {
    if (!r) {
      return `[PEGAR AQUÍ LA FICHA COMPLETA DEL PLATO: NOMBRE, CATEGORÍA, ELABORACIONES, INGREDIENTES Y TÉCNICAS]`;
    }

    const elaboracionesText = r.subRecipes.map((sub, idx) => {
      const ings = (sub.ingredients || []).map(i => `  • ${i.name}: ${i.quantity} ${i.unit}`).join('\n');
      return `Elaboración ${idx + 1}: ${sub.name}
Ingredientes:
${ings || '  • No especificados'}
Instrucciones: ${sub.instructions || 'Técnica descrita en ficha.'}`;
    }).join('\n\n');

    return `NOMBRE DEL PLATO: ${r.name}
CATEGORÍA: ${r.category || (r.categories ? r.categories.join(', ') : 'Cocina de Autor')}
PAX / RACIONES: ${r.yieldQuantity} ${r.yieldUnit || 'pax'}
DESCRIPCIÓN COMERCIAL: "${r.minimalistCard?.miniComment || r.serviceDetails?.clientDescription || 'Presentación de alta gastronomía.'}"

ELABORACIONES TÉCNICAS:
${elaboracionesText}

EMPLATADO Y SERVICIO:
${r.platingInstructions || r.serviceDetails?.presentation || 'Emplatado contemporáneo sobre vajilla artesanal.'}
Temperatura de servicio: ${r.serviceDetails?.servingTemp || 'Óptima de cocina'}
Cubertería: ${r.serviceDetails?.cutlery || 'Estándar gastronómico'}
${r.takeAwayDetails?.isTakeAway ? `\nDETALLES DE TAKE AWAY / PACKAGING:\nEnvase: ${r.takeAwayDetails.packagingType || 'Envase kraft microondable'}\nConservación: ${r.takeAwayDetails.shelfLife || '48h'} (${r.takeAwayDetails.conservationTemp || '2-4ºC'})\nRegeneración comensal: ${r.takeAwayDetails.homeFinishing?.heatingInstructions || 'Calentar 2 min en microondas.'}` : ''}`;
  };

  // =========================================================================
  // 1. PROMPT MAESTRO UNIVERSAL — LÁMINA GASTRONÓMICA DOBLE (PLATOS NORMALES)
  // =========================================================================
  const getStandardImagePrompt = (): string => {
    const recipeBlock = formatRecipeForPrompt(selectedRecipe);

    return `# PROMPT MAESTRO UNIVERSAL — LÁMINA GASTRONÓMICA DOBLE: ILUSTRACIÓN TÉCNICA + FOTOGRAFÍA HIPERREALISTA

## 1. OBJETIVO PRINCIPAL

Generar una única lámina gastronómica editorial de alta calidad que combine dos representaciones complementarias del mismo plato:

1. Una ilustración culinaria técnica, elegante y explicativa, inspirada en las láminas de los grandes recetarios de alta cocina.
2. Una fotografía gastronómica hiperrealista del plato terminado, con la calidad visual de una publicación profesional de gastronomía y restauración de alta gama.

Ambas representaciones deben corresponder exactamente a la ficha técnica proporcionada. No deben representar dos platos diferentes, dos recetas alternativas ni dos interpretaciones incompatibles.

La ilustración debe permitir comprender la arquitectura del emplatado, reconocer sus componentes y visualizar cómo se relacionan entre sí.

La fotografía debe mostrar el resultado final del mismo plato, respetando los ingredientes, las proporciones, la estructura, las texturas y la presentación definidas en la ficha.

El resultado debe parecer una página especialmente diseñada para un libro de cocina de autor, un recetario profesional, un dossier de alta gastronomía o una publicación culinaria editorial.

No generar una colección de imágenes independientes. Generar una única composición horizontal integrada que contenga ambos paneles.

## 2. FORMATO Y DIMENSIONES

Formato obligatorio: horizontal apaisado 16:9.

Resolución: la máxima calidad disponible, preferentemente 4K o equivalente de alta resolución.

Composición adecuada para:
- Recetarios digitales.
- Libros de cocina.
- Fichas técnicas de platos.
- Dossieres gastronómicos.
- Presentaciones profesionales.
- Publicaciones editoriales.
- Catálogos de restauración.

La composición debe conservar su legibilidad tanto en pantalla como al incorporarse a una página de receta.

No utilizar formato cuadrado, vertical, collage de múltiples fotografías ni mosaicos de imágenes.

La imagen final debe ser una sola lámina panorámica coherente, equilibrada y visualmente sofisticada.

## 3. DISTRIBUCIÓN GENERAL DE LA COMPOSICIÓN

Dividir visualmente la imagen en dos paneles principales:

PANEL IZQUIERDO: aproximadamente el 45 % de la anchura total.
PANEL DERECHO: aproximadamente el 55 % de la anchura total.

El panel izquierdo contendrá la ilustración técnica del plato.

El panel derecho contendrá la fotografía hiperrealista del plato terminado.

Separar ambos paneles mediante una transición discreta, una división vertical muy fina o un cambio sutil de superficie. No utilizar marcos gruesos ni divisiones que parezcan una plantilla publicitaria.

La composición debe mantener una jerarquía visual clara:
- Primero debe llamar la atención el plato fotografiado.
- Después debe descubrirse la ilustración técnica.
- Finalmente deben poder leerse las etiquetas de los componentes.

Ambos paneles deben compartir una paleta cromática, una temperatura de color y una dirección artística coherentes.

Dejar márgenes de seguridad suficientes en los bordes para evitar que los elementos importantes queden cortados.

Evitar espacios vacíos accidentales, amontonamiento de elementos y desequilibrios de peso visual.

## 4. PANEL IZQUIERDO: ILUSTRACIÓN TÉCNICA DEL EMPLATADO

Crear una ilustración gastronómica editorial dibujada a mano, inspirada en los cuadernos de chef, las láminas técnicas de pastelería de autor y los recetarios ilustrados de alta cocina.

### Estilo gráfico

Combinar delicadamente:
- Dibujo de observación con lápiz fino.
- Contornos realizados con tinta de precisión.
- Acuarela sutil y translúcida.
- Textura ligera de papel artístico.
- Sombras dibujadas con rayado fino.
- Colores naturales y fieles a los alimentos.
- Volumen tridimensional representado mediante técnicas tradicionales de ilustración.

El acabado debe ser artesanal, sofisticado, didáctico y elegante.

La ilustración debe parecer realizada por un ilustrador gastronómico profesional que trabaja directamente con un chef.

No utilizar estética infantil, caricaturesca, cómica, esquemática, de cómic, vectorial ni de infografía corporativa.

No convertir la ilustración en una fotografía con filtros. Debe tener una identidad claramente dibujada a mano.

### Representación del plato

Mostrar el plato terminado con una perspectiva suficientemente clara para comprender la disposición de todos sus componentes.

Elegir automáticamente la perspectiva más apropiada según la geometría del plato:
- Perspectiva de tres cuartos para platos con volumen y estructuras verticales.
- Vista ligeramente superior para composiciones de varias capas.
- Vista cenital cuando sea necesaria para comprender una distribución circular o geométrica.
- Vista seccionada o parcialmente abierta únicamente cuando ayude a mostrar el interior real de un componente.

Representar fielmente las formas, los tamaños relativos, las alturas, las capas, los rellenos, las coberturas y las guarniciones.

Si el plato tiene una construcción vertical, mostrar claramente su base, sus elementos intermedios y sus componentes superiores.

Si el plato tiene varias elaboraciones independientes, mantenerlas visualmente diferenciadas.

Si contiene espumas, cremas, mousses, salsas, geles, crujientes, masas, carnes, pescados, verduras o frutas, representar sus texturas de manera reconocible.

Si existe un corte, una sección o un interior relevante, mostrarlo únicamente cuando esté respaldado por la ficha técnica o por las referencias aportadas.

No inventar capas interiores, rellenos, ingredientes ocultos ni técnicas que no estén documentadas.

### Etiquetas técnicas

Añadir etiquetas discretas para identificar los componentes principales y las elaboraciones relevantes.

Las etiquetas deben tener una tipografía limpia, elegante y perfectamente legible.

Utilizar líneas guía finas, flechas pequeñas o conectores sencillos que relacionen cada nombre con el componente correcto.

Las líneas no deben atravesar innecesariamente el plato ni ocultar detalles importantes.

Priorizar una distribución ordenada, con líneas cortas y sin cruces cuando sea posible.

Mantener las etiquetas cerca del elemento señalado y dentro de los límites del panel izquierdo.

Mostrar únicamente nombres presentes en la ficha técnica o derivados directamente de ella.

No inventar nombres de elaboraciones, ingredientes, cantidades, temperaturas, tiempos, porcentajes ni datos técnicos.

Respetar exactamente la ortografía y la denominación de los ingredientes.

Si el texto disponible es demasiado extenso, utilizar nombres breves fieles a la ficha y dejar las explicaciones completas para la receta escrita.

No añadir títulos, subtítulos, números de pasos ni textos decorativos salvo que se soliciten expresamente.

### Fidelidad técnica

La ilustración no debe modificar la receta para hacerla visualmente más espectacular.

No añadir decoraciones, flores, brotes, frutas, salsas, polvos, perlas ni elementos que no estén especificados.

No eliminar ingredientes que desempeñen un papel esencial en la identidad del plato.

No sustituir técnicas de presentación por otras más sencillas.

El objetivo es explicar el plato real, no diseñar una versión alternativa.

## 5. PANEL DERECHO: FOTOGRAFÍA GASTRONÓMICA HIPERREALISTA

Generar una fotografía gastronómica profesional del plato terminado, como si hubiera sido realizada por un fotógrafo especializado en alta cocina para una revista gastronómica de prestigio.

### Nivel de realismo

El resultado debe ser indistinguible, en estilo y apariencia, de una fotografía culinaria real de alta calidad.

Utilizar:
- Texturas alimentarias naturales.
- Superficies físicamente creíbles.
- Volúmenes realistas.
- Reflejos y brillos propios de cada ingrediente.
- Sombras naturales.
- Humedad realista cuando corresponda.
- Imperfecciones sutiles propias de los alimentos reales.
- Profundidad óptica natural.
- Nitidez selectiva.
- Colorimetría editorial sofisticada.

Evitar por completo la apariencia de renderizado digital, imagen sintética, modelado 3D, plástico, porcelana artificial o ilustración.

No crear alimentos deformes, duplicados, fusionados, flotantes o físicamente imposibles.

### Composición fotográfica

El plato debe ocupar aproximadamente entre el 65 % y el 80 % del espacio visual disponible en su panel, sin quedar cortado de manera accidental.

Elegir una perspectiva profesional que favorezca al plato y muestre claramente los elementos más importantes.

Preferir una perspectiva de unos 45 grados para platos con volumen, capas o estructuras verticales.

Utilizar una perspectiva ligeramente superior cuando permita reconocer mejor los ingredientes y el emplatado.

Reservar la vista cenital para platos cuya distribución geométrica o presentación lo requiera.

La composición debe ser limpia, equilibrada, elegante y natural.

El elemento principal debe encontrarse enfocado con gran precisión.

Mantener el fondo suavemente desenfocado, con una profundidad de campo óptica creíble.

No desenfocar ingredientes importantes ni ocultar las partes esenciales del plato.

### Iluminación

Utilizar iluminación lateral suave, natural y controlada, como la de un estudio de fotografía gastronómica profesional.

Crear:
- Volumen y profundidad.
- Sombras delicadas.
- Reflejos controlados.
- Transiciones suaves entre luces y sombras.
- Una textura claramente visible en cada ingrediente.
- Una atmósfera sofisticada y apetecible.

Evitar flash frontal duro, iluminación plana, brillos quemados, contraste excesivo, saturación artificial y sombras negras sin detalle.

La iluminación debe adaptarse a la naturaleza del plato, manteniendo una estética coherente con el resto del recetario.

### Vajilla y superficie

Seleccionar automáticamente una vajilla que favorezca la receta y respete cualquier indicación explícita de la ficha.

Priorizar platos de cerámica artesanal, porcelana de alta calidad, acabados mate, tonos neutros y formas contemporáneas.

Elegir superficies como piedra natural, madera elegante, cerámica, mármol o materiales neutros según el carácter del plato.

La vajilla debe complementar el emplatado sin competir con él.

Si la ficha especifica una vajilla concreta, esa indicación tiene prioridad absoluta.

No añadir cubiertos, copas, servilletas, recipientes, manos ni elementos de atrezzo innecesarios.

No incorporar elementos decorativos que distraigan de la comida.

### Realismo de los ingredientes

Representar cada ingrediente según su naturaleza física:
- Pescados: fibras, láminas, humedad y reflejos propios de su carne.
- Carnes: fibras musculares, dorado, jugos y textura de cocción cuando corresponda.
- Verduras: estructura celular, frescura, cortes limpios y colores naturales.
- Frutas: piel, pulpa, brillo y oxidación únicamente cuando proceda.
- Espumas y mousses: burbujas, aireación, densidad y estabilidad coherentes con la elaboración.
- Salsas y emulsiones: viscosidad, reflejos y fluidez realistas.
- Geles y esferificaciones: transparencia, tensión superficial y volumen físicamente creíbles.
- Panes y crujientes: espesor, porosidad, fractura y textura seca.
- Cremas: densidad, suavidad y acabado natural.
- Arroces y cereales: granos diferenciados y proporciones realistas.
- Masas y pastelería: estructura, capas, migas y acabados coherentes con la técnica descrita.

No exagerar brillos, cremosidad, tamaño de ingredientes ni intensidad de color.

No transformar una elaboración real en una textura genérica.

## 6. COHERENCIA OBLIGATORIA ENTRE LA ILUSTRACIÓN Y LA FOTOGRAFÍA

Este apartado tiene prioridad sobre las decisiones puramente estéticas.

Ambos paneles deben mostrar el mismo plato.

Deben coincidir:
- Los ingredientes principales.
- Los componentes secundarios.
- Las salsas y las guarniciones.
- La estructura general.
- La relación entre las capas.
- La ubicación de los elementos principales.
- La orientación de los componentes relevantes.
- La vajilla, cuando corresponda.
- La identidad cromática del plato.

La ilustración puede simplificar ciertos detalles fotográficos para mejorar su claridad didáctica, pero no debe alterar la composición real.

La fotografía puede mostrar las texturas con más detalle, pero no debe incorporar elementos que no aparezcan en la ficha.

Si la ilustración muestra un componente a la izquierda del plato, no colocarlo arbitrariamente en el extremo contrario de la fotografía cuando su posición sea importante para comprender el montaje.

Si la receta describe una estructura vertical, conservar esa estructura en ambos paneles.

La imagen debe transmitir que la ilustración y la fotografía son dos formas complementarias de documentar una misma creación culinaria.

## 7. FONDO, PALETA CROMÁTICA E IDENTIDAD VISUAL

Establecer una identidad editorial uniforme para toda la colección de recetas.

Utilizar una paleta discreta de tonos naturales:
- Marfil.
- Blanco cálido.
- Beige suave.
- Piedra natural.
- Grises neutros.
- Tonos tierra.
- Colores reales de los ingredientes.

Los tonos principales del plato deben conservar su color natural.

El fondo puede ser claro u oscuro según la receta, pero debe favorecer la lectura visual de los alimentos.

Para platos delicados, frescos o de colores luminosos, favorecer superficies claras y cálidas.

Para platos intensos, tostados, ahumados o de presentación dramática, permitir fondos más profundos y oscuros.

No aplicar una dominante de color artificial a toda la composición.

Mantener una estética de recetario contemporáneo de alta cocina: sobria, refinada, natural, elegante y atemporal.

No utilizar efectos gráficos llamativos, degradados digitales, ornamentos excesivos ni diseños propios de anuncios comerciales.

## 8. TIPOGRAFÍA Y USO DEL TEXTO

El texto debe cumplir una función técnica y nunca competir con la comida.

Utilizar una tipografía legible, elegante y discreta para las etiquetas.

Respetar los nombres exactos de los ingredientes.

No generar palabras inventadas, letras deformadas, caracteres aleatorios ni etiquetas que apunten al ingrediente equivocado.

No añadir títulos promocionales, eslóganes, logotipos, nombres de restaurantes, marcas de agua ni textos publicitarios.

No añadir cantidades, tiempos o temperaturas que no estén indicados en la ficha.

Si no es posible reproducir correctamente un texto largo, reducir el número de etiquetas y mantener únicamente las denominaciones esenciales, sin sustituirlas por texto falso.

La prioridad es una imagen limpia, precisa y profesional.

## 9. REGLAS DE FIDELIDAD A LA FICHA TÉCNICA

La ficha técnica es la fuente principal de verdad.

Respetar estrictamente:
- Nombre del plato.
- Ingredientes principales.
- Ingredientes secundarios.
- Elaboraciones.
- Salsas.
- Guarniciones.
- Texturas.
- Cortes.
- Temperaturas de servicio, cuando afecten a la apariencia.
- Técnicas de preparación.
- Orden de montaje.
- Estructura del emplatado.
- Vajilla indicada.
- Acabados.
- Elementos visuales especiales.

No inventar ingredientes para embellecer el plato.

No eliminar elementos importantes por razones estéticas.

No cambiar una espuma por una crema, una gelatina por una salsa o un crujiente por una decoración diferente.

No cambiar el tipo de pescado, carne, fruta, verdura o queso.

No añadir hierbas, flores, semillas, frutos secos, polvos o salsas si no aparecen en la receta.

No interpretar las indicaciones ausentes como permiso para cambiar la identidad del plato.

Cuando falten detalles visuales secundarios, resolverlos con criterio profesional y discreto, sin alterar el concepto gastronómico.

Si la ficha contiene información contradictoria, priorizar los ingredientes explícitos y las instrucciones de montaje más concretas.

## 10. USO DE LAS IMÁGENES DE REFERENCIA

Si se adjunta una fotografía real del plato, utilizarla como referencia prioritaria de su apariencia, ingredientes, colores, geometría y presentación.

Si se adjunta una ilustración técnica, utilizarla como referencia del estilo de dibujo, las etiquetas y la explicación visual del emplatado.

Si se adjuntan ambas, utilizarlas de forma complementaria:
- La fotografía de referencia determina la apariencia real del plato.
- La ilustración de referencia determina el lenguaje gráfico de la parte técnica.
- La ficha técnica determina los ingredientes y las características que deben respetarse.

No copiar accidentalmente ingredientes de otra receta representada en una referencia estilística.

No mezclar platos distintos.

No sustituir la receta actual por la que aparezca en una imagen de inspiración.

## 11. CONTROL DE CALIDAD ANTES DE GENERAR

Verificar conceptualmente que se cumplen todos estos criterios:

1. La imagen es horizontal y apaisada, en formato 16:9.
2. Existe una única composición integrada.
3. La ilustración técnica ocupa el panel izquierdo.
4. La fotografía hiperrealista ocupa el panel derecho.
5. Ambas partes representan el mismo plato.
6. Los ingredientes importantes están presentes.
7. No hay ingredientes inventados.
8. Las proporciones son realistas.
9. La ilustración es elegante, dibujada a mano y comprensible.
10. La fotografía tiene un acabado gastronómico editorial profesional.
11. Las etiquetas son breves, correctas y están bien conectadas.
12. La vajilla y el fondo complementan el plato.
13. No hay personas, manos, logotipos ni marcas de agua.
14. No aparecen elementos deformados, duplicados o físicamente imposibles.
15. La composición es adecuada para integrarse en una receta profesional.
16. La estética puede mantenerse coherente con las demás imágenes del recetario.

Si algún detalle no puede representarse con precisión, simplificarlo antes que inventar información.

## 12. RESULTADO FINAL SOLICITADO

Generar directamente una única lámina gastronómica editorial en formato apaisado 16:9, de alta resolución, con una ilustración técnica dibujada a mano a la izquierda y una fotografía gastronómica hiperrealista del plato terminado a la derecha.

Ambas representaciones deben ser coherentes, fieles a la ficha técnica y visualmente complementarias.

La imagen debe transmitir precisión culinaria, sensibilidad artística, calidad editorial y excelencia gastronómica.

Debe parecer una página de un recetario de alta cocina realizado por un chef, un ilustrador gastronómico y un fotógrafo profesional.

No explicar el proceso. No devolver el prompt. No producir una descripción textual en lugar de la imagen.

Generar directamente la imagen solicitada a partir de la siguiente ficha técnica:

---

# FICHA TÉCNICA DEL PLATO

${recipeBlock}

# REFERENCIAS VISUALES

[ADJUNTAR, SI EXISTEN, LA FOTOGRAFÍA DEL PLATO, LA ILUSTRACIÓN DE REFERENCIA O AMBAS]`;
  };

  // =========================================================================
  // 2. PROMPT MAESTRO — LÁMINA DOBLE 16:9 TAKE AWAY & PACKAGING
  // =========================================================================
  const getTakeAwayImagePrompt = (): string => {
    const recipeBlock = formatRecipeForPrompt(selectedRecipe);

    return `# PROMPT MAESTRO — LÁMINA GASTRONÓMICA DOBLE TAKE AWAY / PACKAGING (16:9)

## 1. OBJETIVO PRINCIPAL
Generar una única lámina gastronómica editorial y publicitaria en formato horizontal apaisado 16:9, especializada en TAKE AWAY, DELIVERY GOURMET Y 5ª GAMA (elaboración para consumo no inmediato).

La imagen debe combinar dos representaciones complementarias del mismo plato dentro de su packaging y recipientes para llevar:
1. Panel Izquierdo (45%): Ilustración culinaria técnica del envase kraft y recipientes abiertos, mostrando la disposición de los componentes y recipientes satélites (salsas, crujientes).
2. Panel Derecho (55%): Fotografía gastronómica hiperrealista del plato dispuesto directamente DENTRO del envase de take away abierto, con la frescura, el brillo y el apetito de la alta cocina a domicilio.

## 2. FORMATO Y COMPOSICIÓN
- Proporción obligatoria: 16:9 horizontal panorámico.
- Resolución máxima: 4K / Ultra HD.
- Transición limpia entre la lámina dibujada a mano y la fotografía real.

## 3. PANEL IZQUIERDO — ILUSTRACIÓN TÉCNICA DEL PACKAGING Y DISPOSICIÓN
- Estilo: Dibujo técnico a mano con plumilla fina, tinta de precisión y acuarelas translúcidas sobre textura de papel kraft / algodón.
- Representación:
  * Mostrar el envase principal de take away abierto (caja rectangular de cartón kraft biodegradable de diseño contemporáneo o bowl ecológico).
  * Mostrar la distribución de los componentes dentro del recipiente con líneas y etiquetas técnicas limpias.
  * Al lado, ilustrar la tarrina hermética pequeña para la salsa con su tapita, y el sobre o bolsita seca para los elementos crujientes o hierbas de toque final.
  * Etiquetas discretas señalando cada elemento ("Elemento Base", "Salsa aparte", "Crujiente reservado").

## 4. PANEL DERECHO — FOTOGRAFÍA HIPERREALISTA EN ENVASE DE TAKE AWAY
- Estilo fotográfico: Fotografía publicitaria de alta gastronomía para delivery gourmet.
- REGLA CRÍTICA ESTRICTA: NO USAR PLATOS DE PORCELANA DE MESA. La comida debe estar emplatada directamente en el recipiente de comida para llevar (caja kraft natural abierta o bowl contemporáneo de bagazo de caña).
- Acompañamiento en escena:
  * Tarrina hermética de salsa abierta al lado del envase principal, mostrando el brillo y la textura de la salsa.
  * Bolsita kraft con el crujiente abierto o recién espolvoreado por encima.
  * Cubiertos ecológicos de madera pulida / bambú y servilleta de kraft doblada con pulcritud.
  * Al fondo sutilmente desenfocada, una bolsa de papel kraft de reparto sin logos comerciales.
- Iluminación: Luz lateral suave de estudio, resaltando las texturas, jugosidad de la cocción, brillo de la salsa y dorados crujientes.
- Perspectiva: 45 grados cenital moderada que permita apreciar el interior del envase y su profundidad.

## 5. COHERENCIA OBLIGATORIA
Ambos paneles deben representar exactamente el mismo tipo de packaging, los mismos alimentos y la misma presentación para llevar.

---

# INFORMACIÓN DE LA FICHA TÉCNICA TAKE AWAY

${recipeBlock}`;
  };

  // =========================================================================
  // 3. PROMPT DE DIGITALIZACIÓN — RECETAS Y PLATOS NORMALES (JSON)
  // =========================================================================
  const getStandardDigitalizationPrompt = (): string => {
    return `Actúa como un Chef Ejecutivo y experto en digitalización de datos gastronómicos.
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
  "minimalistCard": {
    "miniComment": "Descripción sugerente y comercial del plato (máximo 1-2 frases elegantes para carta, destacando texturas y matices).",
    "summaryInstructions": "1. Síntesis paso 1... 2. Síntesis paso 2... 3. Acabado...",
    "platingTips": "Notas clave y directas de montaje y emplatado en pase."
  },
  "elaborations": [
    {
      "name": "Nombre de la elaboración (ej: Masa, Salsa, Principal)",
      "ingredients": [{"name": "Producto", "quantity": "100", "unit": "g|kg|ml|l|ud"}],
      "instructions": "Pasos detallados..."
    }
  ],
  "notes": "Puntos críticos o consejos de emplatado",
  "serviceDetails": {
    "presentation": "Cómo emplatar",
    "servingTemp": "Temp ideal",
    "cutlery": "Cubiertos",
    "passTime": "Tiempo estimado",
    "serviceType": "Servicio a la Americana",
    "clientDescription": "Descripción sugerente para carta"
  }
}

REGLAS TÉCNICAS:
- "yieldQuantity" es el Rendimiento (PAX), SIEMPRE numérico.
- "yieldUnit" es la Unidad de Medida (ej: raciones, pax, personas).
- "allergens": Array con los alérgenos presentes entre los 14 de declaración obligatoria: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos.
- "minimalistCard": Sección obligatoria para la lámina de 1 solo folio A4:
  * "miniComment": 1 o 2 frases ultra-sugerentes y comerciales.
  * "summaryInstructions": Pasos de elaboración condensados y sintetizados para que quepan holgadamente en 1 folio.
  * "platingTips": Claves de emplatado rápido en el pase.
- Cantidades de ingredientes siempre numéricas o strings limpios (ej: "0.500").
- Si no hay datos de "servingTemp", "cutlery" o "passTime", deja esos campos vacíos "".

RECETA A DIGITALIZAR:
[PEGA AQUÍ TU RECETA, FOTO O ESCANEO]`;
  };

  // =========================================================================
  // 4. PROMPT DE DIGITALIZACIÓN — TAKE AWAY & 5ª GAMA (JSON)
  // =========================================================================
  const getTakeAwayDigitalizationPrompt = (): string => {
    return `Actúa como un Chef Ejecutivo especializado en TAKE AWAY, DELIVERY y COCINA DE 5ª GAMA (elaboración con consumo no inmediato y regeneración en casa).
Tu tarea es convertir o adaptar la receta que te voy a proporcionar en una Ficha Técnica Profesional para Take Away / Comida para Llevar en formato JSON compatible.

CRITERIOS CULINARIOS CRÍTICOS PARA TAKE AWAY:
1. DESFASE TEMPORAL Y CONSUMO DIFERIDO: El producto NO se consume de inmediato. Viaja de 20 a 45 min o se conserva refrigerado (24h-48h a 3-4°C).
2. TRATAMIENTO DE LOS ELEMENTOS:
   - Separar salsas y jugos en tarrinas herméticas independientes (para que el elemento principal no se humedezca ni absorba la salsa en exceso).
   - Separar crujientes, tejas y hierbas frescas en bolsitas o envases secos aparte para coronar en casa en el último segundo.
   - Puntos de cocción adaptados (ej: pasta al dente -2 minutos; pescados al 85% para no quedar secos al regenerar).
3. PACKAGING RECOMENDADO: Especificar envase (ej: cartón kraft termosellable microondable, tarrinas herméticas 50ml, caja ventilada para fritos).
4. ENCARTE / INSTRUCCIONES PARA EL CLIENTE (CÓMO TERMINAR EN CASA):
   - Explicar método de regeneración (Microondas, Horno, Sartén, Baño María o Consumo en Frío) con tiempos y potencia precisos.
   - Explicar el emplatado final en casa ("verter la salsa caliente", "añadir el crujiente reservado").
5. ALÉRGENOS: Identificar con total rigor los alérgenos presentes entre los 14 legales.

REGLAS DE FORMATO:
Devuelve ÚNICAMENTE el código JSON, sin explicaciones ni texto adicional.
Esquema exacto:
{
  "name": "NOMBRE DEL PLATO PARA TAKE AWAY",
  "category": "${settings.categories?.join('|') || 'Entrantes|Carnes|Pescados|Arroces y Pastas|Postres'}",
  "yieldQuantity": 2,
  "yieldUnit": "raciones",
  "allergens": ["Gluten", "Lácteos"],
  "minimalistCard": {
    "miniComment": "Descripción sugerente y tentadora para la carta online o etiqueta del envase.",
    "summaryInstructions": "Pasos de cocina en el obrador para empaquetar.",
    "platingTips": "Instrucciones de disposición dentro del envase de transporte."
  },
  "elaborations": [
    {
      "name": "BASE O ELEMENTO PRINCIPAL (PRE-COCCIÓN AL 85%)",
      "ingredients": [{"name": "Producto", "quantity": "100", "unit": "g|kg|ml|l|ud"}],
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
    "servingTemp": "Temp de entrega",
    "cutlery": "Kit cubiertos biodegradables",
    "passTime": "15 min",
    "serviceType": "Take Away / Delivery",
    "clientDescription": "Descripción comercial para web/carta delivery"
  }
}

RECETA O IDEA A ADAPTAR PARA TAKE AWAY:
[PEGA AQUÍ TU RECETA, INGREDIENTES O TEXTO]`;
  };

  const getPastryInfographicPrompt = (): string => {
    return `# ESTILO VISUAL OBLIGATORIO: INFOGRAFÍAS DE LA ESCUELA DE REPOSTERÍA PROFESIONAL

Utiliza la imagen de referencia adjunta como **modelo visual obligatorio** para crear todas las infografías de recetas y procesos de pastelería.

Todas las infografías deben parecer parte de una misma colección educativa, con una identidad gráfica uniforme. La receta cambiará, pero el diseño general debe mantenerse.

## 1. IMITA EL DISEÑO DE LA IMAGEN DE REFERENCIA

Reproduce su estilo visual siguiendo estas características:

- **Formato:** vertical A4, composición de página completa.
- **Fondo:** blanco o blanco cálido, limpio y luminoso.
- **Marco:** líneas finas negras alrededor de la composición.
- **Colores principales:** negro para títulos y textos, dorado suave para números, detalles, líneas y elementos destacados.
- **Tipografía:** títulos grandes, negros, en mayúsculas y con negrita; subtítulos compactos y textos técnicos pequeños pero legibles.
- **Ilustraciones:** dibujos detallados, semirrealistas, con aspecto de ilustración gastronómica profesional.
- **Distribución:** secciones claramente separadas mediante líneas horizontales, con una composición ordenada y compacta.
- **Identidad corporativa:** incorpora el nombre «ESCUELA DE REPOSTERÍA PROFESIONAL» y un pequeño emblema de repostería en las esquinas, siguiendo la referencia. Mantén el diseño discreto y coherente.
- **Estética:** infografía técnica de escuela profesional de pastelería, didáctica, elegante, precisa y visualmente atractiva.

## 2. ESTRUCTURA FIJA DE TODAS LAS INFOGRAFÍAS

Adapta el contenido de cada receta a esta estructura:

**CABECERA**
Título «PASO A PASO: [NOMBRE DE LA ELABORACIÓN]», con el nombre del producto destacado en letras grandes y una ilustración atractiva del resultado final.

**SECCIÓN 1. INGREDIENTES Y MATERIAL**
Coloca los ingredientes y sus cantidades en una columna. Sitúa al lado los utensilios y equipos esenciales, representados con pequeños dibujos identificables.

**SECCIÓN 2. PROCESO VISUAL DE ELABORACIÓN**
Es la parte principal de la infografía. Divide el procedimiento en etapas numeradas con círculos dorados. Cada etapa debe incluir:
- Un título corto.
- Una explicación técnica breve.
- Temperaturas, tiempos o medidas relevantes.
- Una ilustración clara de la acción que se está realizando.
- Flechas que indiquen el orden correcto del proceso.

Distribuye las etapas de izquierda a derecha y de arriba abajo, como en la referencia. Utiliza imágenes del proceso real, no iconos genéricos cuando sea posible.

**SECCIÓN 3. PARÁMETROS TÉCNICOS CLAVE**
Incluye una franja horizontal destacada con las temperaturas, tiempos, reposos, espesores, temperaturas de fermentación, cocción u otros datos fundamentales de la receta.

**SECCIÓN 4. PUNTOS CRÍTICOS Y ERRORES FRECUENTES**
Presenta pequeños dibujos comparativos de «correcto frente a incorrecto», con una breve explicación del problema y su consecuencia.

**SECCIÓN 5. RESULTADO FINAL**
Muestra una ilustración grande y detallada del producto terminado. Añade anotaciones con flechas para identificar color, volumen, textura, estructura interna, acabado u otras características de calidad pertinentes.

Esta estructura es una guía visual: adapta las secciones a la elaboración concreta sin inventar información ni incluir apartados que no tengan sentido para la receta.

## 3. REGLAS PARA MANTENER LA COHERENCIA VISUAL

1. Mantén la misma paleta de colores, tipografía, estilo de dibujo, numeración, marco y distribución general en todas las infografías.
2. Conserva la misma identidad gráfica aunque cambie por completo el tipo de elaboración.
3. Utiliza ilustraciones específicas para cada técnica: amasado, laminado, formado, escudillado, cocción, montaje, decoración, etc.
4. Prioriza las imágenes del procedimiento y las explicaciones breves frente a los párrafos largos.
5. Mantén una densidad visual similar a la referencia, pero sin sacrificar la legibilidad.
6. Respeta las proporciones, cantidades, temperaturas y pasos de la receta original. No inventes datos técnicos.
7. Usa español correcto y terminología profesional de pastelería.
8. Evita estilos fotográficos, diseños minimalistas modernos, fondos de colores intensos, estética infantil, tarjetas flotantes o composiciones que se alejen de la referencia.
9. No cambies la identidad visual para adaptarla a modas gráficas ni diseñes una plantilla nueva.
10. Si la receta contiene muchas etapas, reorganiza el espacio manteniendo la identidad visual y el formato vertical A4.

## 4. INSTRUCCIÓN FINAL

Genera directamente una **imagen de infografía completa**, siguiendo la imagen de referencia como plantilla visual de la colección.

La salida debe incluir ilustraciones gastronómicas, ingredientes, utensilios, pasos numerados, flechas, parámetros técnicos, errores frecuentes y representación del producto terminado, según corresponda.

**No escribas una receta convencional. No describas la infografía. No entregues solamente texto. Genera la imagen final.**

Antes de terminar, comprueba que la infografía mantiene el mismo estilo gráfico que la referencia y que el proceso se entiende visualmente.

${selectedRecipe ? `\n--- DATOS DE LA RECETA SELECCIONADA ---\nNombre: ${selectedRecipe.name}\nCategoría: ${selectedRecipe.category}\n` : ''}`;
  };

  // Obtener el prompt activo según la pestaña
  const getActivePromptContent = (): string => {
    switch (activeTab) {
      case 'image_standard':
        return getStandardImagePrompt();
      case 'image_takeaway':
        return getTakeAwayImagePrompt();
      case 'digitalize_standard':
        return getStandardDigitalizationPrompt();
      case 'digitalize_takeaway':
        return getTakeAwayDigitalizationPrompt();
      case 'pastry_infographic':
        return getPastryInfographicPrompt();
    }
  };

  const getActiveFilename = (): string => {
    const slug = selectedRecipe ? selectedRecipe.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'plantilla';
    switch (activeTab) {
      case 'image_standard':
        return `prompt_lamina_doble_${slug}.txt`;
      case 'image_takeaway':
        return `prompt_lamina_takeaway_${slug}.txt`;
      case 'digitalize_standard':
        return `prompt_digitalizacion_estandar.txt`;
      case 'digitalize_takeaway':
        return `prompt_digitalizacion_takeaway.txt`;
      case 'pastry_infographic':
        return `prompt_infografia_pasteleria_${slug}.txt`;
    }
  };

  const activeContent = getActivePromptContent();

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 pb-24 font-sans selection:bg-rose-200 selection:text-slate-900">
      {/* Cabecera del Espacio */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
              title="Volver al panel"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Wand2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Espacio Exclusivo de Prompts IA
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                  Biblioteca Maestra
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Láminas dobles 16:9 y digitalización de recetas listas para copiar y usar en Gemini, ChatGPT, Midjourney y Claude.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(activeContent)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? '¡Prompt Copiado!' : 'Copiar Prompt Completo'}</span>
            </button>

            <button
              onClick={() => handleDownloadTxt(getActiveFilename(), activeContent)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
              title="Descargar este prompt en formato archivo de texto .txt"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Descargar .txt</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Selector de Pestañas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          <button
            onClick={() => setActiveTab('image_standard')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'image_standard'
                ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-[#044e39]">
                <ImageIcon size={18} />
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTab === 'image_standard' ? 'bg-[#044e39] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                Formato 16:9
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                1. Lámina Doble: Platos Normales
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Ilustración técnica + Fotografía hiperrealista del plato de alta cocina.
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('image_takeaway')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'image_takeaway'
                ? 'bg-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Box size={18} />
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTab === 'image_takeaway' ? 'bg-[#7a350f] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                Packaging
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                2. Lámina Doble: Take Away
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Ilustración de envasado + Plato dentro del recipiente kraft de delivery.
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('digitalize_standard')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'digitalize_standard'
                ? 'bg-white border-sky-600 shadow-md ring-2 ring-sky-500/20'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
                <FileText size={18} />
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTab === 'digitalize_standard' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                JSON Estándar
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                3. Digitalización: Platos Normales
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Convierte textos, notas o fotos a ficha técnica completa con escandallo.
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('digitalize_takeaway')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'digitalize_takeaway'
                ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
                <Sparkles size={18} />
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTab === 'digitalize_takeaway' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                5ª Gama / Llevar
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                4. Digitalización: Take Away
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Adapta recetas con encarte comensal, regeneración y separación de salsas.
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('pastry_infographic')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'pastry_infographic'
                ? 'bg-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-100 text-rose-900">
                <ChefHat size={18} />
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                activeTab === 'pastry_infographic' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                Obrador / Pastelería
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                5. Infografía: Pastelería Didáctica
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Prompt maestro para láminas de obrador, masas, tartas, cremas y puntos críticos.
              </p>
            </div>
          </button>
        </div>

        {/* Barra de Personalización (si aplica a imagen) */}
        {(activeTab === 'image_standard' || activeTab === 'image_takeaway') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Autocompletar con una receta de tu recetario
                </span>
                <span className="text-[10px] text-slate-500">
                  Selecciona una receta para inyectar automáticamente sus datos reales al final del prompt:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full sm:w-64 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-400"
              >
                <option value="">-- Usar plantilla genérica [Vacía] --</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.category || 'General'})
                  </option>
                ))}
              </select>

              {selectedRecipeId && (
                <button
                  onClick={() => setSelectedRecipeId('')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  title="Limpiar selección y volver a plantilla vacía"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Banner de Enlace Rápido para Digitalización */}
        {(activeTab === 'digitalize_standard' || activeTab === 'digitalize_takeaway') && onNavigateToAIBridge && (
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-sky-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-sky-950">
                  ¿Tienes ya el resultado JSON generado por la IA?
                </h4>
                <p className="text-[10px] text-sky-800">
                  Copia el prompt de abajo, ejecútalo en Gemini o ChatGPT, y pega la respuesta directamente en nuestro Digitalizador para crear la ficha en un segundo.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToAIBridge}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-2xs"
            >
              <span>Abrir Digitalizador con IA</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Visor y Caja del Prompt */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                {activeTab === 'image_standard' ? 'PROMPT MAESTRO · LÁMINA DOBLE 16:9 PLATOS NORMALES' :
                 activeTab === 'image_takeaway' ? 'PROMPT MAESTRO · LÁMINA DOBLE 16:9 TAKE AWAY' :
                 activeTab === 'digitalize_standard' ? 'PROMPT DIGITALIZADOR · FICHA TÉCNICA JSON' :
                 'PROMPT DIGITALIZADOR · TAKE AWAY & 5ª GAMA JSON'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                {activeContent.length} caracteres
              </span>
              <button
                onClick={() => handleCopy(activeContent)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed max-h-[650px] overflow-y-auto custom-scrollbar whitespace-pre-wrap selection:bg-rose-500/30">
            {activeContent}
          </div>

          {/* Pie informativo de la caja */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500 shrink-0" />
              <span>
                <strong>Consejo:</strong> Pega este texto en Google Gemini, ChatGPT Plus o Claude 3.5 Sonnet para resultados inmediatos.
              </span>
            </div>

            <button
              onClick={() => handleCopy(activeContent)}
              className="text-slate-900 font-bold hover:underline flex items-center gap-1"
            >
              <span>Copiar todo al portapapeles</span>
              <Copy size={13} />
            </button>
          </div>
        </div>

        {/* Guía Rápida de Uso */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-2.5">
              1
            </div>
            <h4 className="font-bold text-xs text-slate-900 mb-1">Copiar el Prompt</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Haz clic en "Copiar Prompt Completo". Si seleccionas una receta arriba, sus ingredientes y técnicas se insertarán automáticamente.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm mb-2.5">
              2
            </div>
            <h4 className="font-bold text-xs text-slate-900 mb-1">Generar en la IA</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pégalo en tu generador de imágenes favorito (Gemini Imagen 3, Midjourney v6 con <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">--ar 16:9</code>, o DALL-E 3).
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-2.5">
              3
            </div>
            <h4 className="font-bold text-xs text-slate-900 mb-1">Subir a la Ficha</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Descarga la lámina 16:9 obtenida y adjúntala como fotografía en la receta. El sistema la encuadrará perfectamente en la cabecera.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
