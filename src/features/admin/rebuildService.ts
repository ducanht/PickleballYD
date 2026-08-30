/**
 * rebuildService.ts — Historical Match Rebuild & Data Integrity Service (SRS V6 §20.2)
 * Recalculates all-time member statistics directly from match logs.
 */

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/firebase';
import { writeAudit } from '../tournaments/auditService';
import type { Member, Match, AllTimeStats } from '../../types';

export interface IntegrityReport {
  orphanParticipants: number;
  invalidMatches: number;
  membersUpdated: number;
  errors: string[];
}

/**
 * Recalculate stats for a single member from all tournament matches across Firestore.
 */
export async function recalculateMemberStats(memberId: string): Promise<AllTimeStats> {
  const tournamentsSnap = await getDocs(collection(db, COLLECTIONS.TOURNAMENTS));
  const newStats: AllTimeStats = {
    tournamentsPlayed: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    pointsWon: 0,
    pointsLost: 0,
  };

  for (const tDoc of tournamentsSnap.docs) {
    const tournamentId = tDoc.id;
    const participantsSnap = await getDocs(collection(db, COLLECTIONS.participants(tournamentId)));
    const isParticipant = participantsSnap.docs.some((p) => p.data().memberId === memberId);

    if (isParticipant) {
      newStats.tournamentsPlayed++;

      const matchesSnap = await getDocs(collection(db, COLLECTIONS.matches(tournamentId)));
      for (const mDoc of matchesSnap.docs) {
        const m = mDoc.data() as Match;
        if (m.status !== 'COMPLETED') continue;

        const isTeam1 = m.team1.p1Id === memberId || m.team1.p2Id === memberId;
        const isTeam2 = m.team2.p1Id === memberId || m.team2.p2Id === memberId;

        if (isTeam1) {
          newStats.matchesPlayed++;
          newStats.pointsWon += m.score1Total;
          newStats.pointsLost += m.score2Total;
          if (m.winner === 'TEAM1') newStats.matchesWon++;
        } else if (isTeam2) {
          newStats.matchesPlayed++;
          newStats.pointsWon += m.score2Total;
          newStats.pointsLost += m.score1Total;
          if (m.winner === 'TEAM2') newStats.matchesWon++;
        }
      }
    }
  }

  // Update member in Firestore
  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), {
    allTimeStats: newStats,
    updatedAt: serverTimestamp(),
  });

  return newStats;
}

/**
 * Batch recalculate stats for all members in the system.
 */
export async function recalculateAllMembersStats(): Promise<IntegrityReport> {
  const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member);
  const errors: string[] = [];
  let updatedCount = 0;

  for (const m of members) {
    try {
      await recalculateMemberStats(m.id);
      updatedCount++;
    } catch (err: unknown) {
      errors.push(`Lỗi tính lại thống kê cho ${m.fullName}: ${(err as Error).message}`);
    }
  }

  await writeAudit({
    action: 'RECALCULATE_ALL_STATS',
    module: 'MEMBER',
    targetId: 'ALL',
    after: { updatedCount, errorsCount: errors.length },
  });

  return {
    orphanParticipants: 0,
    invalidMatches: 0,
    membersUpdated: updatedCount,
    errors,
  };
}

/**
 * Check database for broken references or orphan records.
 */
export async function validateDatabaseIntegrity(): Promise<IntegrityReport> {
  const errors: string[] = [];
  let orphanCount = 0;
  let invalidMatchCount = 0;

  const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const memberIds = new Set(membersSnap.docs.map((d) => d.id));

  const tournamentsSnap = await getDocs(collection(db, COLLECTIONS.TOURNAMENTS));
  for (const tDoc of tournamentsSnap.docs) {
    const tId = tDoc.id;

    // Check participants
    const pSnap = await getDocs(collection(db, COLLECTIONS.participants(tId)));
    for (const pDoc of pSnap.docs) {
      const p = pDoc.data();
      if (!memberIds.has(p.memberId)) {
        orphanCount++;
        errors.push(`VĐV ${p.name} (id: ${pDoc.id}) trong giải ${tId} không liên kết với Member nào.`);
      }
    }

    // Check matches
    const mSnap = await getDocs(collection(db, COLLECTIONS.matches(tId)));
    for (const mDoc of mSnap.docs) {
      const m = mDoc.data() as Match;
      if (!m.team1 || !m.team2) {
        invalidMatchCount++;
        errors.push(`Trận đấu ${mDoc.id} trong giải ${tId} thiếu dữ liệu đội thi đấu.`);
      }
    }
  }

  return {
    orphanParticipants: orphanCount,
    invalidMatches: invalidMatchCount,
    membersUpdated: 0,
    errors,
  };
}
