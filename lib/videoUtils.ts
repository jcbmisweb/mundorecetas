import QRCode from 'qrcode';
import { VideoLink } from '../types';

export interface VideoPlatformInfo {
  platform: 'youtube' | 'vimeo' | 'drive' | 'tiktok' | 'instagram' | 'general';
  label: string;
  embedUrl?: string;
}

/**
 * Valida y limpia una URL de vídeo o recurso web.
 * Descarta valores inválidos o residuos de IA/JSON como "[]", "{}", "null", "undefined", "none", etc.
 * Normaliza enlaces sin protocolo (ej: "www.youtube.com/..." o "youtu.be/...") para incluir "https://".
 */
export function sanitizeVideoUrl(rawUrl: any): string | null {
  if (!rawUrl) return null;
  if (typeof rawUrl !== 'string') return null;

  let trimmed = rawUrl.trim();

  // Descartar placeholders comunes o artefactos de serialización JSON
  const invalidPlaceholders = new Set([
    '[]', '[ ]', '[""]', "['']", '{}', '{ }',
    'null', 'undefined', 'none', 'no', 'n/a', 'na', '-', '--', 'false', 'true',
    'sin video', 'sin vídeo', 'no video', 'sin enlace', 'no aplica', 'vacio', 'vacío'
  ]);

  if (invalidPlaceholders.has(trimmed.toLowerCase())) {
    return null;
  }

  // Quitar corchetes, comillas o envoltorios accidentales: [url], "url", <url>
  trimmed = trimmed.replace(/^[\["'\<\(]+|[\]"'\>\)]+$/g, '').trim();

  if (!trimmed || invalidPlaceholders.has(trimmed.toLowerCase())) {
    return null;
  }

  // Si no tiene protocolo pero empieza con dominios o prefijos típicos
  if (!/^https?:\/\//i.test(trimmed)) {
    if (
      /^(www\.|youtu\.be|youtube\.com|vimeo\.com|drive\.google\.com|instagram\.com|tiktok\.com)/i.test(trimmed) ||
      (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed) && !trimmed.includes(' '))
    ) {
      trimmed = `https://${trimmed}`;
    } else {
      return null;
    }
  }

  // Validar sintaxis con constructor URL nativo
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Requiere hostname con al menos un punto (ej: youtube.com)
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function normalizeVideos(videos?: any, singleVideoUrl?: string): VideoLink[] {
  const result: VideoLink[] = [];

  const addLink = (rawUrl: any, rawTitle?: string, fallbackId?: string) => {
    const cleanUrl = sanitizeVideoUrl(rawUrl);
    if (!cleanUrl) return;

    // Prevent duplicate URLs in normalized list
    if (result.some(v => v.url.toLowerCase() === cleanUrl.toLowerCase())) return;

    result.push({
      id: fallbackId || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: (rawTitle || '').trim(),
      url: cleanUrl
    });
  };

  // Manejar si videos viene como string JSON (ej: "[]" o "[{...}]")
  let parsedVideos = videos;
  if (typeof videos === 'string') {
    const trimmed = videos.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsedVideos = JSON.parse(trimmed);
      } catch {
        parsedVideos = trimmed;
      }
    }
  }

  if (Array.isArray(parsedVideos)) {
    parsedVideos.forEach((item, idx) => {
      if (typeof item === 'string') {
        addLink(item, undefined, `vid_${idx}`);
      } else if (item && typeof item === 'object' && item.url) {
        addLink(item.url, item.title, item.id || `vid_${idx}`);
      }
    });
  } else if (typeof parsedVideos === 'string' && parsedVideos.trim()) {
    // Podría ser texto separado por saltos de línea o comas
    const parts = parsedVideos.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    parts.forEach((p, idx) => addLink(p, undefined, `vid_${idx}`));
  }

  // Backwards compatibility for single videoUrl o sourceUrl
  if (singleVideoUrl) {
    addLink(singleVideoUrl, undefined, 'vid_legacy');
  }

  return result;
}

export function hasValidVideos(videos?: any, singleVideoUrl?: string): boolean {
  return normalizeVideos(videos, singleVideoUrl).length > 0;
}

export function getVideoPlatformInfo(url: string): VideoPlatformInfo {
  if (!url) {
    return { platform: 'general', label: 'Enlace' };
  }

  const trimmed = url.trim();

  // YouTube matchers
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      platform: 'youtube',
      label: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    };
  }

  // Vimeo matchers
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      platform: 'vimeo',
      label: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`
    };
  }

  // Google Drive
  if (/drive\.google\.com/i.test(trimmed)) {
    return { platform: 'drive', label: 'Google Drive' };
  }

  // TikTok
  if (/tiktok\.com/i.test(trimmed)) {
    return { platform: 'tiktok', label: 'TikTok' };
  }

  // Instagram
  if (/instagram\.com\/(reel|p)\//i.test(trimmed)) {
    return { platform: 'instagram', label: 'Instagram' };
  }

  return {
    platform: 'general',
    label: 'Vídeo / Web'
  };
}

// In-memory cache for generated QR codes to make rendering instant
const qrCache = new Map<string, string>();

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  const cleanUrl = sanitizeVideoUrl(text);
  if (!cleanUrl) return '';
  if (qrCache.has(cleanUrl)) {
    return qrCache.get(cleanUrl)!;
  }
  try {
    const dataUrl = await QRCode.toDataURL(cleanUrl, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000', // Pure black for crisp scanning on paper & screens
        light: '#ffffff'
      }
    });
    qrCache.set(cleanUrl, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn('Failed to generate QR code for', cleanUrl, err);
    return '';
  }
}
