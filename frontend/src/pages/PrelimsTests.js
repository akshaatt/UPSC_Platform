// src/pages/PrelimsTests.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
} from "firebase/firestore";

// ✅ Subject & subtopics (IDs match Firestore)
const subjectStructure = {
  history: ["ancient", "medieval", "modern", "complete"],
  geography: ["physical", "human", "indian", "world", "complete"],
  economics: ["micro", "macro", "indian economy", "global economics", "complete"],
  polity: ["constitution", "parliament", "judiciary", "governance", "complete"],
  "environment-ecology": ["biodiversity", "climate", "pollution", "conservation", "complete"],
  "science-tech": ["physics", "chemistry", "biology", "space&it", "complete"],
  "prelims-test": ["test"],
};

// ✅ Sidebar icons (optional)
const subjectMeta = {
  history: { icon: "📜" },
  geography: { icon: "🌍" },
  economics: { icon: "💰" },
  polity: { icon: "🏛️" },
  "environment-ecology": { icon: "🌱" },
  "science-tech": { icon: "🔬" },
  "prelims-test": { icon: "📝" },
};

export default function PrelimsTests() {
  const [activeSubject, setActiveSubject] = useState("history");
  const [testsData, setTestsData] = useState({});
  const [attempted, setAttempted] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔹 Listen to user attempts progress
  useEffect(() => {
    let unsubProgress = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "prelimsProgress", u.uid);
        unsubProgress = onSnapshot(ref, (snap) => {
          if (snap.exists()) setAttempted(snap.data());
        });
      } else {
        setAttempted({});
      }
    });
    return () => {
      unsubAuth();
      if (unsubProgress) unsubProgress();
    };
  }, []);

  // 🔹 Fetch tests from Firestore
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const allData = {};
        for (const subj of Object.keys(subjectStructure)) {
          allData[subj] = {};
          for (const tab of subjectStructure[subj]) {
            const testsRef = collection(
              db,
              "tests",
              "prelims",
              "subjects",
              subj,
              "subtopics",
              tab,
              "tests"
            );

            const snap = await getDocs(testsRef);
            const testsList = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));

            allData[subj][tab] = testsList;
          }
        }
        setTestsData(allData);
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };

    fetchTests();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-20">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-72 bg-gray-800/70 backdrop-blur-xl border-r border-gray-700 p-6 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-cyan-400 mb-4">📚 Subjects</h2>
        {Object.keys(subjectStructure).map((subj) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={subj}
            onClick={() => setActiveSubject(subj)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
              activeSubject === subj
                ? "bg-cyan-600 text-white font-semibold shadow-lg"
                : "bg-gray-900/60 hover:bg-gray-700/60 text-gray-300"
            }`}
          >
            <span>{subjectMeta[subj]?.icon}</span>
            {subj.charAt(0).toUpperCase() + subj.slice(1)}
          </motion.button>
        ))}
      </motion.aside>

      {/* Main */}
      <main className="flex-1 relative p-8 overflow-y-auto">
        <motion.h2
          key={activeSubject}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-extrabold text-cyan-400 mb-8"
        >
          {activeSubject.charAt(0).toUpperCase() + activeSubject.slice(1)}
        </motion.h2>

        {/* Subtopics as Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectStructure[activeSubject].map((tab) => {
            const key = `${activeSubject}-${tab}`;
            const attemptedCount = attempted[key] || 0;
            const testsList = testsData[activeSubject]?.[tab] || [];
            const total = testsList.length;
            const percent = total > 0 ? Math.min((attemptedCount / total) * 100, 100) : 0;

            return (
              <motion.div
                key={tab}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl shadow-xl bg-gray-800/70 border border-gray-700 hover:border-cyan-500 transition flex flex-col"
              >
                <h3 className="text-xl font-bold mb-3 text-cyan-400">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </h3>

                <p className="mb-2 text-gray-400">
                  Progress:{" "}
                  <span className="font-bold text-white">
                    {attemptedCount}/{total}
                  </span>
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-3 bg-gradient-to-r from-green-400 to-green-600"
                  />
                </div>

                {/* Tests list */}
                <div className="space-y-2 mt-auto">
                  {testsList.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tests uploaded</p>
                  ) : (
                    testsList.map((test, idx) => (
                      <button
                        key={test.id}
                        onClick={() =>
                          navigate(`/tests/prelims/${activeSubject}/${tab}/${test.id}`)
                        }
                        className="w-full text-left px-3 py-2 rounded-lg text-sm bg-gray-900/60 hover:bg-cyan-600 hover:text-white transition"
                      >
                        {test.title || `Test ${idx + 1}`} →
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
