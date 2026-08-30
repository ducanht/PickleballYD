/**
 * SRS V6 – Yen Dinh Pickleball Hub
 * Complete TypeScript type definitions matching SRS V6 schema exactly.
 * These types are the single source of truth for all data contracts.
 */

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// SHARED ENUMS
// ─────────────────────────────────────────────

export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE';

export type School = 'YD1' | 'YD2' | 'YD3' | 'OTHER';

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type FinanceType = 'IN' | 'OUT';

export type FinanceStatus = 'CONFIRMED' | 'VOID';

export type TournamentStatus =
  | 'DRAFT'
  | 'DRAWING'
  | 'DRAWN'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type TournamentFormat = 'FIXED_DOUBLES' | 'ROTATING_DOUBLES';

export type GenderMode = 'MALE' | 'FEMALE' | 'MIXED';

export type MatchFormat = 'SINGLE_GAME' | 'BEST_OF_3';

export type AssignmentMode = 'RANDOM' | 'SEEDED';

export type EntityType = 'TEAM' | 'PARTICIPANT';

export type PairingMode = 'FIXED_BRACKET' | 'NEW_RANDOM_PAIR' | 'KEEP_GROUP_PAIR';

export type DrawMode = 'FIXED' | 'RANDOM';

export type RankingRule = 'MATCH_WINS' | 'POINT_DIFFERENCE' | 'POINTS_WON' | 'HEAD_TO_HEAD';

export type MatchStage = 'GROUP' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export type MatchStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'WALKOVER';

export type RegistrationStatus = 'REGISTERED' | 'CONFIRMED' | 'WITHDRAWN' | 'ABSENT';

export type DrawType = 'PARTNER' | 'GROUP' | 'KNOCKOUT';

export type AuditModule = 'MEMBER' | 'FINANCE' | 'TOURNAMENT' | 'AUTH';

export type TournamentEventType =
  | 'DRAW_PARTNERS'
  | 'DRAW_GROUPS'
  | 'MATCH_STARTED'
  | 'SCORE_UPDATED'
  | 'MATCH_COMPLETED'
  | 'KNOCKOUT_DRAW'
  | 'TOURNAMENT_COMPLETED';

// ─────────────────────────────────────────────
// MODULE 1 – MEMBERS (SRS §4)
// ─────────────────────────────────────────────

export interface AllTimeStats {
  tournamentsPlayed: number;
  matchesPlayed: number;
  matchesWon: number;
  pointsWon: number;
  pointsLost: number;
}

/** members/{memberId} */
export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  phone: string | null;
  school: School;
  avatarUrl: string | null;
  status: MemberStatus;
  note: string | null;
  /** aggregate/cache — rebuild from match history */
  allTimeStats: AllTimeStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MemberCreateInput = Omit<Member, 'id' | 'allTimeStats' | 'createdAt' | 'updatedAt'>;
export type MemberUpdateInput = Partial<MemberCreateInput>;

// ─────────────────────────────────────────────
// AUTH / USERS (SRS §3)
// ─────────────────────────────────────────────

/** users/{uid} */
export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp | null;
}

// ─────────────────────────────────────────────
// MODULE 2 – FINANCE (SRS §5)
// ─────────────────────────────────────────────

/** finances/{financeId} */
export interface Finance {
  id: string;
  type: FinanceType;
  category: string;
  /** Must be > 0; sign is determined by type */
  amount: number;
  description: string;
  personId: string | null;
  /** snapshot of name at transaction time */
  personName: string | null;
  tournamentId: string | null;
  year: number;
  receiptUrl: string | null;
  status: FinanceStatus;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: Timestamp | null;
  timestamp: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
}

export type FinanceCreateInput = Omit<
  Finance,
  'id' | 'status' | 'voidReason' | 'voidedBy' | 'voidedAt' | 'timestamp' | 'updatedAt'
>;

export interface FinanceSummary {
  totalIn: number;
  totalOut: number;
  balance: number;
}

// ─────────────────────────────────────────────
// MODULE 3 – TOURNAMENT (SRS §6)
// ─────────────────────────────────────────────

export interface ParticipantConfig {
  genderMode: GenderMode;
  maxPlayers: number;
}

export interface RotatingConfig {
  uniquePartnersRequired: number;
  matchesRequiredPerPlayer: number | 'AUTO';
  maxPartnerRepeat: number;
  balanceMatches: boolean;
  balanceRest: boolean;
  minimizeOpponentRepeat: boolean;
}

export interface GroupsConfig {
  numberOfGroups: number;
  maxEntitiesPerGroup: number;
  assignmentMode: AssignmentMode;
}

export interface ScoringConfig {
  matchFormat: MatchFormat;
  pointsToWin: number;
  winByTwo: boolean;
  maxPoints: number | null;
}

export interface RankingConfig {
  rules: RankingRule[];
}

export interface KnockoutConfig {
  enabled: boolean;
  qualifiersPerGroup: number;
  pairingMode: PairingMode;
  drawMode: DrawMode;
}

export interface SchedulingConfig {
  courts: number;
  restBetweenMatches: number;
}

export interface TournamentConfig {
  format: TournamentFormat;
  participants: ParticipantConfig;
  rotating: RotatingConfig;
  groups: GroupsConfig;
  scoring: ScoringConfig;
  ranking: RankingConfig;
  knockout: KnockoutConfig;
  scheduling: SchedulingConfig;
}

