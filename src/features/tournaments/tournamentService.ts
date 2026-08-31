/**
 * Tournament Service — SRS V6 §6, §7, §8
 * Full tournament lifecycle: DRAFT → DRAWING → DRAWN → ONGOING → COMPLETED
 * All sensitive operations write audit + event timeline.
 * No config change after DRAWN (unless ADMIN override + audit).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/firebase';
import { auth } from '../../api/firebase';
import { writeAudit, writeTournamentEvent } from './auditService';
import type {
  Tournament,
  TournamentCreateInput,
  TournamentConfig,
  TournamentStatus,
  Participant,
  Match,
  ScoreHistory,
  GameScore,
  Team,
  TournamentGroup,
  Draw,
} from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function docToTournament(id: string, data: DocumentData): Tournament {
  return { id, ...data } as Tournament;
}

// ── Tournament CRUD ───────────────────────────────────────────────────────────

export async function getTournaments(status?: TournamentStatus): Promise<Tournament[]> {
  try {
    const colRef = collection(db, COLLECTIONS.TOURNAMENTS);
    const snap = status
      ? await getDocs(query(colRef, where('status', '==', status), orderBy('startDate', 'desc')))
      : await getDocs(query(colRef, orderBy('startDate', 'desc')));
    return snap.docs.map((d) => docToTournament(d.id, d.data()));
  } catch (err) {
    console.error('[TournamentService] getTournaments error from Firestore:', err);
    return [];
  }
}

export async function getTournament(id: string): Promise<Tournament | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.TOURNAMENTS, id));
    if (!snap.exists()) {
      return null;
    }
    return docToTournament(snap.id, snap.data());
  } catch (err) {
    console.error('[TournamentService] getTournament error from Firestore:', err);
    return null;
  }
}

export async function createTournament(input: TournamentCreateInput): Promise<string> {
  const user = auth.currentUser;
  const now = serverTimestamp();

  const ref = await addDoc(collection(db, COLLECTIONS.TOURNAMENTS), {
    ...input,
    status: 'DRAFT',
    createdBy: user?.uid ?? 'unknown',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  await writeAudit({
    action: 'CREATE_TOURNAMENT',
    module: 'TOURNAMENT',
    targetId: ref.id,
    after: { name: input.name, format: input.config.format },
  });

  return ref.id;
}

// ── Config update (only allowed in DRAFT per BR-005) ─────────────────────────
export async function updateTournamentConfig(
  tournamentId: string,
  config: Partial<TournamentConfig>
): Promise<void> {
  const t = await getTournament(tournamentId);
  if (!t) throw new Error('Giải đấu không tồn tại.');

  const lockedStatuses: TournamentStatus[] = ['DRAWN', 'ONGOING', 'COMPLETED'];
  if (lockedStatuses.includes(t.status)) {
    throw new Error(`Không thể sửa cấu hình khi giải ở trạng thái ${t.status}. Cần quyền ADMIN reset.`);
  }

  await updateDoc(doc(db, COLLECTIONS.TOURNAMENTS, tournamentId), {
    config: { ...t.config, ...config },
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'UPDATE_TOURNAMENT_CONFIG',
    module: 'TOURNAMENT',
    targetId: tournamentId,
    before: { config: t.config },
    after: { config: { ...t.config, ...config } },
  });
}

// ── Status transition ─────────────────────────────────────────────────────────
async function transitionStatus(
  tournamentId: string,
  newStatus: TournamentStatus,
  extraUpdates: Record<string, unknown> = {}
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TOURNAMENTS, tournamentId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...extraUpdates,
  });
}

// ── Participants ──────────────────────────────────────────────────────────────

export async function getParticipants(tournamentId: string): Promise<Participant[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.participants(tournamentId)), orderBy('name', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Participant);
}

export async function registerParticipant(
  tournamentId: string,
  memberId: string,
  snapshot: Omit<Participant, 'id' | 'registrationStatus' | 'tournamentStats' | 'createdAt'>
): Promise<string> {
  const t = await getTournament(tournamentId);
  if (!t) throw new Error('Giải đấu không tồn tại.');
  if (t.status !== 'DRAFT') throw new Error('Chỉ đăng ký được khi giải ở trạng thái DRAFT.');

  const ref = await addDoc(collection(db, COLLECTIONS.participants(tournamentId)), {
    ...snapshot,
    memberId,
    registrationStatus: 'REGISTERED',
    tournamentStats: {
      matchesPlayed: 0, matchesWon: 0, matchesLost: 0,
      pointsWon: 0, pointsLost: 0, pointsDifference: 0,
    },
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function removeParticipant(tournamentId: string, participantId: string): Promise<void> {
  const t = await getTournament(tournamentId);
  if (!t) throw new Error('Giải đấu không tồn tại.');
  if (t.status !== 'DRAFT') throw new Error('Chỉ xóa VĐV được khi giải ở trạng thái DRAFT.');

  await updateDoc(doc(db, COLLECTIONS.participants(tournamentId), participantId), {
    registrationStatus: 'WITHDRAWN',
  });
}

// ── Scoring — SRS §8, BR-006, BR-007 ─────────────────────────────────────────
export async function updateMatchScore(
  tournamentId: string,
  matchId: string,
  newGames: GameScore[],
  reason?: string
): Promise<void> {
  const matchRef = doc(db, COLLECTIONS.matches(tournamentId), matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error('Trận đấu không tồn tại.');

  const match = { id: matchSnap.id, ...matchSnap.data() } as Match;

  // BR-006: Only ADMIN can edit COMPLETED match scores
  if (match.status === 'COMPLETED') {
    const user = auth.currentUser;
    if (!user) throw new Error('Bạn cần đăng nhập.');
    // Note: role check happens in Security Rules; this is defense-in-depth
    if (!reason?.trim()) throw new Error('Phải ghi lý do khi sửa trận đã hoàn thành.');
  }

  const score1Total = newGames.reduce((s, g) => s + g.score1, 0);
  const score2Total = newGames.reduce((s, g) => s + g.score2, 0);
  const winner = score1Total > score2Total ? 'TEAM1' : score2Total > score1Total ? 'TEAM2' : 'NONE';

  const batch = writeBatch(db);

  // Update match
  batch.update(matchRef, {
    games: newGames,
    score1Total,
    score2Total,
    winner,
    updatedAt: serverTimestamp(),
  });

  // BR-007: Write score history
  const historyRef = doc(
    collection(db, COLLECTIONS.scoreHistory(tournamentId, matchId))
  );
  batch.set(historyRef, {
    oldGames: match.games,
    newGames,
    changedBy: auth.currentUser?.uid ?? 'unknown',
    changedAt: serverTimestamp(),
    reason: reason ?? null,
  });

  await batch.commit();

  await writeTournamentEvent(tournamentId, 'SCORE_UPDATED', `Cập nhật điểm trận ${matchId}`, {
    matchId,
    score1Total,
    score2Total,
  });
}

export async function completeMatch(tournamentId: string, matchId: string): Promise<void> {
  const matchRef = doc(db, COLLECTIONS.matches(tournamentId), matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error('Trận đấu không tồn tại.');

  const match = snap.data() as Match;
  if (match.winner === 'NONE') throw new Error('Phải có người thắng trước khi kết thúc trận.');

  await updateDoc(matchRef, {
    status: 'COMPLETED',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeTournamentEvent(tournamentId, 'MATCH_COMPLETED', `Trận ${matchId} đã hoàn thành`, { matchId });
}

export async function completeTournament(tournamentId: string): Promise<void> {
  const t = await getTournament(tournamentId);
  if (!t) throw new Error('Giải đấu không tồn tại.');
  if (t.status !== 'ONGOING') throw new Error('Chỉ kết thúc giải đang ONGOING.');

  await transitionStatus(tournamentId, 'COMPLETED', { completedAt: serverTimestamp() });

  await writeAudit({
    action: 'COMPLETE_TOURNAMENT',
    module: 'TOURNAMENT',
    targetId: tournamentId,
    before: { status: 'ONGOING' },
    after: { status: 'COMPLETED' },
  });

  await writeTournamentEvent(tournamentId, 'TOURNAMENT_COMPLETED', 'Giải đấu đã kết thúc', {});
}

// ── Matches query ─────────────────────────────────────────────────────────────
export async function getMatches(
  tournamentId: string,
  stage?: Match['stage'],
  groupId?: string
): Promise<Match[]> {
  try {
    const conditions: Parameters<typeof query>[1][] = [orderBy('order', 'asc')];
    if (stage) conditions.unshift(where('stage', '==', stage));
    if (groupId) conditions.unshift(where('groupId', '==', groupId));

    const snap = await getDocs(
      query(collection(db, COLLECTIONS.matches(tournamentId)), ...conditions)
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match);
  } catch (err) {
    console.error('[TournamentService] getMatches error from Firestore:', err);
    return [];
  }
}

// ── Teams (Fixed Doubles) ───────────────────────────────────────────────────
export async function getTeams(tournamentId: string): Promise<Team[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.teams(tournamentId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Team);
}

export async function saveTeams(
  tournamentId: string,
  teams: Omit<Team, 'id' | 'createdAt' | 'teamStats'>[]
): Promise<Team[]> {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const createdTeams: Team[] = [];

  for (const t of teams) {
    const ref = doc(collection(db, COLLECTIONS.teams(tournamentId)));
    const teamData = {
      ...t,
      teamStats: { played: 0, won: 0, lost: 0, pointsDifference: 0 },
      createdAt: now,
    };
    batch.set(ref, teamData);
    createdTeams.push({ id: ref.id, ...teamData } as unknown as Team);
  }

  await batch.commit();
  await writeTournamentEvent(tournamentId, 'DRAW_PARTNERS', `Đã bốc thăm và tạo ${teams.length} cặp đội`, {
    count: teams.length,
  });

  return createdTeams;
}

// ── Groups ──────────────────────────────────────────────────────────────────
export async function getGroups(tournamentId: string): Promise<TournamentGroup[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.groups(tournamentId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TournamentGroup);
}

export async function saveGroups(
  tournamentId: string,
  groups: Omit<TournamentGroup, 'id'>[]
): Promise<TournamentGroup[]> {
  const batch = writeBatch(db);
  const createdGroups: TournamentGroup[] = [];

  for (const g of groups) {
    const ref = doc(collection(db, COLLECTIONS.groups(tournamentId)));
    batch.set(ref, g);
    createdGroups.push({ id: ref.id, ...g });
  }

  await batch.commit();
  await writeTournamentEvent(tournamentId, 'DRAW_GROUPS', `Đã tạo ${groups.length} bảng đấu`, {
    count: groups.length,
  });

  return createdGroups;
}

// ── Batch Matches Creation ──────────────────────────────────────────────────
export async function saveMatches(
  tournamentId: string,
  matches: Omit<Match, 'id' | 'updatedAt' | 'completedAt'>[]
): Promise<Match[]> {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const createdMatches: Match[] = [];

  for (const m of matches) {
    const ref = doc(collection(db, COLLECTIONS.matches(tournamentId)));
    const matchData = {
      ...m,
      updatedAt: now,
      completedAt: null,
    };
    batch.set(ref, matchData);
    createdMatches.push({ id: ref.id, ...matchData } as unknown as Match);
  }

  await batch.commit();
  return createdMatches;
}

// ── Draw Record ─────────────────────────────────────────────────────────────
export async function saveDrawRecord(
  tournamentId: string,
  drawData: Omit<Draw, 'id' | 'createdAt'>
): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTIONS.draws(tournamentId)), {
    ...drawData,
    createdAt: now,
  });
  return ref.id;
}

// ── Status Updater ──────────────────────────────────────────────────────────
export async function updateTournamentStatus(
  tournamentId: string,
  newStatus: TournamentStatus,
  extraUpdates: Record<string, unknown> = {}
): Promise<void> {
  await transitionStatus(tournamentId, newStatus, extraUpdates);
}

