import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function AddTests() {
  const [examType, setExamType] = useState("prelims");
  const [subject, setSubject] = useState("history");
  const [subtopic, setSubtopic] = useState("ancient");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tests, setTests] = useState([]);

  // subject → subtopics mapping
  const subjects = {
    history: ["ancient", "medieval", "modern", "complete"],
    geography: ["physical", "human", "indian", "world", "complete"],
    polity: ["constitution", "governance", "judiciary", "parliament", "complete"],
    economics: ["micro", "macro", "indian economy", "global economics", "complete"],
    "environment-ecology": ["climate", "biodiversity", "conservation", "pollution", "complete"],
    "science-tech": ["physics", "chemistry", "biology", "space&it", "complete"],
    "prelims-test": ["test"],
  };

  // 🔹 Fetch uploaded tests in real time
  useEffect(() => {
    const ref = collection(
      db,
      "tests",
      examType.toLowerCase(), // ✅ force lowercase
      "subjects",
      subject.toLowerCase(), // ✅ force lowercase
      "subtopics",
      subtopic.toLowerCase(), // ✅ force lowercase
      "tests"
    );
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [examType, subject, subtopic]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setMsg("⚠️ Please provide a title and a JSON file.");
      return;
    }
    setSaving(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const ref = collection(
        db,
        "tests",
        examType.toLowerCase(), // ✅ lowercase path
        "subjects",
        subject.toLowerCase(),
        "subtopics",
        subtopic.toLowerCase(),
        "tests"
      );

      await addDoc(ref, {
        title,
        questions: jsonData.questions || [],
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Test uploaded successfully!");
      setTitle("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMsg("❌ Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Delete a test
  const deleteTest = async (testId) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await deleteDoc(
        doc(
          db,
          "tests",
          examType.toLowerCase(),
          "subjects",
          subject.toLowerCase(),
          "subtopics",
          subtopic.toLowerCase(),
          "tests",
          testId
        )
      );
      setMsg("🗑️ Test deleted successfully!");
    } catch (err) {
      setMsg("❌ Error deleting test: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-100">📝 Add New Test</h2>

      {/* Upload Form */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 max-w-xl bg-gray-900 p-6 rounded-2xl shadow-lg"
      >
        {/* Exam Type */}
        <label className="block text-gray-300">Exam Type</label>
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value.toLowerCase())} // ✅ lowercase
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
        >
          <option value="prelims">Prelims</option>
          <option value="csat">CSAT</option>
        </select>

        {/* Subject Dropdown */}
        <label className="block text-gray-300">Subject</label>
        <select
          value={subject}
          onChange={(e) => {
            const s = e.target.value.toLowerCase();
            setSubject(s);
            setSubtopic(subjects[s][0]);
          }}
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
        >
          {Object.keys(subjects).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Subtopic Dropdown */}
        <label className="block text-gray-300">Subtopic</label>
        <select
          value={subtopic}
          onChange={(e) => setSubtopic(e.target.value.toLowerCase())} // ✅ lowercase
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
        >
          {subjects[subject].map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Test Title */}
        <label className="block text-gray-300">Test Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Test 1"
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
        />

        {/* File Upload */}
        <label className="block text-gray-300">Upload JSON File</label>
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-3 rounded-lg border bg-gray-800 text-white"
        />

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold w-full"
        >
          {saving ? "Uploading..." : "Upload Test"}
        </button>

        {msg && <p className="text-sm mt-2 text-cyan-400">{msg}</p>}
      </form>

      {/* Uploaded Tests List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">
          📑 Uploaded Tests
        </h3>
        {tests.length === 0 ? (
          <p className="text-sm text-gray-400">
            No tests found for this subtopic.
          </p>
        ) : (
          <ul className="space-y-3">
            {tests.map((t) => (
              <li
                key={t.id}
                className="flex justify-between items-center p-4 rounded-lg bg-gray-800 text-white"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-gray-400">
                    {t.createdAt?.toDate().toLocaleString() || "—"}
                  </p>
                </div>
                <button
                  onClick={() => deleteTest(t.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
