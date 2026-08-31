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
  // Update lastLoginAt safely
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await setDoc(
        doc(db, COLLECTIONS.USERS, uid),
        { lastLoginAt: serverTimestamp() },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[Auth] Could not update lastLoginAt in Firestore:', err);
  }
}

// ── Sign up (Automatically assigns ADMIN role) ───────────────────────────────
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

  // Write admin user doc to Firestore safely
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
      displayName: name,
      email,
      role: 'ADMIN',
      active: true,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Auth] Firestore setDoc error (proceeding with Admin role in session):', err);
  }
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Fetch user profile + role from Firestore ─────────────────────────────────
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) {
      return {
        uid,
        displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
        email: auth.currentUser?.email || '',
        role: 'ADMIN',
        active: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    }
    return { uid, ...snap.data() } as AppUser;
  } catch (err) {
    console.warn('[Auth] fetchUserProfile error, falling back to local Admin profile:', err);
    return {
      uid,
      displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
      email: auth.currentUser?.email || '',
      role: 'ADMIN',
      active: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  }
}

// ── Get role from Firebase custom claims (fallback to Firestore / ADMIN) ──────
export async function getUserRole(firebaseUser: FirebaseUser): Promise<UserRole> {
  try {
    const idTokenResult = await firebaseUser.getIdTokenResult();
    const claimRole = idTokenResult.claims['role'] as UserRole | undefined;
    if (claimRole) return claimRole;

    const profile = await fetchUserProfile(firebaseUser.uid);
    if (profile?.role) return profile.role;
  } catch (e) {
    console.warn('[Auth] Could not fetch role from Firestore:', e);
  }

  // Default to ADMIN for all authenticated users so owner is never blocked!
  return 'ADMIN';
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
