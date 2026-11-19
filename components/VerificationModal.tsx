import React, { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, ShieldCheck, Save, MessageSquare, Clock, Ban } from 'lucide-react';
import { Recipe } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  recipe: Recipe;
  onClose: () => void;
  onSave: (updates: {
    isVerified: boolean;
    verificationStatus?: 'ok' | 'fail';
    verificationNotes: string;
    verifiedAt?: number;
  }) => Promise<void> | void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  recipe,
  onClose,
  onSave,
}) => {
  const [isVerified, setIsVerified] = useState<boolean>(Boolean(recipe.isVerified));
  const [status, setStatus] = useState<'ok' | 'fail'>(recipe.verificationStatus || 'ok');
  const [notes, setNotes] = useState<string>(recipe.verificationNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVerified(Boolean(recipe.isVerified));
      setStatus(recipe.verificationStatus || 'ok');
      setNotes(recipe.verificationNotes || '');
    }
  }, [isOpen, recipe]);

  if (!isOpen) return null;

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        isVerified,
        verificationStatus: isVerified ? status : undefined,
        verificationNotes: notes.trim(),
        verifiedAt: isVerified ? (recipe.verifiedAt || Date.now()) : undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl border ${
                !isVerified
                  ? 'bg-slate-700/60 border-slate-600 text-slate-300'
                  : status === 'fail'
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              }`}
            >
              {!isVerified ? (
                <ShieldCheck size={20} />
              ) : status === 'fail' ? (
                <ThumbsDown size={20} />
              ) : (
                <ThumbsUp size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wider truncate">
                Verificación y Anotaciones del Profesor
              </h3>
              <p className="text-[11px] text-slate-300 truncate">{recipe.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Selector de resultado de la prueba en cocina */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Resultado de la verificación en cocina
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsVerified(true);
                  setStatus('ok');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isVerified && status === 'ok'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-md scale-[1.02]'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <ThumbsUp size={22} />
                <span className="text-xs font-black uppercase tracking-tight">Fue Bien</span>
                <span
                  className={`text-[9px] font-semibold ${
                    isVerified && status === 'ok' ? 'text-emerald-100' : 'text-emerald-600'
                  }`}
                >
                  Me gusta / Correcta
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerified(true);
                  setStatus('fail');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isVerified && status === 'fail'
                    ? 'bg-rose-600 border-rose-700 text-white shadow-md scale-[1.02]'
                    : 'bg-rose-50/60 border-rose-200 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <ThumbsDown size={22} />
                <span className="text-xs font-black uppercase tracking-tight">Fue Mal</span>
                <span
                  className={`text-[9px] font-semibold ${
                    isVerified && status === 'fail' ? 'text-rose-100' : 'text-rose-600'
                  }`}
                >
                  Falló / Corregir
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsVerified(false)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isVerified
                    ? 'bg-slate-800 border-slate-900 text-white shadow-md scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Ban size={20} />
                <span className="text-xs font-black uppercase tracking-tight">Sin Verificar</span>
                <span
                  className={`text-[9px] font-semibold ${
                    !isVerified ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  Pendiente
                </span>
              </button>
            </div>
          </div>

          {/* Espacio privado de anotaciones del profesor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-indigo-600" />
                <span>Anotaciones del Profesor (Privado)</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                No se muestra al imprimir
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder={
                isVerified && status === 'fail'
                  ? 'Anota exactamente qué falló en esta elaboración (ej: faltó punto de cocción, exceso de sal, crema cortada, revisar gramajes para la próxima práctica)...'
                  : 'Anota observaciones del profesor (ej: qué mejoras se pueden añadir, puntos clave en clase, variaciones recomendadas, valoración del pase)...'
              }
              className={`w-full p-3.5 rounded-2xl border-2 text-sm text-slate-800 outline-none transition-all resize-y ${
                isVerified && status === 'fail'
                  ? 'bg-rose-50/40 border-rose-200 focus:border-rose-500 focus:bg-white'
                  : isVerified && status === 'ok'
                  ? 'bg-emerald-50/40 border-emerald-200 focus:border-emerald-500 focus:bg-white'
                  : 'bg-slate-50 border-slate-200 focus:border-slate-400 focus:bg-white'
              }`}
            />

            {recipe.verifiedAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock size={12} />
                <span>
                  Última verificación: {new Date(recipe.verifiedAt).toLocaleString('es-ES')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleConfirmSave}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              !isVerified
                ? 'bg-slate-800 hover:bg-slate-900'
                : status === 'fail'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Save size={14} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Verificación'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
