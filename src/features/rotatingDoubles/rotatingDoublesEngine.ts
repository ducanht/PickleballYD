/**
 * rotatingDoublesEngine.ts — Rotating Doubles Schedule Generator (Pure TS)
 * SRS V6 §10 — Generate rotating doubles rounds where players pair with new partners each round.
 *
 * Requirements:
 * - Minimum 4 players.
 * - In each round, players are divided into 4-player courts (2 vs 2).
 * - Minimizes partner repetitions across rounds.
 */

import type { EnginePlayer, EngineMatch } from '../../types';

export interface RotatingScheduleInput {
  players: EnginePlayer[];
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
 * Generates Rotating Doubles rounds.
 * Uses a greedy partner-history matrix to minimize repeat partner pairings.
 */
export function generateRotatingSchedule(input: RotatingScheduleInput): RotatingScheduleResult {
  const { players, roundsCount, courts, seed } = input;
  const n = players.length;

  if (n < 4) {
    throw new Error('Cần ít nhất 4 người chơi cho thể thức Cặp Xoay Vòng.');
  }

  const rng = seededRandom(seed);
  const partnerCounts: Record<string, Record<string, number>> = {};

  for (const p of players) {
    partnerCounts[p.id] = {};
    for (const other of players) {
      if (p.id !== other.id) partnerCounts[p.id][other.id] = 0;
    }
  }

  const scheduleRounds: RotatingScheduleResult['rounds'] = [];
  let globalOrder = 1;

  for (let r = 1; r <= roundsCount; r++) {
    // Shuffle player pool for this round
    const pool = [...players].sort(() => rng() - 0.5);
    const roundMatches: EngineMatch[] = [];
    let courtIdx = 0;

    while (pool.length >= 4) {
      // Pick 4 players for one match: [p1, p2] vs [p3, p4]
      const p1 = pool.shift()!;
      // Find partner for p1 with lowest partner count
      pool.sort((a, b) => (partnerCounts[p1.id][a.id] || 0) - (partnerCounts[p1.id][b.id] || 0));
      const p2 = pool.shift()!;

      const p3 = pool.shift()!;
      pool.sort((a, b) => (partnerCounts[p3.id][a.id] || 0) - (partnerCounts[p3.id][b.id] || 0));
      const p4 = pool.shift()!;

      // Track partner usage
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
        order: globalOrder++,
        courtId,
      });
    }

    scheduleRounds.push({
      round: r,
      matches: roundMatches,
    });
  }

  const totalMatches = scheduleRounds.reduce((sum, rd) => sum + rd.matches.length, 0);

  return {
    rounds: scheduleRounds,
    totalMatches,
    algorithmVersion: '1.0.0',
  };
}
