// src/pages/StudyRoom.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Calendar, Clock, Video, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function StudyRoom() {
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);

  useEffect(() => {
    // live listen to study rooms
    const unsubRooms = onSnapshot(collection(db, "studyRooms"), (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // listen to auth state & user doc
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setUserDoc(snap.data());
        });
        u._unsubUserDoc = unsubUser;
      } else {
        setUserDoc(null);
      }
    });

    return () => {
      unsubRooms();
      unsubAuth();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0f1a] to-black py-12 px-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold text-center text-[#00c3ff] drop-shadow-[0_0_8px_#00c3ff66] mb-12"
        >
          Live Study Rooms
        </motion.h1>

        {rooms.length === 0 ? (
          <p className="text-center text-gray-400">No rooms available.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((r, i) => (
              <RoomCard
                key={r.id}
                room={r}
                user={user}
                userDoc={userDoc}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------ ROOM CARD -------------------- */
function RoomCard({ room, user, userDoc, index }) {
  const [popup, setPopup] = useState("");
  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Calculate room status
  const eventTime = new Date(`${room.date}T${room.time}`);
  const now = new Date();
  const diffMin = Math.floor((eventTime - now) / 60000);
  const status =
    diffMin <= -120 ? "Ended" : diffMin <= 5 ? "Live" : "Upcoming";

  const planLimits = { safalta: 8, shikhar: 20, samarpan: 60 };
  const plan = userDoc?.plan?.toLowerCase() || "lakshya";
  const maxRooms = userDoc?.maxRooms || planLimits[plan] || 0;
  const roomsLeft = userDoc?.roomsLeft ?? 0;

  // local participant state
  const totalSlots = Number(room.maxParticipants) || 8;
  const [localCurrent, setLocalCurrent] = useState(
    Number(room.currentParticipants) || 0
  );

  useEffect(() => {
    setLocalCurrent(Number(room.currentParticipants) || 0);
  }, [room.currentParticipants]);

  const isFull = localCurrent >= totalSlots;

  // check if user already registered
  useEffect(() => {
    if (!user) return setRegistered(false);
    if (!room?.id) return;
    const check = async () => {
      const ref = doc(db, "users", user.uid, "registrations", room.id);
      const snap = await getDoc(ref);
      setRegistered(snap.exists());
    };
    check();
  }, [user, room.id]);

  /* ---------- Registration ---------- */
  const handleRegisterClick = () => {
    if (!user) return setPopup("⚠️ Please login first.");
    if (roomsLeft <= 0)
      return setPopup("❌ No rooms left in your plan.");
    setStep(1);
  };

  const confirmRegister = () => {
    if (roomsLeft <= 0) return setPopup("❌ Plan limit reached.");
    if (isFull) return setPopup("❌ Group full.");
    setStep(2);
  };

  const finalizeRegister = async () => {
    if (!room?.id || !user?.uid) {
      console.error("❌ Missing IDs:", { room, user });
      setPopup("⚠️ Could not register — try again.");
      return;
    }

    try {
      // save user registration
      await setDoc(
        doc(db, "users", user.uid, "registrations", room.id),
        {
          roomId: room.id,
          title: room.title || "Untitled Room",
          registeredAt: serverTimestamp(),
        },
        { merge: true }
      );

      // global registration for admin view
      await setDoc(
        doc(db, "registrations", `${room.id}_${user.uid}`),
        {
          roomId: room.id,
          uid: user.uid,
          name: user.displayName || userDoc?.name || "Anonymous",
          email: user.email || userDoc?.email || "",
          title: room.title || "",
          date: room.date || "",
          time: room.time || "",
          link: room.link || "",
          registeredAt: serverTimestamp(),
        },
        { merge: true }
      );

      // update counts
      await setDoc(
        doc(db, "studyRooms", room.id),
        { currentParticipants: increment(1) },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", user.uid),
        { roomsLeft: increment(-1) },
        { merge: true }
      );

      // update local UI
      setLocalCurrent((c) => c + 1);
      setRegistered(true);
      setPopup("✅ Registered successfully.");
      setStep(0);
    } catch (err) {
      console.error("🔥 Registration error:", err);
      setPopup("❌ " + (err.message || "Registration failed"));
    }
  };

  /* ---------- Unenroll ---------- */
  const handleUnenroll = async () => {
    if (!room?.id || !user?.uid) return setPopup("⚠️ Invalid operation.");

    try {
      await deleteDoc(doc(db, "users", user.uid, "registrations", room.id));
      await deleteDoc(doc(db, "registrations", `${room.id}_${user.uid}`));

      await setDoc(
        doc(db, "studyRooms", room.id),
        { currentParticipants: increment(-1) },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", user.uid),
        { roomsLeft: increment(1) },
        { merge: true }
      );

      setLocalCurrent((c) => Math.max(c - 1, 0));
      setRegistered(false);
      setPopup("❎ You have unenrolled.");
    } catch (err) {
      console.error("🔥 Unenroll error:", err);
      setPopup("❌ " + (err.message || "Unenroll failed"));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="relative bg-[#0d1117] border border-[#00c3ff33] rounded-2xl shadow-[0_0_12px_#00c3ff22] hover:shadow-[0_0_20px_#00c3ff44] transition overflow-hidden flex flex-col min-h-[340px]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00c3ff] to-[#007bbd] p-5 text-black font-semibold">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold truncate">{room.title}</h2>
          <span className="text-sm bg-white/30 text-black px-2 py-0.5 rounded-full">
            {String(localCurrent).padStart(2, "0")}/
            {String(totalSlots).padStart(2, "0")}
          </span>
        </div>
        <span
          className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            status === "Upcoming"
              ? "bg-yellow-400 text-black"
              : status === "Live"
              ? "bg-green-500 text-white animate-pulse"
              : "bg-gray-500 text-white"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-sm text-gray-300 mb-4 line-clamp-4">
          {room.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <Calendar size={16} /> {room.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={16} /> {room.time}
          </span>
        </div>

        {/* Register / Unenroll buttons */}
        {status === "Upcoming" && !registered && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={!isFull ? handleRegisterClick : null}
            disabled={isFull}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              isFull
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-[#00c3ff] text-black shadow-[0_0_10px_#00c3ff66] hover:brightness-110"
            }`}
          >
            {isFull ? "Group Full" : "Register"}
          </motion.button>
        )}

        {status === "Upcoming" && registered && (
          <button
            onClick={handleUnenroll}
            className="w-full py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Unenroll
          </button>
        )}

        {status === "Live" && registered && (
          <a
            href={room.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-semibold hover:brightness-110 transition"
          >
            <Video size={18} /> Join Meeting
          </a>
        )}

        {status === "Ended" && (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-700 text-gray-400 cursor-not-allowed"
          >
            Room Ended
          </button>
        )}

        {/* Confirmation Steps */}
        {step === 1 && (
          <div className="mt-4 p-4 border border-[#00c3ff33] rounded-lg bg-[#0a0f1a] text-sm text-gray-200">
            Are you sure you want to register?<br />
            Rooms left: {roomsLeft}
            <div className="mt-3 flex gap-3">
              <button
                onClick={confirmRegister}
                className="px-4 py-2 rounded-lg bg-[#00c3ff] text-black"
              >
                Yes
              </button>
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 rounded-lg bg-gray-600 text-gray-200"
              >
                No
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 p-4 border border-[#00c3ff33] rounded-lg bg-[#0a0f1a] text-sm text-gray-200">
            <p className="font-medium mb-2">📜 Terms & Conditions</p>
            <ul className="list-disc ml-5 text-xs space-y-1 text-gray-400">
              <li>Obey instructor’s rules</li>
              <li>Be respectful</li>
              <li>Violation = removal + 5 rooms deducted</li>
            </ul>
            <label className="flex items-center gap-2 mt-3 text-xs">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I agree to the terms
            </label>
            <div className="mt-3 flex gap-3">
              <button
                disabled={!termsAccepted}
                onClick={finalizeRegister}
                className={`px-4 py-2 rounded-lg ${
                  termsAccepted
                    ? "bg-green-600 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 rounded-lg bg-gray-600 text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {popup && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-green-400 flex items-center gap-1"
          >
            <CheckCircle size={14} /> {popup}
          </motion.p>
        )}
      </div>

      {status === "Upcoming" && (
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle size={12} /> Starts at {room.time}
        </div>
      )}
    </motion.div>
  );
}
