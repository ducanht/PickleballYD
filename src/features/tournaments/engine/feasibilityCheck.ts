/**
 * feasibilityCheck.ts — Mathematical Feasibility Pre-Check (Pure TS)
 * SRS V6 §9.2 — Validates if tournament configuration is mathematically solvable.
 *
 * Rules:
 * 1. numPlayers >= 4
 * 2. uniquePartnersRequired <= numPlayers - 1
 * 3. (numPlayers * matchesRequiredPerPlayer) must be divisible by 4 (4 players per doubles match)
 * 4. matchesRequiredPerPlayer >= uniquePartnersRequired
 * 5. courts >= 1
 */

import type { FeasibilityCheckInput, FeasibilityCheckResult } from '../../../types';

export function feasibilityCheck(input: FeasibilityCheckInput): FeasibilityCheckResult {
  const { numPlayers, uniquePartnersRequired, matchesRequiredPerPlayer, courts } = input;
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Constraint 1: Minimum players
  if (numPlayers < 4) {
    errors.push(`Số người chơi (${numPlayers}) phải ≥ 4.`);
    suggestions.push('Tăng số người chơi lên ít nhất 4 người.');
  }

  // Constraint 2: Maximum possible unique partners
  const maxPossiblePartners = numPlayers - 1;
  if (uniquePartnersRequired > maxPossiblePartners) {
    errors.push(
      `Yêu cầu ${uniquePartnersRequired} bạn cặp khác nhau, nhưng với ${numPlayers} người chỉ có tối đa ${maxPossiblePartners} bạn cặp khả thi.`
    );
    suggestions.push(`Giảm số bạn cặp yêu cầu xuống tối đa ${maxPossiblePartners}.`);
  }

  // Constraint 3: Matches required vs unique partners
  if (matchesRequiredPerPlayer < uniquePartnersRequired) {
    errors.push(
      `Số trận yêu cầu (${matchesRequiredPerPlayer}) nhỏ hơn số bạn cặp yêu cầu (${uniquePartnersRequired}). Mỗi trận chỉ có 1 bạn cặp.`
    );
    suggestions.push(`Tăng số trận mỗi người lên ít nhất ${uniquePartnersRequired} trận.`);
  }

  // Constraint 4: Divisibility by 4
  const totalPlayerSlots = numPlayers * matchesRequiredPerPlayer;
  if (totalPlayerSlots % 4 !== 0) {
    errors.push(
      `Tổng số lượt thi đấu (${totalPlayerSlots} = ${numPlayers} người × ${matchesRequiredPerPlayer} trận) không chia hết cho 4 (mỗi trận có 4 VĐV).`
    );

    // Suggest closest valid matchesRequiredPerPlayer
    const remainder = totalPlayerSlots % 4;
    const diffToAdd = (4 - remainder) / (numPlayers % 4 === 0 ? 1 : 1);
    suggestions.push(
      `Điều chỉnh số trận mỗi người hoặc số người chơi để (Người × Trận) chia hết cho 4.`
    );
  }

  // Constraint 5: Courts
  if (courts < 1) {
    errors.push('Số sân phải ≥ 1.');
    suggestions.push('Chọn ít nhất 1 sân thi đấu.');
  }

  const feasible = errors.length === 0;
  const numMatches = feasible ? totalPlayerSlots / 4 : 0;

  return {
    feasible,
    numMatches,
    errors,
    suggestions,
  };
}
