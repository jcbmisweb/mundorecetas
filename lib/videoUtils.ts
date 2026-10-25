import QRCode from 'qrcode';
import { VideoLink } from '../types';

export interface VideoPlatformInfo {
  platform: 'youtube' | 'vimeo' | 'drive' | 'tiktok' | 'instagram' | 'general';
  label: string;
  embedUrl?: string;
}

export function normalizeVideos(videos?: any, singleVideoUrl?: string): VideoLink[] {
  const result: VideoLink[] = [];

  const addLink = (url: string, title?: string, id?: string) => {
    const cleanUrl = (url || '').trim();
    if (!cleanUrl) return;
    // Prevent duplicate URLs in normalized list
    if (result.some(v => v.url.toLowerCase() === cleanUrl.toLowerCase())) return;
    result.push({
      id: id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: (title || '').trim(),
      url: cleanUrl
    });
  };

  if (Array.isArray(videos)) {
    videos.forEach((item, idx) => {
      if (typeof item === 'string') {
        addLink(item, undefined, `vid_${idx}`);
      } else if (item && typeof item === 'object' && item.url) {
        addLink(item.url, item.title, item.id || `vid_${idx}`);
      }
    });
  } else if (typeof videos === 'string' && videos.trim()) {
    // Might be newline or comma separated
    const parts = videos.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    parts.forEach((p, idx) => addLink(p, undefined, `vid_${idx}`));
  }

  // Backwards compatibility for single videoUrl or sourceUrl
  if (singleVideoUrl && typeof singleVideoUrl === 'string' && singleVideoUrl.trim()) {
    addLink(singleVideoUrl.trim(), undefined, 'vid_legacy');
  }

  return result;
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
  if (!text) return '';
  if (qrCache.has(text)) {
    return qrCache.get(text)!;
  }
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff'
      }
    });
    qrCache.set(text, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn('Failed to generate QR code for', text, err);
    return '';
  }
}
