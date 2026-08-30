import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getMatches,
  getTeams,
  saveMatches,
} from '../../../features/tournaments/tournamentService';
import {
  generateKnockoutBracket,
} from '../../../features/tournaments/engine/knockoutEngine';
import { useIsEditor } from '../../../contexts/AuthContext';
import type { Tournament, KnockoutBracket, Match, Team } from '../../../types';
import {
  Trophy,
  ArrowLeft,
  Crown,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function KnockoutBracketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bracket, setBracket] = useState<KnockoutBracket | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getTeams(id), getMatches(id, 'FINAL')])
      .then(([t, tms, knockoutMatches]) => {
        setTournament(t);
        setTeams(tms);
        setMatches(knockoutMatches);

        // If knockout matches already exist, or if we have top teams, construct bracket
        if (tms.length >= 4) {
          const powerOfTwoCount = Math.pow(2, Math.floor(Math.log2(tms.length)));
          const eligibleTeamNames = tms.slice(0, powerOfTwoCount).map((tm) => tm.name);
          try {
            const generated = generateKnockoutBracket(eligibleTeamNames, id);
            setBracket(generated);
          } catch {
            // handle non power-of-2 gracefully
          }
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

  const handleGenerateKnockout = async () => {
    if (!id || teams.length < 2) {
      alert('Cần ít nhất 2 đội để tạo vòng Knockout.');
      return;
    }

    setGenerating(true);
    try {
      const powerOfTwo = Math.pow(2, Math.floor(Math.log2(teams.length)));
      const topTeams = teams.slice(0, powerOfTwo);
      const teamNames = topTeams.map((t) => t.name);

      const newBracket = generateKnockoutBracket(teamNames, id);
      setBracket(newBracket);

      // Generate initial knockout matches
      const round1Nodes = newBracket.nodes.filter((n) => n.round === 1);
      const matchesToCreate: Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[] = round1Nodes.map((n, idx) => {
        const t1 = topTeams.find((t) => t.name === n.team1Name);
        const t2 = topTeams.find((t) => t.name === n.team2Name);

        return {
          stage: 'FINAL',
          round: 1,
          groupId: null,
          order: idx + 100,
          courtId: `court-${(idx % 2) + 1}`,
          team1: {
            p1Id: t1?.p1Id || 'p1',
            p1Name: t1?.p1Name || n.team1Name || 'Đội 1',
            p2Id: t1?.p2Id || 'p2',
            p2Name: t1?.p2Name || '',
          },
          team2: {
            p1Id: t2?.p1Id || 'p3',
            p1Name: t2?.p1Name || n.team2Name || 'Đội 2',
            p2Id: t2?.p2Id || 'p4',
            p2Name: t2?.p2Name || '',
          },
          games: [{ score1: 0, score2: 0 }],
          score1Total: 0,
          score2Total: 0,
          winner: 'NONE',
          status: 'SCHEDULED',
          operatorId: null,
        };
      });

      await saveMatches(id, matchesToCreate);
      alert('Đã khởi tạo nhánh đấu Knockout thành công!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi tạo nhánh Knockout');
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
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Vòng Loại Trực Tiếp (Knockout): {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Sơ đồ phân nhánh đấu trực tiếp tranh cúp vô địch
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isEditor && !bracket && (
              <button
                onClick={handleGenerateKnockout}
                disabled={generating || teams.length < 2}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                Khởi Tạo Nhánh Knockout
              </button>
            )}
            <button
              onClick={() => navigate(`/tournaments/${id}/schedule`)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Xem Lịch Đấu
            </button>
          </div>
        </div>
      </div>

      {/* Bracket Tree View */}
      {!bracket ? (
        <div className="card text-center py-20">
          <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Chưa tạo nhánh Knockout</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Sau khi hoàn thành vòng bảng, các đội đứng đầu sẽ được xếp vào nhánh loại trực tiếp.
          </p>
          {isEditor && (
            <button
              onClick={handleGenerateKnockout}
              disabled={generating || teams.length < 2}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              Tạo Nhánh Đấu Tự Động
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-8 min-w-[800px] justify-around items-center">
            {Array.from({ length: bracket.totalRounds }, (_, rIdx) => {
              const roundNum = rIdx + 1;
              const roundNodes = bracket.nodes.filter((n) => n.round === roundNum);
              const roundLabel =
                roundNum === bracket.totalRounds
                  ? 'Chung Kết (Final)'
                  : roundNum === bracket.totalRounds - 1
                  ? 'Bán Kết (Semi-final)'
                  : `Vòng ${roundNum}`;

              return (
                <div key={roundNum} className="flex-1 flex flex-col justify-around gap-6">
                  <div className="text-center pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-orange-400">
                      {roundLabel}
                    </h3>
                  </div>

                  <div className="flex flex-col justify-around gap-8">
                    {roundNodes.map((node) => {
                      const matchData = matches.find((m) => m.round === node.round && m.order === node.position);
                      const currentScore = matchData?.games[0] || { score1: 0, score2: 0 };

                      return (
                        <div
                          key={node.id}
                          className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative group hover:border-orange-500/50 transition-colors"
                        >
                          <div className="text-[10px] text-slate-500 mb-2 font-mono">
                            Trận #{node.position}
                          </div>

                          <div className="space-y-2">
                            {/* Team 1 */}
                            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 text-xs">
                              <span className={`font-semibold truncate ${node.winner === 'TEAM1' ? 'text-amber-400' : 'text-white'}`}>
                                {node.team1Name || 'Chờ xác định...'}
                              </span>
                              <span className="font-bold text-slate-400 ml-2">
                                {matchData ? currentScore.score1 : '-'}
                              </span>
                            </div>

                            {/* Team 2 */}
                            <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 text-xs">
                              <span className={`font-semibold truncate ${node.winner === 'TEAM2' ? 'text-amber-400' : 'text-white'}`}>
                                {node.team2Name || 'Chờ xác định...'}
                              </span>
                              <span className="font-bold text-slate-400 ml-2">
                                {matchData ? currentScore.score2 : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
