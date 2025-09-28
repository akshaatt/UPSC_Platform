// src/components/TestPreview.js
import React, { useEffect, useState } from "react";
import { questions } from "../data/questions";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";

function TestPreview() {
  const [user] = useAuthState(auth);
  const [randomQs, setRandomQs] = useState([]);
  const [selected, setSelected] = useState({});
  const [popup, setPopup] = useState({ show: false, message: "" });
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const navigate = useNavigate();

  // 🔹 Get user plan from Firestore
  useEffect(() => {
    if (!user) {
      setPlan(null);
      setLoadingPlan(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPlan(snap.data().plan || "lakshya");
      } else {
        setPlan("lakshya");
      }
      setLoadingPlan(false);
    });

    return () => unsub();
  }, [user]);

  // 🔹 Pick 3 random questions (re-runs each mount + on button refresh)
  const generateRandomQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setRandomQs(shuffled.slice(0, 3));
    setSelected({});
  };

  useEffect(() => {
    generateRandomQuestions();
  }, []);

  const handleSelect = (qid, optionIndex) => {
    setSelected((prev) => ({ ...prev, [qid]: optionIndex }));
  };

  const handleContinue = () => {
    if (!user) {
      setPopup({
        show: true,
        message: "Please log in to access chapter-wise / subject-wise tests.",
      });
      return;
    }

    if (loadingPlan) {
      setPopup({ show: true, message: "Checking your plan, please wait…" });
      return;
    }

    if (["safalta", "shikhar", "samarpan"].includes(plan)) {
      navigate("/topic-tests");
    } else {
      setPopup({
        show: true,
        message: "Upgrade to Safalta or higher to access all tests.",
      });
    }
  };

  return (
    <section className="mt-20 max-w-7xl mx-auto px-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">
        📝 Test Your Knowledge
      </h2>

      {/* 3 adjacent animated cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <AnimatePresence>
          {randomQs.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
              viewport={{ once: false, amount: 0.2 }}
              className="relative group rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="p-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {q.question}
                </p>

                <div className="space-y-3">
                  {q.options.map((opt, idx) => {
                    const isSelected = selected[q.id] === idx;
                    const isCorrect = q.answer === idx;
                    const showFeedback = selected[q.id] !== undefined;

                    let cls =
                      "w-full text-left px-4 py-2 rounded-lg border transition-all duration-300 ";
                    if (showFeedback) {
                      if (isSelected && isCorrect) {
                        cls += "bg-green-500 text-white border-green-600";
                      } else if (isSelected && !isCorrect) {
                        cls += "bg-red-500 text-white border-red-600";
                      } else if (isCorrect) {
                        cls += "bg-green-100 text-green-800 border-green-300";
                      } else {
                        cls += "bg-gray-100 dark:bg-gray-700";
                      }
                    } else {
                      cls +=
                        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600";
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelect(q.id, idx)}
                        className={cls}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* subtle glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition"
                style={{
                  background:
                    "radial-gradient(circle at 20% 0%, rgba(0,144,222,0.25), transparent 40%)",
                }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={generateRandomQuestions}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          Refresh Questions
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-[#0090DE] text-white rounded-lg font-semibold hover:bg-[#007bbd] transition"
        >
          Continue Chapter-wise / Subject-wise Tests →
        </button>
      </div>

      {/* Access popup */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-sm text-center"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                Access Restricted
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {popup.message}
              </p>
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
    </section>
  );
}

export default TestPreview;
