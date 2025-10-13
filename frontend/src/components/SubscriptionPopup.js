// src/components/SubscriptionPopup.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheck, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
} from "firebase/firestore";

/* ----------------------------------------------------------------
   ✅ Subscription Popup Component with Plan Rules & Dev Toggle
---------------------------------------------------------------- */

// 🧪 Toggle between Development and Production
const DEV_MODE = true; // ⚙️ Set false for live production

// ⏳ Helper — difference in months between now and timestamp
function monthsSince(timestamp) {
  if (!timestamp) return 0;
  const now = new Date();
  const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = now - then;
  return diffMs / (1000 * 60 * 60 * 24 * 30);
}

function SubscriptionPopup({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planStart, setPlanStart] = useState(null);
  const [plansData, setPlansData] = useState({});
  const [congratsPlan, setCongratsPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState(null);

  // ✅ Fetch Auth + Plan
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPlan(data.plan || "lakshya");
            setPlanStart(data.planStart || null);
          }
        });
        return () => unsubDoc();
      } else {
        setPlan(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // ✅ Fetch Plans Data from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      const snap = await getDocs(collection(db, "plans"));
      const data = {};
      snap.forEach((doc) => (data[doc.id] = doc.data()));
      setPlansData(data);
    };
    fetchPlans();
  }, []);

  // 🔒 Plan Rules Logic
  const canUpgrade = (current, target, monthsActive) => {
    if (DEV_MODE) return true; // ✅ In dev mode, all allowed

    const hierarchy = ["lakshya", "safalta", "shikhar", "samarpan"];
    const currentIndex = hierarchy.indexOf(current);
    const targetIndex = hierarchy.indexOf(target);

    // same plan
    if (current === target) return false;

    // Upgrade always allowed (except time-based blocks)
    if (targetIndex > currentIndex) {
      if (current === "safalta" && monthsActive < 1) return false; // less than 1 month
      if (current === "shikhar" && monthsActive < 5) return false; // less than 5 months
      return true;
    }

    // Downgrades restricted
    if (targetIndex < currentIndex) {
      if (current === "samarpan" && monthsActive < 12) return false;
      return false;
    }

    return false;
  };

  // ✅ Choose Plan
  const choosePlan = async (planKey) => {
    if (!user) {
      alert("Please log in to subscribe!");
      return;
    }

    const monthsActive = monthsSince(planStart);
    if (!canUpgrade(plan || "lakshya", planKey, monthsActive)) {
      setWarning(
        `You cannot switch to ${planKey.toUpperCase()} yet. Please wait — your current plan is still within its minimum active duration.`
      );
      setTimeout(() => setWarning(null), 5000);
      return;
    }

    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          plan: planKey,
          planStart: serverTimestamp(),
        },
        { merge: true }
      );
      setCongratsPlan(planKey);
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const orderedPlans = ["lakshya", "safalta", "shikhar", "samarpan"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sub-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="sub-modal"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90vw] h-[85vh] max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-[#0b0b0b]"
          >
            {/* Background */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(1200px 600px at 10% -10%, rgba(0,144,222,0.25), transparent 60%), linear-gradient(135deg, #0b0b0b 5%, #111827 35%, #0f3c66 70%, #0b1220 100%)",
              }}
            />

            {/* Close Button */}
            <button
              aria-label="Close subscription popup"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/90 hover:text-white transition z-20"
            >
              <FaTimes size={20} />
            </button>

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-white text-2xl md:text-3xl font-semibold tracking-tight">
                  Choose Your Plan
                </h2>
                <p className="text-white/80 text-sm md:text-base mt-1">
                  {!user
                    ? "Please login to view or upgrade your subscription."
                    : plan
                    ? `Your current plan: ${plansData[plan]?.title || plan}`
                    : "No active plan"}
                </p>
              </div>
              <div className="text-sm text-gray-400 italic">
                {DEV_MODE ? "🧪 Dev Mode Active" : ""}
              </div>
            </div>

            {/* Warning Banner */}
            <AnimatePresence>
              {warning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mx-8 mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg flex items-center gap-2"
                >
                  <FaExclamationTriangle />
                  <span>{warning}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 pb-8">
              <AllPlansGrid
                user={user}
                plan={plan}
                plansData={plansData}
                onChoose={choosePlan}
                saving={saving}
              />
            </div>
          </motion.div>

          {/* Congratulations Popup */}
          <AnimatePresence>
            {congratsPlan && (
              <CongratsModal
                planKey={congratsPlan}
                planTitle={plansData[congratsPlan]?.title}
                onClose={() => setCongratsPlan(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------
   All Plans Unified Grid
----------------------------- */
function AllPlansGrid({ user, plan, plansData, onChoose, saving }) {
  const orderedPlans = ["lakshya", "safalta", "shikhar", "samarpan"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto">
      {orderedPlans.map((key) => {
        const p = plansData[key];
        if (!p) return null;

        const accent =
          key === "samarpan"
            ? "#F59E0B"
            : key === "shikhar"
            ? "#34D399"
            : key === "safalta"
            ? "#60A5FA"
            : "#9CA3AF";

        const isActive = plan === key || (!plan && key === "lakshya");

        return (
          <motion.div
            key={key}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`relative rounded-2xl p-6 flex flex-col backdrop-blur-md border ${
              isActive
                ? "bg-gradient-to-b from-cyan-900/40 to-cyan-800/30 border-cyan-400"
                : "bg-gray-900/50 border-gray-700"
            } text-white shadow-lg transition`}
          >
            {isActive && (
              <span className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 bg-green-600 text-white rounded-full shadow-md">
                Active
              </span>
            )}

            <div
              className="h-2 w-full rounded-md mb-4"
              style={{
                background: `linear-gradient(90deg, ${accent}, transparent)`,
              }}
            />

            <h3 className="text-xl font-semibold">{p.title}</h3>
            {p.price && <p className="text-sm text-gray-300 mt-1">{p.price}</p>}

            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              {(p.features || []).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FaCheck className="text-emerald-400" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <button
                disabled={isActive || saving}
                onClick={() => !isActive && !saving && onChoose(key)}
                className={`w-full rounded-lg font-medium py-2 transition ${
                  isActive
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : saving
                    ? "bg-blue-500/70 text-white cursor-wait"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isActive
                  ? "Active"
                  : saving
                  ? "Processing..."
                  : `Choose ${p.title}`}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ----------------------------
   Congratulations Modal
----------------------------- */
function CongratsModal({ planKey, planTitle, onClose }) {
  return (
    <motion.div
      key="congrats-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        key="congrats-card"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92%] max-w-[480px] rounded-2xl bg-white shadow-2xl p-8 text-center"
      >
        <FaCheckCircle className="mx-auto mb-3" size={52} color="#10B981" />
        <h3 className="text-2xl font-bold text-gray-900">Congratulations!</h3>
        <p className="mt-2 text-gray-700">
          You have successfully subscribed to <b>{planTitle || planKey}</b>.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default SubscriptionPopup;
