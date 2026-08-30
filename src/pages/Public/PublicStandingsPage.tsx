import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getGroups,
  getTeams,
  getMatches,
  getParticipants,
} from '../../features/tournaments/tournamentService';
import { calculateStandings } from '../../features/tournaments/engine/standingsCalculator';
import StandingsTable from '../../features/tournaments/components/StandingsTable';
import type { Tournament, TournamentGroup, Team, Match, Participant, StandingEntry } from '../../types';
import { Trophy, ArrowLeft, Loader2, Calendar } from 'lucide-react';

export default function PublicStandingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [groupStandings, setGroupStandings] = useState<Array<{ group: TournamentGroup; standings: StandingEntry[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      getTournament(id),
      getGroups(id),
      getTeams(id),
      getParticipants(id),
      getMatches(id),
    ])
      .then(([t, grps, teams, participants, matches]) => {
        setTournament(t);

        // Build entity names map
        const namesMap: Record<string, string> = {};
        for (const tm of teams) {
          namesMap[tm.id] = tm.name;
        }
        for (const p of participants) {
          namesMap[p.id] = p.name;
        }

        // Calculate standings for each group
        const result = grps.map((g) => {
          const groupMatches = matches.filter((m) => m.groupId === g.name);
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

        setGroupStandings(result);
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
              <Trophy className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Bảng Xếp Hạng: {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Cập nhật trực tiếp theo thời gian thực từ các trận đấu vòng bảng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/tournaments/${id}/schedule`)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Lịch Thi Đấu
            </button>
          </div>
        </div>
      </div>

      {/* Group Standings */}
      {groupStandings.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">Chưa có bảng đấu nào được tạo</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupStandings.map(({ group, standings }) => (
            <StandingsTable
              key={group.id}
              title={`Bảng ${group.name}`}
              standings={standings}
              qualifierCutoff={tournament.config.knockout.qualifiersPerGroup || 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
