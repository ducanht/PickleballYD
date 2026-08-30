/**
 * Firebase SDK initialization — SRS V6
 * Enables Firestore offline persistence per SRS §19
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ── Offline persistence (SRS §19, FR-OFF-001) ──────────────────────────────
// enableMultiTabIndexedDbPersistence supports multiple tabs simultaneously.
// This is intentional (multi-device scoring), with conflict handled per SRS §18.2.
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — fall back to single-tab persistence
    console.warn('[Firebase] Multiple tabs open. Offline persistence limited to one tab.');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support it
    console.warn('[Firebase] Offline persistence not supported in this browser.');
  }
});

// ── Firebase Emulator (dev only) ────────────────────────────────────────────
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('[Firebase] Using local emulators.');
}

// ── Collection path helpers ─────────────────────────────────────────────────
export const COLLECTIONS = {
  MEMBERS: 'members',
  USERS: 'users',
  FINANCES: 'finances',
  AUDIT_LOGS: 'auditLogs',
  TOURNAMENTS: 'tournaments',
  // Subcollections — call with tournamentId
  participants: (tournamentId: string) => `tournaments/${tournamentId}/participants`,
  teams: (tournamentId: string) => `tournaments/${tournamentId}/teams`,
  groups: (tournamentId: string) => `tournaments/${tournamentId}/groups`,
  matches: (tournamentId: string) => `tournaments/${tournamentId}/matches`,
  scoreHistory: (tournamentId: string, matchId: string) =>
    `tournaments/${tournamentId}/matches/${matchId}/scoreHistory`,
  draws: (tournamentId: string) => `tournaments/${tournamentId}/draws`,
  events: (tournamentId: string) => `tournaments/${tournamentId}/events`,
} as const;
