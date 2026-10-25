
import React, { useState, useMemo, useRef } from 'react';
import { Product, Recipe, Allergen, ALLERGEN_LIST, AppUser, isUserAdmin } from '../types';
import { AllergenIcon } from './AllergenIcon';
import { 
  Search, Plus, ArrowLeft, Edit2, Trash2, Save, X, Shield, Check, Download, 
  Upload, DollarSign, Database, AlertTriangle, AlertCircle, FileSpreadsheet, 
  Clock, ArrowRight, RefreshCw, Utensils, Ban, Percent, Truck, CheckSquare, 
  Square, Layers, Tag, Sparkles 
} from 'lucide-react';
import { findSimilarProducts, normalizeText, extractDifferenceNote } from '../lib/productUtils';

interface ProductDatabaseViewerProps {
  products: Product[];
  recipes?: Recipe[];
  appUser: AppUser | null;
  onBack: () => void;
  onAdd: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onImport: (products: Product[]) => void;
  onReplaceIngredient?: (oldName: string, newProduct: Product) => Promise<void> | void;
  onMarkInternalPrep?: (ingName: string) => Promise<void> | void;
  onMarkNonProduct?: (ingName: string) => Promise<void> | void;
}

const ALLERGEN_CODE_MAP: Record<string, Allergen> = {
  'GLU': 'Gluten', 'CRU': 'Crustáceos', 'HUE': 'Huevos', 'PES': 'Pescado',
  'CAC': 'Cacahuetes', 'SOY': 'Soja', 'LAC': 'Lácteos', 'FRA': 'Frutos de cáscara',
  'API': 'Apio', 'MUS': 'Mostaza', 'SES': 'Sésamo', 'SUL': 'Sulfitos',
  'ALT': 'Altramuces', 'MOL': 'Moluscos'
};

const REVERSE_ALLERGEN_MAP: Record<string, string> = Object.entries(ALLERGEN_CODE_MAP).reduce((acc, [code, name]) => ({ ...acc, [name]: code }), {});

const parseSmartPrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || val === 'precio_no_disponible') return 0;
  let s = val.toString().trim().replace(/[€\s]/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (lastDot > lastComma) s = s.replace(/,/g, '');
  return parseFloat(s) || 0;
};

