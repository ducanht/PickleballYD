import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getTournament,
  getParticipants,
  updateTournamentConfig,
} from '../../features/tournaments/tournamentService';
import { useIsEditor, useIsAdmin } from '../../contexts/AuthContext';
import type { Tournament, Participant, TournamentConfig, GenderMode, AssignmentMode, MatchFormat } from '../../types';
import {
  ArrowLeft,
  Trophy,
  Users,
  Settings,
  Calendar,
  Loader2,
  Activity,
  Layers,
  Save,
  CheckCircle2,
  MapPin,
  Flame,
  Award,
  Sparkles,
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

const GENDER_MODE_LABEL: Record<GenderMode, string> = {
  MALE: 'Đôi Nam',
  FEMALE: 'Đôi Nữ',
  MIXED: 'Đôi Nam Nữ / Hỗn Hợp',
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
              {tournament.config.participants?.genderMode && (
                <span className="badge-emerald text-xs font-bold">
                  {GENDER_MODE_LABEL[tournament.config.participants.genderMode]}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
              {tournament.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Khởi tranh: {formatDate(tournament.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-400" />
                Sân Pickleball Trung Tâm Yên Định
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                {tournament.config.groups?.numberOfGroups || 1} Bảng đấu • {tournament.config.participants?.maxPlayers || 16} VĐV
              </span>
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Link
              to={`/tournaments/${tournament.id}/live`}
              className="btn-primary px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/40"
            >
              <Activity className="w-4 h-4" />
              Live Board
            </Link>

            {isEditor && (
              <>
                <Link
                  to={`/tournaments/${tournament.id}/draw`}
                  className="btn-secondary px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-orange-400" />
                  Bốc Thăm / Chia Bảng
                </Link>
                <Link
                  to={`/tournaments/${tournament.id}/schedule`}
                  className="btn-secondary px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Lịch Thi Đấu
                </Link>
                <Link
                  to={`/tournaments/${tournament.id}/knockout`}
                  className="btn-secondary px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  Vòng Knockout
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-1">
          <button
            onClick={() => setTab('info')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'info'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Tổng Quan Giải Đấu
          </button>
          <button
            onClick={() => setTab('participants')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'participants'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Vận Động Viên ({participants.length})
          </button>
          {canEdit && (
            <button
              onClick={() => setTab('config')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                tab === 'config'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Cấu Hình Chuyên Sâu
            </button>
          )}
        </div>

        {/* ── Tab 1: Info ──────────────────────────────────────────────── */}
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
                  <span className="font-bold text-white text-right">{tournament.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Thể thức:</span>
                  <span className="font-bold text-orange-400">{FORMAT_LABEL[tournament.config.format]}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Nội dung thi đấu:</span>
                  <span className="font-bold text-emerald-400">
                    {GENDER_MODE_LABEL[tournament.config.participants?.genderMode || 'MIXED']}
                  </span>
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
                Cấu Hình Bảng Đấu & Thi Đấu
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-white/[0.06]">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Số lượng bảng đấu:</span>
                  <span className="font-bold text-white">{tournament.config.groups?.numberOfGroups || 1} Bảng</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Số cặp/VĐV mỗi bảng:</span>
                  <span className="font-bold text-white">
                    {tournament.config.groups?.maxEntitiesPerGroup || 4}{' '}
                    {tournament.config.format === 'FIXED_DOUBLES' ? 'cặp đấu' : 'VĐV'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Tổng VĐV tối đa:</span>
                  <span className="font-bold text-white">{tournament.config.participants?.maxPlayers || 16} VĐV</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Số sân sử dụng:</span>
                  <span className="font-bold text-white">{tournament.config.scheduling?.courts || 2} Sân</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Điểm thắng trận:</span>
                  <span className="font-bold text-emerald-400">
                    {tournament.config.scoring?.pointsToWin || 11} Điểm (Cách biệt 2đ)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Vòng Knockout Play-off:</span>
                  <span className="font-bold text-white">
                    {tournament.config.knockout?.enabled
                      ? `Bật (Lấy ${tournament.config.knockout?.qualifiersPerGroup || 2} đội/bảng)`
                      : 'Tắt'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Participants ──────────────────────────────────────── */}
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
                      <th className="py-3 px-4">Giới tính</th>
                      <th className="py-3 px-4">Trường THPT</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {participants.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-score">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                        </td>
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

        {/* ── Tab 3: Detailed Config Form ───────────────────────────────── */}
        {tab === 'config' && configForm && (
          <div className="glass-panel p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Chỉnh Sửa Cấu Hình Giải Đấu Chi Tiết
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Groups & Category */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Bảng Đấu & Nội Dung Thi Đấu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Nội Dung Thi Đấu</label>
                    <select
                      value={configForm.participants?.genderMode || 'MIXED'}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          participants: {
                            ...configForm.participants,
                            genderMode: e.target.value as GenderMode,
                          },
                        })
                      }
                      className="input-base text-xs"
                    >
                      <option value="MIXED">Đôi Nam Nữ / Hỗn Hợp</option>
                      <option value="MALE">Đôi Nam (Men's)</option>
                      <option value="FEMALE">Đôi Nữ (Women's)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Số Lượng Bảng Đấu</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={configForm.groups?.numberOfGroups || 1}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          groups: {
                            ...configForm.groups,
                            numberOfGroups: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                      className="input-base text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">
                      {configForm.format === 'FIXED_DOUBLES' ? 'Số Cặp Mỗi Bảng' : 'Số VĐV Mỗi Bảng'}
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={32}
                      value={configForm.groups?.maxEntitiesPerGroup || 4}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          groups: {
                            ...configForm.groups,
                            maxEntitiesPerGroup: parseInt(e.target.value) || 4,
                          },
                        })
                      }
                      className="input-base text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Match Scoring & Courts */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Sân Đấu & Quy Chuẩn Điểm
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Số Sân Sử Dụng</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={configForm.scheduling?.courts || 2}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scheduling: {
                            ...configForm.scheduling,
                            courts: parseInt(e.target.value) || 2,
                          },
                        })
                      }
                      className="input-base text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Thể Thức Trận</label>
                    <select
                      value={configForm.scoring?.matchFormat || 'SINGLE_GAME'}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scoring: {
                            ...configForm.scoring,
                            matchFormat: e.target.value as MatchFormat,
                          },
                        })
                      }
                      className="input-base text-xs"
                    >
                      <option value="SINGLE_GAME">1 Set</option>
                      <option value="BEST_OF_3">BO3 (3 Sets)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Điểm Thắng Trận</label>
                    <input
                      type="number"
                      min={7}
                      max={25}
                      value={configForm.scoring?.pointsToWin || 11}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scoring: {
                            ...configForm.scoring,
                            pointsToWin: parseInt(e.target.value) || 11,
                          },
                        })
                      }
                      className="input-base text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">Thời Gian Nghỉ (Phút)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={configForm.scheduling?.restBetweenMatches || 5}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scheduling: {
                            ...configForm.scheduling,
                            restBetweenMatches: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                      className="input-base text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Knockout Play-off */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      3. Vòng Knockout Play-off
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tự động chuyển các đội đầu bảng vào thi đấu nhánh loại trực tiếp.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configForm.knockout?.enabled ?? true}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          knockout: {
                            ...configForm.knockout,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {configForm.knockout?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Số Đội/VĐV Mỗi Bảng Vào Knockout
                      </label>
                      <select
                        value={configForm.knockout?.qualifiersPerGroup || 2}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            knockout: {
                              ...configForm.knockout,
                              qualifiersPerGroup: parseInt(e.target.value) || 2,
                            },
                          })
                        }
                        className="input-base text-xs"
                      >
                        <option value={1}>1 Đội (Chỉ Nhất bảng)</option>
                        <option value={2}>2 Đội (Nhất và Nhì bảng)</option>
                        <option value={4}>4 Đội (Top 4 đội mỗi bảng)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/40 cursor-pointer"
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
