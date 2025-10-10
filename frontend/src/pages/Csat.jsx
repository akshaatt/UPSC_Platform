// src/pages/Csat.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// ✅ Topics list (frontend display names)
const topicsList = [
  "Comprehension",
  "Interpersonal skills",
  "Logical reasoning",
  "Decision-making and problem-solving",
  "General mental ability",
  "Basic numeracy",
  "Data interpretation",
];

// ✅ Map frontend names → Firestore keys
const topicKeyMap = {
  "Comprehension": "comprehension",
  "Interpersonal skills": "interpersonal-skills",
  "Logical reasoning": "logical-reasoning",
  "Decision-making and problem-solving": "decision-making",
  "General mental ability": "general-mental-ability",
  "Basic numeracy": "basic-numeracy",
  "Data interpretation": "data-interpretation",
  "Complete Csat Tests": "complete-csat-tests",
};

// ✅ Maths Subtopics (display names)
const mathsSubtopics = [
  "L.C.M & H.C.F",
  "Rational Numbers & Ordering",
  "Square Roots & Cube Roots",
  "Averages",
  "Set theory",
  "Decimal Fractions",
  "Ratio & Proportion",
  "Simplification",
  "Number System",
  "Surds & Indices",
  "Divisibility Rules",
  "Percentages",
  "Remainder Theorem",
  "Probability",
  "Trains",
  "Boats & Streams",
  "Time & Work",
  "Partnership",
  "SI and CI",
  "Mensuration & Area",
  "Time and Distance",
  "Profit & Loss",
  "Work & Wages",
  "Pipes & Cisterns",
  "Permutation and Combinations",
  "Alligation & Mixtures",
  "Geometry",
];

// ✅ Maths Subtopics → Firestore-safe keys
const mathsKeyMap = {
  "L.C.M & H.C.F": "lcm-hcf",
  "Rational Numbers & Ordering": "rational-numbers",
  "Square Roots & Cube Roots": "square-cube-roots",
  "Averages": "averages",
  "Set theory": "set-theory",
  "Decimal Fractions": "decimal-fractions",
  "Ratio & Proportion": "ratio-proportion",
  "Simplification": "simplification",
  "Number System": "number-system",
  "Surds & Indices": "surds-indices",
  "Divisibility Rules": "divisibility-rules",
  "Percentages": "percentages",
  "Remainder Theorem": "remainder-theorem",
  "Probability": "probability",
  "Trains": "trains",
  "Boats & Streams": "boats-streams",
  "Time & Work": "time-work",
  "Partnership": "partnership",
  "SI and CI": "si-ci",
  "Mensuration & Area": "mensuration",
  "Time and Distance": "time-distance",
  "Profit & Loss": "profit-loss",
  "Work & Wages": "work-wages",
  "Pipes & Cisterns": "pipes-cisterns",
  "Permutation and Combinations": "permutation-combination",
  "Alligation & Mixtures": "alligation-mixtures",
  "Geometry": "geometry",
};

