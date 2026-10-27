
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Recipe, Ingredient, ServiceDetails, SubRecipe, 
  Allergen, Product, VideoLink,
  SERVICE_TYPES, AppSettings, ALLERGEN_LIST, AppUser, TakeAwayDetails 
} from '../types';
import { CategoryStripe } from './CategoryStripe';
import { AllergenIcon } from './AllergenIcon';
import { VideoManagerInput } from './VideoManagerInput';
import { normalizeVideos } from '../lib/videoUtils';
import { calculateIngredientCost } from '../lib/costUtils';
import { compressImage, compressHeroBannerImage, getImageAspect } from '../lib/imageUtils';
import { uploadFileToDrive, transformDriveUrl, GOOGLE_DRIVE_FOLDER_ID, sanitizeFileName } from '../lib/googleDriveService';
import { ImagePromptModal } from './ImagePromptModal';
import { findSimilarProducts } from '../lib/productUtils';
import { 
  Save, X, Plus, Trash2, Image as ImageIcon, 
  Book, Utensils, Thermometer, Info, Database, MessageSquare, ChevronDown, CheckCircle2,
  ChefHat, Users, Camera, DatabaseZap, Check, HelpCircle, AlertOctagon, Sparkles,
  ShoppingBag, Box, Clock, Scissors, Flame, ArrowRight, AlertCircle, RefreshCw,
  Ban, Percent, Truck
} from 'lucide-react';

interface RecipeEditorProps {
  initialRecipe?: Recipe | null;
  productDatabase: Product[];
  settings: AppSettings;
  appUser: AppUser | null;
  onSave: (recipe: Recipe) => Promise<void> | void;
  onCancel: () => void;
  onAddProduct: (product: Product) => void;
  allRecipes?: Recipe[];
}

const emptyServiceDetails: ServiceDetails = {
  presentation: '',
  servingTemp: '',
  cutlery: '',
  passTime: '',
  serviceType: 'Servicio a la Americana',
  clientDescription: ''
};

const CUTLERY_QUICK_OPTIONS = [
  { label: "Entremeses", value: "TENEDOR Y CUCHILLO DE ENTREMÉS" },
  { label: "Trincheros", value: "TENEDOR Y CUCHILLO TRINCHERO" },
  { label: "Ostras", value: "TENEDOR DE OSTRAS" },
  { label: "Caviar", value: "CUCHARILLAS DE NÁCAR" },
  { label: "Cuchara Sopera", value: "CUCHARA SOPERA" },
  { label: "Consomé", value: "CUCHARA DE CONSOMÉ" },
  { label: "Pescado", value: "TENEDOR Y PALA DE PESCADO" },
  { label: "Marisco", value: "PINZAS Y TENEDOR DE MARISCO" },
  { label: "Carne Blanda", value: "CUCHILLO Y TENEDOR" },
  { label: "Carne Fibrosa", value: "TENEDOR DE CARNE ESPECÍFICO" },
  { label: "Postre Gral", value: "CUCHARA Y TENEDOR DE POSTRE" },
  { label: "Bizcochos", value: "CUCHILLO DE POSTRE" },
  { label: "Fruta/Macedonia", value: "CUCHARAS DE POSTRE" },
  { label: "Sin Cubiertos", value: "SIN CUBIERTOS" },
  { label: "Por Determinar", value: "POR DETERMINAR" },
];

