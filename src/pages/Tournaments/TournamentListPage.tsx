import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments, createTournament } from '../../features/tournaments/tournamentService';
import { useIsEditor } from '../../contexts/AuthContext';
import type { Tournament, TournamentStatus, TournamentConfig } from '../../types';
import { Trophy, Plus, Calendar, Settings, Loader2 } from 'lucide-react';

const FORMAT_LABEL: Record<string, string> = {
  FIXED_DOUBLES: 'Fixed Doubles',
  ROTATING_DOUBLES: 'Rotating Doubles',
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
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}

type TabFilter = 'ALL' | TournamentStatus;

interface CreateForm {
  name: string;
  format: 'FIXED_DOUBLES' | 'ROTATING_DOUBLES';
  startDate: string;
}

export default function TournamentListPage() {
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>({ name: '', format: 'FIXED_DOUBLES', startDate: '' });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTournaments()
      .then((data) => { if (alive) { setTournaments(data); setError(null); } })
      .catch((e) => { if (alive) setError(e.message ?? 'Lỗi tải danh sách'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
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
        config: { ...DEFAULT_CONFIG, format: form.format },
        publicSlug: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
        createdBy: '',
      });
      navigate(`/tournaments/${newId}`);
    } catch (e: unknown) {
      alert((e as Error).message ?? 'Lỗi tạo giải đấu');
    } finally {
      setCreating(false);
    }
  };


  const TABS: { key: TabFilter; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'DRAFT', label: 'Nháp' },
    { key: 'ONGOING', label: 'Đang diễn ra' },
    { key: 'COMPLETED', label: 'Kết thúc' },
  ];

  const visible = tab === 'ALL' ? tournaments : tournaments.filter((t) => t.status === tab);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Giải Đấu</h1>
            <p className="text-slate-400 text-sm">Quản lý lịch thi đấu, bốc thăm và bảng xếp hạng</p>
          </div>
        </div>
        {isEditor && (
          <button
            id="btn-create-tournament"
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo Giải Mới
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải giải đấu...</p>
        </div>
      ) : error ? (
        <div className="card border-red-900/50 bg-red-950/20 text-red-400">{error}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-center">
          <Trophy className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">Chưa có giải đấu nào</h3>
          <p className="text-slate-500 text-sm mt-1">
            {tab === 'ALL' ? 'Hãy tạo giải đấu đầu tiên!' : `Không có giải đấu "${STATUS_LABEL[tab]}"`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tournaments/${t.id}`)}
              className="card cursor-pointer hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-white leading-snug line-clamp-2 hover:text-orange-400 transition-colors">
                    {t.name}
                  </h3>
                  <span className={`status-${t.status.toLowerCase()} shrink-0`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                    t.config.format === 'FIXED_DOUBLES' ? 'badge-blue' : 'badge-orange'
                  }`}
                >
                  {FORMAT_LABEL[t.config.format]}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mt-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(t.startDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  {t.config.scheduling.courts} sân
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Tạo Giải Đấu Mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên Giải Đấu *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base w-full"
                  placeholder="VD: Giải Pickleball Cây Vợt Vàng 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Hình Thức
                </label>
                <select
                  value={form.format}
                  onChange={(e) =>
                    setForm({ ...form, format: e.target.value as CreateForm['format'] })
                  }
                  className="input-base w-full"
                >
                  <option value="FIXED_DOUBLES">Cặp Cố Định (Fixed Doubles)</option>
                  <option value="ROTATING_DOUBLES">Cặp Xoay Vòng (Rotating Doubles)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ngày Bắt Đầu *
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input-base w-full"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="btn-primary text-sm">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo Giải'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
