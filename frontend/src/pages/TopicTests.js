// src/pages/TopicTests.js
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const images = {
  prelims: "https://img.icons8.com/color/96/book.png",
  csat: "https://img.icons8.com/color/96/brain.png",
  mains: "https://img.icons8.com/color/96/ball-point-pen.png",
};

const PLAN_LIMITS = {
  safalta: { prelims: 20, csat: 10, mains: 5 },
  shikhar: { prelims: 100, csat: 50, mains: 25 },
  samarpan: { prelims: Infinity, csat: Infinity, mains: Infinity },
};

export default function TopicTests() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("lakshya");
  const [testsTaken, setTestsTaken] = useState({
    prelims: 0,
    csat: 0,
    mains: 0,
  });
  const [confirmTest, setConfirmTest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) setPlan(snap.data().plan || "lakshya");
          else setPlan("lakshya");
        });
      } else {
        setPlan("lakshya");
        setTestsTaken({ prelims: 0, csat: 0, mains: 0 });
      }
    });

    return () => unsubAuth();
  }, []);

  const getRemaining = (type) => {
    const limit = PLAN_LIMITS[plan]?.[type];
    if (limit === undefined) return 0;
    if (limit === Infinity) return "Unlimited";
    return Math.max(0, limit - (testsTaken[type] || 0));
  };

  const handleConfirm = (type) => {
    if (!user) {
      alert("Please log in to attempt tests.");
      return;
    }
    if (!["safalta", "shikhar", "samarpan"].includes(plan)) {
      alert("Upgrade to Safalta, Shikhar, or Samarpan to unlock topic tests.");
      return;
    }
    setConfirmTest(type);
  };

  const startTest = (type) => {
    setConfirmTest(null);
    const limit = PLAN_LIMITS[plan]?.[type];
    const taken = testsTaken[type] || 0;
    if (limit !== Infinity && taken >= limit) {
      alert(`You have reached your ${plan} plan limit for ${type} tests.`);
      return;
    }
    setTestsTaken((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    if (type === "prelims") navigate("/prelims-tests");
    else if (type === "csat") navigate("/csat-tests");
    else if (type === "mains") navigate("/mains-tab");
  };

  const cards = [
    { key: "prelims", title: "Prelims", desc: "Objective questions to test your basics." },
    { key: "csat", title: "CSAT", desc: "Aptitude and comprehension practice." },
    { key: "mains", title: "Mains", desc: "Answer writing, essays, and descriptive tests." },
  ];

  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-extrabold text-center mb-10 text-[#00c3ff] drop-shadow-[0_0_10px_#00c3ff]">
        Topic-wise Tests
      </h1>

      {!user ? (
        <p className="text-center text-gray-400">Please login to access tests.</p>
      ) : !["safalta", "shikhar", "samarpan"].includes(plan) ? (
        <p className="text-center text-gray-400">
          Upgrade your plan to Safalta, Shikhar, or Samarpan to unlock topic tests.
        </p>
      ) : (
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {cards.map((c, i) => {
            const taken = testsTaken[c.key] || 0;
            const remaining = getRemaining(c.key);
            const limit = PLAN_LIMITS[plan]?.[c.key];

            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative rounded-2xl shadow-[0_0_20px_#00c3ff44] border border-[#00c3ff33] 
                           bg-gradient-to-b from-[#0a0a0a] via-[#111827] to-[#0a0a0a] overflow-hidden"
              >
                {/* Image + Title */}
                <div className="p-6 text-center">
                  <img src={images[c.key]} alt={c.title} className="w-20 h-20 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-[#00c3ff] drop-shadow-[0_0_6px_#00c3ff] mb-2">
                    {c.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">{c.desc}</p>
                </div>

                {/* Stats */}
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-gray-300">
                    Tests Taken: <span className="font-semibold text-[#00eaff]">{taken}</span>
                  </p>
                  <p className="text-sm text-gray-300">
                    Tests Left: <span className="font-semibold text-[#00eaff]">{remaining}</span>
                  </p>
                  {limit === Infinity ? (
                    <p className="text-xs text-green-400 font-semibold">Unlimited access 🚀</p>
                  ) : (
                    <p className="text-xs text-gray-400">(Plan limit: {limit})</p>
                  )}
                </div>

                {/* Button */}
                <div className="px-6 pb-6 text-center">
                  <button
                    onClick={() => handleConfirm(c.key)}
                    className="px-5 py-2 rounded-lg bg-[#00c3ff] text-black font-bold 
                               shadow-[0_0_12px_#00c3ff] hover:brightness-110 transition"
                  >
                    Attempt Test →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmTest && (
          <motion.div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0a0a0a] border border-[#00c3ff44] text-white 
                         rounded-2xl shadow-[0_0_25px_#00c3ff88] p-8 max-w-md text-center"
            >
              <h3 className="text-xl font-bold text-[#00c3ff] drop-shadow-[0_0_8px_#00c3ff] mb-4">
                Do you want to proceed?
              </h3>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setConfirmTest(null)}
                  className="px-5 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startTest(confirmTest)}
                  className="px-5 py-2 rounded-lg bg-[#00c3ff] text-black font-bold 
                             shadow-[0_0_12px_#00c3ff] hover:brightness-110 transition"
                >
                  Proceed 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
