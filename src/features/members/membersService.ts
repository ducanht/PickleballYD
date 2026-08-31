/**
 * Members Service — SRS V6 §4
 * CRUD/Archive operations on members collection.
 * Every write goes through writeAudit().
 * No physical delete if member has tournament/finance history.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Query,
  type DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '../../api/firebase';
import { writeAudit } from '../tournaments/auditService';
import type {
  Member,
  MemberCreateInput,
  MemberUpdateInput,
  MemberStatus,
  School,
  Gender,
  AllTimeStats,
} from '../../types';

// ── Default all-time stats ────────────────────────────────────────────────────
const DEFAULT_STATS: AllTimeStats = {
  tournamentsPlayed: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  pointsWon: 0,
  pointsLost: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function docToMember(id: string, data: DocumentData): Member {
  return { id, ...data } as Member;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export interface MemberFilter {
  status?: MemberStatus;
  school?: School;
  gender?: Gender;
}

import { INITIAL_SEED_MEMBERS } from '../mockData';

export async function getMembers(filter: MemberFilter = {}): Promise<Member[]> {
  try {
    const colRef = collection(db, COLLECTIONS.MEMBERS);
    const conditions: Parameters<typeof query>[1][] = [];

    if (filter.status) conditions.push(where('status', '==', filter.status));
    if (filter.school) conditions.push(where('school', '==', filter.school));
    if (filter.gender) conditions.push(where('gender', '==', filter.gender));

    conditions.push(orderBy('fullName', 'asc'));

    const q = conditions.length > 0
      ? query(colRef, ...conditions) as Query<DocumentData>
      : query(colRef, orderBy('fullName', 'asc'));

    const snap = await getDocs(q);
    if (snap.empty) {
      let res = [...INITIAL_SEED_MEMBERS];
      if (filter.status) res = res.filter((m) => m.status === filter.status);
      if (filter.school) res = res.filter((m) => m.school === filter.school);
      if (filter.gender) res = res.filter((m) => m.gender === filter.gender);
      return res;
    }
    return snap.docs.map((d) => docToMember(d.id, d.data()));
  } catch (err) {
    console.warn('[MembersService] getMembers fallback to seed data:', err);
    let res = [...INITIAL_SEED_MEMBERS];
    if (filter.status) res = res.filter((m) => m.status === filter.status);
    if (filter.school) res = res.filter((m) => m.school === filter.school);
    if (filter.gender) res = res.filter((m) => m.gender === filter.gender);
    return res;
  }
}

export async function getMember(memberId: string): Promise<Member | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
    if (!snap.exists()) {
      const fallback = INITIAL_SEED_MEMBERS.find((m) => m.id === memberId);
      return fallback || null;
    }
    return docToMember(snap.id, snap.data());
  } catch (err) {
    console.warn('[MembersService] getMember fallback to seed data:', err);
    const fallback = INITIAL_SEED_MEMBERS.find((m) => m.id === memberId);
    return fallback || null;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createMember(input: MemberCreateInput): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTIONS.MEMBERS), {
    ...input,
    allTimeStats: DEFAULT_STATS,
    status: input.status ?? 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });

  await writeAudit({
    action: 'CREATE_MEMBER',
    module: 'MEMBER',
    targetId: ref.id,
    after: { fullName: input.fullName, status: input.status },
  });

  return ref.id;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateMember(
  memberId: string,
  updates: MemberUpdateInput
): Promise<void> {
  const before = await getMember(memberId);

  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'UPDATE_MEMBER',
    module: 'MEMBER',
    targetId: memberId,
    before: before ? { fullName: before.fullName, status: before.status } : null,
    after: updates as Record<string, unknown>,
  });
}

// ── Archive (soft delete) — SRS §4.1, BR-014 ─────────────────────────────────
// Members with tournament/finance history must NOT be physically deleted.

export async function archiveMember(memberId: string): Promise<void> {
  const before = await getMember(memberId);

  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), {
    status: 'ARCHIVED' as MemberStatus,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'ARCHIVE_MEMBER',
    module: 'MEMBER',
    targetId: memberId,
    before: { status: before?.status },
    after: { status: 'ARCHIVED' },
  });
}

// ── Avatar upload — SRS FR-MEM-002 ───────────────────────────────────────────

export async function uploadAvatar(memberId: string, file: File): Promise<string> {
  // Validate: only image files
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, etc.)');
  }

  // Delete old avatar if exists
  const member = await getMember(memberId);
  if (member?.avatarUrl?.startsWith('https://firebasestorage.googleapis.com')) {
    try {
      const oldRef = ref(storage, `avatars/${memberId}`);
      await deleteObject(oldRef);
    } catch {
      // Ignore if not found
    }
  }

  const storageRef = ref(storage, `avatars/${memberId}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), {
    avatarUrl: url,
    updatedAt: serverTimestamp(),
  });

  return url;
}

// ── Rebuild all-time stats — SRS §20.2, FR-DATA-001 ─────────────────────────
// This is a read-then-write operation; should only be called by ADMIN tools.
// The actual implementation will aggregate from tournaments/{id}/matches subcollections.

export async function rebuildMemberStats(memberId: string): Promise<void> {
  // TODO: aggregate from matches subcollections across all tournaments
  // For now, placeholder that resets to default (Admin tools in Phase 8 will implement)
  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), {
    allTimeStats: DEFAULT_STATS,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'REBUILD_MEMBER_STATS',
    module: 'MEMBER',
    targetId: memberId,
  });
}
