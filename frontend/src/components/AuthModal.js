// src/components/AuthModal.js
import React, { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaTwitter, FaApple } from "react-icons/fa";

function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const triggerClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 1500); // match animation time
  };

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", res.user.uid), {
          name: form.name,
          email: form.email,
        });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      triggerClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await setDoc(
        doc(db, "users", res.user.uid),
        {
          email: res.user.email,
          name: res.user.displayName,
          photoURL: res.user.photoURL,
        },
        { merge: true }
      );
      triggerClose();
    } catch (err) {
      alert(err.message);
    }
  };

  // more fragments for Thanos snap
  const particles = Array.from({ length: 120 });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={triggerClose}
        >
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-96"
          >
            {/* Dust Particles */}
            {closing &&
              particles.map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute w-1 h-1 bg-white dark:bg-gray-700 rounded"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 1 }}
                  animate={{
                    x: Math.random() * 400,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              ))}

            {/* Modal Content */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative z-10 ${
                closing ? "animate-disintegrate" : ""
              }`}
            >
              <h2 className="text-xl font-bold mb-4">
                {isRegister ? "Register" : "Sign In"}
              </h2>

              {isRegister && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="border p-2 w-full mb-2"
                  onChange={handleChange}
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="border p-2 w-full mb-2"
                onChange={handleChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="border p-2 w-full mb-4"
                onChange={handleChange}
              />

              <button
                onClick={handleSubmit}
                className="w-full bg-purple-600 text-white p-2 rounded mb-3"
              >
                {isRegister ? "Register" : "Sign In"}
              </button>

              {/* Social Login Icons */}
              <div className="flex justify-center gap-6 mb-4">
                <button
                  onClick={handleGoogleLogin}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                >
                  <FaGoogle className="text-red-500 text-xl" />
                </button>
                <button
                  onClick={() => alert("Twitter login coming soon!")}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                >
                  <FaTwitter className="text-sky-500 text-xl" />
                </button>
                <button
                  onClick={() => alert("Apple login coming soon!")}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                >
                  <FaApple className="text-black dark:text-white text-xl" />
                </button>
              </div>

              <p
                className="text-blue-600 cursor-pointer text-sm text-center"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Already have an account? Sign In" : "New user? Register here"}
              </p>

              <button
                onClick={triggerClose}
                className="mt-4 text-gray-600 text-sm w-full"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
