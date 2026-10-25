import React from 'react';
import { AppSettings, AppUser } from '../types';
import { 
  ArrowRight, 
  BookOpen, 
  ShieldAlert, 
  CalendarDays, 
  Database,
  UtensilsCrossed
} from 'lucide-react';

interface LandingPageProps {
  settings: AppSettings;
  appUser: AppUser | null;
  onEnter: () => void;
  onEnterDemo?: () => void;
  onOpenConfig?: () => void;
  onLoginSuccess?: (user: AppUser) => void;
}

const FEATURES = [
  {
    icon: <BookOpen className="text-amber-400" size={32} />,
    title: "Fichas Técnicas",
    desc: "Crea recetas compuestas con escandallos precisos, fotos y control de costes."
  },
  {
    icon: <ShieldAlert className="text-red-400" size={32} />,
    title: "Control Alérgenos",
    desc: "Detección automática de alérgenos basada en la base de datos de ingredientes."
  },
  {
    icon: <CalendarDays className="text-blue-400" size={32} />,
    title: "Planificador de Menús",
    desc: "Organiza servicios completos y genera órdenes de trabajo al instante."
  },
  {
    icon: <Database className="text-emerald-400" size={32} />,
    title: "Base de Datos",
    desc: "Gestión centralizada de materias primas y productos de cocina."
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnter 
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

      {/* Header / Navbar */}
      <nav className="relative z-10 w-full px-6 py-6 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
           <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-400">
              <UtensilsCrossed size={24} />
           </div>
           <div className="text-left">
              <h2 className="text-base font-serif font-bold text-white leading-none tracking-wide">Recetario Profesional</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Gestión Gastronómica</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnter}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#0F172A" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#0F172A" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#0F172A" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#0F172A" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Acceso Google</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 py-16 md:py-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-fade-in-up">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-sm shadow-amber-900/20">
              <UtensilsCrossed size={12} /> Sistema Seguro de Cocina v2.0
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
            Digitaliza tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Cocina</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            La plataforma definitiva para gestión gastronómica profesional. 
            Crea fichas técnicas, controla alérgenos y planifica servicios con acceso exclusivo mediante Google.
          </p>

          <div className="flex items-center justify-center">
            <button 
              onClick={onEnter}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 rounded-xl font-bold text-lg hover:from-amber-300 hover:to-amber-500 transition-all hover:scale-105 shadow-xl shadow-amber-500/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#0F172A" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#0F172A" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#0F172A" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#0F172A" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Entrar con Google</span>
              <div className="bg-slate-950 rounded-full p-1 group-hover:translate-x-1 transition-transform text-amber-400">
                 <ArrowRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto px-4">
          {FEATURES.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:bg-slate-800/50 hover:border-amber-500/30 transition-all duration-300 group hover:-translate-y-2 shadow-lg"
            >
              <div className="bg-slate-950 w-14 h-14 rounded-xl flex items-center justify-center mb-4 border border-white/5 group-hover:border-amber-500/20 shadow-inner transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-serif">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 py-8 flex flex-col items-center border-t border-white/5 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sistema de Gestión Gastronómica Profesional. Acceso restringido y seguro.</p>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
