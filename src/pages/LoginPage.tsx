import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  signIn,
  signUp,
  loginAsDemoAdmin,
} from '../features/auth/authService';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  Zap,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('qtdyentho.hienha@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/tournaments';

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (errObj.code === 'auth/user-not-found' || errObj.code === 'auth/wrong-password' || errObj.code === 'auth/invalid-credential') {
        msg = 'Email hoặc mật khẩu không chính xác.';
      } else if (errObj.code === 'auth/invalid-email') {
        msg = 'Địa chỉ email không đúng định dạng.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    loginAsDemoAdmin('Trịnh Thị Hiền', email.trim() || 'qtdyentho.hienha@gmail.com');
    setSuccessMsg('Đã kích hoạt phiên Quản Trị Viên thành công!');
    setTimeout(() => {
      navigate(from, { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-950/60 ring-4 ring-white/10">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Pickleball Yên Định K98-01
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Cổng quản trị giải đấu & cập nhật kết quả thi đấu
          </p>
        </div>

        {/* Quick Admin Access Card */}
        <div className="glass-card p-4 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Truy Cập Nhanh Quản Trị</p>
              <p className="text-[11px] text-slate-400">Vào ngay không cần cấu hình email</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="btn-primary py-2 px-3.5 text-xs font-bold shrink-0 shadow-md shadow-orange-950/50"
          >
            Vào Quyền Admin
          </button>
        </div>

        {/* Main Auth Card */}
        <div className="glass-panel p-6 sm:p-8 space-y-6 shadow-2xl border-white/[0.12]">
          <div className="text-center pb-2 border-b border-white/[0.08]">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-orange-400" />
              Đăng Nhập Quản Trị Viên
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Dành cho Ban Tổ Chức & Trọng Tài giải đấu
            </p>
          </div>

          {/* Error / Success Notifications */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                Email Quản Trị
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="qtdyentho.hienha@gmail.com"
                className="input-base text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                Mật Khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-orange-950/60 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Đăng Nhập Quản Trị</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-center text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
            🛡️ <strong>Chính sách bảo mật:</strong> Hệ thống đóng đăng ký công khai. Toàn bộ tài khoản và phân quyền quản trị do Super Admin cấp phát trong trang Quản Trị.
          </div>
        </div>
      </div>
    </div>
  );
}
