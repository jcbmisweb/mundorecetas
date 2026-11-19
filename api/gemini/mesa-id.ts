import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL = "gemini-4-hydrogen";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const { ingredients } = req.body || {};
    const clean: string[] = Array.isArray(ingredients)
      ? ingredients.map((i: any) => String(i).trim()).filter(Boolean)
      : [];

    if (clean.length < 2) {
      return res.status(400).json({ error: "Se requieren al menos 2 ingredientes para analizar." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `Analiza en el laboratorio de maridajes moleculares la siguiente combinación de ingredientes que un chef está probando:
Ingredientes seleccionados: ${clean.join(", ")}.

TU OBJETIVO ES REALIZAR UN MAPA DE COMPATIBILIDAD AROMÁTICA (Flavor Network / FlavorDB):
1. overallCompatibility: porcentaje global de compatibilidad (0-100%).
2. profileSummary: descripción sintética del perfil conjunto.
3. aromaFamilies: desglose en porcentaje de familias aromáticas (ej: Cítrico, Terroso, Tostado, etc. con nombre, percentage y color hex).
4. links: enlaces par a par entre los ingredientes (source, target, compound específico que comparten ej: Eugenol, Metilpirazina, affinity 0-100, y description).
5. bridgeSuggestions: 2 o 3 ingredientes puente que el chef podría incorporar para conectar mejor los ingredientes seleccionados.
6. recommendedDrinkPairing: maridaje líquido ideal que comparta moléculas (nombre de la bebida, sharedCompound, pairingNotes).
7. culinaryVerdict: veredicto profesional de I+D sobre el potencial de esta combinación.

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "Eres un científico culinario de vanguardia. Analizas ingredientes como en The Flavor Matrix y FlavorDB. Responde siempre con rigor técnico y JSON exacto.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallCompatibility: { type: Type.NUMBER },
            profileSummary: { type: Type.STRING },
            aromaFamilies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                },
                required: ["name", "percentage", "color"],
              },
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  compound: { type: Type.STRING },
                  affinity: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ["source", "target", "compound", "affinity", "description"],
              },
            },
            bridgeSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredient: { type: Type.STRING },
                  bridgesWhat: { type: Type.STRING },
                  scientificReason: { type: Type.STRING },
                },
                required: ["ingredient", "bridgesWhat", "scientificReason"],
              },
            },
            recommendedDrinkPairing: {
              type: Type.OBJECT,
              properties: {
                drink: { type: Type.STRING },
                sharedCompound: { type: Type.STRING },
                pairingNotes: { type: Type.STRING },
              },
              required: ["drink", "sharedCompound", "pairingNotes"],
            },
            culinaryVerdict: { type: Type.STRING },
          },
          required: [
            "overallCompatibility",
            "profileSummary",
            "aromaFamilies",
            "links",
            "bridgeSuggestions",
            "recommendedDrinkPairing",
            "culinaryVerdict",
          ],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Error en la llamada a Gemini API" });
  }
}
