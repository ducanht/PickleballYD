/**
 * Header — SRS V6
 * Navigation bar with role-based menu items and auth controls.
 * Uses new AuthContext (role-based, Firebase Auth).
 */
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Wallet,
  Shield,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../features/auth/authService';

const PUBLIC_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/tournaments', icon: Trophy, label: 'Giải đấu', end: false },
];

const AUTH_NAV = [
  { to: '/members', icon: Users, label: 'Thành viên', end: false },
  { to: '/finance', icon: Wallet, label: 'Tài chính', end: false },
];

const ADMIN_NAV = [
  { to: '/admin', icon: Shield, label: 'Admin', end: false },
];

export default function Header() {
  const { isAuthenticated, role, appUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const allNav = [
    ...PUBLIC_NAV,
    ...(isAuthenticated ? AUTH_NAV : []),
    ...(role === 'ADMIN' ? ADMIN_NAV : []),
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
      isActive
        ? 'bg-orange-500 text-white shadow-sm'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-900/30">
              PB
            </div>
            <span className="font-bold text-white text-sm hidden sm:block leading-tight">
              Pickleball<br />
              <span className="text-orange-400 font-semibold text-xs">Yên Định</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {allNav.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Auth + Mobile toggle */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-white/40 hidden lg:block">
                  {appUser?.displayName ?? 'User'}
                  {role && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                      {role}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-red-400 transition-colors px-2 py-1.5"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 border border-white/20 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogIn size={14} />
                Đăng nhập
              </NavLink>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-navy-950 px-4 py-3 space-y-1">
          {allNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-white/10 mt-2">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-1.5"
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm text-orange-400 px-3 py-1.5"
              >
                <LogIn size={14} /> Đăng nhập
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
