// src/components/AttemptsAdmin.jsx
import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const db = getFirestore(app);
const functions = getFunctions(app);

export default function AttemptsAdmin() {
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState("prelims");

  // ---------------------------
  // Load all users in real-time
  // ---------------------------
 // useEffect(() => {
    //const unsub = onSnapshot(collection(db, "users"), (snap) => {
      //setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    //});
    //return () => unsub();
   //}, []);

  // ---------------------------
  // Admin can undo an attempt
  // ---------------------------
  const undoAttempt = async (uid) => {
    try {
      const fn = httpsCallable(functions, "adminUndoAttempt");
      await fn({ uid, section });
      alert("✅ Attempt undone!");
    } catch (err) {
      console.error("Undo attempt error:", err);
      alert("❌ " + err.message);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Attempts
      </h2>

      {/* Section Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Select Section
        </label>
        <select
          className="border rounded-lg p-2 bg-white dark:bg-gray-800 dark:text-white"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="prelims">Prelims</option>
          <option value="csat">CSAT</option>
          <option value="mains">Mains</option>
        </select>
      </div>

      {/* Student Table */}
      {students.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No students yet.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-300 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr className="text-gray-800 dark:text-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Taken</th>
                <th className="px-4 py-2">Left</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((s) => {
                const att = s.attempts?.[section];
                const total = att ? att.total : "—";
                const taken = att ? att.taken : "—";
                const left = att ? att.left : "—";

                return (
                  <tr
                    key={s.id}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <td className="px-4 py-2">{s.name || "—"}</td>
                    <td className="px-4 py-2">{s.email || "—"}</td>
                    <td className="px-4 py-2 capitalize">{s.plan || "—"}</td>
                    <td className="px-4 py-2">{total}</td>
                    <td className="px-4 py-2">{taken}</td>
                    <td className="px-4 py-2">{left}</td>
                    <td className="px-4 py-2">
                      <button
                        className={`px-3 py-1 rounded-lg text-sm ${
                          !att || att.taken <= 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                        onClick={() => undoAttempt(s.id)}
                        disabled={!att || att.taken <= 0}
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
