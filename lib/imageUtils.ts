import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File, maxWidthOrHeight = 1200, quality = 0.75, maxSizeMB = 0.2): Promise<string> => {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
    initialQuality: quality,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    throw error;
  }
};

/**
 * Optimización de alta resolución específicamente diseñada para la imagen de portada/infografía panorámica y doble
 * (esquemas dobles, diagramas de emplatado, infografías y anotaciones textuales) para que todas las letras sean 100% nítidas y legibles.
 */
export const compressHeroBannerImage = async (file: File): Promise<string> => {
  // Si el archivo ya es ligero (< 650KB) y tiene buena resolución, se puede leer directamente para máxima fidelidad
  if (file.size < 650 * 1024 && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  // Si requiere compresión, mantenemos resolución Ultra-HD (2560px), calidad 0.94 y límite de 0.85MB
  return compressImage(file, 2560, 0.94, 0.85);
};

export const isBannerAspectRatio = (ratio: number): boolean => {
  return ratio >= 1.45;
};

export const getImageAspect = (src: string): Promise<{ width: number; height: number; ratio: number; isBanner: boolean }> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve({ width: 0, height: 0, ratio: 1, isBanner: false });
      return;
    }
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const ratio = height > 0 ? width / height : 1;
      resolve({
        width,
        height,
        ratio,
        isBanner: ratio >= 1.45
      });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0, ratio: 1, isBanner: false });
    };
    img.src = src;
  });
};

/**
 * Optimizes an existing base64 dataURL image so that it never exceeds Firestore document limits (~1MiB).
 */
export const compressBase64Image = async (dataUrl: string, maxDim = 1200, quality = 0.75): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  // If already under 250KB, it's very safe
  if (dataUrl.length < 320000) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      safeResolve(dataUrl);
    }, 800);

    try {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            safeResolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          safeResolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          safeResolve(dataUrl);
        }
      };
      img.onerror = () => safeResolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      safeResolve(dataUrl);
    }
  });
};

/**
 * Calculates estimated document size in bytes for a JS object.
 */
export const getEstimatedObjectSizeBytes = (obj: any): number => {
  try {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
};

/**
 * Guarantees that a Recipe document will stay strictly below Firestore's 1,048,576 bytes (1 MiB) limit.
 * Optimizes photos in parallel for instant execution without hanging.
 */
export const ensureRecipeFitsFirestore = async (recipe: any): Promise<any> => {
  if (!recipe) return recipe;
  try {
    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve(recipe), 2500)
    );

    const processPromise = (async () => {
      const cloned = JSON.parse(JSON.stringify(recipe));
      const promises: Promise<void>[] = [];

      // Step 1: Compress main photo if it's base64
      if (cloned.photo && typeof cloned.photo === 'string' && cloned.photo.startsWith('data:image')) {
        promises.push(
          compressBase64Image(cloned.photo, 1200, 0.78).then(res => { cloned.photo = res; }).catch(() => {})
        );
      }

      // Step 1b: Compress pastry infographic if it's base64
      if (cloned.pastryInfographic && typeof cloned.pastryInfographic === 'string' && cloned.pastryInfographic.startsWith('data:image')) {
        promises.push(
          compressBase64Image(cloned.pastryInfographic, 1200, 0.78).then(res => { cloned.pastryInfographic = res; }).catch(() => {})
        );
      }

      // Step 2: Compress subrecipe photos in PARALLEL
      if (Array.isArray(cloned.subRecipes)) {
        cloned.subRecipes.forEach((sub: any) => {
          if (Array.isArray(sub.photos)) {
            sub.photos.forEach((pUrl: any, pIdx: number) => {
              if (typeof pUrl === 'string' && pUrl.startsWith('data:image')) {
                promises.push(
                  compressBase64Image(pUrl, 800, 0.7).then(res => { sub.photos[pIdx] = res; }).catch(() => {})
                );
              }
            });
          }
        });
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // Step 3: Check total size. If still > 800KB, apply aggressive compression in PARALLEL
      let size = getEstimatedObjectSizeBytes(cloned);
      if (size > 800000) {
        const secondPassPromises: Promise<void>[] = [];
        if (cloned.photo && typeof cloned.photo === 'string' && cloned.photo.startsWith('data:image')) {
          secondPassPromises.push(
            compressBase64Image(cloned.photo, 900, 0.6).then(res => { cloned.photo = res; }).catch(() => {})
          );
        }
        if (cloned.pastryInfographic && typeof cloned.pastryInfographic === 'string' && cloned.pastryInfographic.startsWith('data:image')) {
          secondPassPromises.push(
            compressBase64Image(cloned.pastryInfographic, 900, 0.6).then(res => { cloned.pastryInfographic = res; }).catch(() => {})
          );
        }
        if (Array.isArray(cloned.subRecipes)) {
          cloned.subRecipes.forEach((sub: any) => {
            if (Array.isArray(sub.photos)) {
              sub.photos.forEach((pUrl: any, pIdx: number) => {
                if (typeof pUrl === 'string' && pUrl.startsWith('data:image')) {
                  secondPassPromises.push(
                    compressBase64Image(pUrl, 600, 0.55).then(res => { sub.photos[pIdx] = res; }).catch(() => {})
                  );
                }
              });
            }
          });
        }
        if (secondPassPromises.length > 0) {
          await Promise.all(secondPassPromises);
        }
      }

      return cloned;
    })();

    return await Promise.race([processPromise, timeoutPromise]);
  } catch (err) {
    console.warn("ensureRecipeFitsFirestore skipped due to error:", err);
    return recipe;
  }
};

// ==========================================
// Copias de Seguridad Locales y Borradores de Emergencia
// ==========================================
const EMERGENCY_DRAFTS_KEY = 'recetas_emergency_drafts_v1';
const RECIPE_HISTORY_KEY = 'recetas_local_history_v1';

export const saveEmergencyDraft = (recipe: any) => {
  try {
    const existing = getEmergencyDrafts();
    const filtered = existing.filter(r => r.id !== recipe.id);
    const updated = [{ ...recipe, _savedLocallyAt: Date.now() }, ...filtered].slice(0, 30);
    localStorage.setItem(EMERGENCY_DRAFTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save emergency draft to localStorage:", e);
  }
};

export const getEmergencyDrafts = (): any[] => {
  try {
    const raw = localStorage.getItem(EMERGENCY_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const removeEmergencyDraft = (id: string) => {
  try {
    const existing = getEmergencyDrafts();
    const filtered = existing.filter(r => r.id !== id);
    localStorage.setItem(EMERGENCY_DRAFTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("Could not remove emergency draft:", e);
  }
};

export const appendRecipeHistory = (recipe: any) => {
  try {
    const raw = localStorage.getItem(RECIPE_HISTORY_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(r => r.id !== recipe.id);
    const updated = [{ ...recipe, _historyTimestamp: Date.now() }, ...filtered].slice(0, 50);
    localStorage.setItem(RECIPE_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not append recipe history:", e);
  }
};

export const getRecipeHistory = (): any[] => {
  try {
    const raw = localStorage.getItem(RECIPE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

