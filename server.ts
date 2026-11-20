import express, { Request, Response, NextFunction } from "express";
import path from "path";
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
} from "./lib/apiSecurity";

const GEMINI_MODEL = "gemini-4-hydrogen";

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";
  const isStandaloneProd = process.env.STANDALONE_STRICT_FRAME === "true";

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Redirección forzada HTTP -> HTTPS en producción (detrás de proxy inverso)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
    const host = String(req.headers.host || "");
    const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (isProd && proto === "http" && host && !isLocalHost) {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
  });

  // Cabeceras globales de seguridad HTTP
  app.use((req: Request, res: Response, next: NextFunction) => {
    applySecurityHeaders(req, res, {
      isStandaloneProd,
      noStore: req.path.startsWith("/api/"),
    });
    next();
  });

  // Bloquear explícitamente acceso a archivos sensibles o de configuración interna
  app.use((req: Request, res: Response, next: NextFunction) => {
    const lowerPath = req.path.toLowerCase();
    if (
      lowerPath.includes("/.env") ||
      lowerPath.includes("/.git") ||
      lowerPath.endsWith(".rules") ||
      lowerPath.endsWith(".sql") ||
      lowerPath.endsWith(".map") ||
      lowerPath === "/firebase-blueprint.json"
    ) {
      return res.status(404).end();
    }
    next();
  });

  app.use("/api", express.json({ limit: "256kb" }));

  // CORS estricto para rutas API
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (!enforceStrictCors(req, res, req.path)) return;
    next();
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Rate limiting para endpoints de IA
  app.use("/api/gemini", (req: Request, res: Response, next: NextFunction) => {
    if (!enforceRateLimit(req, res, req.path)) return;
    next();
  });

  // 1. Evaluar la química molecular interna de una receta
  app.post("/api/gemini/recipe-harmony", async (req: Request, res: Response) => {
    try {
      const { recipeName, categories, ingredients } = req.body || {};
      const cleanName = sanitizePromptText(recipeName, 120) || "Receta";
      const cleanCats = sanitizeStringArray(categories, 8, 40);
      const ingList = sanitizeStringArray(ingredients, 15, 80);

      if (ingList.length === 0) {
        logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/recipe-harmony", ip: getClientIp(req) });
        return res.status(400).json({ error: "Se requieren ingredientes válidos para analizar la armonía." });
      }

      const ai = getAiClient();
      const catText = cleanCats.length > 0 ? cleanCats.join(", ") : "General";
      const prompt = `Analiza la armonía y química molecular interna de esta receta gastronómica profesional:
Nombre de la receta: "${cleanName}"
Categorías: ${catText}
Ingredientess del escandallo: ${ingList.join(", ")}.

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
              volatileFamilies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              bridgeIngredient: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                },
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

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: unknown) {
      sendSafeServerError(res, "/api/gemini/recipe-harmony", err);
    }
  });

  // 2. Mesa de I+D y simulador de maridajes moleculares
  app.post("/api/gemini/mesa-id", async (req: Request, res: Response) => {
    try {
      const { ingredients } = req.body || {};
      const clean = sanitizeStringArray(ingredients, 15, 80);

      if (clean.length < 2) {
        logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/mesa-id", ip: getClientIp(req) });
        return res.status(400).json({ error: "Se requieren al menos 2 ingredientes válidos para analizar." });
      }

      const ai = getAiClient();
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

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: unknown) {
      sendSafeServerError(res, "/api/gemini/mesa-id", err);
    }
  });

  // 3. Compatibilidad molecular simple entre ingredientes
  app.post("/api/gemini/molecular-pairings", async (req: Request, res: Response) => {
    try {
      const { ingredients } = req.body || {};
      const clean = sanitizeStringArray(ingredients, 15, 80);

      if (clean.length === 0) {
        logSecurityEvent("INVALID_PAYLOAD", { endpoint: "/api/gemini/molecular-pairings", ip: getClientIp(req) });
        return res.status(400).json({ error: "Se requieren ingredientes válidos." });
      }

      const ai = getAiClient();
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

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: unknown) {
      sendSafeServerError(res, "/api/gemini/molecular-pairings", err);
    }
  });

  // 4. Arquitecto de recetas con IA
  app.post("/api/gemini/generate-recipe", async (req: Request, res: Response) => {
    try {
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

      const ai = getAiClient();
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

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: unknown) {
      sendSafeServerError(res, "/api/gemini/generate-recipe", err);
    }
  });

  // Manejador de errores JSON malformados (ej: body > 256kb o sintaxis inválida)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "La solicitud supera el tamaño máximo permitido." });
    }
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Formato JSON inválido." });
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath, { dotfiles: "deny" }));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
