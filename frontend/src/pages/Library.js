// src/pages/Library.js
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { FileText } from "lucide-react";

export default function Library() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");

  // ✅ Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Fetch books
  useEffect(() => {
    const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setBooks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading Library...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please login to access the Library 📚</p>
        </div>
      </div>
    );
  }

  // ✅ Search filter
  const filtered = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (book) => {
    try {
      const response = await fetch(book.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `SATYAPATH - ${book.title || book.fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-6 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0f172a]">
      {/* 🌌 Animated Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-cyan-500/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-[20%] right-[-150px] w-[450px] h-[450px] bg-purple-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-120px] left-[30%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Heading */}
      <div className="relative text-center mb-10">
        <motion.h2
          className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          📚 Library
        </motion.h2>
        <p className="mt-3 text-gray-400 italic text-sm">
          Browse and download curated UPSC study materials and reference books.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full p-4 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-400 shadow-lg focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Books grid */}
      {filtered.length === 0 ? (
        <p className="relative text-center text-gray-400 italic z-10">
          No books found.
        </p>
      ) : (
        <motion.div
          layout
          className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10"
        >
          {filtered.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 0.5 }}
              className="rounded-xl overflow-hidden shadow-2xl hover:shadow-cyan-500/30 
                         bg-gray-900/70 border border-gray-700 backdrop-blur-xl 
                         transition-all duration-500 group"
            >
              {/* File Preview (icon style for PDFs) */}
              <div className="flex flex-col items-center justify-center h-36 bg-red-900/40 text-red-400">
                <FileText size={36} />
                <p className="font-bold mt-2 text-sm">PDF</p>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col items-center text-center">
                <h3 className="text-base font-semibold text-gray-100 truncate">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {book.author || book.fileName}
                </p>

                <motion.button
                  onClick={() => handleDownload(book)}
                  whileTap={{ scale: 0.95 }}
                  className="mt-3 w-full px-4 py-2 rounded-lg bg-gradient-to-r 
                             from-cyan-500 via-blue-600 to-purple-600 text-white font-medium shadow-md
                             hover:shadow-lg hover:opacity-95 transition-all text-sm"
                >
                  ⬇ Download
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
