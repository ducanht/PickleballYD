import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";

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

const MEMBERS = [
  { id: "mem_01", fullName: "Đỗ Bá Tùng", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_02", fullName: "Đỗ Bá Việt", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_03", fullName: "Lê Anh Tuấn", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_04", fullName: "Lê Thị Nga", gender: "FEMALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_05", fullName: "Lê Văn Sơn", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_06", fullName: "Nguyễn Anh Phúc", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_07", fullName: "Trịnh Hồng Xuân", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_08", fullName: "Vũ Ngọc Thuận", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_09", fullName: "Nguyễn Thị Hạnh", gender: "FEMALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_10", fullName: "Dương Văn Tĩnh", gender: "MALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_11", fullName: "Hoàng Anh Trung", gender: "MALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_12", fullName: "Nguyễn Sinh Thành", gender: "MALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_13", fullName: "Phan Văn Tuấn", gender: "MALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_14", fullName: "Trịnh Thị Hiền", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_15", fullName: "Trịnh Thị Mạnh", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_16", fullName: "Trịnh Thị Ngân", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_17", fullName: "Trịnh Văn Triệu", gender: "MALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_18", fullName: "Phạm Văn Huynh", gender: "MALE", school: "YD3", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 3 (K98-01)" },
  { id: "mem_19", fullName: "Lê Minh Thảo", gender: "MALE", school: "YD3", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 3 (K98-01)" },
  { id: "mem_20", fullName: "Đào Văn Chung", gender: "MALE", school: "YD1", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 1 (K98-01)" },
  { id: "mem_21", fullName: "Lê Thị Thiện", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_22", fullName: "Phạm Thị Hoa", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
  { id: "mem_23", fullName: "Trịnh Thị Luyến", gender: "FEMALE", school: "YD2", phone: "", status: "ACTIVE", note: "Cựu học sinh THPT Yên Định 2 (K98-01)" },
];

async function runSeed() {
  console.log("🚀 Dang nap 23 VDV vao Cloud Firestore that project: yendinhk9801...");
  const now = new Date();
  
  for (const m of MEMBERS) {
    const docRef = doc(db, "members", m.id);
    await setDoc(docRef, {
      ...m,
      avatarUrl: null,
      allTimeStats: {
        tournamentsPlayed: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        pointsWon: 0,
        pointsLost: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
    console.log(` ✅ Da nap: ${m.fullName} (${m.school} - ${m.gender})`);
  }

  console.log("🔍 Kiem tra doc lai tu Firestore...");
  const snap = await getDocs(collection(db, "members"));
  console.log(`🎉 THANH CONG! Tong so VDV hien co tren Firestore: ${snap.docs.length}`);
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Loi nap Firestore:", err);
  process.exit(1);
});
