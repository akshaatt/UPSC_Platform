// src/pages/TopicTests.js
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";
import { FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Example images
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
  const [testsTaken, setTestsTaken] = useState({ prelims: 0, csat: 0, mains: 0 });
  const [popup, setPopup] = useState({ show: false, message: "" });
  const [confirmTest, setConfirmTest] = useState(null);

  const navigate = useNavigate();

  // Listen to auth + user plan
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setPlan(snap.data().plan || "lakshya");
        });

        const testsRef = doc(db, "testsProgress", u.uid);
        const unsubTests = onSnapshot(testsRef, (snap) => {
          if (snap.exists()) setTestsTaken(snap.data());
        });

        return () => {
          unsubUser();
          unsubTests();
        };
      } else {
        setPlan("lakshya");
        setTestsTaken({ prelims: 0, csat: 0, mains: 0 });
      }
    });
    return () => unsub();
  }, []);

  // Helper: remaining tests
  const getRemaining = (type) => {
    const limit = PLAN_LIMITS[plan]?.[type];
    if (!limit) return 0;
    if (limit === Infinity) return "Unlimited";
    return Math.max(0, limit - (testsTaken[type] || 0));
  };

  // Confirm before starting
  const handleConfirm = (type) => {
    if (!user) {
      setPopup({ show: true, message: "Please log in to attempt tests." });
      return;
    }
    if (plan === "lakshya") {
      setPopup({
        show: true,
        message: "Upgrade to Safalta, Shikhar, or Samarpan to unlock tests.",
      });
      return;
    }
    setConfirmTest(type);
  };

  // Start the test after confirmation
  const startTest = async (type) => {
    setConfirmTest(null);
    const limit = PLAN_LIMITS[plan]?.[type];
    const taken = testsTaken[type] || 0;

    if (limit !== Infinity && taken >= limit) {
      setPopup({
        show: true,
        message: `You have reached your ${plan} plan limit for ${type} tests.`,
      });
      return;
    }

    try {
      const ref = doc(db, "testsProgress", user.uid);
      await setDoc(ref, { [type]: increment(1) }, { merge: true });

      if (type === "prelims") {
        // 👉 Redirect to subject-wise prelims page
        navigate("/prelims-tests");
      } else {
        setPopup({ show: true, message: `✅ Your ${type} test has started. Good luck!` });
      }
    } catch (err) {
      console.error("Error updating tests:", err);
      setPopup({ show: true, message: "Something went wrong. Please try again." });
    }
  };

  const cards = [
    { key: "prelims", title: "Prelims", desc: "Objective questions to test your basics." },
    { key: "csat", title: "CSAT", desc: "Aptitude, reasoning, and comprehension practice." },
    { key: "mains", title: "Mains", desc: "Answer writing, essays, and descriptive tests." },
  ];

  return (
    <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-6">
        Topic-wise Tests
      </h1>

      {/* ⚠️ Warning */}
      <div className="max-w-3xl mx-auto mb-10 flex items-center gap-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 px-4 py-3 rounded-lg shadow">
        <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400" />
        <p className="text-sm">
          Only click <strong>“Attempt Test”</strong> when you are fully ready. Your test count will
          decrease whether you complete it or not.
        </p>
      </div>

      {!user ? (
        <p className="text-center text-gray-500">Please login to access tests.</p>
      ) : plan === "lakshya" ? (
        <p className="text-center text-gray-500">
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
                className="relative rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 group"
              >
                {/* Image + Title */}
                <div className="p-6 text-center">
                  <img src={images[c.key]} alt={c.title} className="w-20 h-20 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{c.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{c.desc}</p>
                </div>

                {/* Stats */}
                <div className="px-6 pb-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tests Taken: <span className="font-semibold">{taken}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tests Left: <span className="font-semibold">{remaining}</span>
                  </p>
                  {limit !== Infinity && <p className="text-xs text-gray-500">(Plan limit: {limit})</p>}
                  {limit === Infinity && (
                    <p className="text-xs text-green-500 font-semibold">Unlimited access 🚀</p>
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
              <FaExclamationTriangle className="mx-auto text-yellow-500 mb-3" size={48} />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ready to Start?</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Starting this <b>{confirmTest}</b> test will reduce your available count, whether you
                finish it or not. Do you want to continue?
              </p>
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
                  Yes, Start Test 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Popup */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopup({ show: false, message: "" })}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-sm text-center"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Notice</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{popup.message}</p>
              <button
                onClick={() => setPopup({ show: false, message: "" })}
                className="mt-2 px-5 py-2 bg-[#0090DE] text-white rounded-lg hover:bg-[#007bbd] transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
