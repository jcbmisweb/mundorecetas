import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Reuse or initialize Firebase app
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

export const GOOGLE_DRIVE_FOLDER_ID = '1ugCkGVHa9a7irT-8JjDIIM2YK-nIr8Tp';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize Auth state listener
export const initGoogleDriveAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onFailure) onFailure();
      }
    }
  });
};

export const loginWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el Token de Acceso de Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Error al iniciar sesión con Google:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Transforms any Google Drive URL (share link, view link, drive file link)
 * into a direct viewable image/thumbnail URL or embed link.
 */
export const transformDriveUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.includes('lh3.googleusercontent.com') || trimmed.includes('drive.google.com/uc?')) {
    return trimmed;
  }

  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
};

export const sanitizeFileName = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

/**
 * Uploads a file directly to the user's designated Google Drive folder.
 */
export const uploadFileToDrive = async (
  file: File,
  folderId: string = GOOGLE_DRIVE_FOLDER_ID,
  customName?: string
): Promise<{ fileId: string; webViewLink: string; directUrl: string }> => {
  let token = cachedAccessToken;

  if (!token) {
    const authResult = await loginWithGoogleDrive();
    token = authResult.accessToken;
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const cleanBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ''));
  const timestamp = Date.now();
  const fileName = customName 
    ? `${sanitizeFileName(customName)}_${timestamp}.${ext}`
    : `RECETA_${timestamp}_${cleanBase}.${ext}`;
  
  const metadata = {
    name: fileName,
    parents: [folderId]
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('Drive upload failed:', errText);
    throw new Error(`Error en la subida a Google Drive (${uploadRes.status}): ${errText}`);
  }

  const uploadData = await uploadRes.json();
  const fileId = uploadData.id;

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (e) {
    console.warn('Could not make file public via API:', e);
  }

  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const webViewLink = uploadData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, webViewLink, directUrl };
};
