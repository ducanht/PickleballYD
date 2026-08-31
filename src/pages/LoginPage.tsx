/**
 * LoginPage — SRS V6 §3
 * Firebase Auth email/password login & registration.
 * First registered user is automatically assigned ADMIN role.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { signIn, signUp } from '../features/auth/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'REGISTER') {
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password !== confirmPass) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại.';
      if (msg.includes('email-already-in-use')) {
        setError('Email này đã được đăng ký. Vui lòng chuyển sang Đăng Nhập.');
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (msg.includes('weak-password')) {
        setError('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
      } else if (msg.includes('invalid-email')) {
        setError('Định dạng email không hợp lệ.');
      } else if (msg.includes('too-many-requests')) {
        setError('Quá nhiều lần thử. Vui lòng thử lại sau.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-navy-950">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-orange-900/30">
            🏓
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'LOGIN' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Hệ thống Quản lý Giải Đấu Yên Định
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-orange-500 text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn size={13} /> Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-orange-500 text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus size={13} /> Đăng Ký Admin
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Display Name (Register only) */}
            {mode === 'REGISTER' && (
              <div className="space-y-1.5">
                <label htmlFor="displayName" className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                  <User size={13} /> Họ và Tên
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                <Mail size={13} /> Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                <Lock size={13} /> Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'REGISTER' && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                  <Lock size={13} /> Xác nhận Mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div role="alert" className="text-sm text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2.5">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password || (mode === 'REGISTER' && !confirmPass)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === 'LOGIN' ? (
                <>
                  <LogIn size={14} />
                  Đăng Nhập
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Đăng Ký & Kích Hoạt Admin
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-orange-500/50" />
          Firebase Authentication • Tự động kích hoạt quyền Admin cho tài khoản đầu tiên
        </p>
      </div>
    </div>
  );
}
