// src/components/AuthModal.js
import React, { useState, useEffect, useRef } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc, // ✅ used to immediately flip isVerified in Firestore after OTP success
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaTwitter, FaApple } from "react-icons/fa";
import { getFunctions, httpsCallable } from "firebase/functions";

function AuthModal({ isOpen, onClose }) {
  // ---------------- UI state ----------------
  const [isRegister, setIsRegister] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);

  // ---------------- Auth state ----------------
  const [user, setUser] = useState(null);

  // ---------------- OTP state ----------------
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // refs for 6 inputs & mount focusing
  const otpRefs = useRef([]);
  const firstOtpMountRef = useRef(false);

  // Firebase Functions
  const functions = getFunctions();

  // ---------------- Effects ----------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // countdown for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // focus the first OTP box when popup appears (only once per showing)
  useEffect(() => {
    if (showOtpPopup && !firstOtpMountRef.current) {
      firstOtpMountRef.current = true;
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    }
    if (!showOtpPopup) {
      firstOtpMountRef.current = false;
    }
  }, [showOtpPopup]);

  // allow Enter key to submit OTP quickly
  useEffect(() => {
    if (!showOtpPopup) return;
    const handler = (e) => {
      if (e.key === "Enter") handleOtpSubmit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showOtpPopup, otpDigits]); // eslint-disable-line

  // ---------------- Handlers ----------------
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const triggerClose = () => {
    // do not allow closing while OTP verification stage is visible
    if (showOtpPopup) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 800);
  };

  const handleSubmit = async () => {
    try {
      setAuthLoading(true);
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

        // create base user doc
        await setDoc(doc(db, "users", res.user.uid), {
          name: form.name,
          email: form.email,
          isVerified: false, // 🔒 force OTP verification
          createdAt: new Date().toISOString(),
        });

        // request OTP from Cloud Function
        const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
        await reqOtp({ uid: res.user.uid });

        // show OTP popup
        setShowOtpPopup(true);
        setResendTimer(60);
      } else {
        // normal login
        const res = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

        // send login email (backend checks first/verified login)
        const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
        await sendLogin({ uid: res.user.uid });

        triggerClose();
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const res = await signInWithPopup(auth, googleProvider);

      // ensure user doc exists (or merge updates)
      await setDoc(
        doc(db, "users", res.user.uid),
        {
          email: res.user.email,
          name: res.user.displayName || "",
          photoURL: res.user.photoURL || null,
          isVerified: false, // 🔒 requires OTP on first time
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // request OTP & show popup
      const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
      await reqOtp({ uid: res.user.uid });
      setShowOtpPopup(true);
      setResendTimer(60);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const copy = [...otpDigits];
    copy[idx] = val;
    setOtpDigits(copy);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) {
      // allow backspace to move focus back
      const active = document.activeElement;
      if (active && active.value === "") {
        otpRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const arr = pasted.split("");
    const next = ["", "", "", "", "", ""].map((_, i) => arr[i] || "");
    setOtpDigits(next);
    setTimeout(() => {
      const lastFilled = Math.max(0, next.findLastIndex((d) => d !== ""));
      otpRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
    }, 0);
  };

  const handleOtpSubmit = async () => {
    try {
      setLoadingOtp(true);
      setOtpError("");
      const code = otpDigits.join("");
      if (code.length !== 6) {
        setOtpError("Please enter all 6 digits.");
        setLoadingOtp(false);
        return;
      }

      // 1) verify OTP in backend
      const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
      await verifyOtp({ uid: user.uid, code });

      // 2) 🔑 Immediately mark verified locally in Firestore
      await updateDoc(doc(db, "users", user.uid), { isVerified: true });

      // 3) send account-created (if first) + login-success email
      const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
      await sendLogin({ uid: user.uid });

      // 4) close OTP + modal
      setShowOtpPopup(false);
      setOtpDigits(["", "", "", "", "", ""]);
      triggerClose();
    } catch (err) {
      console.error(err);
      setOtpError(err?.message || "OTP verification failed.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
      await reqOtp({ uid: user.uid });
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      console.error(err);
      alert("Failed to resend OTP. Try again.");
    }
  };

  // particles for the disintegration animation
  const particles = Array.from({ length: 120 });

  if (!isOpen) return null;

  // ---------------- Render ----------------
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // ⛔ Do NOT close when clicking backdrop if OTP popup is active
          onClick={() => {
            if (!showOtpPopup) triggerClose();
          }}
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
                  className="border p-2 w-full mb-2 rounded"
                  onChange={handleChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="border p-2 w-full mb-2 rounded"
                onChange={handleChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="border p-2 w-full mb-4 rounded"
                onChange={handleChange}
              />

              <button
                onClick={handleSubmit}
                disabled={authLoading}
                className="w-full bg-purple-600 text-white p-2 rounded mb-3 disabled:opacity-50"
              >
                {authLoading
                  ? isRegister
                    ? "Creating account…"
                    : "Signing in…"
                  : isRegister
                  ? "Register"
                  : "Sign In"}
              </button>

              {/* Social Logins */}
              <div className="flex justify-center gap-6 mb-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
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
                onClick={() => setIsRegister((s) => !s)}
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "New user? Register here"}
              </p>
            </div>
          </motion.div>

          {/* OTP POPUP */}
          <AnimatePresence>
            {showOtpPopup && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/60 z-[200]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg text-center w-96"
                  onPaste={handleOtpPaste}
                >
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                    Verify Your Email
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Enter the 6-digit OTP sent to your email to activate your
                    account.
                  </p>

                  {/* OTP Inputs */}
                  <div className="flex justify-between mb-4">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        inputMode="numeric"
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        className="w-10 h-12 border rounded text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#0090DE]"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-red-500 text-sm mb-2">{otpError}</p>
                  )}

                  <button
                    onClick={handleOtpSubmit}
                    disabled={loadingOtp}
                    className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loadingOtp ? "Verifying…" : "Verify OTP"}
                  </button>

                  <div className="mt-3">
                    <button
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className="text-blue-600 text-sm disabled:opacity-50"
                    >
                      {resendTimer > 0
                        ? `Resend OTP in ${resendTimer}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
