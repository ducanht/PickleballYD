/**
 * Finance Service — SRS V6 §5
 * Immutable ledger: CONFIRMED transactions never deleted, only VOID.
 * All operations write audit log.
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, COLLECTIONS } from '../../api/firebase';
import { auth } from '../../api/firebase';
import { writeAudit } from '../tournaments/auditService';
import type {
  Finance,
  FinanceSummary,
  FinanceType,
  FinanceStatus,
} from '../../types';

// createdBy is set internally by the service; callers don't provide it
type FinanceCreateInput = Omit<Finance,
  'id' | 'status' | 'voidReason' | 'voidedBy' | 'voidedAt' |
  'timestamp' | 'createdBy' | 'updatedAt'
>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function docToFinance(id: string, data: DocumentData): Finance {
  return { id, ...data } as Finance;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export interface FinanceFilter {
  type?: FinanceType;
  year?: number;
  tournamentId?: string;
  status?: FinanceStatus;
}

export async function getTransactions(filter: FinanceFilter = {}): Promise<Finance[]> {
  const colRef = collection(db, COLLECTIONS.FINANCES);
  const conditions: Parameters<typeof query>[1][] = [];

  if (filter.type) conditions.push(where('type', '==', filter.type));
  if (filter.year) conditions.push(where('year', '==', filter.year));
  if (filter.tournamentId) conditions.push(where('tournamentId', '==', filter.tournamentId));
  if (filter.status) conditions.push(where('status', '==', filter.status));

  conditions.push(orderBy('timestamp', 'desc'));

  const q = conditions.length > 0
    ? query(colRef, ...conditions) as Query<DocumentData>
    : query(colRef, orderBy('timestamp', 'desc'));

  const snap = await getDocs(q);
  return snap.docs.map((d) => docToFinance(d.id, d.data()));
}

// ── Finance summary (SRS §5.1) ────────────────────────────────────────────────
// Balance = total CONFIRMED IN - total CONFIRMED OUT
export async function getFinanceSummary(filter: Omit<FinanceFilter, 'type' | 'status'> = {}): Promise<FinanceSummary> {
  const transactions = await getTransactions({ ...filter, status: 'CONFIRMED' });

  let totalIn = 0;
  let totalOut = 0;

  for (const t of transactions) {
    if (t.type === 'IN') totalIn += t.amount;
    else totalOut += t.amount;
  }

  return { totalIn, totalOut, balance: totalIn - totalOut };
}

// ── Create transaction — SRS §5.2 ─────────────────────────────────────────────
export async function createTransaction(input: FinanceCreateInput): Promise<string> {
  if (input.amount <= 0) throw new Error('Số tiền phải lớn hơn 0.');

  const user = auth.currentUser;
  const now = serverTimestamp();

  const ref_ = await addDoc(collection(db, COLLECTIONS.FINANCES), {
    ...input,
    status: 'CONFIRMED',
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    timestamp: now,
    createdBy: user?.uid ?? 'unknown',
    updatedAt: now,
    year: input.year ?? new Date().getFullYear(),
  });

  await writeAudit({
    action: 'CREATE_FINANCE',
    module: 'FINANCE',
    targetId: ref_.id,
    tournamentId: input.tournamentId ?? null,
    after: { type: input.type, amount: input.amount, description: input.description },
  });

  return ref_.id;
}

// ── Update (only CONFIRMED, not VOID) ────────────────────────────────────────
export async function updateTransaction(
  financeId: string,
  updates: Partial<Pick<Finance, 'description' | 'category' | 'receiptUrl'>>
): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTIONS.FINANCES, financeId));
  if (!snap.exists()) throw new Error('Giao dịch không tồn tại.');
  const data = snap.data() as Finance;
  if (data.status === 'VOID') throw new Error('Không thể sửa giao dịch đã VOID.');

  await updateDoc(doc(db, COLLECTIONS.FINANCES, financeId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'UPDATE_FINANCE',
    module: 'FINANCE',
    targetId: financeId,
    before: { description: data.description, category: data.category },
    after: updates as Record<string, unknown>,
  });
}

// ── VOID transaction — SRS §5.3, BR-009 ─────────────────────────────────────
// CONFIRMED → VOID only. Never physical delete.
export async function voidTransaction(financeId: string, reason: string): Promise<void> {
  if (!reason.trim()) throw new Error('Lý do VOID không được để trống.');

  const snap = await getDoc(doc(db, COLLECTIONS.FINANCES, financeId));
  if (!snap.exists()) throw new Error('Giao dịch không tồn tại.');
  const data = snap.data() as Finance;
  if (data.status === 'VOID') throw new Error('Giao dịch đã bị VOID trước đó.');

  const user = auth.currentUser;

  await updateDoc(doc(db, COLLECTIONS.FINANCES, financeId), {
    status: 'VOID',
    voidReason: reason.trim(),
    voidedBy: user?.uid ?? 'unknown',
    voidedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    action: 'VOID_FINANCE',
    module: 'FINANCE',
    targetId: financeId,
    before: { status: 'CONFIRMED', amount: data.amount, type: data.type },
    after: { status: 'VOID', voidReason: reason },
  });
}

// ── Upload receipt to Firebase Storage ───────────────────────────────────────
export async function uploadReceipt(financeId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `receipts/${financeId}/${file.name}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, COLLECTIONS.FINANCES, financeId), {
    receiptUrl: url,
    updatedAt: serverTimestamp(),
  });

  return url;
}

// ── Finance categories ────────────────────────────────────────────────────────
export const FINANCE_CATEGORIES_IN = [
  'Lệ phí thành viên',
  'Tài trợ',
  'Phí đăng ký giải',
  'Thu khác',
];

export const FINANCE_CATEGORIES_OUT = [
  'Thuê sân',
  'Giải thưởng',
  'In ấn / Văn phòng phẩm',
  'Ăn uống / Tiệc',
  'Thiết bị / Dụng cụ',
  'Chi khác',
];
