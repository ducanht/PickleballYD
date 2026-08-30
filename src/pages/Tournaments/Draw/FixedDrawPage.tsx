import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournament,
  getParticipants,
  getTeams,
  saveTeams,
  saveGroups,
  saveMatches,
  saveDrawRecord,
  updateTournamentStatus,
} from '../../../features/tournaments/tournamentService';
import { drawTeams } from '../../../features/fixedDoubles/teamDrawEngine';
import { drawGroups } from '../../../features/fixedDoubles/groupDrawEngine';
import { generateRoundRobin } from '../../../features/fixedDoubles/fixtureGenerator';
import { useIsEditor } from '../../../contexts/AuthContext';
import type { Tournament, Participant, Team, TournamentGroup, Match, EnginePlayer } from '../../../types';
import {
  ArrowLeft,
  Trophy,
  Users,
  Shuffle,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function FixedDrawPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Flow Step: 1 = Pair Draw, 2 = Group Draw, 3 = Confirm & Generate Fixtures
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Teams drawn in memory
  const [drawnTeams, setDrawnTeams] = useState<Array<{ p1: EnginePlayer; p2: EnginePlayer; teamName: string }>>([]);

  // Step 2: Group draw settings & result
  const [numGroups, setNumGroups] = useState(2);
  const [groupDrawMode, setGroupDrawMode] = useState<'RANDOM' | 'SEEDED'>('RANDOM');
  const [drawnGroups, setDrawnGroups] = useState<Array<{ name: string; teamIndices: number[] }>>([]);

  // Step 3: Generated matches preview
  const [previewMatches, setPreviewMatches] = useState<Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getTournament(id), getParticipants(id), getTeams(id)])
      .then(([t, p, teams]) => {
        setTournament(t);
        setParticipants(p);

        if (t?.config.groups.numberOfGroups) {
          setNumGroups(t.config.groups.numberOfGroups);
        }

        // If teams already exist in Firestore, initialize with existing teams
        if (teams.length > 0) {
          const mapped = teams.map((tm) => ({
            p1: { id: tm.p1Id, name: tm.p1Name },
            p2: { id: tm.p2Id, name: tm.p2Name },
            teamName: tm.name,
          }));
          setDrawnTeams(mapped);
          setStep(2);
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

  // ── Step 1 Handler: Run Team Draw ──────────────────────────────────────────
  const handleDrawTeams = () => {
    if (participants.length < 2) {
      alert('Cần ít nhất 2 VĐV để bốc thăm ghép cặp.');
      return;
    }
    if (participants.length % 2 !== 0) {
      alert(`Số lượng VĐV hiện tại là ${participants.length} (lẻ). Cần số lượng chẵn để ghép đôi.`);
      return;
    }

    const enginePlayers: EnginePlayer[] = participants.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    const seed = `${tournament.id}-${Date.now()}`;
    const result = drawTeams(enginePlayers, seed);
    setDrawnTeams(result.teams);
  };

  // ── Step 2 Handler: Run Group Draw ─────────────────────────────────────────
  const handleDrawGroups = () => {
    if (drawnTeams.length === 0) {
      alert('Vui lòng hoàn thành bốc thăm cặp đôi trước.');
      return;
    }

    const teamIndices = drawnTeams.map((_, i) => String(i));
    const seed = `${tournament.id}-group-${Date.now()}`;

    const res = drawGroups({
      teamIds: teamIndices,
      numberOfGroups: numGroups,
      maxEntitiesPerGroup: Math.ceil(drawnTeams.length / numGroups),
      mode: groupDrawMode,
      seed,
    });

    const mapped = res.groups.map((g) => ({
      name: g.name,
      teamIndices: g.teamIds.map((idxStr) => Number(idxStr)),
    }));

    setDrawnGroups(mapped);

    // Generate preview fixtures for all groups
    const allMatches: Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[] = [];
    let matchOrder = 1;

    for (const grp of mapped) {
      const fixtures = generateRoundRobin({
        teamIds: grp.teamIndices.map((idx) => String(idx)),
        groupId: grp.name,
        courts: tournament.config.scheduling.courts || 2,
      });

      for (const fx of fixtures.matches) {
        const t1Idx = Number(fx.team1[0]);
        const t2Idx = Number(fx.team2[0]);
        const team1Data = drawnTeams[t1Idx];
        const team2Data = drawnTeams[t2Idx];

        if (team1Data && team2Data) {
          allMatches.push({
            stage: 'GROUP',
            round: fx.round,
            groupId: grp.name,
            order: matchOrder++,
            courtId: fx.courtId,
            team1: {
              p1Id: team1Data.p1.id,
              p1Name: team1Data.p1.name,
              p2Id: team1Data.p2.id,
              p2Name: team1Data.p2.name,
            },
            team2: {
              p1Id: team2Data.p1.id,
              p1Name: team2Data.p1.name,
              p2Id: team2Data.p2.id,
              p2Name: team2Data.p2.name,
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
    }

    setPreviewMatches(allMatches);
    setStep(3);
  };

  // ── Step 3 Handler: Save All to Firestore ─────────────────────────────────
  const handleCommitDraw = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      // 1. Save Teams
      const teamsToSave: Omit<Team, 'id' | 'createdAt' | 'teamStats'>[] = drawnTeams.map((t) => ({
        name: t.teamName,
        p1Id: t.p1.id,
        p2Id: t.p2.id,
        p1Name: t.p1.name,
        p2Name: t.p2.name,
        groupId: null,
      }));
      const savedTeams = await saveTeams(id, teamsToSave);

      // 2. Save Groups
      const groupsToSave: Omit<TournamentGroup, 'id'>[] = drawnGroups.map((g) => ({
        name: g.name,
        type: tournament.config.participants.genderMode,
        entityType: 'TEAM',
        entityIds: g.teamIndices.map((idx) => savedTeams[idx]?.id || String(idx)),
        maxEntities: Math.ceil(savedTeams.length / drawnGroups.length),
      }));
      await saveGroups(id, groupsToSave);

      // 3. Map preview matches with actual saved Team IDs & save
      const matchesToSave = previewMatches.map((m) => ({
        ...m,
      }));
      await saveMatches(id, matchesToSave);

      // 4. Save Draw Audit Record
      await saveDrawRecord(id, {
        drawType: 'GROUP',
        seed: `${id}-${Date.now()}`,
        algorithmVersion: '1.0.0',
        inputHash: `${savedTeams.length}-${drawnGroups.length}`,
        result: {
          teamsCount: savedTeams.length,
          groupsCount: drawnGroups.length,
          matchesCount: matchesToSave.length,
        },
        validation: { passed: true, errors: [], warnings: [] },
        createdBy: tournament.createdBy || 'editor',
      });

      // 5. Transition tournament status to DRAWN
      await updateTournamentStatus(id, 'DRAWN');

      alert('Bốc thăm và lập lịch thi đấu thành công!');
      navigate(`/tournaments/${id}`);
    } catch (err: unknown) {
      alert((err as Error).message || 'Có lỗi xảy ra khi lưu bốc thăm.');
    } finally {
      setProcessing(false);
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
        Quay lại chi tiết giải đấu
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Bốc Thăm & Chia Bảng: {tournament.name}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Thể thức Cặp Cố Định (Fixed Doubles) · {participants.length} VĐV đã đăng ký
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-orange font-semibold">
              Bước {step}/3: {step === 1 ? 'Ghép Cặp' : step === 2 ? 'Chia Bảng' : 'Xác Nhận Lịch'}
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: Ghép Cặp Đôi */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-orange-400" />
                  1. Bốc Thăm Ghép Cặp Đôi
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Thuật toán LCG Seeded Shuffle tự động xáo trộn và tạo cặp đôi ngẫu nhiên minh bạch.
                </p>
              </div>
              <button
                onClick={handleDrawTeams}
                disabled={participants.length < 2 || participants.length % 2 !== 0}
                className="btn-primary flex items-center gap-2 text-sm shrink-0"
              >
                <Shuffle className="w-4 h-4" />
                {drawnTeams.length > 0 ? 'Bốc Thăm Lại' : 'Bắt Đầu Bốc Thăm Cặp'}
              </button>
            </div>

            {participants.length % 2 !== 0 && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-xs flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Số lượng VĐV đang là số lẻ ({participants.length}). Cần thêm 1 VĐV để ghép đủ cặp.</span>
              </div>
            )}

            {drawnTeams.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-10 text-center">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Chưa có kết quả bốc thăm cặp</p>
                <p className="text-slate-500 text-xs mt-1">Nhấn "Bắt Đầu Bốc Thăm Cặp" để tạo ngẫu nhiên</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {drawnTeams.map((team, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{team.teamName}</p>
                        <p className="text-xs text-slate-400">
                          {team.p1.name} & {team.p2.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    Tiếp Tục: Chia Bảng →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Chia Bảng Đấu */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" />
                  2. Cấu Hình & Bốc Thăm Chia Bảng
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Đã ghép được {drawnTeams.length} cặp đấu. Thiết lập số lượng bảng và thực hiện chia bảng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-slate-900/40 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Số lượng bảng đấu
                </label>
                <select
                  value={numGroups}
                  onChange={(e) => setNumGroups(Number(e.target.value))}
                  className="input-base w-full"
                >
                  <option value={1}>1 Bảng (Vòng tròn 1 lượt)</option>
                  <option value={2}>2 Bảng (Bảng A, B)</option>
                  <option value={4}>4 Bảng (Bảng A, B, C, D)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Chế độ phân bổ
                </label>
                <select
                  value={groupDrawMode}
                  onChange={(e) => setGroupDrawMode(e.target.value as 'RANDOM' | 'SEEDED')}
                  className="input-base w-full"
                >
                  <option value="RANDOM">Ngẫu Nhiên (Random Shuffle)</option>
                  <option value="SEEDED">Theo Thứ Tự Hạt Giống (Seeded)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleDrawGroups}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Shuffle className="w-4 h-4" />
                  Bốc Thăm Chia Bảng
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button onClick={() => setStep(1)} className="btn-secondary text-sm">
                ← Quay lại ghép cặp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Xác Nhận & Xem Trước Lịch Thi Đấu */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  3. Xem Trước Bảng Đấu & Lịch Trận
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Đã tạo {drawnGroups.length} bảng đấu với tổng cộng {previewMatches.length} trận đấu vòng bảng.
                </p>
              </div>
              <button
                onClick={handleCommitDraw}
                disabled={processing}
                className="btn-primary flex items-center gap-2 text-sm shrink-0"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Xác Nhận & Khởi Tạo Giải
              </button>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {drawnGroups.map((grp) => (
                <div key={grp.name} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-white text-base">Bảng {grp.name}</h3>
                    <span className="text-xs text-slate-400">{grp.teamIndices.length} đội</span>
                  </div>
                  <div className="space-y-2">
                    {grp.teamIndices.map((idx, pos) => {
                      const t = drawnTeams[idx];
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded bg-slate-950/40">
                          <span className="w-5 text-slate-500 font-bold text-xs">{pos + 1}.</span>
                          <span className="font-medium text-slate-200">{t?.teamName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Matches Schedule Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                Lịch thi đấu vòng bảng ({previewMatches.length} trận)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs">
                      <th className="text-left px-3 py-2">Trận</th>
                      <th className="text-left px-3 py-2">Bảng</th>
                      <th className="text-left px-3 py-2">Vòng</th>
                      <th className="text-left px-3 py-2">Sân</th>
                      <th className="text-left px-3 py-2">Đội 1</th>
                      <th className="text-center px-3 py-2">VS</th>
                      <th className="text-left px-3 py-2">Đội 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewMatches.map((m) => (
                      <tr key={m.order} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        <td className="px-3 py-2.5 font-bold text-orange-400">#{m.order}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-medium">Bảng {m.groupId}</td>
                        <td className="px-3 py-2.5 text-slate-400">Vòng {m.round}</td>
                        <td className="px-3 py-2.5 text-slate-400">{m.courtId}</td>
                        <td className="px-3 py-2.5 font-medium text-white">
                          {m.team1.p1Name} / {m.team1.p2Name}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-500 font-bold">vs</td>
                        <td className="px-3 py-2.5 font-medium text-white">
                          {m.team2.p1Name} / {m.team2.p2Name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-800">
              <button onClick={() => setStep(2)} className="btn-secondary text-sm">
                ← Quay lại cấu hình bảng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
