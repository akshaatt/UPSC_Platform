// src/components/ExclusiveNotes.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FileText, Crown, Lock } from "lucide-react";

export default function ExclusiveNotes() {
  const [notes, setNotes] = useState([]);
  const [user] = useAuthState(auth);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  // ✅ Fetch notes
  useEffect(() => {
    const q = query(collection(db, "exclusiveNotes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // ✅ Fetch user plan
  useEffect(() => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setPlan(snap.exists() ? snap.data().plan || "lakshya" : "lakshya");
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Checking access…
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Please log in to access Exclusive Notes.
      </div>
    );
  }

  // ❌ Not Samarpan plan
  if (plan !== "samarpan") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 blur-3xl" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 bg-gray-900/60 backdrop-blur-xl p-10 rounded-2xl border border-cyan-500/30 shadow-2xl"
        >
          <Crown size={48} className="mx-auto text-cyan-400 mb-4" />
          <h2 className="text-3xl font-bold text-red-400 mb-4">
            🚫 Exclusive Notes Locked
          </h2>
          <p className="mb-6 text-gray-300">
            Only <b>Samarpan Plan</b> users can unlock this treasure.
          </p>
          <button
            onClick={() => alert("Show subscription popup here")}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-bold shadow-lg hover:opacity-90 transition"
          >
            Upgrade Now 🚀
          </button>
        </motion.div>
      </div>
    );
  }

  // ✅ Samarpan users only
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pt-24 px-6 pb-16 relative overflow-hidden">
      {/* Neon gradient lines background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,200,255,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,144,222,0.15),transparent_40%)]" />

      <h1 className="text-4xl font-extrabold text-center text-cyan-400 mb-12 relative z-10 flex items-center justify-center gap-2">
        <Crown className="text-yellow-400" /> Exclusive Notes Hub
      </h1>

      {/* Search bar */}
      <div className="max-w-md mx-auto mb-10 relative z-10">
        <input
          type="text"
          placeholder="🔍 Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white border border-cyan-600/40 focus:ring-2 focus:ring-cyan-400 outline-none"
        />
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-gray-400">No exclusive notes available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10">
          {notes
            .filter((note) =>
              note.title.toLowerCase().includes(search.toLowerCase())
            )
            .map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -6 }}
                className="bg-gray-900/80 border border-cyan-600/50 backdrop-blur-xl rounded-2xl shadow-xl p-6 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-purple-600/20 blur-xl" />

                <div className="relative">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <FileText className="text-cyan-400" /> {note.title}
                  </h2>
                  <p className="text-sm text-gray-400">{note.fileName}</p>
                </div>
                <div className="mt-6 relative z-10 flex gap-3">
                  <button
                    onClick={() => setPreview(note.fileUrl)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-600 text-white font-semibold shadow hover:opacity-90 transition"
                  >
                    👁 Preview
                  </button>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow hover:opacity-90 transition"
                  >
                    📥 Download
                  </a>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl h-[80vh] relative"
          >
            <iframe
              src={preview}
              title="PDF Preview"
              className="w-full h-full"
            ></iframe>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
