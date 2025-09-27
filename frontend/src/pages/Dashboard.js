import React, { useEffect, useState } from "react";
import { auth, db, DEFAULT_AVATAR } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaStar } from "react-icons/fa";

/** helpers */
function toKey(d) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toLabel(d) {
  // dd/mm
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}`;
}
function lastNDays(n) {
  const today = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ dateObj: d, key: toKey(d), label: toLabel(d) });
  }
  return out;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // demo counters (wire these later to Firestore like loginStats)
  const stats = {
    quizzes: 12,
    questions: 45,
    downloads: 8,
    profileVisits: 5,
  };
  const stars = 3; // UI only for now

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchLoginStats() {
      setLoadingChart(true);
      try {
        const snap = await getDocs(collection(db, "loginStats")); // docs with id = YYYY-MM-DD, {count: number}
        const map = new Map();
        snap.forEach((doc) => {
          const { count = 0 } = doc.data() || {};
          map.set(doc.id, count);
        });

        const days = lastNDays(30);
        const series = days.map(({ key, label }) => ({
          date: label,          // dd/mm for X axis
          logins: map.get(key) || 0,
        }));
        setLoginData(series);
      } catch (e) {
        console.error("loginStats fetch error:", e);
        setLoginData(lastNDays(30).map(({ label }) => ({ date: label, logins: 0 })));
      } finally {
        setLoadingChart(false);
      }
    }
    fetchLoginStats();
  }, []);

  if (!user) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Please login to view your dashboard.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="pt-24 max-w-6xl mx-auto px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* User Card */}
      <motion.div
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-10 flex flex-col items-center relative overflow-hidden"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* soft dust aura */}
        <motion.div
          className="absolute -top-16 -left-16 w-48 h-48 bg-[#0090DE]/25 rounded-full blur-3xl"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-16 -right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.img
          src={user.photoURL || DEFAULT_AVATAR}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg mb-4"
          whileHover={{ scale: 1.05, rotate: 1.5 }}
          transition={{ type: "spring", stiffness: 220 }}
        />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {user.displayName || "Aspirant"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {[
          { title: "Quizzes Attempted", value: stats.quizzes },
          { title: "Questions Asked", value: stats.questions },
          { title: "Books Downloaded", value: stats.downloads },
          { title: "Profile Visits", value: stats.profileVisits },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md p-6 text-center hover:shadow-xl transition"
            whileHover={{ scale: 1.04 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {card.title}
            </h2>
            <p className="text-2xl font-bold text-[#0090DE] mt-2">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Login Graph (last 30 days, dd/mm) */}
      <motion.div
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg p-6 mb-10"
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Login Activity (Last 30 Days)
        </h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loginData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#0090DE"
                strokeWidth={3}
                dot={{ r: 3 }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {loadingChart && (
          <p className="text-sm text-gray-500 mt-3">Loading chart…</p>
        )}
      </motion.div>

      {/* Stars */}
      <motion.div
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md p-6 text-center relative overflow-hidden"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* subtle dust */}
        <motion.div
          className="absolute -top-10 left-1/3 w-40 h-40 bg-[#0090DE]/15 rounded-full blur-2xl"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Your Star Rating
        </h2>
        <div className="flex justify-center gap-2 text-3xl">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={i < stars ? "text-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Complete more tasks to earn stars 🌟
        </p>
      </motion.div>
    </motion.div>
  );
}
