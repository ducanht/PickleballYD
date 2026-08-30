import { Timestamp } from 'firebase/firestore';
import type { KnockoutBracket, KnockoutNode, MatchWinner } from '../../../types';

/**
 * Generates a single-elimination knockout bracket.
 * Supports power-of-2 team sizes (4, 8, 16).
 * Round 1 = first round matches. Round totalRounds = Final.
 */
export function generateKnockoutBracket(
  teamNames: string[],
  tournamentId: string
): KnockoutBracket {
  const n = teamNames.length;
  if (n < 2 || (n & (n - 1)) !== 0) {
    throw new Error('Số đội phải là lũy thừa của 2 (4, 8, 16)');
  }

  const totalRounds = Math.log2(n);
  const nodes: KnockoutNode[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = n / Math.pow(2, r);
    for (let p = 1; p <= matchesInRound; p++) {
      const nodeId = `node-r${r}-p${p}`;
      const nextNodeId = r < totalRounds ? `node-r${r + 1}-p${Math.ceil(p / 2)}` : null;

      let team1Name: string | null = null;
      let team2Name: string | null = null;

      if (r === 1) {
        team1Name = teamNames[2 * (p - 1)] ?? null;
        team2Name = teamNames[2 * (p - 1) + 1] ?? null;
      }

      nodes.push({
        id: nodeId,
        round: r,
        position: p,
        matchId: null,
        winner: 'NONE' as MatchWinner,
        team1Name,
        team2Name,
        nextNodeId,
      });
    }
  }

  return {
    tournamentId,
    totalRounds,
    nodes,
    generatedAt: Timestamp.now(),
  };
}

/**
 * Validates structural integrity of a knockout bracket.
 */
export function validateKnockoutBracket(
  bracket: KnockoutBracket
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!bracket.nodes || bracket.nodes.length === 0) {
    return { valid: false, errors: ['Bracket không có node nào'] };
  }

  const nodeMap = new Map(bracket.nodes.map((n) => [n.id, n]));

  for (const node of bracket.nodes) {
    if (node.round < bracket.totalRounds) {
      if (!node.nextNodeId) {
        errors.push(`Node ${node.id} (vòng ${node.round}) thiếu nextNodeId`);
      } else {
        const next = nodeMap.get(node.nextNodeId);
        if (!next) {
          errors.push(`Node ${node.id} trỏ đến nextNodeId ${node.nextNodeId} không tồn tại`);
        } else if (next.round !== node.round + 1) {
          errors.push(`Node ${node.id} (vòng ${node.round}) trỏ đến node vòng ${next.round}`);
        }
      }
    } else {
      if (node.nextNodeId !== null) {
        errors.push(`Node chung kết ${node.id} phải có nextNodeId = null`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Advances the winner of a resolved node to the next round's team slot.
 * Odd position → team1Name of next node; even position → team2Name.
 */
export function advanceWinner(
  bracket: KnockoutBracket,
  winnerNodeId: string,
  _loserNodeId: string
): KnockoutBracket {
  const nodeMap = new Map(bracket.nodes.map((n) => [n.id, n]));
  const node = nodeMap.get(winnerNodeId);

  if (!node) throw new Error(`Node ${winnerNodeId} không tìm thấy trong bracket`);

  const winningTeamName =
    node.winner === 'TEAM1' ? node.team1Name : node.winner === 'TEAM2' ? node.team2Name : null;

  if (!winningTeamName) throw new Error(`Node ${winnerNodeId} chưa có kết quả thắng`);

  if (!node.nextNodeId) return bracket; // Final — no advancement

  const isOdd = node.position % 2 !== 0;

  const newNodes = bracket.nodes.map((n) => {
    if (n.id === node.nextNodeId) {
      return isOdd
        ? { ...n, team1Name: winningTeamName }
        : { ...n, team2Name: winningTeamName };
    }
    return n;
  });

  return { ...bracket, nodes: newNodes };
}
