/**
 * RoleGuard — SRS V6 §3
 * Protects routes by required role level.
 * Redirects unauthenticated users to /login.
 * Redirects insufficient-role users to /.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

const ROLE_LEVEL: Record<UserRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

interface RoleGuardProps {
  children: React.ReactNode;
  /** Minimum role required to access this route */
  requiredRole?: UserRole;
}

export default function RoleGuard({ children, requiredRole = 'VIEWER' }: RoleGuardProps) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userLevel = ROLE_LEVEL[role ?? 'VIEWER'];
  const requiredLevel = ROLE_LEVEL[requiredRole];

  if (userLevel < requiredLevel) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
