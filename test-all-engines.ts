/**
 * Comprehensive Automated Verification Script for Pure TS Engines
 * Run with: npx tsx test-all-engines.ts
 */

import { feasibilityCheck } from './src/features/tournaments/engine/feasibilityCheck';
import { validateRotatingSchedule } from './src/features/tournaments/engine/scheduleValidator';
import { drawTeams } from './src/features/fixedDoubles/teamDrawEngine';
import { drawGroups } from './src/features/fixedDoubles/groupDrawEngine';
import { generateRoundRobin } from './src/features/fixedDoubles/fixtureGenerator';
import { generateRotatingSchedule } from './src/features/rotatingDoubles/rotatingDoublesEngine';
import { calculateStandings } from './src/features/tournaments/engine/standingsCalculator';
import { generateKnockoutBracket, advanceWinner } from './src/features/tournaments/engine/knockoutEngine';
import type { EnginePlayer, Match, Timestamp } from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING COMPREHENSIVE ENGINE VERIFICATION');
console.log('========================================\n');

// ── 1. Feasibility Check Tests ───────────────────────────────────────────────
console.log('1. Testing feasibilityCheck:');
{
  const valid = feasibilityCheck({
    numPlayers: 8,
    uniquePartnersRequired: 3,
    matchesRequiredPerPlayer: 3,
    courts: 2,
  });
  assert(valid.feasible === true && valid.numMatches === 6, '8 players, 3 matches/p -> 6 matches');

  const invalidPlayers = feasibilityCheck({
    numPlayers: 3,
    uniquePartnersRequired: 2,
    matchesRequiredPerPlayer: 2,
    courts: 1,
  });
  assert(invalidPlayers.feasible === false, 'Fails when numPlayers < 4');

  const notDivisibleBy4 = feasibilityCheck({
    numPlayers: 6,
    uniquePartnersRequired: 3,
    matchesRequiredPerPlayer: 3,
    courts: 1,
  });
  assert(notDivisibleBy4.feasible === false, 'Fails when (N * M) % 4 != 0 (18 slots)');
}

// ── 2. Team Draw Engine Tests ────────────────────────────────────────────────
console.log('\n2. Testing teamDrawEngine (Fixed Doubles):');
{
  const players: EnginePlayer[] = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `VĐV ${i + 1}`,
  }));

  const res = drawTeams(players, 'seed-12345');
  assert(res.teams.length === 4, 'Pairs 8 players into 4 teams');

  const allAssigned = res.teams.flatMap((t) => [t.p1.id, t.p2.id]);
  const uniquePids = new Set(allAssigned);
  assert(uniquePids.size === 8, 'All 8 players assigned without duplication');
}

// ── 3. Group Draw Engine Tests ───────────────────────────────────────────────
console.log('\n3. Testing groupDrawEngine:');
{
  const teamIds = ['t1', 't2', 't3', 't4', 't5', 't6'];
  const res = drawGroups({
    teamIds,
    numberOfGroups: 2,
    maxEntitiesPerGroup: 3,
    mode: 'RANDOM',
    seed: 'grp-seed',
  });

  assert(res.groups.length === 2, 'Divides 6 teams into 2 groups');
  assert(res.groups[0].teamIds.length === 3 && res.groups[1].teamIds.length === 3, '3 teams per group');
}

// ── 4. Fixture Generator Tests ───────────────────────────────────────────────
console.log('\n4. Testing fixtureGenerator (Circle Round Robin):');
{
  const teamIds = ['t1', 't2', 't3', 't4'];
  const res = generateRoundRobin({
    teamIds,
    groupId: 'A',
    courts: 2,
  });

  // 4 teams in round-robin = (4 * 3) / 2 = 6 matches across 3 rounds
  assert(res.matches.length === 6, '4 teams round-robin generates 6 matches');
  assert(res.rounds === 3, 'Generates 3 rounds');
  const hasSelfPlay = res.matches.some((m) => m.team1[0] === m.team2[0]);
  assert(!hasSelfPlay, 'Zero self-match occurrences');
}

