import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/firebase';
import { useIsAdmin } from '../../contexts/AuthContext';
import { signUp } from '../../features/auth/authService';
import {
  recalculateAllMembersStats,
  validateDatabaseIntegrity,
  type IntegrityReport,
} from '../../features/admin/rebuildService';
import type { AppUser, AuditLog, UserRole } from '../../types';
import {
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Database,
  UserPlus,
  X,
  Lock,
  Mail,
  User,
  Shield,
} from 'lucide-react';

export default function AdminPage() {
  const isAdmin = useIsAdmin();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Provisioning Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('EDITOR');

  // Admin Tools state
  const [rebuilding, setRebuilding] = useState(false);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      const userList = userSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
      setUsers(userList);

      // Load recent audit logs
      const auditSnap = await getDocs(
        query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('timestamp', 'desc'), limit(20))
      );
      const auditList = auditSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
      setAuditLogs(auditList);
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateStats = async () => {
    if (!confirm('Bạn có chắc chắn muốn tính toán lại toàn bộ thống kê trận đấu cho tất cả VĐV?')) return;
    setRebuilding(true);
    try {
      const res = await recalculateAllMembersStats();
      alert(`Đã tính toán lại thành công cho ${res.membersUpdated} VĐV!`);
      loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Có lỗi khi tính lại thống kê');
    } finally {
      setRebuilding(false);
    }
  };

  const handleCheckIntegrity = async () => {
    setCheckingIntegrity(true);
    try {
      const res = await validateDatabaseIntegrity();
      setIntegrityReport(res);
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi kiểm tra toàn vẹn CSDL');
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (newPassword.length < 6) {
      setCreateError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    setCreateLoading(true);
    try {
      await signUp(newEmail.trim(), newPassword, newDisplayName.trim());

      const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      const found = userSnap.docs.find(d => d.data().email === newEmail.trim());
      if (found) {
        await updateDoc(doc(db, COLLECTIONS.USERS, found.id), { role: newRole });
      }

      setCreateSuccess(`Đã cấp tài khoản thành công cho ${newDisplayName} (${newRole})!`);
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('EDITOR');
      loadData();

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setCreateError((err as Error).message || 'Lỗi khi cấp tài khoản.');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUid(uid);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi cập nhật quyền');
    } finally {
      setUpdatingUid(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container text-center py-20">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Quyền Truy Cập Bị Giới Hạn</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Chỉ có tài khoản Quản trị viên (ADMIN) mới có quyền truy cập trang quản trị này.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in-up">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-orange-500" />
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Quản Trị Hệ Thống
              </h1>
              <p className="text-slate-400 text-sm">
                Cấp tài khoản, phân quyền người dùng và kiểm soát audit log
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Cấp Tài Khoản Mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Maintenance & Integrity Tools */}
          <div className="card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              Công Cụ Bảo Trì & Toàn Vẹn CSDL (SRS §20.2)
            </h2>
            <p className="text-slate-400 text-xs">
              Tính toán lại toàn bộ chỉ số thống kê lịch sử VĐV từ các trận đấu hoặc kiểm tra liên kết mồ côi (orphan records).
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleRecalculateStats}
                disabled={rebuilding}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Tính Lại Toàn Bộ Thống Kê VĐV
              </button>

              <button
                onClick={handleCheckIntegrity}
                disabled={checkingIntegrity}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {checkingIntegrity ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Kiểm Tra Toàn Vẹn Dữ Liệu
              </button>
            </div>

            {integrityReport && (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2 mt-4">
                <p className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Kết quả kiểm tra toàn vẹn CSDL:
                </p>
                <p className="text-slate-300">
                  • VĐV mồ côi (Orphan participants): <span className="font-mono text-orange-400">{integrityReport.orphanParticipants}</span>
                </p>
                <p className="text-slate-300">
                  • Trận đấu lỗi (Invalid matches): <span className="font-mono text-orange-400">{integrityReport.invalidMatches}</span>
                </p>
                {integrityReport.errors.length > 0 && (
                  <div className="text-red-400 space-y-1 pt-2">
                    {integrityReport.errors.map((e, idx) => (
                      <p key={idx}>⚠️ {e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Roles Management */}
          <div className="card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              Danh Sách Người Dùng & Phân Quyền ({users.length})
            </h2>

            {users.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Chưa có người dùng nào đăng ký.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs bg-slate-900/60">
                      <th className="text-left px-4 py-3">Họ Tên / Email</th>
                      <th className="text-left px-4 py-3">Vai Trò Hiện Tại</th>
                      <th className="text-right px-4 py-3">Thay Đổi Vai Trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{u.displayName || 'Chưa đặt tên'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              u.role === 'ADMIN'
                                ? 'badge-orange font-bold'
                                : u.role === 'EDITOR'
                                ? 'badge-blue'
                                : 'badge-gray'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {updatingUid === u.uid ? (
                              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  handleChangeRole(u.uid, e.target.value as UserRole)
                                }
                                className="input-base text-xs py-1 px-2"
                              >
                                <option value="VIEWER">VIEWER (Chỉ xem)</option>
                                <option value="EDITOR">EDITOR (Biên tập)</option>
                                <option value="ADMIN">ADMIN (Quản trị)</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Logs */}
          <div className="card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Nhật Ký Hoạt Động (Audit Logs · Gần nhất)
            </h2>

            {auditLogs.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Chưa có nhật ký hoạt động nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="text-left px-3 py-2.5">Hành Động</th>
                      <th className="text-left px-3 py-2.5">Phân Hệ</th>
                      <th className="text-left px-3 py-2.5">Người Thực Hiện</th>
                      <th className="text-left px-3 py-2.5">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 font-mono">
                        <td className="px-3 py-2.5 font-bold text-orange-400">
                          {log.action}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="badge badge-gray">{log.module}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">
                          {log.userName || log.userId}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 truncate max-w-xs">
                          {log.after ? JSON.stringify(log.after) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Cấp Tài Khoản Mới ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 space-y-5 border-orange-500/30 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-400" />
                Cấp Tài Khoản Mới (Admin Only)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  Họ và Tên Cán Bộ / Trọng Tài
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="VD: Trọng Tài Nguyễn Văn A"
                  className="input-base text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  Email Đăng Nhập
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="trongtai@pickleball.vn"
                  className="input-base text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  Mật Khẩu Khởi Tạo
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự (VD: 12345678)"
                  className="input-base text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                  Phân Quyền Vai Trò
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="input-base text-sm cursor-pointer"
                >
                  <option value="EDITOR">EDITOR — Trọng tài (Nhập điểm, cập nhật kết quả)</option>
                  <option value="ADMIN">ADMIN — Ban Quản Trị (Toàn quyền quản lý giải)</option>
                  <option value="VIEWER">VIEWER — Người xem (Chỉ xem thông tin)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <span>Đang tạo tài khoản...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Xác Nhận Cấp Tài Khoản</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
