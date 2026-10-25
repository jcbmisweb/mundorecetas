import React, { useState } from 'react';
import { VideoLink } from '../types';
import { getVideoPlatformInfo } from '../lib/videoUtils';
import { Plus, Trash2, ExternalLink, Video, Play, Sparkles } from 'lucide-react';

interface VideoManagerInputProps {
  videos: VideoLink[];
  onChange: (videos: VideoLink[]) => void;
  label?: string;
  helperText?: string;
}

export const VideoManagerInput: React.FC<VideoManagerInputProps> = ({
  videos,
  onChange,
  label = 'Vídeos Técnicos de la Elaboración',
  helperText = 'Añade uno o varios enlaces a vídeos (YouTube, Vimeo, Google Drive, enlaces directos, etc.) para esta elaboración.'
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddVideo = () => {
    const cleanUrl = newUrl.trim();
    if (!cleanUrl) return;

    const newVideo: VideoLink = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      url: cleanUrl
    };

    onChange([...videos, newVideo]);
    setNewUrl('');
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleRemove = (index: number) => {
    const updated = videos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdate = (index: number, field: keyof VideoLink, value: string) => {
    const updated = [...videos];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Video size={13} className="text-indigo-600" />
            <span>{label}</span>
            {videos.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-bold">
                {videos.length}
              </span>
            )}
          </label>
          {helperText && (
            <p className="text-[9px] text-slate-400 mt-0.5">{helperText}</p>
          )}
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 w-fit"
          >
            <Plus size={14} />
            <span>Añadir Vídeo</span>
          </button>
        )}
      </div>

      {/* Formulario para añadir nuevo vídeo */}
      {showAddForm && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-600" />
              Nuevo Enlace de Vídeo
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewUrl('');
                setNewTitle('');
              }}
              className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7">
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVideo();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... o enlace al vídeo"
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVideo();
                  }
                }}
                placeholder="Título opcional (ej: Corte en juliana)"
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={!newUrl.trim()}
              onClick={handleAddVideo}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Guardar Vídeo</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de vídeos existentes */}
      {videos.length > 0 ? (
        <div className="space-y-2">
          {videos.map((vid, idx) => {
            const platform = getVideoPlatformInfo(vid.url);
            return (
              <div
                key={vid.id || idx}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Play size={13} className="ml-0.5 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={vid.title || ''}
                        onChange={e => handleUpdate(idx, 'title', e.target.value)}
                        placeholder={`Vídeo ${idx + 1} (Añade título opcional)`}
                        className="text-xs font-black uppercase text-slate-800 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors w-full max-w-sm"
                      />
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {platform.label}
                      </span>
                    </div>
                    <input
                      type="url"
                      value={vid.url}
                      onChange={e => handleUpdate(idx, 'url', e.target.value)}
                      className="text-[10px] font-mono text-slate-500 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors w-full truncate"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Probar enlace"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Eliminar vídeo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Añadir otro vídeo a esta elaboración</span>
            </button>
          )}
        </div>
      ) : !showAddForm ? (
        <div
          onClick={() => setShowAddForm(true)}
          className="p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-300 transition-all group"
        >
          <p className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5">
            <Plus size={13} />
            <span>Sin vídeos aún. Haz clic para añadir el primer vídeo de esta elaboración.</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};
