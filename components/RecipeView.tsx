import React, { useMemo, useState, useEffect } from "react";
import {
  Recipe,
  AppSettings,
  Allergen,
  ALLERGEN_LIST,
  AppUser,
  isUserOwner,
  Product,
} from "../types";
import { formatScaledQuantity } from "../lib/unitUtils";
import { transformDriveUrl } from "../lib/googleDriveService";
import { matchProductInCatalog } from "../lib/productUtils";
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
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";

import { CategoryStripe } from "./CategoryStripe";
import { AllergenIcon } from "./AllergenIcon";
import { MolecularPairings } from "./MolecularPairings";
import { VideoListDisplay } from "./VideoListDisplay";
import { hasValidVideos } from "../lib/videoUtils";
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
  productDatabase?: Product[];
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

export const formatElaborationSteps = (rawText?: string): string[] => {
  if (!rawText) return [];
  const trimmed = rawText.trim();
  // Si ya contiene saltos de línea explícitos, respetarlos
  if (trimmed.includes("\n")) {
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return lines;
    }
  }

  // Detectar pasos numerados inline: "1. ... 2. ... 3. ..."
  const parts = trimmed
    .split(/(?<=(?:^|[.!?\n]))\s*(?=\b\d{1,2}[\.\)]\s+[A-ZÁÉÍÓÚÑa-záéíóúñ])/g)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts;
  }

  const fallbackParts = trimmed
    .split(/(?=\b\d{1,2}[\.\)]\s+)/g)
    .map(p => p.trim())
    .filter(Boolean);

  if (fallbackParts.length > 1) {
    return fallbackParts;
  }

  return [trimmed];
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
  productDatabase,
  onSelectRecipe,
}) => {
  const [dynamicPax, setDynamicPax] = useState<number>(
    recipe.yieldQuantity || 4,
  );
  const [isBanner] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<
    "complete" | "minimal" | "takeaway_slip"
  >("complete");
  const [includeAnalysis, setIncludeAnalysis] = useState<boolean>(true);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  useEffect(() => {
    const originalTitle = document.title;
    const cleanName = (recipe?.name || "FICHA TÉCNICA").replace(/[/\\?%*:|"<>]/g, '-').trim();
    document.title = cleanName;

    const handleBeforePrint = () => {
      const freshName = (recipe?.name || "FICHA TÉCNICA").replace(/[/\\?%*:|"<>]/g, '-').trim();
      document.title = freshName;
    };

    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.title = originalTitle;
    };
  }, [recipe?.name]);

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

    let catalog = productDatabase;
    if (!catalog || catalog.length === 0) {
      try {
        const cached = localStorage.getItem('cached_products');
        if (cached) catalog = JSON.parse(cached);
      } catch {}
    }

    recipe.subRecipes?.forEach((sub) => {
      sub.ingredients?.forEach((ing) => {
        ing.allergens?.forEach((a) => addAllergen(a));
        // Verificación activa con el catálogo para alérgenos aparejados
        if (catalog && catalog.length > 0 && ing.name && !ing.isInternalPrep && !ing.isNonProduct) {
          const matched = matchProductInCatalog(ing.name, catalog);
          matched?.allergens?.forEach((a) => addAllergen(a));
        }
      });
    });
    recipe.extraAllergens?.forEach((a) => addAllergen(a));
    recipe.minimalistCard?.allergens?.forEach((a) => addAllergen(a));
    return Array.from(set);
  }, [recipe, productDatabase]);

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
    let catalog = productDatabase;
    if (!catalog || catalog.length === 0) {
      try {
        const cached = localStorage.getItem('cached_products');
        if (cached) catalog = JSON.parse(cached);
      } catch {}
    }

    const list: {
      name: string;
      quantity: string;
      unit: string;
      notes?: string;
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
        let ingAllergens = Array.isArray(ing.allergens) ? [...ing.allergens] : [];
        if (catalog && catalog.length > 0 && !ing.isInternalPrep && !ing.isNonProduct) {
          const matched = matchProductInCatalog(ing.name, catalog);
          if (matched?.allergens && matched.allergens.length > 0) {
            ingAllergens = Array.from(new Set([...ingAllergens, ...matched.allergens]));
          }
        }
        list.push({
          name: ing.name.trim(),
          quantity: scaled.quantity,
          unit: scaled.unit,
          notes: ing.notes,
          allergens: ingAllergens,
        });
      });
    });
    return list;
  }, [recipe, paxRatio, productDatabase]);

  const handlePrint = (customSuffix: string | React.MouseEvent = '') => {
    const cleanName = (recipe?.name || "FICHA TÉCNICA").replace(/[/\\?%*:|"<>]/g, '-').trim();
    const suffixStr = typeof customSuffix === 'string' && customSuffix.trim().length > 0 ? customSuffix.trim() : '';
    document.title = suffixStr ? `${cleanName} - ${suffixStr}` : cleanName;
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-4 print:p-0 print:bg-white font-sans text-slate-900">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always !important; break-before: page !important; }
          .no-break { break-inside: avoid !important; page-break-inside: avoid !important; }
          .instructions-text { font-size: 12px !important; line-height: 1.55 !important; }
          .instructions-step { margin-bottom: 0.4rem !important; }
          .ingredients-table { font-size: 10px !important; }
          .video-list-container { break-inside: avoid !important; page-break-inside: avoid !important; }
          .pase-card-single-page { break-inside: avoid !important; page-break-inside: avoid !important; max-height: 100% !important; }
          
          @page {
            margin: 8mm 8mm 8mm 8mm;
            size: A4 portrait;
          }
        }
      `,
        }}
      />
      <title>{recipe.name}</title>
      {/* Layout de 2 Columnas con Panel de Control Lateral */}
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* PANEL LATERAL DE CONTROL Y ACCIONES (no-print) */}
        <aside className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:sticky lg:top-4 no-print space-y-4">
          
          {/* Bloque 1: Acciones Principales */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all"
            >
              <ArrowLeft size={16} />
              <span>Volver al Panel</span>
            </button>

            {/* BOTÓN SOLICITADO: MODIFICAR / EDITAR FICHA */}
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all group"
              title="Abrir el editor profesional para modificar datos, ingredientes o fotografías de esta ficha"
            >
              <Edit2 size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Modificar Ficha</span>
            </button>

            {/* BOTÓN PRINCIPAL: IMPRIMIR FICHA */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg transition-all"
            >
              <Printer size={18} fill="currentColor" className="opacity-90" />
              <span>Imprimir Ficha</span>
            </button>

            {/* AVISO PDF LIMPIO SIN URL NI FECHA */}
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[10px] text-sky-950 flex items-start gap-2">
              <span className="text-sm shrink-0">💡</span>
              <span className="leading-snug">
                <strong>Consejo PDF limpio:</strong> Al guardar en PDF, desmarca <em>"Encabezados y pies de página"</em> en las opciones del navegador para que no aparezcan URLs ni fechas en los márgenes.
              </span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Bloque 2: Modo de Ficha */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
              Modo de Ficha:
            </label>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("complete")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "complete"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
                title="Ficha técnica completa integral con escandallo detallado y procesos paso a paso"
              >
                <span>📋</span>
                <span className="flex-1 text-left">Ficha Completa</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("minimal")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "minimal"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
                title="Ficha visual minimalista de 1 página con infografía protagonista, ingredientes y pase"
              >
                <span>⚡</span>
                <span className="flex-1 text-left">Minimalista (1 Pág.)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("takeaway_slip")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "takeaway_slip"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
                title="Ver e imprimir exclusivamente el encarte recortable con instrucciones para el cliente"
              >
                <span>✂️</span>
                <span className="flex-1 text-left">
                  Encarte Cliente {recipe.takeAwayDetails?.isTakeAway ? "🥡" : ""}
                </span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Bloque 3: Escalar Raciones y Análisis */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Escalar Raciones (Pax):
              </label>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDynamicPax(Math.max(1, dynamicPax - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
                  title="Disminuir raciones"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={dynamicPax}
                  onChange={(e) => setDynamicPax(Math.max(1, Number(e.target.value)))}
                  className="w-full text-center font-black text-indigo-700 text-base bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDynamicPax(dynamicPax + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
                  title="Aumentar raciones"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Análisis Molecular (Impresión):
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIncludeAnalysis(true)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    includeAnalysis
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Incluir el análisis molecular organoléptico (FlavorDB) al imprimir"
                >
                  ✓ Sí
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeAnalysis(false)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !includeAnalysis
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Omitir el análisis molecular al imprimir"
                >
                  ✕ No
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Bloque 4: Herramientas Adicionales & IA */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Herramientas de Receta:
            </label>

            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(recipe)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
                title="Duplicar esta receta para crear una variante"
              >
                <Copy size={14} />
                <span>Duplicar Ficha</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                recipe.takeAwayDetails?.isTakeAway
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200"
              }`}
              title="Ver y copiar prompt profesional para generar la lámina con IA"
            >
              {recipe.takeAwayDetails?.isTakeAway ? (
                <Box size={14} className="text-amber-600 shrink-0" />
              ) : (
                <Sparkles size={14} className="text-indigo-600 shrink-0" />
              )}
              <span className="truncate">
                {recipe.takeAwayDetails?.isTakeAway ? "Prompt IA (Take Away)" : "Prompt IA lámina 16:9"}
              </span>
            </button>

            {onUpgradeToPro && (
              <button
                type="button"
                onClick={() => onUpgradeToPro(recipe)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-all"
                title="Llevar esta receta al Taller I+D Profesional (5 niveles Michelin)"
              >
                <Compass size={14} className="text-amber-700 shrink-0" />
                <span>Taller I+D Michelin</span>
              </button>
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL DE FICHA / DOCUMENTO */}
        <main className="flex-1 w-full min-w-0">

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
              onClick={() => handlePrint('Encarte Take Away')}
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
                            <span>{ing.name}</span>
                            {ing.notes && (
                              <span className="block text-[7px] text-amber-800 font-medium normal-case italic">
                                ({ing.notes})
                              </span>
                            )}
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

                  {(recipe.presentation ||
                    recipe.minimalistCard?.presentation ||
                    recipe.minimalistCard?.platingTips ||
                    recipe.platingInstructions) && (
                    <div className="p-1.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[7.5px] mt-1">
                      <p className="font-black uppercase text-indigo-900 text-[6.5px] tracking-wider mb-0.5 flex items-center gap-1">
                        <Sparkles size={9} className="text-amber-500" />
                        PRESENTACIÓN:
                      </p>
                      <p className="text-indigo-900 font-serif italic leading-snug">
                        {recipe.presentation ||
                          recipe.minimalistCard?.presentation ||
                          recipe.minimalistCard?.platingTips ||
                          recipe.platingInstructions}
                      </p>
                    </div>
                  )}

                  {(recipe.importantNotes ||
                    recipe.serviceDetails?.importantNotes ||
                    recipe.minimalistCard?.importantNotes) && (
                    <div className="p-1.5 bg-amber-50/80 rounded-lg border border-amber-200 text-[7.5px] mt-1">
                      <p className="font-black uppercase text-amber-950 text-[6.5px] tracking-wider mb-0.5 flex items-center gap-1">
                        <AlertCircle size={9} className="text-amber-600" />
                        PUNTOS IMPORTANTES (SI LOS HAY):
                      </p>
                      <p className="text-amber-950 font-serif italic leading-snug">
                        {recipe.importantNotes ||
                          recipe.serviceDetails?.importantNotes ||
                          recipe.minimalistCard?.importantNotes}
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

          {/* BANNER PANORÁMICO SUPERIOR (Infografía de Emplatado / Diagrama + Foto) - MODELO LUBINA */}
          {recipe.photo && (
            <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-900 mb-5 bg-white shadow-md print:shadow-none print:border-black break-inside-avoid flex justify-center items-center">
              <img
                src={recipe.photo}
                alt={recipe.name}
                className="w-full h-auto object-contain max-h-[460px] print:max-h-[300px] mx-auto block"
              />
            </div>
          )}

          {/* BLOQUE DE EXPLICACIÓN COMERCIAL */}
          <div className="bg-white border-2 border-slate-900 text-slate-900 p-5 print:p-4 rounded-2xl mb-5 flex items-start gap-5 relative overflow-hidden break-inside-avoid">
            <div className="bg-amber-500 p-2.5 rounded-xl text-slate-900 shrink-0 shadow-md">
              <MessageSquare size={22} />
            </div>
            <div className="flex-grow">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">
                Explicación Sugerente (Servicio)
              </p>
              <p className="text-base print:text-sm font-medium italic leading-snug text-slate-700 font-serif">
                "{recipe.serviceDetails?.clientDescription || "No definida."}"
              </p>
            </div>
          </div>

          {/* CONTROL DE ALÉRGENOS - FORMATO COMPACTO Y ULTRA FUNCIONAL (MODELO LUBINA) */}
          <div className="w-full bg-white rounded-xl px-4 py-3 border border-slate-900 break-inside-avoid shadow-xs mb-5">
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

          {/* VÍDEOS Y ENLACES GENERALES DEL PLATO */}
          {hasValidVideos(recipe.videos, recipe.sourceUrl || recipe.videoUrl) ? (
            <VideoListDisplay
              videos={recipe.videos}
              legacyUrl={recipe.sourceUrl || recipe.videoUrl}
              title="Vídeos y Enlaces Generales del Plato"
              variant="recipe"
            />
          ) : null}

          {/* TÍTULO DE SECCIÓN AL CIERRE DE PÁGINA 1 */}
          <div className="border-b-2 border-slate-900 pb-1 mb-4 break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xs">
              DESARROLLO TÉCNICO POR ELABORACIÓN
            </h3>
          </div>

          {/* SALTO DE PÁGINA: Comienzo de Elaboraciones en Página 2 */}
          <div className="page-break" />

          {/* ELABORACIONES: ESCANDALLO + PROCESO */}
          <div className="space-y-8 mb-8 pt-2">
            <div className="space-y-6">
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
                        <div className="text-[12px] sm:text-[13px] text-slate-700 leading-relaxed text-justify font-serif italic instructions-text space-y-2">
                          {formatElaborationSteps(sub.instructions).map((step, sStepIdx) => (
                            <p key={sStepIdx} className="instructions-step">
                              {step}
                            </p>
                          ))}
                        </div>
                        {hasValidVideos(sub.videos, sub.videoUrl) ? (
                          <VideoListDisplay
                            videos={sub.videos}
                            legacyUrl={sub.videoUrl}
                            title={`Vídeos Técnicos: ${sub.name}`}
                            variant="subRecipe"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECCIÓN MOVIDA: PRESENTACIÓN Y PUNTOS IMPORTANTES (JUSTO DEBAJO DEL MONTAJE) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-6 no-break">
              {/* APARTADO: PRESENTACIÓN */}
              <div
                className={`${
                  (recipe.importantNotes ||
                    recipe.serviceDetails?.importantNotes ||
                    (recipe.takeAwayDetails?.isTakeAway &&
                      (recipe.takeAwayDetails?.packagingNotes ||
                        recipe.takeAwayDetails?.transportTips)))
                    ? "md:col-span-7"
                    : "md:col-span-12"
                } bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Sparkles size={14} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        PRESENTACIÓN (MONTAJE & PASE)
                      </h3>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      {recipe.takeAwayDetails?.isTakeAway
                        ? "Packaging & Montaje"
                        : "Vajilla & Pase en Sala"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-serif italic leading-relaxed whitespace-pre-wrap">
                    {recipe.presentation ||
                      recipe.platingInstructions ||
                      recipe.serviceDetails?.presentation ||
                      (recipe.takeAwayDetails?.isTakeAway
                        ? "Disposición ordenada en el envase kraft principal, salsa en tarrina hermética separada y crujientes secos para el comensal."
                        : "Emplatado equilibrado y limpio siguiendo los estándares gastronómicos de la receta.")}
                  </p>
                </div>
              </div>

              {/* APARTADO: PUNTOS IMPORTANTES (SI LOS HAY) */}
              {(recipe.importantNotes ||
                recipe.serviceDetails?.importantNotes ||
                (recipe.takeAwayDetails?.isTakeAway &&
                  (recipe.takeAwayDetails?.packagingNotes ||
                    recipe.takeAwayDetails?.transportTips))) ? (
                <div className="md:col-span-5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                          <AlertCircle size={14} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                          PUNTOS IMPORTANTES (SI LOS HAY)
                        </h3>
                      </div>
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                        Atención
                      </span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed italic whitespace-pre-wrap">
                      {recipe.importantNotes ||
                        recipe.serviceDetails?.importantNotes ||
                        [
                          recipe.takeAwayDetails?.packagingNotes,
                          recipe.takeAwayDetails?.transportTips,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                    </p>
                  </div>
                </div>
              ) : null}
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

          {/* FICHA TÉCNICA DE SERVICIO + CHECKLIST - Página única en impresión */}
          <div className="page-break"></div>
          <div className="bg-white border-2 border-slate-900 text-slate-900 p-5 md:p-6 print:p-4 rounded-2xl mt-4 break-inside-avoid pase-card-single-page space-y-3.5 print:space-y-2.5">
            {/* Cabecera compacta */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 print:pb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                    Ficha de Pase y Servicio
                  </h3>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Información técnica operativa para sala y pase
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
                  {recipe.name}
                </span>
              </div>
            </div>

            {/* 5 Tarjetas Estadísticas Compactas (1 Fila Intuitiva) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 print:gap-1.5">
              <div className="bg-slate-50 p-2.5 print:p-2 rounded-xl border border-slate-200/90 flex flex-col justify-between">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Thermometer size={12} className="text-rose-500 shrink-0" />
                  <span>Temperatura</span>
                </p>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  {recipe.serviceDetails?.servingTemp || "Templado / 45-50°C"}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 print:p-2 rounded-xl border border-slate-200/90 flex flex-col justify-between">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Info size={12} className="text-indigo-600 shrink-0" />
                  <span>Técnica</span>
                </p>
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-800 leading-tight line-clamp-2">
                  {recipe.serviceDetails?.serviceType || "Pase en bandeja / sala"}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 print:p-2 rounded-xl border border-slate-200/90 flex flex-col justify-between">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <UtensilsCrossed size={12} className="text-amber-600 shrink-0" />
                  <span>Cubertería</span>
                </p>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase leading-tight line-clamp-2">
                  {recipe.serviceDetails?.cutlery || "Directo / Finger Food"}
                </span>
              </div>

              <div className="bg-amber-50/60 p-2.5 print:p-2 rounded-xl border border-amber-300/80 flex flex-col justify-between">
                <p className="text-[7.5px] font-black text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Users size={12} className="text-amber-700 shrink-0" />
                  <span>Rendimiento</span>
                </p>
                <span className="text-xs sm:text-sm font-black text-amber-900 leading-tight">
                  {dynamicPax} {(recipe.yieldUnit || "PAX").toUpperCase()}
                </span>
              </div>

              <div className="bg-indigo-50/60 p-2.5 print:p-2 rounded-xl border border-indigo-200 flex flex-col justify-between">
                <p className="text-[7.5px] font-black text-indigo-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <span>Coste / Ración</span>
                </p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xs sm:text-sm font-black text-indigo-900 leading-tight font-mono">
                    {recipe.totalCost && recipe.yieldQuantity
                      ? ((recipe.totalCost / recipe.yieldQuantity) * paxRatio)
                          .toFixed(2)
                          .replace(".", ",")
                      : "0,00"}
                  </span>
                  <span className="text-[9px] font-black text-indigo-700">€</span>
                </div>
              </div>
            </div>

            {/* Protocolo de Presentación de Sala y Puntos Críticos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 print:gap-2">
              <div
                className={`${
                  recipe.importantNotes ||
                  recipe.serviceDetails?.importantNotes ||
                  recipe.takeAwayDetails?.packagingNotes ||
                  recipe.takeAwayDetails?.transportTips
                    ? "md:col-span-7"
                    : "md:col-span-12"
                } bg-white p-3.5 print:p-2.5 rounded-xl border border-slate-200/90 shadow-2xs`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-slate-100 pb-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <h4 className="text-[8.5px] font-black text-slate-900 uppercase tracking-wider">
                    Presentación y Montaje en Sala
                  </h4>
                </div>
                <p className="text-[10px] print:text-[9.5px] text-slate-700 font-serif italic leading-relaxed whitespace-pre-wrap">
                  {recipe.presentation ||
                    recipe.platingInstructions ||
                    recipe.serviceDetails?.presentation ||
                    "Servicio equilibrado y limpio siguiendo los estándares gastronómicos de la receta."}
                </p>
              </div>

              {(recipe.importantNotes ||
                recipe.serviceDetails?.importantNotes ||
                recipe.takeAwayDetails?.packagingNotes ||
                recipe.takeAwayDetails?.transportTips) && (
                <div className="md:col-span-5 bg-amber-50/70 p-3.5 print:p-2.5 rounded-xl border border-amber-300 shadow-2xs">
                  <div className="flex items-center gap-1.5 mb-1.5 border-b border-amber-200/80 pb-1">
                    <AlertCircle size={13} className="text-amber-600" />
                    <h4 className="text-[8.5px] font-black text-amber-950 uppercase tracking-wider">
                      Puntos Críticos & Alérgenos
                    </h4>
                  </div>
                  <p className="text-[10px] print:text-[9.5px] text-amber-950 font-medium leading-relaxed italic whitespace-pre-wrap">
                    {recipe.importantNotes ||
                      recipe.serviceDetails?.importantNotes ||
                      [
                        recipe.takeAwayDetails?.packagingNotes,
                        recipe.takeAwayDetails?.transportTips,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist de Mise en Place (Repaso Final) - Formato Compacto 2 Columnas */}
            <div className="p-3.5 print:p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <h4 className="flex items-center gap-1.5 font-black text-slate-900 uppercase tracking-tight text-[10px] print:text-[9px] mb-2.5 border-b border-slate-200 pb-1">
                <UtensilsCrossed size={12} className="text-emerald-600" />
                <span>Checklist de Mise en Place (Repaso de Pase)</span>
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 print:gap-y-1 text-[9.5px] print:text-[8.5px]">
                {(recipe.subRecipes || []).map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    <div className="w-3.5 h-3.5 border border-slate-400 rounded shrink-0 bg-white"></div>
                    <span className="font-bold text-slate-700 uppercase truncate">
                      {sub.name}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded shrink-0 bg-white"></div>
                  <span className="font-bold text-slate-700 uppercase truncate">
                    Marcaje de Mesa ({recipe.serviceDetails?.cutlery || "Estándar"})
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded shrink-0 bg-white"></div>
                  <span className="font-bold text-slate-700 uppercase truncate">
                    Temperatura de Servicio ({recipe.serviceDetails?.servingTemp || "--"})
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded shrink-0 bg-white"></div>
                  <span className="font-bold text-slate-700 uppercase truncate">
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

          {/* ========================================================================= */}
          {/* INFOGRAFÍA TÉCNICA DIDÁCTICA (HOJA APARTE AL FINAL DE LA FICHA)            */}
          {/* ========================================================================= */}
          {(() => {
            const rawInfographic =
              recipe.pastryInfographic ||
              recipe.infographicUrl ||
              recipe.takeAwayDetails?.pastryInfographic;
            if (!rawInfographic) return null;

            const infographicSrc = transformDriveUrl(rawInfographic);

            const isImage =
              infographicSrc.startsWith("data:image") ||
              infographicSrc.startsWith("http") ||
              infographicSrc.startsWith("/") ||
              infographicSrc.includes("googleusercontent.com") ||
              infographicSrc.includes("drive.google.com");

            return (
              <div className="page-break max-w-4xl mx-auto my-8 pt-8 border-t-4 border-slate-900 print:border-none print:m-0 print:p-0">
                {/* Cabecera en pantalla */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl mb-4 flex items-center justify-between shadow-md no-print">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/30 border border-indigo-400/40 rounded-xl text-indigo-200">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        📊 Infografía Técnica Didáctica · Hoja Técnica Anexa
                      </h3>
                      <p className="text-[10px] text-slate-300">
                        Recurso visual didáctico para la ejecución técnica, procesos y montaje del plato.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrint('Infografía Didáctica')}
                    className="px-3 py-1.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase hover:bg-slate-100 transition-all flex items-center gap-1.5 no-print shadow-xs"
                  >
                    <Printer size={14} /> Imprimir Hoja
                  </button>
                </div>

                {/* Cabecera académica para impresión */}
                <div className="hidden print:flex justify-between items-center pb-2.5 mb-3 border-b-2 border-slate-900">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {settings.instituteName} · INFOGRAFÍA TÉCNICA DIDÁCTICA
                    </span>
                    <h2 className="text-xl font-serif font-black uppercase tracking-tight text-slate-900">
                      {recipe.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                      {recipe.category || "Ficha Técnica"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-700">
                      Hoja Anexa de Infografía
                    </span>
                  </div>
                </div>

                {/* Contenedor de la Infografía a página completa */}
                <div className="bg-white border-2 border-slate-900 rounded-3xl p-4 print:p-0 print:border-none text-slate-900 shadow-md print:shadow-none flex flex-col items-center justify-center min-h-[600px] print:min-h-0">
                  {isImage ? (
                    <img
                      src={infographicSrc}
                      alt={`Infografía técnica de ${recipe.name}`}
                      className="max-w-full max-h-[820px] print:max-h-[250mm] object-contain mx-auto rounded-xl print:rounded-none shadow-sm print:shadow-none block"
                    />
                  ) : (
                    <div className="w-full text-center py-12 space-y-4">
                      <div className="text-4xl">📄</div>
                      <p className="font-black text-slate-900 uppercase text-sm">
                        Documento Técnico de Infografía Anexo
                      </p>
                      <a
                        href={infographicSrc}
                        download={`infografia_${recipe.name.replace(/\s+/g, '_')}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase inline-flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md no-print"
                      >
                        <Download size={16} /> Abrir / Descargar Archivo de Infografía
                      </a>
                    </div>
                  )}
                </div>

                {/* Pie de página de la hoja de infografía para impresión */}
                <div className="hidden print:flex items-center justify-between text-[7.5px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-200 pt-2.5 mt-3">
                  <span>
                    {recipe.name} • Infografía Técnica Didáctica
                  </span>
                  <span>{settings.instituteName}</span>
                </div>
              </div>
            );
          })()}

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
        </main>
      </div>

      {/* Modal Generador de Prompt para Lámina Doble IA */}
      <ImagePromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        recipeName={recipe.name}
        category={recipe.category}
        subRecipes={recipe.subRecipes}
        platingInstructions={
          recipe.presentation || recipe.platingInstructions || recipe.serviceDetails?.presentation
        }
        presentation={
          recipe.presentation || recipe.platingInstructions || recipe.serviceDetails?.presentation
        }
        importantNotes={
          recipe.importantNotes || recipe.serviceDetails?.importantNotes
        }
        takeAwayDetails={recipe.takeAwayDetails}
      />
    </div>
  );
};
