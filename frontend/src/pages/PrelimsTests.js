// src/pages/PrelimsTests.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";

const subjects = {
  History: {
    tabs: ["Ancient", "Medieval", "Modern", "World", "Complete"],
    total: { Ancient: 10, Medieval: 12, Modern: 8, World: 7, Complete: 20 },
    bg: "/images/history.jpg",
    icon: "/images/icons/history.png",
  },
  Geography: {
    tabs: ["Physical", "Human", "Indian", "World", "Complete"],
    total: { Physical: 10, Human: 6, Indian: 9, World: 7, Complete: 25 },
    bg: "/images/geography.jpg",
    icon: "/images/icons/geography.png",
  },
  Polity: {
    tabs: ["Constitution", "Governance", "Judiciary", "Parliament", "Complete"],
    total: { Constitution: 12, Governance: 8, Judiciary: 10, Parliament: 7, Complete: 30 },
    bg: "/images/polity.jpg",
    icon: "/images/icons/polity.png",
  },
  Economics: {
    tabs: ["Micro", "Macro", "Indian Economy", "Global Economy", "Complete"],
    total: { Micro: 7, Macro: 9, "Indian Economy": 12, "Global Economy": 6, Complete: 22 },
    bg: "/images/economy.jpg",
    icon: "/images/icons/economy.png",
  },
  "Environment & Ecology": {
    tabs: ["Climate", "Biodiversity", "Conservation", "Pollution", "Complete"],
    total: { Climate: 10, Biodiversity: 11, Conservation: 8, Pollution: 6, Complete: 20 },
    bg: "/images/environment.jpg",
    icon: "/images/icons/environment.png",
  },
  "Science & Tech": {
    tabs: ["Physics", "Chemistry", "Biology", "Space & IT", "Complete"],
    total: { Physics: 8, Chemistry: 7, Biology: 10, "Space & IT": 9, Complete: 25 },
    bg: "/images/science.jpg",
    icon: "/images/icons/science.png",
  },
  // ✅ Prelims Tests is last now
  "Prelims Tests": {
    tabs: Array.from({ length: 15 }, (_, i) => `Test ${i + 1}`),
    total: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`Test ${i + 1}`, 1])), // each test = 1
    bg: "/images/prelims.jpg",
    icon: "/images/icons/prelims.png",
  },
};

export default function PrelimsTests() {
  const [activeSubject, setActiveSubject] = useState("History"); // ✅ back to History as default
  const [activeTab, setActiveTab] = useState("Ancient");
  const [attempted, setAttempted] = useState({});
  const [confirmTest, setConfirmTest] = useState(null);

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔹 Listen to auth + user progress from Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "prelimsProgress", u.uid);
        const unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) setAttempted(snap.data());
        });
        return () => unsub();
      } else {
        setAttempted({});
      }
    });
    return () => unsubAuth();
  }, []);

  const subject = subjects[activeSubject];
  const tabTotal = subject.total[activeTab];
  const key = `${activeSubject}-${activeTab}`;
  const tabAttempted = attempted[key] || 0;
  const progressPercent = Math.min((tabAttempted / tabTotal) * 100, 100);

  // Confirm popup handler
  const handleAttemptClick = () => {
    if (!user) {
      alert("Please login first");
      return;
    }
    setConfirmTest({ subject: activeSubject, tab: activeTab });
  };

  const confirmProceed = async () => {
    if (!user || !confirmTest) return;
    const key = `${confirmTest.subject}-${confirmTest.tab}`;
    const ref = doc(db, "prelimsProgress", user.uid);

    await setDoc(ref, { [key]: increment(1) }, { merge: true });

    setConfirmTest(null);
    navigate(`/tests/${confirmTest.subject.toLowerCase()}/${confirmTest.tab.toLowerCase()}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-72 bg-white dark:bg-gray-800 shadow-xl p-6 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-[#0090DE] mb-4">📚 Categories</h2>
        {Object.keys(subjects).map((subj) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={subj}
            onClick={() => {
              setActiveSubject(subj);
              setActiveTab(subjects[subj].tabs[0]);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
              activeSubject === subj
                ? "bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-semibold shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <img src={subjects[subj].icon} alt={subj} className="w-6 h-6" />
            {subj}
          </motion.button>
        ))}
      </motion.aside>

      {/* Main */}
      <main className="flex-1 relative p-10">
        {/* Background image */}
        <motion.div
          key={activeSubject}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${subject.bg})` }}
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.h2
            key={activeSubject}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8"
          >
            {activeSubject}
          </motion.h2>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subject.tabs.map((tab) => {
              const tKey = `${activeSubject}-${tab}`;
              const attemptedCount = attempted[tKey] || 0;
              const percent = Math.min((attemptedCount / subject.total[tab]) * 100, 100);

              return (
                <motion.div
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-2xl shadow-xl backdrop-blur-md 
                    ${activeTab === tab
                      ? "bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white"
                      : "bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <h3 className="text-xl font-bold mb-3">{tab}</h3>

                  <p className="mb-2">
                    Progress:{" "}
                    <span className="font-bold">
                      {attemptedCount}/{subject.total[tab]}
                    </span>
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden border border-gray-300 dark:border-gray-600">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-3 bg-gradient-to-r from-green-400 to-green-600"
                    />
                  </div>

                  {/* Attempt button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(tab);
                      setConfirmTest({ subject: activeSubject, tab });
                    }}
                    className="px-5 py-2 rounded-lg bg-white text-[#0090DE] font-semibold shadow hover:shadow-lg transition"
                  >
                    Attempt Test →
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {confirmTest && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm text-center"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start {confirmTest.tab} - {confirmTest.subject}?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Proceeding will <b>increase your attempted count</b>. Do you want to continue?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setConfirmTest(null)}
                  className="px-5 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmProceed}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white hover:shadow-lg"
                >
                  Yes, Proceed 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
