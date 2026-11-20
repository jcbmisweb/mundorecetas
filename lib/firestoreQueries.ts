import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  QuerySnapshot,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ADMIN_EMAILS, AppUser, isUserAdmin } from '../types';

export function isScopedAdmin(appUser?: AppUser | null): boolean {
  const email = (auth.currentUser?.email || appUser?.email || '').toLowerCase().trim();
  const tokenAdmin = Boolean(email && ADMIN_EMAILS.includes(email));
  return tokenAdmin || isUserAdmin(appUser);
}

function isQuotaError(err: any): boolean {
  const msg = err?.message || String(err || '');
  return msg.includes('Quota') || msg.includes('quota') || err?.code === 'resource-exhausted';
}

function dedupeById<T extends { id?: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Ejecuta lecturas de colección respetando las reglas de mínimo privilegio en Firestore:
 * - Administradores: lectura global de la colección.
 * - Docentes autenticados no administradores: consultas acotadas con `where(...)` a su workspace,
 *   elementos públicos (`isPublic == true`) o catálogo aprobado (`status == 'approved'`).
 */
export async function fetchScopedCollection<T extends { id?: string }>(
  collectionName: 'recipes' | 'products' | 'menuPlans' | 'menu_plans' | 'proRecipes' | 'pro_recipes',
  appUser?: AppUser | null,
  extraFields?: Record<string, unknown>
): Promise<T[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return [];
  }

  const uid = currentUser.uid;
  const email = (currentUser.email || '').toLowerCase().trim();
  const isTokenAdmin = ADMIN_EMAILS.includes(email);

  const mapSnap = (snap: QuerySnapshot<DocumentData>): T[] =>
    snap.docs.map((d) => ({ ...d.data(), id: d.id, ...(extraFields || {}) } as T));

  if (isTokenAdmin) {
    const snap = await getDocs(collection(db, collectionName));
    return mapSnap(snap);
  }

  if (collectionName === 'recipes') {
    const [ownRes, pubRes] = await Promise.allSettled([
      getDocs(query(collection(db, 'recipes'), where('workspaceId', '==', uid))),
      getDocs(query(collection(db, 'recipes'), where('isPublic', '==', true)))
    ]);

    const items: T[] = [];
    if (ownRes.status === 'fulfilled') items.push(...mapSnap(ownRes.value));
    if (pubRes.status === 'fulfilled') items.push(...mapSnap(pubRes.value));

    if (ownRes.status === 'rejected' && pubRes.status === 'rejected') {
      throw ownRes.reason;
    }
    if (ownRes.status === 'rejected' && isQuotaError(ownRes.reason)) throw ownRes.reason;
    if (pubRes.status === 'rejected' && isQuotaError(pubRes.reason)) throw pubRes.reason;

    return dedupeById(items);
  }

  if (collectionName === 'products') {
    const [approvedRes, ownRes] = await Promise.allSettled([
      getDocs(query(collection(db, 'products'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'products'), where('requestedBy', '==', uid)))
    ]);

    const items: T[] = [];
    if (approvedRes.status === 'fulfilled') items.push(...mapSnap(approvedRes.value));
    if (ownRes.status === 'fulfilled') items.push(...mapSnap(ownRes.value));

    if (approvedRes.status === 'rejected' && ownRes.status === 'rejected') {
      throw approvedRes.reason;
    }
    if (approvedRes.status === 'rejected' && isQuotaError(approvedRes.reason)) throw approvedRes.reason;

    return dedupeById(items);
  }

  // menuPlans, menu_plans, proRecipes, pro_recipes
  const snap = await getDocs(
    query(collection(db, collectionName), where('workspaceId', '==', uid))
  );
  return mapSnap(snap);
}

/**
 * Suscripción en tiempo real acotada al privilegio del usuario autenticado.
 */
export function subscribeScopedCollection<T extends { id?: string }>(
  collectionName: 'products' | 'menuPlans' | 'proRecipes',
  onData: (items: T[]) => void,
  onError?: (err: unknown) => void,
  _appUser?: AppUser | null
): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return () => {};
  }

  const uid = currentUser.uid;
  const email = (currentUser.email || '').toLowerCase().trim();
  const isTokenAdmin = ADMIN_EMAILS.includes(email);

  const mapSnap = (snap: QuerySnapshot<DocumentData>): T[] =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));

  if (isTokenAdmin) {
    return onSnapshot(
      collection(db, collectionName),
      (snap) => onData(mapSnap(snap)),
      onError
    );
  }

  if (collectionName === 'products') {
    let approvedItems: T[] = [];
    let ownItems: T[] = [];

    const emit = () => onData(dedupeById([...approvedItems, ...ownItems]));

    const unsub1 = onSnapshot(
      query(collection(db, 'products'), where('status', '==', 'approved')),
      (snap) => {
        approvedItems = mapSnap(snap);
        emit();
      },
      onError
    );

    const unsub2 = onSnapshot(
      query(collection(db, 'products'), where('requestedBy', '==', uid)),
      (snap) => {
        ownItems = mapSnap(snap);
        emit();
      },
      onError
    );

    return () => {
      unsub1();
      unsub2();
    };
  }

  return onSnapshot(
    query(collection(db, collectionName), where('workspaceId', '==', uid)),
    (snap) => onData(mapSnap(snap)),
    onError
  );
}
