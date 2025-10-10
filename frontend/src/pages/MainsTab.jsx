// src/pages/MainsTab.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MainsTab() {
  const [selected, setSelected] = useState("english");
  const [optional, setOptional] = useState("");
  const [language, setLanguage] = useState("");
  const [questions, setQuestions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [search, setSearch] = useState("");

  const [languages, setLanguages] = useState([]);
  const [optionals, setOptionals] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ✅ Fetch languages + optionals
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const langSnap = await getDoc(doc(db, "mainsConfig", "indianLanguages"));
        if (langSnap.exists()) setLanguages(langSnap.data().languages || []);

        const optSnap = await getDoc(doc(db, "mainsConfig", "optionalSubjects"));
        if (optSnap.exists()) setOptionals(optSnap.data().subjects || []);
      } catch (err) {
        console.error("❌ Error fetching config:", err);
      }
    };
    fetchConfig();
  }, []);

  // ✅ Fetch questions dynamically
  useEffect(() => {
    let q = query(collection(db, "mainsQuestions"));
    if (selected === "optional" && optional) {
      q = query(
        collection(db, "mainsQuestions"),
        where("paper", "==", "optional"),
        where("subField", "==", optional.toLowerCase())
      );
    } else if (selected === "indian-language" && language) {
      q = query(
        collection(db, "mainsQuestions"),
        where("paper", "==", "indian-language"),
        where("subField", "==", language.toLowerCase())
      );
    } else {
      q = query(collection(db, "mainsQuestions"), where("paper", "==", selected));
    }

    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [selected, optional, language]);

  // ✅ Handle submission
  const handleSubmit = async (qid, questionText, file, typedAnswer) => {
    if (!auth.currentUser) return alert("You must be logged in!");
    setUploading(true);

    try {
      const uid = auth.currentUser.uid;

      // 🔥 Fetch proper user profile from "users" collection
      let userName = "Anonymous";
      let userEmail = auth.currentUser.email || "—";
      let plan = "Free";

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          userName = data.name || auth.currentUser.displayName || "Anonymous";
          userEmail = data.email || auth.currentUser.email || "—";
          plan = data.plan || "Free";
        }
      } catch (err) {
        console.error("⚠️ Failed to fetch user profile:", err);
      }

      // ✅ Upload file (if any)
      let fileUrl = null;
      if (file) {
        const storageRef = ref(storage, `mains/${uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      // ✅ Save submission in Firestore
      await addDoc(collection(db, `users/${uid}/mainsSubmissions`), {
        userId: uid,
        userName,
        userEmail,
        plan,
        questionId: qid,
        questionText,
        fileUrls: fileUrl ? [fileUrl] : [],
        typedAnswer: typedAnswer || "",
        status: "submitted",
        createdAt: serverTimestamp(),
      });

      setSubmitted((prev) => ({ ...prev, [qid]: true }));
    } catch (err) {
      console.error("❌ Submission failed:", err);
      alert("Submission failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = (qid) => {
    setSubmitted((prev) => ({ ...prev, [qid]: false }));
  };

  const filteredQuestions = questions.filter((q) =>
    q.questionText?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-white pt-20">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-3 fixed top-16 bottom-0 left-0">
        <h2 className="text-xl font-bold mb-4">Mains Papers</h2>

        {/* Indian Language Dropdown */}
        <p className="font-semibold mb-1">Indian Language</p>
        <select
          className="w-full bg-gray-800 p-2 rounded mb-2"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setSelected("indian-language");
          }}
        >
          <option value="">-- Select Language --</option>
          {languages.map((lang, i) => (
            <option key={i} value={lang.toLowerCase()}>
              {lang}
            </option>
          ))}
        </select>

        {/* Fixed Papers */}
        {["english", "essay", "gs1", "gs2", "gs3", "gs4"].map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`block w-full text-left px-3 py-2 rounded ${
              selected === p
                ? "bg-gradient-to-r from-cyan-600 to-blue-600"
                : "hover:bg-gray-800"
            }`}
          >
            {p.toUpperCase().replace("GS", "GS Paper ")}
          </button>
        ))}

        {/* Optional */}
        <p className="font-semibold mt-4 mb-2">Optional Subject</p>
        <select
          className="w-full bg-gray-800 p-2 rounded"
          value={optional}
          onChange={(e) => {
            setOptional(e.target.value);
            setSelected("optional");
          }}
        >
          <option value="">-- Select Optional --</option>
          {optionals.map((sub, i) => (
            <option key={i} value={sub.toLowerCase()}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Questions */}
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 capitalize">{selected} Questions</h1>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full p-3 rounded-lg bg-gray-800 text-white mb-6"
        />

        {filteredQuestions.length === 0 ? (
          <p className="text-gray-400">No questions found.</p>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="mt-6 p-4 rounded-xl bg-gray-800/60 border border-gray-700"
            >
              <p className="font-semibold">{q.questionText}</p>
              <p className="text-xs text-gray-400">[Max Marks: {q.marks}]</p>

              <button
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="mt-2 text-sm text-cyan-400 underline"
              >
                {expanded === q.id ? "Hide" : "Answer"}
              </button>

              <AnimatePresence>
                {expanded === q.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3"
                  >
                    {submitted[q.id] ? (
                      <div className="p-3 rounded bg-gray-900/70">
                        <p className="text-green-400 font-medium">
                          ✅ Submitted Successfully
                        </p>
                        <button
                          onClick={() => handleRetry(q.id)}
                          className="mt-3 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                        >
                          Retry Rs.100
                        </button>
                      </div>
                    ) : (
                      <UploadForm
                        q={q}
                        onSubmit={handleSubmit}
                        uploading={uploading}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UploadForm({ q, onSubmit, uploading }) {
  const [file, setFile] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState("");

  const submit = () => {
    onSubmit(q.id, q.questionText, file, typedAnswer);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm">Upload your answer (PDF/DOCX/Image)</label>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <textarea
        rows={4}
        className="w-full p-2 rounded bg-gray-900 text-sm"
        placeholder="Or paste your typed answer here..."
        value={typedAnswer}
        onChange={(e) => setTypedAnswer(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={uploading}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-sm"
      >
        {uploading ? "Submitting..." : "Submit for Evaluation"}
      </button>
    </div>
  );
}
