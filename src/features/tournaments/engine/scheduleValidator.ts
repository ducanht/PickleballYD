/**
 * scheduleValidator.ts — Schedule Hard & Soft Constraints Validator (Pure TS)
 * SRS V6 §9.6 — Validates that a generated schedule strictly obeys all business rules.
 */

import type { EngineMatch, ScheduleValidationResult, RotatingConfig } from '../../../types';

export interface ScheduleValidatorInput {
  matches: EngineMatch[];
  playerIds: string[];
  config: RotatingConfig;
  matchesRequiredPerPlayer: number;
}

export function validateRotatingSchedule(input: ScheduleValidatorInput): ScheduleValidationResult {
  const { matches, playerIds, config, matchesRequiredPerPlayer } = input;
  const hardConstraintErrors: string[] = [];
  const softConstraintWarnings: string[] = [];

  const playerStats: Record<string, { matchesPlayed: number; partners: string[] }> = {};
  const pairStats: Record<string, number> = {};

  for (const pid of playerIds) {
    playerStats[pid] = { matchesPlayed: 0, partners: [] };
  }

  // Round concurrency check map: round -> Set of players playing in that round
  const roundPlayersMap: Record<number, Set<string>> = {};

  for (const m of matches) {
    // Check 4 players present
    const p1 = m.team1[0];
    const p2 = m.team1[1];
    const p3 = m.team2[0];
    const p4 = m.team2[1];

    const matchPlayers = [p1, p2, p3, p4].filter(Boolean);
    if (matchPlayers.length !== 4) {
      hardConstraintErrors.push(`Trận #${m.order} không đủ 4 VĐV.`);
      continue;
    }

    // Check duplicate in same match
    const uniqueInMatch = new Set(matchPlayers);
    if (uniqueInMatch.size !== 4) {
      hardConstraintErrors.push(`Trận #${m.order} có VĐV bị trùng lặp trong cùng 1 trận.`);
    }

    // Check round concurrency: no player plays in 2 matches in same round
    if (!roundPlayersMap[m.round]) {
      roundPlayersMap[m.round] = new Set();
    }
    const currentRoundSet = roundPlayersMap[m.round];
    for (const pid of matchPlayers) {
      if (currentRoundSet.has(pid)) {
        hardConstraintErrors.push(`VĐV ${pid} bị xếp lịch 2 trận cùng lúc trong Vòng ${m.round}.`);
      }
      currentRoundSet.add(pid);
    }

    // Track partner pairs
    const registerPair = (a: string, b: string) => {
      if (!a || !b) return;
      if (playerStats[a]) {
        playerStats[a].matchesPlayed++;
        playerStats[a].partners.push(b);
      }
      if (playerStats[b]) {
        playerStats[b].matchesPlayed++;
        playerStats[b].partners.push(a);
      }
      const pairKey = [a, b].sort().join(':');
      pairStats[pairKey] = (pairStats[pairKey] || 0) + 1;
    };

    registerPair(p1, p2);
    registerPair(p3, p4);
  }

  // Check player matches and unique partner requirements
  for (const pid of playerIds) {
    const stats = playerStats[pid];
    if (!stats) {
      hardConstraintErrors.push(`VĐV ${pid} không có trong lịch thi đấu.`);
      continue;
    }

    // Match count check
    if (stats.matchesPlayed !== matchesRequiredPerPlayer) {
      hardConstraintErrors.push(
        `VĐV ${pid} thi đấu ${stats.matchesPlayed} trận (yêu cầu: ${matchesRequiredPerPlayer}).`
      );
    }

    // Unique partner count
    const uniquePartners = new Set(stats.partners);
    if (uniquePartners.size < config.uniquePartnersRequired) {
      hardConstraintErrors.push(
        `VĐV ${pid} chỉ có ${uniquePartners.size} bạn cặp khác nhau (yêu cầu: ${config.uniquePartnersRequired}).`
      );
    }
  }

  // Soft constraint: Max partner repeat
  if (config.maxPartnerRepeat > 0) {
    for (const [pairKey, count] of Object.entries(pairStats)) {
      if (count > config.maxPartnerRepeat) {
        softConstraintWarnings.push(
          `Cặp đôi ${pairKey} thi đấu cùng nhau ${count} lần (vượt giới hạn mềm ${config.maxPartnerRepeat} lần).`
        );
      }
    }
  }

  const passed = hardConstraintErrors.length === 0;

  return {
    passed,
    hardConstraintErrors,
    softConstraintWarnings,
    playerStats,
    pairStats,
  };
}
