import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getParticipants,
  saveMatches,
  saveDrawRecord,
  updateTournamentStatus,
} from '../../../features/tournaments/tournamentService';
import { generateRotatingSchedule } from '../../../features/rotatingDoubles/rotatingDoublesEngine';
import { feasibilityCheck } from '../../../features/tournaments/engine/feasibilityCheck';
import { useIsEditor } from '../../../contexts/AuthContext';
import type { Tournament, Participant, Match, EnginePlayer, GenderMode } from '../../../types';
import {
  ArrowLeft,
  Trophy,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Layers,
  Users,
  Calendar,
} from 'lucide-react';

const GENDER_MODE_LABEL: Record<GenderMode, string> = {
  MALE: 'VĐV Nam',
  FEMALE: 'VĐV Nữ',
  MIXED: 'Nam & Nữ Hỗn Hợp',
};

export default function RotatingDrawPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [roundsCount, setRoundsCount] = useState(4);
  const [previewMatches, setPreviewMatches] = useState<Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getParticipants(id)])
      .then(([t, p]) => {
        setTournament(t);
        setParticipants(p);
        if (t?.config.rotating?.matchesRequiredPerPlayer && typeof t.config.rotating.matchesRequiredPerPlayer === 'number') {
          setRoundsCount(t.config.rotating.matchesRequiredPerPlayer);
        }
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

  if (!isEditor) {
    return (
      <div className="page-container text-center py-20">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-slate-300 text-lg font-semibold">Bạn cần quyền Biên tập viên để bốc thăm giải đấu.</p>
        <button onClick={() => navigate(`/tournaments/${id}`)} className="btn-secondary mt-4">
          Quay lại giải đấu
        </button>
      </div>
    );
  }

  const genderMode = tournament.config.participants?.genderMode || 'MIXED';
  const courts = tournament.config.scheduling?.courts || 2;

  // Feasibility Check
  const feasibility = feasibilityCheck({
    numPlayers: participants.length,
    uniquePartnersRequired: Math.min(
      tournament.config.rotating?.uniquePartnersRequired || 3,
      Math.max(1, participants.length - 1)
    ),
    matchesRequiredPerPlayer: roundsCount,
    courts,
  });

  const handleGenerateRotating = () => {
    if (participants.length < 4) {
      alert('Cần ít nhất 4 VĐV để tổ chức thi đấu Cặp Xoay Vòng.');
      return;
    }

    const enginePlayers: EnginePlayer[] = participants.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    const result = generateRotatingSchedule({
      players: enginePlayers,
      roundsCount,
      courts,
      seed: `${tournament.id}-${Date.now()}`,
    });

    const playerMap = new Map(participants.map((p) => [p.id, p.name]));
    const matchesToCreate: Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[] = [];

    for (const rd of result.rounds) {
      for (const m of rd.matches) {
        matchesToCreate.push({
          stage: 'GROUP',
          round: m.round,
          groupId: null,
          order: m.order,
          courtId: m.courtId,
          team1: {
            p1Id: m.team1[0],
            p1Name: playerMap.get(m.team1[0]) || 'VĐV 1',
            p2Id: m.team1[1],
            p2Name: playerMap.get(m.team1[1]) || 'VĐV 2',
          },
          team2: {
            p1Id: m.team2[0],
            p1Name: playerMap.get(m.team2[0]) || 'VĐV 3',
            p2Id: m.team2[1],
            p2Name: playerMap.get(m.team2[1]) || 'VĐV 4',
          },
          games: [{ score1: 0, score2: 0 }],
          score1Total: 0,
          score2Total: 0,
          winner: 'NONE',
          status: 'SCHEDULED',
          operatorId: null,
        });
      }
    }

    setPreviewMatches(matchesToCreate);
  };

  const handleCommitSchedule = async () => {
    if (!id || previewMatches.length === 0) return;
    setGenerating(true);
    try {
      await saveMatches(id, previewMatches);

      await saveDrawRecord(id, {
        drawType: 'PARTNER',
        seed: `${id}-${Date.now()}`,
        algorithmVersion: '1.2.0',
        inputHash: `${participants.length}-${roundsCount}`,
        result: {
          participantsCount: participants.length,
          roundsCount,
          matchesCount: previewMatches.length,
        },
        validation: { passed: true, errors: [], warnings: [] },
        createdBy: tournament.createdBy || 'editor',
      });

      await updateTournamentStatus(id, 'DRAWN');

      alert('Đã lưu lịch thi đấu Xoay Vòng thành công!');
      navigate(`/tournaments/${id}`);
    } catch (e: unknown) {
      alert((e as Error).message ?? 'Lỗi lưu lịch thi đấu');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container space-y-8 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate(`/tournaments/${id}`)}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại chi tiết giải đấu
      </button>

      {/* Top Header Card */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="badge-orange text-xs font-bold">Rotating Doubles</span>
              <span className="badge-emerald text-xs font-bold">
                {GENDER_MODE_LABEL[genderMode]}
              </span>
              <span className="badge-blue text-xs font-bold">
                {participants.length} VĐV Đăng Ký
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Bốc Thăm & Tạo Lịch Xoay Vòng: {tournament.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Mỗi vòng đấu các VĐV sẽ xoay chuyển ghép đôi với bạn cặp mới và tích lũy điểm cá nhân.
            </p>
          </div>
        </div>

        {/* Config and Feasibility Controls */}
        <div className="glass-card p-5 space-y-4 border-white/[0.08]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Số Lượt Đấu Mỗi VĐV
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={roundsCount}
                  onChange={(e) => setRoundsCount(parseInt(e.target.value) || 4)}
                  className="input-base text-xs py-2 w-28"
                />
              </div>
              <div className="text-xs text-slate-400 pt-4">
                Tổng dự kiến: <strong className="text-white">{Math.floor((participants.length * roundsCount) / 4)} trận</strong> ({courts} sân)
              </div>
            </div>

            <button
              onClick={handleGenerateRotating}
              className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-950/40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo Lịch Thi Đấu Xoay Vòng</span>
            </button>
          </div>

          {!feasibility.feasible && (
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Cảnh báo tính khả thi:</span>
              </div>
              {feasibility.errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
              {feasibility.suggestions.map((sug, i) => (
                <p key={i} className="text-slate-300">
                  💡 Gợi ý: {sug}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Generated Matches Preview ────────────────────────────────────── */}
      {previewMatches.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Xem Trước Lịch Thi Đấu Xoay Vòng ({previewMatches.length} trận đấu)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các cặp đấu đã được tối ưu hóa hạn chế tối đa lặp bạn cặp
              </p>
            </div>

            <button
              onClick={handleCommitSchedule}
              disabled={generating}
              className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Lưu Lịch Đấu</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
            {previewMatches.map((m, idx) => (
              <div
                key={idx}
                className="glass-card p-4 flex items-center justify-between gap-3 text-xs border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center font-score">
                    #{m.order}
                  </span>
                  <div>
                    <div className="text-slate-400 text-[11px]">
                      Vòng {m.round} • <span className="text-emerald-400 font-semibold">{m.courtId}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      <span className="text-orange-400">{m.team1.p1Name} & {m.team1.p2Name}</span>
                      <span className="text-slate-500 mx-2">VS</span>
                      <span className="text-blue-400">{m.team2.p1Name} & {m.team2.p2Name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/[0.08]">
            <button
              onClick={handleCommitSchedule}
              disabled={generating}
              className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Lưu Lịch Đấu</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
