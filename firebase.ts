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

// Demo & Local User Storage helpers
export function loginDemoUser(email = 'jcbmisweb@gmail.com', name = 'Juan Codina'): any {
  const demoUser = {
    uid: 'admin_jcbmisweb',
    email,
    displayName: name,
    teacherName: name,
    teacherLogo: 'https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e',
    instituteName: 'IES La Flota',
    instituteLogo: '',
    isApproved: true,
    role: 'admin',
    createdAt: Date.now(),
    workspaceId: 'admin_jcbmisweb'
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('active_app_user', JSON.stringify(demoUser));
  }
  return demoUser;
}

export function getDemoUser(): any | null {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('active_app_user');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  return null;
}

export function saveActiveUser(user: any | null) {
  if (typeof localStorage !== 'undefined') {
    if (user) {
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
      try { return JSON.parse(raw); } catch {}
    }
  }
  return null;
}

export async function loginWithCustomEmail(email: string, displayName?: string): Promise<any> {
  const cleanEmail = email.trim().toLowerCase();
  const uid = `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  const isAdmin = cleanEmail === 'jcbmisweb@gmail.com';
  const name = displayName?.trim() || cleanEmail.split('@')[0];
  const user = {
    uid,
    email: cleanEmail,
    displayName: name,
    teacherName: name,
    teacherLogo: isAdmin ? 'https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e' : '',
    instituteName: 'IES La Flota',
    instituteLogo: '',
    isApproved: true,
    role: isAdmin ? 'admin' : 'collaborator',
    createdAt: Date.now(),
    workspaceId: uid
  };
  saveActiveUser(user);
  return user;
}

