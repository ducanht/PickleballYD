import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

// ─── Status display helpers ───────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  DRAWING: 'Đang bốc thăm',
  DRAWN: 'Đã chia bảng',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Kết thúc',
  CANCELLED: 'Đã hủy',
  ARCHIVED: 'Lưu trữ',
};

const FORMAT_LABEL: Record<string, string> = {
  FIXED_DOUBLES: 'Cặp Cố Định',
  ROTATING_DOUBLES: 'Cặp Xoay Vòng',
};

function formatDate(d: unknown): string {
  if (!d) return '—';
  const date =
    typeof (d as { toDate?: () => Date }).toDate === 'function'
      ? (d as { toDate: () => Date }).toDate()
      : new Date(d as string);
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'info' | 'participants' | 'config';

// ─── Component ────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();
  const isAdmin = useIsAdmin();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');

  // Config edit
  const [editingConfig, setEditingConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getParticipants(id)])
      .then(([t, p]) => {
        setTournament(t);
        setParticipants(p);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="page-container text-center py-20">
        <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-300 text-lg font-semibold">Không tìm thấy giải đấu</p>
        <button onClick={() => navigate('/tournaments')} className="btn-secondary mt-4">
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const canEdit = isEditor && (tournament.status === 'DRAFT' || isAdmin);
  const isDraft = tournament.status === 'DRAFT';

  return (
    <div className="page-container animate-fade-in-up">
      {/* Back */}
      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Danh sách giải đấu
      </button>

      {/* Hero Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{tournament.name}</h1>
              <span className={`status-${tournament.status.toLowerCase()}`}>
                {STATUS_LABEL[tournament.status] ?? tournament.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(tournament.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-slate-500" />
                {FORMAT_LABEL[tournament.config.format] ?? tournament.config.format}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                {participants.length} VĐV
              </span>
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-500" />
                {tournament.config.scheduling.courts} sân
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate(`/tournaments/${id}/live`)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Live Board
            </button>
            {canEdit && isDraft && (
              <button
                onClick={() => navigate(`/tournaments/${id}/draw`)}
                className="btn-primary text-sm"
              >
                Bốc Thăm →
              </button>
            )}
            {canEdit && tournament.status === 'DRAWN' && (
              <button
                onClick={() => navigate(`/tournaments/${id}/schedule`)}
                className="btn-primary text-sm"
              >
                Xem Lịch Đấu →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 mb-6">
        {([
          { key: 'info' as Tab, label: 'Thông tin', icon: Trophy },
          { key: 'participants' as Tab, label: `VĐV (${participants.length})`, icon: Users },
          { key: 'config' as Tab, label: 'Cấu hình', icon: Settings },
        ] as { key: Tab; label: string; icon: React.FC<{ className?: string }> }[]).map(({ key, label }) => (
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

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Thông tin cơ bản</h3>
            <InfoRow label="Tên giải" value={tournament.name} />
            <InfoRow label="Thể thức" value={FORMAT_LABEL[tournament.config.format]} />
            <InfoRow label="Ngày bắt đầu" value={formatDate(tournament.startDate)} />
            <InfoRow label="Trạng thái" value={STATUS_LABEL[tournament.status]} />
          </div>
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cấu hình giải</h3>
            <InfoRow label="Số sân" value={`${tournament.config.scheduling.courts} sân`} />
            <InfoRow label="Số người tối đa" value={`${tournament.config.participants.maxPlayers} VĐV`} />
            <InfoRow label="Giới tính" value={tournament.config.participants.genderMode} />
            <InfoRow label="Điểm thắng" value={`${tournament.config.scoring.pointsToWin} điểm`} />
            <InfoRow label="Knockout" value={tournament.config.knockout.enabled ? 'Có' : 'Không'} />
          </div>
        </div>
      )}

      {/* Tab: Participants */}
      {tab === 'participants' && (
        <div className="space-y-4">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-center">
              <Users className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-300 font-semibold">Chưa có VĐV đăng ký</p>
              <p className="text-slate-500 text-sm mt-1">Thêm VĐV từ danh sách thành viên</p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">#</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Họ tên</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold hidden sm:table-cell">Trường</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{p.school}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          p.registrationStatus === 'CONFIRMED' ? 'badge-green' :
                          p.registrationStatus === 'WITHDRAWN' ? 'badge-gray' : 'badge-orange'
                        }`}>
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

      {/* Tab: Config */}
      {tab === 'config' && (
        <TournamentConfigTab
          tournament={tournament}
          canEdit={canEdit}
          editing={editingConfig}
          saving={saving}
          onEditToggle={() => setEditingConfig(!editingConfig)}
          onSave={async (updated: Partial<TournamentConfig>) => {
            if (!id) return;
            setSaving(true);
            try {
              await updateTournamentConfig(id, updated);
              setTournament((t) => t ? { ...t, config: { ...t.config, ...updated } } : t);
              setEditingConfig(false);
            } catch (e: unknown) {
              alert((e as Error).message ?? 'Lỗi lưu cấu hình');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

import React from 'react';

function TournamentConfigTab({
  tournament,
  canEdit,
  editing,
  saving,
  onEditToggle,
  onSave,
}: {
  tournament: Tournament;
  canEdit: boolean;
  editing: boolean;
  saving: boolean;
  onEditToggle: () => void;
  onSave: (updated: Partial<TournamentConfig>) => Promise<void>;
}) {
  const [courts, setCourts] = useState(tournament.config.scheduling.courts);
  const [maxPlayers, setMaxPlayers] = useState(tournament.config.participants.maxPlayers);
  const [pointsToWin, setPointsToWin] = useState(tournament.config.scoring.pointsToWin);

  const handleSave = () => {
    onSave({
      scheduling: { ...tournament.config.scheduling, courts },
      participants: { ...tournament.config.participants, maxPlayers },
      scoring: { ...tournament.config.scoring, pointsToWin },
    });
  };

  return (
    <div className="card max-w-lg space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cấu hình thi đấu</h3>
        {canEdit && !editing && (
          <button onClick={onEditToggle} className="btn-secondary text-xs">Chỉnh sửa</button>
        )}
      </div>

      {!editing ? (
        <>
          <InfoRow label="Số sân" value={`${tournament.config.scheduling.courts} sân`} />
          <InfoRow label="Số VĐV tối đa" value={`${tournament.config.participants.maxPlayers}`} />
          <InfoRow label="Điểm thắng" value={`${tournament.config.scoring.pointsToWin}`} />
          <InfoRow label="Thể thức" value={FORMAT_LABEL[tournament.config.format] ?? tournament.config.format} />
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Số sân
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={courts}
              onChange={(e) => setCourts(Number(e.target.value))}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Số VĐV tối đa
            </label>
            <input
              type="number"
              min={4}
              max={64}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Điểm thắng (Win Score)
            </label>
            <input
              type="number"
              min={7}
              max={21}
              value={pointsToWin}
              onChange={(e) => setPointsToWin(Number(e.target.value))}
              className="input-base w-full"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu
            </button>
            <button onClick={onEditToggle} className="btn-secondary text-sm">Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}
