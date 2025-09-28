import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheck, FaCheckCircle } from "react-icons/fa";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

function SubscriptionPopup({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [congratsPlan, setCongratsPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  // auth + plan listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          const p = snap.exists() ? snap.data().plan : null;
          setPlan(p);
        });
        return () => unsubDoc();
      } else {
        setPlan(null);
      }
    });
    return () => unsubAuth();
  }, []);

  const choosePlan = async (planName) => {
    if (!user) {
      alert("Please log in to subscribe!");
      return;
    }
    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          plan: planName,
          planStart: serverTimestamp(), // ✅ store start time
        },
        { merge: true }
      );
      setCongratsPlan(planName);
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
          {/* Main Popup */}
          <motion.div
            key="sub-modal"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.17, 0.67, 0.83, 0.67] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[85vw] h-[85vh] max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-white text-2xl md:text-3xl font-semibold tracking-tight">
                Choose Your Plan
              </h2>
              <p className="text-white/80 text-sm md:text-base mt-1">
                {!user
                  ? "Please login to view or upgrade your subscription."
                  : plan
                  ? `Your current plan: ${titleFromKey(plan)}`
                  : "No active plan"}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-4 gap-6 w-[80%] h-full">
                <CardCurrent user={user} plan={plan} />

                <div className="col-span-3 grid grid-cols-3 gap-6">
                  <CardUpgrade
                    title="Safalta Plan"
                    price="₹189 / month"
                    accent="#60A5FA"
                    features={["Full Library Access", "AI Q&A Assistant", "Mock Tests (basic)"]}
                    user={user}
                    isCurrent={plan === "safalta"}
                    saving={saving}
                    onChoose={() => choosePlan("safalta")}
                  />
                  <CardUpgrade
                    title="Shikhar Plan"
                    price="₹589 / 5 months"
                    accent="#34D399"
                    features={["Priority Doubt Rooms", "Full Mock Test Series", "Detailed Analytics"]}
                    user={user}
                    isCurrent={plan === "shikhar"}
                    saving={saving}
                    onChoose={() => choosePlan("shikhar")}
                  />
                  <CardUpgrade
                    title="Samarpan Plan"
                    price="₹989 / 12 months"
                    accent="#F59E0B"
                    features={["All Premium Features", "1 Year Unlimited Access", "Exclusive Mentorship"]}
                    user={user}
                    isCurrent={plan === "samarpan"}
                    saving={saving}
                    onChoose={() => choosePlan("samarpan")}
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden w-[92%] space-y-4">
                <CardCurrent user={user} plan={plan} />
                <CardUpgrade
                  title="Safalta Plan"
                  price="₹189 / month"
                  accent="#60A5FA"
                  features={["Full Library Access", "AI Q&A Assistant", "Mock Tests (basic)"]}
                  user={user}
                  isCurrent={plan === "safalta"}
                  saving={saving}
                  onChoose={() => choosePlan("safalta")}
                />
                <CardUpgrade
                  title="Shikhar Plan"
                  price="₹589 / 5 months"
                  accent="#34D399"
                  features={["Priority Doubt Rooms", "Full Mock Test Series", "Detailed Analytics"]}
                  user={user}
                  isCurrent={plan === "shikhar"}
                  saving={saving}
                  onChoose={() => choosePlan("shikhar")}
                />
                <CardUpgrade
                  title="Samarpan Plan"
                  price="₹989 / 12 months"
                  accent="#F59E0B"
                  features={["All Premium Features", "1 Year Unlimited Access", "Exclusive Mentorship"]}
                  user={user}
                  isCurrent={plan === "samarpan"}
                  saving={saving}
                  onChoose={() => choosePlan("samarpan")}
                />
              </div>
            </div>
          </motion.div>

          {/* Congratulations Popup */}
          <AnimatePresence>
            {congratsPlan && (
              <CongratsModal planKey={congratsPlan} onClose={() => setCongratsPlan(null)} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------
   Helpers
----------------------------- */
const titleFromKey = (key) => {
  switch (key) {
    case "lakshya":
      return "Lakshya Plan";
    case "safalta":
      return "Safalta Plan";
    case "shikhar":
      return "Shikhar Plan";
    case "samarpan":
      return "Samarpan Plan";
    default:
      return "Unknown Plan";
  }
};

const currentFeatures = (planKey) => {
  switch (planKey) {
    case "safalta":
      return ["Full Library Access", "AI Q&A Assistant", "Mock Tests (basic)"];
    case "shikhar":
      return ["Priority Doubt Rooms", "Full Mock Test Series", "Detailed Analytics"];
    case "samarpan":
      return ["All Premium Features", "1 Year Unlimited Access", "Exclusive Mentorship"];
    case "lakshya":
      return ["Limited Library", "Basic Doubt Rooms", "Community Access"];
    default:
      return [];
  }
};

/* ----------------------------
   Current Plan Card
----------------------------- */
function CardCurrent({ user, plan }) {
  if (!user) {
    return (
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="col-span-1 rounded-xl bg-white/95 shadow-lg border border-white/40 p-4 flex flex-col"
      >
        <span className="inline-block self-start px-3 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
          Kindly Login
        </span>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">No Active Plan</h3>
        <p className="text-sm text-gray-600 mt-1">
          Please log in to view or activate your subscription.
        </p>
        <div className="mt-auto pt-4">
          <button
            disabled
            className="w-full rounded-lg bg-gray-200 text-gray-500 font-medium py-2 cursor-not-allowed"
          >
            Not Available
          </button>
        </div>
      </motion.div>
    );
  }

  if (plan === "lakshya" || !plan) {
    const feats = currentFeatures("lakshya");
    return (
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="col-span-1 rounded-xl bg-white/95 shadow-lg border border-white/40 p-4 flex flex-col"
      >
        <span className="inline-block self-start px-3 py-1 text-xs font-semibold rounded-full bg-black text-white">
          Current Plan
        </span>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">Lakshya Plan</h3>
        <p className="text-sm text-gray-600 mt-1">Free plan with limited features.</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {feats.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <FaCheck className="text-emerald-500" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4">
          <button
            disabled
            className="w-full rounded-lg bg-gray-200 text-gray-500 font-medium py-2 cursor-not-allowed"
          >
            Current
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="col-span-1 rounded-xl bg-gray-100 shadow-lg border border-gray-200 p-4 flex flex-col"
    >
      <h3 className="text-lg font-semibold text-gray-700">Lakshya Plan</h3>
      <p className="text-sm text-gray-500 mt-1">
        Not available once you subscribe to a higher plan.
      </p>
      <div className="mt-auto pt-4">
        <button
          disabled
          className="w-full rounded-lg bg-gray-300 text-gray-500 font-medium py-2 cursor-not-allowed"
        >
          Not Available
        </button>
      </div>
    </motion.div>
  );
}

/* ----------------------------
   Upgrade Plan Card
----------------------------- */
function CardUpgrade({ title, price, features, accent, user, isCurrent, saving, onChoose }) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl bg-white/95 shadow-lg border border-white/40 p-5 flex flex-col hover:shadow-xl transition"
    >
      <div
        className="h-2 w-full rounded-md mb-4"
        style={{ background: `linear-gradient(90deg, ${accent}, #111827)` }}
      />
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {price && <p className="text-sm text-gray-600 mt-1">{price}</p>}
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <FaCheck className="text-emerald-500" /> {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        {!user ? (
          <p className="text-xs text-gray-500 text-center">Login required to subscribe</p>
        ) : (
          <button
            disabled={isCurrent || saving}
            onClick={() => !isCurrent && !saving && onChoose && onChoose()}
            className={`w-full rounded-lg font-medium py-2 transition ${
              isCurrent
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : saving
                ? "bg-blue-500/70 text-white cursor-wait"
                : "bg-blue-500 text-white hover:brightness-110"
            }`}
          >
            {isCurrent ? "Current" : saving ? "Processing..." : `Choose ${title}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ----------------------------
   Congratulations Modal
----------------------------- */
function CongratsModal({ planKey, onClose }) {
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
        transition={{ duration: 0.35, ease: [0.17, 0.67, 0.83, 0.67] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92%] max-w-[480px] rounded-2xl bg-white shadow-2xl p-8 text-center"
      >
        <FaCheckCircle className="mx-auto mb-3" size={52} color="#10B981" />
        <h3 className="text-2xl font-bold text-gray-900">Congratulations!</h3>
        <p className="mt-2 text-gray-700">
          You have successfully subscribed to <b>{titleFromKey(planKey)}</b>.
        </p>
        <div className="relative h-0">
          <ConfettiBurst />
        </div>
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

/* ----------------------------
   Confetti Burst
----------------------------- */
function ConfettiBurst() {
  const pieces = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none absolute inset-0 -translate-y-4 flex items-center justify-center">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        const tx = Math.cos(angle) * radius;
        const ty = Math.sin(angle) * radius;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0.8, x: tx, y: ty }}
            transition={{ duration: 0.8, ease: [0.17, 0.67, 0.83, 0.67] }}
            className="absolute h-2 w-2 rounded-sm"
            style={{
              background: i % 3 === 0 ? "#60A5FA" : i % 3 === 1 ? "#34D399" : "#F59E0B",
            }}
          />
        );
      })}
    </div>
  );
}

export default SubscriptionPopup;
