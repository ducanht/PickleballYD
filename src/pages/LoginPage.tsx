/**
 * LoginPage — SRS V6 §3
 * Firebase Auth email/password login.
 * Redirects to '/' (or previous location) after successful auth.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signIn } from '../features/auth/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại.';
      // Translate Firebase error codes to friendly messages
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Email hoặc mật khẩu không chính xác.');
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
            <h1 className="text-2xl font-bold text-white">Đăng Nhập</h1>
            <p className="text-sm text-white/40 mt-1">
              Hệ thống Quản lý Giải Đấu Yên Định
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  autoComplete="current-password"
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

            {/* Error message */}
            {error && (
              <div role="alert" className="text-sm text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2.5">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Đăng Nhập
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-orange-500/50" />
          Firebase Authentication • Firestore Security Rules
        </p>
      </div>
    </div>
  );
}