/** tournaments/{tournamentId} */
export interface Tournament {
  id: string;
  name: string;
  startDate: Timestamp;
  status: TournamentStatus;
  config: TournamentConfig;
  /** URL-friendly slug for public live board */
  publicSlug: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export type TournamentCreateInput = Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;

// ─────────────────────────────────────────────
// TOURNAMENT SUBCOLLECTIONS (SRS §7)
// ─────────────────────────────────────────────

export interface TournamentStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  pointsWon: number;
  pointsLost: number;
  pointsDifference: number;
}

/** tournaments/{id}/participants/{participantId} */
export interface Participant {
  id: string;
  memberId: string;
  /** snapshot at registration time */
  name: string;
  gender: Gender;
  school: School;
  avatarUrl: string | null;
  seed: number | null;
  registrationStatus: RegistrationStatus;
  tournamentStats: TournamentStats;
  createdAt: Timestamp;
}

export interface TeamStats {
  played: number;
  won: number;
  lost: number;
  pointsDifference: number;
}

/** tournaments/{id}/teams/{teamId} — Fixed Doubles only */
export interface Team {
  id: string;
  name: string;
  p1Id: string;
  p2Id: string;
  /** snapshot names */
  p1Name: string;
  p2Name: string;
  groupId: string | null;
  teamStats: TeamStats;
  createdAt: Timestamp;
}

/** tournaments/{id}/groups/{groupId} */
export interface TournamentGroup {
  id: string;
  name: string;
  type: GenderMode;
  entityType: EntityType;
  entityIds: string[];
  maxEntities: number;
}

// ─────────────────────────────────────────────
// MATCH ENGINE (SRS §8)
// ─────────────────────────────────────────────

export interface GameScore {
  score1: number;
  score2: number;
}

export interface MatchSide {
  p1Id: string;
  p1Name: string;
  p2Id: string;
  p2Name: string;
}

/** tournaments/{id}/matches/{matchId} */
export interface Match {
  id: string;
  stage: MatchStage;
  round: number;
  groupId: string | null;
  order: number;
  courtId: string | null;
  team1: MatchSide;
  team2: MatchSide;
  games: GameScore[];
  score1Total: number;
  score2Total: number;
  winner: 'TEAM1' | 'TEAM2' | 'NONE';
  status: MatchStatus;
  /** uid of device/user currently entering score */
  operatorId: string | null;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

/** tournaments/{id}/matches/{matchId}/scoreHistory/{historyId} */
export interface ScoreHistory {
  id: string;
  oldGames: GameScore[];
  newGames: GameScore[];
  changedBy: string;
  changedAt: Timestamp;
  reason: string | null;
}

// ─────────────────────────────────────────────
// DRAW (SRS §9.6)
// ─────────────────────────────────────────────

export interface DrawValidation {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/** tournaments/{id}/draws/{drawId} */
export interface Draw {
  id: string;
  drawType: DrawType;
  seed: string;
  algorithmVersion: string;
  inputHash: string;
  result: Record<string, unknown>;
  validation: DrawValidation;
  createdBy: string;
  createdAt: Timestamp;
}

// ─────────────────────────────────────────────
// AUDIT & EVENTS (SRS §17)
// ─────────────────────────────────────────────

/** auditLogs/{auditId} */
export interface AuditLog {
  id: string;
  action: string;
  module: AuditModule;
  targetId: string;
  tournamentId: string | null;
  userId: string;
  userName: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: Timestamp;
}

/** tournaments/{id}/events/{eventId} */
export interface TournamentEvent {
  id: string;
  type: TournamentEventType;
  actorId: string;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: Timestamp;
}

// ─────────────────────────────────────────────
// TOURNAMENT ENGINE – PURE TS DOMAIN TYPES (SRS §9)
// ─────────────────────────────────────────────

/** Input player for engine (decoupled from Firestore) */
export interface EnginePlayer {
  id: string;
  name: string;
}

/** A single match in engine output */
export interface EngineMatch {
  team1: [string, string]; // [p1Id, p2Id]
  team2: [string, string]; // [p1Id, p2Id]
  round: number;
  order: number;
  courtId: string | null;
}

export interface FeasibilityCheckInput {
  numPlayers: number;
  uniquePartnersRequired: number;
  matchesRequiredPerPlayer: number;
  courts: number;
}

export interface FeasibilityCheckResult {
  feasible: boolean;
  numMatches: number;
  errors: string[];
  suggestions: string[];
}

export interface ScheduleValidationResult {
  passed: boolean;
  hardConstraintErrors: string[];
  softConstraintWarnings: string[];
  playerStats: Record<string, { matchesPlayed: number; partners: string[] }>;
  pairStats: Record<string, number>;
}

// ─────────────────────────────────────────────
// STANDINGS (SRS §14)
// ─────────────────────────────────────────────

export interface StandingEntry {
  entityId: string;
  entityName: string;
  rank: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  pointsWon: number;
  pointsLost: number;
  pointsDifference: number;
  isTied: boolean;
}

// ─────────────────────────────────────────────
// UI STATE TYPES
// ─────────────────────────────────────────────

export interface FilterState {
  search: string;
  status?: MemberStatus;
  school?: School;
  gender?: Gender;
}

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

// ─────────────────────────────────────────────
// KNOCKOUT BRACKET TYPES
// ─────────────────────────────────────────────

export type MatchWinner = 'TEAM1' | 'TEAM2' | 'NONE';

export interface KnockoutNode {
  id: string;
  round: number;       // 1 = first round, totalRounds = Final
  position: number;    // 1-indexed within round
  matchId: string | null;
  winner: MatchWinner;
  team1Name: string | null;
  team2Name: string | null;
  nextNodeId: string | null; // winner advances here
}

export interface KnockoutBracket {
  tournamentId: string;
  totalRounds: number;
  nodes: KnockoutNode[];
  generatedAt: Timestamp;
}

