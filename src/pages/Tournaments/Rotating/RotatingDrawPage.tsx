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
import { useIsEditor } from '../../../contexts/AuthContext';
import type { Tournament, Participant, Match, EnginePlayer } from '../../../types';
import {
  ArrowLeft,
  Trophy,
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

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
      courts: tournament.config.scheduling.courts || 2,
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
        algorithmVersion: '1.0.0',
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
      alert('Đã tạo lịch thi đấu Xoay Vòng thành công!');
      navigate(`/tournaments/${id}/schedule`);
    } catch (err: unknown) {
      alert((err as Error).message || 'Có lỗi khi lưu lịch thi đấu.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate(`/tournaments/${id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại giải đấu
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Bốc Thăm Cặp Xoay Vòng: {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Thể thức Rotating Doubles · {participants.length} VĐV đã đăng ký
            </p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="card mb-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-orange-400" />
          Cấu Hình Lịch Xoay Vòng
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Số lượng vòng thi đấu
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={roundsCount}
              onChange={(e) => setRoundsCount(Number(e.target.value))}
              className="input-base w-full"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateRotating}
              disabled={participants.length < 4}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Repeat className="w-4 h-4" />
              Tạo Lịch Xoay Vòng
            </button>
          </div>
        </div>

        {participants.length < 4 && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cần tối thiểu 4 VĐV để tạo lịch thi đấu Xoay Vòng.</span>
          </div>
        )}
      </div>

      {/* Preview Fixtures */}
      {previewMatches.length > 0 && (
        <div className="card space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Xem Trước Lịch Thi Đấu ({previewMatches.length} trận · {roundsCount} vòng)
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Các VĐV được ghép cặp luân phiên ngẫu nhiên giảm thiểu tối đa trùng cặp.
              </p>
            </div>
            <button
              onClick={handleCommitSchedule}
              disabled={generating}
              className="btn-primary flex items-center gap-2 text-sm shrink-0"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Xác Nhận & Bắt Đầu Giải
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs">
                  <th className="text-left px-3 py-2">Trận</th>
                  <th className="text-left px-3 py-2">Vòng</th>
                  <th className="text-left px-3 py-2">Sân</th>
                  <th className="text-left px-3 py-2">Đôi 1</th>
                  <th className="text-center px-3 py-2">VS</th>
                  <th className="text-left px-3 py-2">Đôi 2</th>
                </tr>
              </thead>
              <tbody>
                {previewMatches.map((m) => (
                  <tr key={m.order} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                    <td className="px-3 py-2.5 font-bold text-orange-400">#{m.order}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-medium">Vòng {m.round}</td>
                    <td className="px-3 py-2.5 text-slate-400">{m.courtId}</td>
                    <td className="px-3 py-2.5 font-medium text-white">
                      {m.team1.p1Name} & {m.team1.p2Name}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500 font-bold">vs</td>
                    <td className="px-3 py-2.5 font-medium text-white">
                      {m.team2.p1Name} & {m.team2.p2Name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
