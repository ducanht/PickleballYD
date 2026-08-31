import { useEffect, useState } from 'react';
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
import type { Tournament, Participant, Match, EnginePlayer, GenderMode } from '../../../types';
import {
  ArrowLeft,
  Trophy,
  Shuffle,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const GENDER_MODE_LABEL: Record<GenderMode, string> = {
  MALE: 'Đôi Nam',
  FEMALE: 'Đôi Nữ',
  MIXED: 'Đôi Nam Nữ / Hỗn Hợp',
};

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

        if (t?.config.groups?.numberOfGroups) {
          setNumGroups(t.config.groups.numberOfGroups);
        }
        if (t?.config.groups?.assignmentMode) {
          setGroupDrawMode(t.config.groups.assignmentMode);
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

  const genderMode = tournament.config.participants?.genderMode || 'MIXED';

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

    try {
      const seed = `${tournament.id}-${Date.now()}`;
      const result = drawTeams({
        players: participants.map((p) => ({
          id: p.id,
          name: p.name,
          gender: p.gender,
        })),
        genderMode,
        seed,
      });
      setDrawnTeams(result.teams);
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi bốc thăm ghép cặp');
    }
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
      teamIndices: g.teamIds.map(Number),
    }));

    setDrawnGroups(mapped);
  };

  // ── Step 3 Handler: Generate Fixtures Preview ──────────────────────────────
  const handleGeneratePreview = () => {
    if (drawnGroups.length === 0) {
      alert('Vui lòng bốc thăm chia bảng trước.');
      return;
    }

    const courts = tournament.config.scheduling?.courts || 2;
    const generated: Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[] = [];
    let globalOrder = 1;

    for (let gIdx = 0; gIdx < drawnGroups.length; gIdx++) {
      const g = drawnGroups[gIdx];
      const teamIds = g.teamIndices.map(String);
      const schedule = generateRoundRobin({
        groupId: `temp-group-${gIdx}`,
        teamIds,
        courts,
      });

      for (const m of schedule.matches) {
        const idx1 = Number(m.team1[0]);
        const idx2 = Number(m.team2[0]);
        const t1 = drawnTeams[idx1];
        const t2 = drawnTeams[idx2];

        generated.push({
          stage: 'GROUP',
          round: m.round,
          groupId: `group-${g.name}`,
          order: globalOrder++,
          courtId: m.courtId,
          team1: {
            p1Id: t1.p1.id,
            p1Name: t1.p1.name,
            p2Id: t1.p2.id,
            p2Name: t1.p2.name,
          },
          team2: {
            p1Id: t2.p1.id,
            p1Name: t2.p1.name,
            p2Id: t2.p2.id,
            p2Name: t2.p2.name,
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

    setPreviewMatches(generated);
    setStep(3);
  };

  // ── Step 3 Commit: Save to Firestore ──────────────────────────────────────
  const handleCommitAll = async () => {
    if (!id || previewMatches.length === 0) return;
    setProcessing(true);
    try {
      // 1. Save Teams
      const teamsToSave = drawnTeams.map((t, idx) => {
        // Find which group this team belongs to
        let assignedGroup = 'A';
        for (const g of drawnGroups) {
          if (g.teamIndices.includes(idx)) {
            assignedGroup = g.name;
            break;
          }
        }
        return {
          name: t.teamName,
          p1Id: t.p1.id,
          p2Id: t.p2.id,
          p1Name: t.p1.name,
          p2Name: t.p2.name,
          groupId: `group-${assignedGroup}`,
        };
      });
      await saveTeams(id, teamsToSave);

      // 2. Save Groups
      const groupsToSave = drawnGroups.map((g) => ({
        name: `Bảng ${g.name}`,
        type: genderMode,
        entityType: 'TEAM' as const,
        entityIds: g.teamIndices.map((idx) => `temp-team-${idx}`),
        maxEntities: g.teamIndices.length,
      }));
      await saveGroups(id, groupsToSave);

      // 3. Save Matches
      await saveMatches(id, previewMatches);

      // 4. Save Draw Audit Record
      await saveDrawRecord(id, {
        drawType: 'GROUP',
        seed: `${id}-${Date.now()}`,
        algorithmVersion: '1.1.0',
        inputHash: `${participants.length}-${drawnTeams.length}-${drawnGroups.length}`,
        result: {
          teamsCount: drawnTeams.length,
          groupsCount: drawnGroups.length,
          matchesCount: previewMatches.length,
        },
        validation: { passed: true, errors: [], warnings: [] },
        createdBy: tournament.createdBy || 'editor',
      });

      // 5. Update tournament status to DRAWN
      await updateTournamentStatus(id, 'DRAWN');

      alert('Đã lưu kết quả bốc thăm, chia bảng và tạo lịch thi đấu thành công!');
      navigate(`/tournaments/${id}`);
    } catch (e: unknown) {
      alert((e as Error).message ?? 'Lỗi lưu dữ liệu bốc thăm');
    } finally {
      setProcessing(false);
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
              <span className="badge-blue text-xs font-bold">Fixed Doubles</span>
              <span className="badge-emerald text-xs font-bold">
                {GENDER_MODE_LABEL[genderMode]}
              </span>
              <span className="badge-orange text-xs font-bold">
                {numGroups} Bảng • {tournament.config.groups?.maxEntitiesPerGroup || 4} Cặp/Bảng
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Bốc Thăm & Chia Bảng: {tournament.name}
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setStep(1)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              step === 1
                ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Bước 1</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Shuffle className="w-4 h-4 text-orange-400" />
              Bốc Thăm Cặp Đôi
            </div>
          </button>

          <button
            onClick={() => {
              if (drawnTeams.length > 0) setStep(2);
            }}
            disabled={drawnTeams.length === 0}
            className={`p-3 rounded-2xl border text-left transition-all ${
              drawnTeams.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              step === 2
                ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Bước 2</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Layers className="w-4 h-4 text-blue-400" />
              Bốc Thăm Chia Bảng
            </div>
          </button>

          <button
            onClick={() => {
              if (drawnGroups.length > 0) setStep(3);
            }}
            disabled={drawnGroups.length === 0}
            className={`p-3 rounded-2xl border text-left transition-all ${
              drawnGroups.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              step === 3
                ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-950/50'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Bước 3</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Xem Lịch & Xác Nhận
            </div>
          </button>
        </div>
      </div>

      {/* ── STEP 1: Pair Draw ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-orange-400" />
                Ghép Cặp Vận Động Viên ({participants.length} VĐV tham gia)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nội dung: <strong className="text-emerald-400">{GENDER_MODE_LABEL[genderMode]}</strong> •{' '}
                {genderMode === 'MIXED'
                  ? 'Thuật toán sẽ ghép 1 Nam + 1 Nữ thành 1 cặp đấu.'
                  : 'Bốc thăm ngẫu nhiên ghép 2 VĐV thành 1 cặp đấu cố định.'}
              </p>
            </div>

            <button
              onClick={handleDrawTeams}
              className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-950/40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bốc Thăm Ghép Cặp</span>
            </button>
          </div>

          {drawnTeams.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
              <Shuffle className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-300 font-semibold">Chưa có kết quả bốc thăm cặp đôi</p>
              <p className="text-xs text-slate-500">
                Nhấn nút &quot;Bốc Thăm Ghép Cặp&quot; để tự động tạo danh sách cặp đấu
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {drawnTeams.map((team, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-4 flex items-center justify-between border-white/[0.08] hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center font-score">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {team.teamName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {team.p1.name} & {team.p2.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Chuyển Sang Bước 2: Bốc Thăm Chia Bảng</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Group Draw ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Bốc Thăm Phân Bổ Vào Bảng Đấu ({drawnTeams.length} cặp đấu)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu hình phân bổ vào {numGroups} bảng đấu (Bảng A, B, C...)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={numGroups}
                onChange={(e) => setNumGroups(parseInt(e.target.value) || 2)}
                className="input-base text-xs py-2 w-32"
              >
                <option value={1}>1 Bảng</option>
                <option value={2}>2 Bảng</option>
                <option value={3}>3 Bảng</option>
                <option value={4}>4 Bảng</option>
                <option value={6}>6 Bảng</option>
                <option value={8}>8 Bảng</option>
              </select>

              <button
                onClick={handleDrawGroups}
                className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-950/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bốc Thăm Bảng Đấu</span>
              </button>
            </div>
          </div>

          {drawnGroups.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-2">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-300 font-semibold">Chưa có kết quả chia bảng</p>
              <p className="text-xs text-slate-500">
                Chọn số bảng và nhấn &quot;Bốc Thăm Bảng Đấu&quot; để phân bổ các cặp vào bảng
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drawnGroups.map((g) => (
                  <div key={g.name} className="glass-card p-5 space-y-3 border-blue-500/20">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                          {g.name}
                        </span>
                        <span>Bảng {g.name}</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold">
                        {g.teamIndices.length} cặp đấu
                      </span>
                    </div>

                    <div className="space-y-2">
                      {g.teamIndices.map((idx, pos) => {
                        const t = drawnTeams[idx];
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center gap-2 text-xs"
                          >
                            <span className="text-slate-500 font-score font-bold w-4">
                              {pos + 1}.
                            </span>
                            <span className="font-bold text-white line-clamp-1">{t.teamName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary text-xs px-4 py-2.5 cursor-pointer"
                >
                  ← Quay lại Bước 1
                </button>
                <button
                  onClick={handleGeneratePreview}
                  className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Chuyển Sang Bước 3: Xem Lịch & Xác Nhận</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Fixtures & Confirmation ───────────────────────────────── */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Lịch Thi Đấu Dự Kiến ({previewMatches.length} trận vòng bảng)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các trận đấu vòng bảng được sắp xếp tự động theo sân và lượt đấu
              </p>
            </div>

            <button
              onClick={handleCommitAll}
              disabled={processing}
              className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50 cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu Dữ Liệu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Lưu Lịch Thi Đấu</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {previewMatches.map((m, idx) => (
              <div
                key={idx}
                className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-white/[0.05] text-slate-400 font-bold flex items-center justify-center font-score">
                    #{m.order}
                  </span>
                  <div>
                    <div className="text-slate-400 text-[11px]">
                      Vòng {m.round} • {m.groupId ? `Bảng ${m.groupId.replace('group-', '')}` : 'Toàn giải'} •{' '}
                      <span className="text-orange-400 font-semibold">{m.courtId}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      <span className="text-orange-400">{m.team1.p1Name} / {m.team1.p2Name}</span>
                      <span className="text-slate-500 mx-2">VS</span>
                      <span className="text-blue-400">{m.team2.p1Name} / {m.team2.p2Name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary text-xs px-4 py-2.5 cursor-pointer"
            >
              ← Quay lại Bước 2
            </button>
            <button
              onClick={handleCommitAll}
              disabled={processing}
              className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-950/50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu Dữ Liệu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Lưu Lịch Thi Đấu</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
