import React, { useEffect, useState } from "react";
import { auth, db, DEFAULT_AVATAR } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaCrown,
  FaPhoneAlt,
  FaHome,
  FaUpload,
  FaCheckCircle,
  FaStar,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ----------------------------
   Helpers for Plan & Duration
----------------------------- */
const PLAN_DURATION = {
  safalta: 30,
  shikhar: 150,
  samarpan: 365,
};

function calcExpiry(startDate, plan) {
  if (!startDate || !plan) return null;
  const d = new Date(startDate.toDate());
  d.setDate(d.getDate() + (PLAN_DURATION[plan] || 0));
  return d;
}

function formatDuration(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ----------------------------
   Helpers for Chart & Dates
----------------------------- */
function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toLabel(d) {
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

/* ----------------------------
   Main Component
----------------------------- */
export default function Profile({ dailyActiveTime = 0 }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  // 🔹 Auth & user data listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            setUserData({ uid: u.uid, ...snap.data() });
          }
        });
        return () => unsubDoc();
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  // 🔹 Fetch daily usage (last 30 days)
  useEffect(() => {
    async function fetchUsageStats() {
      if (!userData?.uid) return;
      setLoadingChart(true);
      try {
        const usageRef = collection(db, "users", userData.uid, "dailyUsage");
        const snap = await getDocs(usageRef);
        const map = new Map();
        snap.forEach((doc) => {
          const { seconds = 0 } = doc.data();
          map.set(doc.id, seconds);
        });

        const days = lastNDays(30);
        const series = days.map(({ key, label }) => ({
          date: label,
          hours: (map.get(key) || 0) / 3600, // convert seconds → hours
        }));

        setUsageData(series);
      } catch (e) {
        console.error("Usage fetch error:", e);
        setUsageData(lastNDays(30).map(({ label }) => ({ date: label, hours: 0 })));
      } finally {
        setLoadingChart(false);
      }
    }

    fetchUsageStats();
  }, [userData]);

  // 🔹 Upload logic
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !userData?.uid) return;
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        photoURL: preview,
      });
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 2000);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  // 🔹 Derived info
  const plan = userData?.plan;
  const planStart = userData?.planStart;
  const expiryDate = calcExpiry(planStart, plan);
  const avatarSrc = preview || userData?.photoURL || DEFAULT_AVATAR;

  if (!userData)
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen bg-black text-gray-400">
        <p>Please login to view profile.</p>
      </div>
    );

  /* ----------------------------
      RENDER SECTION
  ----------------------------- */
  return (
    <div className="relative bg-[#0A0A0A] min-h-screen text-gray-200 pt-20 pb-20">
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-0 left-1/3 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* --- Profile Card --- */}
        <motion.div
          className="bg-[#101010] border border-blue-900/40 rounded-2xl shadow-[0_0_30px_rgba(0,191,255,0.15)] p-6 text-center"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.img
            src={avatarSrc}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover mx-auto shadow-[0_0_30px_rgba(0,191,255,0.4)]"
            onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
            whileHover={{ scale: 1.05 }}
          />

          <h1 className="mt-4 text-2xl font-bold text-blue-400">
            {userData.displayName || userData.name || "User"}
          </h1>
          <p className="text-gray-400">{userData.email || user?.email}</p>

          {plan && (
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-900/20 text-blue-300 border border-blue-700/30 px-4 py-1 rounded-full text-sm font-semibold">
              <FaCrown className="text-yellow-400" />
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </div>
          )}

          {/* Upload Section */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <label className="cursor-pointer bg-blue-700/30 px-4 py-2 rounded-lg hover:bg-blue-700/50 transition">
              <FaUpload className="inline mr-2" />
              Choose Photo
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {selectedFile && (
              <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition"
              >
                Upload
              </button>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <InfoCard icon={<FaPhoneAlt />} title="Phone Number" value={userData.phone} />
            <InfoCard icon={<FaHome />} title="Address" value={userData.address} />
            <InfoCard
              title="Plan Start Date"
              value={planStart ? planStart.toDate().toDateString() : "Not available"}
            />
            <InfoCard
              title="Plan Expiry Date"
              value={expiryDate ? expiryDate.toDateString() : "Not available"}
            />
          </div>

          {/* Daily Active Time */}
          <div className="mt-8 p-6 bg-[#0F0F0F] border border-blue-900/30 rounded-xl shadow-inner">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center justify-center gap-2">
              <FaClock /> Daily Active Time
            </h3>
            <p className="mt-2 text-2xl font-bold text-blue-500 font-mono">
              {formatDuration(dailyActiveTime)}
            </p>
            <p className="text-xs text-gray-500 mt-1">(Resets automatically at midnight)</p>
          </div>
        </motion.div>

        {/* --- Usage Chart --- */}
        <motion.div
          className="mt-10 bg-[#111]/80 border border-blue-900/40 rounded-xl p-6"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h2 className="text-lg font-semibold text-blue-400 mb-4">Daily Usage (Last 30 Days)</h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#9CA3AF",
                  }}
                />
                <Tooltip formatter={(v) => `${v.toFixed(2)} hrs`} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#00BFFF"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {loadingChart && <p className="text-sm text-gray-500 mt-3">Loading chart…</p>}
        </motion.div>

        {/* --- Stars Section --- */}
        <motion.div
          className="mt-10 bg-[#111]/80 border border-blue-900/40 rounded-xl p-6 text-center"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-lg font-semibold text-blue-400 mb-4">Your Star Rating</h2>
          <div className="flex justify-center gap-2 text-3xl">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className={i < 3 ? "text-yellow-400" : "text-gray-600"} />
            ))}
          </div>
          <p className="mt-3 text-gray-500 text-sm">
            Complete more tasks to earn stars 🌟
          </p>
        </motion.div>
      </div>

      {/* ✅ Popup */}
      <AnimatePresence>
        {showSavedPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[#111] border border-blue-900/30 p-6 rounded-2xl shadow-2xl text-center"
            >
              <FaCheckCircle className="mx-auto text-emerald-500 mb-2" size={48} />
              <h4 className="text-lg font-semibold text-gray-200">Profile photo updated!</h4>
              <p className="text-sm text-gray-400">
                Your new picture is now visible across Satyapath.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------
   Helper UI Component
----------------------------- */
function InfoCard({ icon, title, value }) {
  return (
    <div className="p-4 bg-[#0F0F0F] border border-blue-900/30 rounded-xl hover:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all">
      <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-2">
        {icon} {title}
      </h3>
      <p className="text-gray-100 font-medium">{value || "Not added"}</p>
    </div>
  );
}
