import { Product } from '../types';

/**
 * Normaliza una cadena de texto para comparaciones culinarias:
 * quita tildes, signos de puntuación y pasa a mayúsculas.
 */
export const normalizeText = (text: string): string => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const STOP_WORDS = new Set([
  'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'EN', 'PARA', 'POR', 
  'Y', 'O', 'SIN', 'TIPO', 'AL', 'A', 'UN', 'UNA', 'UNOS', 'UNAS'
]);

/**
 * Busca productos existentes en el catálogo que sean similares a un nombre dado.
 * Maneja pequeñas variaciones de una palabra, orden de palabras, faltas o sinónimos.
 */
export const findSimilarProducts = (queryName: string, products: Product[], maxResults = 5): Product[] => {
  if (!queryName || !queryName.trim()) return [];

  const cleanQuery = normalizeText(queryName);
  if (cleanQuery.length < 2) return [];

  const queryWords = cleanQuery.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    const cleanProd = normalizeText(product.name);
    if (!cleanProd) continue;

    // Si es idéntico, no es un "similar", es exacto
    if (cleanProd === cleanQuery) continue;

    let score = 0;

    // 1. Subcadena directa (ej: "ACEITE DE OLIVA" dentro de "ACEITE DE OLIVA VIRGEN")
    if (cleanProd.includes(cleanQuery) || cleanQuery.includes(cleanProd)) {
      score += 70;
    }

    // 2. Coincidencia por palabras clave significativas
    const prodWords = cleanProd.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (queryWords.length > 0 && prodWords.length > 0) {
      let matchedWords = 0;
      for (const qw of queryWords) {
        if (prodWords.some(pw => pw === qw || pw.startsWith(qw) || qw.startsWith(pw))) {
          matchedWords++;
        }
      }

      if (matchedWords > 0) {
        const overlapRatio = matchedWords / Math.max(queryWords.length, prodWords.length);
        score += Math.round(overlapRatio * 60);
      }
    }

    if (score >= 30) {
      scored.push({ product, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.product);
};

/**
 * Extrae la nota culinaria diferencial entre el nombre original del ingrediente
 * y el producto homologado en el catálogo.
 * Ejemplo:
 *   originalName: "(AOVE) ARBEQUINA O PICUAL SUAVE (RESTANTE)"
 *   canonicalName: "ACEITE DE OLIVA VIRGEN EXTRA"
 *   Retorna: "Arbequina o Picual suave (Restante)"
 */
export const extractDifferenceNote = (originalName: string, canonicalName: string): string => {
  if (!originalName || !canonicalName) return '';
  const cleanOrig = originalName.trim();
  const cleanCanon = canonicalName.trim();

  if (cleanOrig.toUpperCase() === cleanCanon.toUpperCase()) return '';

  // Remove common acronyms like (AOVE), (aove), etc.
  let diff = cleanOrig;
  
  // Strip the canonical name words if they appear directly
  const canonTokens = cleanCanon.split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t.toUpperCase()));
  for (const token of canonTokens) {
    const reg = new RegExp(`\\b${token}\\b`, 'gi');
    diff = diff.replace(reg, '');
  }

  // Also remove common abbreviations like (AOVE), AOVE
  diff = diff.replace(/\(?\bAOVE\b\)?/gi, '');
  diff = diff.replace(/\s+/g, ' ').replace(/^[\s,;:\-\(\)]+|[\s,;:\-\(\)]+$/g, '').trim();

  // If the extracted difference is too short or empty, return the clean original name
  if (diff.length >= 2) {
    // Capitalize first letter
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  }
  return cleanOrig;
};