// ── 5. Rotating Doubles Engine Tests ─────────────────────────────────────────
console.log('\n5. Testing rotatingDoublesEngine:');
{
  const players: EnginePlayer[] = Array.from({ length: 8 }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
  }));

  const res = generateRotatingSchedule({
    players,
    roundsCount: 4,
    courts: 2,
    seed: 'rotating-seed',
  });

  assert(res.rounds.length === 4, 'Generates 4 rounds');
  assert(res.totalMatches === 8, '8 total matches for 8 players over 4 rounds');

  // Verify schedule validation passes
  const allMatches = res.rounds.flatMap((r) => r.matches);
  const val = validateRotatingSchedule({
    matches: allMatches,
    playerIds: players.map((p) => p.id),
    config: {
      uniquePartnersRequired: 3,
      matchesRequiredPerPlayer: 4,
      maxPartnerRepeat: 2,
      restPeriodRounds: 1,
      rankingRule: 'INDIVIDUAL_POINTS',
    },
    matchesRequiredPerPlayer: 4,
  });
  assert(val.passed, 'Generated schedule passes strict schedule validator');
}

// ── 6. Standings Calculator Tests ────────────────────────────────────────────
console.log('\n6. Testing standingsCalculator:');
{
  const mockNow = { seconds: 123456, nanoseconds: 0 } as Timestamp;
  const mockMatches: Match[] = [
    {
      id: 'm1',
      stage: 'GROUP',
      round: 1,
      groupId: 'A',
      order: 1,
      courtId: 'court-1',
      team1: { p1Id: 't1', p1Name: 'Team 1', p2Id: '', p2Name: '' },
      team2: { p1Id: 't2', p1Name: 'Team 2', p2Id: '', p2Name: '' },
      games: [{ score1: 11, score2: 5 }],
      score1Total: 11,
      score2Total: 5,
      winner: 'TEAM1',
      status: 'COMPLETED',
      operatorId: null,
      updatedAt: mockNow,
      completedAt: mockNow,
    },
    {
      id: 'm2',
      stage: 'GROUP',
      round: 2,
      groupId: 'A',
      order: 2,
      courtId: 'court-1',
      team1: { p1Id: 't2', p1Name: 'Team 2', p2Id: '', p2Name: '' },
      team2: { p1Id: 't3', p1Name: 'Team 3', p2Id: '', p2Name: '' },
      games: [{ score1: 11, score2: 9 }],
      score1Total: 11,
      score2Total: 9,
      winner: 'TEAM1',
      status: 'COMPLETED',
      operatorId: null,
      updatedAt: mockNow,
      completedAt: mockNow,
    },
  ];

  const standings = calculateStandings({
    entityIds: ['t1', 't2', 't3'],
    entityNames: { t1: 'Đội 1', t2: 'Đội 2', t3: 'Đội 3' },
    matches: mockMatches,
    rankingRules: ['MATCH_WINS', 'POINT_DIFFERENCE', 'POINTS_WON', 'HEAD_TO_HEAD'],
  });

  assert(standings[0].entityId === 't1', 'Rank 1 is Team 1 (1 Win, +6 diff)');
  assert(standings[1].entityId === 't2', 'Rank 2 is Team 2 (1 Win, 1 Loss, -4 diff)');
  assert(standings[2].entityId === 't3', 'Rank 3 is Team 3 (0 Wins)');
}

// ── 7. Knockout Engine Tests ─────────────────────────────────────────────────
console.log('\n7. Testing knockoutEngine:');
{
  const bracket = generateKnockoutBracket(['Team A', 'Team B', 'Team C', 'Team D'], 't-1');
  assert(bracket.totalRounds === 2, '4 teams = 2 rounds (Semi-finals & Finals)');
  assert(bracket.nodes.length === 3, '4 teams = 3 match nodes (2 semis + 1 final)');

  // Advance winner of Semi 1 (node 1)
  const semi1Node = bracket.nodes.find((n) => n.round === 1 && n.position === 1)!;
  const updatedBracket = advanceWinner(bracket, semi1Node.id, 'TEAM1');
  const finalNode = updatedBracket.nodes.find((n) => n.round === 2);
  assert(finalNode?.team1Name === 'Team A', 'Finals node receives winner Team A');
}

console.log('\n========================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
