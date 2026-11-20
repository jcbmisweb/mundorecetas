export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_DOC_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
] as const;

export interface FileValidationOptions {
  allowedMimeTypes?: readonly string[];
  allowedExtensions?: readonly string[];
  maxSizeBytes?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_DATA_PDF_REGEX = /^data:application\/pdf;base64,[A-Za-z0-9+/=\s]+$/i;

/**
 * Valida y sanea URLs externas para evitar esquemas peligrosos (javascript:, data:, vbscript:, file:).
 * Solo permite http: y https:.
 */
export function sanitizeExternalUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Bloquear caracteres de control o espacios ocultos antes del esquema
  const cleaned = trimmed.replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return '';

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '';
  } catch {
    // Si no tiene esquema pero parece un dominio válido (ej: www.ejemplo.com)
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/.test(cleaned)) {
      try {
        const withHttps = new URL(`https://${cleaned}`);
        if (withHttps.protocol === 'https:') {
          return withHttps.toString();
        }
      } catch {
        return '';
      }
    }
    return '';
  }
}

/**
 * Valida rutas/URLs para etiquetas <img src>: permite https/http, rutas locales relativas (/...)
 * o data:image/(png|jpeg|jpg|webp|gif);base64. Bloquea explicitamente SVG embebidos y scripts.
 */
export function sanitizeImageSrc(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return '';

  if (SAFE_DATA_IMAGE_REGEX.test(cleaned)) {
    return cleaned;
  }

  // Rutas relativas internas (ej. /assets/...) sin // (protocol-relative open redirect)
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) {
    return cleaned;
  }

  return sanitizeExternalUrl(cleaned);
}

/**
 * Valida enlaces de infografía técnica (imagen segura, URL http/https o data:application/pdf).
 */
export function sanitizeInfographicSrc(raw?: string | null): {
  safeSrc: string;
  isSafeImage: boolean;
  isSafePdf: boolean;
} {
  if (!raw || typeof raw !== 'string') {
    return { safeSrc: '', isSafeImage: false, isSafePdf: false };
  }
  const cleaned = raw.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) {
    return { safeSrc: '', isSafeImage: false, isSafePdf: false };
  }

  const safeImg = sanitizeImageSrc(cleaned);
  if (safeImg) {
    return { safeSrc: safeImg, isSafeImage: true, isSafePdf: false };
  }

  if (SAFE_DATA_PDF_REGEX.test(cleaned)) {
    return { safeSrc: cleaned, isSafeImage: false, isSafePdf: true };
  }

  return { safeSrc: '', isSafeImage: false, isSafePdf: false };
}

/**
 * Valida tipo MIME, extensión y tamaño máximo de archivos subidos por el usuario.
 */
export function validateUploadedFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const maxSizeBytes = options.maxSizeBytes ?? 15 * 1024 * 1024; // 15 MB por defecto
  if (!file || typeof file.size !== 'number') {
    return { valid: false, error: 'Archivo no válido.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío.' };
  }
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `El archivo supera el tamaño máximo permitido (${maxMb} MB).` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    if (!options.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Extensión .${ext || '?'} no permitida. Formatos válidos: ${options.allowedExtensions.join(', ')}.`,
      };
    }
  }

  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const mime = (file.type || '').toLowerCase();
    // Bloqueo explícito de SVG o HTML disfrazados
    if (mime.includes('svg') || mime.includes('html') || ext === 'svg' || ext === 'html' || ext === 'htm') {
      return { valid: false, error: 'Por seguridad, no se permiten archivos SVG ni HTML.' };
    }
    if (mime && !options.allowedMimeTypes.includes(mime)) {
      return { valid: false, error: `Tipo de archivo no permitido (${mime}).` };
    }
  }

  return { valid: true };
}

/**
 * Neutraliza inyección de fórmulas en exportación CSV (Excel/LibreOffice) y escapa comillas RFC-4180.
 */
export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (neutralized.includes(',') || neutralized.includes('"') || neutralized.includes('\n')) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

/**
 * Extrae de forma segura un objeto de configuración de Firebase desde texto o JSON pegado,
 * SIN usar eval() ni new Function().
 */
export function parseFirebaseConfigSnippet(rawText: string): Record<string, string> {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('El texto de configuración está vacío.');
  }
  if (rawText.length > 10000) {
    throw new Error('El fragmento de configuración supera el tamaño máximo permitido.');
  }

  const ALLOWED_KEYS = [
    'apiKey',
    'authDomain',
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'measurementId',
    'firestoreDatabaseId',
  ] as const;

  // 1. Intentar JSON estricto primero
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const safeObj: Record<string, string> = {};
      for (const key of ALLOWED_KEYS) {
        if (typeof parsed[key] === 'string' && parsed[key].trim()) {
          safeObj[key] = parsed[key].trim();
        }
      }
      if (safeObj.apiKey && safeObj.projectId) {
        return safeObj;
      }
    }
  } catch {
    // Continuar al parser de snippet JS seguro sin ejecución de código
  }

  // 2. Extracción declarativa por clave-valor (sin eval ni new Function)
  const extracted: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"'\\n\\r]{1,500})["']`);
    const match = rawText.match(regex);
    if (match && match[1]) {
      extracted[key] = match[1].trim();
    }
  }

  if (!extracted.apiKey || !extracted.projectId) {
    throw new Error("No se encontraron 'apiKey' y 'projectId' válidos en el fragmento proporcionado.");
  }

  return extracted;
}
