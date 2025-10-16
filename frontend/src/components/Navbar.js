// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, DEFAULT_AVATAR, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import AuthModal from "./AuthModal";
import SubscriptionPopup from "./SubscriptionPopup";
import ContactUsModal from "./ContactUsModal";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

function Navbar() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [exclusivePopup, setExclusivePopup] = useState(false);
  const [plan, setPlan] = useState(null);
  const navigate = useNavigate();

  // 🔹 Firebase Auth & User Snapshot
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          const data = snap.exists() ? snap.data() : null;
          setUserDoc(data);
          setPlan(data?.plan || null);
        });
        return () => unsubDoc();
      } else {
        setUserDoc(null);
        setPlan(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // 🔹 Close dropdown on outside click
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const avatarSrc = user?.photoURL || userDoc?.photoURL || DEFAULT_AVATAR;

  // 🔹 Smooth scroll to section
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // If the user is on a different page, go home first
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 600);
    }
  };

  // 🔹 Exclusive Notes Access Control
  const handleExclusiveClick = () => {
    if (plan === "samarpan") {
      navigate("/exclusive-notes");
    } else {
      setExclusivePopup(true);
    }
  };

  return (
    <nav className="bg-black shadow-md shadow-gray-800/40 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* 🌟 Logo */}
        <h1
          className="text-2xl font-bold cursor-pointer"
          style={{ color: "#0090DE" }}
          onClick={() => navigate("/")}
        >
          Satyapath
        </h1>

        {/* 🔗 Navigation Links */}
        <div className="hidden md:flex space-x-8 text-white font-medium items-center">
          <button
            type="button"
            onClick={() => scrollToSection("mentorship-section")}
            className="hover:text-[#0090DE] transition"
          >
            Mentorship
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("dailyExam")}
            className="hover:text-[#0090DE] transition"
          >
            Daily Quiz
          </button>
          <button
            type="button"
            onClick={handleExclusiveClick}
            className="flex items-center gap-2 hover:text-[#0090DE] transition"
          >
            <Crown size={16} /> Exclusive Notes
          </button>
          <button
            type="button"
            onClick={() => setIsContactOpen(true)}
            className="hover:text-[#0090DE] transition"
          >
            Contact Us
          </button>
          <button
            type="button"
            onClick={() => setIsSubscriptionOpen(true)}
            className="hover:text-[#0090DE] transition flex items-center gap-1"
          >
            Subscription{" "}
            {plan && (
              <span className="text-gray-400 text-xs font-normal">
                ({titleFromKey(plan)})
              </span>
            )}
          </button>
        </div>

        {/* 👤 Auth or Dropdown */}
        {user ? (
          <div className="relative dropdown">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-white"
            >
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              {user.displayName || userDoc?.firstName || "User"}
              <span>▼</span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  key="dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
                >
                  {plan && (
                    <div className="px-4 py-3 text-sm font-semibold text-center bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      <span className="px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs">
                        {titleFromKey(plan)} Plan
                      </span>
                    </div>
                  )}

              
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/library");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Library
                  </button>
                  <button
                    onClick={() => signOut(auth)}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="px-5 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "#0090DE" }}
          >
            Sign In / Register
          </button>
        )}
      </div>

      {/* 🔸 Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
      <ContactUsModal
        open={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* 🔸 Exclusive Notes Restriction Popup */}
      <AnimatePresence>
        {exclusivePopup && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-sm text-center"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                🚀 Exclusive Feature
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This feature is only available for <b>Samarpan Plan</b> users.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setExclusivePopup(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setExclusivePopup(false);
                    setIsSubscriptionOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0090DE] hover:bg-[#007bbd] text-white rounded-lg"
                >
                  Upgrade Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* 🔹 Helper for Plan Title */
function titleFromKey(key) {
  switch (key) {
    case "lakshya":
      return "Lakshya";
    case "safalta":
      return "Safalta";
    case "shikhar":
      return "Shikhar";
    case "samarpan":
      return "Samarpan";
    default:
      return "Unknown";
  }
}

export default Navbar;
