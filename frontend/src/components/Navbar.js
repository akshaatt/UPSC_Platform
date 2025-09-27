import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, DEFAULT_AVATAR } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AuthModal from "./AuthModal";
import SubscriptionPopup from "./SubscriptionPopup";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // close dropdown if clicked outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

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
        <div className="hidden md:flex space-x-8 text-white font-medium">
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
            className="hover:text-[#0090DE] transition"
          >
            Subscription
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
                src={user.photoURL || DEFAULT_AVATAR}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
              {user.displayName || "User"}
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
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
                >
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

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
    </nav>
  );
}

export default Navbar;