export default function Csat() {
  const [search, setSearch] = useState("");
  const [mathsOpen, setMathsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Attempt checker (localStorage)
  const isAttempted = (testId) => {
    const attemptedTests = JSON.parse(localStorage.getItem("attemptedTests") || "[]");
    return attemptedTests.includes(testId);
  };

  // ✅ When test opened → mark as attempted
  const openTest = (testId) => {
    const attemptedTests = JSON.parse(localStorage.getItem("attemptedTests") || "[]");
    if (!attemptedTests.includes(testId)) {
      attemptedTests.push(testId);
      localStorage.setItem("attemptedTests", JSON.stringify(attemptedTests));
    }

    if (activeTopic === "Complete Csat Tests") {
      navigate(`/tests/csat/completeCsatTests/general/${testId}`);
    } else if (mathsSubtopics.includes(activeTopic)) {
      const key = mathsKeyMap[activeTopic];
      navigate(`/tests/csat/maths/${key}/${testId}`);
    } else {
      const key = topicKeyMap[activeTopic];
      navigate(`/tests/csat/${key}/general/${testId}`);
    }
  };

  // ✅ Fetch Firestore tests
  useEffect(() => {
    if (!activeTopic) return;
    setLoading(true);

    const loadTests = async () => {
      try {
        let q;

        if (activeTopic === "Complete Csat Tests") {
          q = collection(db, "csatQuizzes", "completeCsatTests", "tests");
        } else if (mathsSubtopics.includes(activeTopic)) {
          const key = mathsKeyMap[activeTopic];
          q = collection(db, "csatQuizzes", "maths", "subtopics", key, "tests");
        } else {
          const key = topicKeyMap[activeTopic];
          q = collection(db, "csatQuizzes", key, "tests");
        }

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTests(list);
      } catch (err) {
        console.error("❌ Firestore error:", err);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [activeTopic]);

  // ✅ Search filter
  const filteredTopics = topicsList.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMaths = mathsSubtopics.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 flex-shrink-0 h-screen bg-gray-800/60 backdrop-blur-xl 
                   border-r border-gray-700 p-4 pt-20 space-y-4 overflow-y-auto z-20"
      >
        {/* 🔍 Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-900 text-white 
                       text-sm border border-gray-700 focus:outline-none 
                       focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* 📌 Topics */}
        <div className="space-y-2">
          {filteredTopics.map((topic, i) => (
            <button
              key={i}
              onClick={() => setActiveTopic(topic)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTopic === topic
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-900/60 hover:bg-gray-700/60 text-gray-300"
              }`}
            >
              {topic}
            </button>
          ))}

          {/* 📌 Maths Dropdown */}
          <div>
            <button
              onClick={() => setMathsOpen(!mathsOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg 
                         text-sm font-medium bg-gray-900/60 hover:bg-gray-700/60 text-gray-300"
            >
              <span>Maths</span>
              {mathsOpen ? (
                <ChevronUp size={16} className="text-cyan-400" />
              ) : (
                <ChevronDown size={16} className="text-cyan-400" />
              )}
            </button>

            {mathsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="pl-4 mt-2 space-y-2"
              >
                {filteredMaths.map((sub, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTopic(sub)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      activeTopic === sub
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-800/60 hover:bg-gray-700/60 text-gray-300"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* 📌 Complete CSAT Tests */}
          <button
            onClick={() => setActiveTopic("Complete Csat Tests")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTopic === "Complete Csat Tests"
                ? "bg-cyan-600 text-white"
                : "bg-gray-900/60 hover:bg-gray-700/60 text-gray-300"
            }`}
          >
            Complete Csat Tests
          </button>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        key={activeTopic}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-6"
      >
        {!activeTopic ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xl">
            🚀 Select a topic to view tests
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center text-cyan-400 text-xl">
            Loading tests...
          </div>
        ) : tests.length === 0 ? (
          <div className="h-full flex items-center justify-center text-red-400 text-xl">
            No tests found for {activeTopic}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-cyan-400 mb-4">
              {activeTopic}
            </h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {tests.map((test) => (
                <motion.div
                  key={test.id}
                  whileHover={{ scale: 1.08, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  onClick={() => openTest(test.id)}
                  className={`relative group cursor-pointer rounded-2xl p-6 
                    ${isAttempted(test.id) 
                      ? "bg-gradient-to-br from-green-900/70 via-gray-800/70 to-green-900/60 border border-green-500" 
                      : "bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 border border-gray-700/70 hover:border-cyan-500"}
                    shadow-xl hover:shadow-cyan-500/20 transition-all duration-300`}
                >
                  {/* Glow Background */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                                  bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl transition" />

                  {/* Content */}
                  <div className="relative z-10 space-y-3">
                    <h2 className="text-xl font-bold text-cyan-400 group-hover:text-white transition">
                      {test.title || "Untitled Test"}
                    </h2>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {test.description || "No description available"}
                    </p>

                    {/* Extra Info row */}
                    <div className="flex items-center justify-between text-xs mt-4">
                      <span className="flex items-center gap-1 text-gray-400">
                        📝 {test.questions?.length || 0} Questions
                      </span>

                      {/* ✅ Attempt Status */}
                      {isAttempted(test.id) ? (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-600/30 text-green-300">
                          ✅ Attempted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-600/30 text-red-300">
                          🔴 Not Attempted
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
