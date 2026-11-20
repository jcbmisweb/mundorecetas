import React, { useState } from 'react';
import { X, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { loginWithGoogle } from '../firebase';

interface EmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AppUser) => void;
  defaultEmail?: string;
}

export const EmailLoginModal: React.FC<EmailLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">Acceso Seguro</h2>
              <p className="text-xs text-slate-400">Autenticación verificada con Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed">
            Por motivos de seguridad, el acceso sin contraseña ha sido deshabilitado. Inicia sesión con tu cuenta verificada de Google.
          </p>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>Continuar con Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
