import React, { useMemo, useState, useEffect } from "react";
import {
  Recipe,
  AppSettings,
  Allergen,
  ALLERGEN_LIST,
  AppUser,
  isUserOwner,
} from "../types";
import { formatScaledQuantity } from "../lib/unitUtils";
import {
  Printer,
  ArrowLeft,
  AlertOctagon,
  Utensils,
  Thermometer,
  ChefHat,
  Users,
  Clock,
  UtensilsCrossed,
  MessageSquare,
  Info,
  Camera,
  Edit2,
  Copy,
  ExternalLink,
  Sparkles,
  Compass,
  ShoppingBag,
  Scissors,
  Box,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Download,
  Check,
  ArrowRight,
} from "lucide-react";

import { CategoryStripe } from "./CategoryStripe";
import { AllergenIcon } from "./AllergenIcon";
import { MolecularPairings } from "./MolecularPairings";
import { VideoListDisplay } from "./VideoListDisplay";
import { ImagePromptModal } from "./ImagePromptModal";

interface RecipeViewProps {
  recipe: Recipe;
  settings: AppSettings;
  appUser: AppUser | null;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
  onUpgradeToPro?: (recipe: Recipe) => void;
  onDuplicate?: (recipe: Recipe) => void;
  allRecipes?: Recipe[];
  onSelectRecipe?: (recipe: Recipe) => void;
}

export const normalizeAllergen = (input: string): Allergen | null => {
  if (!input) return null;
  const clean = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (clean.includes("gluten") || clean.includes("trigo")) return "Gluten";
  if (clean.includes("crustaceo")) return "Crustáceos";
  if (clean.includes("huevo")) return "Huevos";
  if (clean.includes("pescado")) return "Pescado";
  if (clean.includes("cacahuete") || clean.includes("mani"))
    return "Cacahuetes";
  if (clean.includes("soja") || clean.includes("soya")) return "Soja";
  if (
    clean.includes("lacteo") ||
    clean.includes("leche") ||
    clean.includes("lactose")
  )
    return "Lácteos";
  if (
    clean.includes("fruto") ||
    clean.includes("nuez") ||
    clean.includes("almendra") ||
    clean.includes("avellana") ||
    clean.includes("cascara")
  )
    return "Frutos de cáscara";
  if (clean.includes("apio")) return "Apio";
  if (clean.includes("mostaza")) return "Mostaza";
  if (clean.includes("sesamo")) return "Sésamo";
  if (clean.includes("sulfito") || clean.includes("so2")) return "Sulfitos";
  if (clean.includes("altramuc")) return "Altramuces";
  if (clean.includes("molusco")) return "Moluscos";

  const direct = ALLERGEN_LIST.find(
    (a) => a.toLowerCase() === input.trim().toLowerCase(),
  );
  if (direct) return direct;
  return null;
};

