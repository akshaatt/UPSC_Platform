// src/pages/CurrentAffairsPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { FileText, Search, Newspaper } from "lucide-react";

export default function CurrentAffairsPage() {
  const [pdfs, setPdfs] = useState([]);
  const [search, setSearch] = useState("");
  const [headlines, setHeadlines] = useState([]);

  // ✅ Fetch PDFs
  useEffect(() => {
    const q = query(
      collection(db, "currentAffairsPdfs"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setPdfs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // ✅ Fetch 5 headlines
  useEffect(() => {
    const q = query(
      collection(db, "currentAffairsHeadlines"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    return onSnapshot(q, (snap) =>
      setHeadlines(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // ✅ Search filter
  const filtered = pdfs.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      (p.date && p.date.includes(search))
  );

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-6 overflow-hidden">
      {/* 🖼 Animated Background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1, x: 0, y: 0 }}
        animate={{ scale: 1.2, x: -25, y: -20 }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse" }}
      >
        <img
          src="/assets/back.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* 🌈 Dark Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm z-10"></div>

      {/* Page Content */}
      <div className="relative z-20">
        {/* 🏷️ Heading */}
        <div className="text-center mb-12">
          <motion.h2
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold bg-gradient-to-r 
                       from-pink-500 via-red-500 to-yellow-400 bg-clip-text text-transparent 
                       drop-shadow-[0_0_35px_rgba(255,120,120,0.9)]"
            initial={{ opacity: 0, scale: 0.6, y: -60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, duration: 1 }}
            whileHover={{ scale: 1.08 }}
          >
            Current Affairs
          </motion.h2>

          {/* ✨ Animated Neon Bar */}
          <motion.div
            className="mx-auto mt-4 h-2 w-64 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 shadow-lg"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          />

          {/* 📚 Subtitle */}
          <motion.p
            className="mt-6 text-lg md:text-2xl font-semibold text-white tracking-wide drop-shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            📚 View & Download Daily Compilations
          </motion.p>
        </div>

        {/* 🔍 Search Bar */}
        <div className="relative max-w-xl mx-auto mb-12">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or date (YYYY-MM-DD)..."
            className="w-full p-4 rounded-xl border border-gray-700 bg-black/70 text-gray-100 placeholder-gray-400 shadow-lg focus:ring-2 focus:ring-pink-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* 📰 Recent Headlines */}
        {headlines.length > 0 && (
          <div className="relative max-w-3xl mx-auto mb-12">
            <h3 className="text-xl font-bold text-pink-400 mb-3 flex items-center gap-2">
              <Newspaper size={22} /> Most Recent & Important Topics
            </h3>
            <ul className="space-y-2">
              {headlines.map((h, i) => (
                <motion.li
                  key={h.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-white flex items-start gap-2 text-sm"
                >
                  <span className="text-pink-400">●</span>
                  {h.text}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* 📂 PDFs Grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-gray-300 italic">No PDFs found.</p>
        ) : (
          <motion.div
            layout
            className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
          >
            {filtered.map((pdf, i) => (
              <motion.div
                key={pdf.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-xl overflow-hidden shadow-md hover:shadow-pink-500/40 
                           bg-black/70 border border-gray-700 backdrop-blur-md 
                           transition-all duration-500 group w-full"
              >
                {/* PDF Preview */}
                <div className="flex flex-col items-center justify-center h-40 bg-red-900/40 text-red-400">
                  <FileText size={36} />
                  <p className="font-bold mt-1 text-xs">PDF</p>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col items-center text-center">
                  <h3 className="text-sm font-semibold text-gray-100 truncate">
                    {pdf.title || "Untitled"}
                  </h3>
                  <p className="text-[10px] text-gray-400 truncate mt-1">
                    {pdf.date || "No Date"} • {pdf.fileName}
                  </p>
                  <motion.a
                    href={pdf.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    whileTap={{ scale: 0.95 }}
                    className="mt-3 w-full px-3 py-1.5 rounded-lg bg-gradient-to-r 
                               from-pink-500 via-red-500 to-yellow-400 text-white text-xs font-medium shadow-md
                               hover:shadow-lg hover:opacity-95 transition-all"
                  >
                    ⬇ Download
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 📺 Ticker bar */}
      {headlines.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full bg-black/70 py-2 overflow-hidden z-30">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap text-pink-400 font-semibold text-sm"
          >
            {headlines.map((h) => ` 🔥 ${h.text} `).join(" • ")}
          </motion.div>
        </div>
      )}
    </div>
  );
}
