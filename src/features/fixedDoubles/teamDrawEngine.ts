/**
 * teamDrawEngine.ts — Fixed Doubles Partner Draw (Pure TS, no Firestore, no React)
 * SRS V6 §9.3 — Draws partner pairs for Fixed Doubles format.
 *
 * Algorithm:
 * 1. Separate players by gender if genderMode == MALE/FEMALE; or mix for MIXED.
 * 2. Shuffle deterministically using the provided seed (LCG).
 * 3. Pair players in order (player[0]+player[1], player[2]+player[3], ...).
 * 4. Validate: each player appears exactly once, even number of players.
 */

import type { EnginePlayer } from '../../types';

export interface TeamDrawResult {
  teams: Array<{ p1: EnginePlayer; p2: EnginePlayer; teamName: string }>;
  seed: string;
  algorithmVersion: string;
}

export interface TeamDrawValidation {
  valid: boolean;
  errors: string[];
}

/** Simple deterministic LCG shuffle (seed-based) */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  // Convert seed string to numeric seed
  let s = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);

  for (let i = result.length - 1; i > 0; i--) {
    // LCG: next = (a * s + c) % m
    s = (1664525 * s + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draw partner pairs for Fixed Doubles.
 * @param players - list of players to pair (must be even count)
 * @param seed - deterministic seed string (e.g., tournament ID + timestamp)
 */
export function drawTeams(players: EnginePlayer[], seed: string): TeamDrawResult {
  const validation = validateTeamDraw(players);
  if (!validation.valid) {
    throw new Error(`Draw validation failed: ${validation.errors.join('; ')}`);
  }

  const shuffled = seededShuffle(players, seed);
  const teams: TeamDrawResult['teams'] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];
    teams.push({
      p1,
      p2,
      teamName: `${p1.name} / ${p2.name}`,
    });
  }

  return {
    teams,
    seed,
    algorithmVersion: '1.0.0',
  };
}

/** Validates input for team draw */
export function validateTeamDraw(players: EnginePlayer[]): TeamDrawValidation {
  const errors: string[] = [];

  if (!players || players.length < 2) {
    errors.push('Cần ít nhất 2 người chơi để bốc thăm');
  } else if (players.length % 2 !== 0) {
    errors.push(`Số người chơi phải chẵn (hiện tại: ${players.length})`);
  }

  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) {
    errors.push('Danh sách có ID trùng lặp');
  }

  return { valid: errors.length === 0, errors };
}
