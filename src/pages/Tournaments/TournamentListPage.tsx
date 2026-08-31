import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTournaments, createTournament } from '../../features/tournaments/tournamentService';
import { TournamentCreateModal } from '../../features/tournaments/components/TournamentCreateModal';
import { useIsEditor } from '../../contexts/AuthContext';
import type { Tournament, TournamentStatus, TournamentConfig, GenderMode } from '../../types';
import {
  Trophy,
  Plus,
  Calendar,
  Settings,
  Loader2,
  Search,
  Activity,
  MapPin,
  Layers,
  Users,
} from 'lucide-react';

const FORMAT_LABEL: Record<string, string> = {
  FIXED_DOUBLES: 'Fixed Doubles (Cặp Cố Định)',
  ROTATING_DOUBLES: 'Rotating Doubles (Cặp Xoay Vòng)',
};

const GENDER_MODE_LABEL: Record<GenderMode, string> = {
  MALE: 'Đôi Nam',
  FEMALE: 'Đôi Nữ',
  MIXED: 'Đôi Nam Nữ',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  DRAWING: 'Đang bốc thăm',
  DRAWN: 'Đã chia bảng',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Kết thúc',
  CANCELLED: 'Hủy',
  ARCHIVED: 'Lưu trữ',
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

export default function TournamentListPage() {
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const handleCreateTournament = async ({
    name,
    startDate,
    venue: _venue,
    config,
  }: {
    name: string;
    startDate: string;
    venue: string;
    config: TournamentConfig;
  }) => {
    setCreating(true);
    try {
      const newId = await createTournament({
        name,
        startDate: startDate as unknown as import('firebase/firestore').Timestamp,
        status: 'DRAFT',
        config,
        publicSlug: name.toLowerCase().replace(/\s+/g, '-'),
        createdBy: '',
      });
      setShowCreateModal(false);
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
              Hội Cựu Học Sinh Yên Định • Quản lý giải đấu, bốc thăm & phát trực tiếp Live Score
            </p>
          </div>
        </div>

        {isEditor && (
          <button
            id="btn-create-tournament"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/40 w-full sm:w-auto justify-center cursor-pointer"
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
              onClick={() => setShowCreateModal(true)}
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                        t.config.format === 'FIXED_DOUBLES' ? 'badge-blue' : 'badge-orange'
                      }`}
                    >
                      {t.config.format === 'FIXED_DOUBLES' ? 'Fixed Doubles' : 'Rotating Doubles'}
                    </span>
                    {t.config.participants?.genderMode && (
                      <span className="badge-emerald text-[11px] font-bold">
                        {GENDER_MODE_LABEL[t.config.participants.genderMode] || t.config.participants.genderMode}
                      </span>
                    )}
                  </div>
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

                {/* Venue & Groups Info */}
                <div className="space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="line-clamp-1">Sân Pickleball Trung Tâm Yên Định</span>
                  </p>
                  <p className="flex items-center gap-3 text-slate-300 font-semibold pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      {t.config.groups?.numberOfGroups || 1} Bảng đấu
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {t.config.participants?.maxPlayers || 16} VĐV
                    </span>
                  </p>
                </div>
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
                    {t.config.scheduling?.courts || 2} Sân • {t.config.scoring?.pointsToWin || 11}đ
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

      {/* ── Advanced Tournament Create Modal ───────────────────────────── */}
      <TournamentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTournament}
        loading={creating}
      />
    </div>
  );
}
