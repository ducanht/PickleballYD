/**
 * Header — SRS V6
 * Premium glassmorphic navigation bar with role-based menus and live indicator.
 */
import { useState } from 'react';
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
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../features/auth/authService';

const PUBLIC_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/tournaments', icon: Trophy, label: 'Giải đấu', end: false },
];

const AUTH_NAV = [
  { to: '/members', icon: Users, label: 'Thành viên', end: false },
  { to: '/finance', icon: Wallet, label: 'Tài chính & Quỹ', end: false },
];

const ADMIN_NAV = [
  { to: '/admin', icon: Shield, label: 'Quản trị Admin', end: false },
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
    `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
      isActive
        ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_-3px_rgba(255,107,0,0.3)]'
        : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
    }`;

  // Get initials for avatar
  const initials = appUser?.displayName
    ? appUser.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 flex-shrink-0 group cursor-pointer text-left"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-orange-950/60 group-hover:scale-105 group-hover:shadow-orange-500/25 transition-all duration-300 border border-orange-400/40">
              <span className="font-display">YD</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-navy-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-white text-sm sm:text-base tracking-tight leading-none group-hover:text-orange-400 transition-colors">
                  Cựu HS Yên Định - Thanh Hoá
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                  K98-01
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">
                Khóa 1998 – 2001 • Yên Định 1 - 2 - 3
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
            {allNav.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Auth Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* User Info Capsule */}
                <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-1 max-w-[110px]">
                      {appUser?.displayName || appUser?.email?.split('@')[0]}
                    </p>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      {role || 'Thành viên'}
                    </span>
                  </div>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleSignOut}
                  title="Đăng xuất khỏi hệ thống"
                  className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-950/40 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/20 transition-all border border-orange-400/30 cursor-pointer"
              >
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </NavLink>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-navy-950/98 backdrop-blur-2xl px-4 py-4 space-y-2 animate-slide-up shadow-2xl">
          {/* User Profile summary on mobile */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {appUser?.displayName || appUser?.email}
                </p>
                <span className="text-xs text-orange-400 font-semibold uppercase">
                  Vai trò: {role || 'USER'}
                </span>
              </div>
            </div>
          )}

          {allNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="pt-3 border-t border-white/[0.08] mt-3">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <LogOut size={16} /> Đăng xuất tài khoản
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-950/50"
              >
                <LogIn size={16} /> Đăng nhập hệ thống
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
