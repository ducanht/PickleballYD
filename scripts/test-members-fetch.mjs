import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWH7P6YUUz1d63Kmf5rUsIOkFrXhlzmlo",
  authDomain: "yendinhk9801.firebaseapp.com",
  projectId: "yendinhk9801",
  storageBucket: "yendinhk9801.firebasestorage.app",
  messagingSenderId: "104861414799",
  appId: "1:104861414799:web:633d01a637cff7c71b47fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetchMembers() {
  console.log("=== KIỂM THỬ TRUY VẤN DANH SÁCH THÀNH VIÊN ===");
  const colRef = collection(db, "members");
  const snap = await getDocs(colRef);
  let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`✅ Tổng số thành viên tải từ Firestore: ${list.length}`);
  
  // Filter & Sort
  list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));

  console.log("--- 5 VĐV đầu tiên sau khi sắp xếp tiếng Việt ---");
  list.slice(0, 5).forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.fullName} (${m.gender}, ${m.school}, SĐT: ${m.phone || '—'})`);
  });

  const yd1 = list.filter(m => m.school === "THPT Yên Định 1").length;
  const yd2 = list.filter(m => m.school === "THPT Yên Định 2").length;
  const yd3 = list.filter(m => m.school === "THPT Yên Định 3").length;
  console.log(`\nPhân bổ theo trường:`);
  console.log(`• Yên Định 1: ${yd1} VĐV`);
  console.log(`• Yên Định 2: ${yd2} VĐV`);
  console.log(`• Yên Định 3: ${yd3} VĐV`);
  console.log(`Tổng cộng: ${yd1 + yd2 + yd3} VĐV`);
}

testFetchMembers().then(() => process.exit(0)).catch(e => {
  console.error("Lỗi:", e);
  process.exit(1);
});
