// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCgAL-0D8Pcj35vGpeyUayJMwy5j-ujmK8",
  authDomain: "upsc-platform-27338.firebaseapp.com",
  projectId: "upsc-platform-27338",
  storageBucket: "upsc-platform-27338.firebasestorage.app", // ✅ FIXED
  messagingSenderId: "495441342807",
  appId: "1:495441342807:web:402a3cfa633dd2c12e8e12",
  measurementId: "G-2KD0K98K94",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149073.png";

// ✅ export app itself for flexibility
export { app };
