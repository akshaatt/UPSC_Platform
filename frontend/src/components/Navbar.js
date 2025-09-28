import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, DEFAULT_AVATAR, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import AuthModal from "./AuthModal";
import SubscriptionPopup from "./SubscriptionPopup";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const navigate = useNavigate();

  // Listen to auth + user doc (plan, photoURL, etc.)
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

  // close dropdown if clicked outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const avatarSrc = (user?.photoURL || userDoc?.photoURL || DEFAULT_AVATAR);

  return (
    <nav className="bg-black shadow-md shadow-gray-800/40 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1
          className="text-2xl font-bold cursor-pointer"
          style={{ color: "#0090DE" }}
          onClick={() => navigate("/")}
        >
          Satyapath
        </h1>

        {/* Links */}
        <div className="hidden md:flex space-x-8 text-white font-medium items-center">
          <button
            onClick={() => navigate("/services")}
            className="hover:text-[#0090DE] transition"
          >
            Services
          </button>
          <button
            onClick={() => navigate("/downloads")}
            className="hover:text-[#0090DE] transition"
          >
            Downloads
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="hover:text-[#0090DE] transition"
          >
            Contact Us
          </button>
          <button
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

        {/* Auth / Dropdown */}
        {user ? (
          <div className="relative dropdown">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-white"
            >
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              />
              {user.displayName || userDoc?.firstName || "User"}
              <span>▼</span>
            </button>

            {/* Animated Dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  key="dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
                >
                  {/* Plan badge */}
                  {plan && (
                    <div className="px-4 py-3 text-sm font-semibold text-center bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      <span className="px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs tracking-wide shadow-sm">
                        {titleFromKey(plan)} Plan
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Dashboard
                  </button>
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
            onClick={() => setIsAuthOpen(true)}
            className="px-5 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "#0090DE" }}
          >
            Sign In / Register
          </button>
        )}
      </div>

      {/* Modals (local control) */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
    </nav>
  );
}

/* Helper: Convert key → display name */
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
