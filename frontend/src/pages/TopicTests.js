// src/pages/TopicTests.js
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Icons
const images = {
  prelims: "https://img.icons8.com/color/96/book.png",
  csat: "https://img.icons8.com/color/96/brain.png",
  mains: "https://img.icons8.com/color/96/ball-point-pen.png",
};

// Subscription plan limits
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

  // Listen to auth + user plan
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

  // Helper: remaining tests
  const getRemaining = (type) => {
    const limit = PLAN_LIMITS[plan]?.[type];
    if (limit === undefined) return 0;
    if (limit === Infinity) return "Unlimited";
    return Math.max(0, limit - (testsTaken[type] || 0));
  };

  // Click on "Attempt Test" -> open confirm
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

  // Proceed from confirm modal
  const startTest = (type) => {
    setConfirmTest(null);

    // Plan-limit check
    const limit = PLAN_LIMITS[plan]?.[type];
    const taken = testsTaken[type] || 0;
    if (limit !== Infinity && taken >= limit) {
      alert(`You have reached your ${plan} plan limit for ${type} tests.`);
      return;
    }

    // 🔥 Update counter locally
    setTestsTaken((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));

    if (type === "prelims") {
      navigate("/prelims-tests");
    } else if (type === "csat") {
      navigate("/csat-tests"); // ✅ create CsatTests page
    } else if (type === "mains") {
      navigate("/mains-tab");  // ✅ correct file/page for Mains
    }
  };

  const cards = [
    {
      key: "prelims",
      title: "Prelims",
      desc: "Objective questions to test your basics.",
    },
    {
      key: "csat",
      title: "CSAT",
      desc: "Aptitude, reasoning, and comprehension practice.",
    },
    {
      key: "mains",
      title: "Mains",
      desc: "Answer writing, essays, and descriptive tests.",
    },
  ];

  return (
    <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-6">
        Topic-wise Tests
      </h1>

      {!user ? (
        <p className="text-center text-gray-500">Please login to access tests.</p>
      ) : !["safalta", "shikhar", "samarpan"].includes(plan) ? (
        <p className="text-center text-gray-500">
          Upgrade your plan to Safalta, Shikhar, or Samarpan to unlock topic
          tests.
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
                className="relative rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 group"
              >
                {/* Image + Title */}
                <div className="p-6 text-center">
                  <img
                    src={images[c.key]}
                    alt={c.title}
                    className="w-20 h-20 mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {c.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {c.desc}
                  </p>
                </div>

                {/* Stats */}
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tests Taken: <span className="font-semibold">{taken}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tests Left:{" "}
                    <span className="font-semibold">{remaining}</span>
                  </p>
                  {limit === Infinity ? (
                    <p className="text-xs text-green-500 font-semibold">
                      Unlimited access 🚀
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      (Plan limit: {limit})
                    </p>
                  )}
                </div>

                {/* Button */}
                <div className="px-6 pb-6 text-center">
                  <button
                    onClick={() => handleConfirm(c.key)}
                    className="px-5 py-2 bg-[#0090DE] text-white rounded-lg hover:bg-[#007bbd] transition"
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
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Do you want to proceed?
              </h3>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setConfirmTest(null)}
                  className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startTest(confirmTest)}
                  className="px-5 py-2 rounded-lg bg-[#0090DE] text-white hover:bg-[#007bbd] transition"
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
