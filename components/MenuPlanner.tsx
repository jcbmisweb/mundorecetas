
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Recipe, AppSettings, ALLERGEN_LIST, Allergen, Product, MenuPlan, AppUser, 
  WorkScheduleDay, DishExtraIngredient, DEFAULT_WORK_SCHEDULE, ServiceDetails 
} from '../types';
import { calculateIngredientCost } from '../lib/costUtils';
import { formatScaledQuantity, convertToBase, formatBaseQuantity } from '../lib/unitUtils';
import { CategoryStripe } from './CategoryStripe';
import { VideoListDisplay } from './VideoListDisplay';
import { 
  Plus, Trash2, ArrowLeft, Printer, Search, ArrowUp, ArrowDown, Calendar, 
  FileText, Utensils, AlertOctagon, Users, ShoppingCart, BookOpen, ChevronRight, 
  ChefHat, Info, Thermometer, User, DollarSign, Save, History, Clock, 
  CheckCircle2, UtensilsCrossed, Check, ShieldCheck, Tag, Sparkles, Filter, 
  Layers, ChevronDown, ListChecks, ArrowRight, Copy, Share2, Edit2, RotateCcw, 
  ClipboardCheck, RefreshCw, X, CheckSquare, Square
} from 'lucide-react';

const ALLERGEN_CONFIG: Record<Allergen, { color: string, short: string, icon: string }> = {
  'Gluten': { color: 'bg-yellow-100 text-yellow-800', short: 'GLU', icon: '🌾' },
  'Crustáceos': { color: 'bg-red-100 text-red-800', short: 'CRU', icon: '🦀' },
  'Huevos': { color: 'bg-orange-100 text-orange-800', short: 'HUE', icon: '🥚' },
  'Pescado': { color: 'bg-blue-100 text-blue-800', short: 'PES', icon: '🐟' },
  'Cacahuetes': { color: 'bg-amber-100 text-amber-800', short: 'CAC', icon: '🥜' },
  'Soja': { color: 'bg-purple-100 text-purple-800', short: 'SOJA', icon: '🌱' },
  'Lácteos': { color: 'bg-sky-100 text-sky-800', short: 'LAC', icon: '🥛' },
  'Frutos de cáscara': { color: 'bg-emerald-100 text-emerald-800', short: 'FRA', icon: '🌰' },
  'Apio': { color: 'bg-green-100 text-green-800', short: 'API', icon: '🥬' },
  'Mostaza': { color: 'bg-yellow-200 text-yellow-900', short: 'MUS', icon: '🌭' },
  'Sésamo': { color: 'bg-stone-100 text-stone-800', short: 'SES', icon: '🥯' },
  'Sulfitos': { color: 'bg-gray-200 text-gray-800', short: 'SUL', icon: '🍷' },
  'Altramuces': { color: 'bg-pink-100 text-pink-800', short: 'ALT', icon: '🏵️' },
  'Moluscos': { color: 'bg-indigo-100 text-indigo-800', short: 'MOL', icon: '🐙' }
};

export const DEFAULT_MENU_ROLES = [
  'Aperitivo 1',
  'Aperitivo 2',
  'Aperitivo 3',
  'Pan / Mesa de Panes',
  'Entrante Frío',
  'Entrante Caliente',
  'Pescado',
  'Carne',
  'Guarnición',
  'Pre-Postre',
  'Postre 1',
  'Postre 2',
  'Petit Fours',
  'Bebida / Maridaje'
];

export const ECONOMATO_FAMILIES = [
  'FRUTAS Y VERDURAS',
  'CARNES Y AVES',
  'PESCADOS Y MARISCOS',
  'LÁCTEOS Y HUEVOS',
  'CONGELADOS',
  'ACEITES Y GRASAS',
  'ALMACÉN, SECOS Y ESPECIAS',
  'PANADERÍA Y PASTELERÍA',
  'BEBIDAS Y BODEGA',
  'OTROS / VARIOS'
];

export const normalizeFamily = (cat?: string): string => {
  if (!cat) return 'OTROS / VARIOS';
  const c = cat.trim().toLowerCase();
  if (c.includes('fruta') || c.includes('verdura') || c.includes('hortaliz') || c.includes('vegetal')) return 'FRUTAS Y VERDURAS';
  if (c.includes('carne') || c.includes('ave') || c.includes('pollo') || c.includes('cerdo') || c.includes('ternera') || c.includes('embutido') || c.includes('chaciner')) return 'CARNES Y AVES';
  if (c.includes('pescado') || c.includes('marisco') || c.includes('molusco') || c.includes('crustaceo')) return 'PESCADOS Y MARISCOS';
  if (c.includes('lacteo') || c.includes('lácteo') || c.includes('leche') || c.includes('queso') || c.includes('huevo') || c.includes('mantequilla') || c.includes('nata') || c.includes('yogur')) return 'LÁCTEOS Y HUEVOS';
  if (c.includes('congelado')) return 'CONGELADOS';
  if (c.includes('aceite') || c.includes('grasa') || c.includes('manteca')) return 'ACEITES Y GRASAS';
  if (c.includes('pan') || c.includes('pasteler') || c.includes('boller') || c.includes('harina')) return 'PANADERÍA Y PASTELERÍA';
  if (c.includes('bebida') || c.includes('vino') || c.includes('licor') || c.includes('bodega') || c.includes('maridaje')) return 'BEBIDAS Y BODEGA';
  if (c.includes('almacen') || c.includes('almacén') || c.includes('seco') || c.includes('legumbre') || c.includes('arroz') || c.includes('pasta') || c.includes('especia') || c.includes('condimento') || c.includes('azucar') || c.includes('azúcar') || c.includes('sal')) return 'ALMACÉN, SECOS Y ESPECIAS';
  return 'OTROS / VARIOS';
};

export const CHEF_CHECKLIST_ITEMS = [
  { id: 'mise_en_place', label: 'Mise en place completa y materias primas pesadas / verificadas' },
  { id: 'temperaturas_appcc', label: 'Puntos de cocción y temperaturas de conservación/servicio (APPCC)' },
  { id: 'degustacion_sazon', label: 'Degustación previa y rectificación de sazón / punto de sal aprobada por el profesor' },
  { id: 'alergenos_cruzada', label: 'Control estricto de alérgenos y prevención de contaminación cruzada' },
  { id: 'vajilla_pase', label: 'Vajilla y soportes de emplatado listos a temperatura adecuada (caliente/fría)' },
  { id: 'marcaje_sala', label: 'Marcaje de mesa y cubertería sincronizado con el equipo de sala' },
  { id: 'emplatado_patron', label: 'Plato testigo / emplatado patrón verificado antes del pase' },
  { id: 'limpieza_partida', label: 'Partida limpia, recogida y orden higiénico cumplido (Plan L+D)' }
];

type PlannerTab = 
  | 'planning'        // 1. Selección & PAX
  | 'menu_roles'      // 2. Estructura y Roles del Menú
  | 'dishes_order'    // 3. Pedido por Platos & Extras
  | 'purchase_order'  // 4. Pedido General Consolidado (Familias)
  | 'work_order'      // 5. Orden de Trabajo & Grupos
  | 'kitchen_fichas'  // Fichas Cocina
  | 'service_order'   // Orden Servicio Sala
  | 'allergen_matrix' // Matriz Alérgenos
  | 'declaration_doc' // REG-08-02 Declaración Ingredientes y Alérgenos
  | 'history';        // Histórico de Menús

interface MenuPlannerProps {
  recipes: Recipe[];
  settings: AppSettings;
  appUser: AppUser | null;
  onBack: () => void;
  productDatabase: Product[];
  savedMenus: MenuPlan[];
  onSaveMenu: (menu: MenuPlan) => Promise<void> | void;
  onDeleteMenu: (id: string) => void;
  onUpdateRecipe: (recipe: Recipe) => Promise<void> | void;
}

