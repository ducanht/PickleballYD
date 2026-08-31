import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTournaments, createTournament } from '../../features/tournaments/tournamentService';
import { useIsEditor } from '../../contexts/AuthContext';
import type { Tournament, TournamentStatus, TournamentConfig } from '../../types';
import {
  Trophy,
  Plus,
  Calendar,
  Settings,
  Loader2,
  Search,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';

const FORMAT_LABEL: Record<string, string> = {
  FIXED_DOUBLES: 'Fixed Doubles (Cặp Cố Định)',
  ROTATING_DOUBLES: 'Rotating Doubles (Cặp Xoay Vòng)',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  DRAWING: 'Đang bốc thăm',
  DRAWN: 'Đã chia bảng',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Kết thúc',
  CANCELLED: 'Hủy',
  ARCHIVED: 'Lưu trữ',
};

const DEFAULT_CONFIG: TournamentConfig = {
  format: 'FIXED_DOUBLES',
  participants: { genderMode: 'MIXED', maxPlayers: 16 },
  rotating: {
    uniquePartnersRequired: 3,
    matchesRequiredPerPlayer: 'AUTO',
    maxPartnerRepeat: 1,
    balanceMatches: true,
    balanceRest: true,
    minimizeOpponentRepeat: true,
  },
  groups: { numberOfGroups: 2, maxEntitiesPerGroup: 4, assignmentMode: 'RANDOM' },
  scoring: { matchFormat: 'SINGLE_GAME', pointsToWin: 11, winByTwo: true, maxPoints: 15 },
  ranking: { rules: ['MATCH_WINS', 'POINT_DIFFERENCE', 'POINTS_WON', 'HEAD_TO_HEAD'] },
  knockout: { enabled: true, qualifiersPerGroup: 2, pairingMode: 'FIXED_BRACKET', drawMode: 'RANDOM' },
  scheduling: { courts: 2, restBetweenMatches: 5 },
};

function formatDate(dateInput: unknown): string {
  if (!dateInput) return '—';
  const d =
    typeof (dateInput as { toDate?: () => Date }).toDate === 'function'
      ? (dateInput as { toDate: () => Date }).toDate()
      : new Date(dateInput as string);
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

type TabFilter = 'ALL' | TournamentStatus;

interface CreateForm {
  name: string;
  format: 'FIXED_DOUBLES' | 'ROTATING_DOUBLES';
  startDate: string;
  venue: string;
  courts: number;
  maxPlayers: number;
}

export default function TournamentListPage() {
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: '',
    format: 'FIXED_DOUBLES',
    startDate: new Date().toISOString().split('T')[0],
    venue: 'Sân Pickleball Trung Tâm Yên Định',
    courts: 2,
    maxPlayers: 16,
  });

  const loadData = () => {
    setLoading(true);
    getTournaments()
      .then((data) => {
        setTournaments(data);
        setError(null);
      })
      .catch((e) => {
        setError(e.message ?? 'Lỗi tải danh sách giải đấu');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) return;
    setCreating(true);
    try {
      const newId = await createTournament({
        name: form.name.trim(),
        startDate: form.startDate as unknown as import('firebase/firestore').Timestamp,
        status: 'DRAFT',
        config: {
          ...DEFAULT_CONFIG,
          format: form.format,
          scheduling: { courts: form.courts, restBetweenMatches: 5 },
          participants: { genderMode: 'MIXED', maxPlayers: form.maxPlayers },
        },
        publicSlug: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
        createdBy: '',
      });
      setShowCreate(false);
      navigate(`/tournaments/${newId}`);
    } catch (e: unknown) {
      alert((e as Error).message ?? 'Lỗi tạo giải đấu');
    } finally {
      setCreating(false);
    }
  };

  const TABS: { key: TabFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'ONGOING', label: 'Đang diễn ra' },
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'DRAWN', label: 'Đã chia bảng' },
    { key: 'COMPLETED', label: 'Đã kết thúc' },
  ];

  const visible = tournaments.filter((t) => {
    const matchTab = tab === 'ALL' || t.status === tab;
    const matchSearch =
      search.trim() === '' ||
      t.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="page-container space-y-8">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white/[0.04] to-transparent p-6 rounded-3xl border border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/60">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Hệ Thống Giải Đấu
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Tổ chức thi đấu, bốc thăm, cập nhật lịch và phát trực tiếp Live Score
            </p>
          </div>
        </div>

        {isEditor && (
          <button
            id="btn-create-tournament"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/40 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Giải Mới</span>
          </button>
        )}
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                tab === key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm giải đấu..."
            className="input-base pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* ── Tournaments Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải danh sách giải đấu...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 border-red-500/30 text-red-300 text-center">
          ⚠️ {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Không tìm thấy giải đấu phù hợp</h3>
            <p className="text-slate-400 text-sm">
              {search ? 'Hãy thử tìm bằng từ khóa khác' : 'Chưa có giải đấu nào trong danh mục này'}
            </p>
          </div>
          {isEditor && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary text-xs px-4 py-2 mt-2"
            >
              Tạo giải đấu ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((t) => (
            <div
              key={t.id}
              className="glass-card p-6 flex flex-col justify-between space-y-5 group relative"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                      t.config.format === 'FIXED_DOUBLES' ? 'badge-blue' : 'badge-orange'
                    }`}
                  >
                    {t.config.format === 'FIXED_DOUBLES' ? 'Fixed Doubles' : 'Rotating Doubles'}
                  </span>
                  <span className={`status-${t.status.toLowerCase()} text-[11px]`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>

                {/* Tournament title */}
                <h3
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  className="text-lg font-extrabold text-white group-hover:text-orange-400 transition-colors leading-snug line-clamp-2 cursor-pointer font-display"
                >
                  {t.name}
                </h3>

                {/* Venue & courts */}
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="line-clamp-1">Sân Pickleball Trung Tâm Yên Định</span>
                </p>
              </div>

              {/* Meta details */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(t.startDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    {t.config.scheduling.courts} Sân • {t.config.scoring.pointsToWin}đ
                  </span>
                </div>

                {/* Card action shortcuts */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="btn-secondary py-2 text-xs font-semibold text-center justify-center"
                  >
                    Quản Lý
                  </Link>
                  <Link
                    to={`/tournaments/${t.id}/live`}
                    className="btn-primary py-2 text-xs font-bold text-center justify-center gap-1"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Live Score
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Tournament Modal ───────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5 font-display">
                <Trophy className="w-5 h-5 text-orange-500" />
                Khởi Tạo Giải Đấu Mới
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên Giải Đấu *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base"
                  placeholder="VD: Giải Pickleball Cây Vợt Vàng Yên Định 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Hình Thức Thi Đấu *
                  </label>
                  <select
                    value={form.format}
                    onChange={(e) =>
                      setForm({ ...form, format: e.target.value as CreateForm['format'] })
                    }
                    className="input-base"
                  >
                    <option value="FIXED_DOUBLES">Cặp Cố Định (Fixed Doubles)</option>
                    <option value="ROTATING_DOUBLES">Cặp Xoay Vòng (Rotating Doubles)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ngày Khởi Tranh *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa Điểm Sân Đấu
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="input-base"
                  placeholder="VD: Sân Pickleball Trung Tâm Yên Định"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Số Sân Thi Đấu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.courts}
                    onChange={(e) => setForm({ ...form, courts: parseInt(e.target.value) || 2 })}
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
                    value={form.maxPlayers}
                    onChange={(e) => setForm({ ...form, maxPlayers: parseInt(e.target.value) || 16 })}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary text-xs px-4 py-2.5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-xs px-5 py-2.5 font-bold"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác Nhận Tạo Giải'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