const TEMP_QUICK_OPTIONS = [
  { label: "Carnes/Pescados", value: "60 °C - 70 °C" },
  { label: "Sopas/Cremas", value: "70 °C (sin hervir)" },
  { label: "Guisos/Arroces", value: "60 °C - 70 °C" },
  { label: "Entremeses/Quesos", value: "18 °C - 22 °C (Ambiente)" },
  { label: "Ensaladas/Fríos", value: "4 °C - 10 °C" },
  { label: "Helados/Sorbetes", value: "-1 °C a 2 °C" },
];

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ 
  initialRecipe, productDatabase, settings, appUser, onSave, onCancel, onAddProduct, allRecipes 
}) => {
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [yieldQuantity, setYieldQuantity] = useState<number>(1);
  const [yieldUnit, setYieldUnit] = useState('Raciones');
  const [photo, setPhoto] = useState('');
  const [photoLayout, setPhotoLayout] = useState<'classic' | 'banner' | 'auto'>('classic');
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [creator, setCreator] = useState(appUser?.teacherName || appUser?.displayName || '');
  const [sourceUrl, setSourceUrl] = useState('');
  const [recipeVideos, setRecipeVideos] = useState<VideoLink[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [platingInstructions, setPlatingInstructions] = useState('');
  const [extraAllergens, setExtraAllergens] = useState<Allergen[]>([]);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>(emptyServiceDetails);
  const [recipeType, setRecipeType] = useState<'normal' | 'takeaway' | 'eventos' | 'pastry'>('normal');
  const [pastryInfographic, setPastryInfographic] = useState('');
  const [takeAwayDetails, setTakeAwayDetails] = useState<TakeAwayDetails>({
    isTakeAway: false,
    targetServiceMode: 'cook_and_chill',
    packagingType: '',
    packagingNotes: '',
    shelfLife: '48 horas',
    conservationTemp: '2°C - 4°C',
    transportTips: '',
    homeFinishing: {
      summaryText: '',
      heatingMethod: 'microwave',
      heatingInstructions: '',
      platingSteps: '',
      storageCustomerNotes: ''
    }
  });
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [linkedRecipeIds, setLinkedRecipeIds] = useState<string[]>(initialRecipe?.linkedRecipeIds || []);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<{idx: number, list: Product[]} | null>(null);
  const [editingAllergenTarget, setEditingAllergenTarget] = useState<{subIdx: number, ingIdx: number} | 'global' | null>(null);
  
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<{ subIdx: number; ingIdx: number } | null>(null);
  const [ingredientActionTarget, setIngredientActionTarget] = useState<{ subIdx: number; ingIdx: number } | null>(null);
  const [familySearch, setFamilySearch] = useState('');
  const [showFamilyList, setShowFamilyList] = useState(false);

  const existingFamilies = useMemo(() => {
    const families = Array.from(new Set(
      productDatabase.map(p => p.category?.toUpperCase() || 'VARIOS')
    )).sort();
    return families;
  }, [productDatabase]);

  const filteredFamilies = useMemo(() => {
    const search = familySearch.toUpperCase();
    return existingFamilies.filter(f => f.includes(search));
  }, [existingFamilies, familySearch]);

  useEffect(() => {
    if (initialRecipe) {
      setName(initialRecipe.name);
      setCategories(initialRecipe.categories || (initialRecipe.category ? [initialRecipe.category] : []));
      setYieldQuantity(initialRecipe.yieldQuantity);
      setYieldUnit(initialRecipe.yieldUnit);
      setPhoto(initialRecipe.photo);
      // Para las más de 150 recetas existentes anteriores a esta actualización:
      // Si la receta ya tiene una disposición ('banner' o 'classic'), la respetamos.
      // Si no tiene photoLayout definido (recetas históricas), se mantiene 'classic' por defecto
      // para que sus fotos no cambien solas de ubicación.
      setPhotoLayout(initialRecipe.photoLayout || 'classic');
      setCreator(initialRecipe.creator || appUser?.teacherName || appUser?.displayName || '');
      setSourceUrl(initialRecipe.sourceUrl || '');
      setRecipeVideos(normalizeVideos(initialRecipe.videos, initialRecipe.sourceUrl || initialRecipe.videoUrl));
      setIsPublic(initialRecipe.isPublic || false);
      setServiceDetails(initialRecipe.serviceDetails || emptyServiceDetails);
      setRecipeType(initialRecipe.recipeType || initialRecipe.takeAwayDetails?.recipeType || (initialRecipe.takeAwayDetails?.isTakeAway ? 'takeaway' : 'normal'));
      setPastryInfographic(initialRecipe.pastryInfographic || initialRecipe.takeAwayDetails?.pastryInfographic || '');
      if (initialRecipe.takeAwayDetails) {
        setTakeAwayDetails(initialRecipe.takeAwayDetails);
      } else {
        setTakeAwayDetails({
          isTakeAway: false,
          targetServiceMode: 'cook_and_chill',
          packagingType: '',
          packagingNotes: '',
          shelfLife: '48 horas',
          conservationTemp: '2°C - 4°C',
          transportTips: '',
          homeFinishing: {
            summaryText: '',
            heatingMethod: 'microwave',
            heatingInstructions: '',
            platingSteps: '',
            storageCustomerNotes: ''
          }
        });
      }
      setPlatingInstructions(initialRecipe.platingInstructions || '');
      setExtraAllergens(initialRecipe.extraAllergens || []);
      setLinkedRecipeIds(initialRecipe?.linkedRecipeIds || []);
      setSubRecipes((initialRecipe.subRecipes || []).map(sr => ({
        ...sr,
        videos: normalizeVideos(sr.videos, sr.videoUrl),
        ingredients: (sr.ingredients || []).map(ing => {
          const product = productDatabase.find(p => p.name.toUpperCase() === ing.name.toUpperCase());
          const baseUnit = ing.baseUnit || (product ? product.unit : undefined);
          const weightPerUnit = ing.weightPerUnit || (product ? product.weightPerUnit : undefined);
          
          return {
            ...ing,
            baseUnit,
            weightPerUnit,
            cost: calculateIngredientCost(ing.quantity, ing.unit, ing.pricePerUnit, baseUnit, weightPerUnit)
          };
        }),
        photos: sr.photos || ((sr as any).photo ? [(sr as any).photo] : [])
      })));
    } else {
      setRecipeVideos([]);
      setSubRecipes([{ id: Date.now().toString(), name: 'Elaboración Principal', ingredients: [], instructions: '', photos: [], videos: [] }]);
      setCreator(appUser?.teacherName || appUser?.displayName || '');
    }
  }, [initialRecipe, appUser]);

  const updateIngredient = (subIdx: number, ingIdx: number, field: keyof Ingredient, value: any) => {
    const newSubs = [...subRecipes];
    const ing = newSubs[subIdx].ingredients[ingIdx];
    
    if (field === 'quantity') {
      ing.quantity = value;
    } else {
      (ing as any)[field] = value;
    }

    // Recalcular coste si cambia cantidad o unidad
    if (field === 'quantity' || field === 'unit') {
      ing.cost = calculateIngredientCost(ing.quantity, ing.unit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);
    }

    if (field === 'name') {
      const lowerVal = (value as string).toLowerCase();
      if (lowerVal.length > 1) {
        const matches = productDatabase.filter(p => p.name.toLowerCase().includes(lowerVal)).slice(0, 50);
        setSuggestions({ idx: ingIdx, list: matches });
      } else setSuggestions(null);
    }
    setSubRecipes(newSubs);
  };

  const handleOpenQuickAdd = (ingName: string, subIdx?: number, ingIdx?: number) => {
    if (!ingName.trim()) return;
    setQuickAddProduct({
      id: `p_quick_${Date.now()}`,
      name: ingName.toUpperCase(),
      unit: 'kg',
      pricePerUnit: 0,
      allergens: [],
      category: 'ALMACÉN'
    });
    if (subIdx !== undefined && ingIdx !== undefined) {
      setQuickAddTarget({ subIdx, ingIdx });
    } else {
      setQuickAddTarget(null);
    }
    setFamilySearch('ALMACÉN');
    setSuggestions(null);
  };

  const markIngredientInternal = (subIdx: number, ingIdx: number) => {
    const newSubs = [...subRecipes];
    newSubs[subIdx].ingredients[ingIdx] = {
      ...newSubs[subIdx].ingredients[ingIdx],
      isInternalPrep: true,
      isNonProduct: false
    };
    setSubRecipes(newSubs);
    setIngredientActionTarget(null);
    setQuickAddProduct(null);
    setQuickAddTarget(null);
  };

  const markIngredientNonProduct = (subIdx: number, ingIdx: number) => {
    const newSubs = [...subRecipes];
    newSubs[subIdx].ingredients[ingIdx] = {
      ...newSubs[subIdx].ingredients[ingIdx],
      isNonProduct: true,
      isInternalPrep: false
    };
    setSubRecipes(newSubs);
    setIngredientActionTarget(null);
    setQuickAddProduct(null);
    setQuickAddTarget(null);
  };

  const resetIngredientStatus = (subIdx: number, ingIdx: number) => {
    const newSubs = [...subRecipes];
    newSubs[subIdx].ingredients[ingIdx] = {
      ...newSubs[subIdx].ingredients[ingIdx],
      isInternalPrep: false,
      isNonProduct: false
    };
    setSubRecipes(newSubs);
    setIngredientActionTarget(null);
  };

  const handleSelectSimilarInEditor = (similarProduct: Product) => {
    if (!quickAddProduct) return;
    const newSubs = [...subRecipes];
    
    newSubs.forEach((sub, sIdx) => {
      sub.ingredients.forEach((ing, iIdx) => {
        const isTarget = quickAddTarget 
          ? (sIdx === quickAddTarget.subIdx && iIdx === quickAddTarget.ingIdx)
          : (ing.name.toUpperCase() === quickAddProduct.name.toUpperCase());
          
        if (isTarget) {
          ing.name = similarProduct.name;
          ing.pricePerUnit = similarProduct.pricePerUnit;
          ing.baseUnit = similarProduct.unit;
          ing.unit = ing.unit || similarProduct.unit;
          ing.weightPerUnit = similarProduct.weightPerUnit;
          ing.allergens = similarProduct.allergens || [];
          ing.cost = calculateIngredientCost(ing.quantity, ing.unit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);
        }
      });
    });

    setSubRecipes(newSubs);
    setQuickAddProduct(null);
    setQuickAddTarget(null);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddProduct) return;
    
    onAddProduct({
      ...quickAddProduct,
      category: familySearch.toUpperCase() || 'VARIOS'
    });
    
    const newSubs = [...subRecipes];
    newSubs.forEach(sub => {
      sub.ingredients.forEach(ing => {
        if (ing.name.toUpperCase() === quickAddProduct.name.toUpperCase()) {
          ing.pricePerUnit = quickAddProduct.pricePerUnit;
          ing.baseUnit = quickAddProduct.unit;
          ing.unit = quickAddProduct.unit;
          ing.weightPerUnit = quickAddProduct.weightPerUnit;
          ing.allergens = quickAddProduct.allergens;
          ing.cost = calculateIngredientCost(ing.quantity, ing.unit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);
        }
      });
    });
    
    setSubRecipes(newSubs);
    setQuickAddProduct(null);
  };

  const selectProduct = (subIdx: number, ingIdx: number, product: Product) => {
    const newSubs = [...subRecipes];
    const currentIng = newSubs[subIdx].ingredients[ingIdx];
    const qtyNum = parseFloat(currentIng.quantity.replace(',', '.'));
    
    // Si el ingrediente ya tiene una unidad definida por el usuario (distinta a la inicial vacía o estándar)
    // o si simplemente queremos priorizar la unidad que ya está escrita en el campo.
    // Solo sobreescribimos si la unidad actual es la por defecto (kg) y el producto trae otra.
    const isDefaultUnit = currentIng.unit === 'kg' || currentIng.unit === '';
    const finalUnit = !isDefaultUnit ? currentIng.unit : product.unit;

    newSubs[subIdx].ingredients[ingIdx] = {
      ...currentIng,
      name: product.name,
      category: product.category,
      allergens: product.allergens || [],
      unit: finalUnit,
      pricePerUnit: product.pricePerUnit,
      weightPerUnit: product.weightPerUnit,
      baseUnit: product.unit,
      cost: calculateIngredientCost(currentIng.quantity, finalUnit, product.pricePerUnit, product.unit, product.weightPerUnit)
    };
    setSubRecipes(newSubs);
    setSuggestions(null);
  };

  const toggleTargetAllergen = (allergen: Allergen) => {
    if (!editingAllergenTarget) return;

    if (editingAllergenTarget === 'global') {
      const current = [...extraAllergens];
      const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
      setExtraAllergens(updated);
    } else {
      const { subIdx, ingIdx } = editingAllergenTarget;
      const newSubs = [...subRecipes];
      const current = [...newSubs[subIdx].ingredients[ingIdx].allergens];
      const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
      newSubs[subIdx].ingredients[ingIdx].allergens = updated;
      setSubRecipes(newSubs);
    }
  };

  const removeSubRecipePhoto = (subIdx: number, photoIdx: number) => {
    const newSubs = [...subRecipes];
    newSubs[subIdx].photos = newSubs[subIdx].photos.filter((_, i) => i !== photoIdx);
    setSubRecipes(newSubs);
  };

  const handleAddSubRecipePhotos = (e: React.ChangeEvent<HTMLInputElement>, subIdx: number) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files), subIdx);
  };

  const processFiles = async (files: File[], subIdx: number, uploadToDrive: boolean = false) => {
    const newSubs = [...subRecipes];
    try {
      if (uploadToDrive) {
        const urls = await Promise.all(files.map(async (f, fIdx) => {
          const cleanRecipe = name ? sanitizeFileName(name) : 'receta';
          const cleanSub = subRecipes[subIdx]?.name ? sanitizeFileName(subRecipes[subIdx].name) : `paso_${subIdx + 1}`;
          const res = await uploadFileToDrive(f, GOOGLE_DRIVE_FOLDER_ID, `RECETA_${cleanRecipe}_${cleanSub}_foto${fIdx + 1}`);
          return res.directUrl;
        }));
        newSubs[subIdx].photos = [...(newSubs[subIdx].photos || []), ...urls];
      } else {
        const results = await Promise.all(files.map(file => compressImage(file)));
        newSubs[subIdx].photos = [...(newSubs[subIdx].photos || []), ...results];
      }
      setSubRecipes(newSubs);
    } catch (error) {
      console.error("Error processing sub-recipe images:", error);
      alert("Hubo un error al procesar las imágenes.");
    }
  };

  const handlePasteSubRecipePhotos = (e: React.ClipboardEvent, subIdx: number) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      processFiles(files, subIdx);
    }
  };

  const processMainPhoto = async (file: File) => {
    try {
      if (confirm("¿Subir portada directamente a tu carpeta de Google Drive en ALTA RESOLUCIÓN (ahorra espacio en BD)?")) {
        setPhotoFeedback("☁️ Subiendo portada a Google Drive...");
        const cleanRecipe = name ? sanitizeFileName(name) : 'receta';
        try {
          const driveRes = await uploadFileToDrive(file, GOOGLE_DRIVE_FOLDER_ID, `RECETA_${cleanRecipe}_PORTADA`);
          setPhoto(driveRes.directUrl);
          const { isBanner } = await getImageAspect(driveRes.directUrl);
          setPhotoLayout(isBanner ? 'banner' : 'classic');
          setPhotoFeedback("✅ Imagen guardada en tu Google Drive en alta resolución.");
          setTimeout(() => setPhotoFeedback(null), 7000);
          return;
        } catch (driveErr) {
          console.warn("Drive upload encountered an issue, falling back to local compression:", driveErr);
          setPhotoFeedback("ℹ️ Ajustando imagen en alta resolución local...");
        }
      }

      // Usar compresión optimizada en alta resolución (2048px/90% calidad) para mantener los textos e infografías 100% legibles
      const compressed = await compressHeroBannerImage(file);
      setPhoto(compressed);
      const { isBanner, ratio } = await getImageAspect(compressed);
      const layout = isBanner ? 'banner' : 'classic';
      setPhotoLayout(layout);
      const ratioStr = ratio ? ratio.toFixed(2) : '1.00';
      if (isBanner) {
        setPhotoFeedback(`✨ Imagen panorámica / infografía de alta nitidez detectada (${ratioStr}:1). Configurada en Cabecera Superior.`);
      } else {
        setPhotoFeedback(`📄 Formato estándar detectado (${ratioStr}:1). Configurada en formato Clásico Lateral.`);
      }
      setTimeout(() => setPhotoFeedback(null), 7000);
    } catch (error) {
      console.error("Error al procesar la imagen de portada:", error);
      alert("Hubo un error al procesar la imagen.");
    }
  };

  const handlePasteMainPhoto = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processMainPhoto(file);
          break;
        }
      }
    }
  };

  const handleDropMainPhoto = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await processMainPhoto(file);
      }
    }
  };

  const handleSave = async () => {
    const totalCost = subRecipes.reduce((acc, sub) => acc + sub.ingredients.reduce((sAcc, ing) => sAcc + (ing.cost || 0), 0), 0);
    const mainVideoUrl = recipeVideos.length > 0 ? recipeVideos[0].url : sourceUrl;
    try {
      await onSave({
        id: initialRecipe?.id || Date.now().toString(),
        name, 
        categories: categories.length > 0 ? categories : (settings.categories?.[0] ? [settings.categories[0]] : ['Otros']),
        category: categories[0] || settings.categories?.[0] || 'Otros',
        photo, 
        photoLayout,
        creator, 
        sourceUrl: mainVideoUrl,
        videos: recipeVideos,
        videoUrl: mainVideoUrl || undefined,
        isPublic,
        yieldQuantity: yieldQuantity || 1,
        yieldUnit, totalCost: totalCost || 0,
        subRecipes: JSON.parse(JSON.stringify(subRecipes.map(sr => ({
          ...sr,
          videos: sr.videos || [],
          videoUrl: sr.videos && sr.videos.length > 0 ? sr.videos[0].url : (sr.videoUrl || undefined)
        })))), // Deep copy to ensure state is captured
        platingInstructions, serviceDetails,
        recipeType,
        pastryInfographic,
        takeAwayDetails: {
          ...(takeAwayDetails || {}),
          isTakeAway: recipeType === 'takeaway',
          recipeType: recipeType,
          pastryInfographic: pastryInfographic
        },
        extraAllergens,
        linkedRecipeIds,
        lastModified: Date.now()
      } as any); // Type assertion to bypass workspaceId which is added in App.tsx
      alert(`Ficha técnica "${name}" guardada correctamente.`);
    } catch (error: any) {
      console.error("Error saving recipe:", error);
      let errorMsg = "Es posible que el tamaño de las imágenes sea demasiado grande o haya un problema de conexión.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) errorMsg = parsed.error;
      } catch (e) {
        if (error.message) errorMsg = error.message;
      }
      
      // Check approximate payload size
      const payloadSize = JSON.stringify(subRecipes).length;
      if (payloadSize > 800000) {
        errorMsg = "El tamaño de las imágenes es demasiado grande para la base de datos. Por favor, elimina algunas fotos o usa imágenes más pequeñas.";
      }

      alert(`Hubo un error al guardar la ficha técnica.\n\nDetalle: ${errorMsg}`);
    }
  };

  const selectedServiceType = SERVICE_TYPES.find(s => s.name === serviceDetails.serviceType);

  return (
    <div className="bg-slate-100 min-h-screen pb-20 font-sans relative">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            <Book className="text-amber-500" /> {initialRecipe ? 'Editar Ficha' : 'Nueva Ficha Técnica'}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 flex items-center gap-2 shadow-xl font-black uppercase text-xs tracking-widest transition-all">
            <Save size={18} /> Guardar Ficha
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className={photoLayout === 'banner' ? 'md:col-span-5' : 'md:col-span-3'}>
             <div 
               className={`relative ${photoLayout === 'banner' ? 'aspect-[16/9]' : 'aspect-square'} bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner group transition-all focus:ring-2 focus:ring-amber-500 outline-none`}
               onPaste={handlePasteMainPhoto}
               onDragOver={(e) => e.preventDefault()}
               onDrop={handleDropMainPhoto}
               tabIndex={0}
             >
                {photo ? (
                  <img 
                    src={photo} 
                    className={`w-full h-full ${photoLayout === 'banner' ? 'object-contain bg-slate-900/5' : 'object-cover'}`} 
                    alt="" 
                  />
                ) : (
                  <div className="text-center p-3">
                    <ImageIcon size={36} className="text-slate-300 mx-auto" />
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Portada / Diagrama</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 font-bold">(Clic, Pegar o Arrastrar)</p>
                    <span className="inline-block mt-1.5 text-[7px] font-black uppercase bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full">
                      Detección automática
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="text-white" size={32} />
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await processMainPhoto(file);
                  }
                }} />
             </div>

             {/* Entrada para pegar enlace de Google Drive directamente */}
             <div className="mt-2">
               <input
                 type="text"
                 placeholder="O pega enlace de Google Drive..."
                 value={photo?.includes('googleusercontent.com') || photo?.includes('drive.google.com') ? photo : ''}
                 onChange={async (e) => {
                   const raw = e.target.value;
                   if (raw) {
                     const transformed = transformDriveUrl(raw);
                     setPhoto(transformed);
                     const { isBanner } = await getImageAspect(transformed);
                     setPhotoLayout(isBanner ? 'banner' : 'classic');
                   }
                 }}
                 className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-amber-500"
               />
               {photo?.includes('googleusercontent.com') && (
                 <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                   ☁️ Enlazado desde Google Drive (0 bytes en BD)
                 </span>
               )}
             </div>

             {/* Notificación de detección automática de formato */}
             {photoFeedback && (
               <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-[8px] font-bold text-indigo-900 flex items-center gap-1.5">
                 <span>💡</span>
                 <span>{photoFeedback}</span>
               </div>
             )}

             {photo && (
               <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                 <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black uppercase text-slate-500">Disposición:</span>
                   <div className="flex gap-1">
                     <button
                       type="button"
                       onClick={() => setPhotoLayout('banner')}
                       className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                         photoLayout === 'banner' 
                           ? 'bg-indigo-600 text-white shadow-xs' 
                           : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
                       }`}
                       title="Formato panorámico para infografías y diagramas de emplatado"
                     >
                       🌟 Panorámica
                     </button>
                     <button
                       type="button"
                       onClick={() => setPhotoLayout('classic')}
                       className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                         photoLayout === 'classic' 
                           ? 'bg-slate-900 text-white shadow-xs' 
                           : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
                       }`}
                       title="Formato clásico compacto lateral"
                     >
                       📄 Clásica
                     </button>
                   </div>
                 </div>

                 {photoLayout === 'banner' ? (
                   <div className="text-[8px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg text-center leading-tight">
                     🌟 Cabecera Superior: Ocupará todo el ancho en la parte superior de la ficha y de impresión
                   </div>
                 ) : (
                   <div className="text-[8px] font-bold text-slate-600 bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-center leading-tight">
                     📄 Formato Clásico: Ocupará el lateral izquierdo junto al cuadro de alérgenos
                   </div>
                 )}

                 <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                   <span className="text-[8px] text-slate-400 font-bold">Clic para cambiar imagen</span>
                   <button
                     type="button"
                     onClick={() => {
                       setPhoto('');
                       setPhotoLayout('classic');
                       setPhotoFeedback(null);
                     }}
                     className="text-[8px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                   >
                     <Trash2 size={10} /> Quitar foto
                   </button>
                 </div>
               </div>
             )}

             {/* Botón para generar y copiar el prompt de diseño de imagen para la IA */}
             <button
               type="button"
               onClick={() => setShowPromptModal(true)}
               className={`w-full mt-2.5 py-2.5 px-3 border rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs group cursor-pointer ${
                 takeAwayDetails.isTakeAway
                   ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 hover:from-amber-100 hover:to-orange-100 border-amber-300 hover:border-amber-400 text-amber-950'
                   : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 hover:border-indigo-300 text-indigo-950'
               }`}
               title={takeAwayDetails.isTakeAway 
                 ? "Copiar prompt especializado para generar la lámina con el plato dentro de recipientes y packaging de Take Away"
                 : "Copiar prompt profesional adaptado a esta receta para generar la lámina doble 16:9 con IA"
               }
             >
               {takeAwayDetails.isTakeAway ? (
                 <Box size={14} className="text-amber-600 group-hover:scale-125 transition-transform" />
               ) : (
                 <Sparkles size={14} className="text-indigo-600 group-hover:scale-125 transition-transform" />
               )}
               <span>
                 {takeAwayDetails.isTakeAway ? 'Prompt IA (Recipientes Take Away)' : 'Prompt para Lámina Doble (IA)'}
               </span>
             </button>
          </div>
          <div className={photoLayout === 'banner' ? 'md:col-span-7 space-y-6' : 'md:col-span-9 space-y-6'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nombre del Plato</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xl font-serif font-black uppercase focus:ring-2 focus:ring-slate-200 transition-all" placeholder="Nombre de la receta" />
              </div>
              <div className="md:col-span-12">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Categorías (Puedes seleccionar varias)</label>
                  <div className="flex gap-1">
                    {categories.map(cat => (
                      <CategoryStripe key={cat} category={cat} settings={settings} className="h-2 w-8 rounded-full border border-white shadow-sm" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                  {settings.categories?.map(c => {
                    const isSelected = categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCategories(categories.filter(x => x !== c));
                          } else {
                            setCategories([...categories, c]);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                  {(!settings.categories || settings.categories.length === 0) && (
                    <p className="text-[10px] text-slate-400">No hay categorías configuradas</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                   <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest">
                     Tipo de Ficha Culinaria (Normal, Take Away, Eventos o Pastelería)
                   </label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                     {/* 1. Normal */}
                     <button
                       type="button"
                       onClick={() => setRecipeType('normal')}
                       className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                         recipeType === 'normal'
                           ? 'bg-blue-50 border-blue-500 text-blue-950 font-black shadow-xs'
                           : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-bold'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <span className="text-base">🍽️</span>
                         <div>
                           <div className="text-xs uppercase">Normal</div>
                           <div className="text-[9px] font-normal text-slate-500">Ficha estándar de pase</div>
                         </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black ${recipeType === 'normal' ? 'bg-blue-600' : 'bg-rose-500'}`}>
                         {recipeType === 'normal' ? '✓' : '✕'}
                       </div>
                     </button>

                     {/* 2. Take Away */}
                     <button
                       type="button"
                       onClick={() => setRecipeType('takeaway')}
                       className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                         recipeType === 'takeaway'
                           ? 'bg-amber-50 border-amber-500 text-amber-950 font-black shadow-xs'
                           : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-bold'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <span className="text-base">🥡</span>
                         <div>
                           <div className="text-xs uppercase">Take Away</div>
                           <div className="text-[9px] font-normal text-slate-500">Para llevar / Delivery</div>
                         </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black ${recipeType === 'takeaway' ? 'bg-amber-600' : 'bg-rose-500'}`}>
                         {recipeType === 'takeaway' ? '✓' : '✕'}
                       </div>
                     </button>

                     {/* 3. Eventos */}
                     <button
                       type="button"
                       onClick={() => setRecipeType('eventos')}
                       className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                         recipeType === 'eventos'
                           ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                           : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-bold'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <span className="text-base">🔹</span>
                         <div>
                           <div className="text-xs uppercase">Eventos</div>
                           <div className="text-[9px] font-normal text-slate-500">Banquetes / Catering</div>
                         </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black ${recipeType === 'eventos' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                         {recipeType === 'eventos' ? '✓' : '✕'}
                       </div>
                     </button>

                     {/* 4. Pastelería */}
                     <button
                       type="button"
                       onClick={() => setRecipeType('pastry')}
                       className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                         recipeType === 'pastry'
                           ? 'bg-rose-50 border-rose-500 text-rose-950 font-black shadow-xs'
                           : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-bold'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <span className="text-base">🧁</span>
                         <div>
                           <div className="text-xs uppercase">Pastelería</div>
                           <div className="text-[9px] font-normal text-slate-500">Lámina técnica obrador</div>
                         </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black ${recipeType === 'pastry' ? 'bg-rose-600' : 'bg-rose-500'}`}>
                         {recipeType === 'pastry' ? '✓' : '✕'}
                       </div>
                     </button>
                   </div>
                </div>

                {/* Sección de Infografía de Pastelería si el tipo es pastry */}
                {recipeType === 'pastry' && (
                  <div className="md:col-span-3 bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-rose-950 tracking-wide">
                            Infografía Didáctica de Pastelería (Lámina Técnica de Obrador)
                          </h4>
                          <p className="text-[10px] text-rose-800">
                            Sube o vincula la infografía técnica (imagen o PDF). Se almacenará en la base de datos y se adjuntará automáticamente al imprimir la ficha técnica.
                          </p>
                        </div>
                      </div>
                      {pastryInfographic && (
                        <button
                          type="button"
                          onClick={() => setPastryInfographic('')}
                          className="px-2.5 py-1 bg-rose-200 hover:bg-rose-300 text-rose-950 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Eliminar Infografía
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              if (confirm("¿Subir directamente a tu carpeta de Google Drive en ALTA RESOLUCIÓN (sin comprimir)?")) {
                                alert("Iniciando subida a tu carpeta de Google Drive...");
                                const cleanRecipe = name ? sanitizeFileName(name) : 'receta';
                                const driveRes = await uploadFileToDrive(file, GOOGLE_DRIVE_FOLDER_ID, `RECETA_${cleanRecipe}_INFOGRAFIA`);
                                setPastryInfographic(driveRes.directUrl);
                                alert("✅ Infografía subida correctamente a tu Google Drive.");
                              } else {
                                if (file.type.startsWith('image/')) {
                                  const compressed = await compressHeroBannerImage(file);
                                  setPastryInfographic(compressed);
                                } else {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    const res = uploadEvent.target?.result as string;
                                    if (res) setPastryInfographic(res);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            } catch (err: any) {
                              console.error("Error reading/uploading infographic file:", err);
                              alert(`Error al procesar la infografía: ${err?.message || err}`);
                            }
                          }}
                          className="w-full text-xs text-rose-900 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-rose-600 file:text-white hover:file:bg-rose-700 transition-all cursor-pointer bg-white border border-rose-300 rounded-xl p-1.5"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="O pega aquí el enlace de Google Drive o URL externa de la infografía..."
                          value={pastryInfographic || ''}
                          onChange={e => {
                            const raw = e.target.value;
                            const transformed = transformDriveUrl(raw);
                            setPastryInfographic(transformed);
                          }}
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-950 placeholder:text-rose-300 outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        {pastryInfographic?.includes('googleusercontent.com') && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ☁️ Enlazado desde Google Drive (0 bytes en BD)
                          </span>
                        )}
                      </div>
                    </div>

                    {pastryInfographic && (
                      <div className="mt-3 p-2 bg-white rounded-xl border border-rose-200 flex items-center gap-4">
                        {pastryInfographic.startsWith('data:image') || pastryInfographic.startsWith('http') ? (
                          <img src={pastryInfographic} alt="Infografía Pastelería" className="h-20 w-32 object-cover rounded-lg border border-rose-200 shadow-xs" />
                        ) : (
                          <div className="h-20 w-32 bg-rose-100 rounded-lg flex items-center justify-center text-rose-800 font-bold text-xs">
                            PDF / Archivo Adjunto
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 block">Infografía Cargada Correctamente</span>
                          <span className="text-[9px] text-rose-700">Lista para integrarse en la impresión de la ficha técnica de pastelería.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-inner">
                  <label className="block text-[10px] font-black text-amber-700 uppercase mb-2 flex items-center gap-2">
                    <Users size={12}/> Rendimiento (PAX)
                  </label>
                  <input type="number" value={yieldQuantity} onChange={e => setYieldQuantity(Number(e.target.value) || 0)} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Unidad de Medida</label>
                  <input type="text" value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="Ej: raciones, pax, ud..." />
               </div>
               <div className="p-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Responsable / Creador</label>
                  <input type="text" value={creator} onChange={e => setCreator(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black" />
               </div>
               <div className="p-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Comunidad</label>
                  <button 
                    type="button" 
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-full px-4 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${isPublic ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' : 'bg-slate-50 text-slate-400 border-2 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {isPublic ? 'Pública (Visible para todos)' : 'Privada (Solo mi equipo)'}
                  </button>
               </div>
               <div className="md:col-span-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <VideoManagerInput
                     videos={recipeVideos}
                     onChange={(vids) => {
                       setRecipeVideos(vids);
                       if (vids.length > 0) {
                         setSourceUrl(vids[0].url);
                       }
                     }}
                     label="Vídeos y Enlaces Generales del Plato"
                     helperText="Añade uno o varios vídeos globales de la receta (YouTube, Vimeo, Drive, enlaces directos)."
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Sección de Fichas Componentes y Enlaces Inteligentes */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Fichas Componentes y Enlaces Inteligentes
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Enlaza salsas, guarniciones, cremas o bizcochos asociados a esta preparación para unificar costos, alérgenos y trazabilidad.
              </p>
            </div>
          </div>

          {/* Sugerencias Inteligentes */}
          {allRecipes && allRecipes.length > 0 && (
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">💡 Sugerencias inteligentes para esta receta:</span>
              <div className="flex flex-wrap gap-2">
                {allRecipes
                  .filter(r => r.id !== initialRecipe?.id && !linkedRecipeIds.includes(r.id))
                  .filter(r => {
                    const n = r.name.toLowerCase();
                    const cat = r.category?.toLowerCase() || '';
                    const recType = recipeType;

                    if (recType === 'pastry') {
                      return n.includes('crema') || n.includes('bizcocho') || n.includes('mousse') || n.includes('merengue') || n.includes('jarabe') || n.includes('choux') || cat.includes('pasteleria') || cat.includes('postre');
                    } else {
                      return n.includes('salsa') || n.includes('guarnicion') || n.includes('caldo') || n.includes('fondo') || n.includes('pure') || cat.includes('salsa') || cat.includes('guarnicion');
                    }
                  })
                  .slice(0, 5)
                  .map(suggested => (
                    <button
                      key={suggested.id}
                      type="button"
                      onClick={() => setLinkedRecipeIds([...linkedRecipeIds, suggested.id])}
                      className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <span>+ Enlazar "{suggested.name}"</span>
                      <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">{suggested.category || 'General'}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de Fichas Ya Enlazadas */}
          <div className="space-y-2 pt-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Fichas Componentes Enlazadas ({linkedRecipeIds.length}):</span>
            {linkedRecipeIds.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center text-slate-400 text-xs italic">
                Ninguna ficha enlazada todavía. Usa las sugerencias arriba o selecciona abajo del catálogo completo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedRecipeIds.map(id => {
                  const linkedRecipe = allRecipes?.find(r => r.id === id);
                  if (!linkedRecipe) return null;
                  return (
                    <div key={id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        {linkedRecipe.photo ? (
                          <img src={linkedRecipe.photo} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-black text-xs">
                            FT
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{linkedRecipe.name}</h4>
                          <span className="text-[9px] font-black uppercase text-slate-500">{linkedRecipe.category || 'General'} · {linkedRecipe.yieldQuantity} {linkedRecipe.yieldUnit}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLinkedRecipeIds(linkedRecipeIds.filter(x => x !== id))}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Quitar enlace"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selector manual para añadir cualquier otra receta */}
            {allRecipes && allRecipes.length > 0 && (
              <div className="pt-2">
                <select
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !linkedRecipeIds.includes(val)) {
                      setLinkedRecipeIds([...linkedRecipeIds, val]);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="" disabled>+ Añadir otra ficha del recetario manualmente...</option>
                  {allRecipes
                    .filter(r => r.id !== initialRecipe?.id && !linkedRecipeIds.includes(r.id))
                    .map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.category || 'General'})</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {subRecipes.map((sub, idx) => (
                <button key={idx} type="button" onClick={() => setActiveTab(idx)} className={`px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${activeTab === idx ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-white hover:border-slate-100'}`}>
                  {idx + 1}. {sub.name}
                </button>
              ))}
              <button onClick={() => setSubRecipes([...subRecipes, { id: Date.now().toString(), name: 'Nueva Elaboración', ingredients: [], instructions: '', photos: [] }])} className="p-3 bg-white text-slate-400 rounded-2xl border border-dashed border-slate-200 hover:text-slate-900 hover:border-slate-400 transition-all"><Plus size={18}/></button>
           </div>

           {subRecipes[activeTab] && (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm space-y-6 overflow-visible">
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <Database className="text-slate-300" size={20} />
                    <input type="text" value={subRecipes[activeTab].name} onChange={e => {
                      const n = [...subRecipes]; n[activeTab].name = e.target.value; setSubRecipes(n);
                    }} className="text-xl font-black uppercase tracking-tight outline-none w-full focus:ring-b-2 focus:ring-slate-900" placeholder="Nombre de la elaboración" />
                  </div>
                  <button onClick={() => { if(confirm('¿Eliminar esta elaboración?')){ const n = subRecipes.filter((_,i)=>i!==activeTab); setSubRecipes(n); setActiveTab(0); }}} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-visible">
                   <div className="lg:col-span-12 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span>Escandallo de Ingredientes</span>
                         <button onClick={() => {
                           const n = [...subRecipes]; n[activeTab].ingredients.push({ id: Math.random().toString(), name: '', quantity: '', unit: 'kg', allergens: [] }); setSubRecipes(n);
                         }} className="text-indigo-600 flex items-center gap-1 font-black hover:text-indigo-800 transition-colors"><Plus size={14}/> Añadir Ingrediente</button>
                      </div>
                      <div className="space-y-2">
                        {subRecipes[activeTab].ingredients.map((ing, iIdx) => {
                          const exactMatch = Boolean(ing.name && productDatabase.some(p => p.name.toUpperCase() === ing.name.toUpperCase()));
                          const isInternal = Boolean(ing.isInternalPrep);
                          const isNonProd = Boolean(ing.isNonProduct);
                          const isResolved = exactMatch || isInternal || isNonProd;
                          const showActionMenu = ingredientActionTarget?.subIdx === activeTab && ingredientActionTarget?.ingIdx === iIdx;
                          const similarProducts = (!exactMatch && ing.name) ? findSimilarProducts(ing.name, productDatabase, 3) : [];

                          return (
                            <div key={ing.id} className="grid grid-cols-12 gap-2 relative group items-center">
                               <div className="col-span-5 relative">
                                  <input 
                                    type="text" 
                                    value={ing.name} 
                                    onChange={e => updateIngredient(activeTab, iIdx, 'name', e.target.value)} 
                                    className={`w-full pl-3 pr-24 py-3 text-xs font-black rounded-xl outline-none uppercase placeholder:opacity-30 border transition-all ${
                                      ing.name && !isResolved 
                                        ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' 
                                        : isInternal
                                        ? 'bg-indigo-50/40 border-indigo-200'
                                        : isNonProd
                                        ? 'bg-stone-50 border-stone-200 text-slate-500'
                                        : 'bg-slate-50 border-transparent focus:bg-white focus:border-slate-200'
                                    }`} 
                                    placeholder="Nombre del ingrediente..." 
                                  />

                                  {/* Badges y Botones de Acción Rápida */}
                                  {ing.name && (
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                      {isInternal ? (
                                        <button
                                          type="button"
                                          onClick={() => setIngredientActionTarget(showActionMenu ? null : { subIdx: activeTab, ingIdx: iIdx })}
                                          className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-xs transition-all"
                                          title="Pertenece a la ficha (elaboración propia). Clic para opciones."
                                        >
                                          <Utensils size={10} className="text-indigo-600" />
                                          <span>Ficha</span>
                                        </button>
                                      ) : isNonProd ? (
                                        <button
                                          type="button"
                                          onClick={() => setIngredientActionTarget(showActionMenu ? null : { subIdx: activeTab, ingIdx: iIdx })}
                                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-xs transition-all"
                                          title="No es un producto inventariable (agua, hielo, etc.). Clic para opciones."
                                        >
                                          <Ban size={10} className="text-stone-500" />
                                          <span>No prod</span>
                                        </button>
                                      ) : !exactMatch ? (
                                        <button 
                                          type="button"
                                          onClick={() => setIngredientActionTarget(showActionMenu ? null : { subIdx: activeTab, ingIdx: iIdx })}
                                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-md transition-all animate-pulse"
                                          title="Dar de alta, similar o marcar que pertenece a la ficha"
                                        >
                                          <DatabaseZap size={11} />
                                          <span>Alta / Ficha</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  )}

                                  {/* Menú Flotante de Acciones para el Ingrediente */}
                                  {showActionMenu && (
                                    <div className="absolute z-[110] left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 animate-fadeIn text-left">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                          Opciones para "{ing.name}"
                                        </span>
                                        <button 
                                          type="button" 
                                          onClick={() => setIngredientActionTarget(null)}
                                          className="text-slate-400 hover:text-slate-700 p-0.5"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIngredientActionTarget(null);
                                            handleOpenQuickAdd(ing.name, activeTab, iIdx);
                                          }}
                                          className="flex items-center gap-1.5 p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[9px] font-black uppercase transition-all"
                                        >
                                          <DatabaseZap size={12} className="text-amber-600 shrink-0" />
                                          <span>Dar de alta producto</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => markIngredientInternal(activeTab, iIdx)}
                                          className={`flex items-center gap-1.5 p-2 rounded-xl text-[9px] font-black uppercase transition-all border ${
                                            isInternal 
                                              ? 'bg-indigo-600 text-white border-indigo-600' 
                                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                                          }`}
                                        >
                                          <Utensils size={12} className={isInternal ? 'text-white' : 'text-indigo-600'} />
                                          <span>Pertenece a la ficha</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => markIngredientNonProduct(activeTab, iIdx)}
                                          className={`flex items-center gap-1.5 p-2 rounded-xl text-[9px] font-black uppercase transition-all border ${
                                            isNonProd 
                                              ? 'bg-stone-700 text-white border-stone-700' 
                                              : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                                          }`}
                                        >
                                          <Ban size={12} className={isNonProd ? 'text-white' : 'text-stone-500'} />
                                          <span>No es un producto</span>
                                        </button>

                                        {(isInternal || isNonProd) && (
                                          <button
                                            type="button"
                                            onClick={() => resetIngredientStatus(activeTab, iIdx)}
                                            className="flex items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase transition-all"
                                          >
                                            <RefreshCw size={12} className="text-slate-400" />
                                            <span>Restablecer normal</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* Sugerencias de productos similares */}
                                      {similarProducts.length > 0 && (
                                        <div className="pt-1.5 border-t border-slate-100">
                                          <span className="text-[8px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                                            💡 ¿Cambiar por producto similar existente?:
                                          </span>
                                          <div className="flex flex-col gap-1">
                                            {similarProducts.map(sim => (
                                              <button
                                                key={sim.id}
                                                type="button"
                                                onClick={() => {
                                                  selectProduct(activeTab, iIdx, sim);
                                                  setIngredientActionTarget(null);
                                                }}
                                                className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left text-[9px] transition-all"
                                              >
                                                <span className="font-black uppercase text-slate-800">{sim.name}</span>
                                                <span className="text-emerald-700 font-mono font-bold">{sim.pricePerUnit ? `${sim.pricePerUnit}€` : '0€'}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {suggestions && suggestions.idx === iIdx && (
                                    <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                       {suggestions.list.map(p => (
                                         <div key={p.id} onClick={() => selectProduct(activeTab, iIdx, p)} className="px-5 py-4 hover:bg-indigo-50 cursor-pointer text-[10px] font-black uppercase flex justify-between border-b border-slate-50 last:border-0 transition-colors">
                                            <span>{p.name}</span>
                                            <span className="text-slate-300">{p.category}</span>
                                         </div>
                                       ))}
                                       <div onClick={() => handleOpenQuickAdd(ing.name, activeTab, iIdx)} className="px-5 py-4 bg-amber-50 hover:bg-amber-100 cursor-pointer text-[10px] font-black uppercase flex items-center gap-3 text-amber-700 transition-colors border-t border-amber-100">
                                          <DatabaseZap size={16} />
                                          <span>Añadir o cambiar "{ing.name}" por similar...</span>
                                       </div>
                                    </div>
                                  )}
                               </div>
                               <input type="text" value={ing.quantity} onChange={e => updateIngredient(activeTab, iIdx, 'quantity', e.target.value)} className="col-span-2 text-right px-1.5 py-3 bg-white border border-slate-100 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 transition-all" placeholder="0.00" />
                               <input 
                                 type="text" 
                                 value={ing.unit} 
                                 onChange={e => updateIngredient(activeTab, iIdx, 'unit', e.target.value)} 
                                 className="col-span-1 text-[9px] font-black text-slate-400 uppercase bg-transparent border-b border-transparent focus:border-slate-200 outline-none transition-all" 
                                 placeholder="ud"
                               />
                               <div className="col-span-1 flex justify-center items-center">
                                 <button 
                                   type="button" 
                                   onClick={() => setEditingAllergenTarget({ subIdx: activeTab, ingIdx: iIdx })}
                                   className={`px-2 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${ing.allergens.length > 0 ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-xs font-black' : 'border-slate-100 text-slate-300 hover:border-slate-300'}`}
                                   title={`Editar alérgenos (${ing.allergens.length} declarados)`}
                                 >
                                   <AlertOctagon size={13} />
                                   {ing.allergens.length > 0 && (
                                     <span className="text-[8px] font-mono leading-none">{ing.allergens.length}</span>
                                   )}
                                 </button>
                               </div>
                               <span className="col-span-2 text-right font-mono font-black text-indigo-600 text-xs flex items-center justify-end">{ing.cost?.toFixed(2).replace('.', ',')}€</span>
                               <button onClick={() => { const n = [...subRecipes]; n[activeTab].ingredients.splice(iIdx, 1); setSubRecipes(n); }} className="col-span-1 text-slate-200 hover:text-red-500 flex justify-center items-center transition-colors"><Trash2 size={16}/></button>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-7 pt-6 border-t border-slate-100">
                         <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Utensils size={14}/> Procedimiento de Cocina</label>
                         <textarea value={subRecipes[activeTab].instructions} onChange={e => {
                           const n = [...subRecipes]; n[activeTab].instructions = e.target.value; setSubRecipes(n);
                         }} onBlur={(e) => {
                           const formatted = e.target.value.replace(/(\d+\.\s)/g, '\n$1').trim();
                           const n = [...subRecipes]; n[activeTab].instructions = formatted; setSubRecipes(n);
                         }} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm min-h-[220px] leading-relaxed font-medium outline-none focus:ring-2 focus:ring-slate-900 transition-all font-serif" placeholder="Describe paso a paso los procesos técnicos de esta elaboración... (Ej: 1. Paso uno. 2. Paso dos.)" />
                      </div>
                      <div className="lg:col-span-5 pt-6 border-t border-slate-100 space-y-4">
                         <div className="flex items-center justify-between">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Galería de Imágenes Técnicas</label>
                           <span className="text-[8px] font-bold text-slate-400">Google Drive o Local</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                           {(subRecipes[activeTab].photos || []).map((photoSrc, pIdx) => (
                              <div key={pIdx} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group border border-slate-100">
                                 <img src={photoSrc} className="w-full h-full object-cover" alt="" />
                                 {photoSrc.includes('googleusercontent.com') && (
                                   <span className="absolute bottom-1 left-1 bg-emerald-950/80 text-emerald-300 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-xs">
                                     ☁️ Drive
                                   </span>
                                 )}
                                 <button onClick={() => removeSubRecipePhoto(activeTab, pIdx)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                   <Trash2 size={12} />
                                 </button>
                              </div>
                           ))}
                           <div 
                             className="relative aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors group shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none"
                             onPaste={(e) => handlePasteSubRecipePhotos(e, activeTab)}
                             tabIndex={0}
                           >
                              <div className="text-center p-2">
                                 <Camera className="text-slate-200 mx-auto transition-transform group-hover:scale-110" size={28} />
                                 <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">Añadir Foto</p>
                                 <p className="text-[7px] text-slate-400 font-bold">(Click / Pegar)</p>
                              </div>
                              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleAddSubRecipePhotos(e, activeTab)} />
                           </div>
                         </div>

                         {/* Botón directo de subir fotos de paso a Google Drive */}
                         <div className="pt-2 border-t border-slate-100 space-y-2">
                           <label className="relative flex items-center justify-center gap-2 w-full py-2 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl text-[9px] font-black text-emerald-950 uppercase transition-all cursor-pointer shadow-2xs">
                             <span>☁️ Subir Pasos a Google Drive</span>
                             <input
                               type="file"
                               multiple
                               accept="image/*"
                               className="absolute inset-0 opacity-0 cursor-pointer"
                               onChange={async (e) => {
                                 const files = e.target.files;
                                 if (files && files.length > 0) {
                                   await processFiles(Array.from(files), activeTab, true);
                                 }
                               }}
                             />
                           </label>
                           <input
                             type="text"
                             placeholder="O pega enlace de Google Drive para este paso..."
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 const target = e.target as HTMLInputElement;
                                 if (target.value.trim()) {
                                   const transformed = transformDriveUrl(target.value);
                                   const n = [...subRecipes];
                                   n[activeTab].photos = [...(n[activeTab].photos || []), transformed];
                                   setSubRecipes(n);
                                   target.value = '';
                                 }
                               }
                             }}
                             className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[8.5px] font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-emerald-500"
                           />
                         </div>
                      </div>

                      {/* Vídeos Técnicos de la Elaboración */}
                      <div className="lg:col-span-12 pt-6 border-t border-slate-100">
                         <VideoManagerInput
                            videos={subRecipes[activeTab].videos || []}
                            onChange={(newVids) => {
                               const n = [...subRecipes];
                               n[activeTab].videos = newVids;
                               setSubRecipes(n);
                            }}
                            label={`Vídeos Técnicos de "${subRecipes[activeTab].name || 'esta Elaboración'}"`}
                            helperText="Añade los vídeos de esta elaboración. Se mostrarán en la ficha y con código QR en la receta de impresión."
                         />
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden text-white p-8 space-y-8 relative">
           <div className="absolute top-0 right-0 p-10 opacity-5"><ChefHat size={120}/></div>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <MessageSquare size={32} className="text-amber-500" /> Ficha de Servicio (Sala)
                 </h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Protocolos de pase, servicio y atención al cliente</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="group">
                    <label className="block text-[10px] font-black text-amber-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <Info size={14}/> Explicación Sugerente del Plato
                    </label>
                    <textarea value={serviceDetails.clientDescription} onChange={e => setServiceDetails({...serviceDetails, clientDescription: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-5 text-sm min-h-[120px] outline-none italic placeholder:text-slate-600 focus:border-amber-500 transition-all text-slate-200 font-serif" placeholder="Describe cómo se le debe presentar el plato al cliente..." />
                 </div>
                 <div className="group">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Protocolo de Servicio</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                       {SERVICE_TYPES.map(s => (
                         <button key={s.id} type="button" onClick={() => setServiceDetails({...serviceDetails, serviceType: s.name})} className={`px-3 py-3 text-[9px] font-black rounded-xl border transition-all uppercase flex flex-col items-center gap-1 ${serviceDetails.serviceType === s.name ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                           {s.name.replace('Servicio a la ', '').replace('Servicio de ', '')}
                         </button>
                       ))}
                    </div>
                    {selectedServiceType && (
                       <div className="mb-4 bg-slate-800/50 border border-amber-500/20 p-4 rounded-xl animate-fadeIn">
                          <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2 mb-1">
                             <HelpCircle size={10} /> Definición del Protocolo
                          </p>
                          <p className="text-[11px] text-slate-400 font-serif italic leading-relaxed">
                             {selectedServiceType.desc}
                          </p>
                       </div>
                    )}
                    <input type="text" value={serviceDetails.serviceType} onChange={e => setServiceDetails({...serviceDetails, serviceType: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-black uppercase" />
                 </div>
              </div>

              <div className="space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                       <Thermometer size={14}/> Temperatura de Pase
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {TEMP_QUICK_OPTIONS.map(opt => (
                          <button 
                            key={opt.label} 
                            type="button" 
                            onClick={() => setServiceDetails({...serviceDetails, servingTemp: opt.value})}
                            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${serviceDetails.servingTemp === opt.value ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                     </div>
                     <input type="text" value={serviceDetails.servingTemp} onChange={e => setServiceDetails({...serviceDetails, servingTemp: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-sm font-black text-amber-500 outline-none focus:ring-2 focus:ring-amber-500 uppercase" placeholder="Ej: 60-65 ºC" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                       <Utensils size={14}/> Marcaje y Cubertería
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                       {CUTLERY_QUICK_OPTIONS.map(opt => (
                         <button 
                           key={opt.label} 
                           type="button" 
                           onClick={() => setServiceDetails({...serviceDetails, cutlery: opt.value})}
                           className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${serviceDetails.cutlery === opt.value ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>
                    <textarea value={serviceDetails.cutlery} onChange={e => setServiceDetails({...serviceDetails, cutlery: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-amber-500 font-bold uppercase placeholder:text-slate-600" placeholder="Ej: TENEDOR TRINCHERO + CUCHILLO..." />
                 </div>
              </div>
           </div>
           <div className="pt-10 border-t border-white/5">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Instrucciones de Emplatado y Acabado Final</label>
                <button 
                  type="button" 
                  onClick={() => setEditingAllergenTarget('global')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${extraAllergens.length > 0 ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  <AlertOctagon size={14} />
                  <span>Alérgenos Extra ({extraAllergens.length})</span>
                </button>
              </div>
              <textarea value={platingInstructions} onChange={e => setPlatingInstructions(e.target.value)} className="w-full bg-slate-900 border-2 border-dashed border-slate-700 rounded-[2rem] p-8 text-sm min-h-[150px] outline-none focus:border-amber-500 transition-colors font-serif" placeholder="Describe el paso final antes del pase..." />
           </div>
        </div>

        {/* MÓDULO ESPECIAL: ADAPTACIÓN TAKE AWAY, DELIVERY & 5ª GAMA */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden text-white p-8 space-y-8 relative">
           <div className="absolute top-0 right-0 p-10 opacity-5"><ShoppingBag size={120}/></div>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                       <ShoppingBag size={22} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                          Protocolo Take Away, Delivery & 5ª Gama
                       </h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          Consumo no inmediato · Packaging · Encarte de regeneración para el cliente
                       </p>
                    </div>
                 </div>
              </div>

              {/* Interruptor de activación Take Away */}
              <button
                type="button"
                onClick={() => setTakeAwayDetails(prev => ({ ...prev, isTakeAway: !prev.isTakeAway }))}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-md border ${
                  takeAwayDetails.isTakeAway 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${takeAwayDetails.isTakeAway ? 'bg-slate-950' : 'bg-slate-500'}`} />
                {takeAwayDetails.isTakeAway ? '🥡 Ficha Take Away Activada' : 'Activar como Take Away'}
              </button>
           </div>

           {takeAwayDetails.isTakeAway ? (
             <div className="space-y-8 animate-fadeIn">
               {/* 1. Modalidad y Packaging */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-[10px] font-black text-amber-400 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> Modalidad de Servicio
                    </label>
                    <select
                      value={takeAwayDetails.targetServiceMode || 'cook_and_chill'}
                      onChange={e => setTakeAwayDetails(prev => ({ ...prev, targetServiceMode: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="cook_and_chill">Cook & Chill (Refrigerado para calentar en casa 24-48h)</option>
                      <option value="hot_delivery">Reparto Caliente Inmediato (Consumo &lt; 45 min)</option>
                      <option value="fifth_range">5ª Gama / Envasado al Vacío (Larga caducidad)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                      <Box size={12} /> Envase / Packaging Recomendado
                    </label>
                    <input
                      type="text"
                      value={takeAwayDetails.packagingType || ''}
                      onChange={e => setTakeAwayDetails(prev => ({ ...prev, packagingType: e.target.value }))}
                      placeholder="Ej: Kraft microondable 750ml + tarrina 60ml salsa..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                      <Thermometer size={12} /> Caducidad & Temp. Conservación
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={takeAwayDetails.shelfLife || ''}
                        onChange={e => setTakeAwayDetails(prev => ({ ...prev, shelfLife: e.target.value }))}
                        placeholder="Ej: 48 horas"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        value={takeAwayDetails.conservationTemp || ''}
                        onChange={e => setTakeAwayDetails(prev => ({ ...prev, conservationTemp: e.target.value }))}
                        placeholder="Ej: 2ºC - 4ºC"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
               </div>

               {/* 2. Protocolo de Embalaje en Cocina */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                      Instrucciones de Embalaje en Cocina / Obrador
                    </label>
                    <textarea
                      value={takeAwayDetails.packagingNotes || ''}
                      onChange={e => setTakeAwayDetails(prev => ({ ...prev, packagingNotes: e.target.value }))}
                      placeholder="Ej: Dejar atemperar 2 min antes de cerrar para evitar condensación de vapor. La salsa debe ir en frío en tarrina separada."
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 min-h-[90px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                      Recomendaciones de Transporte y Estiba
                    </label>
                    <textarea
                      value={takeAwayDetails.transportTips || ''}
                      onChange={e => setTakeAwayDetails(prev => ({ ...prev, transportTips: e.target.value }))}
                      placeholder="Ej: Transportar en plano horizontal en bolsa isotérmica. Máximo 3 envases apilados para no chafar la elaboración."
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 min-h-[90px]"
                    />
                  </div>
               </div>

               {/* 3. ENCARTE PARA EL CLIENTE FINAL (LO QUE VA IMPRESO Y RECORTADO EN EL PAPEL) */}
               <div className="bg-slate-950 border-2 border-dashed border-amber-500/40 rounded-3xl p-6 relative">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                     <div className="flex items-center gap-2 text-amber-400">
                        <Scissors size={18} />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Encarte Recortable para el Cliente (Instrucciones en Casa)
                        </span>
                     </div>
                     <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                       Se imprimirá recortable al final de la ficha
                     </span>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                          Descripción Apetitosa para el Cliente
                        </label>
                        <input
                          type="text"
                          value={takeAwayDetails.homeFinishing?.summaryText || ''}
                          onChange={e => setTakeAwayDetails(prev => ({
                            ...prev,
                            homeFinishing: { ...prev.homeFinishing, summaryText: e.target.value }
                          }))}
                          placeholder="Ej: Delicioso meloso de ternera con su jugo reducido para terminar caliente en tu mesa."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                             Método de Regeneración
                           </label>
                           <select
                             value={takeAwayDetails.homeFinishing?.heatingMethod || 'microwave'}
                             onChange={e => setTakeAwayDetails(prev => ({
                               ...prev,
                               homeFinishing: { ...prev.homeFinishing, heatingMethod: e.target.value as any }
                             }))}
                             className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-bold"
                           >
                             <option value="microwave">Microondas (Rápido y cómodo)</option>
                             <option value="oven">Horno (Para acabados crujientes/gratinados)</option>
                             <option value="pan">Sartén / Cazuela (Fuego medio)</option>
                             <option value="bain_marie">Baño María (Para bolsas al vacío)</option>
                             <option value="cold">Consumo en Frío (Listo para comer)</option>
                           </select>
                        </div>

                        <div className="md:col-span-2">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                             Tiempos y Pasos de Calentado en Casa
                           </label>
                           <input
                             type="text"
                             value={takeAwayDetails.homeFinishing?.heatingInstructions || ''}
                             onChange={e => setTakeAwayDetails(prev => ({
                               ...prev,
                               homeFinishing: { ...prev.homeFinishing, heatingInstructions: e.target.value }
                             }))}
                             placeholder="Ej: Abrir ligeramente la tapa y calentar 2 min a 750W. Calentar la salsa 30s aparte."
                             className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                          Paso Final de Emplatado por el Cliente
                        </label>
                        <input
                          type="text"
                          value={takeAwayDetails.homeFinishing?.platingSteps || ''}
                          onChange={e => setTakeAwayDetails(prev => ({
                            ...prev,
                            homeFinishing: { ...prev.homeFinishing, platingSteps: e.target.value }
                          }))}
                          placeholder="Ej: Verter la salsa caliente sobre el plato y espolvorear los crujientes reservados."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                     </div>
                  </div>
               </div>
             </div>
           ) : (
             <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Esta ficha está configurada actualmente para servicio convencional en sala. Haz clic en <strong>"Activar como Take Away"</strong> si preparas esta elaboración para entrega a domicilio, llevar o 5ª gama.
                </p>
             </div>
           )}
        </div>
      </div>

      {quickAddProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111322]/90 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] max-w-[540px] w-full overflow-visible border border-white/10 my-8">
            <div className="bg-[#111322] text-white px-10 py-10 flex justify-between items-center rounded-t-[2.5rem]">
              <h2 className="text-[26px] font-black uppercase tracking-tight">Añadir Género</h2>
              <button onClick={() => setQuickAddProduct(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={32} />
              </button>
            </div>
            
            <form onSubmit={handleSaveQuickProduct} className="p-10 space-y-9 overflow-visible">
              <div className="relative">
                <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Familia / Categoría de Pedido</label>
                <div className="relative">
                  <input 
                    required type="text" value={familySearch} 
                    onFocus={() => setShowFamilyList(true)}
                    onBlur={() => setTimeout(() => setShowFamilyList(false), 200)}
                    onChange={e => { setFamilySearch(e.target.value.toUpperCase()); setShowFamilyList(true); }} 
                    className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-lg shadow-sm" 
                    placeholder="BUSCAR O CREAR FAMILIA..." 
                  />
                  <ChevronDown className={`absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showFamilyList ? 'rotate-180' : ''}`} size={20} />
                </div>
                {showFamilyList && (
                  <div className="absolute z-[110] left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden max-h-48 overflow-y-auto animate-fadeIn custom-scrollbar">
                    {filteredFamilies.length > 0 ? (
                      filteredFamilies.map(f => (
                        <div key={f} onClick={() => { setFamilySearch(f); setShowFamilyList(false); }} className="px-6 py-4 hover:bg-slate-50 cursor-pointer text-[10px] font-black uppercase text-slate-600 border-b border-slate-50 last:border-0 flex justify-between items-center">
                          <span>{f}</span>
                          <CheckCircle2 size={12} className="text-slate-200" />
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-4 text-[10px] font-black text-amber-500 uppercase bg-amber-50">Crear familia: "{familySearch}"</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-2 tracking-[0.1em]">Nombre del Producto</label>
                <input required type="text" value={quickAddProduct.name} onChange={e => setQuickAddProduct({...quickAddProduct, name: e.target.value.toUpperCase()})} className="w-full px-7 py-5 bg-[#F8FAFC] border-none rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-lg shadow-sm" placeholder="EJ: SOLOMILLO DE TERNERA" />
              </div>

              {(() => {
                const similarProducts = findSimilarProducts(quickAddProduct.name, productDatabase, 4);
                if (similarProducts.length === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>¿Similar o cambiar por producto existente?</span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      Si solo cambia una palabra o formato, puedes cambiarlo directamente por un producto del catálogo sin dar de alta uno duplicado:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {similarProducts.map(sim => (
                        <button
                          key={sim.id}
                          type="button"
                          onClick={() => handleSelectSimilarInEditor(sim)}
                          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-600 hover:text-white text-slate-800 border border-amber-300 hover:border-emerald-600 rounded-xl text-[11px] font-black uppercase shadow-xs transition-all group"
                        >
                          <Check size={13} className="text-emerald-600 group-hover:text-white" />
                          <span>Cambiar por: <strong>{sim.name}</strong> ({sim.pricePerUnit ? `${sim.pricePerUnit}€` : '0€'}/{sim.unit})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-1.5 tracking-[0.1em]">Precio Mercado €</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      value={quickAddProduct.pricePerUnit} 
                      onChange={e => {
                        const val = e.target.value;
                        if (/^[0-9.,]*$/.test(val)) {
                          setQuickAddProduct({...quickAddProduct, pricePerUnit: val as any});
                        }
                      }} 
                      onBlur={e => {
                        const val = e.target.value;
                        let s = val.replace(',', '.');
                        const num = parseFloat(s) || 0;
                        setQuickAddProduct({...quickAddProduct, pricePerUnit: num});
                      }}
                      className="w-full px-5 py-3.5 bg-[#F8FAFC] border-none rounded-2xl font-black outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-base shadow-sm" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#CBD5E1] font-bold text-lg">€</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-1.5 tracking-[0.1em]">Unidad</label>
                  <div className="relative">
                    <select value={quickAddProduct.unit} onChange={e => setQuickAddProduct({...quickAddProduct, unit: e.target.value})} className="w-full px-5 py-3.5 bg-[#F8FAFC] border-none rounded-2xl font-black outline-none appearance-none cursor-pointer text-slate-700 text-base shadow-sm">
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="ud">ud / unidad</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              {/* Nuevas funcionalidades: Proveedor habitual y % Merma estimada */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-1.5 tracking-[0.1em] flex items-center gap-1">
                    <Truck size={12} className="text-slate-400" /> Proveedor Habitual
                  </label>
                  <input 
                    type="text" 
                    value={quickAddProduct.supplier || ''} 
                    onChange={e => setQuickAddProduct({...quickAddProduct, supplier: e.target.value.toUpperCase()})} 
                    className="w-full px-5 py-3.5 bg-[#F8FAFC] border-none rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-xs shadow-sm" 
                    placeholder="Ej: MAKRO, MERCAMURCIA..." 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase mb-1.5 tracking-[0.1em] flex items-center gap-1">
                    <Percent size={12} className="text-slate-400" /> % Merma Estimada
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="90"
                      value={quickAddProduct.wastePercentage ?? ''} 
                      onChange={e => setQuickAddProduct({...quickAddProduct, wastePercentage: parseFloat(e.target.value) || undefined})} 
                      className="w-full px-5 py-3.5 bg-[#F8FAFC] border-none rounded-2xl font-mono font-black outline-none focus:ring-2 focus:ring-slate-100 text-slate-700 text-xs shadow-sm" 
                      placeholder="Ej: 15" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Coste Neto Calculado en Vivo con Merma */}
              {quickAddProduct.wastePercentage && quickAddProduct.wastePercentage > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Coste real limpio (con {quickAddProduct.wastePercentage}% merma):
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {((parseFloat(String(quickAddProduct.pricePerUnit).replace(',', '.')) || 0) / (1 - (quickAddProduct.wastePercentage / 100))).toFixed(3).replace('.', ',')}€/{quickAddProduct.unit}
                  </span>
                </div>
              )}

              {(quickAddProduct.unit === 'ud' || quickAddProduct.unit === 'unidad') && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-black text-amber-600 uppercase mb-1.5 tracking-[0.1em]">Peso por Unidad (gramos)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={quickAddProduct.weightPerUnit || ''} 
                      onChange={e => setQuickAddProduct({...quickAddProduct, weightPerUnit: parseFloat(e.target.value) || undefined})} 
                      className="w-full px-5 py-3.5 bg-amber-50 border-none rounded-2xl font-black outline-none focus:ring-2 focus:ring-amber-200 text-amber-900 text-sm shadow-sm" 
                      placeholder="Ej: 60" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">g</span>
                  </div>
                </div>
              )}

              {/* Selector de Alérgenos Compacto y Funcional */}
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Alérgenos Declarados ({quickAddProduct.allergens.length})
                  </span>
                  {quickAddProduct.allergens.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuickAddProduct({...quickAddProduct, allergens: []})}
                      className="text-[9px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider hover:underline"
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                  {ALLERGEN_LIST.map(a => {
                    const isSel = quickAddProduct.allergens.includes(a);
                    return (
                      <button 
                        key={a} 
                        type="button" 
                        onClick={() => {
                          const current = quickAddProduct.allergens;
                          const updated = isSel ? current.filter(x => x !== a) : [...current, a];
                          setQuickAddProduct({...quickAddProduct, allergens: updated});
                        }} 
                        className={`p-1.5 rounded-xl text-[8.5px] font-black border transition-all uppercase flex flex-col items-center justify-center gap-1 ${
                          isSel 
                            ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs ring-1 ring-rose-300' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 opacity-60 hover:opacity-100'
                        }`}
                        title={a}
                      >
                        <AllergenIcon allergen={a} size={16} />
                        <span className="truncate max-w-full text-[7.5px] tracking-tighter">{a}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Acciones Rápidas Alternativas: Pertenece a la Ficha / No es Producto */}
              {quickAddTarget && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">¿No es de almacén?:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => markIngredientInternal(quickAddTarget.subIdx, quickAddTarget.ingIdx)}
                      className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1"
                    >
                      <Utensils size={11} /> Pertenece a la ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => markIngredientNonProduct(quickAddTarget.subIdx, quickAddTarget.ingIdx)}
                      className="text-[9px] font-black uppercase text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition-all flex items-center gap-1"
                    >
                      <Ban size={11} /> No es producto
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-[#111322] text-white rounded-2xl font-black uppercase text-sm tracking-[0.15em] shadow-xl hover:bg-slate-800 transition-all">
                  Guardar en Catálogo y Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compacto de Alérgenos */}
      {editingAllergenTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight">Control de Alérgenos</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {editingAllergenTarget === 'global' 
                    ? 'Alérgenos globales de la ficha' 
                    : `Ingrediente: ${subRecipes[editingAllergenTarget.subIdx]?.ingredients[editingAllergenTarget.ingIdx]?.name || ''}`}
                </p>
              </div>
              <button onClick={() => setEditingAllergenTarget(null)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Selecciona los alérgenos presentes:
                </span>
                <button 
                  type="button" 
                  onClick={() => {
                    if (editingAllergenTarget === 'global') {
                      setExtraAllergens([]);
                    } else {
                      const { subIdx, ingIdx } = editingAllergenTarget;
                      const newSubs = [...subRecipes];
                      newSubs[subIdx].ingredients[ingIdx].allergens = [];
                      setSubRecipes(newSubs);
                    }
                  }}
                  className="text-[9px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider hover:underline"
                >
                  Limpiar todos
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALLERGEN_LIST.map(a => {
                  const isSel = editingAllergenTarget === 'global' 
                    ? extraAllergens.includes(a)
                    : (subRecipes[editingAllergenTarget.subIdx]?.ingredients[editingAllergenTarget.ingIdx]?.allergens || []).includes(a);
                  
                  return (
                    <button 
                      key={a} 
                      type="button" 
                      onClick={() => toggleTargetAllergen(a)} 
                      className={`p-2.5 rounded-xl text-[9px] font-black border transition-all uppercase flex flex-col items-center justify-center gap-1.5 text-center ${
                        isSel 
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-1 ring-rose-400' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <AllergenIcon allergen={a} size={20} />
                      <span className="truncate max-w-full text-[8px] leading-tight">{a}</span>
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setEditingAllergenTarget(null)} 
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all"
              >
                Listo / Guardar Alérgenos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generador de Prompt para Lámina Doble IA */}
      <ImagePromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        recipeName={name}
        category={categories[0] || 'Cocina de Autor'}
        subRecipes={subRecipes}
        platingInstructions={platingInstructions || serviceDetails.presentation}
        takeAwayDetails={takeAwayDetails}
      />
    </div>
  );
};
