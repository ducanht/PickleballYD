/**
 * fixtureGenerator.ts — Round-Robin Fixture Generator (Pure TS)
 * SRS V6 §9.5 — Generate round-robin match schedule within a group.
 *
 * Uses the standard "circle method" / Berger tables for round-robin.
 * Supports odd number of teams (bye round with null slot).
 * Distributes matches across available courts.
 */

import type { EngineMatch } from '../../types';

export interface FixtureGeneratorInput {
  /** teamIds in this group — each team is a pair of player IDs joined by ':' or just an opaque ID */
  teamIds: string[];
  groupId: string;
  courts: number;
  startRound?: number; // default 1
}

export interface FixtureGeneratorResult {
  matches: EngineMatch[];
  rounds: number;
  algorithmVersion: string;
}

/**
 * Generate a complete round-robin fixture for a list of teams.
 * Implements the "rotation" (circle) method for scheduling.
 * With N teams: (N-1) rounds, each round has N/2 matches (N even) or (N-1)/2 (N odd, one bye).
 */
export function generateRoundRobin(input: FixtureGeneratorInput): FixtureGeneratorResult {
  const { teamIds, groupId, courts, startRound = 1 } = input;
  const n = teamIds.length;

  if (n < 2) {
    return { matches: [], rounds: 0, algorithmVersion: '1.0.0' };
  }

  // Pad with 'BYE' if odd
  const teams = n % 2 !== 0 ? [...teamIds, '__BYE__'] : [...teamIds];
  const N = teams.length; // guaranteed even
  const rounds = N - 1;
  const matchesPerRound = N / 2;

  const matches: EngineMatch[] = [];
  let matchOrder = 1;

  // Circle method: fix teams[0], rotate the rest
  const rotatable = teams.slice(1);

  for (let r = 0; r < rounds; r++) {
    const roundNumber = startRound + r;
    const current = [teams[0], ...rotatable];

    let courtIndex = 0;
    for (let m = 0; m < matchesPerRound; m++) {
      const t1 = current[m];
      const t2 = current[N - 1 - m];

      // Skip BYE matches
      if (t1 === '__BYE__' || t2 === '__BYE__') continue;

      const courtId = `court-${(courtIndex % courts) + 1}`;
      courtIndex++;

      matches.push({
        team1: [t1, ''] as [string, string],
        team2: [t2, ''] as [string, string],
        round: roundNumber,
        order: matchOrder++,
        courtId,
      });

      // Encode groupId into team IDs so the service layer can identify group context
      // The service layer reads match.team1[0] as teamId in the group context
      // groupId is passed separately for context
      void groupId;
    }

    // Rotate: move last element to front of rotatable
    rotatable.unshift(rotatable.pop()!);
  }

  return {
    matches,
    rounds,
    algorithmVersion: '1.0.0',
  };
}

/**
 * Validate fixture generator input.
 */
export function validateFixtureInput(input: FixtureGeneratorInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.teamIds || input.teamIds.length < 2) {
    errors.push('Cần ít nhất 2 đội để tạo lịch thi đấu');
  }
  if (input.courts < 1) {
    errors.push('Số sân phải ≥ 1');
  }
  return { valid: errors.length === 0, errors };
}
