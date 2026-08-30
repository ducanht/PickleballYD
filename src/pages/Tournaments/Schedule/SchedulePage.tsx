import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getMatches,
  updateMatchScore,
  completeMatch,
} from '../../../features/tournaments/tournamentService';
import { useIsEditor, useIsAdmin } from '../../../contexts/AuthContext';
import type { Tournament, Match, GameScore } from '../../../types';
import {
  ArrowLeft,
  Calendar,
  Play,
  CheckCircle2,
  Edit3,
  Loader2,
  Filter,
  Trophy,
} from 'lucide-react';

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();
  const isAdmin = useIsAdmin();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Score Modal state
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [adminReason, setAdminReason] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  const loadData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getMatches(id)])
      .then(([t, m]) => {
        setTournament(t);
        setMatches(m);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Open Score Modal
  const handleOpenScoreModal = (match: Match) => {
    setActiveMatch(match);
    const currentGame = match.games[0] || { score1: 0, score2: 0 };
    setScore1(currentGame.score1);
    setScore2(currentGame.score2);
    setAdminReason('');
  };

  // Submit Score Update
  const handleSaveScore = async (andComplete: boolean = false) => {
    if (!id || !activeMatch) return;
    setSavingScore(true);
    try {
      const newGames: GameScore[] = [{ score1, score2 }];
      await updateMatchScore(
        id,
        activeMatch.id,
        newGames,
        activeMatch.status === 'COMPLETED' ? adminReason : undefined
      );

      if (andComplete) {
        await completeMatch(id, activeMatch.id);
      }

      setActiveMatch(null);
      loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi lưu điểm số');
    } finally {
      setSavingScore(false);
    }
  };

  // Filter matches
  const groupsList = Array.from(new Set(matches.map((m) => m.groupId).filter(Boolean))) as string[];
  const filteredMatches = matches.filter((m) => {
    if (selectedGroup !== 'ALL' && m.groupId !== selectedGroup) return false;
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="page-container animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate(`/tournaments/${id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại chi tiết giải đấu
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Lịch & Kết Quả Thi Đấu: {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Tổng cộng {matches.length} trận đấu · {matches.filter((m) => m.status === 'COMPLETED').length} trận đã hoàn thành
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/tournaments/${id}/live`)}
              className="btn-secondary text-sm"
            >
              Mở Bảng Trực Tiếp
            </button>
            <button
              onClick={() => navigate(`/tournaments/${id}/standings`)}
              className="btn-primary text-sm"
            >
              Xem BXH
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Filter className="w-4 h-4 text-orange-400" />
            Bộ lọc:
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Bảng:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-base text-xs py-1.5 px-3"
            >
              <option value="ALL">Tất cả các bảng</option>
              {groupsList.map((g) => (
                <option key={g} value={g}>
                  Bảng {g}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-base text-xs py-1.5 px-3"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SCHEDULED">Chờ thi đấu</option>
              <option value="IN_PROGRESS">Đang đấu</option>
              <option value="COMPLETED">Đã kết thúc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches List Grid */}
      {filteredMatches.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">Không tìm thấy trận đấu phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const isCompleted = match.status === 'COMPLETED';
            const isLive = match.status === 'IN_PROGRESS';
            const currentScore = match.games[0] || { score1: 0, score2: 0 };

            return (
              <div
                key={match.id}
                className={`card relative p-5 transition-all ${
                  isLive
                    ? 'border-orange-500/60 shadow-lg shadow-orange-500/10'
                    : isCompleted
                    ? 'border-slate-800/80 bg-slate-900/40'
                    : 'border-slate-800 bg-slate-900/70'
                }`}
              >
                {/* Top Badge Info */}
                <div className="flex justify-between items-center mb-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400">#{match.order}</span>
                    {match.groupId && <span className="badge badge-blue">Bảng {match.groupId}</span>}
                    <span className="badge badge-gray">Vòng {match.round}</span>
                    {match.courtId && <span>{match.courtId}</span>}
                  </div>
                  <div>
                    <span
                      className={`badge ${
                        isCompleted
                          ? 'badge-green'
                          : isLive
                          ? 'badge-orange animate-pulse'
                          : 'badge-gray'
                      }`}
                    >
                      {isCompleted ? 'Hoàn thành' : isLive ? 'Đang đấu' : 'Sắp diễn ra'}
                    </span>
                  </div>
                </div>

                {/* Teams & Scores Row */}
                <div className="space-y-3 mb-5">
                  {/* Team 1 */}
                  <div
                    className={`flex justify-between items-center p-2.5 rounded-lg ${
                      match.winner === 'TEAM1' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-950/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={`text-sm font-bold truncate ${match.winner === 'TEAM1' ? 'text-orange-400' : 'text-white'}`}>
                        {match.team1.p1Name} / {match.team1.p2Name}
                      </p>
                    </div>
                    <span className={`text-xl font-extrabold px-2 ${match.winner === 'TEAM1' ? 'text-orange-400' : 'text-slate-300'}`}>
                      {currentScore.score1}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div
                    className={`flex justify-between items-center p-2.5 rounded-lg ${
                      match.winner === 'TEAM2' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-950/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={`text-sm font-bold truncate ${match.winner === 'TEAM2' ? 'text-orange-400' : 'text-white'}`}>
                        {match.team2.p1Name} / {match.team2.p2Name}
                      </p>
                    </div>
                    <span className={`text-xl font-extrabold px-2 ${match.winner === 'TEAM2' ? 'text-orange-400' : 'text-slate-300'}`}>
                      {currentScore.score2}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditor && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenScoreModal(match)}
                      className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                      {isCompleted ? 'Sửa điểm' : 'Nhập điểm'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Score Entry / Edit Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Nhập Điểm Số · Trận #{activeMatch.order}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Bảng {activeMatch.groupId} · Vòng {activeMatch.round}
            </p>

            <div className="space-y-5">
              {/* Score Input Team 1 */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-orange-400 mb-1 truncate">
                  {activeMatch.team1.p1Name} / {activeMatch.team1.p2Name}
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={score1}
                  onChange={(e) => setScore1(Number(e.target.value))}
                  className="input-base text-2xl font-black text-center w-full py-2"
                />
              </div>

              {/* Score Input Team 2 */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-orange-400 mb-1 truncate">
                  {activeMatch.team2.p1Name} / {activeMatch.team2.p2Name}
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={score2}
                  onChange={(e) => setScore2(Number(e.target.value))}
                  className="input-base text-2xl font-black text-center w-full py-2"
                />
              </div>

              {/* Admin Reason (if completed) */}
              {activeMatch.status === 'COMPLETED' && isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1.5">
                    Lý do sửa điểm (Bắt buộc per BR-006) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Trọng tài nhập nhầm điểm game 1"
                    value={adminReason}
                    onChange={(e) => setAdminReason(e.target.value)}
                    className="input-base w-full text-xs"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveMatch(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingScore}
                  onClick={() => handleSaveScore(false)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  {savingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Lưu Tỷ Số
                </button>
                <button
                  type="button"
                  disabled={savingScore || score1 === score2}
                  onClick={() => handleSaveScore(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Kết Thúc Trận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
