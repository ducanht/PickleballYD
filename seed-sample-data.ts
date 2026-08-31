/**
 * Script to automatically seed sample data into Firebase Firestore
 * Run with: npx tsx seed-sample-data.ts
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWH7P6YUUz1d63Kmf5rUsIOkFrXhlzmlo",
  authDomain: "yendinhk9801.firebaseapp.com",
  projectId: "yendinhk9801",
  storageBucket: "yendinhk9801.firebasestorage.app",
  messagingSenderId: "104861414799",
  appId: "1:104861414799:web:633d01a637cff7c71b47fa",
  measurementId: "G-FJVTQNRFTT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log('🌱 Seeding initial data to Firebase Firestore yendinhk9801...');

  // 1. Seed Members
  const sampleMembers = [
    { id: 'mb-01', fullName: 'Nguyễn Văn Hùng', nickname: 'Hùng K98', phone: '0981112233', highSchool: 'Yên Định 1', graduationYear: 2001, gender: 'MALE', active: true },
    { id: 'mb-02', fullName: 'Trần Thị Mai', nickname: 'Mai Tennis', phone: '0982223344', highSchool: 'Yên Định 1', graduationYear: 2001, gender: 'FEMALE', active: true },
    { id: 'mb-03', fullName: 'Lê Văn Tuấn', nickname: 'Tuấn Đập', phone: '0983334455', highSchool: 'Yên Định 2', graduationYear: 2000, gender: 'MALE', active: true },
    { id: 'mb-04', fullName: 'Phạm Thị Lan', nickname: 'Lan Tốc Độ', phone: '0984445566', highSchool: 'Yên Định 2', graduationYear: 2001, gender: 'FEMALE', active: true },
    { id: 'mb-05', fullName: 'Hoàng Minh Đức', nickname: 'Đức Xoáy', phone: '0985556677', highSchool: 'Yên Định 3', graduationYear: 1999, gender: 'MALE', active: true },
    { id: 'mb-06', fullName: 'Vũ Thị Hoa', nickname: 'Hoa Bền', phone: '0986667788', highSchool: 'Yên Định 3', graduationYear: 2001, gender: 'FEMALE', active: true },
    { id: 'mb-07', fullName: 'Đỗ Văn Cường', nickname: 'Cường Lưới', phone: '0987778899', highSchool: 'Yên Định 1', graduationYear: 1998, gender: 'MALE', active: true },
    { id: 'mb-08', fullName: 'Bùi Thị Dung', nickname: 'Dung Smash', phone: '0988889900', highSchool: 'Yên Định 1', graduationYear: 2001, gender: 'FEMALE', active: true },
  ];

  for (const m of sampleMembers) {
    await setDoc(doc(db, 'members', m.id), {
      ...m,
      stats: { tournamentsPlayed: 1, matchesPlayed: 4, wins: 3, losses: 1, pointsWon: 42, pointsLost: 28 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log('✅ Seeded 8 members successfully.');

  // 2. Seed Initial Tournament
  const tournamentId = 'giai-xuan-2026';
  await setDoc(doc(db, 'tournaments', tournamentId), {
    name: 'Giải Pickleball Hội Khóa Yên Định 1998-2001 Mở Rộng',
    format: 'FIXED_DOUBLES',
    status: 'ONGOING',
    startDate: Timestamp.now(),
    endDate: Timestamp.now(),
    venue: 'Sân Pickleball Trung Tâm Yên Định',
    config: {
      format: 'FIXED_DOUBLES',
      participants: { genderMode: 'MIXED', maxPlayers: 16 },
      groups: { numberOfGroups: 2, maxEntitiesPerGroup: 4, assignmentMode: 'RANDOM' },
      scoring: { matchFormat: 'SINGLE_GAME', pointsToWin: 11, winByTwo: true, maxPoints: 15 },
      ranking: { rules: ['MATCH_WINS', 'POINT_DIFFERENCE', 'POINTS_WON', 'HEAD_TO_HEAD'] },
      knockout: { enabled: true, qualifiersPerGroup: 2, pairingMode: 'FIXED_BRACKET', drawMode: 'RANDOM' },
      scheduling: { courts: 2, restBetweenMatches: 5 },
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Seeded Tournament: "Giải Pickleball Hội Khóa Yên Định 1998-2001 Mở Rộng".');

  // 3. Seed Finances
  const sampleFinances = [
    { id: 'fn-01', type: 'IN', category: 'Lệ phí giải đấu', amount: 5000000, description: 'Thu lệ phí giải đấu 10 cặp VĐV', status: 'CONFIRMED' },
    { id: 'fn-02', type: 'IN', category: 'Tài trợ', amount: 3000000, description: 'Tài trợ bóng và cúp lưu niệm', status: 'CONFIRMED' },
    { id: 'fn-03', type: 'OUT', category: 'Thuê sân bãi', amount: 2000000, description: 'Thuê cụm 2 sân 1 ngày thi đấu', status: 'CONFIRMED' },
    { id: 'fn-04', type: 'OUT', category: 'Nước uống & Hậu cần', amount: 800000, description: 'Nước điện giải và trái cây phục vụ VĐV', status: 'CONFIRMED' },
  ];

  for (const fn of sampleFinances) {
    await setDoc(doc(db, 'finances', fn.id), {
      ...fn,
      tournamentId,
      date: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log('✅ Seeded 4 Financial records.');

  console.log('\n🎉 ALL SEED DATA SUCCESSFULLY WRITTEN TO FIREBASE FIRESTORE!');
}

seedData().catch((err) => {
  console.error('❌ Error seeding data:', err);
});
