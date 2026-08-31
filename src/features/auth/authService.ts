/**
 * Auth Service — SRS V6 §3
 * Dual-Mode Authentication: Firebase Auth + Local Admin Fallback
 * Ensures seamless access even when Firebase Auth providers are pending configuration.
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../api/firebase';
import type { AppUser, UserRole } from '../../types';

const LOCAL_USER_KEY = 'pickleball_local_admin_session';

export interface LocalSession {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export function getLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalSession(session: LocalSession): void {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event('auth_state_changed'));
  } catch (err) {
    console.warn('[Auth] Failed to set local session:', err);
  }
}

export function clearLocalSession(): void {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    window.dispatchEvent(new Event('auth_state_changed'));
  } catch (err) {
    console.warn('[Auth] Failed to clear local session:', err);
  }
}

// ── Sign in ─────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    clearLocalSession();
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await setDoc(
          doc(db, COLLECTIONS.USERS, uid),
          { lastLoginAt: serverTimestamp() },
          { merge: true }
        );
      } catch {
        // Non-blocking
      }
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // If Firebase Auth provider is not configured or network fails, fallback to local admin
    if (
      error.code === 'auth/configuration-not-found' ||
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/network-request-failed'
    ) {
      console.warn('[Auth] Firebase Auth unavailable, activating Local Admin session:', error.message);
      setLocalSession({
        uid: 'local_admin_' + Date.now(),
        email: email.trim(),
        displayName: email.split('@')[0] || 'Ban Quản Trị',
        role: 'ADMIN',
      });
      return;
    }
    throw err;
  }
}

// ── Sign up (Automatically assigns ADMIN role) ───────────────────────────────
export async function signUp(email: string, password: string, displayName?: string): Promise<void> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    clearLocalSession();
    const name = displayName?.trim() || email.split('@')[0];
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {
        // Non-blocking
      }
    }

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
        displayName: name,
        email,
        role: 'ADMIN',
        active: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // If Firebase Auth provider is not configured or network fails, fallback to local admin
    if (
      error.code === 'auth/configuration-not-found' ||
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/network-request-failed'
    ) {
      console.warn('[Auth] Firebase Auth unavailable, creating Local Admin session:', error.message);
      setLocalSession({
        uid: 'local_admin_' + Date.now(),
        email: email.trim(),
        displayName: displayName?.trim() || email.split('@')[0] || 'Ban Quản Trị',
        role: 'ADMIN',
      });
      return;
    }
    throw err;
  }
}

// ── Direct Demo Admin Login ──────────────────────────────────────────────────
export function loginAsDemoAdmin(displayName = 'Trịnh Thị Hiền', email = 'qtdyentho.hienha@gmail.com'): void {
  setLocalSession({
    uid: 'local_admin_super',
    email,
    displayName,
    role: 'ADMIN',
  });
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  clearLocalSession();
  try {
    await firebaseSignOut(auth);
  } catch {
    // Non-blocking
  }
}

// ── Fetch user profile + role from Firestore ─────────────────────────────────
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const local = getLocalSession();
  if (local && local.uid === uid) {
    return {
      uid: local.uid,
      displayName: local.displayName,
      email: local.email,
      role: local.role,
      active: true,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    };
  }

  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) {
      return {
        uid,
        displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
        email: auth.currentUser?.email || '',
        role: 'ADMIN',
        active: true,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
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
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    };
  }
}

// ── Resolve role for current user ─────────────────────────────────────────────
export async function getUserRole(user: FirebaseUser | null): Promise<UserRole> {
  const local = getLocalSession();
  if (local) return local.role;

  if (!user) return 'VIEWER';
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.role) {
      return tokenResult.claims.role as UserRole;
    }
    const profile = await fetchUserProfile(user.uid);
    return profile?.role ?? 'ADMIN';
  } catch {
    return 'ADMIN';
  }
}

// ── Auth state subscriber ────────────────────────────────────────────────────
export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
