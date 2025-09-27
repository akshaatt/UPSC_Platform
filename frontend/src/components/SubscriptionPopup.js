import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheck } from "react-icons/fa";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function SubscriptionPopup({ isOpen, onClose }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[85vw] h-[85vh] max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Background */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(135deg, #0b0b0b 5%, #111827 30%, #0090DE 65%, #ffffff 100%)",
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
                {user
                  ? "Lakshya is your current plan. Upgrade to unlock more features."
                  : "Please login to view or upgrade your subscription."}
              </p>
            </div>

            {/* Cards */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-4 gap-6 w-[70%] h-full">
                <CardCurrent user={user} />

                {/* Upgrade Plans */}
                <div className="col-span-3 grid grid-cols-3 gap-6">
                  <CardUpgrade
                    title="Safalta Plan"
                    price="₹189 / month"
                    accent="#60A5FA"
                    features={[
                      "Full Library Access",
                      "AI Q&A Assistant",
                      "Mock Tests (basic)",
                    ]}
                    user={user}
                  />
                  <CardUpgrade
                    title="Shikhar Plan"
                    price="₹589 / 5 months"
                    accent="#34D399"
                    features={[
                      "Priority Doubt Rooms",
                      "Full Mock Test Series",
                      "Detailed Analytics",
                    ]}
                    user={user}
                  />
                  <CardUpgrade
                    title="Samarpan Plan"
                    price="₹989 / 12 months"
                    accent="#F59E0B"
                    features={[
                      "All Premium Features",
                      "1 Year Unlimited Access",
                      "Exclusive Mentorship",
                    ]}
                    user={user}
                  />
                </div>
              </div>

              {/* Mobile layout */}
              <div className="md:hidden w-[92%] space-y-4">
                <CardCurrent user={user} />
                <CardUpgrade
                  title="Safalta Plan"
                  price="₹189 / month"
                  accent="#60A5FA"
                  features={[
                    "Full Library Access",
                    "AI Q&A Assistant",
                    "Mock Tests (basic)",
                  ]}
                  user={user}
                />
                <CardUpgrade
                  title="Shikhar Plan"
                  price="₹589 / 5 months"
                  accent="#34D399"
                  features={[
                    "Priority Doubt Rooms",
                    "Full Mock Test Series",
                    "Detailed Analytics",
                  ]}
                  user={user}
                />
                <CardUpgrade
                  title="Samarpan Plan"
                  price="₹989 / 12 months"
                  accent="#F59E0B"
                  features={[
                    "All Premium Features",
                    "1 Year Unlimited Access",
                    "Exclusive Mentorship",
                  ]}
                  user={user}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------
   Current Plan Card
----------------------------- */
function CardCurrent({ user }) {
  if (!user) {
    return (
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="col-span-1 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-white/40 p-4 flex flex-col"
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

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="col-span-1 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-white/40 p-4 flex flex-col"
    >
      <span className="inline-block self-start px-3 py-1 text-xs font-semibold rounded-full bg-black text-white">
        Current Plan
      </span>

      <h3 className="mt-3 text-lg font-semibold text-gray-900">Lakshya Plan</h3>
      <p className="text-sm text-gray-600 mt-1">Free plan with limited features.</p>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        <li className="flex items-center gap-2">
          <FaCheck className="text-emerald-500" /> Limited Library
        </li>
        <li className="flex items-center gap-2">
          <FaCheck className="text-emerald-500" /> Basic Doubt Rooms
        </li>
        <li className="flex items-center gap-2">
          <FaCheck className="text-emerald-500" /> Community Access
        </li>
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

/* --------------------------------
   Upgrade Plan Cards
---------------------------------- */
function CardUpgrade({ title, price, features, accent = "#0090DE", user }) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-white/40 p-5 flex flex-col hover:shadow-xl transition"
    >
      <div
        className="h-2 w-full rounded-md mb-4"
        style={{ background: `linear-gradient(90deg, ${accent}, #111827)` }}
      />
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{price}</p>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <FaCheck className="text-emerald-500" /> {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        {user ? (
          <button
            className="w-full rounded-lg bg-[#0090DE] text-white font-medium py-2 hover:brightness-110 transition"
            onClick={() => alert(`Subscribed to ${title}`)}
          >
            Choose {title}
          </button>
        ) : (
          <p className="text-xs text-gray-500 text-center">
            Login required to subscribe
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default SubscriptionPopup;
