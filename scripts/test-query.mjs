import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, orderBy, getDocs } from "firebase/firestore";

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

async function testQuery() {
  console.log("--- 1. Testing simple getDocs on members ---");
  const snap1 = await getDocs(collection(db, "members"));
  console.log("Simple getDocs count:", snap1.docs.length);

  console.log("--- 2. Testing where + orderBy on members ---");
  try {
    const q2 = query(collection(db, "members"), where("status", "==", "ACTIVE"), orderBy("fullName", "asc"));
    const snap2 = await getDocs(q2);
    console.log("where+orderBy count:", snap2.docs.length);
  } catch (err) {
    console.error("❌ ERROR on where+orderBy query:", err.message);
  }
}

testQuery().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
