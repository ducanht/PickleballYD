/**
 * Standings Calculator — SRS V6 §14
 * Pure TypeScript module — no React, no Firestore imports.
 * Computes group standings from match results with tie-break rules.
 *
 * Ranking rules applied in order:
 * 1. MATCH_WINS
 * 2. POINT_DIFFERENCE
 * 3. POINTS_WON
 * 4. HEAD_TO_HEAD
 *
 * If still tied after all rules, marks isTied = true (BR-012: no silent random).
 */
import type { Match, StandingEntry, RankingRule } from '../../../types';

export interface StandingsInput {
  entityIds: string[];        // team or participant IDs
  entityNames: Record<string, string>;  // id → name map
  matches: Match[];
  rankingRules: RankingRule[];
}

interface EntityStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  pointsWon: number;
  pointsLost: number;
  pointsDifference: number;
  /** Head-to-head wins against each opponent */
  h2hWins: Record<string, number>;
}

function emptyStats(): EntityStats {
  return {
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    pointsDifference: 0,
    h2hWins: {},
  };
}

function getMatchEntityIds(match: Match): { id1: string; id2: string } {
  // For Fixed Doubles: entity = team (p1Id + p2Id compound key not used here)
  // For Rotating: entity = individual participant
  // We use p1Id from each side as the entity ID (team draws store team ID in match)
  // Convention: match.team1.p1Id holds the entity/team ID
  return {
    id1: match.team1.p1Id,
    id2: match.team2.p1Id,
  };
}

export function calculateStandings(input: StandingsInput): StandingEntry[] {
  const { entityIds, entityNames, matches, rankingRules } = input;

  // Initialize stats map
  const statsMap: Record<string, EntityStats> = {};
  for (const id of entityIds) {
    statsMap[id] = emptyStats();
  }

  // Accumulate match results
  for (const match of matches) {
    if (match.status !== 'COMPLETED') continue;
    const { id1, id2 } = getMatchEntityIds(match);

    if (!statsMap[id1] || !statsMap[id2]) continue;

    const s1 = statsMap[id1];
    const s2 = statsMap[id2];

    s1.matchesPlayed++;
    s2.matchesPlayed++;
    s1.pointsWon += match.score1Total;
    s1.pointsLost += match.score2Total;
    s2.pointsWon += match.score2Total;
    s2.pointsLost += match.score1Total;
    s1.pointsDifference = s1.pointsWon - s1.pointsLost;
    s2.pointsDifference = s2.pointsWon - s2.pointsLost;

    if (match.winner === 'TEAM1') {
      s1.matchesWon++;
      s2.matchesLost++;
      s1.h2hWins[id2] = (s1.h2hWins[id2] ?? 0) + 1;
    } else if (match.winner === 'TEAM2') {
      s2.matchesWon++;
      s1.matchesLost++;
      s2.h2hWins[id1] = (s2.h2hWins[id1] ?? 0) + 1;
    }
  }

  // Build entries
  const entries: (StandingEntry & { stats: EntityStats })[] = entityIds.map((id) => ({
    entityId: id,
    entityName: entityNames[id] ?? id,
    rank: 0,
    matchesPlayed: statsMap[id].matchesPlayed,
    matchesWon: statsMap[id].matchesWon,
    matchesLost: statsMap[id].matchesLost,
    pointsWon: statsMap[id].pointsWon,
    pointsLost: statsMap[id].pointsLost,
    pointsDifference: statsMap[id].pointsDifference,
    isTied: false,
    stats: statsMap[id],
  }));

  // Sort by ranking rules in order
  entries.sort((a, b) => {
    for (const rule of rankingRules) {
      let diff = 0;
      switch (rule) {
        case 'MATCH_WINS':
          diff = b.matchesWon - a.matchesWon;
          break;
        case 'POINT_DIFFERENCE':
          diff = b.pointsDifference - a.pointsDifference;
          break;
        case 'POINTS_WON':
          diff = b.pointsWon - a.pointsWon;
          break;
        case 'HEAD_TO_HEAD': {
          const aWinsOverB = a.stats.h2hWins[b.entityId] ?? 0;
          const bWinsOverA = b.stats.h2hWins[a.entityId] ?? 0;
          diff = bWinsOverA - aWinsOverB;
          break;
        }
      }
      if (diff !== 0) return diff;
    }
    return 0; // still tied
  });

  // Assign ranks and detect ties
  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      entries[i].rank = 1;
    } else {
      const prev = entries[i - 1];
      const curr = entries[i];
      const stillTied = rankingRules.every((rule) => {
        switch (rule) {
          case 'MATCH_WINS': return curr.matchesWon === prev.matchesWon;
          case 'POINT_DIFFERENCE': return curr.pointsDifference === prev.pointsDifference;
          case 'POINTS_WON': return curr.pointsWon === prev.pointsWon;
          case 'HEAD_TO_HEAD': {
            const cwb = curr.stats.h2hWins[prev.entityId] ?? 0;
            const pwc = prev.stats.h2hWins[curr.entityId] ?? 0;
            return cwb === pwc;
          }
        }
      });

      if (stillTied) {
        curr.rank = prev.rank;
        curr.isTied = true;
        // Also mark previous as tied (BR-012: must flag, not random)
        const prevEntry = entries.find((e) => e.entityId === prev.entityId);
        if (prevEntry) prevEntry.isTied = true;
      } else {
        curr.rank = i + 1;
      }
    }
  }

  // Return without internal stats
  return entries.map(({ stats: _stats, ...entry }) => entry);
}
