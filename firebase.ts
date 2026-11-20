import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use custom database ID if specified and not (default), otherwise connect to default Firestore database
const cfg = firebaseConfig as any;
const databaseId = cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)'
  ? cfg.firestoreDatabaseId
  : undefined;

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, databaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export const onQuotaExceededListeners: ((info: FirestoreErrorInfo) => void)[] = [];
export function registerQuotaListener(cb: (info: FirestoreErrorInfo) => void) {
  onQuotaExceededListeners.push(cb);
  return () => {
    const idx = onQuotaExceededListeners.indexOf(cb);
    if (idx !== -1) onQuotaExceededListeners.splice(idx, 1);
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  if (errInfo.error.includes('Quota') || errInfo.error.includes('quota') || errInfo.error.includes('resource-exhausted')) {
    onQuotaExceededListeners.forEach(cb => {
      try { cb(errInfo); } catch {}
    });
    console.warn('⚡ Firestore Quota Exceeded (trabajando en modo Local seguro):', errInfo.error);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// Connection test and diagnostic
export async function testFirestoreConnection(): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true, latency: Date.now() - start };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { ok: false, latency: Date.now() - start, error: 'Sin conexión con Firestore' };
    }
    // If the server answered (even with permission or other status), it is connected
    return { ok: true, latency: Date.now() - start };
  }
}

// Local profile cache helpers (strictly synchronized with verified Firebase Auth UID)
export function saveActiveUser(user: any | null) {
  if (typeof localStorage !== 'undefined') {
    if (user && user.uid) {
      localStorage.setItem('active_app_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('active_app_user');
    }
  }
}

export function getActiveUser(): any | null {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('active_app_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.uid === 'string') {
          return parsed;
        }
      } catch {}
    }
  }
  return null;
}


