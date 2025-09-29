import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import classNames from "classnames";
import Logo from "../components/Logo.jsx";
import { ADMIN_CREDENTIALS } from "../lib/credentials.js";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", phone: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Step 1: check credentials.js
    const ok =
      form.username.trim() === ADMIN_CREDENTIALS.username &&
      form.password === ADMIN_CREDENTIALS.password &&
      form.phone.trim() === ADMIN_CREDENTIALS.phone;

    if (!ok) {
      setError("Invalid credentials. Please check username, password, and phone.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      // ✅ Step 2: Login into Firebase Auth
      const userCred = await signInWithEmailAndPassword(
        auth,
        "satyapathupsc@gmail.com",
        "Mnaghmaob25@"
      );

      console.log("Logged in as:", userCred.user.uid);

      // ✅ Step 3: Store flag and redirect
      localStorage.setItem("admin_auth", "true");
      nav("/dashboard", { replace: true });
    } catch (err) {
      console.error("Firebase login failed:", err);
      setError("Firebase login failed: " + err.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-black to-blue-950" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass w-full max-w-md rounded-2xl p-8 bg-black/60 border border-cyan-500/40"
        >
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <span className="text-xs text-cyan-400">v1.0 • Secure Access</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-cyan-300">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-400">
              Please authenticate to proceed.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className={classNames({ "animate-shake": !!error })}
          >
            <label className="block mb-3">
              <span className="mb-1 block text-sm text-gray-400">Username</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500">
                  <User size={18} />
                </span>
                <input
                  className="w-full bg-black/40 border border-cyan-600 rounded-lg pl-10 p-2 text-white"
                  name="username"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={onChange}
                />
              </div>
            </label>

            <label className="block mb-3">
              <span className="mb-1 block text-sm text-gray-400">Password</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500">
                  <Lock size={18} />
                </span>
                <input
                  className="w-full bg-black/40 border border-cyan-600 rounded-lg pl-10 pr-10 p-2 text-white"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={onChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block mb-3">
              <span className="mb-1 block text-sm text-gray-400">Phone</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500">
                  <Phone size={18} />
                </span>
                <input
                  className="w-full bg-black/40 border border-cyan-600 rounded-lg pl-10 p-2 text-white"
                  name="phone"
                  placeholder="Enter phone"
                  value={form.phone}
                  onChange={onChange}
                />
              </div>
            </label>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold"
            >
              Sign in
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
