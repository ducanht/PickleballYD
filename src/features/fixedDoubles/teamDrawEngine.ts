/**
 * teamDrawEngine.ts — Fixed Doubles Partner Draw (Pure TS, no Firestore, no React)
 * SRS V6 §9.3 — Draws partner pairs for Fixed Doubles format.
 *
 * Algorithm:
 * 1. Separate players by gender if genderMode == MALE/FEMALE; or mix 1 MALE + 1 FEMALE for MIXED.
 * 2. Shuffle deterministically using the provided seed (LCG).
 * 3. Pair players in order.
 * 4. Validate: each player appears exactly once, even number of players.
 */

import type { EnginePlayer, GenderMode, Gender } from '../../types';

export interface DrawPlayer extends EnginePlayer {
  gender?: Gender;
}

export interface TeamDrawInput {
  players: DrawPlayer[];
  genderMode?: GenderMode;
  seed: string;
}

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
  let s = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);

  for (let i = result.length - 1; i > 0; i--) {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draw partner pairs for Fixed Doubles.
 * @param input - players list, genderMode, and seed string
 */
export function drawTeams(
  playersOrInput: DrawPlayer[] | TeamDrawInput,
  seedParam?: string
): TeamDrawResult {
  let players: DrawPlayer[];
  let genderMode: GenderMode = 'MIXED';
  let seed: string;

  if (Array.isArray(playersOrInput)) {
    players = playersOrInput;
    seed = seedParam || `seed-${Date.now()}`;
  } else {
    players = playersOrInput.players;
    genderMode = playersOrInput.genderMode || 'MIXED';
    seed = playersOrInput.seed;
  }

  const validation = validateTeamDraw(players, genderMode);
  if (!validation.valid) {
    throw new Error(`Draw validation failed: ${validation.errors.join('; ')}`);
  }

  const teams: TeamDrawResult['teams'] = [];

  if (genderMode === 'MIXED') {
    const males = players.filter((p) => p.gender === 'MALE');
    const females = players.filter((p) => p.gender === 'FEMALE');

    // If both genders are present and equal, pair 1 Male with 1 Female
    if (males.length > 0 && females.length > 0 && males.length === females.length) {
      const shuffledMales = seededShuffle(males, `${seed}-males`);
      const shuffledFemales = seededShuffle(females, `${seed}-females`);

      for (let i = 0; i < shuffledMales.length; i++) {
        const p1 = shuffledMales[i];
        const p2 = shuffledFemales[i];
        teams.push({
          p1,
          p2,
          teamName: `${p1.name} / ${p2.name}`,
        });
      }
      return {
        teams,
        seed,
        algorithmVersion: '1.1.0',
      };
    }
  }

  // Standard even shuffle and pair (for Men's, Women's, or Open Mixed)
  const shuffled = seededShuffle(players, seed);
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
    algorithmVersion: '1.1.0',
  };
}

/** Validates input for team draw */
export function validateTeamDraw(
  players: DrawPlayer[],
  genderMode?: GenderMode
): TeamDrawValidation {
  const errors: string[] = [];

  if (!players || players.length < 2) {
    errors.push('Cần ít nhất 2 người chơi để bốc thăm');
  } else if (players.length % 2 !== 0) {
    errors.push(`Số người chơi phải chẵn (hiện tại: ${players.length})`);
  }

  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) {
    errors.push('Danh sách có ID người chơi trùng lặp');
  }

  if (genderMode === 'MIXED') {
    const males = players.filter((p) => p.gender === 'MALE');
    const females = players.filter((p) => p.gender === 'FEMALE');
    if (males.length > 0 && females.length > 0 && males.length !== females.length) {
      errors.push(
        `Nội dung Đôi Nam Nữ yêu cầu số lượng Nam (${males.length}) và Nữ (${females.length}) phải bằng nhau.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
