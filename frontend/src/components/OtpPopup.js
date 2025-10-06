// src/components/UserInfoPopup.jsimport React, { useState, useEffect, useRef } from "react";
import { auth, googleProvider, db } from "../firebase";
import React, { useState, useEffect, useRef } from "react";
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from "firebase/auth";
import {
    doc,
    setDoc,
    updateDoc,
    getDoc// ✅ used to immediately flip isVerified in Firestore after OTP success
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaTwitter, FaApple } from "react-icons/fa";
import { getFunctions, httpsCallable } from "firebase/functions";
import UserInfoPopup from "./UserInfoPopup";
import { onSnapshot } from "firebase/firestore";

export default function OtpPopup({ isOpen, onClose, userData }) {
      const [isRegister, setIsRegister] = useState(false);
      const [closing, setClosing] = useState(false);
      const [name, setName] = useState('');
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [phone, setPhone] = useState('');
      // const [password, setPassword] = useState('');
      const [form, setForm] = useState({ name: "", email: "", password: "" });
      const [authLoading, setAuthLoading] = useState(false);
      const [showInfoPopup, setShowInfoPopup] = useState(false);
    
      const [user, setUser] = useState(null);
    
      const [showOtpPopup, setShowOtpPopup] = useState(false);
      const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
      const [otpError, setOtpError] = useState("");
      const [loadingOtp, setLoadingOtp] = useState(false);
      const [resendTimer, setResendTimer] = useState(0);
      const [isAuthModal, setIsAuthModal] = useState(false);
    
      const otpRefs = useRef([]);
      const firstOtpMountRef = useRef(false);
    
      const functions = getFunctions();
    
    // if (!isOpen || !user) return null;
console.log(onClose, "userDatauserData");

useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      // setUser(u);
      console.log(u, "from navbar");
      
      if (u) {
        // setIsAuthOpen(false);
        setUser(u);
        // setIsOtpPopup(true);
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          const data = snap.exists() ? snap.data() : null;
        });
        return () => unsubDoc();
      } else {
        // setUserDoc(null);
        // setPlan(null);
        // setIsAuthOpen(false);
      }
    });
    return () => unsubAuth();
}, []);
    
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

    const triggerClose = (callback) => {
        if (showOtpPopup) return; // don't close while OTP popup visible
        setClosing(true);
        onClose();
        setTimeout(() => {
          setClosing(false);
          if (callback) callback();
        }, 500); // match your exit animation duration
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
      
          const currentUser = auth.currentUser; // ✅ get logged in user
          if (!currentUser) {
            setOtpError("No user found. Please login again.");
            setLoadingOtp(false);
            return;
          }
      
          const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
          await verifyOtp({ uid: currentUser.uid, code });
      
          await updateDoc(doc(db, "users", currentUser.uid), { isVerified: true });
      
          const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
          await sendLogin({ uid: currentUser.uid });
      
          setShowOtpPopup(false); // ✅ close OTP popup
          onClose(); // ✅ close Auth modal too
          setOtpDigits(["", "", "", "", "", ""]);
      
          if (userData?.setUser) {
            userData.setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || "",
              photoURL: currentUser.photoURL || null,
            });
          }
        } catch (err) {
          console.error(err);
          setOtpError(err?.message || "OTP verification failed.");
        } finally {
          setLoadingOtp(false);
        }
      };
      
    
    // const handleOtpSubmit = async () => {
    //     try {
    //         setLoadingOtp(true);
    //         setOtpError("");
    //         const code = otpDigits.join("");

    //         if (code.length !== 6) {
    //             setOtpError("Please enter all 6 digits.");
    //             setLoadingOtp(false);
    //             return;
    //         }
    //         const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
    //         const isVerify = await verifyOtp({ uid: user.uid, code });
    //         console.log("hit here for otp", verifyOtp);
    //         if (isVerify) {
    //             console.log("hit here for otp");
                
    //             await updateDoc(doc(db, "users", user.uid), { isVerified: true });

    //             const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
    //             await sendLogin({ uid: user.uid });
    //             setShowOtpPopup(false);
    //             onClose();
    //             console.log(isAuthModal, "authClose hit here");
    
              
    //             setOtpDigits(["", "", "", "", "", ""]);
    //             if (userData?.setUser) {
    //                 userData.setUser({
    //                     uid: user.uid,
    //                     email: user.email,
    //                     name: user.displayName || "",
    //                     photoURL: user.photoURL || null,
    //                 });
    //             }
    //         }
          
    //         // setOtpDigits(["", "", "", "", "", ""]);
           
    //     } catch (err) {
    //         console.error(err);
    //         setOtpError(err?.message || "OTP verification failed.");
    //     } finally {
    //         setLoadingOtp(false);
    //     }
    // };

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

    const particles = Array.from({ length: 120 });

    if (!isOpen) {
        console.log("!open");

        return null;
    }

    return (
        <AnimatePresence>

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


        </AnimatePresence>
    );
}

