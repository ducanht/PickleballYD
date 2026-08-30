/**
 * AuthContext — SRS V6 §3
 * Provides Firebase Auth state + resolved AppUser role to the entire app.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuthState, fetchUserProfile, getUserRole } from '../features/auth/authService';
import type { AppUser, UserRole } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  role: null,
  loading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      setFirebaseUser(fbUser);
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
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        role,
        loading,
        isAuthenticated: !!firebaseUser,
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
