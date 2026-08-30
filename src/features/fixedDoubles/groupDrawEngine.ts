/**
 * groupDrawEngine.ts — Group Draw for Fixed Doubles (Pure TS)
 * SRS V6 §9.4 — Assign teams to groups using RANDOM or SEEDED mode.
 *
 * Output: groups[] where each group has a name and list of teamIds.
 */

import type { AssignmentMode } from '../../types';

export interface GroupDrawInput {
  teamIds: string[];
  numberOfGroups: number;
  maxEntitiesPerGroup: number;
  mode: AssignmentMode;
  seed: string;
}

export interface GroupDrawResult {
  groups: Array<{ name: string; teamIds: string[] }>;
  seed: string;
  algorithmVersion: string;
}

export interface GroupDrawValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Same LCG seeded shuffle as teamDrawEngine for consistency */
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

/** Generate sequential group names: A, B, C, ... */
function groupName(index: number): string {
  return String.fromCharCode(65 + index); // A=65
}

/**
 * Assign teams to groups.
 * RANDOM: shuffle then distribute. SEEDED: no shuffle (assumes teams already seeded order).
 */
export function drawGroups(input: GroupDrawInput): GroupDrawResult {
  const validation = validateGroupDraw(input);
  if (!validation.valid) {
    throw new Error(`Group draw validation failed: ${validation.errors.join('; ')}`);
  }

  const ordered =
    input.mode === 'RANDOM'
      ? seededShuffle(input.teamIds, input.seed)
      : [...input.teamIds];

  // Round-robin distribution: team 0 → group 0, team 1 → group 1, ...
  const groups: GroupDrawResult['groups'] = Array.from({ length: input.numberOfGroups }, (_, i) => ({
    name: groupName(i),
    teamIds: [] as string[],
  }));

  for (let i = 0; i < ordered.length; i++) {
    const groupIndex = i % input.numberOfGroups;
    groups[groupIndex].teamIds.push(ordered[i]);
  }

  return {
    groups,
    seed: input.seed,
    algorithmVersion: '1.0.0',
  };
}

/** Validate group draw input */
export function validateGroupDraw(input: GroupDrawInput): GroupDrawValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.teamIds || input.teamIds.length < 2) {
    errors.push('Cần ít nhất 2 đội để chia bảng');
  }

  if (input.numberOfGroups < 1) {
    errors.push('Số bảng phải ≥ 1');
  }

  if (input.teamIds && input.numberOfGroups > input.teamIds.length) {
    errors.push(`Số bảng (${input.numberOfGroups}) không được vượt quá số đội (${input.teamIds.length})`);
  }

  if (input.maxEntitiesPerGroup > 0 && input.teamIds) {
    const maxInGroup = Math.ceil(input.teamIds.length / input.numberOfGroups);
    if (maxInGroup > input.maxEntitiesPerGroup) {
      warnings.push(
        `Một số bảng có ${maxInGroup} đội, vượt giới hạn ${input.maxEntitiesPerGroup} đội/bảng`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
