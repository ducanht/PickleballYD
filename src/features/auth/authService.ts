/**
 * Auth Service — SRS V6 §3
 * Firebase Authentication + custom claims (role)
 * Role is stored both in Firestore users/{uid} AND as custom claim
 * for Security Rules enforcement.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../api/firebase';
import type { AppUser, UserRole } from '../../types';

// ── Sign in ─────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
  // Update lastLoginAt
  const uid = auth.currentUser?.uid;
  if (uid) {
    await setDoc(
      doc(db, COLLECTIONS.USERS, uid),
      { lastLoginAt: serverTimestamp() },
      { merge: true }
    );
  }
}

// ── Sign up (First user is automatically ADMIN) ──────────────────────────────
export async function signUp(email: string, password: string, displayName?: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const name = displayName || email.split('@')[0];
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch {
      // Non-blocking
    }
  }

  // If first user, make ADMIN automatically
  let isFirstUser = true;
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    isFirstUser = usersSnap.empty;
  } catch {
    isFirstUser = true;
  }

  const role: UserRole = isFirstUser ? 'ADMIN' : 'VIEWER';

  await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
    displayName: name,
    email,
    role,
    active: true,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Fetch user profile + role from Firestore ─────────────────────────────────
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AppUser;
}

// ── Get role from Firebase custom claims (fallback to Firestore) ──────────────
export async function getUserRole(firebaseUser: FirebaseUser): Promise<UserRole> {
  const idTokenResult = await firebaseUser.getIdTokenResult();
  const claimRole = idTokenResult.claims['role'] as UserRole | undefined;
  if (claimRole) return claimRole;

  // Fallback: read from Firestore users doc
  const profile = await fetchUserProfile(firebaseUser.uid);
  return profile?.role ?? 'VIEWER';
}

// ── Auth state listener ───────────────────────────────────────────────────────
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ── Create user doc (called after first sign-in / admin provisioning) ─────────
export async function createUserDoc(
  uid: string,
  displayName: string,
  email: string,
  role: UserRole = 'VIEWER'
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, uid), {
    displayName,
    email,
    role,
    active: true,
    createdAt: serverTimestamp(),
    lastLoginAt: null,
  });
}
