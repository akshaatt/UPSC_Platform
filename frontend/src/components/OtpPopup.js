// src/components/OtpPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function OtpPopup({ isOpen, onClose, pendingUser, onVerified }) {
  // pendingUser: firebase user object (must contain uid)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef([]);
  const functions = getFunctions();

  useEffect(() => {
    if (isOpen) {
      setOtpDigits(["", "", "", "", "", ""]);
      setError("");
      refs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleChange = (v, i) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otpDigits];
    next[i] = v;
    setOtpDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const arr = paste.split("");
    const next = ["", "", "", "", "", ""].map((_, i) => arr[i] || "");
    setOtpDigits(next);
  };

  const verify = async () => {
    try {
      setError("");
      setLoading(true);
      const code = otpDigits.join("");
      if (code.length !== 6) {
        setError("Enter 6 digits");
        return;
      }
      if (!pendingUser?.uid) {
        setError("No user to verify. Please login again.");
        return;
      }
      const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
      await verifyOtp({ uid: pendingUser.uid, code });
      // mark user verified in Firestore
      await updateDoc(doc(db, "users", pendingUser.uid), { isVerified: true });
      // optionally call cloud function to send login email
      const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
      await sendLogin({ uid: pendingUser.uid }).catch(() => {});
      if (onVerified) onVerified(pendingUser); // parent should set user state
      onClose();
    } catch (err) {
      console.error("OTP verify err:", err);
      setError(err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (!pendingUser?.uid) {
        alert("No user to resend OTP for");
        return;
      }
      const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
      await reqOtp({ uid: pendingUser.uid });
      alert("OTP resent");
    } catch (err) {
      console.error("resend err:", err);
      alert("Failed to resend OTP");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onPaste={(e) => e.preventDefault()}>
          <h3 className="text-lg font-semibold mb-2">Verify Email</h3>
          <p className="text-sm mb-4">Enter the 6-digit code sent to your email.</p>

          <div className="flex gap-2 justify-center mb-3">
            {otpDigits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={(e) => handleChange(e.target.value, i)}
                onPaste={handlePaste}
                maxLength={1}
                className="w-10 h-10 text-center rounded border"
                inputMode="numeric"
              />
            ))}
          </div>

          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

          <button onClick={verify} disabled={loading} className="w-full py-2 rounded bg-green-600 text-white mb-2">
            {loading ? "Verifying..." : "Verify"}
          </button>

          <div className="flex justify-between text-sm">
            <button onClick={handleResend} className="text-[#0090DE]">Resend OTP</button>
            <button onClick={onClose} className="text-gray-600">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// // src/components/UserInfoPopup.jsimport React, { useState, useEffect, useRef } from "react";
// import { auth, googleProvider, db } from "../firebase";
// import React, { useState, useEffect, useRef } from "react";
// import {
//     signInWithPopup,
//     createUserWithEmailAndPassword,
//     signInWithEmailAndPassword,
//     onAuthStateChanged,
// } from "firebase/auth";
// import {
//     doc,
//     setDoc,
//     updateDoc,
//     getDoc// ✅ used to immediately flip isVerified in Firestore after OTP success
// } from "firebase/firestore";
// import { motion, AnimatePresence } from "framer-motion";
// import { FaGoogle, FaTwitter, FaApple } from "react-icons/fa";
// import { getFunctions, httpsCallable } from "firebase/functions";
// import UserInfoPopup from "./UserInfoPopup";
// import { onSnapshot } from "firebase/firestore";

// export default function OtpPopup({ isOpen, onClose, userData }) {
//       const [isRegister, setIsRegister] = useState(false);
//       const [closing, setClosing] = useState(false);
//       const [name, setName] = useState('');
//       const [email, setEmail] = useState('');
//       const [password, setPassword] = useState('');
//       const [phone, setPhone] = useState('');
//       // const [password, setPassword] = useState('');
//       const [form, setForm] = useState({ name: "", email: "", password: "" });
//       const [authLoading, setAuthLoading] = useState(false);
//       const [showInfoPopup, setShowInfoPopup] = useState(false);
    
//       const [user, setUser] = useState(null);
    
//       const [showOtpPopup, setShowOtpPopup] = useState(false);
//       const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
//       const [otpError, setOtpError] = useState("");
//       const [loadingOtp, setLoadingOtp] = useState(false);
//       const [resendTimer, setResendTimer] = useState(0);
//       const [isAuthModal, setIsAuthModal] = useState(false);
    
//       const otpRefs = useRef([]);
//       const firstOtpMountRef = useRef(false);
    
//       const functions = getFunctions();
    
//     // if (!isOpen || !user) return null;
// console.log(onClose, "userDatauserData");

// useEffect(() => {
//     const unsubAuth = onAuthStateChanged(auth, (u) => {
//       // setUser(u);
//       console.log(u, "from navbar");
      
//       if (u) {
//         // setIsAuthOpen(false);
//         setUser(u);
//         // setIsOtpPopup(true);
//         const ref = doc(db, "users", u.uid);
//         const unsubDoc = onSnapshot(ref, (snap) => {
//           const data = snap.exists() ? snap.data() : null;
//         });
//         return () => unsubDoc();
//       } else {
//         // setUserDoc(null);
//         // setPlan(null);
//         // setIsAuthOpen(false);
//       }
//     });
//     return () => unsubAuth();
// }, []);
    
//     const handleOtpChange = (val, idx) => {
//         if (!/^\d?$/.test(val)) return;
//         const copy = [...otpDigits];
//         copy[idx] = val;
//         setOtpDigits(copy);
//         if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
//         if (!val && idx > 0) {
//             // allow backspace to move focus back
//             const active = document.activeElement;
//             if (active && active.value === "") {
//                 otpRefs.current[idx - 1]?.focus();
//             }
//         }
//     };

//     const handleOtpPaste = (e) => {
//         const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
//         if (!pasted) return;
//         const arr = pasted.split("");
//         const next = ["", "", "", "", "", ""].map((_, i) => arr[i] || "");
//         setOtpDigits(next);
//         setTimeout(() => {
//             const lastFilled = Math.max(0, next.findLastIndex((d) => d !== ""));
//             otpRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
//         }, 0);
//     };

//     const triggerClose = (callback) => {
//         if (showOtpPopup) return; // don't close while OTP popup visible
//         setClosing(true);
//         onClose();
//         setTimeout(() => {
//           setClosing(false);
//           if (callback) callback();
//         }, 500); // match your exit animation duration
//     };

//     const handleOtpSubmit = async () => {
//         try {
//           setLoadingOtp(true);
//           setOtpError("");
//           const code = otpDigits.join("");
      
//           if (code.length !== 6) {
//             setOtpError("Please enter all 6 digits.");
//             setLoadingOtp(false);
//             return;
//           }
      
//           const currentUser = auth.currentUser; // ✅ get logged in user
//           if (!currentUser) {
//             setOtpError("No user found. Please login again.");
//             setLoadingOtp(false);
//             return;
//           }
      
//           const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
//           await verifyOtp({ uid: currentUser.uid, code });
      
//           await updateDoc(doc(db, "users", currentUser.uid), { isVerified: true });
      
//           const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
//           await sendLogin({ uid: currentUser.uid });
      
//           setShowOtpPopup(false); // ✅ close OTP popup
//           onClose(); // ✅ close Auth modal too
//           setOtpDigits(["", "", "", "", "", ""]);
      
//           if (userData?.setUser) {
//             userData.setUser({
//               uid: currentUser.uid,
//               email: currentUser.email,
//               name: currentUser.displayName || "",
//               photoURL: currentUser.photoURL || null,
//             });
//           }
//         } catch (err) {
//           console.error(err);
//           setOtpError(err?.message || "OTP verification failed.");
//         } finally {
//           setLoadingOtp(false);
//         }
//       };
      
    
//     // const handleOtpSubmit = async () => {
//     //     try {
//     //         setLoadingOtp(true);
//     //         setOtpError("");
//     //         const code = otpDigits.join("");

//     //         if (code.length !== 6) {
//     //             setOtpError("Please enter all 6 digits.");
//     //             setLoadingOtp(false);
//     //             return;
//     //         }
//     //         const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
//     //         const isVerify = await verifyOtp({ uid: user.uid, code });
//     //         console.log("hit here for otp", verifyOtp);
//     //         if (isVerify) {
//     //             console.log("hit here for otp");
                
//     //             await updateDoc(doc(db, "users", user.uid), { isVerified: true });

//     //             const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
//     //             await sendLogin({ uid: user.uid });
//     //             setShowOtpPopup(false);
//     //             onClose();
//     //             console.log(isAuthModal, "authClose hit here");
    
              
//     //             setOtpDigits(["", "", "", "", "", ""]);
//     //             if (userData?.setUser) {
//     //                 userData.setUser({
//     //                     uid: user.uid,
//     //                     email: user.email,
//     //                     name: user.displayName || "",
//     //                     photoURL: user.photoURL || null,
//     //                 });
//     //             }
//     //         }
          
//     //         // setOtpDigits(["", "", "", "", "", ""]);
           
//     //     } catch (err) {
//     //         console.error(err);
//     //         setOtpError(err?.message || "OTP verification failed.");
//     //     } finally {
//     //         setLoadingOtp(false);
//     //     }
//     // };
// console.log(user, "user in otp",  auth.currentUser);

//     const handleResendOtp = async () => {
//         try {
//             // const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//             // await reqOtp({ uid: user.uid });
//             const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
// await reqOtp({ uid: auth.currentUser.uid });

//             setOtpDigits(["", "", "", "", "", ""]);
//             setResendTimer(60);
//             otpRefs.current[0]?.focus();
//         } catch (err) {
//             console.error(err);
//             alert("Failed to resend OTP. Try again.");
//         }
//     };

//     const particles = Array.from({ length: 120 });

//     if (!isOpen) {
//         console.log("!open");

//         return null;
//     }

//     return (
//         <AnimatePresence>

//             <motion.div
//                 className="fixed inset-0 flex items-center justify-center bg-black/60 z-[200]"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//             >
//                 <motion.div
//                     initial={{ scale: 0.9, opacity: 0 }}
//                     animate={{ scale: 1, opacity: 1 }}
//                     exit={{ scale: 0.9, opacity: 0 }}
//                     className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg text-center w-96"
//                     onPaste={handleOtpPaste}
//                 >
//                      <button
//           onClick={onClose}
//           className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
//         >
//           ✕
//                     </button>
                    
//                     <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
//                         Verify Your Email
//                     </h3>
//                     <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
//                         Enter the 6-digit OTP sent to your email to activate your
//                         account.
//                     </p>

//                     {/* OTP Inputs */}
//                     <div className="flex justify-between mb-4">
//                         {otpDigits.map((digit, i) => (
//                             <input
//                                 key={i}
//                                 ref={(el) => (otpRefs.current[i] = el)}
//                                 type="text"
//                                 maxLength={1}
//                                 value={digit}
//                                 inputMode="numeric"
//                                 onChange={(e) => handleOtpChange(e.target.value, i)}
//                                 className="w-10 h-12 border rounded text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#0090DE]"
//                             />
//                         ))}
//                     </div>

//                     {otpError && (
//                         <p className="text-red-500 text-sm mb-2">{otpError}</p>
//                     )}

//                     <button
//                         onClick={handleOtpSubmit}
//                         disabled={loadingOtp}
//                         className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition disabled:opacity-50"
//                     >
//                         {loadingOtp ? "Verifying…" : "Verify OTP"}
//                     </button>

//                     <div className="mt-3">
//                         <button
//                             onClick={handleResendOtp}
//                             disabled={resendTimer > 0}
//                             className="text-blue-600 text-sm disabled:opacity-50"
//                         >
//                             {resendTimer > 0
//                                 ? `Resend OTP in ${resendTimer}s`
//                                 : "Resend OTP"}
//                         </button>
//                     </div>
//                 </motion.div>

//             </motion.div>


//         </AnimatePresence>
//     );
// }

