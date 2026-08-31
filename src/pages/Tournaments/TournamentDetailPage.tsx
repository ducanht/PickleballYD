import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getTournament,
  getParticipants,
  updateTournamentConfig,
} from '../../features/tournaments/tournamentService';
import { useIsEditor, useIsAdmin } from '../../contexts/AuthContext';
import type { Tournament, Participant, TournamentConfig } from '../../types';
import {
  ArrowLeft,
  Trophy,
  Users,
  Settings,
  Calendar,
  QrCode,
  Loader2,
  Activity,
  GitPullRequest,
  ListOrdered,
  Save,
  CheckCircle2,
  MapPin,
  Flame,
  Award,
} from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  DRAWING: 'Đang bốc thăm',
  DRAWN: 'Đã chia bảng',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
  ARCHIVED: 'Lưu trữ',
};

const FORMAT_LABEL: Record<string, string> = {
  FIXED_DOUBLES: 'Cặp Cố Định (Fixed Doubles)',
  ROTATING_DOUBLES: 'Cặp Xoay Vòng (Rotating Doubles)',
};

function formatDate(d: unknown): string {
  if (!d) return '—';
  const date =
    typeof (d as { toDate?: () => Date }).toDate === 'function'
      ? (d as { toDate: () => Date }).toDate()
      : new Date(d as string);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type Tab = 'info' | 'participants' | 'config';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();
  const isAdmin = useIsAdmin();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');

  const [saving, setSaving] = useState(false);
  const [configForm, setConfigForm] = useState<TournamentConfig | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getTournament(id),
      getParticipants(id).catch(() => []),
    ])
      .then(([t, p]) => {
        setTournament(t);
        setParticipants(p);
        if (t) setConfigForm(t.config);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-400 text-sm">Đang tải thông tin giải đấu...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="page-container text-center py-20 space-y-4">
        <Trophy className="w-12 h-12 text-slate-700 mx-auto" />
        <p className="text-slate-300 text-lg font-semibold">Không tìm thấy giải đấu</p>
        <button onClick={() => navigate('/tournaments')} className="btn-secondary">
          ← Quay lại danh sách giải
        </button>
      </div>
    );
  }

  const canEdit = isEditor && (tournament.status === 'DRAFT' || isAdmin);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !configForm) return;
    setSaving(true);
    try {
      await updateTournamentConfig(id, configForm);
      setTournament({ ...tournament, config: configForm });
      alert('Đã cập nhật cấu hình giải đấu thành công!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container space-y-8 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate('/tournaments')}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách giải
      </button>

      {/* Hero Header Card */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`status-${tournament.status.toLowerCase()} text-xs font-bold`}>
                {STATUS_LABEL[tournament.status] ?? tournament.status}
              </span>
              <span className="badge-blue text-xs font-bold">
                {FORMAT_LABEL[tournament.config.format] ?? tournament.config.format}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
              {tournament.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-400" />
                Sân Pickleball Trung Tâm Yên Định
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(tournament.startDate)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-500" />
                {tournament.config.scheduling.courts} Sân thi đấu
              </span>
            </p>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Link
              to={`/tournaments/${id}/live`}
              className="btn-primary flex-1 lg:flex-none justify-center px-4 py-2.5 text-xs sm:text-sm font-bold gap-2 shadow-lg shadow-orange-950/60"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              Live Kiosk
            </Link>

            <Link
              to={`/tournaments/${id}/standings`}
              className="btn-secondary flex-1 lg:flex-none justify-center px-4 py-2.5 text-xs sm:text-sm font-semibold gap-1.5"
            >
              <ListOrdered className="w-4 h-4" />
              Bảng Điểm
            </Link>

            <Link
              to={`/tournaments/${id}/schedule`}
              className="btn-secondary flex-1 lg:flex-none justify-center px-4 py-2.5 text-xs sm:text-sm font-semibold gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              Lịch Đấu
            </Link>

            {canEdit && (
              <Link
                to={`/tournaments/${id}/draw`}
                className="btn-secondary flex-1 lg:flex-none justify-center px-4 py-2.5 text-xs sm:text-sm font-semibold gap-1.5 border-orange-500/40 text-orange-300"
              >
                <GitPullRequest className="w-4 h-4" />
                Bốc Thăm
              </Link>
            )}
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Link
            to={`/tournaments/${id}/schedule`}
            className="glass-card p-3 rounded-xl flex items-center justify-between hover:border-orange-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-white">Lịch Thi Đấu</span>
            </div>
            <span className="text-[11px] text-slate-400">Xem →</span>
          </Link>

          <Link
            to={`/tournaments/${id}/standings`}
            className="glass-card p-3 rounded-xl flex items-center justify-between hover:border-blue-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ListOrdered className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Bảng Xếp Hạng</span>
            </div>
            <span className="text-[11px] text-slate-400">Xem →</span>
          </Link>

          <Link
            to={`/tournaments/${id}/knockout`}
            className="glass-card p-3 rounded-xl flex items-center justify-between hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Nhánh Knockout</span>
            </div>
            <span className="text-[11px] text-slate-400">Xem →</span>
          </Link>

          <Link
            to={`/tournaments/${id}/live`}
            className="glass-card p-3 rounded-xl flex items-center justify-between hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">QR / Màn Hình Sân</span>
            </div>
            <span className="text-[11px] text-slate-400">Mở →</span>
          </Link>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
          <button
            onClick={() => setTab('info')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'info'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Tổng Quan Giải Đấu
          </button>
          <button
            onClick={() => setTab('participants')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'participants'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Danh Sách VĐV ({participants.length})
          </button>
          {canEdit && (
            <button
              onClick={() => setTab('config')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                tab === 'config'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Cấu Hình Giải
            </button>
          )}
        </div>

        {/* Tab 1: Info */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                Thông Tin Cơ Bản
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-white/[0.06]">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Tên giải đấu:</span>
                  <span className="font-bold text-white">{tournament.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Thể thức:</span>
                  <span className="font-bold text-orange-400">{FORMAT_LABEL[tournament.config.format]}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Ngày khai mạc:</span>
                  <span className="font-bold text-white">{formatDate(tournament.startDate)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Địa điểm:</span>
                  <span className="font-bold text-white">Sân Pickleball Trung Tâm Yên Định</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Trạng thái hiện tại:</span>
                  <span className={`status-${tournament.status.toLowerCase()}`}>
                    {STATUS_LABEL[tournament.status]}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Quy Chuẩn Thi Đấu
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-white/[0.06]">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Số sân sử dụng:</span>
                  <span className="font-bold text-white">{tournament.config.scheduling.courts} Sân</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Vận động viên tối đa:</span>
                  <span className="font-bold text-white">{tournament.config.participants.maxPlayers} VĐV</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Điểm thắng trận:</span>
                  <span className="font-bold text-emerald-400">{tournament.config.scoring.pointsToWin} Điểm (Cách biệt 2đ)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Vòng Knockout Play-off:</span>
                  <span className="font-bold text-white">
                    {tournament.config.knockout.enabled ? 'Bật (Lấy 2 đội đầu bảng)' : 'Tắt'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Thời gian nghỉ giữa trận:</span>
                  <span className="font-bold text-white">{tournament.config.scheduling.restBetweenMatches} phút</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Participants */}
        {tab === 'participants' && (
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Danh Sách Vận Động Viên Đăng Ký ({participants.length})
              </h3>
              {canEdit && (
                <Link to={`/members`} className="btn-secondary text-xs px-3 py-1.5">
                  Quản lý thành viên
                </Link>
              )}
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12 space-y-2 border border-dashed border-white/10 rounded-2xl">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-300 font-semibold">Chưa có VĐV đăng ký trong giải này</p>
                <p className="text-xs text-slate-500">Các VĐV từ danh sách thành viên sẽ được bốc thăm vào bảng</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="border-b border-white/[0.08] text-slate-400 bg-white/[0.02]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Họ và Tên</th>
                      <th className="py-3 px-4">Trường THPT</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {participants.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-score">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-slate-400">{p.school}</td>
                        <td className="py-3 px-4">
                          <span className="badge-emerald text-[11px] font-bold">
                            {p.registrationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Config */}
        {tab === 'config' && configForm && (
          <div className="glass-panel p-6 sm:p-8 max-w-2xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Chỉnh Sửa Cấu Hình Giải Đấu
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Số Sân Thi Đấu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={configForm.scheduling.courts}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        scheduling: {
                          ...configForm.scheduling,
                          courts: parseInt(e.target.value) || 2,
                        },
                      })
                    }
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Số VĐV Tối Đa
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={64}
                    value={configForm.participants.maxPlayers}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        participants: {
                          ...configForm.participants,
                          maxPlayers: parseInt(e.target.value) || 16,
                        },
                      })
                    }
                    className="input-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Điểm Thắng Trận
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={21}
                    value={configForm.scoring.pointsToWin}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        scoring: {
                          ...configForm.scoring,
                          pointsToWin: parseInt(e.target.value) || 11,
                        },
                      })
                    }
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Thời Gian Nghỉ (Phút)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={configForm.scheduling.restBetweenMatches}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        scheduling: {
                          ...configForm.scheduling,
                          restBetweenMatches: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    className="input-base"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
