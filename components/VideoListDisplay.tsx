import React, { useState, useEffect, useMemo } from 'react';
import { VideoLink } from '../types';
import { normalizeVideos, getVideoPlatformInfo, generateQrCodeDataUrl } from '../lib/videoUtils';
import { Play, ExternalLink, Video, X, QrCode } from 'lucide-react';

interface VideoListDisplayProps {
  videos?: (string | VideoLink)[];
  legacyUrl?: string;
  title?: string;
  variant?: 'subRecipe' | 'recipe';
  showQrInScreen?: boolean;
}

export const VideoListDisplay: React.FC<VideoListDisplayProps> = ({
  videos,
  legacyUrl,
  title,
  variant = 'subRecipe',
  showQrInScreen = false
}) => {
  const normalized = useMemo(() => normalizeVideos(videos, legacyUrl), [videos, legacyUrl]);
  const [activeEmbed, setActiveEmbed] = useState<{ url: string; title: string } | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    normalized.forEach(v => {
      if (v.url) {
        generateQrCodeDataUrl(v.url).then(qr => {
          if (isMounted && qr) {
            setQrCodes(prev => (prev[v.url] === qr ? prev : { ...prev, [v.url]: qr }));
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [normalized]);

  if (!normalized || normalized.length === 0) {
    return null;
  }

  const isSubRecipe = variant === 'subRecipe';

  return (
    <div className={`video-list-container my-3 ${isSubRecipe ? 'p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 print:bg-white print:border-slate-300 print:p-2 print:rounded-lg' : 'p-4 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-indigo-100 print:border-slate-200">
        <div className="flex items-center gap-1.5">
          <Video size={13} className="text-indigo-600 print:text-black shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-900 print:text-black">
            {title || (isSubRecipe ? 'Vídeos Técnicos de la Elaboración' : 'Vídeos y Enlaces del Plato')}
          </span>
          <span className="text-[8px] font-bold bg-indigo-200/70 text-indigo-800 print:hidden px-1.5 py-0.2 rounded-full">
            {normalized.length} {normalized.length === 1 ? 'vídeo' : 'vídeos'}
          </span>
        </div>
        <span className="hidden print:inline-block text-[7px] font-bold text-slate-500 uppercase tracking-widest">
          Escanea el código QR o pulsa el enlace
        </span>
      </div>

      {/* Grid of videos */}
      <div className={`grid gap-2.5 ${normalized.length > 1 ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2' : 'grid-cols-1'}`}>
        {normalized.map((vid, idx) => {
          const info = getVideoPlatformInfo(vid.url);
          const qr = qrCodes[vid.url];
          const displayTitle = vid.title || (normalized.length > 1 ? `Vídeo ${idx + 1}` : 'Ver Vídeo Demostrativo');

          return (
            <div
              key={vid.id || idx}
              className="bg-white rounded-xl p-2.5 border border-indigo-100/80 shadow-xs print:shadow-none print:border print:border-slate-300 print:p-2 flex flex-col justify-between"
            >
              {/* Contenido en Pantalla / Ficha Interactiva */}
              <div className="print:hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Play size={13} className="ml-0.5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate leading-tight">
                        {displayTitle}
                      </p>
                      <span className="inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 mt-0.5">
                        {info.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {info.embedUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveEmbed({ url: info.embedUrl!, title: displayTitle })}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ver en reproductor integrado"
                      >
                        <Play size={10} />
                        <span>Reproducir</span>
                      </button>
                    )}
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      title="Abrir enlace original en nueva pestaña"
                    >
                      <ExternalLink size={10} />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* URL discreta en pantalla */}
                <div className="mt-1.5 pt-1 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span className="truncate pr-2">{vid.url}</span>
                  {showQrInScreen && qr && (
                    <img src={qr} alt="QR" className="w-8 h-8 rounded border border-slate-200 shrink-0" />
                  )}
                </div>
              </div>

              {/* Contenido en IMPRESIÓN (Visible al imprimir y en PDF) */}
              <div className="hidden print:flex print:items-center print:justify-between print:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                      ▶
                    </span>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                      {displayTitle}
                    </p>
                    <span className="text-[7px] font-black text-slate-500 uppercase px-1 border border-slate-300 rounded">
                      {info.label}
                    </span>
                  </div>
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-mono text-indigo-900 underline block break-all leading-tight"
                  >
                    {vid.url}
                  </a>
                </div>

                {qr ? (
                  <div className="flex flex-col items-center shrink-0">
                    <img
                      src={qr}
                      alt={`QR ${displayTitle}`}
                      className="w-14 h-14 object-contain border border-slate-400 p-0.5 rounded bg-white"
                    />
                    <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                      Escanear
                    </span>
                  </div>
                ) : (
                  <div className="w-14 h-14 border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <QrCode size={18} className="text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para reproducir vídeo incrustado si se clica 'Reproducir' */}
      {activeEmbed && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn no-print"
          onClick={() => setActiveEmbed(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-3xl w-full overflow-hidden border border-slate-700 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-indigo-400 fill-current" />
                <h3 className="text-sm font-black uppercase tracking-tight text-white">{activeEmbed.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmbed(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={activeEmbed.url}
                title={activeEmbed.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-3 bg-slate-900 text-center">
              <button
                type="button"
                onClick={() => setActiveEmbed(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cerrar Reproductor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
