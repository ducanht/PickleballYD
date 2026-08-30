import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournament, getMatches } from '../../features/tournaments/tournamentService';
import type { Tournament, Match } from '../../types';
import { Trophy, Calendar, Filter, ArrowLeft, Loader2 } from 'lucide-react';

export default function PublicSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getMatches(id)])
      .then(([t, m]) => {
        setTournament(t);
        setMatches(m);
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

  const groupsList = Array.from(new Set(matches.map((m) => m.groupId).filter(Boolean))) as string[];
  const filteredMatches = selectedGroup === 'ALL'
    ? matches
    : matches.filter((m) => m.groupId === selectedGroup);

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
              <Calendar className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Lịch Thi Đấu: {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Cập nhật trực tiếp kết quả tất cả các trận đấu
            </p>
          </div>
          <button
            onClick={() => navigate(`/tournaments/${id}/standings`)}
            className="btn-primary text-sm"
          >
            Xem BXH
          </button>
        </div>
      </div>

      {/* Filter */}
      {groupsList.length > 0 && (
        <div className="card mb-6 p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-slate-400">Lọc theo bảng:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-base text-xs py-1.5 px-3"
            >
              <option value="ALL">Tất cả bảng</option>
              {groupsList.map((g) => (
                <option key={g} value={g}>
                  Bảng {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">Chưa có lịch thi đấu</p>
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
                className={`card p-5 ${
                  isLive
                    ? 'border-orange-500/60 shadow-lg shadow-orange-500/10'
                    : isCompleted
                    ? 'border-slate-800/80 bg-slate-900/40'
                    : 'border-slate-800 bg-slate-900/70'
                }`}
              >
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
                      {isCompleted ? 'Kết thúc' : isLive ? 'Đang đấu' : 'Sắp đấu'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className={`flex justify-between items-center p-2.5 rounded-lg ${
                      match.winner === 'TEAM1' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-950/40'
                    }`}
                  >
                    <p className={`text-sm font-bold truncate ${match.winner === 'TEAM1' ? 'text-orange-400' : 'text-white'}`}>
                      {match.team1.p1Name} / {match.team1.p2Name}
                    </p>
                    <span className={`text-xl font-extrabold px-2 ${match.winner === 'TEAM1' ? 'text-orange-400' : 'text-slate-300'}`}>
                      {currentScore.score1}
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center p-2.5 rounded-lg ${
                      match.winner === 'TEAM2' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-950/40'
                    }`}
                  >
                    <p className={`text-sm font-bold truncate ${match.winner === 'TEAM2' ? 'text-orange-400' : 'text-white'}`}>
                      {match.team2.p1Name} / {match.team2.p2Name}
                    </p>
                    <span className={`text-xl font-extrabold px-2 ${match.winner === 'TEAM2' ? 'text-orange-400' : 'text-slate-300'}`}>
                      {currentScore.score2}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
