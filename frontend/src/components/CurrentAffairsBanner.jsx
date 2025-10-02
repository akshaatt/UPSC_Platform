import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Newspaper } from "lucide-react";

export default function CurrentAffairsBanner() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "currentAffairsHeadlines"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto -mt-10 mb-12 px-6 z-20">
      {/* 🔥 Glow background */}
      <div className="absolute inset-0 -z-10 flex justify-center">
        <div className="w-[95%] h-full rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl backdrop-blur-xl bg-slate-900/80 
                   border border-cyan-500/30 shadow-[0_0_30px_rgba(0,200,255,0.3)]
                   overflow-hidden hover:shadow-[0_0_40px_rgba(0,200,255,0.6)]
                   transition-all duration-500"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-purple-600/30">
          <div className="p-2 rounded-full bg-cyan-500/30 text-cyan-300">
            <Newspaper size={22} />
          </div>
          <h3 className="text-lg md:text-xl font-extrabold tracking-wide text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            Current Affairs –{" "}
            <span className="text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.9)]">
              {new Date().toDateString()}
            </span>
          </h3>
          <a
            href="/current-affairs"
            className="ml-auto text-sm px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow hover:opacity-90"
          >
            View All →
          </a>
        </div>

        {/* Headlines (Marquee style) */}
        {items.length === 0 ? (
          <div className="text-center text-gray-300 py-8 italic">
            No current affairs yet.
          </div>
        ) : (
          <div className="relative h-16 flex items-center px-6">
            <motion.div
              key={items.map((i) => i.id).join(",")}
              initial={{ x: "100%" }}
              animate={{ x: "-100%" }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }} // slower scroll
              className="flex gap-16 whitespace-nowrap"
            >
              {items.map((h) => (
                <span
                  key={h.id}
                  className="flex items-center gap-2 text-lg font-semibold text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-300 transition-colors"
                >
                  <span className="text-cyan-400">●</span>
                  {h.text}
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
