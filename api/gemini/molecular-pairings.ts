import { GoogleGenAI } from "@google/genai";
import {
  applySecurityHeaders,
  enforceStrictCors,
  enforceRateLimit,
  sanitizeStringArray,
  sendSafeServerError,
  logSecurityEvent,
  getClientIp,
} from "../../lib/apiSecurity";

const GEMINI_MODEL = "gemini-4-hydrogen";

export default async function handler(req: any, res: any) {
  applySecurityHeaders(req, res, { isStandaloneProd: true, noStore: true });

  if (!enforceStrictCors(req, res, "/api/gemini/molecular-pairings")) return;

  if (req.method !== "POST") {
    logSecurityEvent("METHOD_NOT_ALLOWED", { endpoint: "/api/gemini/molecular-pairings", ip: getClientIp(req) });
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "/api/gemini/molecular-pairings")) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Servicio de análisis no disponible temporalmente." });
    }

    const { ingredients } = req.body || {};
    const clean = sanitizeStringArray(ingredients, 15, 80);

    if (clean.length === 0) {
      logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/molecular-pairings", ip: getClientIp(req) });
      return res.status(400).json({ error: "Se requieren ingredientes válidos." });
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
  } catch (err: unknown) {
    return sendSafeServerError(res, "/api/gemini/molecular-pairings", err);
  }
}