export const MenuPlanner: React.FC<MenuPlannerProps> = ({ 
  recipes, settings, appUser, onBack, productDatabase, savedMenus, onSaveMenu, onDeleteMenu, onUpdateRecipe 
}) => {
  const [activeTab, setActiveTab] = useState<PlannerTab>('planning');
  const [currentMenuId, setCurrentMenuId] = useState<string | null>(null);
  const [menuTitle, setMenuTitle] = useState('MENÚ DEL DÍA');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuPax, setMenuPax] = useState<number>(30);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Dynamic roles / apartados state (allows teacher to add Pan 2, Aperitivo 4, etc.)
  const [availableRoles, setAvailableRoles] = useState<string[]>(
    settings.menuRoles && settings.menuRoles.length > 0 ? settings.menuRoles : DEFAULT_MENU_ROLES
  );
  const [newRoleInput, setNewRoleInput] = useState('');

  // States for the refined educational menu pipeline
  const [recipeRoles, setRecipeRoles] = useState<Record<string, string>>({});
  const [dishExtraIngredients, setDishExtraIngredients] = useState<Record<string, DishExtraIngredient[]>>({});
  const [dishApprovals, setDishApprovals] = useState<Record<string, boolean>>({});

  // Overrides for base dish ingredients in dishes order (allows teacher to adjust scaled quantities and substitute ingredients)
  const [dishIngredientOverrides, setDishIngredientOverrides] = useState<
    Record<string, Record<string, { quantity: string; unit: string; notes?: string; replacedName?: string; originalName?: string }>>
  >({});

  // State for substituting ingredient modal/drawer in dishes order
  const [substitutingItem, setSubstitutingItem] = useState<{
    recipeId: string;
    ingKey: string;
    originalName: string;
    replacedName: string;
    quantity: string;
    unit: string;
    notes: string;
  } | null>(null);

  // Editing state for already added extra ingredients
  const [editingExtra, setEditingExtra] = useState<{ recipeId: string; extra: DishExtraIngredient } | null>(null);

  // Chef checklist verification for kitchen sheets
  const [kitchenChecklist, setKitchenChecklist] = useState<Record<string, Record<string, boolean>>>({});
  
  // Work schedule state
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleDay[]>(
    settings.workSchedule && settings.workSchedule.length > 0 
      ? JSON.parse(JSON.stringify(settings.workSchedule)) 
      : JSON.parse(JSON.stringify(DEFAULT_WORK_SCHEDULE))
  );
  const [groupCount, setGroupCount] = useState<number>(settings.defaultGroupCount || 4);
  const [dishGroupAssignments, setDishGroupAssignments] = useState<Record<string, number>>({});
  const [groupNotes, setGroupNotes] = useState<Record<number, string>>({});
  const [workOrderAdvanceNotes, setWorkOrderAdvanceNotes] = useState<{
    fifteenDaysBefore?: string;
    twoDaysBefore?: string;
    serviceDayNotes?: string;
  }>({
    fifteenDaysBefore: 'Revisión y elaboración de fondos oscuros congelados, despiece técnico y compras de género no perecedero.',
    twoDaysBefore: 'Salmueras, marinados de carnes/pescados, fondos cortos, bases de salsas y elaboración de masas fermentadas.',
    serviceDayNotes: '08:30 Mise en place final de partidas • 12:30 Briefing con el equipo de sala • 13:00 Entrada de comandas.'
  });

  // Adding extra ingredient form modal state
  const [addingExtraForRecipeId, setAddingExtraForRecipeId] = useState<string | null>(null);
  const [printFilterDishId, setPrintFilterDishId] = useState<string | 'all'>('all');
  const [extraForm, setExtraForm] = useState<{
    name: string;
    quantity: string;
    unit: string;
    category: string;
    pricePerUnit: number;
    notes: string;
  }>({
    name: '',
    quantity: '',
    unit: 'g',
    category: 'FRUTAS Y VERDURAS',
    pricePerUnit: 0,
    notes: ''
  });
  const [extraSearchTerm, setExtraSearchTerm] = useState('');
  const [ignoredPurchaseItems, setIgnoredPurchaseItems] = useState<string[]>([]);
  const [generalExtraItems, setGeneralExtraItems] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    family: string;
    notes?: string;
  }>>([]);
  const [newGeneralItem, setNewGeneralItem] = useState({
    name: '',
    quantity: 1,
    unit: 'ud',
    family: 'Varios / Otros',
    notes: ''
  });

  const handleAddGeneralExtraItem = () => {
    if (!newGeneralItem.name.trim()) return;
    const item = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newGeneralItem.name.trim(),
      quantity: Number(newGeneralItem.quantity) || 1,
      unit: newGeneralItem.unit || 'ud',
      family: newGeneralItem.family || 'Varios / Otros',
      notes: newGeneralItem.notes.trim()
    };
    setGeneralExtraItems(prev => [...prev, item]);
    setNewGeneralItem({
      name: '',
      quantity: 1,
      unit: 'ud',
      family: 'Varios / Otros',
      notes: ''
    });
  };

  const handleRemoveGeneralExtraItem = (id: string) => {
    setGeneralExtraItems(prev => prev.filter(i => i.id !== id));
  };

  // Selected group filter for printing individual brigade sheets
  const [filterPrintGroup, setFilterPrintGroup] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    if (activeTab === 'kitchen_fichas' || activeTab === 'work_order') {
      const originalTitle = document.title;
      document.title = `${menuTitle} - ${activeTab === 'work_order' ? 'Orden de Trabajo' : 'Fichas'}`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [activeTab, menuTitle]);

  // Ensure default roles when recipes are added
  useEffect(() => {
    const nextRoles = { ...recipeRoles };
    selectedRecipes.forEach((recipe, idx) => {
      if (!nextRoles[recipe.id]) {
        // Suggest automatic role based on index and category
        const cat = (recipe.category || '').toLowerCase();
        if (cat.includes('aperitivo') || cat.includes('entrante')) {
          nextRoles[recipe.id] = `Aperitivo ${idx + 1}`;
        } else if (cat.includes('pescado')) {
          nextRoles[recipe.id] = 'Pescado';
        } else if (cat.includes('carne')) {
          nextRoles[recipe.id] = 'Carne';
        } else if (cat.includes('postre') || cat.includes('dulce')) {
          nextRoles[recipe.id] = 'Postre';
        } else {
          nextRoles[recipe.id] = DEFAULT_MENU_ROLES[Math.min(idx, DEFAULT_MENU_ROLES.length - 1)];
        }
      }
    });
    setRecipeRoles(nextRoles);
  }, [selectedRecipes]);

  const filteredRecipes = recipes.filter(r => 
    !selectedRecipes.find(sr => sr.id === r.id) &&
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Economic calculations including teacher's extra ingredients and modified quantities
  const menuEconomics = useMemo(() => {
    let totalCost = 0;
    selectedRecipes.forEach(recipe => {
      const ratio = menuPax / (recipe.yieldQuantity || 1);

      recipe.subRecipes.forEach((sub, sIdx) => {
        sub.ingredients.forEach((ing, iIdx) => {
          const ingKey = `${sIdx}_${iIdx}`;
          const override = dishIngredientOverrides[recipe.id]?.[ingKey];
          const qtyNum = override ? parseFloat(override.quantity.replace(',', '.')) : parseFloat(ing.quantity.replace(',', '.'));
          const finalQty = override ? (isNaN(qtyNum) ? 0 : qtyNum) : (isNaN(qtyNum) ? 0 : qtyNum * ratio);
          const ingCost = calculateIngredientCost(finalQty, override ? override.unit : ing.unit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);
          totalCost += ingCost;
        });
      });

      // Add extra ingredients cost
      const extras = dishExtraIngredients[recipe.id] || [];
      extras.forEach(extra => {
        const qtyNum = parseFloat(extra.quantity.replace(',', '.'));
        if (!isNaN(qtyNum) && extra.pricePerUnit) {
          totalCost += qtyNum * extra.pricePerUnit;
        }
      });
    });
    return {
      total: totalCost,
      perPax: selectedRecipes.length > 0 && menuPax > 0 ? totalCost / menuPax : 0
    };
  }, [selectedRecipes, menuPax, dishExtraIngredients, dishIngredientOverrides]);

  // Consolidated Purchase Order (Familias): integrates base ingredients scaled/adjusted + teacher's extras in their exact assigned family
  const purchaseOrderData = useMemo(() => {
    const families: Record<string, Record<string, { name: string, originalName?: string, baseQuantity: number, unit: string, cost: number, sourceDishes: string[] }>> = {};

    selectedRecipes.forEach(recipe => {
      const ratio = menuPax / (recipe.yieldQuantity || 1);
      const role = recipeRoles[recipe.id] || recipe.name;

      // 1. Base recipe ingredients (with possible teacher manual override or substitution for this service)
      recipe.subRecipes.forEach((sub, sIdx) => {
        sub.ingredients.forEach((ing, iIdx) => {
          const ingKey = `${sIdx}_${iIdx}`;
          const override = dishIngredientOverrides[recipe.id]?.[ingKey];
          const effectiveName = (override?.replacedName && override.replacedName.trim()) ? override.replacedName.trim() : ing.name;
          const isSubstituted = !!(override?.replacedName && override.replacedName.toLowerCase().trim() !== ing.name.toLowerCase().trim());

          const product = productDatabase.find(p => p.name.trim().toLowerCase() === effectiveName.trim().toLowerCase());
          const family = normalizeFamily(product?.category || ing.category);

          const qtyNum = override ? parseFloat(override.quantity.replace(',', '.')) : parseFloat(ing.quantity.replace(',', '.'));
          const finalQty = override ? (isNaN(qtyNum) ? 0 : qtyNum) : (isNaN(qtyNum) ? 0 : qtyNum * ratio);
          const effectiveUnit = override ? override.unit : ing.unit;
          const finalCost = calculateIngredientCost(finalQty, effectiveUnit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);
          
          const baseQty = convertToBase(finalQty, effectiveUnit);
          const targetUnit = product?.unit || effectiveUnit;

          if (!families[family]) families[family] = {};
          const dishLabel = isSubstituted
            ? `${role} (Sustituido: ${effectiveName} por ${ing.name})`
            : override ? `${role} (Ajustado)` : role;

          if (!families[family][effectiveName]) {
            families[family][effectiveName] = { 
              name: effectiveName, 
              originalName: isSubstituted ? ing.name : undefined,
              baseQuantity: baseQty, 
              unit: targetUnit, 
              cost: finalCost,
              sourceDishes: [dishLabel]
            };
          } else {
            families[family][effectiveName].baseQuantity += baseQty;
            families[family][effectiveName].cost += finalCost;
            if (!families[family][effectiveName].sourceDishes.includes(dishLabel)) {
              families[family][effectiveName].sourceDishes.push(dishLabel);
            }
          }
        });
      });

      // 2. Teacher's extra added ingredients for this dish (strictly categorized into the assigned economato family)
      const extras = dishExtraIngredients[recipe.id] || [];
      extras.forEach(extra => {
        const product = productDatabase.find(p => p.name.trim().toLowerCase() === extra.name.trim().toLowerCase());
        // Use teacher assigned category first, normalized to the standard families
        const family = normalizeFamily(extra.category || product?.category);
        const qtyNum = parseFloat(extra.quantity.replace(',', '.'));
        const finalQty = isNaN(qtyNum) ? 0 : qtyNum;
        const finalCost = (extra.pricePerUnit || 0) * finalQty;
        const baseQty = convertToBase(finalQty, extra.unit);
        const targetUnit = product?.unit || extra.unit;

        if (!families[family]) families[family] = {};
        if (!families[family][extra.name]) {
          families[family][extra.name] = {
            name: `${extra.name} (Extra ${role})`,
            baseQuantity: baseQty,
            unit: targetUnit,
            cost: finalCost,
            sourceDishes: [`${role} (Extra)`]
          };
        } else {
          families[family][extra.name].baseQuantity += baseQty;
          families[family][extra.name].cost += finalCost;
          if (!families[family][extra.name].sourceDishes.includes(`${role} (Extra)`)) {
            families[family][extra.name].sourceDishes.push(`${role} (Extra)`);
          }
        }
      });
    });

    // 3. General extra items and notes added by teacher to the purchase order
    generalExtraItems.forEach(item => {
      const family = normalizeFamily(item.family);
      const baseQty = convertToBase(item.quantity, item.unit);
      const targetUnit = item.unit;
      if (!families[family]) families[family] = {};
      const key = item.name;
      if (!families[family][key]) {
        families[family][key] = {
          name: `${item.name}${item.notes ? ` (${item.notes})` : ' (Extra General)'}`,
          baseQuantity: baseQty,
          unit: targetUnit,
          cost: 0,
          sourceDishes: [item.notes ? `Nota: ${item.notes}` : 'Pedido General Extra']
        };
      } else {
        families[family][key].baseQuantity += baseQty;
      }
    });

    const filteredFamilies: Record<string, Record<string, any>> = {};
    Object.entries(families).forEach(([family, items]) => {
      const validItems: Record<string, any> = {};
      Object.entries(items).forEach(([itemName, itemVal]: [string, any]) => {
        const isIgnored = ignoredPurchaseItems.some(ig => 
          ig.trim().toLowerCase() === itemVal.name.trim().toLowerCase() ||
          ig.trim().toLowerCase() === itemName.trim().toLowerCase()
        );
        if (!isIgnored) {
          validItems[itemName] = itemVal;
        }
      });
      if (Object.keys(validItems).length > 0) {
        filteredFamilies[family] = validItems;
      }
    });

    return Object.entries(filteredFamilies).sort(([a], [b]) => a.localeCompare(b));
  }, [selectedRecipes, menuPax, productDatabase, recipeRoles, dishExtraIngredients, dishIngredientOverrides, ignoredPurchaseItems, generalExtraItems]);

  // Roles management handlers
  const handleAddCustomRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    if (!availableRoles.includes(trimmed)) {
      setAvailableRoles(prev => [...prev, trimmed]);
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setAvailableRoles(prev => prev.filter(r => r !== roleToRemove));
  };

  // Sync service details (cutlery/marcaje, presentation, description) from master recipes
  const handleSyncServiceDetailsFromRecipes = () => {
    setSelectedRecipes(prev => prev.map(sr => {
      const orig = recipes.find(r => r.id === sr.id);
      if (!orig) return sr;
      return {
        ...sr,
        serviceDetails: {
          presentation: orig.serviceDetails?.presentation || orig.platingInstructions || sr.serviceDetails?.presentation || '',
          servingTemp: orig.serviceDetails?.servingTemp || sr.serviceDetails?.servingTemp || '',
          cutlery: orig.serviceDetails?.cutlery || sr.serviceDetails?.cutlery || '',
          passTime: sr.serviceDetails?.passTime || orig.serviceDetails?.passTime || '',
          serviceType: orig.serviceDetails?.serviceType || sr.serviceDetails?.serviceType || '',
          clientDescription: orig.serviceDetails?.clientDescription || sr.serviceDetails?.clientDescription || ''
        }
      };
    }));
    alert("Marcaje (cubertería), presentación y protocolos sincronizados desde las fichas técnicas maestras.");
  };

  // Save full menu plan with roles, extras, schedule, checklist, overrides and group assignments
  const handleSavePlan = async (asNew: boolean = false) => {
    if (selectedRecipes.length === 0) return;
    setSaveStatus('saving');
    const newId = (asNew || !currentMenuId) ? `menu_${Date.now()}` : currentMenuId;

    const serviceDetailsOverrides: Record<string, Partial<ServiceDetails>> = {};
    selectedRecipes.forEach(r => {
      if (r.serviceDetails) {
        serviceDetailsOverrides[r.id] = r.serviceDetails;
      }
    });

    const plan: MenuPlan = {
      id: newId,
      title: menuTitle,
      date: eventDate,
      pax: menuPax,
      recipeIds: selectedRecipes.map(r => r.id),
      lastModified: Date.now(),
      workspaceId: appUser?.workspaceId || '',
      recipeRoles,
      dishExtraIngredients,
      dishApprovals,
      workSchedule,
      groupCount,
      dishGroupAssignments,
      groupNotes,
      workOrderAdvanceNotes,
      customMenuRoles: availableRoles,
      dishIngredientOverrides,
      kitchenChecklist,
      serviceDetailsOverrides,
      generalExtraItems,
      ignoredPurchaseItems
    };
    
    try {
      await onSaveMenu(plan);
      
      // Save any modifications made to the recipes' service details
      await Promise.all(selectedRecipes.map(recipe => onUpdateRecipe(recipe)));

      if (asNew || !currentMenuId) setCurrentMenuId(newId);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error("Error saving menu plan:", error);
      setSaveStatus('idle');
      alert("Hubo un error al guardar el menú.");
    }
  };

  const handleLoadPlan = (plan: MenuPlan) => {
    setMenuTitle(plan.title);
    setEventDate(plan.date);
    setMenuPax(plan.pax);
    setCurrentMenuId(plan.id);
    
    const matchedRecipes = plan.recipeIds
      .map(id => {
        const orig = recipes.find(r => r.id === id);
        if (!orig) return null;
        const copy: Recipe = JSON.parse(JSON.stringify(orig));
        // Apply saved service details override if present
        if (plan.serviceDetailsOverrides && plan.serviceDetailsOverrides[id]) {
          copy.serviceDetails = { ...(copy.serviceDetails || {}), ...plan.serviceDetailsOverrides[id] };
        } else if (!copy.serviceDetails?.cutlery && orig.serviceDetails?.cutlery) {
          if (!copy.serviceDetails) {
            copy.serviceDetails = { presentation: '', servingTemp: '', cutlery: '', passTime: '', serviceType: '', clientDescription: '' };
          }
          copy.serviceDetails.cutlery = orig.serviceDetails.cutlery;
        }
        return copy;
      })
      .filter(r => !!r) as Recipe[];
    
    setSelectedRecipes(matchedRecipes);
    setRecipeRoles(plan.recipeRoles || {});
    setDishExtraIngredients(plan.dishExtraIngredients || {});
    setDishApprovals(plan.dishApprovals || {});
    if (plan.customMenuRoles && plan.customMenuRoles.length > 0) {
      setAvailableRoles(plan.customMenuRoles);
    }
    if (plan.dishIngredientOverrides) {
      setDishIngredientOverrides(plan.dishIngredientOverrides);
    }
    if (plan.kitchenChecklist) {
      setKitchenChecklist(plan.kitchenChecklist);
    }
    if (plan.workSchedule && plan.workSchedule.length > 0) {
      setWorkSchedule(plan.workSchedule);
    }
    if (plan.groupCount) setGroupCount(plan.groupCount);
    if (plan.dishGroupAssignments) setDishGroupAssignments(plan.dishGroupAssignments);
    if (plan.groupNotes) setGroupNotes(plan.groupNotes);
    if (plan.workOrderAdvanceNotes) setWorkOrderAdvanceNotes(plan.workOrderAdvanceNotes);
    if (plan.generalExtraItems) setGeneralExtraItems(plan.generalExtraItems);
    if (plan.ignoredPurchaseItems) setIgnoredPurchaseItems(plan.ignoredPurchaseItems);

    setActiveTab('planning');
  };

  const handleReset = () => {
    if (confirm("¿Limpiar planificación actual?")) {
      setSelectedRecipes([]);
      setMenuTitle('MENÚ DEL DÍA');
      setCurrentMenuId(null);
      setMenuPax(30);
      setRecipeRoles({});
      setDishExtraIngredients({});
      setDishApprovals({});
      setDishIngredientOverrides({});
      setKitchenChecklist({});
      setEditingExtra(null);
      setDishGroupAssignments({});
    }
  };

  const addToMenu = (recipe: Recipe) => {
    const copy: Recipe = JSON.parse(JSON.stringify(recipe));
    if (!copy.serviceDetails) {
      copy.serviceDetails = {
        presentation: copy.platingInstructions || '',
        servingTemp: '',
        cutlery: '',
        passTime: '',
        serviceType: '',
        clientDescription: ''
      };
    }
    // Pull marcaje / cutlery from technical sheet if available
    if (!copy.serviceDetails.cutlery && recipe.serviceDetails?.cutlery) {
      copy.serviceDetails.cutlery = recipe.serviceDetails.cutlery;
    }
    setSelectedRecipes([...selectedRecipes, copy]);
  };
  const removeFromMenu = (index: number) => {
    const newMenu = [...selectedRecipes];
    newMenu.splice(index, 1);
    setSelectedRecipes(newMenu);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newMenu = [...selectedRecipes];
    const item = newMenu[index];
    newMenu.splice(index, 1);
    newMenu.splice(direction === 'up' ? index - 1 : index + 1, 0, item);
    setSelectedRecipes(newMenu);
  };

  const updateServiceOrder = (index: number, field: string, value: string) => {
    const newMenu = [...selectedRecipes];
    if (!newMenu[index].serviceDetails) {
      newMenu[index].serviceDetails = { presentation: '', servingTemp: '', cutlery: '', passTime: '', serviceType: '', clientDescription: '' };
    }
    newMenu[index].serviceDetails = { ...newMenu[index].serviceDetails, [field]: value };
    setSelectedRecipes(newMenu);
  };

  const toggleDishApproval = (recipeId: string) => {
    setDishApprovals(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const handleApproveAllDishes = () => {
    const next: Record<string, boolean> = {};
    selectedRecipes.forEach(r => { next[r.id] = true; });
    setDishApprovals(next);
  };

  // Add extra ingredient to a specific dish
  const handleAddExtraIngredient = (recipeId: string) => {
    if (!extraForm.name.trim() || !extraForm.quantity.trim()) return;

    const newExtra: DishExtraIngredient = {
      id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: extraForm.name.trim(),
      quantity: extraForm.quantity.trim(),
      unit: extraForm.unit || 'g',
      category: extraForm.category || 'FRUTAS Y VERDURAS',
      pricePerUnit: extraForm.pricePerUnit || 0,
      notes: extraForm.notes.trim()
    };

    setDishExtraIngredients(prev => ({
      ...prev,
      [recipeId]: [...(prev[recipeId] || []), newExtra]
    }));

    // Reset form
    setExtraForm({
      name: '',
      quantity: '',
      unit: 'g',
      category: 'FRUTAS Y VERDURAS',
      pricePerUnit: 0,
      notes: ''
    });
    setExtraSearchTerm('');
    setAddingExtraForRecipeId(null);
  };

  const handleUpdateExtraIngredient = (recipeId: string, updatedExtra: DishExtraIngredient) => {
    setDishExtraIngredients(prev => ({
      ...prev,
      [recipeId]: (prev[recipeId] || []).map(e => e.id === updatedExtra.id ? updatedExtra : e)
    }));
    setEditingExtra(null);
  };

  const handleRemoveExtraIngredient = (recipeId: string, extraId: string) => {
    setDishExtraIngredients(prev => ({
      ...prev,
      [recipeId]: (prev[recipeId] || []).filter(e => e.id !== extraId)
    }));
  };

  const getRecipeAllergens = (r: Recipe): Allergen[] => {
    const set = new Set<Allergen>();
    r.subRecipes.forEach(sub => sub.ingredients.forEach(ing => ing.allergens.forEach(a => set.add(a))));
    r.extraAllergens?.forEach(a => set.add(a));
    return Array.from(set);
  };

  const getScaledData = (qtyStr: string, unit: string, recipeYield: number, baseUnit?: string, ingredientName?: string): { quantity: string, unit: string } => {
    const num = parseFloat(qtyStr.replace(',', '.'));
    if (isNaN(num)) return { quantity: qtyStr, unit };
    const scaledNum = num * (menuPax / recipeYield);
    return formatScaledQuantity(scaledNum, unit, baseUnit, ingredientName);
  };

  const approvedCount = selectedRecipes.filter(r => dishApprovals[r.id]).length;
  const allApproved = selectedRecipes.length > 0 && approvedCount === selectedRecipes.length;

  const PrintHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
       <div className="w-1/4">
          {settings.instituteLogo ? <img src={settings.instituteLogo} className="h-16 object-contain" alt="IES" /> : <span className="font-bold text-slate-800">{settings.instituteName}</span>}
       </div>
       <div className="w-2/4 text-center">
          <h1 className="text-2xl font-black uppercase mb-1 tracking-tighter text-slate-900">{title}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{subtitle}</p>
       </div>
       <div className="w-1/4 text-right">
          <p className="text-xs font-black text-slate-900">{appUser?.teacherName || appUser?.displayName}</p>
          <p className="text-[10px] font-bold text-slate-500">{new Date().toLocaleDateString()}</p>
       </div>
    </div>
  );

  // Suggested products when adding extra
  const filteredProductsForExtra = useMemo(() => {
    if (!extraSearchTerm.trim()) return [];
    const term = extraSearchTerm.toLowerCase();
    return productDatabase
      .filter(p => p.name.toLowerCase().includes(term) || (p.category || '').toLowerCase().includes(term))
      .slice(0, 6);
  }, [productDatabase, extraSearchTerm]);

  return (
    <div className="min-h-screen bg-[#F2FBF5] text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* HEADER PRINCIPAL Y STEPPER PEDAGÓGICO (Identidad Verde Menta & Salvia Fresco) */}
      <header className="bg-white text-slate-800 border-b border-emerald-200 sticky top-0 z-40 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ChefHat size={18} className="text-emerald-700" />
                <h1 className="text-lg font-bold tracking-tight text-slate-900 font-serif">Planificador y Órdenes de Cocina</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Menús Gastronómicos
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {menuTitle} • {menuPax} PAX • {eventDate}
              </p>
            </div>
          </div>

          {/* ACCESOS DIRECTOS COMPLEMENTARIOS */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button 
              onClick={() => setActiveTab('history')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <History size={14}/> Histórico
            </button>
            <button 
              onClick={() => setActiveTab('kitchen_fichas')} 
              disabled={selectedRecipes.length === 0} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 ${activeTab === 'kitchen_fichas' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <BookOpen size={14}/> Fichas Cocina
            </button>
            <button 
              onClick={() => setActiveTab('service_order')} 
              disabled={selectedRecipes.length === 0} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 ${activeTab === 'service_order' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <FileText size={14}/> Sala / Pase
            </button>
            <button 
              onClick={() => setActiveTab('allergen_matrix')} 
              disabled={selectedRecipes.length === 0} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 ${activeTab === 'allergen_matrix' ? 'bg-rose-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <AlertOctagon size={14}/> Matriz Alérgenos
            </button>
            <button 
              onClick={() => setActiveTab('declaration_doc')} 
              disabled={selectedRecipes.length === 0} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 ${activeTab === 'declaration_doc' ? 'bg-rose-800 text-white shadow-xs' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'}`}
              title="REG-08-02: Declaración de Ingredientes y Alérgenos Oficial"
            >
              <FileText size={14} className="text-rose-600"/> Doc. REG-08-02 Alérgenos
            </button>
            {selectedRecipes.length > 0 && (
              <button 
                onClick={() => handleSavePlan()} 
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm ml-2 ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}`}
              >
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? <><CheckCircle2 size={14}/> Guardado</> : <><Save size={14}/> Guardar</>}
              </button>
            )}
          </div>
        </div>

        {/* STEPPER SECUENCIAL DE TRABAJO (Verde Salvia Suave) */}
        <div className="bg-emerald-50/70 border-t border-emerald-100 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
            {[
              { id: 'planning', num: '1', title: 'Selección & PAX', icon: Utensils, desc: 'Elegir platos' },
              { id: 'menu_roles', num: '2', title: 'Roles de Menú', icon: Layers, desc: 'Aperitivos, Carnes...' },
              { id: 'dishes_order', num: '3', title: 'Pedido por Platos', icon: ListChecks, desc: 'Revisión & Extras' },
              { id: 'purchase_order', num: '4', title: 'Pedido General', icon: ShoppingCart, desc: 'Por Familias' },
              { id: 'work_order', num: '5', title: 'Orden de Trabajo', icon: Clock, desc: 'Horarios & Grupos' }
            ].map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              const isDisabled = selectedRecipes.length === 0 && step.id !== 'planning';

              return (
                <button
                  key={step.id}
                  onClick={() => !isDisabled && setActiveTab(step.id as PlannerTab)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all shrink-0 text-left ${
                    isActive 
                      ? 'bg-emerald-700 text-white font-bold shadow-xs' 
                      : isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : 'text-slate-700 hover:bg-white hover:text-emerald-900'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {step.num}
                  </span>
                  <div>
                    <p className="text-xs leading-none font-bold uppercase tracking-tight">{step.title}</p>
                    <p className={`text-[9px] ${isActive ? 'text-emerald-100 font-medium' : 'text-slate-500 font-normal'}`}>{step.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL POR PESTAÑAS */}
      <main className="flex-grow">

        {/* 1. SELECCIÓN DE PLATOS Y PAX (La pantalla base que le gusta al usuario) */}
        {activeTab === 'planning' && (
          <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Catálogo izquierdo */}
              <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[75vh]">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Filtrar catálogo..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 shadow-inner font-bold text-sm bg-white" 
                      />
                   </div>
                 </div>
                 <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredRecipes.map(recipe => (
                      <div key={recipe.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group shadow-xs">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shadow-inner relative shrink-0">
                              <CategoryStripe category={recipe.category} settings={settings} vertical={true} className="absolute left-0 top-0 bottom-0 w-1 z-10" />
                              {recipe.photo && (
                                <img 
                                  src={recipe.photo} 
                                  className={`w-full h-full object-cover ${recipe.photoLayout === 'banner' ? 'object-right' : 'object-center'}`} 
                                  alt="" 
                                />
                              )}
                            </div>
                            <div>
                               <h4 className="font-black text-slate-800 text-sm uppercase leading-tight mb-1">{recipe.name}</h4>
                               <div className="flex items-center gap-2">
                                 <div className="relative">
                                   <CategoryStripe category={recipe.category} settings={settings} className="absolute inset-0 rounded opacity-20" />
                                   <p className="relative text-[8px] text-slate-600 font-bold uppercase tracking-widest px-1.5 py-0.5 leading-none">{recipe.category}</p>
                                 </div>
                               </div>
                            </div>
                         </div>
                         <button 
                           onClick={() => addToMenu(recipe)} 
                           className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-xs group-hover:scale-105"
                           title="Añadir al menú"
                         >
                           <Plus size={20} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Bandeja derecha del servicio */}
              <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col overflow-hidden h-[75vh]">
                 <div className="p-8 border-b border-indigo-50 bg-indigo-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Utensils size={24}/></div>
                        <div>
                          <h3 className="font-black text-indigo-900 uppercase tracking-widest">Servicio Programado</h3>
                          <p className="text-xs text-indigo-500 font-bold uppercase">Paso 1: Definición de Platos y Volumen</p>
                        </div>
                      </div>
                      {selectedRecipes.length > 0 && (
                        <button onClick={handleReset} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Resetear"><Trash2 size={20}/></button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 tracking-widest">Nombre del Menú / Evento</label>
                        <input type="text" value={menuTitle} onChange={e => setMenuTitle(e.target.value)} className="w-full px-5 py-3 border border-indigo-100 rounded-2xl text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 tracking-widest">Fecha</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-indigo-100 rounded-2xl text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-indigo-700 uppercase mb-2 tracking-widest">Raciones (PAX)</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                          <input type="number" value={menuPax} onChange={e => setMenuPax(Math.max(1, Number(e.target.value)))} className="w-full pl-12 pr-4 py-3 border border-indigo-100 rounded-2xl text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-600 bg-white" />
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
                    {selectedRecipes.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl">
                         <Calendar size={64} className="mb-4 opacity-15"/>
                         <p className="font-bold uppercase tracking-widest text-[10px]">Añade platos para planificar el servicio</p>
                      </div>
                    ) : (
                      <>
                        {selectedRecipes.map((recipe, idx) => (
                            <div key={`${recipe.id}_${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group">
                               <span className="font-black text-slate-300 text-lg w-7 text-center">{idx + 1}</span>
                               <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative shrink-0">
                                  <CategoryStripe category={recipe.category} settings={settings} vertical={true} className="absolute left-0 top-0 bottom-0 w-1 z-10" />
                                  {recipe.photo && (
                                   <img 
                                     src={recipe.photo} 
                                     className={`w-full h-full object-cover ${recipe.photoLayout === 'banner' ? 'object-right' : 'object-center'}`} 
                                     alt="" 
                                   />
                                 )}
                               </div>
                               <div className="flex-grow">
                                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{recipe.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold">Escalado: {menuPax} raciones</p>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveItem(idx, 'up')} className="p-1 text-slate-300 hover:text-slate-900" disabled={idx === 0}><ArrowUp size={16}/></button>
                                    <button onClick={() => moveItem(idx, 'down')} className="p-1 text-slate-300 hover:text-slate-900" disabled={idx === selectedRecipes.length -1}><ArrowDown size={16}/></button>
                                  </div>
                                  <button onClick={() => removeFromMenu(idx)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                               </div>
                            </div>
                        ))}
                      </>
                    )}
                 </div>

                 {/* Barra de acción inferior */}
                 {selectedRecipes.length > 0 && (
                   <div className="p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coste Estimado Total</p>
                        <p className="text-2xl font-black text-indigo-600">{menuEconomics.total.toFixed(2)}€ <span className="text-xs text-slate-400 font-bold">({menuEconomics.perPax.toFixed(2)}€/PAX)</span></p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('menu_roles')}
                        className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 group"
                      >
                        <span>Siguiente: Paso 2 (Roles Menú)</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* 2. ASIGNACIÓN DE ROLES DENTRO DEL MENÚ */}
        {activeTab === 'menu_roles' && (
          <div className="p-6 max-w-5xl mx-auto animate-fadeIn space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">
                     <Layers size={16} /> Paso 2 de 5
                  </div>
                  <h2 className="text-2xl font-serif font-black text-slate-900 uppercase">Estructura del Menú: Uso de Platos</h2>
                  <p className="text-xs text-slate-500 font-medium">Asigna el puesto o función exacta de cada plato en la secuencia del menú (Aperitivo 1, Aperitivo 2, Pescado, Carne, etc.).</p>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => setActiveTab('planning')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
                     ← Volver a Selección
                  </button>
                  <button onClick={() => setActiveTab('dishes_order')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md">
                     <span>Paso 3: Pedido por Platos</span> <ArrowRight size={16} />
                  </button>
               </div>
            </div>

            {/* BARRA DE GESTIÓN Y ADICIÓN DE APARTADOS (ABIERTO A MODIFICAR O AGREGAR NUEVOS) */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <span>Apartados Disponibles del Menú</span>
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">Configuración abierta</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Si necesitas incorporar un apartado más (ej: Pan 2, Aperitivo 4, Bebida 2...), escríbelo aquí para agregarlo a la lista de opciones:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nuevo apartado (ej: Pan 2, Bebida 2)..."
                    value={newRoleInput}
                    onChange={e => setNewRoleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomRole();
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 min-w-[210px]"
                  />
                  <button
                    onClick={handleAddCustomRole}
                    disabled={!newRoleInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Añadir Apartado
                  </button>
                </div>
              </div>

              {/* Lista interactiva de apartados activos con opción de eliminación */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9px] font-black uppercase text-slate-400 mr-2">Apartados actuales:</span>
                {availableRoles.map(role => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 transition-colors"
                  >
                    <span>{role}</span>
                    {availableRoles.length > 3 && (
                      <button
                        onClick={() => handleRemoveRole(role)}
                        className="text-slate-500 hover:text-rose-400 transition-colors ml-0.5"
                        title={`Eliminar apartado ${role}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {selectedRecipes.map((recipe, idx) => (
                <div key={recipe.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4 flex-grow">
                      <span className="font-black text-slate-300 text-2xl w-8 text-center">{idx + 1}</span>
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 relative">
                         <CategoryStripe category={recipe.category} settings={settings} vertical={true} className="absolute left-0 top-0 bottom-0 w-1.5 z-10" />
                         {recipe.photo && (
                           <img 
                             src={recipe.photo} 
                             className={`w-full h-full object-cover ${recipe.photoLayout === 'banner' ? 'object-right' : 'object-center'}`} 
                             alt="" 
                           />
                         )}
                      </div>
                      <div>
                         <h4 className="font-black text-slate-900 text-base uppercase leading-tight mb-1">{recipe.name}</h4>
                         <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase">
                            <span>Categoría base: {recipe.category}</span>
                            <span>•</span>
                            <span>{recipe.subRecipes.length} elaboraciones</span>
                         </div>
                      </div>
                   </div>

                   {/* Selector de Rol */}
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rol en este Menú:</label>
                         <div className="flex items-center gap-2">
                            <select
                              value={recipeRoles[recipe.id] || ''}
                              onChange={e => setRecipeRoles({ ...recipeRoles, [recipe.id]: e.target.value })}
                              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-600 min-w-[200px]"
                            >
                               {availableRoles.map(role => (
                                 <option key={role} value={role}>{role}</option>
                               ))}
                            </select>
                            <input
                              type="text"
                              placeholder="O personaliza..."
                              value={recipeRoles[recipe.id] || ''}
                              onChange={e => setRecipeRoles({ ...recipeRoles, [recipe.id]: e.target.value })}
                              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 w-36"
                            />
                         </div>
                      </div>

                      {/* Botones de orden */}
                      <div className="flex items-center gap-1 self-end sm:self-center mt-3 sm:mt-4">
                         <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-lg text-slate-600 disabled:opacity-30">
                            <ArrowUp size={16} />
                         </button>
                         <button onClick={() => moveItem(idx, 'down')} disabled={idx === selectedRecipes.length - 1} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-lg text-slate-600 disabled:opacity-30">
                            <ArrowDown size={16} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
               <button onClick={() => setActiveTab('planning')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50">
                  ← Volver a Selección de Platos
               </button>
               <button onClick={() => setActiveTab('dishes_order')} className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all">
                  <span>Siguiente: Paso 3 (Pedido por Platos & Extras)</span> <ArrowRight size={18} />
               </button>
            </div>
          </div>
        )}

        {/* 3. PEDIDO POR PLATOS Y AJUSTES DEL PROFESOR (Revisión y Añadidos) */}
        {activeTab === 'dishes_order' && (
          <div className="p-6 max-w-6xl mx-auto animate-fadeIn space-y-6 print:p-0 print:max-w-none">
            <style>{`
              @media print {
                @page { size: portrait; margin: 0.6cm; }
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              }
            `}</style>
            
            <div className="hidden print:block mb-6">
              <PrintHeader 
                title={printFilterDishId === 'all' ? "PEDIDO DETALLADO POR PLATOS" : "PEDIDO INDIVIDUAL DE PLATO"} 
                subtitle={`SERVICIO: ${menuTitle} | VOLUMEN: ${menuPax} PAX | FECHA: ${eventDate}`} 
              />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
               <div>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">
                     <ListChecks size={16} /> Paso 3 de 5
                  </div>
                  <h2 className="text-2xl font-serif font-black text-slate-900 uppercase">Revisión de Pedido por Platos</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Examina las materias primas plato a plato para {menuPax} PAX, incorpora ingredientes extra o guarniciones y aprueba cada plato para consolidar el pedido general.
                  </p>
               </div>
               
               <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-right">
                     <p className="text-[9px] font-black uppercase text-slate-400">Progreso Aprobación:</p>
                     <p className={`text-sm font-black ${allApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {approvedCount} de {selectedRecipes.length} Aprobados
                     </p>
                  </div>
                  <button 
                    onClick={handleApproveAllDishes} 
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
                  >
                     <ShieldCheck size={16} /> Aprobar Todos
                  </button>
                  <button 
                    onClick={() => {
                      setPrintFilterDishId('all');
                      setTimeout(() => window.print(), 100);
                    }} 
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                    title="Imprimir el pedido de todos los platos"
                  >
                     <Printer size={16} /> Imprimir Todos los Platos
                  </button>
               </div>
            </div>

            {/* TARJETAS DE CADA PLATO */}
            <div className="space-y-6">
              {selectedRecipes.map((recipe, idx) => {
                const role = recipeRoles[recipe.id] || `Plato ${idx + 1}`;
                const isApproved = !!dishApprovals[recipe.id];
                const extras = dishExtraIngredients[recipe.id] || [];
                const isAddingExtra = addingExtraForRecipeId === recipe.id;

                const isHiddenInPrint = printFilterDishId !== 'all' && printFilterDishId !== recipe.id;

                return (
                  <div 
                    key={recipe.id} 
                    className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm print:border-2 print:border-slate-900 print:rounded-2xl print:break-inside-avoid print:mb-6 ${
                      isHiddenInPrint ? 'print:hidden' : ''
                    } ${isApproved ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}
                  >
                     {/* Cabecera del plato */}
                     <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isApproved ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 relative bg-white">
                              {recipe.photo && (
                                <img 
                                  src={recipe.photo} 
                                  className={`w-full h-full object-cover ${recipe.photoLayout === 'banner' ? 'object-right' : 'object-center'}`} 
                                  alt="" 
                                />
                              )}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                                    {role}
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    {recipe.yieldUnit} ({menuPax} PAX)
                                 </span>
                              </div>
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{recipe.name}</h3>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap print:hidden">
                           <button
                             type="button"
                             onClick={() => {
                               setPrintFilterDishId(recipe.id);
                               setTimeout(() => window.print(), 100);
                             }}
                             className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all shadow-xs"
                             title="Imprimir solo el pedido de este plato"
                           >
                              <Printer size={15} /> Imprimir Plato
                           </button>

                           <button
                             onClick={() => setAddingExtraForRecipeId(isAddingExtra ? null : recipe.id)}
                             className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold uppercase transition-all shadow-xs"
                           >
                              <Plus size={16} /> Añadir Ingrediente Extra
                           </button>
                           
                           <button
                             onClick={() => toggleDishApproval(recipe.id)}
                             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm ${
                               isApproved 
                                 ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                                 : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'
                             }`}
                           >
                              {isApproved ? (
                                <><Check size={16} /> Aprobado para Pedido</>
                              ) : (
                                <>Aprobar Pedido Plato</>
                              )}
                           </button>
                        </div>
                     </div>

                     {/* Formulario desplegable para añadir ingrediente extra */}
                     {isAddingExtra && (
                       <div className="p-6 bg-indigo-50/60 border-b border-indigo-100 animate-fadeIn">
                          <div className="flex justify-between items-center mb-4">
                             <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                                <Plus size={16} className="text-indigo-600" /> Incorporar Ingrediente Extra a este Plato ({role})
                             </h4>
                             <button onClick={() => setAddingExtraForRecipeId(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">Cancelar</button>
                          </div>
                          
                          {/* Sugerencias de productos */}
                          <div className="mb-4">
                             <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Buscar en el catálogo de materias primas..." 
                                  value={extraSearchTerm}
                                  onChange={e => {
                                    setExtraSearchTerm(e.target.value);
                                    setExtraForm(prev => ({ ...prev, name: e.target.value }));
                                  }}
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                />
                             </div>
                             {filteredProductsForExtra.length > 0 && (
                               <div className="mt-2 flex flex-wrap gap-2">
                                 {filteredProductsForExtra.map(p => (
                                   <button
                                     key={p.id}
                                     onClick={() => {
                                       setExtraForm({
                                         name: p.name,
                                         quantity: '1',
                                         unit: p.unit || 'g',
                                         category: p.category || 'Varios',
                                         pricePerUnit: p.pricePerUnit || 0,
                                         notes: ''
                                       });
                                       setExtraSearchTerm('');
                                     }}
                                     className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-colors"
                                   >
                                      {p.name} ({p.unit})
                                   </button>
                                 ))}
                               </div>
                             )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                             <div className="sm:col-span-2">
                                <label className="block text-[9px] font-black uppercase text-indigo-700 mb-1">Nombre Ingrediente / Materia Prima:</label>
                                <input 
                                  type="text" 
                                  placeholder="Ej: Brotes de rábano para acabado" 
                                  value={extraForm.name} 
                                  onChange={e => setExtraForm({ ...extraForm, name: e.target.value })} 
                                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none" 
                                />
                             </div>
                             <div>
                                <label className="block text-[9px] font-black uppercase text-indigo-700 mb-1">Cantidad Total ({menuPax} PAX):</label>
                                <input 
                                  type="text" 
                                  placeholder="Ej: 200" 
                                  value={extraForm.quantity} 
                                  onChange={e => setExtraForm({ ...extraForm, quantity: e.target.value })} 
                                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none" 
                                />
                             </div>
                             <div>
                                <label className="block text-[9px] font-black uppercase text-indigo-700 mb-1">Unidad:</label>
                                <select 
                                  value={extraForm.unit} 
                                  onChange={e => setExtraForm({ ...extraForm, unit: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none"
                                >
                                   {['g', 'kg', 'ml', 'l', 'ud', 'unidades', 'manojos', 'bandejas', 'hojas'].map(u => (
                                     <option key={u} value={u}>{u}</option>
                                   ))}
                                </select>
                             </div>
                             <div>
                                <label className="block text-[9px] font-black uppercase text-indigo-700 mb-1">Familia Economato (Espacio):</label>
                                <select 
                                  value={extraForm.category} 
                                  onChange={e => setExtraForm({ ...extraForm, category: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none"
                                >
                                   {ECONOMATO_FAMILIES.map(fam => (
                                     <option key={fam} value={fam}>{fam}</option>
                                   ))}
                                </select>
                             </div>
                          </div>

                          <div className="mt-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
                             <input 
                               type="text" 
                               placeholder="Notas para el plato / orden de trabajo (ej: Emplatar en pase, decorar encima)"
                               value={extraForm.notes} 
                               onChange={e => setExtraForm({ ...extraForm, notes: e.target.value })} 
                               className="w-full sm:flex-grow px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium outline-none" 
                             />
                             <button
                               onClick={() => handleAddExtraIngredient(recipe.id)}
                               disabled={!extraForm.name.trim() || !extraForm.quantity.trim()}
                               className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
                             >
                                Guardar en este Plato
                             </button>
                          </div>
                       </div>
                     )}

                     {/* Tabla de ingredientes base del plato */}
                     <div className="p-6 space-y-6">
                        {recipe.subRecipes.map((sub, sIdx) => (
                          <div key={sIdx} className="space-y-2">
                             <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[9px]">{sIdx + 1}</span>
                                {sub.name}
                             </h4>
                             <table className="w-full text-left text-xs">
                                <thead>
                                   <tr className="border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                                      <th className="py-2">Materia Prima</th>
                                      <th className="py-2 text-right">Cant. Ficha</th>
                                      <th className="py-2 text-right">Cant. Pedido ({menuPax} PAX)</th>
                                      <th className="py-2 pl-2">Unidad</th>
                                      <th className="py-2 text-right">Coste Est.</th>
                                      <th className="py-2 text-right">Alérgenos</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                   {sub.ingredients.map((ing, iIdx) => {
                                     const ingKey = `${sIdx}_${iIdx}`;
                                     const scaled = getScaledData(ing.quantity, ing.unit, recipe.yieldQuantity, ing.baseUnit, ing.name);
                                     const override = dishIngredientOverrides[recipe.id]?.[ingKey];
                                     const hasOverride = !!override;
                                     const isSubstituted = !!(override?.replacedName && override.replacedName.toLowerCase().trim() !== ing.name.toLowerCase().trim());
                                     const currentQty = hasOverride ? override.quantity : scaled.quantity;
                                     const effectiveUnit = hasOverride ? override.unit : scaled.unit;

                                     const qtyNum = parseFloat(currentQty.replace(',', '.'));
                                     const finalQty = isNaN(qtyNum) ? 0 : qtyNum;
                                     const cost = calculateIngredientCost(finalQty, effectiveUnit, ing.pricePerUnit, ing.baseUnit, ing.weightPerUnit);

                                     return (
                                       <tr key={iIdx} className={`hover:bg-slate-50/60 transition-colors ${hasOverride ? 'bg-amber-50/40' : ''}`}>
                                          <td className="py-2 font-bold text-slate-800 uppercase text-xs">
                                             <div className="flex flex-col gap-0.5">
                                               <div className="flex items-center gap-1.5 flex-wrap">
                                                 {isSubstituted ? (
                                                   <>
                                                     <span className="line-through text-slate-400 font-medium text-[10px]">{ing.name}</span>
                                                     <span className="text-amber-600 font-black">→</span>
                                                     <span className="font-black text-amber-950 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                                                       {override.replacedName}
                                                     </span>
                                                     <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[7.5px] font-black uppercase">
                                                       Sustituido
                                                     </span>
                                                   </>
                                                 ) : (
                                                   <>
                                                     <span>{ing.name}</span>
                                                     {hasOverride && (
                                                       <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[7.5px] font-black uppercase">
                                                         Ajustado
                                                       </span>
                                                     )}
                                                   </>
                                                 )}
                                                 <button
                                                   type="button"
                                                   onClick={() => setSubstitutingItem({
                                                     recipeId: recipe.id,
                                                     ingKey,
                                                     originalName: ing.name,
                                                     replacedName: override?.replacedName || ing.name,
                                                     quantity: currentQty,
                                                     unit: effectiveUnit,
                                                     notes: override?.notes || ''
                                                   })}
                                                   className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors ml-1"
                                                   title={`Sustituir o modificar "${ing.name}" por necesidades del servicio`}
                                                 >
                                                   <RefreshCw size={11} />
                                                 </button>
                                               </div>
                                               {override?.notes && (
                                                 <span className="text-[9px] text-amber-700 italic font-medium">Motivo: {override.notes}</span>
                                               )}
                                             </div>
                                          </td>
                                          <td className="py-2 text-right font-mono text-slate-400 text-xs">
                                             {scaled.quantity}
                                          </td>
                                          <td className="py-2 text-right">
                                             <div className="flex items-center justify-end gap-1">
                                                <input
                                                  type="text"
                                                  value={currentQty}
                                                  onChange={e => {
                                                    const val = e.target.value;
                                                    setDishIngredientOverrides(prev => ({
                                                      ...prev,
                                                      [recipe.id]: {
                                                        ...(prev[recipe.id] || {}),
                                                        [ingKey]: { 
                                                          ...(prev[recipe.id]?.[ingKey] || {}),
                                                          quantity: val, 
                                                          unit: effectiveUnit 
                                                        }
                                                      }
                                                    }));
                                                  }}
                                                  className={`w-20 px-2 py-1 text-right text-xs font-mono font-black rounded-lg border transition-all ${
                                                    hasOverride 
                                                      ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300/40' 
                                                      : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                                                  }`}
                                                  title={hasOverride ? `Cálculo original escalado: ${scaled.quantity}` : 'Modificar pedido preestablecido para este menú'}
                                                />
                                                {hasOverride && (
                                                  <button
                                                    onClick={() => {
                                                      setDishIngredientOverrides(prev => {
                                                        const dishObj = { ...(prev[recipe.id] || {}) };
                                                        delete dishObj[ingKey];
                                                        return { ...prev, [recipe.id]: dishObj };
                                                      });
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/50 rounded transition-colors"
                                                    title={`Restablecer al valor original de la ficha (${ing.name} - ${scaled.quantity} ${scaled.unit})`}
                                                  >
                                                     <RotateCcw size={12} />
                                                  </button>
                                                )}
                                             </div>
                                          </td>
                                          <td className="py-2 pl-2 text-[10px] font-bold text-slate-500 uppercase">{effectiveUnit}</td>
                                          <td className="py-2 text-right font-mono text-slate-500">{cost.toFixed(2)}€</td>
                                          <td className="py-2 text-right">
                                             <div className="flex justify-end gap-1">
                                                {ing.allergens?.map(a => (
                                                  <span key={a} title={a} className="text-xs">{ALLERGEN_CONFIG[a]?.icon}</span>
                                                ))}
                                             </div>
                                          </td>
                                       </tr>
                                     );
                                   })}
                                </tbody>
                             </table>
                          </div>
                        ))}

                        {/* LISTA DE INGREDIENTES EXTRAS AÑADIDOS POR EL PROFESOR */}
                        {extras.length > 0 && (
                          <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                             <div className="flex items-center gap-2 text-xs font-black text-purple-900 uppercase tracking-wider">
                                <Sparkles size={14} className="text-purple-600" />
                                Ingredientes Extras Añadidos por el Profesor para este Plato:
                             </div>
                             <div className="divide-y divide-purple-100">
                                {extras.map(extra => {
                                  const isEditingThisExtra = editingExtra?.recipeId === recipe.id && editingExtra?.extra.id === extra.id;

                                  if (isEditingThisExtra) {
                                    return (
                                      <div key={extra.id} className="py-3 bg-white p-3 rounded-xl border border-purple-300 shadow-sm space-y-3 my-1">
                                        <div className="flex justify-between items-center text-xs font-black text-purple-900 uppercase">
                                          <span>Modificar Ingrediente Extra</span>
                                          <button 
                                            onClick={() => setEditingExtra(null)}
                                            className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                          <div className="sm:col-span-2">
                                            <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Nombre:</label>
                                            <input 
                                              type="text" 
                                              value={editingExtra.extra.name}
                                              onChange={e => setEditingExtra({
                                                ...editingExtra,
                                                extra: { ...editingExtra.extra, name: e.target.value }
                                              })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Cantidad ({menuPax} PAX):</label>
                                            <input 
                                              type="text" 
                                              value={editingExtra.extra.quantity}
                                              onChange={e => setEditingExtra({
                                                ...editingExtra,
                                                extra: { ...editingExtra.extra, quantity: e.target.value }
                                              })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Unidad:</label>
                                            <select
                                              value={editingExtra.extra.unit}
                                              onChange={e => setEditingExtra({
                                                ...editingExtra,
                                                extra: { ...editingExtra.extra, unit: e.target.value }
                                              })}
                                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                            >
                                              {['g', 'kg', 'ml', 'l', 'ud', 'unidades', 'manojos', 'bandejas', 'hojas'].map(u => (
                                                <option key={u} value={u}>{u}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Familia Economato (Espacio):</label>
                                            <select
                                              value={editingExtra.extra.category || 'FRUTAS Y VERDURAS'}
                                              onChange={e => setEditingExtra({
                                                ...editingExtra,
                                                extra: { ...editingExtra.extra, category: e.target.value }
                                              })}
                                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                            >
                                              {ECONOMATO_FAMILIES.map(fam => (
                                                <option key={fam} value={fam}>{fam}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Notas / Función en el plato:</label>
                                            <input 
                                              type="text" 
                                              value={editingExtra.extra.notes || ''}
                                              placeholder="Ej: Para guarnición o pase"
                                              onChange={e => setEditingExtra({
                                                ...editingExtra,
                                                extra: { ...editingExtra.extra, notes: e.target.value }
                                              })}
                                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-600"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                          <button
                                            onClick={() => setEditingExtra(null)}
                                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            onClick={() => handleUpdateExtraIngredient(recipe.id, editingExtra.extra)}
                                            className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                                          >
                                            Guardar Cambios
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={extra.id} className="py-2 flex items-center justify-between text-xs gap-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-purple-900 uppercase">{extra.name}</span>
                                        <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                                          {extra.quantity} {extra.unit}
                                        </span>
                                        <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                          {extra.category || 'Varios'}
                                        </span>
                                        {extra.notes && (
                                          <span className="text-[10px] italic text-purple-600">({extra.notes})</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingExtra({ recipeId: recipe.id, extra: { ...extra } })}
                                          className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100/60 rounded-lg transition-colors"
                                          title="Modificar ingrediente extra"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveExtraIngredient(recipe.id, extra.id)}
                                          className="p-1.5 text-purple-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                          title="Eliminar ingrediente extra"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
               <button onClick={() => setActiveTab('menu_roles')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-50">
                  ← Paso 2: Roles de Menú
               </button>
               <button onClick={() => setActiveTab('purchase_order')} className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all">
                  <span>Siguiente: Paso 4 (Pedido General Consolidado)</span> <ArrowRight size={18} />
               </button>
            </div>
          </div>
        )}

        {/* 4. PEDIDO GENERAL CONSOLIDADO (POR FAMILIAS / ECONOMATO) */}
        {activeTab === 'purchase_order' && (
          <div className="min-h-screen bg-slate-100 print:bg-white p-4 md:p-10 animate-fadeIn">
             <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none p-8 print:p-0 rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center mb-6 print:hidden">
                   <button onClick={() => setActiveTab('dishes_order')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase text-[10px] tracking-widest">
                      <ArrowLeft size={20}/> Paso 3: Pedido por Platos
                   </button>
                   <div className="flex items-center gap-3">
                      <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest">
                         <Printer size={18}/> Imprimir Pedido Economato
                      </button>
                      <button onClick={() => setActiveTab('work_order')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-indigo-600 transition-all uppercase text-xs tracking-widest">
                         <span>Paso 5: Orden de Trabajo</span> <ArrowRight size={16} />
                      </button>
                   </div>
                </div>

                <PrintHeader 
                  title="PEDIDO GENERAL CONSOLIDADO DE MATERIAS PRIMAS" 
                  subtitle={`SERVICIO: ${menuTitle} | VOLUMEN TOTAL: ${menuPax} PAX | FECHA: ${eventDate}`} 
                />

                <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                   <div className="text-xs">
                      <p className="font-black text-slate-900 uppercase">Resumen de Compras del Servicio</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedRecipes.length} Platos planificados • Incluye recetas base y añadidos del profesor</p>
                   </div>
                   <div className="border-2 border-slate-900 px-4 py-1.5 rounded-xl text-right bg-white">
                      <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Presupuesto Estimado</p>
                      <p className="text-xl font-black text-slate-900 tracking-tighter">{menuEconomics.total.toFixed(2)}€</p>
                   </div>
                </div>

                {/* BANNER DE INGREDIENTES EXCLUIDOS (SAL, AGUA, PIMIENTA, ETC.) */}
                {ignoredPurchaseItems.length > 0 && (
                  <div className="mb-6 p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs print:hidden animate-fadeIn">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black uppercase text-slate-700 flex items-center gap-1.5 text-[11px]">
                        <Trash2 size={13} className="text-rose-500" />
                        Omitidos del Pedido ({ignoredPurchaseItems.length}):
                      </span>
                      {ignoredPurchaseItems.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-800 shadow-2xs">
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => setIgnoredPurchaseItems(prev => prev.filter(n => n !== name))}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Restaurar este ingrediente al pedido"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIgnoredPurchaseItems([])}
                      className="px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-[10px] uppercase rounded-lg transition-colors shadow-2xs"
                    >
                      Restaurar Todos
                    </button>
                  </div>
                )}

                <div className="columns-1 md:columns-2 gap-8 print:columns-2 print:gap-6 space-y-6">
                   {purchaseOrderData.map(([family, items]) => (
                     <div key={family} className="break-inside-avoid border-t-2 border-slate-900 pt-3">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em] mb-3 flex items-center justify-between">
                           <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black">{family}</span>
                           <span className="text-[9px] font-bold text-slate-400">{Object.keys(items).length} ref.</span>
                        </h3>
                        <table className="w-full text-left text-[9px]">
                           <thead className="border-b border-slate-900">
                              <tr className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                 <th className="py-1">Materia Prima</th>
                                 <th className="py-1 text-right">Cant.</th>
                                 <th className="py-1 pl-2">Unidad</th>
                                 <th className="py-1 text-right">Coste</th>
                                 <th className="py-1 w-6 text-right print:hidden"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {Object.values(items).map((item: any) => {
                                const formatted = formatBaseQuantity(item.baseQuantity, item.unit, item.name);
                                return (
                                  <tr key={item.name} className="hover:bg-slate-50/50 group">
                                     <td className="py-1.5 font-black text-slate-800 uppercase tracking-tight leading-tight">
                                        {item.name}
                                        {item.originalName && (
                                          <span className="block text-[7.5px] text-amber-700 font-bold lowercase italic">
                                            *sustituye a: {item.originalName}
                                          </span>
                                        )}
                                        {item.sourceDishes && (
                                          <span className="block text-[7px] text-slate-400 font-medium lowercase italic">
                                            destinado a: {item.sourceDishes.join(', ')}
                                          </span>
                                        )}
                                     </td>
                                     <td className="py-1.5 text-right font-mono font-black text-emerald-600">
                                        {formatted.quantity}
                                     </td>
                                     <td className="py-1.5 pl-2 font-black text-slate-400 uppercase text-[8px] tracking-widest">
                                        {formatted.unit}
                                     </td>
                                     <td className="py-1.5 text-right font-mono text-slate-400 font-bold">
                                        {item.cost.toFixed(2)}€
                                     </td>
                                     <td className="py-1.5 pl-1 text-right print:hidden">
                                        <button
                                          type="button"
                                          onClick={() => setIgnoredPurchaseItems(prev => [...prev, item.name])}
                                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-40 group-hover:opacity-100"
                                          title={`Eliminar "${item.name}" del pedido general (ej. sal, agua, pimienta no se compran)`}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                     </td>
                                  </tr>
                                );
                              })}
                           </tbody>
                        </table>
                     </div>
                   ))}
                </div>

                {/* RESUMEN DE MODIFICACIONES Y SUSTITUCIONES EN LAS FICHAS DE ESTE MENÚ */}
                {Object.keys(dishIngredientOverrides).some(rId => Object.keys(dishIngredientOverrides[rId] || {}).length > 0) && (
                  <div className="mt-8 p-5 bg-amber-50/80 border-2 border-amber-300 rounded-3xl print:border-black print:bg-white break-inside-avoid">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 print:text-black flex items-center gap-2 mb-2.5">
                      <Sparkles size={15} className="text-amber-600 print:text-black" />
                      Registro de Modificaciones y Sustituciones Realizadas para este Menú
                    </h4>
                    <div className="space-y-2 text-[10px] text-amber-900 print:text-black divide-y divide-amber-200/50 print:divide-slate-200">
                      {selectedRecipes.map(recipe => {
                        const overrides = dishIngredientOverrides[recipe.id];
                        if (!overrides || Object.keys(overrides).length === 0) return null;
                        const role = recipeRoles[recipe.id] || recipe.name;
                        return (
                          <div key={recipe.id} className="pt-2 first:pt-0">
                            <span className="font-black uppercase text-amber-950 print:text-black block mb-0.5">
                              • {recipe.name} ({role}):
                            </span>
                            <ul className="pl-4 list-disc space-y-0.5">
                              {Object.entries(overrides).map(([key, ov]) => {
                                const parts = key.split('_');
                                const origIng = recipe.subRecipes[Number(parts[0])]?.ingredients[Number(parts[1])];
                                if (!origIng) return null;
                                const isSub = ov.replacedName && ov.replacedName.toLowerCase().trim() !== origIng.name.toLowerCase().trim();
                                return (
                                  <li key={key}>
                                    {isSub ? (
                                      <span>
                                        Se ha modificado <b>{origIng.name}</b> de esta ficha por <b>{ov.replacedName}</b> ({ov.quantity} {ov.unit})
                                        {ov.notes ? ` — Motivo: ${ov.notes}` : ''}
                                      </span>
                                    ) : (
                                      <span>
                                        Ajuste de <b>{origIng.name}</b> a <b>{ov.quantity} {ov.unit}</b>
                                        {ov.notes ? ` — ${ov.notes}` : ''}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INCLUSIÓN DE INGREDIENTES EXTRA O NOTAS AL PEDIDO GENERAL */}
                <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 print:border-solid print:border-black break-inside-avoid">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 print:bg-white print:border-none print:p-0 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl print:hidden">
                          <Plus size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Incorporación de Ingrediente Extra o Nota al Pedido General
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            Añade consumibles, género de economato adicional o notas globales al pedido
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-lg print:hidden">
                        {generalExtraItems.length} añadidos
                      </span>
                    </div>

                    {/* Formulario en pantalla */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 print:hidden">
                      <div className="sm:col-span-4">
                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Ingrediente / Producto:</label>
                        <input
                          type="text"
                          placeholder="Ej: Hielo picado, Papel de horno, Servilletas..."
                          value={newGeneralItem.name}
                          onChange={e => setNewGeneralItem({ ...newGeneralItem, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Cantidad:</label>
                        <input
                          type="number"
                          step="any"
                          value={newGeneralItem.quantity}
                          onChange={e => setNewGeneralItem({ ...newGeneralItem, quantity: parseFloat(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Unidad:</label>
                        <select
                          value={newGeneralItem.unit}
                          onChange={e => setNewGeneralItem({ ...newGeneralItem, unit: e.target.value })}
                          className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          {['kg', 'g', 'l', 'ml', 'ud', 'unidades', 'paquetes', 'cajas', 'bolsas', 'latas', 'botes', 'botellas'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">Familia Economato:</label>
                        <select
                          value={newGeneralItem.family}
                          onChange={e => setNewGeneralItem({ ...newGeneralItem, family: e.target.value })}
                          className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          {ECONOMATO_FAMILIES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-9 mt-1">
                        <input
                          type="text"
                          placeholder="Nota u observación (ej: Entrega a primera hora para pase o para sala)"
                          value={newGeneralItem.notes}
                          onChange={e => setNewGeneralItem({ ...newGeneralItem, notes: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div className="sm:col-span-3 mt-1 flex items-end">
                        <button
                          type="button"
                          onClick={handleAddGeneralExtraItem}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} /> Añadir al Pedido
                        </button>
                      </div>
                    </div>

                    {/* Lista de Extras Añadidos al Pedido General */}
                    {generalExtraItems.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Elementos incorporados al pedido general ({generalExtraItems.length}):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {generalExtraItems.map(item => (
                            <div key={item.id} className="p-3 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                              <div>
                                <span className="font-black text-slate-900 uppercase text-xs block">{item.name}</span>
                                <span className="text-[10px] text-slate-500 font-bold block">
                                  {item.quantity} {item.unit} • <span className="text-indigo-600 font-black">{item.family}</span>
                                  {item.notes && <span className="italic text-slate-400 font-medium"> ({item.notes})</span>}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveGeneralExtraItem(item.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors print:hidden"
                                title="Eliminar del pedido"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] print:text-black">
                   Pedido consolidado para {menuPax} comensales. Verifique existencias en el economato antes de cursar a proveedores.
                </div>
             </div>
          </div>
        )}

        {/* 5. ORDEN DE TRABAJO DIDÁCTICA (DÍAS DE SEMANA, HORARIOS Y REPARTO A GRUPOS) */}
        {activeTab === 'work_order' && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn space-y-8">
             {/* Cabecera de control en pantalla */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                   <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">
                      <Clock size={16} /> Paso 5 de 5
                   </div>
                   <h2 className="text-2xl font-serif font-black text-slate-900 uppercase">Orden de Trabajo Didáctica</h2>
                   <p className="text-xs text-slate-500 font-medium">Configura los días y horarios de clase de la semana y reparte manualmente los platos entre las brigadas de alumnos.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                   <button 
                     onClick={() => {
                       window.print();
                     }} 
                     className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
                   >
                      <Printer size={16} /> Imprimir Orden Completa
                   </button>
                   <button 
                     onClick={() => handleSavePlan()} 
                     className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                   >
                      <Save size={14} /> Guardar
                   </button>
                </div>
             </div>

             {/* BLOQUE 1: HORARIOS Y DÍAS DE CLASE DE LA SEMANA */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:shadow-none print:border-2 print:border-black print:rounded-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                   <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">Días y Horarios de Taller de esta Semana</h3>
                   </div>
                   <button
                     onClick={() => {
                       // Save as teacher default in AppSettings
                       alert("Horario marcado para este menú. Recuerda que también puedes dejarlo fijo desde Ajustes.");
                     }}
                     className="text-[10px] font-bold text-indigo-600 hover:underline uppercase print:hidden"
                   >
                     Horario lectivo de cocina
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                   {workSchedule.map((item, idx) => {
                     const updateDay = (field: keyof WorkScheduleDay, value: any) => {
                       const next = [...workSchedule];
                       next[idx] = { ...next[idx], [field]: value };
                       setWorkSchedule(next);
                     };

                     return (
                       <div key={item.day} className={`p-3 rounded-2xl border transition-all ${item.enabled ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60 print:hidden'}`}>
                          <div className="flex items-center justify-between mb-2">
                             <label className="flex items-center gap-2 cursor-pointer font-black text-xs uppercase text-slate-800">
                                <input 
                                  type="checkbox" 
                                  checked={item.enabled} 
                                  onChange={e => updateDay('enabled', e.target.checked)} 
                                  className="rounded text-indigo-600 print:hidden" 
                                />
                                <span>{item.day}</span>
                             </label>
                             {item.enabled && (
                               <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">Taller</span>
                             )}
                          </div>
                          
                          {item.enabled ? (
                            <div className="space-y-1.5">
                               <div className="flex items-center gap-1 text-xs">
                                  <input 
                                    type="time" 
                                    value={item.startTime || '08:30'} 
                                    onChange={e => updateDay('startTime', e.target.value)} 
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-black text-slate-800 print:border-none print:p-0" 
                                  />
                                  <span className="text-slate-400 font-bold">-</span>
                                  <input 
                                    type="time" 
                                    value={item.endTime || '14:30'} 
                                    onChange={e => updateDay('endTime', e.target.value)} 
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-black text-slate-800 print:border-none print:p-0" 
                                  />
                               </div>
                               <input 
                                 type="text" 
                                 placeholder="Tarea del día (ej: Pase de Comedor)"
                                 value={item.notes || ''} 
                                 onChange={e => updateDay('notes', e.target.value)}
                                 className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium outline-none print:border-none print:p-0" 
                               />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin clase práctica</span>
                          )}
                       </div>
                     );
                   })}
                </div>
             </div>

             {/* BLOQUE 2: ACCIONES TEMPORALES Y PRE-ELABORACIONES (15 DÍAS / 2 DÍAS) */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:shadow-none print:border-2 print:border-black print:rounded-none">
                <div className="flex items-center gap-2 border-b pb-3">
                   <Layers size={18} className="text-amber-500" />
                   <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">Línea Temporal y Acciones de Producción</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black uppercase text-amber-900">Acciones a 15 Días Antes</span>
                         <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">Previo</span>
                      </div>
                      <textarea
                        rows={3}
                        value={workOrderAdvanceNotes.fifteenDaysBefore || ''}
                        onChange={e => setWorkOrderAdvanceNotes({ ...workOrderAdvanceNotes, fifteenDaysBefore: e.target.value })}
                        className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium outline-none resize-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Fondos oscuros congelados, curaciones, pedidos de género no perecedero..."
                      />
                   </div>

                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black uppercase text-blue-900">Acciones 2-3 Días Antes</span>
                         <span className="text-[9px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Mise en place</span>
                      </div>
                      <textarea
                        rows={3}
                        value={workOrderAdvanceNotes.twoDaysBefore || ''}
                        onChange={e => setWorkOrderAdvanceNotes({ ...workOrderAdvanceNotes, twoDaysBefore: e.target.value })}
                        className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium outline-none resize-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Marinados, salmueras, fondos cortos, bases de masas..."
                      />
                   </div>

                   <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black uppercase text-emerald-900">Día de Servicio / Pase</span>
                         <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">Pase Sala</span>
                      </div>
                      <textarea
                        rows={3}
                        value={workOrderAdvanceNotes.serviceDayNotes || ''}
                        onChange={e => setWorkOrderAdvanceNotes({ ...workOrderAdvanceNotes, serviceDayNotes: e.target.value })}
                        className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium outline-none resize-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Horas de montaje, briefing de sala, minutaje de entrada de platos..."
                      />
                   </div>
                </div>
             </div>

             {/* BLOQUE 3: REPARTO MANUAL DE PLATOS A GRUPOS (EL PROFESOR LO HACE ÉL MISMO) */}
             <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:shadow-none print:border-2 print:border-black print:rounded-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                   <div>
                      <div className="flex items-center gap-2">
                         <Users size={18} className="text-indigo-600" />
                         <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">Distribución Manual de Platos por Brigadas / Grupos</h3>
                      </div>
                      <p className="text-xs text-slate-400">Selecciona cuántos grupos trabajan este servicio y asigna cada plato a la brigada que consideres.</p>
                   </div>

                   {/* Selector de número de grupos */}
                   <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl print:hidden">
                      <span className="text-xs font-bold text-slate-600 pl-2">Cantidad de Grupos:</span>
                      <div className="flex gap-1">
                         {[1, 2, 3, 4, 5, 6, 8].map(n => (
                           <button
                             key={n}
                             onClick={() => setGroupCount(n)}
                             className={`w-8 h-8 rounded-xl font-black text-xs transition-all ${
                               groupCount === n 
                                 ? 'bg-indigo-600 text-white shadow-md' 
                                 : 'bg-white text-slate-700 hover:bg-slate-200'
                             }`}
                           >
                              {n}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Filtro de impresión por grupo */}
                <div className="flex items-center gap-2 print:hidden pb-2">
                   <span className="text-xs font-bold text-slate-400">Ver / Imprimir hoja de:</span>
                   <button
                     onClick={() => setFilterPrintGroup('ALL')}
                     className={`px-3 py-1 rounded-lg text-xs font-bold ${filterPrintGroup === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                   >
                      Todos los Grupos
                   </button>
                   {Array.from({ length: groupCount }, (_, i) => i + 1).map(g => (
                     <button
                       key={g}
                       onClick={() => setFilterPrintGroup(g)}
                       className={`px-3 py-1 rounded-lg text-xs font-bold ${filterPrintGroup === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                     >
                        Grupo {g}
                     </button>
                   ))}
                </div>

                {/* Asignación plato a plato */}
                <div className="space-y-4">
                   {selectedRecipes.map((recipe, idx) => {
                     const role = recipeRoles[recipe.id] || `Plato ${idx + 1}`;
                     const currentGroup = dishGroupAssignments[recipe.id] || ((idx % groupCount) + 1);
                     const extras = dishExtraIngredients[recipe.id] || [];

                     // Filter if viewing a specific group
                     if (filterPrintGroup !== 'ALL' && currentGroup !== filterPrintGroup) {
                       return null;
                     }

                     return (
                       <div key={recipe.id} className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-grow">
                             <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-200 relative">
                                {recipe.photo && (
                                  <img 
                                    src={recipe.photo} 
                                    className={`w-full h-full object-cover ${recipe.photoLayout === 'banner' ? 'object-right' : 'object-center'}`} 
                                    alt="" 
                                  />
                                )}
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                   <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-wider">
                                      {role}
                                   </span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase">
                                      {menuPax} PAX
                                   </span>
                                   {extras.length > 0 && (
                                     <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[8px] font-black uppercase">
                                        +{extras.length} ingrediente(s) extra
                                     </span>
                                   )}
                                </div>
                                <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">{recipe.name}</h4>
                                <p className="text-[10px] text-slate-500 italic mt-0.5">
                                   Elaboraciones: {recipe.subRecipes.map(s => s.name).join(', ')}
                                </p>
                             </div>
                          </div>

                          {/* Selector de Grupo */}
                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Asignado a:</span>
                                <select
                                  value={currentGroup}
                                  onChange={e => setDishGroupAssignments({
                                    ...dishGroupAssignments,
                                    [recipe.id]: Number(e.target.value)
                                  })}
                                  className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-900 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                                >
                                   {Array.from({ length: groupCount }, (_, i) => i + 1).map(g => (
                                     <option key={g} value={g}>GRUPO {g}</option>
                                   ))}
                                </select>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>

                {/* NOTAS Y COMPONENTES POR CADA GRUPO */}
                <div className="mt-8 border-t pt-6 space-y-4">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ListChecks size={16} className="text-indigo-600" /> Hoja de Tareas por Brigada / Grupo
                   </h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: groupCount }, (_, i) => i + 1).map(g => {
                        const assignedToThisGroup = selectedRecipes.filter(r => (dishGroupAssignments[r.id] || ((selectedRecipes.indexOf(r) % groupCount) + 1)) === g);

                        if (filterPrintGroup !== 'ALL' && filterPrintGroup !== g) return null;

                        return (
                          <div key={g} className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3 break-inside-avoid shadow-xs">
                             <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-xs font-black uppercase text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                   BRIGADA / GRUPO {g}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{assignedToThisGroup.length} Plato(s)</span>
                             </div>

                             <div className="space-y-1.5">
                                {assignedToThisGroup.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">Sin platos asignados a este grupo.</p>
                                ) : (
                                  assignedToThisGroup.map(r => (
                                    <div key={r.id} className="text-xs">
                                       <span className="font-bold text-slate-900 uppercase">• {r.name}</span>
                                       <span className="text-[10px] text-slate-500 block pl-3">
                                          Puesto: {recipeRoles[r.id] || 'Plato'} • {r.subRecipes.length} elaboración(es)
                                          {dishExtraIngredients[r.id] && dishExtraIngredients[r.id].length > 0 && (
                                            <span className="text-purple-700 font-bold"> (Con extras de profesor)</span>
                                          )}
                                       </span>
                                    </div>
                                  ))
                                )}
                             </div>

                             <div className="pt-2">
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Instrucciones o Alumnos asignados:</label>
                                <textarea
                                  rows={2}
                                  placeholder="Ej: Alumnos: Carlos, Marta. Encargados de partidas frías y pase."
                                  value={groupNotes[g] || ''}
                                  onChange={e => setGroupNotes({ ...groupNotes, [g]: e.target.value })}
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:bg-white"
                                />
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* FICHAS COCINA, ORDEN SERVICIO, MATRIZ Y HISTÓRICO SE MANTIENEN Y COMPLEMENTAN */}
        {activeTab === 'kitchen_fichas' && (
          <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page { margin: 10mm 10mm 20mm 10mm; }
                .print-footer {
                  position: fixed;
                  bottom: -15mm;
                  left: 0;
                  right: 0;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 7px;
                  color: #94a3b8;
                  text-transform: uppercase;
                  font-weight: 900;
                  letter-spacing: 0.2em;
                  background: transparent;
                }
                .page-number:after { content: "PÁG. " counter(page); }
                .no-break { break-inside: avoid; }
              }
            `}} />
            <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center no-print">
              <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold uppercase text-[10px] tracking-widest">
                <ArrowLeft size={20} />
                <span>Volver</span>
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-lg font-black uppercase text-xs tracking-widest">
                <Printer size={20} />
                <span>Imprimir Fichas Escaladas</span>
              </button>
            </div>

            {selectedRecipes.map((recipe, rIdx) => {
              const allergens = getRecipeAllergens(recipe);
              const paxRatio = menuPax / recipe.yieldQuantity;
              const costPerPortion = recipe.totalCost && recipe.yieldQuantity ? ((recipe.totalCost / recipe.yieldQuantity) * paxRatio) : 0;
              const role = recipeRoles[recipe.id] || recipe.category;

              return (
                <div key={recipe.id} className="bg-white shadow-2xl print:shadow-none mb-10 overflow-hidden rounded-3xl print:rounded-none page-break border border-slate-200 print:border-none max-w-[210mm] mx-auto">
                   <div className="p-10 border-b-2 border-slate-900">
                      <div className="flex justify-between items-start">
                         <div>
                            <div className="relative w-fit mb-3">
                               <CategoryStripe category={recipe.category} settings={settings} className="absolute inset-0 rounded opacity-20" />
                               <p className="relative text-slate-700 font-black uppercase tracking-[0.2em] text-[10px] px-2 py-0.5">{role} • {recipe.category}</p>
                            </div>
                            <h2 className="text-4xl font-serif font-black uppercase leading-none tracking-tighter text-slate-900">{recipe.name}</h2>
                            <div className="flex items-center gap-4 mt-4">
                               <p className="text-slate-400 text-xs uppercase font-black tracking-widest">VOLUMEN DE PASE: {menuPax} {recipe.yieldUnit}</p>
                               <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-900">
                                  <span className="text-slate-900 font-black text-xs uppercase">Coste/Ración: {costPerPortion.toFixed(2).replace('.', ',')}€</span>
                                </div>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end">
                            <div className="border-2 border-slate-900 p-2 rounded-xl mb-3"><Utensils size={32} className="text-slate-900"/></div>
                            <p className="text-3xl font-black text-slate-900">{menuPax} PAX</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-10 space-y-12">
                      {/* FORMATO PANORÁMICO SUPERIOR (Para recetas con layout 'banner') */}
                      {recipe.photo && recipe.photoLayout === 'banner' && (
                        <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-900 bg-white shadow-md print:shadow-none print:border-black break-inside-avoid flex justify-center items-center">
                           <img 
                             src={recipe.photo} 
                             alt={recipe.name} 
                             className="w-full h-auto object-contain max-h-[380px] print:max-h-[320px] mx-auto block" 
                           />
                        </div>
                      )}

                      {/* FORMATO CLÁSICO LATERAL O CONTROL DE ALÉRGENOS COMPLETO */}
                      {recipe.photoLayout === 'banner' ? (
                         <div className="w-full bg-white rounded-xl px-4 py-2.5 border border-slate-900 break-inside-avoid shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                               <div className="flex items-center gap-2">
                                  <AlertOctagon size={13} className="text-amber-500" />
                                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Control de Alérgenos</span>
                               </div>
                               {allergens.length > 0 ? (
                                 <span className="text-[8px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tracking-wider">
                                   Contiene ({allergens.length}): {allergens.join(', ')}
                                 </span>
                               ) : (
                                 <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                   Sin alérgenos declarados
                                 </span>
                               )}
                            </div>
                            <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 items-start text-center">
                               {ALLERGEN_LIST.map(allergen => {
                                 const isPresent = allergens.includes(allergen);
                                 return (
                                   <div key={allergen} className={`transition-opacity flex flex-col items-center ${isPresent ? 'opacity-100 font-black' : 'opacity-15'}`}>
                                      <span className="text-base leading-none">{ALLERGEN_CONFIG[allergen].icon}</span>
                                      <span className="text-[6px] font-black uppercase text-slate-700 text-center leading-tight mt-1 truncate max-w-full">{allergen}</span>
                                   </div>
                                 );
                               })}
                            </div>
                         </div>
                      ) : (
                         <div className="flex gap-4 items-stretch break-inside-avoid">
                            {recipe.photo && (
                              <div className="w-1/4 aspect-[4/3] rounded-xl overflow-hidden border border-slate-900 shrink-0">
                                 <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover object-right" />
                              </div>
                            )}
                            
                            <div className="flex-grow bg-white rounded-xl p-3 border border-slate-900">
                               <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
                                  <div className="flex items-center gap-1.5">
                                     <AlertOctagon size={12} className="text-amber-500" />
                                     <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Control de Alérgenos</span>
                                  </div>
                                  {allergens.length > 0 ? (
                                    <span className="text-[7px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                      {allergens.length} presente{allergens.length > 1 ? 's' : ''}
                                    </span>
                                  ) : (
                                    <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                      0 declarados
                                    </span>
                                  )}
                               </div>
                               <div className="grid grid-cols-7 gap-y-2.5 gap-x-1">
                                  {ALLERGEN_LIST.map(allergen => {
                                    const isPresent = allergens.includes(allergen);
                                    return (
                                      <div key={allergen} className={`transition-opacity flex flex-col items-center gap-1 ${isPresent ? 'opacity-100' : 'opacity-15'}`}>
                                         <span className="text-base leading-none">{ALLERGEN_CONFIG[allergen].icon}</span>
                                         <span className="text-[6px] font-black uppercase text-slate-600 text-center leading-none">{allergen}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                         </div>
                      )}

                      {/* Banner de Modificaciones / Sustituciones de Servicio en esta Ficha */}
                      {Object.keys(dishIngredientOverrides[recipe.id] || {}).length > 0 && (
                        <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 text-xs break-inside-avoid">
                           <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-amber-900 tracking-wider">
                              <AlertOctagon size={13} className="text-amber-600" />
                              Modificaciones de Servicio para este Menú ({menuPax} PAX):
                           </div>
                           <ul className="mt-1 space-y-0.5 text-[10px] pl-4 list-disc font-medium">
                              {Object.entries(dishIngredientOverrides[recipe.id] || {}).map(([key, ov]) => {
                                const parts = key.split('_');
                                const origIng = recipe.subRecipes[Number(parts[0])]?.ingredients[Number(parts[1])];
                                if (!origIng) return null;
                                const isSub = ov.replacedName && ov.replacedName.toLowerCase().trim() !== origIng.name.toLowerCase().trim();
                                return (
                                  <li key={key}>
                                    {isSub ? (
                                      <span>Se ha modificado <b>{origIng.name}</b> por <b>{ov.replacedName}</b> ({ov.quantity} {ov.unit}){ov.notes ? ` — Motivo: ${ov.notes}` : ''}</span>
                                    ) : (
                                      <span>Ajuste de <b>{origIng.name}</b> a <b>{ov.quantity} {ov.unit}</b>{ov.notes ? ` — ${ov.notes}` : ''}</span>
                                    )}
                                  </li>
                                );
                              })}
                           </ul>
                        </div>
                      )}

                      {recipe.subRecipes.map((sub, sIdx) => (
                        <div key={sIdx} className="no-break space-y-3 border-b border-slate-200 pb-6 last:border-0">
                           <div className="flex items-center gap-2">
                              <span className="border border-slate-900 text-slate-900 w-5 h-5 flex items-center justify-center rounded font-black text-[10px]">{sIdx + 1}</span>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{sub.name}</h4>
                           </div>

                           <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-4 space-y-2">
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-0.5">Ingredientes / Escandallo</p>
                                 <table className="w-full text-[10px] text-slate-700 ingredients-table">
                                   <tbody className="divide-y divide-slate-50">
                                      {sub.ingredients.map((ing, iIdx) => {
                                        const ingKey = `${sIdx}_${iIdx}`;
                                        const override = dishIngredientOverrides[recipe.id]?.[ingKey];
                                        const scaled = getScaledData(ing.quantity, ing.unit, recipe.yieldQuantity, ing.baseUnit, ing.name);
                                        const displayName = override?.replacedName || ing.name;
                                        const isSubstituted = !!(override?.replacedName && override.replacedName.toLowerCase().trim() !== ing.name.toLowerCase().trim());
                                        const displayQty = override ? override.quantity : scaled.quantity;
                                        const displayUnit = override ? override.unit : scaled.unit;

                                        return (
                                          <tr key={iIdx}>
                                             <td className="py-1 font-bold uppercase tracking-tight leading-tight">
                                                <span>{displayName}</span>
                                                {ing.notes && (
                                                  <span className="block text-[7px] text-amber-800 font-medium normal-case italic">
                                                    ({ing.notes})
                                                  </span>
                                                )}
                                                {isSubstituted && (
                                                  <span className="block text-[7px] text-amber-800 font-bold italic">
                                                    *sustituye a {ing.name} para este servicio
                                                  </span>
                                                )}
                                             </td>
                                             <td className="py-1 text-right font-black text-slate-900 whitespace-nowrap">{displayQty}</td>
                                             <td className="py-1 pl-1 text-slate-400 font-bold uppercase text-[7px] text-right">{displayUnit}</td>
                                          </tr>
                                        );
                                      })}
                                   </tbody>
                                 </table>
                              </div>

                              <div className="col-span-8 space-y-2">
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-0.5">Técnica y Ejecución</p>
                                 <div className="space-y-3">
                                    <div className="text-[10px] text-slate-600 leading-snug text-justify whitespace-pre-wrap font-serif italic">
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

                      {/* Ingredientes extras añadidos por profesor */}
                      {dishExtraIngredients[recipe.id] && dishExtraIngredients[recipe.id].length > 0 && (
                        <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-300">
                           <h4 className="text-[10px] font-black uppercase text-purple-900 mb-2">Ingredientes Extras Asignados por el Profesor:</h4>
                           <div className="grid grid-cols-2 gap-2 text-[10px]">
                              {dishExtraIngredients[recipe.id].map(extra => (
                                <div key={extra.id} className="font-bold text-purple-900">
                                   • {extra.name}: <span className="font-mono">{extra.quantity} {extra.unit}</span> {extra.notes && <span className="italic text-purple-600">({extra.notes})</span>}
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* CHECKLIST DE CONTROL PARA EL JEFE DE COCINA / PROFESOR RESPONSABLE */}
                      <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-900 break-inside-avoid space-y-4">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                               <div className="p-2 bg-slate-900 text-white rounded-lg">
                                  <ClipboardCheck size={18} />
                               </div>
                               <div>
                                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                     Checklist de Control del Jefe de Cocina / Profesor
                                  </h4>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                                     Verificación obligatoria previa al pase del plato: {recipe.name} ({role})
                                  </p>
                               </div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
                               Fase de Control y Calidad
                            </span>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {CHEF_CHECKLIST_ITEMS.map(item => {
                               const isChecked = !!kitchenChecklist[recipe.id]?.[item.id];
                               return (
                                 <div 
                                   key={item.id} 
                                   className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-slate-200 select-none"
                                   onClick={() => {
                                     setKitchenChecklist(prev => ({
                                       ...prev,
                                       [recipe.id]: {
                                         ...(prev[recipe.id] || {}),
                                         [item.id]: !isChecked
                                       }
                                     }));
                                   }}
                                 >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                      isChecked 
                                        ? 'bg-slate-900 border-slate-900 text-white' 
                                        : 'border-slate-400 bg-white'
                                    }`}>
                                       {isChecked && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <span className={`text-[10px] leading-tight font-bold uppercase ${
                                      isChecked ? 'text-slate-900 line-through opacity-80' : 'text-slate-700'
                                    }`}>
                                       {item.label}
                                    </span>
                                 </div>
                               );
                            })}
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-[9px] font-bold uppercase text-slate-600">
                            <div className="border border-dashed border-slate-300 p-2 rounded-lg">
                               <span className="text-[8px] text-slate-400 block mb-3 font-black">Visto Bueno / Firma Jefe Cocina:</span>
                               <span className="text-slate-300 italic font-mono">____________________</span>
                            </div>
                            <div className="border border-dashed border-slate-300 p-2 rounded-lg">
                               <span className="text-[8px] text-slate-400 block mb-3 font-black">Firma Profesor Responsable:</span>
                               <span className="text-slate-300 italic font-mono">____________________</span>
                            </div>
                            <div className="border border-dashed border-slate-300 p-2 rounded-lg flex flex-col justify-between">
                               <span className="text-[8px] text-slate-400 block font-black">Hora Pase Verificada:</span>
                               <span className="text-slate-700 font-mono font-black text-xs">___ : ___ h</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ORDEN DE SERVICIO DE SALA */}
        {activeTab === 'service_order' && (
          <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
             <style>{`@media print { @page { size: landscape; margin: 0.5cm; } }`}</style>
             <div className="max-w-[297mm] mx-auto bg-white shadow-2xl print:shadow-none p-6 print:p-0 rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center mb-6 print:hidden">
                   <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase text-[10px] tracking-widest"><ArrowLeft size={20}/> Volver</button>
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={handleSyncServiceDetailsFromRecipes}
                       className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all uppercase text-xs tracking-wider"
                       title="Cargar automáticamente el Marcaje/Cubertería, Presentación y Temperaturas desde las Fichas Técnicas originales"
                     >
                        <RefreshCw size={15} /> Sincronizar Marcaje de Fichas
                     </button>
                     <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black shadow-lg hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"><Printer size={18}/> Imprimir Orden Sala</button>
                   </div>
                </div>

                <PrintHeader title="ORDEN DE SERVICIO EN SALA" subtitle={`EVENTO: ${menuTitle} | FECHA: ${eventDate}`} />

                <div className="overflow-x-auto border-2 border-slate-900 rounded-xl mt-8">
                   <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-slate-100 border-b-2 border-slate-900">
                         <tr className="text-[9px] font-black uppercase text-slate-700 tracking-widest text-center">
                            <th className="p-3 border-r border-slate-300 w-[15%]">Plato / Puesto</th>
                            <th className="p-3 border-r border-slate-300 w-[15%]">Presentación</th>
                            <th className="p-3 border-r border-slate-300 w-[5%]">Caliente</th>
                            <th className="p-3 border-r border-slate-300 w-[5%]">Frío</th>
                            <th className="p-3 border-r border-slate-300 w-[13%]">Marcaje (Ficha Técnica)</th>
                            <th className="p-3 border-r border-slate-300 w-[14%]">Tipo Servicio</th>
                            <th className="p-3 border-r border-slate-300 w-[23%]">Descripción Sala</th>
                            <th className="p-3 w-[10%]">Pase</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                         {selectedRecipes.map((recipe, idx) => {
                            const temp = (recipe.serviceDetails?.servingTemp || '').toLowerCase();
                            const isCold = temp.includes('frio') || temp.includes('frío') || temp.includes('fria') || temp.includes('helado');
                            const isHot = temp.includes('caliente') || temp.includes('tibio') || temp.includes('templado') || (!isCold && temp.length > 0);
                            const role = recipeRoles[recipe.id] || `Paso ${idx + 1}`;
                            
                            return (
                              <tr key={`${recipe.id}_${idx}`} className="hover:bg-slate-50 break-inside-avoid">
                                 <td className="p-3 border-r border-slate-300 font-black text-slate-900 uppercase text-[10px] leading-tight align-top">
                                    <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded mr-1">{role}</span>
                                    {recipe.name}
                                 </td>
                                 
                                 {/* Presentación */}
                                 <td className="p-0 border-r border-slate-300 align-top">
                                    <div className="print:hidden">
                                       <textarea 
                                         value={recipe.serviceDetails?.presentation || ''} 
                                         onChange={e => updateServiceOrder(idx, 'presentation', e.target.value)} 
                                         className="w-full min-h-[65px] p-2.5 bg-transparent border-none resize-y focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-[10px]" 
                                         placeholder="Presentación y emplatado..." 
                                       />
                                    </div>
                                    <div className="hidden print:block p-2 text-[9px] font-medium leading-relaxed text-black whitespace-pre-wrap break-words">
                                       {recipe.serviceDetails?.presentation || '-'}
                                    </div>
                                 </td>

                                 <td className="p-0 border-r border-slate-300 text-center font-bold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors align-middle" onClick={() => updateServiceOrder(idx, 'servingTemp', 'Caliente')}>
                                    {isHot ? (temp.length > 15 ? recipe.serviceDetails?.servingTemp : '✓') : ''}
                                 </td>
                                 <td className="p-0 border-r border-slate-300 text-center font-bold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors align-middle" onClick={() => updateServiceOrder(idx, 'servingTemp', 'Frío')}>
                                    {isCold ? (temp.length > 15 ? recipe.serviceDetails?.servingTemp : '✓') : ''}
                                 </td>

                                 {/* Marcaje y Cubertería (traído de la ficha técnica) */}
                                 <td className="p-0 border-r border-slate-300 align-top">
                                    <div className="print:hidden">
                                       <textarea 
                                         value={recipe.serviceDetails?.cutlery || ''} 
                                         onChange={e => updateServiceOrder(idx, 'cutlery', e.target.value)} 
                                         className="w-full min-h-[65px] p-2.5 bg-transparent border-none resize-y focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-bold text-[10px]" 
                                         placeholder="Cubertería y marcaje..." 
                                       />
                                    </div>
                                    <div className="hidden print:block p-2 text-[9px] font-bold leading-relaxed text-black whitespace-pre-wrap break-words">
                                       {recipe.serviceDetails?.cutlery || '-'}
                                    </div>
                                 </td>

                                 {/* Tipo Servicio */}
                                 <td className="p-0 border-r border-slate-300 align-top">
                                    <div className="print:hidden">
                                       <textarea 
                                         value={recipe.serviceDetails?.serviceType || ''} 
                                         onChange={e => updateServiceOrder(idx, 'serviceType', e.target.value)} 
                                         className="w-full min-h-[65px] p-2.5 bg-transparent border-none resize-y focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-[10px]" 
                                         placeholder="Tipo de servicio..." 
                                       />
                                    </div>
                                    <div className="hidden print:block p-2 text-[9px] font-medium leading-relaxed text-black whitespace-pre-wrap break-words">
                                       {recipe.serviceDetails?.serviceType || '-'}
                                    </div>
                                 </td>

                                 {/* Descripción Sala */}
                                 <td className="p-0 border-r border-slate-300 align-top">
                                    <div className="print:hidden">
                                       <textarea 
                                         value={recipe.serviceDetails?.clientDescription || ''} 
                                         onChange={e => updateServiceOrder(idx, 'clientDescription', e.target.value)} 
                                         className="w-full min-h-[65px] p-2.5 bg-transparent border-none resize-y focus:ring-1 focus:ring-slate-900 outline-none text-slate-800 text-[10px] italic leading-tight" 
                                         placeholder="Explicación para el comensal..." 
                                       />
                                    </div>
                                    <div className="hidden print:block p-2 text-[9px] italic font-medium leading-relaxed text-black whitespace-pre-wrap break-words">
                                       {recipe.serviceDetails?.clientDescription || '-'}
                                    </div>
                                 </td>

                                 {/* Pase */}
                                 <td className="p-0 align-top">
                                    <div className="print:hidden">
                                       <input 
                                         type="text" 
                                         value={recipe.serviceDetails?.passTime || ''} 
                                         onChange={e => updateServiceOrder(idx, 'passTime', e.target.value)} 
                                         className="w-full p-2.5 bg-transparent border-none text-center font-black text-slate-900 uppercase focus:ring-1 focus:ring-slate-900 outline-none text-xs" 
                                         placeholder="Hora" 
                                       />
                                    </div>
                                    <div className="hidden print:block p-2 text-center font-black text-black text-[9px]">
                                       {recipe.serviceDetails?.passTime || '-'}
                                    </div>
                                 </td>
                              </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* MATRIZ DE ALÉRGENOS */}
        {activeTab === 'allergen_matrix' && (
          <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10">
             <style>{`
               @media print { 
                 @page { size: landscape; margin: 0.6cm; } 
                 body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
               }
             `}</style>
             <div className="max-w-[297mm] mx-auto bg-white shadow-2xl print:shadow-none p-12 print:p-0 rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center mb-8 print:hidden">
                   <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 uppercase text-[10px] tracking-widest"><ArrowLeft size={20}/> Volver</button>
                   <button onClick={() => window.print()} className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all uppercase text-xs tracking-widest"><Printer size={20}/> Imprimir Matriz</button>
                </div>

                <PrintHeader title="DECLARACIÓN DE ALÉRGENOS POR SERVICIO" subtitle={`SERVICIO: ${menuTitle} | FECHA: ${eventDate} | VOLUMEN: ${menuPax} PAX`} />

                <div className="overflow-x-auto border border-slate-900 rounded-lg">
                   <table className="w-full border-collapse border-hidden text-[9px] table-fixed">
                      <thead>
                         <tr className="bg-slate-50">
                            <th className="border border-slate-900 p-4 text-left uppercase font-black text-slate-900 w-1/4 text-sm tracking-tighter">Relación de Platos</th>
                            {ALLERGEN_LIST.map(allergen => (
                              <th key={allergen} className="border border-slate-900 p-1 text-center font-black uppercase text-[8px]">
                                 <div className="flex flex-col items-center justify-end h-36 pb-3">
                                    <span className="text-xl mb-3">{ALLERGEN_CONFIG[allergen].icon}</span>
                                    <span className="[writing-mode:vertical-lr] rotate-180 transform font-black tracking-tighter text-slate-800">
                                       {allergen.toUpperCase()}
                                    </span>
                                 </div>
                              </th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {selectedRecipes.map((recipe, idx) => {
                           const allergens = getRecipeAllergens(recipe);
                           return (
                             <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="border border-slate-900 p-4 font-black uppercase text-slate-800 leading-tight text-xs tracking-tight bg-slate-50/30">
                                   <span className="text-[8px] text-slate-400 block">{recipeRoles[recipe.id] || `Paso ${idx+1}`}</span>
                                   {recipe.name}
                                </td>
                                {ALLERGEN_LIST.map(allergen => {
                                  const hasAllergen = allergens.includes(allergen);
                                  return (
                                    <td key={allergen} className={`border border-slate-900 p-1 text-center ${hasAllergen ? 'bg-rose-50' : ''}`}>
                                       {hasAllergen && <span className="text-xl font-black text-rose-600">X</span>}
                                    </td>
                                  );
                                })}
                             </tr>
                           );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* DOCUMENTO REG-08-02: DECLARACIÓN DE INGREDIENTES Y ALÉRGENOS */}
        {activeTab === 'declaration_doc' && (
          <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-10 animate-fadeIn">
             <style>{`
               @media print { 
                 @page { size: portrait; margin: 0.6cm; } 
                 body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                 .page-break { page-break-after: always; }
               }
             `}</style>
             <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none p-10 print:p-0 rounded-3xl overflow-hidden text-slate-900">
                {/* Controles de pantalla */}
                <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
                   <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 uppercase text-[10px] tracking-widest">
                     <ArrowLeft size={20}/> Volver a Menú
                   </button>
                   <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                       Modelo Oficial Sanidad / Hostelería
                     </span>
                     <button onClick={() => window.print()} className="flex items-center gap-2 bg-rose-700 text-white px-7 py-3 rounded-2xl font-black shadow-lg hover:bg-rose-800 transition-all uppercase text-xs tracking-widest">
                       <Printer size={18}/> Imprimir REG-08-02
                     </button>
                   </div>
                </div>

                {/* Cabecera Oficial del Registro */}
                <div className="border-2 border-slate-900 mb-6">
                   <div className="grid grid-cols-12 divide-x-2 divide-slate-900 items-stretch">
                      {/* Logo / Institución */}
                      <div className="col-span-3 p-3 flex flex-col justify-center items-center text-center bg-slate-50">
                         {settings.instituteLogo ? (
                           <img src={settings.instituteLogo} className="h-14 object-contain max-w-full" alt="IES" />
                         ) : (
                           <span className="font-black text-xs text-slate-900 leading-tight uppercase tracking-tight">{settings.instituteName}</span>
                         )}
                         <span className="text-[7.5px] font-bold text-slate-500 mt-1 uppercase">Dpto. Hostelería y Turismo</span>
                      </div>

                      {/* Título Principal y Subtítulo */}
                      <div className="col-span-6 p-3 flex flex-col justify-center items-center text-center">
                         <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">SISTEMA DE AUTOCONTROL (APPCC)</h2>
                         <h1 className="text-base font-serif font-black uppercase tracking-tight text-slate-950 mt-0.5">DECLARACIÓN DE INGREDIENTES Y ALÉRGENOS</h1>
                         <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">Información Alimentaria al Consumidor (Reglamento UE 1169/2011)</p>
                      </div>

                      {/* Código de Registro y Revisión */}
                      <div className="col-span-3 p-2.5 text-[8.5px] font-mono flex flex-col justify-center divide-y divide-slate-300 bg-slate-50">
                         <div className="pb-1 font-bold text-slate-800"><span className="text-slate-400">REGISTRO:</span> <strong className="text-rose-700 font-black">REG-08-02</strong></div>
                         <div className="py-1 font-bold text-slate-800"><span className="text-slate-400">VERSIÓN:</span> 1.0</div>
                         <div className="pt-1 font-bold text-slate-800"><span className="text-slate-400">FECHA:</span> {eventDate}</div>
                      </div>
                   </div>

                   {/* Metadatos del Servicio / Menú */}
                   <div className="border-t-2 border-slate-900 bg-slate-100/70 p-2.5 grid grid-cols-3 gap-2 text-[9px] uppercase font-bold">
                      <div><span className="text-slate-500">Servicio / Menú:</span> <span className="font-black text-slate-900">{menuTitle}</span></div>
                      <div><span className="text-slate-500">Volumen Previsto:</span> <span className="font-black text-slate-900">{menuPax} PAX</span></div>
                      <div><span className="text-slate-500">Responsable / Profesor:</span> <span className="font-black text-slate-900">{appUser?.teacherName || appUser?.displayName || 'Dpto. Cocina'}</span></div>
                   </div>
                </div>

                {/* Leyenda de Alérgenos Declarados */}
                <div className="mb-4 border border-slate-300 bg-slate-50/60 p-2 rounded-lg text-[8px] leading-tight">
                   <span className="font-black uppercase text-slate-700 mr-1.5">Alérgenos de declaración obligatoria:</span>
                   <span className="text-slate-600">
                     1. Gluten, 2. Crustáceos, 3. Huevos, 4. Pescado, 5. Cacahuetes, 6. Soja, 7. Lácteos, 8. Frutos de cáscara, 9. Apio, 10. Mostaza, 11. Sésamo, 12. Sulfitos, 13. Altramuces, 14. Moluscos.
                   </span>
                </div>

                {/* Tabla de Fichas / Platos */}
                <div className="border-2 border-slate-900">
                   <table className="w-full border-collapse text-[9.5px]">
                      <thead>
                         <tr className="bg-slate-200 border-b-2 border-slate-900 text-slate-900 uppercase font-black tracking-wider text-[8.5px]">
                            <th className="p-2 border-r border-slate-900 w-12 text-center">Nº</th>
                            <th className="p-2 border-r border-slate-900 w-1/4 text-left">Denominación del Plato / Elaboración</th>
                            <th className="p-2 border-r border-slate-900 w-5/12 text-left">Lista Completa de Ingredientes y Materias Primas</th>
                            <th className="p-2 text-left w-1/3">Alérgenos Presentes (Declarados)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y border-slate-900">
                         {selectedRecipes.map((recipe, idx) => {
                            const allergens = getRecipeAllergens(recipe);
                            const role = recipeRoles[recipe.id] || `Paso ${idx + 1}`;
                            
                            // Lista de ingredientes base + extras del plato
                            const baseIngs = (recipe.subRecipes || []).flatMap(s => (s.ingredients || []).map(i => i.name.trim())).filter(Boolean);
                            const extraIngs = (dishExtraIngredients[recipe.id] || []).map(e => e.name.trim()).filter(Boolean);
                            const allIngredients = Array.from(new Set([...baseIngs, ...extraIngs]));

                            return (
                               <tr key={recipe.id} className="divide-x border-slate-900 hover:bg-slate-50/60 break-inside-avoid">
                                  <td className="p-2.5 text-center font-black font-mono bg-slate-50/50 align-top">
                                     {idx + 1}
                                  </td>
                                  <td className="p-2.5 align-top">
                                     <span className="block text-[7.5px] font-black uppercase text-rose-700 tracking-wider mb-0.5">
                                       {role}
                                     </span>
                                     <h3 className="font-black uppercase text-slate-950 text-[11px] leading-tight tracking-tight">
                                       {recipe.name}
                                     </h3>
                                     {recipe.category && (
                                       <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                                         Categoría: {recipe.category}
                                       </span>
                                     )}
                                  </td>
                                  <td className="p-2.5 align-top">
                                     <p className="text-slate-800 leading-snug font-medium text-[9px] uppercase">
                                       {allIngredients.length > 0 ? allIngredients.join(', ') : 'Ingredientes según ficha técnica de cocina'}
                                     </p>
                                  </td>
                                  <td className="p-2.5 align-top bg-rose-50/20">
                                     {allergens.length > 0 ? (
                                       <div className="flex flex-wrap gap-1">
                                          {allergens.map(a => (
                                            <span 
                                              key={a}
                                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-100/90 text-rose-950 border border-rose-300 rounded font-black text-[8px] uppercase tracking-tight"
                                            >
                                              <span>{ALLERGEN_CONFIG[a]?.icon || '⚠️'}</span>
                                              <span>{a}</span>
                                            </span>
                                          ))}
                                       </div>
                                     ) : (
                                       <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-[8.5px] uppercase">
                                          <Check size={12} className="text-emerald-600" /> Sin alérgenos declarados
                                       </span>
                                     )}
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>

                {/* Pie de Firma y Conformidad */}
                <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-[9px] break-inside-avoid">
                   <div className="p-3 border border-slate-300 rounded-xl bg-slate-50">
                      <p className="font-black uppercase text-slate-800 mb-1">Aviso legal al comensal:</p>
                      <p className="text-slate-600 text-[8px] leading-relaxed">
                        Este establecimiento elabora sus productos conforme a los requisitos del Real Decreto 126/2015 y Reglamento (UE) 1169/2011. Si presenta alguna alergia o intolerancia alimentaria, le rogamos lo comunique al personal del servicio antes de consumir.
                      </p>
                   </div>
                   <div className="p-3 border border-slate-300 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[8.5px] font-bold uppercase text-slate-500">
                         <span>Conforme Responsable de Cocina:</span>
                         <span>Fecha: {new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="border-b border-dashed border-slate-400 mt-8 mb-1"></div>
                      <p className="text-[7.5px] text-center text-slate-400 uppercase font-mono">Firma y Sello del Centro / Dpto. Hostelería</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* HISTÓRICO DE MENÚS */}
        {activeTab === 'history' && (
          <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveTab('planning')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                        <ArrowLeft size={24} />
                     </button>
                     <div>
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Histórico de Menús</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Planificaciones Guardadas</p>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('planning')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                    <Plus size={16}/> Nueva Planificación
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {savedMenus.length === 0 ? (
                    <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-300">
                       <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                       <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">No hay menús guardados todavía</p>
                    </div>
                  ) : (
                    savedMenus.map(plan => (
                      <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-indigo-400 transition-all group shadow-sm">
                         <div className="flex items-center gap-5">
                            <div className="bg-slate-100 p-4 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                               <Calendar size={28} />
                            </div>
                            <div>
                               <h3 className="font-black text-slate-800 uppercase text-lg leading-none mb-2">{plan.title}</h3>
                               <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <span className="flex items-center gap-1"><Clock size={12}/> {plan.date}</span>
                                  <span className="flex items-center gap-1"><Users size={12}/> {plan.pax} PAX</span>
                                  <span className="bg-slate-50 px-2 py-0.5 rounded">{plan.recipeIds.length} PLATOS</span>
                                  {plan.groupCount && (
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{plan.groupCount} BRIGADAS</span>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleLoadPlan(plan)} className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
                               Cargar Menú
                            </button>
                            <button onClick={() => confirm(`¿Borrar el menú ${plan.title}?`) && onDeleteMenu(plan.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                               <Trash2 size={20} />
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        )}

        {/* MODAL PARA SUSTITUIR O MODIFICAR INGREDIENTE EN ESTE MENÚ */}
        {substitutingItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="bg-amber-600 text-white px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 text-white rounded-xl">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Sustituir Ingrediente</h3>
                    <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">
                      Para necesidades de servicio
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSubstitutingItem(null)} 
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                >
                  <X size={18}/>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                  <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">
                    Ingrediente original en la ficha técnica:
                  </span>
                  <span className="text-sm font-black text-amber-950 uppercase">
                    {substitutingItem.originalName}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Nuevo Ingrediente / Sustituto:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Canónigos, Espinacas baby, etc."
                    value={substitutingItem.replacedName}
                    onChange={e => setSubstitutingItem({ ...substitutingItem, replacedName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    autoFocus
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    Se reflejará en las fichas impresas de este menú y en el pedido consolidado.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      Cantidad ({menuPax} PAX):
                    </label>
                    <input
                      type="text"
                      value={substitutingItem.quantity}
                      onChange={e => setSubstitutingItem({ ...substitutingItem, quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      Unidad:
                    </label>
                    <select
                      value={substitutingItem.unit}
                      onChange={e => setSubstitutingItem({ ...substitutingItem, unit: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {['kg', 'g', 'l', 'ml', 'ud', 'unidades', 'manojos', 'bandejas', 'hojas', 'latas'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Motivo / Observación de Servicio:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cambio por falta de género en mercado o necesidades de servicio"
                    value={substitutingItem.notes}
                    onChange={e => setSubstitutingItem({ ...substitutingItem, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubstitutingItem(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const finalReplacedName = substitutingItem.replacedName.trim();
                    setDishIngredientOverrides(prev => ({
                      ...prev,
                      [substitutingItem.recipeId]: {
                        ...(prev[substitutingItem.recipeId] || {}),
                        [substitutingItem.ingKey]: {
                          quantity: substitutingItem.quantity.trim(),
                          unit: substitutingItem.unit.trim(),
                          replacedName: finalReplacedName,
                          originalName: substitutingItem.originalName,
                          notes: substitutingItem.notes.trim()
                        }
                      }
                    }));
                    setSubstitutingItem(null);
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Guardar Sustitución
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
