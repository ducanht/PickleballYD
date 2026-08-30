/**
 * Audit Service — SRS V6 §17
 * Every sensitive operation must call writeAudit().
 * Clients cannot set actor identity arbitrarily — it derives from auth context.
 */
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/firebase';
import { auth } from '../../api/firebase';
import type { AuditModule } from '../../types';

export interface WriteAuditInput {
  action: string;
  module: AuditModule;
  targetId: string;
  tournamentId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function writeAudit(input: WriteAuditInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    // Audit must have a known actor
    console.error('[Audit] Cannot write audit without authenticated user.');
    return;
  }

  await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
    action: input.action,
    module: input.module,
    targetId: input.targetId,
    tournamentId: input.tournamentId ?? null,
    userId: user.uid,
    userName: user.displayName ?? user.email ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    timestamp: serverTimestamp(),
  });
}

/**
 * Write a tournament event to the event timeline (SRS §17.2)
 */
export async function writeTournamentEvent(
  tournamentId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, COLLECTIONS.events(tournamentId)), {
    type,
    actorId: user.uid,
    message,
    metadata,
    timestamp: serverTimestamp(),
  });
}
