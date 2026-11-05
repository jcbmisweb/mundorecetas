import React, { useState, useMemo } from 'react';
import { TexturizerProduct } from '../types';
import { TEXTURIZER_FAMILIES, INITIAL_TEXTURIZERS } from '../data/texturizersData';
import { 
  Calculator, Search, Plus, Edit2, Trash2, CheckCircle2, 
  AlertOctagon, Info, Sparkles, Filter, RefreshCw, Copy, Check,
  FlaskConical, Scale, BookOpen, AlertCircle, ArrowRight, ShieldAlert,
  Sliders, Layers, Zap
} from 'lucide-react';

interface CalculatoxProps {
  products?: TexturizerProduct[];
  onSaveProduct?: (product: TexturizerProduct) => void;
  onDeleteProduct?: (id: string) => void;
  onBack?: () => void;
}

export const Calculatox: React.FC<CalculatoxProps> = ({
  products: customProductsList,
  onSaveProduct,
  onDeleteProduct,
  onBack
}) => {
  const [products, setProducts] = useState<TexturizerProduct[]>(() => {
    if (customProductsList && customProductsList.length > 0) return customProductsList;
    try {
      const saved = localStorage.getItem('calculatox_custom_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEXTURIZERS;
  });

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'calculator' | 'catalog' | 'manage' | 'protocol'>('calculator');

  // --- ESTADOS CALCULADORA ---
  const [selectedProductId, setSelectedProductId] = useState<string>('tex_4_1'); // Goma Xantana por defecto
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const [calcMode, setCalcMode] = useState<'direct' | 'inverse'>('direct');
  // Modo A: Directo (Peso base + % dosis -> Gramos)
  const [baseWeightGrams, setBaseWeightGrams] = useState<number>(1000);
  const [targetDosePercent, setTargetDosePercent] = useState<number>(0.3);

  // Modo B: Inverso (Peso base + Gramos producto -> % dosis)
  const [addedGrams, setAddedGrams] = useState<number>(3);

  const [copiedFormula, setCopiedFormula] = useState(false);

  // --- ESTADOS BÚSQUEDA Y VADEMÉCUM ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<number | 'all'>('all');

  // --- ESTADOS GESTIÓN Y ALTA ---
  const [editingProduct, setEditingProduct] = useState<Partial<TexturizerProduct> | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // --- CÁLCULOS EN TIEMPO REAL ---
  // Gramos calculados en modo directo
  const calculatedGrams = useMemo(() => {
    if (!baseWeightGrams || baseWeightGrams <= 0) return 0;
    return (baseWeightGrams * targetDosePercent) / 100;
  }, [baseWeightGrams, targetDosePercent]);

  // Porcentaje calculado en modo inverso
  const calculatedPercent = useMemo(() => {
    if (!baseWeightGrams || baseWeightGrams <= 0) return 0;
    return (addedGrams * 100) / baseWeightGrams;
  }, [baseWeightGrams, addedGrams]);

  // Estado de dosis recomendada según el producto seleccionado
  const doseEvaluation = useMemo(() => {
    if (!selectedProduct) return { status: 'ok', message: 'Dosis dentro de parámetros.' };
    const currentVal = calcMode === 'direct' ? targetDosePercent : calculatedPercent;

    if (selectedProduct.doseMin !== undefined && currentVal < selectedProduct.doseMin) {
      return {
        status: 'low',
        message: `⚠️ Dosis baja. La dosis mínima recomendada para ${selectedProduct.name} es ${selectedProduct.doseMin}${selectedProduct.doseUnit}.`
      };
    }
    if (selectedProduct.doseMax !== undefined && currentVal > selectedProduct.doseMax) {
      return {
        status: 'high',
        message: `⚠️ Dosis elevada. La dosis máxima recomendada para ${selectedProduct.name} es ${selectedProduct.doseMax}${selectedProduct.doseUnit}.`
      };
    }
    return {
      status: 'ok',
      message: `✅ Dosis óptima. Rango recomendado de ${selectedProduct.name}: ${selectedProduct.doseReferenceRaw}.`
    };
  }, [selectedProduct, calcMode, targetDosePercent, calculatedPercent]);

  // Filtrado de productos para el vademécum
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchFamily = selectedFamilyFilter === 'all' || p.familyId === selectedFamilyFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchFamily;

      const matchText = (p.name || '').toLowerCase().includes(q) ||
                        (p.familyName || '').toLowerCase().includes(q) ||
                        (p.application || '').toLowerCase().includes(q) ||
                        (p.activationMode || '').toLowerCase().includes(q) ||
                        (p.pccNotes || '').toLowerCase().includes(q);
      return matchFamily && matchText;
    });
  }, [products, selectedFamilyFilter, searchQuery]);

  // Copiar fórmula de pesaje al portapapeles
  const handleCopyFormula = () => {
    let formulaText = '';
    if (calcMode === 'direct') {
      formulaText = `🧪 [CALCULATOX] ${selectedProduct.name}: ${calculatedGrams.toFixed(2)} g (${targetDosePercent}% sobre ${baseWeightGrams} g de elaboración base). ${selectedProduct.pccNotes || ''}`;
    } else {
      formulaText = `🧪 [CALCULATOX] ${selectedProduct.name}: ${addedGrams} g equivalen al ${calculatedPercent.toFixed(2)}% sobre ${baseWeightGrams} g de elaboración base.`;
    }
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2500);
  };

  // Guardar o editar producto
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) return;

    const familyObj = TEXTURIZER_FAMILIES.find(f => f.id === Number(editingProduct.familyId)) || TEXTURIZER_FAMILIES[0];

    const finalProd: TexturizerProduct = {
      id: editingProduct.id || `tex_custom_${Date.now()}`,
      name: editingProduct.name.trim(),
      familyId: familyObj.id,
      familyName: familyObj.name,
      doseMin: editingProduct.doseMin !== undefined ? Number(editingProduct.doseMin) : undefined,
      doseMax: editingProduct.doseMax !== undefined ? Number(editingProduct.doseMax) : undefined,
      doseUnit: editingProduct.doseUnit || '%',
      doseReferenceRaw: editingProduct.doseReferenceRaw || `${editingProduct.doseMin || 0} – ${editingProduct.doseMax || 0} %`,
      activationMode: editingProduct.activationMode || 'Disolver e integrar según técnica.',
      application: editingProduct.application || 'Sin aplicación especificada.',
      pccNotes: editingProduct.pccNotes || 'PCC: Precisión en pesaje.',
      isCustom: true
    };

    const updatedList = products.some(p => p.id === finalProd.id)
      ? products.map(p => p.id === finalProd.id ? finalProd : p)
      : [finalProd, ...products];

    setProducts(updatedList);
    try {
      localStorage.setItem('calculatox_custom_products', JSON.stringify(updatedList));
    } catch {}

    if (onSaveProduct) onSaveProduct(finalProd);

    setIsEditingModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este aditivo del catálogo?')) return;
    const updatedList = products.filter(p => p.id !== id);
    setProducts(updatedList);
    try {
      localStorage.setItem('calculatox_custom_products', JSON.stringify(updatedList));
    } catch {}
    if (onDeleteProduct) onDeleteProduct(id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* CABECERA PRINCIPAL DE CALCULATOX */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shadow-inner">
                  <FlaskConical size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-mono">
                      CALCULATOX <span className="text-emerald-400">🧪</span>
                    </h1>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                      Vademécum & Dosificación
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Calculadora de % e hidrocoloides basada en el Vademécum Técnico de Productos Culinarios (81 Aditivos SOSA)
                  </p>
                </div>
              </div>
            </div>

            {/* BOTONES NAVEGACIÓN PRINCIPAL */}
            <div className="flex flex-wrap gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Calculator size={15} />
                <span>Calculadora</span>
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BookOpen size={15} />
                <span>Vademécum ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === 'manage'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus size={15} />
                <span>Gestión & Alta</span>
              </button>

              <button
                onClick={() => setActiveTab('protocol')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === 'protocol'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ShieldAlert size={15} />
                <span>Protocolo PCC</span>
              </button>
            </div>
          </div>
        </div>

        {/* PESTAÑA 1: CALCULADORA DE DOSIFICACIÓN Y PORCENTAJES */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* LADO IZQUIERDO: SELECCIÓN DE PRODUCTO Y PARÁMETROS */}
            <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Scale size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">
                    1. Parámetros de la Elaboración
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-black uppercase">
                  <button
                    onClick={() => setCalcMode('direct')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${calcMode === 'direct' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    Directo (g)
                  </button>
                  <button
                    onClick={() => setCalcMode('inverse')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${calcMode === 'inverse' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    Inverso (%)
                  </button>
                </div>
              </div>

              {/* Selector de Producto del Vademécum */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Seleccionar Aditivo / Texturizante del Catálogo:
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    const sel = products.find(p => p.id === e.target.value);
                    if (sel && sel.doseMin) {
                      setTargetDosePercent(sel.doseMin);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {TEXTURIZER_FAMILIES.map(fam => (
                    <optgroup key={fam.id} label={`Familia ${fam.id}: ${fam.name}`} className="bg-slate-900 text-emerald-400 font-bold">
                      {products.filter(p => p.familyId === fam.id).map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white font-normal">
                          {p.name} — Dosis ref: {p.doseReferenceRaw}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Ficha técnica rápida del producto seleccionado */}
              {selectedProduct && (
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      {selectedProduct.name}
                    </span>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      Familia {selectedProduct.familyId} · {selectedProduct.familyName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Dosis Referencia:</span>
                      <span className="font-mono font-bold text-emerald-300">{selectedProduct.doseReferenceRaw}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Modo de Activación:</span>
                      <span className="font-medium text-slate-300 leading-snug">{selectedProduct.activationMode}</span>
                    </div>
                  </div>

                  <div className="text-xs pt-1 border-t border-slate-800">
                    <span className="text-[9px] font-black text-amber-400 uppercase block">Observaciones Técnicas & PCC:</span>
                    <span className="text-slate-300 italic">{selectedProduct.pccNotes}</span>
                  </div>
                </div>
              )}

              {/* Inputs de cálculo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Peso Total Elaboración Base (Gramos):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={baseWeightGrams || ''}
                      onChange={e => setBaseWeightGrams(parseFloat(e.target.value) || 0)}
                      className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-lg font-black text-white outline-none focus:border-emerald-500 font-mono"
                      placeholder="1000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-slate-500">
                      gramos
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500">Ej: 1.500 g de Coulis, 500 g de Puré, etc.</span>
                </div>

                {calcMode === 'direct' ? (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Dosis a Aplicar (% Porcentaje):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={targetDosePercent}
                        onChange={e => setTargetDosePercent(parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-lg font-black text-emerald-400 outline-none focus:border-emerald-500 font-mono"
                        placeholder="0.30"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Dosis deseada del texturizante sobre el peso base.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Gramos de Producto Añadidos:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addedGrams}
                        onChange={e => setAddedGrams(parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-lg font-black text-emerald-400 outline-none focus:border-emerald-500 font-mono"
                        placeholder="4.50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400">g</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Gramos físicos que has pesado en la gramera.</span>
                  </div>
                )}
              </div>
            </div>

            {/* LADO DERECHO: RESULTADO DEL CÁLCULO Y ALERTAS */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <div className="bg-gradient-to-b from-slate-950 to-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase text-emerald-300">
                  <Zap size={13} /> Resultado de Pesaje CALCULATOX
                </div>

                {calcMode === 'direct' ? (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400 block tracking-widest">
                      Gramos de {selectedProduct.name} a pesar:
                    </span>
                    <div className="text-5xl sm:text-6xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-md">
                      {calculatedGrams.toFixed(2).replace('.', ',')} <span className="text-2xl text-emerald-500">g</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Para {baseWeightGrams} g de base al {targetDosePercent}% de concentración.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400 block tracking-widest">
                      Porcentaje de Dosis Resultante:
                    </span>
                    <div className="text-5xl sm:text-6xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-md">
                      {calculatedPercent.toFixed(2).replace('.', ',')} <span className="text-2xl text-emerald-500">%</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {addedGrams} g sobre {baseWeightGrams} g de producto base.
                    </p>
                  </div>
                )}

                {/* Evaluación de Dosis Recomendada */}
                <div className={`p-4 rounded-2xl border text-xs text-left font-bold transition-all ${
                  doseEvaluation.status === 'ok'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                }`}>
                  <p className="flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{doseEvaluation.message}</span>
                  </p>
                </div>

                {/* Botón de Copiar Fórmula */}
                <button
                  onClick={handleCopyFormula}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedFormula ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedFormula ? '¡Fórmula Copiada al Portapapeles!' : 'Copiar Fórmula para Escandallo'}</span>
                </button>
              </div>

              {/* RECORDATORIO DE PCC1 (GRAMERA DIGITAL) */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase">
                  <AlertOctagon size={16} />
                  <span>PCC 1: Precisión Absoluta en Pesaje</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Utilizar siempre gramera digital de precisión (0,01 g). Variaciones de ±0,5 g en xantana, agar-agar o esferificación alteran de forma irreversible la viscosidad de la mezcla.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: VADEMÉCUM TÉCNICO COMPLETO DE TEXTURIZANTES (BUSCADOR) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-fadeIn">
            {/* BUSCADOR Y FILTROS POR FAMILIA */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Input Buscador */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar aditivo por nombre, aplicación, PCC o técnica (ej: xantana, alginato, congelable, aire)..."
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      ✕
                    </button>
                  )}
                </div>

                <span className="text-xs font-black uppercase text-emerald-400 shrink-0">
                  {filteredProducts.length} aditivos encontrados
                </span>
              </div>

              {/* Pills de Familias */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                <button
                  onClick={() => setSelectedFamilyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    selectedFamilyFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Todas las Familias (81)
                </button>
                {TEXTURIZER_FAMILIES.map(fam => (
                  <button
                    key={fam.id}
                    onClick={() => setSelectedFamilyFilter(fam.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      selectedFamilyFilter === fam.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    F{fam.id}: {fam.name}
                  </button>
                ))}
              </div>
            </div>

            {/* GRILLA DE TARJETAS TÉCNICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 space-y-3 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider block">
                          Familia {prod.familyId} · {prod.familyName}
                        </span>
                        <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors uppercase font-mono">
                          {prod.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg shrink-0 font-mono">
                        {prod.doseReferenceRaw}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-900">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase block">Modo de Activación / Técnica:</span>
                        <p className="text-slate-300 font-medium leading-snug">{prod.activationMode}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase block">Aplicación Gastronómica:</span>
                        <p className="text-slate-300 font-serif italic leading-snug">{prod.application}</p>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[9px] font-black text-amber-400 uppercase block mb-0.5">Observaciones & PCC:</span>
                        <p className="text-[11px] text-amber-200/90 font-medium">{prod.pccNotes}</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        if (prod.doseMin) setTargetDosePercent(prod.doseMin);
                        setActiveTab('calculator');
                      }}
                      className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      <Calculator size={13} />
                      <span>Usar en Calculadora</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setIsEditingModalOpen(true);
                      }}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800"
                      title="Editar aditivo"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: GESTIÓN Y ALTA DE NUEVOS ADITIVOS */}
        {activeTab === 'manage' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Plus size={20} className="text-emerald-400" /> Dar de Alta Nuevo Aditivo / Texturizante
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Añade nuevos productos técnicos a tu catálogo o modifica las dosis de referencia existentes.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    familyId: 1,
                    doseUnit: '%',
                    doseMin: 0.5,
                    doseMax: 1
                  });
                  setIsEditingModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Formulario Alta Rápida</span>
              </button>
            </div>

            {/* Lista de Productos para Administración */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                Catálogo Activo ({products.length} productos registrados):
              </span>

              <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {products.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-2xl hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                        F{prod.familyId}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white uppercase font-mono truncate">{prod.name}</h4>
                        <span className="text-[10px] text-slate-400 block">{prod.familyName} · Dosis: {prod.doseReferenceRaw}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setIsEditingModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>

                      {prod.isCustom && (
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: PROTOCOLO PCC Y GUÍA TÉCNICA DE PECTINAS */}
        {activeTab === 'protocol' && (
          <div className="space-y-6 animate-fadeIn">
            {/* LOS 4 PUNTOS CRÍTICOS DE CONTROL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block border border-emerald-500/30">
                  PCC 1
                </span>
                <h3 className="text-sm font-black text-white uppercase">Precisión Absoluta en Pesaje</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Utilizar siempre gramera digital de precisión (0,01 g). Variaciones de ±0,5 g en xantana o agar-agar alteran irreversiblemente la viscosidad y el ritmo de servicio en el pase.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block border border-emerald-500/30">
                  PCC 2
                </span>
                <h3 className="text-sm font-black text-white uppercase">Dispersión Térmica y Mecánica</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Mezclar en seco con azúcar/sal o turbinar a alta velocidad con túrmix en la base acuosa para evitar grumos por hidratación superficial prematura (efecto sellado).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block border border-emerald-500/30">
                  PCC 3
                </span>
                <h3 className="text-sm font-black text-white uppercase">Control del Rango de pH</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Verificar la acidez del líquido base. Los cítricos y medios de alto pH inhiben la gelificación de pectinas HM y gelatinas clásicas, requiriendo sales tampones (citrato).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block border border-emerald-500/30">
                  PCC 4
                </span>
                <h3 className="text-sm font-black text-white uppercase">Sinéresis y Congelación</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Evaluar si la estructura pierde agua al descongelar o reposar. Utilizar gelificantes congelables (Freeze Veggie Gel, Pectina Fruit NH) cuando la producción se mantenga a -18 °C.
                </p>
              </div>
            </div>

            {/* GUÍA DE SELECCIÓN RÁPIDA DE PECTINAS */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
                🌳 Guía de Selección Rápida de Pectinas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-black uppercase text-amber-400 block">
                    Alto Azúcar (&gt;50%) + Medio Ácido (pH 3,1-3,5)
                  </span>
                  <p className="text-xs text-slate-300">
                    <strong>Pectinas HM (Alto Metoxilo):</strong> Rapid Set (mermeladas firmes), Medium Rapid Set (insertos horneables), Jaune (pâtes de fruits y gominolas).
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-black uppercase text-emerald-400 block">
                    Bajo Azúcar / Presencia de Calcio / pH Neutro
                  </span>
                  <p className="text-xs text-slate-300">
                    <strong>Pectinas LMA (Bajo Metoxilo):</strong> Low Sugar (dietéticas), 325 NH 95 (lácteos/fruta), Fruit NH (glaseados congelables), Acid Free (flanes), Nappage X58 (chocolate).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDICIÓN Y ALTA DE ADITIVO */}
        {isEditingModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[150] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black uppercase text-white font-mono">
                  {editingProduct?.id ? 'Editar Aditivo' : 'Dar de Alta Aditivo'}
                </h3>
                <button
                  onClick={() => setIsEditingModalOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nombre del Aditivo / Texturizante:</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-emerald-500"
                    placeholder="ej: Goma Xantana Especial"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Familia Técnica:</label>
                  <select
                    value={editingProduct?.familyId || 1}
                    onChange={e => setEditingProduct({ ...editingProduct, familyId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white outline-none"
                  >
                    {TEXTURIZER_FAMILIES.map(f => (
                      <option key={f.id} value={f.id}>
                        Familia {f.id}: {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Dosis Mínima (% o g/kg):</label>
                    <input
                      type="number"
                      step="any"
                      value={editingProduct?.doseMin ?? ''}
                      onChange={e => setEditingProduct({ ...editingProduct, doseMin: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white"
                      placeholder="0.3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Dosis Máxima (% o g/kg):</label>
                    <input
                      type="number"
                      step="any"
                      value={editingProduct?.doseMax ?? ''}
                      onChange={e => setEditingProduct({ ...editingProduct, doseMax: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white"
                      placeholder="0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Texto Dosis Referencia Raw:</label>
                  <input
                    type="text"
                    value={editingProduct?.doseReferenceRaw || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, doseReferenceRaw: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    placeholder="ej: 0,3 % (3 g/kg)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Modo de Activación / Técnica:</label>
                  <textarea
                    rows={2}
                    value={editingProduct?.activationMode || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, activationMode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-serif"
                    placeholder="Describir disolución, calentamiento o batido..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Aplicación Gastronómica:</label>
                  <textarea
                    rows={2}
                    value={editingProduct?.application || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, application: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-serif"
                    placeholder="Salsas, aires, geles..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Observaciones & PCC:</label>
                  <input
                    type="text"
                    value={editingProduct?.pccNotes || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, pccNotes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    placeholder="ej: PCC 1: Pesaje con gramera 0,01g"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
