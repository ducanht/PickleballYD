/**
 * rotatingDoublesEngine.ts — Rotating Doubles Schedule Generator (Pure TS)
 * SRS V6 §10 — Generate rotating doubles rounds where players pair with new partners each round.
 *
 * Requirements:
 * - Minimum 4 players per group/pool.
 * - In each round, players are divided into 4-player courts (2 vs 2).
 * - Minimizes partner repetitions across rounds.
 * - Supports multi-group rotating schedules.
 */

import type { EnginePlayer, EngineMatch } from '../../types';

export interface RotatingGroupInput {
  groupId?: string;
  groupName?: string;
  players: EnginePlayer[];
}

export interface RotatingScheduleInput {
  players?: EnginePlayer[];
  groups?: RotatingGroupInput[];
  roundsCount: number;
  courts: number;
  seed: string;
}

export interface RotatingScheduleResult {
  rounds: Array<{
    round: number;
    matches: EngineMatch[];
  }>;
  totalMatches: number;
  algorithmVersion: string;
}

/** LCG seeded random */
function seededRandom(seedStr: string) {
  let s = Array.from(seedStr).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return () => {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Generate rotating schedule for a single pool of players.
 */
function generatePoolSchedule(
  players: EnginePlayer[],
  roundsCount: number,
  courts: number,
  seed: string,
  startOrder: number = 1,
  groupId: string | null = null
): { rounds: Array<{ round: number; matches: EngineMatch[] }>; nextOrder: number } {
  const n = players.length;
  if (n < 4) {
    throw new Error('Mỗi bảng xoay vòng cần ít nhất 4 người chơi.');
  }

  const rng = seededRandom(seed);
  const partnerCounts: Record<string, Record<string, number>> = {};

  for (const p of players) {
    partnerCounts[p.id] = {};
    for (const other of players) {
      if (p.id !== other.id) partnerCounts[p.id][other.id] = 0;
    }
  }

  const scheduleRounds: Array<{ round: number; matches: EngineMatch[] }> = [];
  let currentOrder = startOrder;

  for (let r = 1; r <= roundsCount; r++) {
    // Shuffle player pool for this round
    const pool = [...players].sort(() => rng() - 0.5);
    const roundMatches: EngineMatch[] = [];
    let courtIdx = 0;

    while (pool.length >= 4) {
      const p1 = pool.shift()!;
      pool.sort((a, b) => (partnerCounts[p1.id][a.id] || 0) - (partnerCounts[p1.id][b.id] || 0));
      const p2 = pool.shift()!;

      const p3 = pool.shift()!;
      pool.sort((a, b) => (partnerCounts[p3.id][a.id] || 0) - (partnerCounts[p3.id][b.id] || 0));
      const p4 = pool.shift()!;

      partnerCounts[p1.id][p2.id] = (partnerCounts[p1.id][p2.id] || 0) + 1;
      partnerCounts[p2.id][p1.id] = (partnerCounts[p2.id][p1.id] || 0) + 1;
      partnerCounts[p3.id][p4.id] = (partnerCounts[p3.id][p4.id] || 0) + 1;
      partnerCounts[p4.id][p3.id] = (partnerCounts[p4.id][p3.id] || 0) + 1;

      const courtId = `court-${(courtIdx % courts) + 1}`;
      courtIdx++;

      roundMatches.push({
        team1: [p1.id, p2.id],
        team2: [p3.id, p4.id],
        round: r,
        order: currentOrder++,
        courtId,
      });
    }

    scheduleRounds.push({
      round: r,
      matches: roundMatches,
    });
  }

  return { rounds: scheduleRounds, nextOrder: currentOrder };
}

/**
 * Generates Rotating Doubles rounds (supporting single pool or multi-groups).
 */
export function generateRotatingSchedule(input: RotatingScheduleInput): RotatingScheduleResult {
  const { players, groups, roundsCount, courts, seed } = input;

  // Single pool case
  if (players && players.length > 0) {
    const { rounds } = generatePoolSchedule(players, roundsCount, courts, seed);
    const totalMatches = rounds.reduce((acc, r) => acc + r.matches.length, 0);
    return {
      rounds,
      totalMatches,
      algorithmVersion: '1.2.0',
    };
  }

  // Multi-group case
  if (groups && groups.length > 0) {
    const combinedRoundsMap: Record<number, EngineMatch[]> = {};
    for (let r = 1; r <= roundsCount; r++) {
      combinedRoundsMap[r] = [];
    }

    let globalOrder = 1;
    for (let gIdx = 0; gIdx < groups.length; gIdx++) {
      const g = groups[gIdx];
      const groupSeed = `${seed}-group-${gIdx}`;
      const { rounds: groupRounds, nextOrder } = generatePoolSchedule(
        g.players,
        roundsCount,
        courts,
        groupSeed,
        globalOrder,
        g.groupId || null
      );
      globalOrder = nextOrder;

      for (const gr of groupRounds) {
        combinedRoundsMap[gr.round].push(...gr.matches);
      }
    }

    const finalRounds = Object.entries(combinedRoundsMap).map(([roundNum, matches]) => ({
      round: parseInt(roundNum),
      matches,
    }));

    const totalMatches = finalRounds.reduce((acc, r) => acc + r.matches.length, 0);
    return {
      rounds: finalRounds,
      totalMatches,
      algorithmVersion: '1.2.0',
    };
  }

  throw new Error('Cần cung cấp danh sách VĐV hoặc danh sách Bảng đấu để sinh lịch xoay vòng.');
}
