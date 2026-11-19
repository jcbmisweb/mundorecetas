import { GoogleGenAI } from "@google/genai";

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

    if (clean.length === 0) {
      return res.status(400).json({ error: "Se requieren ingredientes." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `Analiza la compatibilidad molecular de estos ingredientes: ${clean.join(", ")}. Sugiere maridajes basados en moléculas compartidas (FlavorDB).`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "Eres un experto en gastronomía molecular. Tu objetivo es analizar ingredientes y sugerir maridajes basados en moléculas volátiles compartidas (lógica FlavorDB). Si recibes varios ingredientes, analiza su compatibilidad conjunta. Proporciona siempre: Nombre del maridaje, Explicación culinaria, Compuesto químico compartido (ej: Cumarina, Metoxipirazina) y un Porcentaje de afinidad (0-100%). RESPONDE SIEMPRE EN JSON.",
        responseMimeType: "application/json",
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Error en la llamada a Gemini API" });
  }
}