export const RecipeView: React.FC<RecipeViewProps> = ({
  recipe,
  settings,
  appUser,
  onBack,
  onEdit,
  onUpgradeToPro,
  onDuplicate,
  allRecipes,
  onSelectRecipe,
}) => {
  const [dynamicPax, setDynamicPax] = useState<number>(
    recipe.yieldQuantity || 4,
  );
  const [isBanner, setIsBanner] = useState<boolean>(
    recipe.photoLayout !== "classic",
  );
  const [viewMode, setViewMode] = useState<
    "complete" | "minimal" | "takeaway_slip"
  >("complete");
  const [includeAnalysis, setIncludeAnalysis] = useState<boolean>(true);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  useEffect(() => {
    if (!recipe.photo) {
      setIsBanner(false);
      return;
    }
    // Si la receta tiene guardado 'classic' explícitamente, se respeta 'classic':
    if (recipe.photoLayout === "classic") {
      setIsBanner(false);
      return;
    }
    // Por defecto para todas las demás (sin layout o 'banner' / 'auto'), usar disposición Superior (Caballa "bien"):
    setIsBanner(true);
  }, [recipe.photo, recipe.photoLayout]);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = recipe.name || "Receta";
    return () => {
      document.title = originalTitle;
    };
  }, [recipe.name]);

  const paxRatio = useMemo(() => {
    return recipe.yieldQuantity && recipe.yieldQuantity > 0
      ? dynamicPax / recipe.yieldQuantity
      : 1;
  }, [dynamicPax, recipe.yieldQuantity]);

  const isOwner = isUserOwner(appUser);

  const mainIngredients = useMemo(() => {
    const names = new Set<string>();
    (recipe.subRecipes || []).forEach((sub) => {
      (sub.ingredients || []).forEach((ing) => {
        if (ing?.name && ing.name.length > 2) names.add(ing.name.trim());
      });
    });
    return Array.from(names).slice(0, 8); // Top 8 ingredients for analysis
  }, [recipe]);

  const allAllergens = useMemo(() => {
    const set = new Set<Allergen>();
    const addAllergen = (val?: string) => {
      if (!val) return;
      const norm = normalizeAllergen(val);
      if (norm) set.add(norm);
    };

    recipe.subRecipes?.forEach((sub) => {
      sub.ingredients?.forEach((ing) => {
        ing.allergens?.forEach((a) => addAllergen(a));
      });
    });
    recipe.extraAllergens?.forEach((a) => addAllergen(a));
    recipe.minimalistCard?.allergens?.forEach((a) => addAllergen(a));
    return Array.from(set);
  }, [recipe]);

  const displayBadges = useMemo(() => {
    const list: string[] = [];
    const baseCats =
      recipe.categories && recipe.categories.length > 0
        ? recipe.categories
        : recipe.category
          ? [recipe.category]
          : [];

    baseCats.forEach((c) => {
      if (c && !list.includes(c)) list.push(c);
    });

    if (
      recipe.recipeType === "takeaway" ||
      recipe.takeAwayDetails?.isTakeAway
    ) {
      if (
        !list.some(
          (b) =>
            b.toLowerCase().includes("take away") ||
            b.toLowerCase().includes("takeaway"),
        )
      ) {
        list.push("TAKE AWAY");
      }
    }
    if (recipe.recipeType === "pastry") {
      if (
        !list.some(
          (b) =>
            b.toLowerCase().includes("pastelería") ||
            b.toLowerCase().includes("pasteleria") ||
            b.toLowerCase().includes("obrador"),
        )
      ) {
        list.push("PASTELERÍA");
      }
    }
    if (recipe.recipeType === "eventos") {
      if (
        !list.some(
          (b) =>
            b.toLowerCase().includes("evento") ||
            b.toLowerCase().includes("catering"),
        )
      ) {
        list.push("EVENTOS");
      }
    }
    return list;
  }, [recipe]);

  const getScaledData = (
    qtyStr: string,
    unit: string,
    baseUnit?: string,
    ingredientName?: string,
  ): { quantity: string; unit: string } => {
    const num = parseFloat(qtyStr.replace(",", "."));
    if (isNaN(num)) return { quantity: qtyStr, unit };
    return formatScaledQuantity(num * paxRatio, unit, baseUnit, ingredientName);
  };

  const consolidatedIngredients = useMemo(() => {
    const list: {
      name: string;
      quantity: string;
      unit: string;
      allergens?: Allergen[];
    }[] = [];
    recipe.subRecipes?.forEach((sub) => {
      sub.ingredients?.forEach((ing) => {
        if (!ing.name || !ing.name.trim()) return;
        const scaled = getScaledData(
          ing.quantity,
          ing.unit,
          ing.baseUnit,
          ing.name,
        );
        list.push({
          name: ing.name.trim(),
          quantity: scaled.quantity,
          unit: scaled.unit,
          allergens: ing.allergens,
        });
      });
    });
    return list;
  }, [recipe, paxRatio]);

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-4 print:p-0 print:bg-white font-sans text-slate-900">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; break-before: page; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
          .instructions-text { font-size: 10px !important; line-height: 1.4 !important; }
          .ingredients-table { font-size: 10px !important; }
          .video-list-container { break-inside: avoid; page-break-inside: avoid; }
          
          @page {
            margin: 12mm 10mm 14mm 10mm;
            size: portrait;
          }
        }
      `,
        }}
      />
      <title>{recipe.name}</title>
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={18} />
          <span>Volver al Panel</span>
        </button>
        <div className="flex items-center gap-3">
          {/* Selector de Modo de Impresión / Visualización */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm no-print">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 pr-1">
              Ficha:
            </span>
            <button
              type="button"
              onClick={() => setViewMode("complete")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                viewMode === "complete"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Ficha técnica completa integral con escandallo detallado y procesos paso a paso"
            >
              📋 Completa
            </button>
            <button
              type="button"
              onClick={() => setViewMode("minimal")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                viewMode === "minimal"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Ficha visual minimalista de 1 página con infografía protagonista, ingredientes y pase"
            >
              ⚡ Minimalista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("takeaway_slip")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                viewMode === "takeaway_slip"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Ver e imprimir exclusivamente el encarte recortable con instrucciones de finalización y alérgenos para el cliente"
            >
              ✂ Encarte Cliente {recipe.takeAwayDetails?.isTakeAway ? "🥡" : ""}
            </button>
          </div>

          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(recipe)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase transition-all shadow-sm no-print"
              title="Duplicar esta receta para crear una nueva variante (ej. cambiar a Eventos, Take Away, Pastelería, etc.)"
            >
              <Copy size={14} /> Duplicar Ficha
            </button>
          )}

          {recipe.photo && viewMode === "complete" && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm no-print">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 pr-1">
                Disposición:
              </span>
              <button
                type="button"
                onClick={() => setIsBanner(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                  isBanner
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Ver/imprimir con la imagen en la cabecera superior en ancho completo"
              >
                🌟 Superior
              </button>
              <button
                type="button"
                onClick={() => setIsBanner(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                  !isBanner
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Ver/imprimir con la imagen en el formato clásico lateral"
              >
                📄 Clásica
              </button>
            </div>
          )}
          {/* Selector de Inclusión de Análisis Molecular en Impresión (por defecto sí) */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm no-print">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 pr-1">
              Análisis:
            </span>
            <button
              type="button"
              onClick={() => setIncludeAnalysis(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                includeAnalysis
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Incluir el análisis molecular y organoléptico (FlavorDB) al imprimir la ficha técnica"
            >
              ✓ Sí
            </button>
            <button
              type="button"
              onClick={() => setIncludeAnalysis(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                !includeAnalysis
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Omitir el análisis molecular al imprimir"
            >
              ✕ No
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Users size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Escalar Pax:
            </span>
            <input
              type="number"
              value={dynamicPax}
              onChange={(e) =>
                setDynamicPax(Math.max(1, Number(e.target.value)))
              }
              className="w-10 font-black text-center text-indigo-600 outline-none border-b-2 border-indigo-100 focus:border-indigo-500 bg-transparent"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPromptModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs group border ${
              recipe.takeAwayDetails?.isTakeAway
                ? "bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-950 border-amber-300"
                : "bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 border-indigo-200"
            }`}
            title={
              recipe.takeAwayDetails?.isTakeAway
                ? "Ver y copiar prompt profesional adaptado para Take Away (dentro de recipientes y packaging) para generar la lámina con IA"
                : "Ver y copiar prompt profesional adaptado para generar la lámina doble 16:9 con IA"
            }
          >
            {recipe.takeAwayDetails?.isTakeAway ? (
              <Box
                size={14}
                className="text-amber-600 group-hover:scale-125 transition-transform"
              />
            ) : (
              <Sparkles
                size={14}
                className="text-indigo-600 group-hover:scale-125 transition-transform"
              />
            )}
            <span>
              {recipe.takeAwayDetails?.isTakeAway
                ? "Prompt IA (Take Away)"
                : "Prompt IA"}
            </span>
          </button>

          {onUpgradeToPro && (
            <button
              type="button"
              onClick={() => onUpgradeToPro(recipe)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300 px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs group"
              title="Llevar esta receta al Taller I+D Profesional (5 niveles Michelin)"
            >
              <Compass
                size={14}
                className="text-amber-700 group-hover:rotate-45 transition-transform"
              />
              <span>Taller I+D</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg font-black uppercase text-xs tracking-widest"
          >
            <Printer size={18} />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Renderizado de Encarte Recortable para el Cliente */}
      {(() => null)()}
      {viewMode === "takeaway_slip" ? (
        <div className="max-w-[210mm] mx-auto p-4 print:p-0">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-950 rounded-2xl p-4 mb-4 flex items-center justify-between no-print shadow-xs">
            <div className="flex items-center gap-2">
              <Scissors size={20} className="text-amber-700" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  Vista Exclusiva: Encarte de Cliente Take Away
                </span>
                <span className="text-[10px] text-slate-600">
                  Listo para imprimir en 1 página, recortar por la línea
                  punteada e introducir en la bolsa o envase.
                </span>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <Printer size={15} /> Imprimir Encarte (1 Hoja)
            </button>
          </div>

          {/* Tarjeta Recortable */}
          {(() => {
            const ta = recipe.takeAwayDetails;
            const hf = ta?.homeFinishing;
            const summary =
              hf?.summaryText ||
              recipe.minimalistCard?.miniComment ||
              recipe.serviceDetails?.clientDescription ||
              "Elaboración culinaria artesanal.";
            const methodLabel =
              hf?.heatingMethod === "microwave"
                ? "Microondas"
                : hf?.heatingMethod === "oven"
                  ? "Horno"
                  : hf?.heatingMethod === "pan"
                    ? "Sartén / Cazuela"
                    : hf?.heatingMethod === "bain_marie"
                      ? "Baño María"
                      : "Consumo en Frío";
            const methodIcon =
              hf?.heatingMethod === "microwave"
                ? "⏱"
                : hf?.heatingMethod === "oven"
                  ? "🔥"
                  : hf?.heatingMethod === "pan"
                    ? "🍳"
                    : hf?.heatingMethod === "bain_marie"
                      ? "♨"
                      : "❄";

            return (
              <div className="bg-white border-2 border-dashed border-slate-900 rounded-3xl p-6 print:p-5 my-4 text-slate-900 break-inside-avoid relative shadow-md print:shadow-none">
                {/* Línea de corte con tijeras */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-slate-300">
                  <div className="flex items-center gap-2 text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <Scissors size={14} className="text-amber-600" />
                    <span>
                      ✂ Cortar por la línea de puntos y adjuntar al envase /
                      bolsa
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                    🥡 Instrucciones para el Comensal
                  </span>
                </div>

                {/* Cabecera del Encarte */}
                <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {settings.instituteName || "Cocina de Autor"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-tight text-slate-900 mt-0.5">
                      {recipe.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-serif italic mt-1 max-w-xl">
                      "{summary}"
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                        Consumo Recomendado
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {ta?.shelfLife || "48h"}
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-500 block">
                        {ta?.conservationTemp || "Refrigerado 2-4ºC"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Control de Alérgenos Compacto y Funcional */}
                <div className="my-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-slate-900">
                        <AlertOctagon size={13} className="text-rose-600" />
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          Alérgenos:
                        </span>
                      </div>
                      {allAllergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {allAllergens.map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-md text-[8.5px] font-black uppercase"
                            >
                              <AllergenIcon allergen={a} size={13} />
                              <span>{a}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[8.5px] font-black uppercase">
                          <Check size={11} className="text-emerald-600" />
                          <span>Sin alérgenos obligatorios (100% Libre)</span>
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                      title="Matriz legal UE 1169/2011"
                    >
                      {ALLERGEN_LIST.map((allergen) => {
                        const isPresent = allAllergens.includes(allergen);
                        return (
                          <div
                            key={allergen}
                            className={`transition-all ${isPresent ? "opacity-100 scale-110" : "opacity-20 grayscale"}`}
                            title={`${allergen}: ${isPresent ? "PRESENTE" : "No contiene"}`}
                          >
                            <AllergenIcon allergen={allergen} size={14} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Instrucciones Paso a Paso para el Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{methodIcon}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                        1. Cómo Calentar ({methodLabel})
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 leading-snug">
                      {hf?.heatingInstructions ||
                        "Abrir ligeramente la tapa y calentar a potencia media (2 min a 750W en microondas)."}
                    </p>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">✨</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                        2. Emplatado y Toque Final
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 leading-snug">
                      {hf?.platingSteps ||
                        "Verter la salsa caliente sobre el plato y espolvorear los crujientes reservados."}
                    </p>
                  </div>
                </div>

                {/* Pie de cortesía */}
                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>
                    ¡Buen provecho! Elaborado con ingredientes seleccionados.
                  </span>
                  <span>Por favor, recicla este envase · Gracias</span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : viewMode === "minimal" ? (
        <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-[210mm] print:max-w-none print:h-[282mm] print:max-h-[282mm] print:overflow-hidden p-6 print:p-5 border border-slate-200 print:border-none rounded-[1.5rem] print:rounded-none flex flex-col justify-between">
          {/* Cabecera Académica IES & Profesor con Espacios Fijos */}
          <div className="flex justify-between items-center mb-2.5 border-b-2 border-slate-900 pb-2.5 gap-3 shrink-0">
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex flex-wrap gap-1 w-fit">
                {displayBadges.map((cat) => (
                  <div key={cat} className="relative">
                    <CategoryStripe
                      category={cat}
                      settings={settings}
                      className="absolute inset-0 rounded opacity-20"
                    />
                    <span className="relative text-slate-700 font-black text-[7.5px] uppercase tracking-[0.2em] px-2 py-0.5 block">
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
              <h1 className="text-xl sm:text-2xl print:text-xl font-serif font-black text-slate-900 leading-tight tracking-tight uppercase mt-0.5 line-clamp-2">
                {recipe.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-600 uppercase">
                  <Users size={11} className="text-slate-400" />
                  <span>
                    {dynamicPax} {recipe.yieldUnit}
                  </span>
                </div>
                <div className="flex items-center gap-1 border border-slate-900 px-1.5 py-0.5 rounded bg-slate-50 text-[9px] font-black text-slate-900 uppercase">
                  <span>
                    Coste/Ración:{" "}
                    {recipe.totalCost && recipe.yieldQuantity
                      ? ((recipe.totalCost / recipe.yieldQuantity) * paxRatio)
                          .toFixed(2)
                          .replace(".", ",")
                      : "0,00"}
                    €
                  </span>
                </div>
                {recipe.creator && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                    <ChefHat size={11} className="text-amber-500" />
                    <span>Chef/Prof: {recipe.creator}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Espacio fijo blindado para logos (Centro y Profesor) */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 self-center pl-2">
              {/* Logo Centro */}
              <div className="h-12 w-28 flex items-center justify-end shrink-0">
                {settings.instituteLogo || appUser?.instituteLogo ? (
                  <img
                    src={settings.instituteLogo || appUser?.instituteLogo}
                    alt="Logo Centro"
                    className="max-h-12 max-w-28 object-contain"
                  />
                ) : (
                  <span className="font-black text-[8.5px] uppercase tracking-wider text-slate-400 text-right leading-tight block">
                    {settings.instituteName}
                  </span>
                )}
              </div>
              {/* Logo Profesor */}
              {(recipe.creatorLogo ||
                appUser?.teacherLogo ||
                settings.teacherLogo) && (
                <div className="h-12 w-14 flex items-center justify-center shrink-0">
                  <img
                    src={
                      recipe.creatorLogo ||
                      appUser?.teacherLogo ||
                      settings.teacherLogo
                    }
                    alt="Logo Profesor"
                    className="max-h-12 max-w-14 object-contain rounded-lg border border-slate-200 shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Imagen / Infografía Doble Protagonista Central */}
          {recipe.photo && (
            <div className="w-full h-[180px] print:h-[155px] max-h-[190px] print:max-h-[155px] rounded-xl overflow-hidden border-2 border-slate-900 mb-2.5 bg-slate-50 shadow-xs print:shadow-none print:border-black break-inside-avoid flex justify-center items-center shrink-0">
              <img
                src={recipe.photo}
                alt={recipe.name}
                className="w-full h-full object-contain mx-auto block"
              />
            </div>
          )}

          {/* Fila de Alérgenos Activos y Mini Comentario Sugerente */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-2.5 break-inside-avoid shrink-0">
            <div className="md:col-span-5 bg-white rounded-xl p-2 border border-slate-900 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1 border-b border-slate-100 pb-0.5">
                <AlertOctagon size={11} className="text-amber-500" />
                <span className="text-[7.5px] font-black text-slate-900 uppercase tracking-widest">
                  Alérgenos del Plato
                </span>
              </div>
              {allAllergens.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {allAllergens.map((a) => (
                    <span
                      key={a}
                      className="text-[7px] font-black uppercase text-amber-950 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Sin alérgenos de declaración obligatoria
                </span>
              )}
            </div>

            <div className="md:col-span-7 bg-amber-50/50 rounded-xl p-2 border border-amber-200/70 flex items-center gap-2.5">
              <div className="bg-amber-500 text-slate-900 p-1.5 rounded-lg shrink-0">
                <MessageSquare size={14} />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[7px] font-black uppercase tracking-widest text-amber-800">
                  Presentación al Cliente / Nota Sugerente
                </p>
                <p className="text-[9px] font-medium italic text-slate-800 font-serif leading-tight line-clamp-2">
                  "
                  {recipe.minimalistCard?.miniComment ||
                    recipe.serviceDetails?.clientDescription ||
                    recipe.platingInstructions ||
                    "Presentación refinada de pase."}
                  "
                </p>
              </div>
            </div>
          </div>

          {/* Cuadrícula Minimalista: Ingredientes Consolidados vs Mini Elaboración Directa */}
          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden break-inside-avoid mb-2">
            {/* Lado Izquierdo: Ingredientes Consolidados */}
            <div className="col-span-5 bg-white rounded-xl p-2.5 border border-slate-900 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1">
                  <h3 className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Utensils size={10} className="text-indigo-600" />{" "}
                    Ingredientes ({consolidatedIngredients.length})
                  </h3>
                  <span className="text-[7px] font-black text-slate-500 uppercase">
                    {dynamicPax} pax
                  </span>
                </div>
                <div className="max-h-[220px] print:max-h-none overflow-y-auto print:overflow-visible">
                  <table className="w-full text-[8px] print:text-[7.5px] text-slate-700">
                    <tbody className="divide-y divide-slate-100">
                      {consolidatedIngredients.map((ing, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-0.5 font-bold uppercase tracking-tight text-slate-900 pr-1">
                            {ing.name}
                          </td>
                          <td className="py-0.5 text-right font-black text-slate-900 whitespace-nowrap">
                            {ing.quantity}
                          </td>
                          <td className="py-0.5 pl-1 text-slate-400 font-bold uppercase text-[6.5px] text-right">
                            {ing.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Lado Derecho: Esquema de Elaboración y Emplatado */}
            <div className="col-span-7 bg-white rounded-xl p-2.5 border border-slate-900 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1.5">
                  <h3 className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <ChefHat size={10} className="text-amber-500" /> Elaboración
                    y Pase
                  </h3>
                  <div className="flex items-center gap-2 text-[7.5px] font-bold text-slate-600">
                    <span>
                      Temp:{" "}
                      <strong className="text-amber-600">
                        {recipe.serviceDetails?.servingTemp || "--"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[8px] print:text-[7.5px] text-slate-700 max-h-[220px] print:max-h-none overflow-y-auto print:overflow-visible">
                  {recipe.minimalistCard?.summaryInstructions ? (
                    <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200">
                      <p className="font-serif italic text-slate-700 leading-relaxed whitespace-pre-line text-[8px] print:text-[7.5px]">
                        {recipe.minimalistCard.summaryInstructions}
                      </p>
                    </div>
                  ) : (
                    (recipe.subRecipes || []).map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="border-b border-slate-100 pb-1 last:border-0 last:pb-0"
                      >
                        <p className="font-black text-slate-900 uppercase text-[7.5px] tracking-tight mb-0.5 flex items-center gap-1">
                          <span className="w-3 h-3 bg-slate-900 text-white rounded-full flex items-center justify-center text-[6.5px] font-black shrink-0">
                            {sIdx + 1}
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </p>
                        <p className="text-slate-600 font-serif italic text-[7.5px] leading-snug whitespace-pre-wrap pl-3.5 line-clamp-3">
                          {sub.instructions || "Técnica no especificada."}
                        </p>
                      </div>
                    ))
                  )}

                  {(recipe.minimalistCard?.platingTips ||
                    recipe.platingInstructions) && (
                    <div className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[7.5px] mt-1">
                      <p className="font-black uppercase text-indigo-900 text-[6.5px] tracking-wider mb-0.5">
                        Emplatado y Montaje:
                      </p>
                      <p className="text-indigo-900 font-serif italic leading-snug">
                        {recipe.minimalistCard?.platingTips ||
                          recipe.platingInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pie de Ficha Académica */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            <span>
              {settings.instituteName} • Departamento de Hostelería y Cocina
            </span>
            <span>Lámina de Pase (1 Folio)</span>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA 2: FICHA TÉCNICA COMPLETA INTEGRAL (TRADICIONAL DETALLADA)           */
        /* ========================================================================= */

        <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full overflow-hidden p-8 print:p-6 border border-slate-200 print:border-none rounded-[1.5rem] print:rounded-none">
          {/* Cabecera compacta con Espacios Fijos */}
          <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-4 gap-4">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 w-fit">
                {displayBadges.map((cat) => (
                  <div key={cat} className="relative">
                    <CategoryStripe
                      category={cat}
                      settings={settings}
                      className="absolute inset-0 rounded opacity-20"
                    />
                    <span className="relative text-slate-700 font-black text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 block">
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 leading-tight tracking-tight uppercase mt-0.5 break-words">
                {recipe.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 border border-slate-200 px-2 py-0.5 rounded">
                  <Users size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">
                    {dynamicPax} {recipe.yieldUnit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 border border-slate-900 px-2 py-0.5 rounded bg-slate-50">
                  <span className="text-[10px] font-black text-slate-900 uppercase">
                    Coste/Ración:{" "}
                    {recipe.totalCost && recipe.yieldQuantity
                      ? ((recipe.totalCost / recipe.yieldQuantity) * paxRatio)
                          .toFixed(2)
                          .replace(".", ",")
                      : "0,00"}
                    €
                  </span>
                </div>
                {recipe.creator && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    <ChefHat size={12} className="text-amber-500" />
                    <span>Chef/Prof: {recipe.creator}</span>
                  </div>
                )}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors no-print"
                  >
                    <ExternalLink size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase">
                      Visitar Origen
                    </span>
                  </a>
                )}
              </div>
            </div>
            {/* Espacio fijo para logos (Centro y Profesor) */}
            <div className="shrink-0 flex items-center justify-end gap-3 self-center pl-2">
              {/* Logo Centro */}
              <div className="h-14 w-28 flex items-center justify-end shrink-0">
                {settings.instituteLogo || appUser?.instituteLogo ? (
                  <img
                    src={settings.instituteLogo || appUser?.instituteLogo}
                    alt="Logo Centro"
                    className="max-h-14 max-w-28 object-contain"
                  />
                ) : (
                  <span className="font-black text-[9px] uppercase tracking-wider text-slate-400 text-right leading-tight block">
                    {settings.instituteName}
                  </span>
                )}
              </div>
              {/* Logo Profesor */}
              {(recipe.creatorLogo ||
                appUser?.teacherLogo ||
                settings.teacherLogo) && (
                <div className="h-14 w-16 flex items-center justify-center shrink-0">
                  <img
                    src={
                      recipe.creatorLogo ||
                      appUser?.teacherLogo ||
                      settings.teacherLogo
                    }
                    alt="Logo Profesor"
                    className="max-h-14 max-w-16 object-contain rounded-lg border border-slate-200 shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BANNER PANORÁMICO SUPERIOR (Infografía de Emplatado / Diagrama + Foto) */}
          {recipe.photo && isBanner && (
            <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-900 mb-6 bg-white shadow-md print:shadow-none print:border-black break-inside-avoid flex justify-center items-center">
              <img
                src={recipe.photo}
                alt={recipe.name}
                className="w-full h-auto object-contain max-h-[460px] print:max-h-[360px] mx-auto block"
              />
            </div>
          )}

          {/* BLOQUE DE EXPLICACIÓN COMERCIAL - Más compacto */}
          <div className="bg-white border-2 border-slate-900 text-slate-900 p-6 rounded-2xl mb-6 flex items-start gap-6 relative overflow-hidden break-inside-avoid">
            <div className="bg-amber-500 p-3 rounded-xl text-slate-900 shrink-0 shadow-lg">
              <MessageSquare size={24} />
            </div>
            <div className="flex-grow">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">
                Explicación Sugerente (Servicio)
              </p>
              <p className="text-base font-medium italic leading-snug text-slate-700 font-serif">
                "{recipe.serviceDetails?.clientDescription || "No definida."}"
              </p>
            </div>
          </div>

          {/* CONTROL DE ALÉRGENOS - FORMATO COMPACTO Y ULTRA FUNCIONAL */}
          {isBanner && (
            <div className="w-full bg-white rounded-xl px-4 py-3 border border-slate-900 break-inside-avoid shadow-xs mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Declaración de alérgenos activos */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-900">
                    <AlertOctagon size={13} className="text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Alérgenos:
                    </span>
                  </div>
                  {allAllergens.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {allAllergens.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-[9px] font-black uppercase shadow-xs"
                        >
                          <AllergenIcon allergen={a} size={14} />
                          <span>{a}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-black uppercase shadow-xs">
                      <Check size={12} className="text-emerald-600" />
                      <span>
                        Sin alérgenos de declaración obligatoria (100% Libre)
                      </span>
                    </span>
                  )}
                </div>

                {/* Micro-Tira de Verificación de los 14 Alérgenos Reglamentarios */}
                <div
                  className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200"
                  title="Matriz legal de 14 alérgenos UE 1169/2011"
                >
                  {ALLERGEN_LIST.map((allergen) => {
                    const isPresent = allAllergens.includes(allergen);
                    return (
                      <div
                        key={allergen}
                        className={`transition-all ${isPresent ? "opacity-100 scale-110 drop-shadow-xs" : "opacity-20 grayscale"}`}
                        title={`${allergen}: ${isPresent ? "PRESENTE" : "No contiene"}`}
                      >
                        <AllergenIcon allergen={allergen} size={15} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VÍDEOS Y ENLACES GENERALES DEL PLATO */}
          {recipe.videos?.length || recipe.sourceUrl || recipe.videoUrl ? (
            <VideoListDisplay
              videos={recipe.videos}
              legacyUrl={recipe.sourceUrl || recipe.videoUrl}
              title="Vídeos y Enlaces Generales del Plato"
              variant="recipe"
            />
          ) : null}

          <div className="space-y-8 mb-8">
            {/* FOTO Y ALÉRGENOS - FORMATO CLÁSICO LATERAL */}
            {!isBanner && (
              <div className="flex gap-4 items-stretch break-inside-avoid mb-4">
                {recipe.photo && (
                  <div className="w-1/3 max-w-[220px] aspect-[4/3] rounded-xl overflow-hidden border border-slate-900 shrink-0 bg-slate-50 flex items-center justify-center">
                    <img
                      src={recipe.photo}
                      alt={recipe.name}
                      className="w-full h-full object-contain mx-auto p-0.5"
                    />
                  </div>
                )}

                <div className="flex-grow bg-white rounded-xl p-3.5 border border-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <AlertOctagon size={13} className="text-amber-500" />
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                          Declaración de Alérgenos
                        </span>
                      </div>
                      {allAllergens.length > 0 ? (
                        <span className="text-[8px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          {allAllergens.length} presente
                          {allAllergens.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          0 declarados
                        </span>
                      )}
                    </div>

                    {allAllergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {allAllergens.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-[9px] font-black uppercase shadow-xs"
                          >
                            <AllergenIcon allergen={a} size={14} />
                            <span>{a}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-black uppercase mb-2.5 flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600" />
                        <span>
                          Sin alérgenos de declaración obligatoria (100% Libre)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Micro-Tira de Verificación de los 14 Alérgenos Reglamentarios */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">
                      Reglamento UE:
                    </span>
                    <div className="flex items-center gap-1">
                      {ALLERGEN_LIST.map((allergen) => {
                        const isPresent = allAllergens.includes(allergen);
                        return (
                          <div
                            key={allergen}
                            className={`transition-all ${isPresent ? "opacity-100 scale-110 drop-shadow-xs" : "opacity-20 grayscale"}`}
                            title={`${allergen}: ${isPresent ? "PRESENTE" : "No contiene"}`}
                          >
                            <AllergenIcon allergen={allergen} size={14} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ELABORACIONES: ESCANDALLO + PROCESO JUNTOS */}
            <div className="space-y-6">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xs border-b-2 border-slate-900 pb-1">
                DESARROLLO TÉCNICO POR ELABORACIÓN
              </h3>
              {(recipe.subRecipes || []).map((sub, sIdx) => (
                <div
                  key={sub.id}
                  className="no-break space-y-3 border-b border-slate-200 pb-6 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="border border-slate-900 text-slate-900 w-5 h-5 flex items-center justify-center rounded font-black text-[10px]">
                      {sIdx + 1}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      {sub.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    {/* LADO IZQUIERDO: Escandallo (Compacto) */}
                    <div className="col-span-4 space-y-2">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-0.5">
                        Ingredientes / Escandallo
                      </p>
                      <table className="w-full text-[10px] text-slate-700 ingredients-table">
                        <tbody className="divide-y divide-slate-50">
                          {(sub.ingredients || []).map((ing, iIdx) => {
                            const scaled = getScaledData(
                              ing.quantity,
                              ing.unit,
                              ing.baseUnit,
                              ing.name,
                            );
                            return (
                              <tr key={iIdx}>
                                <td className="py-1 font-bold uppercase tracking-tight leading-tight">
                                  {ing.name}
                                  {ing.notes && (
                                    <span className="block text-[7.5px] text-amber-800 font-medium normal-case italic">
                                      ({ing.notes})
                                    </span>
                                  )}
                                </td>
                                <td className="py-1 text-right font-black text-slate-900 whitespace-nowrap">
                                  {scaled.quantity}
                                </td>
                                <td className="py-1 pl-1 text-slate-400 font-bold uppercase text-[7px] text-right">
                                  {scaled.unit}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* LADO DERECHO: Proceso (Compacto) */}
                    <div className="col-span-8 space-y-2">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-0.5">
                        Técnica y Ejecución
                      </p>
                      <div className="space-y-3">
                        {sub.photos && sub.photos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {sub.photos.map((p, pIdx) => (
                              <div key={pIdx} className="relative aspect-[4/3]">
                                <img
                                  src={p}
                                  alt={`${sub.name} step ${pIdx + 1}`}
                                  className="w-full h-full object-cover rounded-lg border border-slate-100"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-600 leading-snug text-justify whitespace-pre-wrap font-serif italic instructions-text">
                          {sub.instructions || "Técnica no definida."}
                        </div>
                        <VideoListDisplay
                          videos={sub.videos}
                          legacyUrl={sub.videoUrl}
                          title={`Vídeos Técnicos: ${sub.name}`}
                          variant="subRecipe"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESPIECE Y COMPONENTES ENLAZADOS */}
            {recipe.linkedRecipeIds &&
              recipe.linkedRecipeIds.length > 0 &&
              allRecipes && (
                <div className="bg-slate-50 border-2 border-slate-900 rounded-[2rem] p-6 shadow-sm space-y-4 my-8">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} className="text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        Despiece y Componentes Enlazados (
                        {recipe.linkedRecipeIds.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Salsas, Guarniciones y Elaboraciones de Soporte
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipe.linkedRecipeIds.map((id) => {
                      const linked = allRecipes.find((r) => r.id === id);
                      if (!linked) return null;
                      return (
                        <div
                          key={id}
                          onClick={() =>
                            onSelectRecipe && onSelectRecipe(linked)
                          }
                          className="flex items-center justify-between bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 p-4 rounded-2xl transition-all cursor-pointer group shadow-xs"
                        >
                          <div className="flex items-center gap-3.5">
                            {linked.photo ? (
                              <img
                                src={linked.photo}
                                alt=""
                                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                FT
                              </div>
                            )}
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                                {linked.category || "Componente"}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {linked.name}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500">
                                Rendimiento: {linked.yieldQuantity}{" "}
                                {linked.yieldUnit}
                                {linked.totalCost
                                  ? ` · Coste: ${linked.totalCost.toFixed(2)}€`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shadow-xs no-print">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <MolecularPairings
              recipe={recipe}
              includeInPrint={includeAnalysis}
            />
          </div>

          {/* FICHA TÉCNICA DE SERVICIO + CHECKLIST - Nueva página en impresión */}
          <div className="page-break"></div>
          <div className="bg-white border-2 border-slate-900 text-slate-900 p-8 rounded-[2rem] mt-6 break-inside-avoid">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
              <Clock size={24} className="text-amber-600" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Ficha de Pase y Servicio
                </h3>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Información clave para sala
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Temperatura
                </p>
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-rose-500" />
                  <span className="text-xs font-black text-amber-600">
                    {recipe.serviceDetails?.servingTemp || "--"}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Técnica
                </p>
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                  <span className="text-[9px] font-black uppercase text-slate-700 leading-tight">
                    {recipe.serviceDetails?.serviceType || "Servicio estándar"}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Cubertería
                </p>
                <div className="flex items-start gap-2">
                  <UtensilsCrossed
                    size={16}
                    className="text-amber-600 shrink-0"
                  />
                  <span className="text-[8px] font-bold text-slate-600 uppercase leading-snug">
                    {recipe.serviceDetails?.cutlery || "Estándar"}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-500/30">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">
                  Rendimiento
                </p>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-amber-600" />
                  <span className="text-lg font-black text-amber-500 leading-none">
                    {dynamicPax} {(recipe.yieldUnit || "pax").substring(0, 3)}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-500/30">
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                  Coste / Ración
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-indigo-600 leading-none">
                    {recipe.totalCost && recipe.yieldQuantity
                      ? ((recipe.totalCost / recipe.yieldQuantity) * paxRatio)
                          .toFixed(2)
                          .replace(".", ",")
                      : "0,00"}
                  </span>
                  <span className="text-xs font-black text-indigo-400">€</span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white p-5 rounded-2xl border border-slate-200">
              <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Protocolo de Emplatado y Acabado
              </h4>
              <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                {recipe.platingInstructions ||
                  "Seguir protocolo estándar de la categoría."}
              </p>
            </div>

            {/* CHECKLIST DE MISE EN PLACE - SOLO AL FINAL DE LA FICHA DE SERVICIO */}
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-tighter text-xs mb-4 border-b border-slate-200 pb-2">
                <UtensilsCrossed size={14} className="text-emerald-600" />{" "}
                CHECKLIST DE MISE EN PLACE (REPASO FINAL)
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {(recipe.subRecipes || []).map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-slate-300 rounded flex-shrink-0"></div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase">
                      {sub.name}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-300 rounded flex-shrink-0"></div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                    Marcaje de Mesa (
                    {recipe.serviceDetails?.cutlery || "Estándar"})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-300 rounded flex-shrink-0"></div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                    Temperatura de Servicio (
                    {recipe.serviceDetails?.servingTemp || "--"})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-300 rounded flex-shrink-0"></div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                    Protocolo de Emplatado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PROTOCOLO TÉCNICO Y ENCARTE CLIENTE TAKE AWAY (EN FICHA COMPLETA) */}
          {recipe.takeAwayDetails?.isTakeAway && (
            <div className="mt-8 space-y-6">
              {/* Tarjeta Técnica de Obrador / Cocina */}
              <div className="bg-slate-900 border-2 border-slate-800 text-white p-7 rounded-[2rem] break-inside-avoid shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight">
                        Protocolo de Embalaje y Take Away
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                        Control para cocina y empaquetado
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    {recipe.takeAwayDetails.targetServiceMode === "hot_delivery"
                      ? "Reparto Caliente"
                      : recipe.takeAwayDetails.targetServiceMode ===
                          "fifth_range"
                        ? "5ª Gama al Vacío"
                        : "Cook & Chill (24-48h)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                      Packaging Asignado
                    </span>
                    <p className="font-bold text-slate-200">
                      {recipe.takeAwayDetails.packagingType ||
                        "Envase estándar termosellable"}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                      Caducidad y Temp.
                    </span>
                    <p className="font-bold text-slate-200">
                      {recipe.takeAwayDetails.shelfLife || "48h"} ·{" "}
                      {recipe.takeAwayDetails.conservationTemp || "2ºC - 4ºC"}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                      Transporte / Estiba
                    </span>
                    <p className="font-medium text-slate-300">
                      {recipe.takeAwayDetails.transportTips ||
                        "Transportar en plano horizontal"}
                    </p>
                  </div>
                </div>

                {recipe.takeAwayDetails.packagingNotes && (
                  <div className="mt-4 p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                      Nota Crítica de Cocina
                    </span>
                    <p className="font-serif italic">
                      {recipe.takeAwayDetails.packagingNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* ENCARTE RECORTABLE FINAL PARA EL CLIENTE (✂) */}
              <div className="page-break"></div>
              {(() => {
                const ta = recipe.takeAwayDetails;
                const hf = ta?.homeFinishing;
                const summary =
                  hf?.summaryText ||
                  recipe.minimalistCard?.miniComment ||
                  recipe.serviceDetails?.clientDescription ||
                  "Elaboración culinaria artesanal.";
                const methodLabel =
                  hf?.heatingMethod === "microwave"
                    ? "Microondas"
                    : hf?.heatingMethod === "oven"
                      ? "Horno"
                      : hf?.heatingMethod === "pan"
                        ? "Sartén / Cazuela"
                        : hf?.heatingMethod === "bain_marie"
                          ? "Baño María"
                          : "Consumo en Frío";
                const methodIcon =
                  hf?.heatingMethod === "microwave"
                    ? "⏱"
                    : hf?.heatingMethod === "oven"
                      ? "🔥"
                      : hf?.heatingMethod === "pan"
                        ? "🍳"
                        : hf?.heatingMethod === "bain_marie"
                          ? "♨"
                          : "❄";

                return (
                  <div className="bg-white border-2 border-dashed border-slate-900 rounded-3xl p-6 print:p-5 my-6 text-slate-900 break-inside-avoid relative shadow-md print:shadow-none">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-slate-300">
                      <div className="flex items-center gap-2 text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider">
                        <Scissors size={14} className="text-amber-600" />
                        <span>
                          ✂ Cortar por la línea de puntos y adjuntar al envase /
                          bolsa de entrega
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        🥡 Encarte para el Cliente Final
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {settings.instituteName || "Cocina de Autor"}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-tight text-slate-900 mt-0.5">
                          {recipe.name}
                        </h2>
                        <p className="text-xs text-slate-600 font-serif italic mt-1 max-w-xl">
                          "{summary}"
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-center">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                            Consumo Preferente
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {ta?.shelfLife || "48h"}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-500 block">
                            {ta?.conservationTemp || "Refrigerado 2-4ºC"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Control de Alérgenos Compacto para Impresión */}
                    <div className="my-3 bg-white p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-slate-900">
                            <AlertOctagon size={13} className="text-rose-600" />
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              Alérgenos:
                            </span>
                          </div>
                          {allAllergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {allAllergens.map((a) => (
                                <span
                                  key={a}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-md text-[8.5px] font-black uppercase"
                                >
                                  <AllergenIcon allergen={a} size={13} />
                                  <span>{a}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[8.5px] font-black uppercase">
                              <Check size={11} className="text-emerald-600" />
                              <span>
                                Sin alérgenos obligatorios (100% Libre)
                              </span>
                            </span>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                          title="Matriz legal UE 1169/2011"
                        >
                          {ALLERGEN_LIST.map((allergen) => {
                            const isPresent = allAllergens.includes(allergen);
                            return (
                              <div
                                key={allergen}
                                className={`transition-all ${isPresent ? "opacity-100" : "opacity-20 grayscale"}`}
                                title={`${allergen}: ${isPresent ? "PRESENTE" : "No contiene"}`}
                              >
                                <AllergenIcon allergen={allergen} size={13} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">{methodIcon}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                            1. Cómo Calentar ({methodLabel})
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-800 leading-snug">
                          {hf?.heatingInstructions ||
                            "Abrir ligeramente la tapa y calentar a potencia media (2 min a 750W en microondas)."}
                        </p>
                      </div>

                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">✨</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                            2. Emplatado y Toque Final
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-800 leading-snug">
                          {hf?.platingSteps ||
                            "Verter la salsa caliente sobre el plato y espolvorear los crujientes reservados."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>
                        ¡Buen provecho! Elaborado con ingredientes
                        seleccionados.
                      </span>
                      <span>Por favor, recicla este envase · Gracias</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Infografía de Pastelería Anexa si es de tipo pastry y tiene infografía */}
          {(recipe.recipeType === "pastry" ||
            recipe.takeAwayDetails?.recipeType === "pastry") &&
            (recipe.pastryInfographic ||
              recipe.takeAwayDetails?.pastryInfographic) && (
              <div className="page-break max-w-4xl mx-auto my-8 pt-8 border-t-4 border-slate-900">
                <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white p-4 rounded-2xl mb-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/30 border border-rose-400/40 rounded-xl text-rose-200">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        🧁 Infografía Didáctica de Pastelería · Lámina Técnica
                        de Obrador
                      </h3>
                      <p className="text-[10px] text-rose-200">
                        Recurso visual didáctico integrado para la ejecución y
                        evaluación de la elaboración.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white text-rose-950 rounded-xl text-xs font-black uppercase hover:bg-rose-50 transition-all flex items-center gap-1.5 no-print shadow-xs"
                  >
                    <Printer size={14} /> Imprimir Lámina
                  </button>
                </div>

                <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 print:p-2 text-slate-900 shadow-md print:shadow-none flex flex-col items-center justify-center min-h-[600px]">
                  {(
                    recipe.pastryInfographic ||
                    recipe.takeAwayDetails?.pastryInfographic ||
                    ""
                  ).startsWith("data:image") ||
                  (
                    recipe.pastryInfographic ||
                    recipe.takeAwayDetails?.pastryInfographic ||
                    ""
                  ).startsWith("http") ? (
                    <img
                      src={
                        recipe.pastryInfographic ||
                        recipe.takeAwayDetails?.pastryInfographic
                      }
                      alt="Infografía Didáctica de Pastelería"
                      className="max-w-full max-h-[850px] object-contain mx-auto rounded-xl border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-full text-center py-12 space-y-4">
                      <div className="text-3xl">📄</div>
                      <p className="font-black text-slate-900 uppercase">
                        Documento de Infografía Anexo
                      </p>
                      <a
                        href={
                          recipe.pastryInfographic ||
                          recipe.takeAwayDetails?.pastryInfographic
                        }
                        download="infografia_pasteleria.pdf"
                        className="px-6 py-3 bg-rose-700 text-white rounded-xl font-black text-xs uppercase inline-flex items-center gap-2 hover:bg-rose-800 transition-all shadow-md"
                      >
                        <Download size={16} /> Descargar Archivo Infografía
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Pie de página limpio */}
          <div className="mt-8 text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] print:hidden border-t border-slate-50 pt-6">
            {settings.instituteName} •{" "}
            {recipe.creator || appUser?.teacherName || appUser?.displayName}
          </div>

          {/* Pie de página limpio para impresión al final del documento (sin posición fija para evitar solapar cabeceras en páginas siguientes) */}
          <div className="hidden print:flex items-center justify-between text-[7.5px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-200 pt-3 mt-6">
            <span>
              {recipe.name} • {recipe.category}
            </span>
            <span>{settings.instituteName}</span>
          </div>
        </div>
      )}

      {/* Modal Generador de Prompt para Lámina Doble IA */}
      <ImagePromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        recipeName={recipe.name}
        category={recipe.category}
        subRecipes={recipe.subRecipes}
        platingInstructions={
          recipe.platingInstructions || recipe.serviceDetails?.presentation
        }
        takeAwayDetails={recipe.takeAwayDetails}
      />
    </div>
  );
};
