import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
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
    const unsub = onSnapshot(collection(db, "studyRooms"), (snap) => {
      setRooms(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserDoc(snap.data());
      }
    });

    return () => {
      unsub();
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
          <p className="text-center text-gray-400">
            No rooms available right now. Please check back later.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((room, i) => (
              <RoomCard
                key={room.id}
                room={room}
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

function RoomCard({ room, user, userDoc, index }) {
  const [popup, setPopup] = useState("");
  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registered, setRegistered] = useState(false);

  const eventTime = new Date(`${room.date}T${room.time}`);
  const now = new Date();
  const diffMs = eventTime - now;
  const diffMin = Math.floor(diffMs / 1000 / 60);

  let status = "Upcoming";
  if (diffMin <= 5 && diffMin > -120) status = "Live";
  if (diffMin <= -120) status = "Ended";

  const planLimits = { safalta: 8, shikhar: 20, samarpan: 60 };
  const plan = userDoc?.plan || "lakshya";
  const maxRooms = planLimits[plan] || 1;
  const usedRooms = userDoc?.usedRooms || 0;
  const roomsLeft = maxRooms - usedRooms;

  useEffect(() => {
    if (!user) return;
    const checkRegistration = async () => {
      const ref = doc(db, "users", user.uid, "registrations", room.id);
      const snap = await getDoc(ref);
      if (snap.exists()) setRegistered(true);
    };
    checkRegistration();
  }, [user, room.id]);

  const handleRegisterClick = () => {
    if (!user) {
      setPopup("⚠️ Please login to register.");
      return;
    }
    setStep(1);
  };

  const confirmRegister = () => {
    if (roomsLeft <= 0) {
      setPopup("❌ You have reached your plan limit.");
      return;
    }
    setStep(2);
  };

  const finalizeRegister = async () => {
    try {
      await setDoc(doc(db, "users", user.uid, "registrations", room.id), {
        roomId: room.id,
        title: room.title,
        registeredAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", user.uid),
        { usedRooms: increment(1) },
        { merge: true }
      );

      await setDoc(doc(db, "registrations", `${room.id}_${user.uid}`), {
        roomId: room.id,
        uid: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email,
        registeredAt: serverTimestamp(),
      });

      setRegistered(true);
      setStep(0);
      setPopup("✅ You have successfully registered for this room.");
    } catch (err) {
      setPopup("❌ " + err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="relative bg-[#0d1117] border border-[#00c3ff33] rounded-2xl 
                 shadow-[0_0_12px_#00c3ff22] hover:shadow-[0_0_20px_#00c3ff44] 
                 transition overflow-hidden flex flex-col min-h-[340px]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00c3ff] to-[#007bbd] p-5 text-black font-semibold flex items-center justify-between">
        <h2 className="text-lg font-bold truncate">{room.title}</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
        <p className="text-sm text-gray-300 mb-4 line-clamp-4">{room.description}</p>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <Calendar size={16} /> {room.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={16} /> {room.time}
          </span>
        </div>

        {/* Buttons */}
        {status === "Upcoming" && !registered && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRegisterClick}
            className="w-full py-3 rounded-xl bg-[#00c3ff] text-black font-semibold shadow-[0_0_10px_#00c3ff66] hover:brightness-110 transition"
          >
            Register
          </motion.button>
        )}

        {status === "Upcoming" && registered && (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-600 text-gray-300 cursor-not-allowed"
          >
            Link active 5 mins before start
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

        {/* Step Popups */}
        {step === 1 && (
          <div className="mt-4 p-4 border border-[#00c3ff33] rounded-lg bg-[#0a0f1a] text-sm text-gray-200">
            Are you sure you want to register? <br />
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
              <li>Be calm and respectful</li>
              <li>Violation = removal + 5 rooms deducted</li>
            </ul>
            <label className="flex items-center gap-2 mt-3 text-xs">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I agree to the terms & conditions
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
                Confirm & Register
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

        {/* Popup */}
        {popup && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-4 text-sm text-green-400 flex items-center gap-1"
          >
            <CheckCircle size={14} /> {popup}
          </motion.p>
        )}
      </div>

      {/* Footer countdown */}
      {status === "Upcoming" && (
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle size={12} /> Starts at {room.time}
        </div>
      )}
    </motion.div>
  );
}
