// Utilidades compartidas de seguridad para Express (server.ts) y Vercel Serverless Functions (api/gemini/*)

export interface RateLimitEntry {
  timestamps: number[];
  violations: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_STORE_ENTRIES = 5000;

const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const AI_RATE_LIMIT_MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT_PER_MIN || 20);
const BURST_BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos tras exceso repetido

export function logSecurityEvent(
  eventType:
    | 'CORS_REJECTED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'BURST_ANOMALY_DETECTED'
    | 'INVALID_PAYLOAD'
    | 'METHOD_NOT_ALLOWED'
    | 'API_ERROR',
  details: Record<string, string | number | boolean | undefined>
): void {
  // Nunca incluir tokens, claves, contraseñas ni cuerpos completos en logs
  const safePayload = {
    ts: new Date().toISOString(),
    level: 'SECURITY',
    event: eventType,
    ...details,
  };
  console.warn(JSON.stringify(safePayload));
}

export function getClientIp(req: any): string {
  const xff = req?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim().slice(0, 64);
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return String(xff[0]).trim().slice(0, 64);
  }
  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim().slice(0, 64);
  }
  return String(req?.ip || req?.socket?.remoteAddress || 'unknown').slice(0, 64);
}

export function buildCspHeader(isStandaloneProd: boolean): string {
  const frameAncestors = isStandaloneProd
    ? "'none'"
    : "'self' https://aistudio.google.com https://*.google.com";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${frameAncestors}`,
    // Tailwind CDN + Google Identity/Firebase SDK necesitan 'unsafe-inline' por la configuración actual de index.html
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://apis.google.com https://accounts.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://drive.google.com https://*.googleusercontent.com https://i.ytimg.com https://vumbnail.com https://www.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com",
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://drive.google.com",
    "form-action 'self'",
  ].join('; ');
}

export function applySecurityHeaders(
  req: any,
  res: any,
  options: { isStandaloneProd?: boolean; noStore?: boolean } = {}
): void {
  const isStandalone = Boolean(options.isStandaloneProd);
  res.setHeader('Content-Security-Policy', buildCspHeader(isStandalone));
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', isStandalone ? 'DENY' : 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (options.noStore) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
}

export function getAllowedOrigins(req: any): Set<string> {
  const allowed = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
  ]);

  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  envOrigins.forEach((o) => allowed.add(o));

  if (process.env.APP_URL) {
    allowed.add(process.env.APP_URL.trim().replace(/\/$/, ''));
  }
  if (process.env.VERCEL_URL) {
    allowed.add(`https://${process.env.VERCEL_URL.trim()}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`);
  }

  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (typeof host === 'string' && host.trim()) {
    const cleanHost = host.split(',')[0].trim();
    const proto = req?.headers?.['x-forwarded-proto'] === 'https' || !cleanHost.startsWith('localhost')
      ? 'https'
      : 'http';
    allowed.add(`${proto}://${cleanHost}`);
    allowed.add(`http://${cleanHost}`);
  }

  return allowed;
}

/**
 * Valida CORS sin permitir '*' con credenciales y rechaza orígenes externos no autorizados con 403.
 */
export function enforceStrictCors(req: any, res: any, endpoint: string): boolean {
  const origin = req?.headers?.origin;
  if (!origin || typeof origin !== 'string') {
    // Petición same-origin sin cabecera Origin o curl directo
    return true;
  }

  const normalizedOrigin = origin.trim().replace(/\/$/, '');
  const allowedOrigins = getAllowedOrigins(req);

  const isVercelPreview =
    /^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin) &&
    Boolean(process.env.VERCEL);

  if (!allowedOrigins.has(normalizedOrigin) && !isVercelPreview) {
    logSecurityEvent('CORS_REJECTED', {
      endpoint,
      origin: normalizedOrigin.slice(0, 120),
      ip: getClientIp(req),
    });
    res.status(403).json({ error: 'Origen no autorizado por política CORS.' });
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  return true;
}

/**
 * Rate limiter con ventana deslizante y detección de ráfagas anómalas por IP.
 */
export function enforceRateLimit(req: any, res: any, endpoint: string): boolean {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${ip}:${endpoint}`;

  if (rateLimitStore.size > MAX_STORE_ENTRIES) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.timestamps.every((ts) => now - ts > AI_RATE_LIMIT_WINDOW_MS) && (!v.blockedUntil || v.blockedUntil < now)) {
        rateLimitStore.delete(k);
      }
    }
  }

  const entry: RateLimitEntry = rateLimitStore.get(key) || { timestamps: [], violations: 0 };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterSec = Math.ceil((entry.blockedUntil - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.setHeader('X-RateLimit-Limit', String(AI_RATE_LIMIT_MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', '0');
    logSecurityEvent('BURST_ANOMALY_DETECTED', { endpoint, ip, retryAfterSec });
    res.status(429).json({ error: 'Demasiadas solicitudes consecutivas. Inténtalo de nuevo en unos minutos.' });
    return false;
  }

  entry.timestamps = entry.timestamps.filter((ts) => now - ts < AI_RATE_LIMIT_WINDOW_MS);

  if (entry.timestamps.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    entry.violations += 1;
    if (entry.violations >= 3) {
      entry.blockedUntil = now + BURST_BLOCK_DURATION_MS;
    }
    rateLimitStore.set(key, entry);

    const oldest = entry.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((AI_RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    res.setHeader('X-RateLimit-Limit', String(AI_RATE_LIMIT_MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', '0');
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint, ip, violations: entry.violations });
    res.status(429).json({ error: 'Límite de peticiones excedido. Espera un momento antes de volver a intentarlo.' });
    return false;
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, AI_RATE_LIMIT_MAX_REQUESTS - entry.timestamps.length);
  res.setHeader('X-RateLimit-Limit', String(AI_RATE_LIMIT_MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + AI_RATE_LIMIT_WINDOW_MS) / 1000)));
  return true;
}

/**
 * Sanea y valida cadenas de texto de entrada en servidor para evitar abuso de prompt/DoS.
 */
export function sanitizePromptText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001F\u007F<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeStringArray(raw: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const clean = sanitizePromptText(item, maxItemLen);
    if (clean.length > 0) {
      out.push(clean);
    }
    if (out.length >= maxItems) break;
  }
  return out;
}

export function extractSafeHttpStatus(err: unknown): number {
  const status = Number((err as any)?.status || (err as any)?.code);
  if (status >= 400 && status < 500) return status;
  if (status >= 500 && status < 600) return status;
  return 500;
}

export function sendSafeServerError(res: any, endpoint: string, err: unknown): void {
  const status = extractSafeHttpStatus(err);
  logSecurityEvent('API_ERROR', {
    endpoint,
    status,
    errorType: err instanceof Error ? err.name : 'UnknownError',
  });
  const message =
    status === 429
      ? 'El servicio de análisis está temporalmente saturado. Inténtalo en unos segundos.'
      : 'No se pudo completar la solicitud en este momento.';
  res.status(status).json({ error: message });
}
