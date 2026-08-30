import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getMatches,
  getGroups,
  getTeams,
  getParticipants,
} from '../../features/tournaments/tournamentService';
import { calculateStandings } from '../../features/tournaments/engine/standingsCalculator';
import type { Tournament, Match, TournamentGroup, StandingEntry } from '../../types';
import { Trophy, Activity, ArrowLeft, Maximize2, Loader2 } from 'lucide-react';

export default function LiveBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupStandings, setGroupStandings] = useState<Array<{ group: TournamentGroup; standings: StandingEntry[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = () => {
    if (!id) return;
    Promise.all([
      getTournament(id),
      getMatches(id),
      getGroups(id),
      getTeams(id),
      getParticipants(id),
    ])
      .then(([t, m, grps, teams, participants]) => {
        setTournament(t);
        setMatches(m);

        const namesMap: Record<string, string> = {};
        for (const tm of teams) namesMap[tm.id] = tm.name;
        for (const p of participants) namesMap[p.id] = p.name;

        const res = grps.map((g) => {
          const groupMatches = m.filter((match) => match.groupId === g.name);
          const standings = calculateStandings({
            entityIds: g.entityIds,
            entityNames: namesMap,
            matches: groupMatches,
            rankingRules: t?.config.ranking.rules || [
              'MATCH_WINS',
              'POINT_DIFFERENCE',
              'POINTS_WON',
              'HEAD_TO_HEAD',
            ],
          });
          return { group: g, standings };
        });

        setGroupStandings(res);
        setLastRefreshed(new Date());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // Polling every 5 seconds for live board updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-300 text-lg font-semibold">Không tìm thấy giải đấu</p>
        <button onClick={() => navigate('/tournaments')} className="btn-secondary mt-4">
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const liveMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
  const recentCompleted = matches
    .filter((m) => m.status === 'COMPLETED')
    .sort((a, b) => b.order - a.order)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Top Bar for TV / Live Board */}
      <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                {tournament.name} · LIVE BOARD
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cập nhật tự động lúc {lastRefreshed.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullScreen}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            title="Toàn màn hình"
          >
            <Maximize2 className="w-4 h-4" />
            Toàn Màn Hình
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Live Matches & Recent (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Live Matches */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
              Trận Đang Diễn Ra ({liveMatches.length})
            </h2>

            {liveMatches.length === 0 ? (
              <div className="card text-center py-10 bg-slate-900/40 border-dashed border-slate-800">
                <p className="text-slate-400 text-sm">Hiện không có trận đấu nào đang diễn ra</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {liveMatches.map((m) => {
                  const currentScore = m.games[0] || { score1: 0, score2: 0 };
                  return (
                    <div
                      key={m.id}
                      className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-orange-500/80 rounded-2xl shadow-xl shadow-orange-500/10"
                    >
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
                        <span className="font-bold text-orange-400">Trận #{m.order}</span>
                        {m.groupId && <span className="badge badge-blue">Bảng {m.groupId}</span>}
                        {m.courtId && <span className="font-semibold text-white">{m.courtId}</span>}
                        <span className="badge badge-orange animate-pulse">LIVE</span>
                      </div>

                      <div className="grid grid-cols-12 items-center gap-4">
                        {/* Team 1 */}
                        <div className="col-span-5 text-right">
                          <p className="font-extrabold text-base sm:text-lg text-white truncate">
                            {m.team1.p1Name} / {m.team1.p2Name}
                          </p>
                        </div>

                        {/* Scores */}
                        <div className="col-span-2 text-center flex items-center justify-center gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-orange-400">
                            {currentScore.score1}
                          </span>
                          <span className="text-slate-600 font-bold text-lg">:</span>
                          <span className="text-3xl sm:text-4xl font-black text-orange-400">
                            {currentScore.score2}
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="col-span-5 text-left">
                          <p className="font-extrabold text-base sm:text-lg text-white truncate">
                            {m.team2.p1Name} / {m.team2.p2Name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Completed Matches */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Kết Quả Vừa Kết Thúc
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentCompleted.map((m) => {
                const currentScore = m.games[0] || { score1: 0, score2: 0 };
                return (
                  <div key={m.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>#{m.order} {m.groupId ? `· Bảng ${m.groupId}` : ''}</span>
                      <span className="text-emerald-400 font-medium">Hoàn thành</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`truncate ${m.winner === 'TEAM1' ? 'font-bold text-white' : 'text-slate-400'}`}>
                          {m.team1.p1Name} / {m.team1.p2Name}
                        </span>
                        <span className={`font-bold ${m.winner === 'TEAM1' ? 'text-orange-400 font-extrabold' : 'text-slate-400'}`}>
                          {currentScore.score1}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`truncate ${m.winner === 'TEAM2' ? 'font-bold text-white' : 'text-slate-400'}`}>
                          {m.team2.p1Name} / {m.team2.p2Name}
                        </span>
                        <span className={`font-bold ${m.winner === 'TEAM2' ? 'text-orange-400 font-extrabold' : 'text-slate-400'}`}>
                          {currentScore.score2}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Standings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            Bảng Xếp Hạng Vòng Bảng
          </h2>

          <div className="space-y-4">
            {groupStandings.map(({ group, standings }) => (
              <div key={group.id} className="card p-0 overflow-hidden border border-slate-800 bg-slate-900/80">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Bảng {group.name}</h3>
                  <span className="text-xs text-orange-400">Top 2 vào Knockout</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-950/40">
                        <th className="px-3 py-2 text-center w-8">#</th>
                        <th className="px-3 py-2 text-left">Đội</th>
                        <th className="px-2 py-2 text-center">Trận</th>
                        <th className="px-2 py-2 text-center">T/B</th>
                        <th className="px-2 py-2 text-center font-bold text-orange-400">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((entry) => (
                        <tr
                          key={entry.entityId}
                          className={`border-b border-slate-800/40 ${
                            entry.rank <= 2 ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-center font-bold text-slate-400">
                            {entry.rank}
                          </td>
                          <td className="px-3 py-2 font-semibold text-white truncate max-w-[140px]">
                            {entry.entityName}
                          </td>
                          <td className="px-2 py-2 text-center text-slate-300">
                            {entry.matchesPlayed}
                          </td>
                          <td className="px-2 py-2 text-center text-slate-300">
                            {entry.matchesWon}/{entry.matchesLost}
                          </td>
                          <td className={`px-2 py-2 text-center font-bold ${
                            entry.pointsDifference > 0
                              ? 'text-green-400'
                              : entry.pointsDifference < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}>
                            {entry.pointsDifference > 0 ? `+${entry.pointsDifference}` : entry.pointsDifference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
