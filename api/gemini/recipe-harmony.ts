import { GoogleGenAI, Type } from "@google/genai";
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

  if (!enforceStrictCors(req, res, "/api/gemini/recipe-harmony")) return;

  if (req.method !== "POST") {
    logSecurityEvent("METHOD_NOT_ALLOWED", { endpoint: "/api/gemini/recipe-harmony", ip: getClientIp(req) });
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "/api/gemini/recipe-harmony")) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Servicio de análisis no disponible temporalmente." });
    }

    const { recipeName, categories, ingredients } = req.body || {};
    const cleanName = sanitizePromptText(recipeName, 120) || "Receta";
    const cleanCats = sanitizeStringArray(categories, 8, 40);
    const ingList = sanitizeStringArray(ingredients, 15, 80);

    if (ingList.length === 0) {
      logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/recipe-harmony", ip: getClientIp(req) });
      return res.status(400).json({ error: "Se requieren ingredientes válidos para analizar la armonía." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const catText = cleanCats.length > 0 ? cleanCats.join(", ") : "General";
    const prompt = `Analiza la armonía y química molecular interna de esta receta gastronómica profesional:
Nombre de la receta: "${cleanName}"
Categorías: ${catText}
Ingredientes del escandallo: ${ingList.join(", ")}.

TU OBJETIVO ES EXPLICAR CIENTÍFICAMENTE POR QUÉ FUNCIONA ESTE PLATO:
1. Puntuación de Cohesión Molecular (0-100%).
2. Perfil Aromático Dominante (ej: "Mediterráneo Herbal-Sulfuroso", "Umami Marino con Destellos Cítricos").
3. Familias aromáticas volátiles presentes (array de 3 a 5 familias, ej: Terpenos, Pirazinas, Sulfuros).
4. Ingrediente Puente (cuál de los ingredientes de la receta actúa como aglutinador sensorial y por qué).
5. Enlaces moleculares directos entre los ingredientes reales del plato (mínimo 3 y máximo 6 enlaces clave con: source, target, sharedCompound, affinityScore de 0 a 100, y culinaryReason).
6. Resumen organoléptico formativo para el cocinero/alumno explicando por qué casan en paladar.
7. Sugerencia de potenciador molecular opcional (un ingrediente sutil que elevaría aún más el plato compartiendo moléculas clave).

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "Eres un consultor de I+D gastronómico molecular especializado en Foodpairing y bases de datos FlavorDB. Ofrece análisis científicos rigurosos pero redactados en lenguaje culinario práctico y formativo. Responde siempre en JSON estructurado.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cohesionScore: { type: Type.NUMBER },
            dominantProfile: { type: Type.STRING },
            volatileFamilies: { type: Type.ARRAY, items: { type: Type.STRING } },
            bridgeIngredient: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, role: { type: Type.STRING } },
              required: ["name", "role"],
            },
            molecularLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  sharedCompound: { type: Type.STRING },
                  affinityScore: { type: Type.NUMBER },
                  culinaryReason: { type: Type.STRING },
                },
                required: ["source", "target", "sharedCompound", "affinityScore", "culinaryReason"],
              },
            },
            organolepticSummary: { type: Type.STRING },
            enhancerSuggestion: {
              type: Type.OBJECT,
              properties: {
                ingredient: { type: Type.STRING },
                compound: { type: Type.STRING },
                technique: { type: Type.STRING },
              },
              required: ["ingredient", "compound", "technique"],
            },
          },
          required: [
            "cohesionScore",
            "dominantProfile",
            "volatileFamilies",
            "bridgeIngredient",
            "molecularLinks",
            "organolepticSummary",
            "enhancerSuggestion",
          ],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (err: unknown) {
    return sendSafeServerError(res, "/api/gemini/recipe-harmony", err);
  }
}
