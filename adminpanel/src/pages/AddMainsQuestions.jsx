// src/components/AddMainsQuestions.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

export default function AddMainsQuestions() {
  const [paper, setPaper] = useState("english");
  const [subField, setSubField] = useState(""); 
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState("");
  const [questions, setQuestions] = useState([]);

  // 🔹 Config from Firestore
  const [languages, setLanguages] = useState([]);
  const [optionals, setOptionals] = useState([]);

  // ✅ Fetch config from Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const langSnap = await getDoc(doc(db, "mainsConfig", "indianLanguages"));
        if (langSnap.exists()) setLanguages(langSnap.data().languages || []);

        const optSnap = await getDoc(doc(db, "mainsConfig", "optionalSubjects"));
        if (optSnap.exists()) setOptionals(optSnap.data().subjects || []);
      } catch (err) {
        console.error("Error fetching config:", err);
      }
    };
    fetchConfig();
  }, []);

  // ✅ Add Question
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert("Enter a question first");
      return;
    }

    try {
      await addDoc(collection(db, "mainsQuestions"), {
        paper: paper.toLowerCase(),
        subField:
          paper === "optional" || paper === "indian-language"
            ? subField.toLowerCase()
            : null,
        questionText,
        marks: marks || null,
        createdAt: serverTimestamp(),
      });

      setQuestionText("");
      setMarks("");
      setSubField("");
      alert("✅ Question added successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add: " + err.message);
    }
  };

  // ✅ Fetch Questions (Realtime)
  useEffect(() => {
    let q = query(collection(db, "mainsQuestions"));

    if (paper !== "all") {
      q = query(
        collection(db, "mainsQuestions"),
        where("paper", "==", paper.toLowerCase())
      );
    }

    if ((paper === "optional" || paper === "indian-language") && subField) {
      q = query(
        collection(db, "mainsQuestions"),
        where("paper", "==", paper.toLowerCase()),
        where("subField", "==", subField.toLowerCase())
      );
    }

    const unsub = onSnapshot(q, (snap) =>
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => unsub();
  }, [paper, subField]);

  // ✅ Delete Question
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    await deleteDoc(doc(db, "mainsQuestions", id));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        📝 Add Mains Questions
      </h2>

      {/* Add Question Form */}
      <form onSubmit={handleAdd} className="space-y-4 mb-6">
        {/* Paper Select */}
        <select
          value={paper}
          onChange={(e) => setPaper(e.target.value)}
          className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white w-full"
        >
          <option value="english">English</option>
          <option value="indian-language">Indian Language</option>
          <option value="essay">Essay</option>
          <option value="gs1">GS Paper 1</option>
          <option value="gs2">GS Paper 2</option>
          <option value="gs3">GS Paper 3</option>
          <option value="gs4">GS Paper 4</option>
          <option value="optional">Optional</option>
          <option value="all">All Papers (View Only)</option>
        </select>

        {/* Indian Language Dropdown */}
        {paper === "indian-language" && (
          <select
            value={subField}
            onChange={(e) => setSubField(e.target.value)}
            className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white w-full"
          >
            <option value="">-- Select Indian Language --</option>
            {languages.map((lang) => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        )}

        {/* Optional Subject Dropdown */}
        {paper === "optional" && (
          <select
            value={subField}
            onChange={(e) => setSubField(e.target.value)}
            className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white w-full"
          >
            <option value="">-- Select Optional Subject --</option>
            {optionals.map((sub) => (
              <option key={sub} value={sub.toLowerCase()}>
                {sub}
              </option>
            ))}
          </select>
        )}

        {/* Marks */}
        <input
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          placeholder="Marks (e.g. 10, 15, 20)"
          className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white w-full"
        />

        {/* Question */}
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter Question"
          className="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white w-full"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white"
        >
          ➕ Add Question
        </button>
      </form>

      {/* List of Questions */}
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
        📋 Questions List
      </h3>
      {questions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No questions found.</p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex justify-between items-center p-3 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <div>
                <span className="font-medium">{q.questionText}</span>{" "}
                {q.marks && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    ({q.marks} Marks)
                  </span>
                )}
                {q.subField && (
                  <span className="ml-2 text-xs text-purple-500">
                    [{q.subField}]
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(q.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
