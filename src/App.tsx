/**
 * App — SRS V6
 * Full route structure per SRS §16 (public routes) and §28 (page structure).
 * Role-based protection via RoleGuard.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import OfflineBanner from './components/common/OfflineBanner';
import RoleGuard from './components/common/RoleGuard';
import Header from './components/common/Header';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Public (no auth required)
const PublicDashboard = lazy(() => import('./pages/Public/PublicDashboard'));
const LiveBoardPage = lazy(() => import('./pages/Public/LiveBoardPage'));
const PublicStandingsPage = lazy(() => import('./pages/Public/PublicStandingsPage'));
const PublicSchedulePage = lazy(() => import('./pages/Public/PublicSchedulePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Auth required (VIEWER+)
const MembersListPage = lazy(() => import('./pages/Members/MembersListPage'));
const MemberDetailPage = lazy(() => import('./pages/Members/MemberDetailPage'));
const FinanceDashboard = lazy(() => import('./pages/Finance/FinanceDashboard'));
const TournamentListPage = lazy(() => import('./pages/Tournaments/TournamentListPage'));
const TournamentDetailPage = lazy(() => import('./pages/Tournaments/TournamentDetailPage'));

// EDITOR+ only
const FixedDrawPage = lazy(() => import('./pages/Tournaments/Draw/FixedDrawPage'));
const GroupDrawPage = lazy(() => import('./pages/Tournaments/Draw/GroupDrawPage'));
const RotatingDrawPage = lazy(() => import('./pages/Tournaments/Rotating/RotatingDrawPage'));
const SchedulePage = lazy(() => import('./pages/Tournaments/Schedule/SchedulePage'));
const KnockoutBracketPage = lazy(() => import('./pages/Tournaments/Knockout/KnockoutBracketPage'));

// ADMIN only
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));

// ── Full-screen loading spinner ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/40">Đang tải...</p>
      </div>
    </div>
  );
}

// ── Layout with header (hides on live board / kiosk) ─────────────────────────
function AppLayout({ children, hideHeader = false }: { children: React.ReactNode; hideHeader?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-white">
      <OfflineBanner />
      {!hideHeader && <Header />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      {!hideHeader && (
        <footer className="border-t border-white/10 py-4 text-center text-xs text-white/30">
          © 2026 Hội Cựu Học Sinh Yên Định 1998–2001 • Pickleball Hub
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── PUBLIC ROUTES (no auth needed) ────────────────────────────── */}
          <Route
            path="/"
            element={<AppLayout><PublicDashboard /></AppLayout>}
          />
          <Route
            path="/login"
            element={<AppLayout hideHeader><LoginPage /></AppLayout>}
          />
          {/* Public Live Board per SRS §16 */}
          <Route
            path="/tournaments/:id/live"
            element={<AppLayout hideHeader><LiveBoardPage /></AppLayout>}
          />
          <Route
            path="/tournaments/:id/standings"
            element={<AppLayout><PublicStandingsPage /></AppLayout>}
          />
          <Route
            path="/tournaments/:id/schedule-public"
            element={<AppLayout><PublicSchedulePage /></AppLayout>}
          />

          <Route
            path="/tournaments"
            element={<AppLayout><TournamentListPage /></AppLayout>}
          />
          <Route
            path="/tournaments/:id"
            element={<AppLayout><TournamentDetailPage /></AppLayout>}
          />

          {/* ── VIEWER+ ROUTES (auth required) ────────────────────────────── */}
          <Route
            path="/members"
            element={
              <RoleGuard requiredRole="VIEWER">
                <AppLayout><MembersListPage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/members/:id"
            element={
              <RoleGuard requiredRole="VIEWER">
                <AppLayout><MemberDetailPage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/finance"
            element={
              <RoleGuard requiredRole="VIEWER">
                <AppLayout><FinanceDashboard /></AppLayout>
              </RoleGuard>
            }
          />

          {/* ── EDITOR+ ROUTES ─────────────────────────────────────────────── */}
          <Route
            path="/tournaments/:id/draw/fixed"
            element={
              <RoleGuard requiredRole="EDITOR">
                <AppLayout><FixedDrawPage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/tournaments/:id/draw/groups"
            element={
              <RoleGuard requiredRole="EDITOR">
                <AppLayout><GroupDrawPage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/tournaments/:id/draw/rotating"
            element={
              <RoleGuard requiredRole="EDITOR">
                <AppLayout><RotatingDrawPage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/tournaments/:id/schedule"
            element={
              <RoleGuard requiredRole="EDITOR">
                <AppLayout><SchedulePage /></AppLayout>
              </RoleGuard>
            }
          />
          <Route
            path="/tournaments/:id/knockout"
            element={
              <RoleGuard requiredRole="EDITOR">
                <AppLayout><KnockoutBracketPage /></AppLayout>
              </RoleGuard>
            }
          />

          {/* ── ADMIN ROUTES ──────────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RoleGuard requiredRole="ADMIN">
                <AppLayout><AdminPage /></AppLayout>
              </RoleGuard>
            }
          />

          {/* ── FALLBACK ──────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
