/**
 * AuthContext — SRS V6 §3
 * Provides Dual-Mode Auth (Firebase Auth + Local Admin Session) to the entire application.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuthState,
  fetchUserProfile,
  getUserRole,
  getLocalSession,
  type LocalSession,
} from '../features/auth/authService';
import type { AppUser, UserRole } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = useCallback(async (fbUser: FirebaseUser | null) => {
    setFirebaseUser(fbUser);
    const local = getLocalSession();

    if (local) {
      setAppUser({
        uid: local.uid,
        displayName: local.displayName,
        email: local.email,
        role: local.role,
        active: true,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
      });
      setRole(local.role);
      setLoading(false);
      return;
    }

    if (fbUser) {
      const [profile, resolvedRole] = await Promise.all([
        fetchUserProfile(fbUser.uid),
        getUserRole(fbUser),
      ]);
      setAppUser(profile);
      setRole(resolvedRole);
    } else {
      setAppUser(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((fbUser) => {
      checkAuthState(fbUser);
    });

    const handleLocalChange = () => {
      checkAuthState(firebaseUser);
    };

    window.addEventListener('auth_state_changed', handleLocalChange);

    return () => {
      unsubscribe();
      window.removeEventListener('auth_state_changed', handleLocalChange);
    };
  }, [checkAuthState, firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        role,
        loading,
        isAuthenticated: !!firebaseUser || !!appUser,
        refreshAuth: () => checkAuthState(firebaseUser),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// Role helpers
export function useIsAdmin() {
  const { role } = useAuth();
  return role === 'ADMIN';
}

export function useIsEditor() {
  const { role } = useAuth();
  return role === 'EDITOR' || role === 'ADMIN';
}