export const ProductDatabaseViewer: React.FC<ProductDatabaseViewerProps> = ({ 
  products, recipes, appUser, onBack, onAdd, onEdit, onDelete, onImport, onReplaceIngredient, onMarkInternalPrep, onMarkNonProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'official' | 'pending'>('pending');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingCurrentIndex, setPendingCurrentIndex] = useState<number | null>(null);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [bulkUnifyTarget, setBulkUnifyTarget] = useState<{
    items: string[];
    selectedProductId?: string;
    newProductName?: string;
    newProductCategory?: string;
    newProductUnit?: string;
    newProductPrice?: number;
    addAnnotation: boolean;
  } | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<{ oldName: string; similar: Product[] } | null>(null);
  const [replaceSearch, setReplaceSearch] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingIngredients = useMemo(() => {
    if (!recipes) return [];
    const officialNames = new Set(products.map(p => p.name.toUpperCase().trim()));
    const pendingMap = new Map<string, { name: string; recipes: string[]; unit?: string }>();

    recipes.forEach(recipe => {
      recipe.subRecipes?.forEach(sub => {
        sub.ingredients?.forEach(ing => {
          if (ing.isInternalPrep || ing.isNonProduct) return; // Pertenece a la ficha o no es producto
          const ingName = (ing.name || '').trim().toUpperCase();
          if (!ingName) return;
          if (!officialNames.has(ingName)) {
            if (!pendingMap.has(ingName)) {
              pendingMap.set(ingName, { name: ing.name.trim(), recipes: [], unit: ing.unit });
            }
            const item = pendingMap.get(ingName)!;
            if (!item.recipes.includes(recipe.name)) {
              item.recipes.push(recipe.name);
            }
          }
        });
      });
    });

    return Array.from(pendingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, products]);

  // Detección automática de agrupaciones por palabras clave (ej. "Aceite", "Queso", "Harina")
  const pendingClusters = useMemo(() => {
    const wordCounts = new Map<string, { word: string; count: number; items: typeof pendingIngredients }>();
    const ignoreList = new Set([
      'PARA', 'ESTE', 'FRESCO', 'FRESCA', 'SECO', 'SECA', 'ROJO', 'VERDE', 'BLANCO', 'NEGRO', 
      'TROZO', 'HOJA', 'TIPO', 'CON', 'NATURAL', 'SUAVE', 'FINO', 'FINA', 'RALLADO', 'RALLADA',
      'MOLIDO', 'MOLIDA', 'COCIDO', 'COCIDA', 'EXTRA', 'VIRGEN'
    ]);
    
    pendingIngredients.forEach(item => {
      const clean = normalizeText(item.name);
      const words = Array.from(new Set(clean.split(' ').filter(w => w.length >= 4 && !ignoreList.has(w))));
      words.forEach(w => {
        if (!wordCounts.has(w)) {
          wordCounts.set(w, { word: w, count: 0, items: [] });
        }
        const entry = wordCounts.get(w)!;
        entry.count++;
        entry.items.push(item);
      });
    });

    return Array.from(wordCounts.values())
      .filter(c => c.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pendingIngredients]);

  const filteredPendingIngredients = useMemo(() => {
    let result = pendingIngredients;
    if (activeCluster) {
      const clusterUpper = activeCluster.toUpperCase();
      result = result.filter(item => normalizeText(item.name).includes(clusterUpper));
    }
    if (pendingSearch.trim()) {
      const term = pendingSearch.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.recipes.some(r => r.toLowerCase().includes(term))
      );
    }
    return result;
  }, [pendingIngredients, pendingSearch, activeCluster]);

  const openQuickAddForPending = (item: { name: string; unit?: string }, index: number) => {
    setPendingCurrentIndex(index);
    setEditingProduct({
      id: `p_${Date.now()}_${Math.random().toString().slice(2, 6)}`,
      name: item.name,
      category: 'ALMACÉN',
      unit: item.unit || 'kg',
      pricePerUnit: 0,
      allergens: []
    });
    setIsCreating(true);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const isActuallyAdmin = isUserAdmin(appUser);
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(term) || (p.category || "").toLowerCase().includes(term);
        const isVisible = isActuallyAdmin || p.status === 'approved' || p.requestedBy === appUser?.uid;
        return matchesSearch && isVisible;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, appUser]);

  const handleExportCSV = () => {
    const headers = "Familia,Nombre,Precio (€),Unidad,Peso por Unidad (g),Alergenos";
    const rows = products.map(p => {
      const allergenCodes = (p.allergens || []).map(a => REVERSE_ALLERGEN_MAP[a] || a).join('|');
      const price = p.pricePerUnit === 0 ? 'precio_no_disponible' : p.pricePerUnit.toString();
      const weight = p.weightPerUnit || '';
      const name = p.name.includes(',') ? `"${p.name}"` : p.name;
      const family = (p.category || 'Varios').includes(',') ? `"${p.category}"` : p.category || 'Varios';
      return `${family},${name},${price},${p.unit},${weight},${allergenCodes}`;
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_ies_la_flota_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const dataLines = lines.slice(1);
        
        const newProducts: Product[] = dataLines.map((line, index) => {
          // Parser robusto para CSV con comas en campos entrecomillados
          const parts = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$)/g);
          if (!parts || parts.length < 4) return null;

          const familyRaw = parts[0].replace(/^"|"$/g, '').trim().toUpperCase();
          let nameRaw = parts[1].replace(/^"|"$/g, '').trim().toUpperCase();
          const priceRaw = parts[2].trim();
          const unitRaw = parts[3].trim();
          const weightRaw = parts[4] ? parts[4].trim() : "";
          const allergensRaw = parts[5] ? parts[5].trim() : "";

          // LIMPIEZA CRÍTICA: Si el nombre contiene la familia al inicio, la quitamos
          // Esto evita que salga "ACEITES, ACEITE DE OLIVA" en el nombre
          const prefixes = [familyRaw + ",", familyRaw + " -", familyRaw + ":", familyRaw + " "];
          for (const prefix of prefixes) {
            if (nameRaw.startsWith(prefix)) {
              nameRaw = nameRaw.substring(prefix.length).trim();
              break;
            }
          }

          const allergens: Allergen[] = allergensRaw.split('|')
            .filter(code => code.trim() !== "")
            .map(code => ALLERGEN_CODE_MAP[code.trim().toUpperCase()] || code as Allergen);

          return {
            id: `p_csv_${Date.now()}_${index}`,
            name: nameRaw,
            pricePerUnit: parseSmartPrice(priceRaw),
            unit: (unitRaw || 'kg').trim(),
            weightPerUnit: weightRaw ? parseFloat(weightRaw) : undefined,
            allergens: allergens,
            category: familyRaw || 'VARIOS'
          };
        }).filter(p => p !== null) as Product[];

        // Sincronizar: Si el nombre ya existe, se actualiza. Si no, se añade.
        const updatedDatabase = [...products];
        newProducts.forEach(newP => {
          const idx = updatedDatabase.findIndex(p => p.name.toLowerCase() === newP.name.toLowerCase());
          if (idx >= 0) {
            updatedDatabase[idx] = { ...updatedDatabase[idx], ...newP, id: updatedDatabase[idx].id };
          } else {
            updatedDatabase.push(newP);
          }
        });

        onImport(updatedDatabase);
        alert(`Éxito: Se han procesado ${newProducts.length} registros y organizado por sus familias correspondientes.`);
      } catch (err) {
        alert("Error de formato en el CSV. Asegúrate de seguir el orden: Familia, Nombre, Precio, Unidad, Alérgenos");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleAllergen = (allergen: Allergen) => {
    if (!editingProduct) return;
    const current = editingProduct.allergens || [];
    const updated = current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen];
    setEditingProduct({ ...editingProduct, allergens: updated });
  };

  const handleSaveAndAdvance = (e?: React.FormEvent, openNext: boolean = false) => {
    if (e) e.preventDefault();
    if (!editingProduct) return;
    const finalProduct = {
      ...editingProduct,
      pricePerUnit: parseSmartPrice(editingProduct.pricePerUnit),
      name: editingProduct.name.toUpperCase(),
      category: editingProduct.category?.toUpperCase() || 'VARIOS'
    };
    if (isCreating) onAdd(finalProduct);
    else onEdit(finalProduct);

    if (openNext && pendingCurrentIndex !== null) {
      // Avanzar al siguiente producto de la lista pendiente de forma instantánea
      const nextIdx = pendingCurrentIndex + 1;
      if (nextIdx < filteredPendingIngredients.length) {
        const nextItem = filteredPendingIngredients[nextIdx];
        openQuickAddForPending(nextItem, nextIdx);
        return;
      }
    }
    
    setEditingProduct(null);
    setPendingCurrentIndex(null);
  };

  const handleSave = (e: React.FormEvent) => {
    handleSaveAndAdvance(e, false);
  };

  const handleBatchReplace = async (targetProduct: Product) => {
    if (selectedPending.length === 0) return;
    if (!confirm(`¿Unificar ${selectedPending.length} ingredientes seleccionados en "${targetProduct.name}"?\nLos matices culinarios originales se conservarán automáticamente como notas.`)) return;
    for (const name of selectedPending) {
      await onReplaceIngredient?.(name, targetProduct);
    }
    setSelectedPending([]);
    alert(`Se han unificado ${selectedPending.length} ingredientes en "${targetProduct.name}" con éxito.`);
  };

  const executeDeleteAll = () => {
    if (deleteConfirmationText === 'ELIMINAR') {
      onImport([]);
      setShowDeleteAllModal(false);
      setDeleteConfirmationText('');
      alert("Base de datos de productos vaciada correctamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-slate-600">
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Inventario Maestro</h1>
                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Database size={10} /> {products.length} Items
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase opacity-60">Organización por Familias y Categorías</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-center">
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
              <Upload size={16} /> Importar CSV
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
              <FileSpreadsheet size={16} /> Exportar CSV
            </button>
            <button onClick={() => setShowDeleteAllModal(true)} disabled={products.length === 0} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-30">
              <Trash2 size={16} /> Vaciar Todo
            </button>
            <button onClick={() => { setEditingProduct({ id: `p_${Date.now()}`, name: '', category: 'ALMACÉN', unit: 'kg', pricePerUnit: 0, allergens: [] }); setIsCreating(true); }} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg ml-auto md:ml-0">
              <Plus size={18} /> Nuevo Registro
            </button>
          </div>
        </div>

        {/* Selector de Pestañas: Catálogo Oficial vs Pendientes de Inventario */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('official')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'official'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database size={16} /> Catálogo Oficial ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm relative ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <Clock size={16} /> Pendientes de Alta en Inventario
            {pendingIngredients.length > 0 && (
              <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                {pendingIngredients.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'pending' ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
              <Clock size={24} className="text-amber-600 shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-black uppercase text-amber-950">Bandeja de Productos Pendientes de Alta</h3>
                <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                  Aquí aparecen todos los ingredientes introducidos en tus recetas que aún no están dados de alta en el Inventario Maestro. Cuando tengas tiempo, pulsa en "⚡ Dar de alta ahora" para registrar su precio, familia y alérgenos de forma definitiva.
                </p>
              </div>
            </div>

            {/* Buscador Rápido de Pendientes */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar pendientes por ingrediente o receta..." 
                  value={pendingSearch} 
                  onChange={e => setPendingSearch(e.target.value)} 
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs shadow-xs focus:ring-2 focus:ring-slate-900 transition-all uppercase" 
                />
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mostrando {filteredPendingIngredients.length} de {pendingIngredients.length} pendientes
              </div>
            </div>

            {/* Agrupaciones Automáticas por Palabras Clave (Clusters inteligentes) */}
            {pendingClusters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                  <Layers size={13} className="text-amber-600" /> Agrupar por:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCluster(null)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all shadow-xs ${
                    activeCluster === null
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todos ({pendingIngredients.length})
                </button>
                {pendingClusters.map(cl => (
                  <button
                    key={cl.word}
                    type="button"
                    onClick={() => {
                      if (activeCluster === cl.word) {
                        setActiveCluster(null);
                      } else {
                        setActiveCluster(cl.word);
                        // Pre-seleccionar todos los de este cluster para un clic fácil
                        setSelectedPending(cl.items.map(i => i.name));
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all shadow-xs ${
                      activeCluster === cl.word
                        ? 'bg-amber-600 text-white shadow-amber-500/20'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                    title={`Ver y agrupar automáticamente los ${cl.count} ingredientes con la palabra ${cl.word}`}
                  >
                    <span>{cl.word}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeCluster === cl.word ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'}`}>
                      {cl.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Barra de Acciones por Lote para Seleccionados */}
            {selectedPending.length > 0 && (
              <div className="bg-gradient-to-r from-amber-600 to-indigo-700 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                    {selectedPending.length}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Ingredientes Seleccionados</h4>
                    <p className="text-[10px] text-amber-100 font-medium">
                      {selectedPending.slice(0, 3).join(', ')}{selectedPending.length > 3 ? ` y ${selectedPending.length - 3} más` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkUnifyTarget({
                        items: [...selectedPending],
                        addAnnotation: true,
                        newProductName: selectedPending[0],
                        newProductCategory: 'ALMACÉN, SECOS Y ESPECIAS',
                        newProductUnit: 'kg',
                        newProductPrice: 0
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-amber-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Unificar en 1 Producto (con Anotación)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Marcar los ${selectedPending.length} ingredientes como "Pertenece a la ficha"?`)) {
                        selectedPending.forEach(name => onMarkInternalPrep?.(name));
                        setSelectedPending([]);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-black/30 hover:bg-black/40 text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                  >
                    <Utensils size={12} /> Elaboración propia
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Marcar los ${selectedPending.length} ingredientes como "No es producto" (agua, sal, condimentos sin stock)?`)) {
                        selectedPending.forEach(name => onMarkNonProduct?.(name));
                        setSelectedPending([]);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-black/30 hover:bg-black/40 text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                  >
                    <Ban size={12} /> No producto
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPending([])}
                    className="px-2.5 py-2 text-white/70 hover:text-white text-[10px] font-bold uppercase"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>
            )}

            {filteredPendingIngredients.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                <Check size={48} className="text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-black text-slate-800 uppercase">
                  {pendingSearch ? 'No hay coincidencias' : '¡Todo al día!'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {pendingSearch ? 'Prueba con otro término de búsqueda.' : 'No hay ingredientes pendientes en tus fichas técnicas.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <tr>
                      <th className="px-3 py-4 w-10 text-center">
                        <input 
                          type="checkbox"
                          checked={filteredPendingIngredients.length > 0 && filteredPendingIngredients.every(i => selectedPending.includes(i.name))}
                          onChange={e => {
                            if (e.target.checked) {
                              const names = filteredPendingIngredients.map(i => i.name);
                              setSelectedPending(prev => Array.from(new Set([...prev, ...names])));
                            } else {
                              const names = new Set(filteredPendingIngredients.map(i => i.name));
                              setSelectedPending(prev => prev.filter(n => !names.has(n)));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          title="Seleccionar todos los visibles"
                        />
                      </th>
                      <th className="px-6 py-4">Ingrediente Detectado en Recetas</th>
                      <th className="px-6 py-4">Usado en Fichas</th>
                      <th className="px-6 py-4">Ud. Sugerida</th>
                      <th className="px-6 py-4 text-right">Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPendingIngredients.map((item, idx) => {
                      const similar = findSimilarProducts(item.name, products, 4);
                      const isSelected = selectedPending.includes(item.name);
                      return (
                        <tr key={idx} className={`hover:bg-amber-50/30 transition-colors ${isSelected ? 'bg-amber-50/60' : ''}`}>
                          <td className="px-3 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedPending(prev => [...prev, item.name]);
                                } else {
                                  setSelectedPending(prev => prev.filter(n => n !== item.name));
                                }
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-black uppercase text-slate-800 text-sm block">{item.name}</span>

                            {similar.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="text-[8.5px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                  💡 ¿Similar en catálogo?:
                                </span>
                                {similar.slice(0, 3).map(sim => (
                                  <button
                                    key={sim.id}
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`¿Cambiar "${item.name}" por el producto existente "${sim.name}" en todas las recetas asociadas?`)) {
                                        onReplaceIngredient?.(item.name, sim);
                                      }
                                    }}
                                    className="text-[9px] font-bold bg-amber-100/90 hover:bg-emerald-600 hover:text-white text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 hover:border-emerald-600 transition-all flex items-center gap-1.5 shadow-xs group"
                                    title={`Cambiar por ${sim.name} (${sim.pricePerUnit}€/${sim.unit})`}
                                  >
                                    <Check size={11} className="text-emerald-600 group-hover:text-white" />
                                    <span>{sim.name}</span>
                                    <span className="opacity-70 text-[8px] font-mono">({sim.pricePerUnit ? `${sim.pricePerUnit}€` : '0€'})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {item.recipes.map((rName, rIdx) => (
                                <span key={rIdx} className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                  {rName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">{item.unit || 'kg'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Marcar "${item.name}" como "Pertenece a la ficha / Elaboración interna"?\n\nNo se creará producto en almacén y no volverá a figurar como pendiente.`)) {
                                    onMarkInternalPrep?.(item.name);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                                title="Marcar como elaboración propia interna (no es producto de almacén)"
                              >
                                <Utensils size={12} className="text-slate-600" />
                                <span>Pertenece a la ficha</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Marcar "${item.name}" como "No es un producto" (agua, hielo, decorativo, etc.)?\n\nNo se creará en el catálogo y no volverá a figurar como pendiente.`)) {
                                    onMarkNonProduct?.(item.name);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                                title="Marcar como no producto (agua, hielo, condimento sin inventario)"
                              >
                                <Ban size={12} className="text-stone-500" />
                                <span>No es producto</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReplaceTarget({ oldName: item.name, similar });
                                  setReplaceSearch('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                                title="Buscar producto similar del catálogo o cambiar por otro"
                              >
                                <RefreshCw size={12} className="text-indigo-600" />
                                <span>Similar / Cambiar</span>
                              </button>
                              <button
                                onClick={() => openQuickAddForPending(item, idx)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                                title="Dar de alta como nuevo producto independiente en el inventario"
                              >
                                <Plus size={12} />
                                <span>Dar de alta</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Buscador */}
        <div className="mb-6">
           <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Filtrar por familia o nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-slate-900 transition-all" />
           </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[9px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 w-16">Nº</th>
                <th className="px-6 py-4">Género / Materia Prima</th>
                <th className="px-6 py-4">P. Mercado</th>
                <th className="px-6 py-4">Ud.</th>
                <th className="px-6 py-4">Alérgenos</th>
                <th className="px-6 py-4 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
                <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-300 bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full">{idx + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="font-black text-slate-800 uppercase text-xs tracking-tight">{product.name}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                         {product.category || 'SIN FAMILIA'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                    {product.pricePerUnit === 0 ? <span className="text-[10px] text-slate-300">N/D</span> : `${product.pricePerUnit.toFixed(3).replace('.', ',')}€`}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-black uppercase text-[10px]">{product.unit}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(product.allergens || []).length > 0 ? (
                        product.allergens.map(a => (
                          <div key={a} title={a}>
                            <AllergenIcon allergen={a} size={24} />
                          </div>
                        ))
                      ) : <Check size={14} className="text-green-300 opacity-50"/>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingProduct({...product}); setIsCreating(false); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirm(`¿Borrar ${product.name}?`) && onDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <Database size={48} className="mx-auto text-slate-200 mb-4" strokeWidth={1} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin resultados encontrados</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
       </>
     )}
       </div>

      {/* Modal Borrado Total */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-rose-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border-4 border-rose-500/20">
            <div className="bg-rose-600 text-white p-8 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">¿Vaciar Catálogo?</h2>
              <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-2">Esta acción borrará {products.length} productos</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex gap-4 items-center">
                 <AlertCircle size={24} className="text-rose-600 shrink-0" />
                 <p className="text-[11px] text-rose-800 font-bold leading-tight">
                   Si borras los productos, todas tus fichas de recetas perderán los precios asociados hasta que los vuelvas a importar.
                 </p>
              </div>
              <div className="text-center">
                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">
                   Escribe <span className="text-rose-600">ELIMINAR</span> para confirmar
                 </label>
                 <input 
                  type="text" autoFocus value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value.toUpperCase())}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-rose-600 text-xl outline-none focus:border-rose-500 transition-all uppercase"
                  placeholder="CONFIRMACIÓN"
                 />
              </div>
              <div className="flex gap-3">
                 <button onClick={() => { setShowDeleteAllModal(false); setDeleteConfirmationText(''); }} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
                 <button onClick={executeDeleteAll} disabled={deleteConfirmationText !== 'ELIMINAR'} className={`flex-1 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${deleteConfirmationText === 'ELIMINAR' ? 'bg-rose-600 text-white shadow-xl hover:bg-rose-700' : 'bg-slate-50 text-slate-200 pointer-events-none'}`}>Borrar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor de Producto */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">{isCreating ? 'Añadir Género' : 'Ficha de Registro'}</h2>
              <button onClick={() => setEditingProduct(null)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Familia / Categoría de Pedido</label>
                <input required type="text" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value.toUpperCase()})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ej: CARNES, LÁCTEOS..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nombre del Producto (Sin familia)</label>
                <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value.toUpperCase()})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ej: SOLOMILLO DE TERNERA" />
              </div>

              {isCreating && (() => {
                const similarProducts = findSimilarProducts(editingProduct.name, products);
                if (similarProducts.length === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>¿Similar o cambiar por producto existente?</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-snug font-medium">
                      Si solo cambia una palabra o formato, puedes cambiarlo por uno existente sin duplicar el catálogo:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {similarProducts.map(sim => (
                        <button
                          key={sim.id}
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Sustituir "${editingProduct.name}" por "${sim.name}" en tus recetas asociadas?`)) {
                              onReplaceIngredient?.(editingProduct.name, sim);
                              setEditingProduct(null);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-slate-800 border border-amber-300 hover:border-emerald-600 rounded-xl text-[10px] font-black uppercase shadow-xs transition-all group"
                        >
                          <Check size={12} className="text-emerald-600 group-hover:text-white" />
                          <span>Cambiar por: <strong>{sim.name}</strong> ({sim.pricePerUnit ? `${sim.pricePerUnit}€` : '0€'}/{sim.unit})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Precio Mercado €</label>
                  <div className="relative">
                    <input type="text" value={editingProduct.pricePerUnit} onChange={e => setEditingProduct({...editingProduct, pricePerUnit: e.target.value as any})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-slate-900" placeholder="0.00" />
                    <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Unidad</label>
                  <select value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="unidad">unidad / ud</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              {/* Nuevas funcionalidades: Proveedor habitual y % de merma estimado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Truck size={12} className="text-slate-500" /> Proveedor Habitual
                  </label>
                  <input 
                    type="text" 
                    value={editingProduct.supplier || ''} 
                    onChange={e => setEditingProduct({...editingProduct, supplier: e.target.value.toUpperCase()})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900" 
                    placeholder="Ej: MAKRO, MERCAMURCIA..." 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Percent size={12} className="text-slate-500" /> % Merma Estimada
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0" 
                      max="90" 
                      value={editingProduct.wastePercentage ?? ''} 
                      onChange={e => setEditingProduct({...editingProduct, wastePercentage: parseFloat(e.target.value) || undefined})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-slate-900" 
                      placeholder="Ej: 15" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Indicador de Coste Neto Usable con Merma */}
              {editingProduct.wastePercentage && editingProduct.wastePercentage > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Coste real limpio (con {editingProduct.wastePercentage}% merma):
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {(parseSmartPrice(editingProduct.pricePerUnit) / (1 - (editingProduct.wastePercentage / 100))).toFixed(3).replace('.', ',')}€/{editingProduct.unit}
                  </span>
                </div>
              )}

              {editingProduct.unit === 'unidad' && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-black text-amber-600 uppercase mb-2">Peso por Unidad (gramos)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={editingProduct.weightPerUnit || ''} 
                      onChange={e => setEditingProduct({...editingProduct, weightPerUnit: parseFloat(e.target.value) || undefined})} 
                      className="w-full px-5 py-3 bg-amber-50 border border-amber-100 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                      placeholder="Ej: 60" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 font-bold text-xs">g</span>
                  </div>
                  <p className="text-[9px] text-amber-500 font-bold mt-1 italic">Necesario para convertir de gramos a unidades automáticamente.</p>
                </div>
              )}

              {/* Control de Alérgenos Compacto y Ultra Funcional */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      Alérgenos ({editingProduct.allergens.length})
                    </span>
                    {editingProduct.allergens.length === 0 && (
                      <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Sin alérgenos declarados
                      </span>
                    )}
                  </div>
                  {editingProduct.allergens.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({...editingProduct, allergens: []})}
                      className="text-[9px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider hover:underline"
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                  {ALLERGEN_LIST.map(a => {
                    const isSel = editingProduct.allergens.includes(a);
                    return (
                      <button 
                        key={a} 
                        type="button" 
                        onClick={() => toggleAllergen(a)} 
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

              {/* Opciones directas si era un ingrediente de receta */}
              {isCreating && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">¿No es producto almacén?:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Marcar "${editingProduct.name}" como "Pertenece a la ficha"?\nNo se creará en inventario.`)) {
                          onMarkInternalPrep?.(editingProduct.name);
                          setEditingProduct(null);
                        }
                      }}
                      className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-all flex items-center gap-1"
                    >
                      <Utensils size={10} /> Pertenece a la ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Marcar "${editingProduct.name}" como "No es un producto"?\nNo se creará en inventario.`)) {
                          onMarkNonProduct?.(editingProduct.name);
                          setEditingProduct(null);
                        }
                      }}
                      className="text-[9px] font-black uppercase text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200 transition-all flex items-center gap-1"
                    >
                      <Ban size={10} /> No es producto
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                {pendingCurrentIndex !== null && pendingCurrentIndex + 1 < filteredPendingIngredients.length && (
                  <button 
                    type="button" 
                    onClick={() => handleSaveAndAdvance(undefined, true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5"
                    title="Guarda este producto y abre de inmediato el siguiente ingrediente pendiente sin salir"
                  >
                    <span>Guardar y Siguiente</span>
                    <ArrowRight size={16} />
                  </button>
                )}
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:bg-slate-800"
                >
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Similar o Cambiar Por */}
      {replaceTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Similar o Cambiar Por...</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Reemplazar "{replaceTarget.oldName}" en todas las recetas asociadas
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setReplaceTarget(null)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Sugerencias Automáticas Similares */}
              {replaceTarget.similar.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-black uppercase">
                    <Check size={14} className="text-amber-600" />
                    <span>Sugerencias similares detectadas automáticamente</span>
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                    Detectamos que el catálogo ya contiene estos productos con nombres similares:
                  </p>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {replaceTarget.similar.map(sim => (
                      <button
                        key={sim.id}
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Sustituir "${replaceTarget.oldName}" por "${sim.name}" en todas las recetas asociadas?`)) {
                            onReplaceIngredient?.(replaceTarget.oldName, sim);
                            setReplaceTarget(null);
                          }
                        }}
                        className="flex items-center justify-between p-3.5 bg-white hover:bg-emerald-50 border border-amber-200 hover:border-emerald-400 rounded-xl transition-all shadow-xs group text-left"
                      >
                        <div>
                          <span className="text-xs font-black uppercase text-slate-800 group-hover:text-emerald-900 block">{sim.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sim.category || 'Almacén'} · {sim.unit}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-900">{sim.pricePerUnit ? `${sim.pricePerUnit}€` : '0.00€'}</span>
                          <span className="px-3 py-1.5 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-xs">
                            Seleccionar
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buscador de Cualquier Producto en Catálogo */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  O busca cualquier otro producto del catálogo ({products.length} disponibles):
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={replaceSearch}
                    onChange={e => setReplaceSearch(e.target.value)}
                    placeholder="Buscar por nombre o familia..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Lista de Resultados del Catálogo */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {products
                  .filter(p => {
                    if (!replaceSearch.trim()) return true;
                    const term = replaceSearch.toUpperCase();
                    return p.name.toUpperCase().includes(term) || (p.category || '').toUpperCase().includes(term);
                  })
                  .slice(0, 30)
                  .map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (confirm(`¿Sustituir "${replaceTarget.oldName}" por "${p.name}" en todas las recetas asociadas?`)) {
                          onReplaceIngredient?.(replaceTarget.oldName, p);
                          setReplaceTarget(null);
                        }
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all text-left group"
                    >
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{p.category || 'Almacén'} · {p.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">{p.pricePerUnit ? `${p.pricePerUnit}€` : '0€'}</span>
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          Elegir
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Unificación en Lote de Ingredientes Similares */}
      {bulkUnifyTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-amber-600 to-indigo-700 text-white px-8 py-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 text-white rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Unificar Ingredientes en 1 Producto</h2>
                  <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider mt-0.5">
                    {bulkUnifyTarget.items.length} variantes seleccionadas
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setBulkUnifyTarget(null)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Variantes a agrupar */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-900 mb-2">
                  Variantes que se unificarán:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bulkUnifyTarget.items.map(name => (
                    <span key={name} className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Opción A: Seleccionar Producto Existente del Catálogo */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase text-slate-800 tracking-wide">
                  1. Seleccionar Producto Existente del Catálogo:
                </label>
                <select
                  value={bulkUnifyTarget.selectedProductId || ''}
                  onChange={e => {
                    const prodId = e.target.value;
                    setBulkUnifyTarget(prev => prev ? {
                      ...prev,
                      selectedProductId: prodId,
                      newProductName: prodId ? products.find(p => p.id === prodId)?.name : prev.newProductName
                    } : null);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="">-- O escribir un nuevo producto oficial abajo --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'Almacén'}) · {p.pricePerUnit ? `${p.pricePerUnit}€/${p.unit}` : p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opción B: Crear o Modificar Nombre Oficial del Producto */}
              {!bulkUnifyTarget.selectedProductId && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black uppercase text-slate-800 tracking-wide">
                    2. O dar de alta como nuevo Producto Oficial:
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre oficial (ej: ACEITE DE OLIVA VIRGEN EXTRA)"
                      value={bulkUnifyTarget.newProductName || ''}
                      onChange={e => setBulkUnifyTarget(prev => prev ? { ...prev, newProductName: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold uppercase"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={bulkUnifyTarget.newProductCategory || 'ALMACÉN'}
                        onChange={e => setBulkUnifyTarget(prev => prev ? { ...prev, newProductCategory: e.target.value } : null)}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-[11px] font-bold"
                      >
                        {['ACEITES Y GRASAS', 'LÁCTEOS Y HUEVOS', 'FRUTAS Y VERDURAS', 'CARNES Y AVES', 'PESCADOS Y MARISCOS', 'ALMACÉN, SECOS Y ESPECIAS', 'BEBIDAS Y BODEGA', 'OTROS'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <select
                        value={bulkUnifyTarget.newProductUnit || 'kg'}
                        onChange={e => setBulkUnifyTarget(prev => prev ? { ...prev, newProductUnit: e.target.value } : null)}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-[11px] font-bold"
                      >
                        {['kg', 'g', 'l', 'ml', 'ud', 'lata', 'bote', 'botella'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio €"
                        value={bulkUnifyTarget.newProductPrice || ''}
                        onChange={e => setBulkUnifyTarget(prev => prev ? { ...prev, newProductPrice: parseFloat(e.target.value) || 0 } : null)}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-[11px] font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Casilla de Anotación Extra */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-annotation"
                  checked={bulkUnifyTarget.addAnnotation}
                  onChange={e => setBulkUnifyTarget(prev => prev ? { ...prev, addAnnotation: e.target.checked } : null)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="chk-annotation" className="text-xs text-emerald-950 cursor-pointer">
                  <span className="font-black uppercase block">Conservar detalle original como anotación / variedad</span>
                  <span className="text-[11px] text-emerald-800 leading-tight block mt-0.5">
                    Ejemplo: El producto en el catálogo pasa a ser <b>"Aceite de oliva virgen extra"</b>, y en la ficha de la receta se anota automáticamente la variedad <b>"(Arbequina)"</b>.
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBulkUnifyTarget(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  let targetProduct: Product | undefined;
                  if (bulkUnifyTarget.selectedProductId) {
                    targetProduct = products.find(p => p.id === bulkUnifyTarget.selectedProductId);
                  } else if (bulkUnifyTarget.newProductName?.trim()) {
                    const newProd: Product = {
                      id: `p_${Date.now()}`,
                      name: bulkUnifyTarget.newProductName.trim().toUpperCase(),
                      category: bulkUnifyTarget.newProductCategory || 'ALMACÉN',
                      unit: bulkUnifyTarget.newProductUnit || 'kg',
                      pricePerUnit: bulkUnifyTarget.newProductPrice || 0,
                      allergens: []
                    };
                    onAdd(newProd);
                    targetProduct = newProd;
                  }

                  if (!targetProduct) {
                    alert("Por favor selecciona un producto existente o introduce un nombre oficial.");
                    return;
                  }

                  for (const oldItemName of bulkUnifyTarget.items) {
                    await onReplaceIngredient?.(oldItemName, targetProduct);
                  }

                  setSelectedPending([]);
                  setBulkUnifyTarget(null);
                  alert(`¡Unificación completada! ${bulkUnifyTarget.items.length} ingredientes unificados bajo "${targetProduct.name}".`);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Confirmar y Unificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

