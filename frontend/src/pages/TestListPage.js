// src/pages/TestListPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

export default function TestListPage() {
  const { examType, subject, subtopic } = useParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      if (!examType || !subject || !subtopic) {
        console.warn("Missing route params for TestListPage");
        setLoading(false);
        return;
      }

      try {
        const testsRef = collection(
          db,
          "tests",
          examType.toLowerCase(),
          "subjects",
          subject.toLowerCase(),
          "subtopics",
          subtopic.toLowerCase(),
          "tests"
        );
        const snapshot = await getDocs(testsRef);

        const testList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTests(testList);
      } catch (err) {
        console.error("Error fetching tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [examType, subject, subtopic]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 dark:text-gray-300">
        Loading tests...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-gray-50 dark:bg-gray-900">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10"
      >
        {subtopic ? subtopic.charAt(0).toUpperCase() + subtopic.slice(1) : "Tests"}
      </motion.h2>

      {tests.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No tests available yet for{" "}
          <span className="font-semibold">{subject}</span> →{" "}
          <span className="font-semibold">{subtopic}</span>.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tests.map((test, i) => (
            <motion.div
              key={test.id}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-2xl shadow-xl backdrop-blur-md 
                         bg-white/90 dark:bg-gray-800/90 
                         text-gray-800 dark:text-gray-200 cursor-pointer"
              onClick={() =>
                navigate(`/tests/${examType}/${subject}/${subtopic}/${test.id}`)
              }
            >
              <h3 className="text-xl font-bold mb-3">
                {test.title || `Test ${i + 1}`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {test.description || "Click to start this test"}
              </p>
              <button
                className="mt-4 px-5 py-2 rounded-lg bg-gradient-to-r from-[#0090DE] to-[#00c4ff] 
                           text-white font-semibold shadow hover:shadow-lg transition"
              >
                Start Test →
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
