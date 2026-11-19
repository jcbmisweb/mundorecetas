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

    const { ingredients, vibe, level, goal, constraints } = req.body || {};
    const ingList: string[] = Array.isArray(ingredients)
      ? ingredients.map((i: any) => String(i).trim()).filter(Boolean)
      : [];
    const constraintList: string[] = Array.isArray(constraints)
      ? constraints.map((c: any) => String(c).trim()).filter(Boolean)
      : [];

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `Crea una receta culinaria profesional única basada en:
  - Ingredientes: ${ingList.join(", ")}
  - Estilo/Vibe: ${String(vibe || "Alta Gastronomía")}
  - Nivel Técnico: ${String(level || "Professional")}
  - Objetivo: ${String(goal || "Plato principal")}
  - Restricciones: ${constraintList.join(", ") || "Ninguna"}
  
  La receta debe ser creativa y coherente. RESPONDE SIEMPRE EN JSON con estructura estándar.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'Eres un Chef Creativo Senior. Genera una receta técnica profesional. RESPONDE SIEMPRE EN JSON con: { "name": string, "description": string, "category": string, "yieldQuantity": number, "yieldUnit": string, "subRecipes": [ { "name": string, "ingredients": [ { "name": string, "quantity": number, "unit": string, "notes": string } ], "steps": [ { "step": string } ] } ], "chefTips": string }',
        responseMimeType: "application/json",
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Error en la llamada a Gemini API" });
  }
}
