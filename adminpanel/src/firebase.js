import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔹 Your Firebase config (kept exactly as provided)
const firebaseConfig = {
  apiKey: "AIzaSyCgAL-0D8Pcj35vGpeyUayJMwy5j-ujmK8",
  authDomain: "upsc-platform-27338.firebaseapp.com",
  projectId: "upsc-platform-27338",
  storageBucket: "upsc-platform-27338.appspot.com",
  messagingSenderId: "495441342807",
  appId: "1:495441342807:web:402a3cfa633dd2c12e8e12",
  measurementId: "G-2KD0K98K94",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Core services for Admin Panel
export const auth = getAuth(app);       // For admin login (email/password)
export const db = getFirestore(app);    // For Firestore (studyRooms, users, etc.)

// ✅ Default avatar (if needed)
export const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149073.png";

// ✅ Export app for flexibility
export { app };
