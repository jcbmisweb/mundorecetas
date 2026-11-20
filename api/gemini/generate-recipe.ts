import { GoogleGenAI } from "@google/genai";
import {
  applySecurityHeaders,
  enforceStrictCors,
  enforceRateLimit,
  sanitizePromptText,
  sanitizeStringArray,
  sendSafeServerError,
  logSecurityEvent,
  getClientIp,
} from "../../lib/apiSecurity";

const GEMINI_MODEL = "gemini-4-hydrogen";

export default async function handler(req: any, res: any) {
  applySecurityHeaders(req, res, { isStandaloneProd: true, noStore: true });

  if (!enforceStrictCors(req, res, "/api/gemini/generate-recipe")) return;

  if (req.method !== "POST") {
    logSecurityEvent("METHOD_NOT_ALLOWED", { endpoint: "/api/gemini/generate-recipe", ip: getClientIp(req) });
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "/api/gemini/generate-recipe")) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Servicio de generación no disponible temporalmente." });
    }

    const { ingredients, vibe, level, goal, constraints } = req.body || {};
    const ingList = sanitizeStringArray(ingredients, 15, 80);
    const constraintList = sanitizeStringArray(constraints, 10, 60);
    const cleanVibe = sanitizePromptText(vibe, 60) || "Alta Gastronomía";
    const cleanLevel = sanitizePromptText(level, 40) || "Professional";
    const cleanGoal = sanitizePromptText(goal, 80) || "Plato principal";

    if (ingList.length === 0) {
      logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/generate-recipe", ip: getClientIp(req) });
      return res.status(400).json({ error: "Se requieren ingredientes válidos para generar la receta." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `Crea una receta culinaria profesional única basada en:
  - Ingredientes: ${ingList.join(", ")}
  - Estilo/Vibe: ${cleanVibe}
  - Nivel Técnico: ${cleanLevel}
  - Objetivo: ${cleanGoal}
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
  } catch (err: unknown) {
    return sendSafeServerError(res, "/api/gemini/generate-recipe", err);
  }
}
