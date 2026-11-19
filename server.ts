import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

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

function extractStatus(err: any): number {
  const status = Number(err?.status || err?.code);
  if (status >= 400 && status < 600) return status;
  return 500;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Evaluar la química molecular interna de una receta
  app.post("/api/gemini/recipe-harmony", async (req: Request, res: Response) => {
    try {
      const { recipeName, categories, ingredients } = req.body || {};
      const ingList: string[] = Array.isArray(ingredients)
        ? ingredients.map((i) => String(i).trim()).filter(Boolean).slice(0, 15)
        : [];

      if (ingList.length === 0) {
        return res.status(400).json({ error: "Se requieren ingredientes para analizar la armonía." });
      }

      const ai = getAiClient();
      const catText = Array.isArray(categories) && categories.length > 0 ? categories.join(", ") : "General";
      const prompt = `Analiza la armonía y química molecular interna de esta receta gastronómica profesional:
Nombre de la receta: "${String(recipeName || "Receta")}"
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
    } catch (err: any) {
      console.error("[/api/gemini/recipe-harmony] Error:", err);
      res.status(extractStatus(err)).json({
        error: err?.message || "Error en la llamada a Gemini API",
      });
    }
  });

  // 2. Mesa de I+D y simulador de maridajes moleculares
  app.post("/api/gemini/mesa-id", async (req: Request, res: Response) => {
    try {
      const { ingredients } = req.body || {};
      const clean: string[] = Array.isArray(ingredients)
        ? ingredients.map((i) => String(i).trim()).filter(Boolean)
        : [];

      if (clean.length < 2) {
        return res.status(400).json({ error: "Se requieren al menos 2 ingredientes para analizar." });
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
    } catch (err: any) {
      console.error("[/api/gemini/mesa-id] Error:", err);
      res.status(extractStatus(err)).json({
        error: err?.message || "Error en la llamada a Gemini API",
      });
    }
  });

  // 3. Compatibilidad molecular simple entre ingredientes
  app.post("/api/gemini/molecular-pairings", async (req: Request, res: Response) => {
    try {
      const { ingredients } = req.body || {};
      const clean: string[] = Array.isArray(ingredients)
        ? ingredients.map((i) => String(i).trim()).filter(Boolean)
        : [];

      if (clean.length === 0) {
        return res.status(400).json({ error: "Se requieren ingredientes." });
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
    } catch (err: any) {
      console.error("[/api/gemini/molecular-pairings] Error:", err);
      res.status(extractStatus(err)).json({
        error: err?.message || "Error en la llamada a Gemini API",
      });
    }
  });

  // 4. Arquitecto de recetas con IA
  app.post("/api/gemini/generate-recipe", async (req: Request, res: Response) => {
    try {
      const { ingredients, vibe, level, goal, constraints } = req.body || {};
      const ingList: string[] = Array.isArray(ingredients)
        ? ingredients.map((i) => String(i).trim()).filter(Boolean)
        : [];
      const constraintList: string[] = Array.isArray(constraints)
        ? constraints.map((c) => String(c).trim()).filter(Boolean)
        : [];

      const ai = getAiClient();
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

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("[/api/gemini/generate-recipe] Error:", err);
      res.status(extractStatus(err)).json({
        error: err?.message || "Error en la llamada a Gemini API",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
