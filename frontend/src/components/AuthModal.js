// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db, app } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { FcGoogle } from "react-icons/fc";

export default function AuthModal({ isOpen, onClose, onOtpRequest, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confrmPass, setConfrmPass] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const functions = getFunctions(app);

  if (!isOpen) return null;

  const clear = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfrmPass("");
    setPhone("");
    setAddress("");
    setErrorMsg("");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (isRegister && password !== confrmPass) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(res.user, { displayName: name });

      await setDoc(doc(db, "users", res.user.uid), {
        name: name || "",
        email,
        phone: phone || "",
        address: address || "",
        photoURL: null,
        plan: "lakshya",
        planStart: null,
        planEnd: null,
        isAdmin: false,
        isVerified: false,
        createdAt: serverTimestamp(),
      });

      // Non-blocking OTP call
      try {
        const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
        reqOtp({ uid: res.user.uid }).catch((e) =>
          console.error("OTP request failed:", e)
        );
      } catch (fnErr) {
        console.error("OTP callable error:", fnErr);
      }

      if (onOtpRequest) onOtpRequest(res.user);
      clear();
    } catch (err) {
      setErrorMsg(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin(res.user);
      clear();
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const u = res.user;

      await setDoc(
        doc(db, "users", u.uid),
        {
          name: u.displayName || "",
          email: u.email || "",
          photoURL: u.photoURL || null,
          isVerified: true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (onLogin) onLogin(u);
      clear();
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const neonBg = "bg-[#070708]";
  const neonBorder = "ring-1 ring-[#003a5a]/30";
  const neonGlow = "shadow-[0_6px_24px_rgba(0,144,222,0.15)]";
  const blueText = "text-[#00a0ff]";

  // --- Thanos Dust Effect (on exit) ---
  const dustEffect = {
    exit: {
      opacity: [1, 0],
      filter: [
        "blur(0px)",
        "blur(1px)",
        "blur(3px)",
        "blur(8px)",
        "blur(15px)",
      ],
      scale: [1, 1.05, 0.9, 0.7, 0.3],
      transition: { duration: 1.2, ease: "easeInOut" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key="modal"
            variants={dustEffect}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.35, ease: "easeOut" },
            }}
            exit="exit"
            className={`relative ${neonBg} ${neonBorder} ${neonGlow} rounded-2xl w-[92%] max-w-lg p-6 text-left overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                clear();
                onClose();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>

            <h3 className={`text-2xl font-semibold mb-2 ${blueText}`}>
              {isRegister ? "Create Account" : "Sign In"}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Secure access — AI-enabled auth flow
            </p>

            {errorMsg && (
              <div className="mb-3 text-sm text-red-400 bg-red-900/10 p-2 rounded">
                {errorMsg}
              </div>
            )}

            <div className="grid gap-3">
              {isRegister && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
                />
              )}

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
              />

              {isRegister && (
                <>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
                  />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address"
                    className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
                  />
                </>
              )}

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
              />

              {isRegister && (
                <input
                  type="password"
                  value={confrmPass}
                  onChange={(e) => setConfrmPass(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full p-3 rounded-md bg-[#0b0b0c] border border-[#002a45] placeholder:text-gray-400 text-white focus:ring-2 focus:ring-[#00a0ff]/30"
                />
              )}

              <button
                onClick={isRegister ? handleRegister : handleLogin}
                disabled={loading}
                className={`w-full py-3 rounded-md text-white ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                } bg-gradient-to-r from-[#006bb3] to-[#00a0ff] shadow-[0_8px_30px_rgba(0,160,255,0.12)]`}
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                  ? "Create account"
                  : "Sign in"}
              </button>

              {/* Google button with G icon */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-md border border-[#003a5a] text-[#a7e7ff] bg-[#061016] hover:bg-[#071822] transition-all duration-300"
              >
                <FcGoogle size={22} />
                <span className="font-medium">Sign with Google</span>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-gray-300">
              <div>
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </div>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg("");
                }}
                className="text-[#9fe7ff] font-semibold"
              >
                {isRegister ? "Sign in" : "Create account"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// // src/components/AuthModal.js
// import React, { useState, useEffect, useRef } from "react";
// import { auth, googleProvider, db } from "../firebase";
// import {
//   signInWithPopup,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   onAuthStateChanged,
// } from "firebase/auth";
// import {
//   doc,
//   setDoc,
//   updateDoc,
//   getDoc// ✅ used to immediately flip isVerified in Firestore after OTP success
// } from "firebase/firestore";
// import { motion, AnimatePresence } from "framer-motion";
// import { FaGoogle, FaTwitter, FaApple } from "react-icons/fa";
// import { getFunctions, httpsCallable } from "firebase/functions";
// import UserInfoPopup from "./UserInfoPopup";

// function AuthModal({ isOpen, onClose, userData }) {
//   const [isRegister, setIsRegister] = useState(false);
//   const [closing, setClosing] = useState(false);
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [phone, setPhone] = useState('');
//   // const [password, setPassword] = useState('');
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const [authLoading, setAuthLoading] = useState(false);
//   const [showInfoPopup, setShowInfoPopup] = useState(false);

//   const [user, setUser] = useState(null);

//   const [showOtpPopup, setShowOtpPopup] = useState(false);
//   const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
//   const [otpError, setOtpError] = useState("");
//   const [loadingOtp, setLoadingOtp] = useState(false);
//   const [resendTimer, setResendTimer] = useState(0);
//   const [isAuthModal, setIsAuthModal] = useState(false);

//   const otpRefs = useRef([]);
//   const firstOtpMountRef = useRef(false);

//   const functions = getFunctions();

//   console.log(onClose, isOpen, "vsdhgf");

//   // ---------------- Effects ----------------

//   // useEffect(() => {
//   //   const unsub = onAuthStateChanged(auth, (u) => {
//   //     console.log("user bcjc", u);

//   //     setUser(u || null);
//   //   });
//   //   return () => unsub();
//   // }, []);

//   // countdown for resend button
//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
//     return () => clearInterval(t);
//   }, [resendTimer]);

//   // focus the first OTP box when popup appears (only once per showing)
//   useEffect(() => {
//     if (showOtpPopup && !firstOtpMountRef.current) {
//       firstOtpMountRef.current = true;
//       setTimeout(() => {
//         otpRefs.current[0]?.focus();
//       }, 50);
//     }
//     if (!showOtpPopup) {
//       firstOtpMountRef.current = false;
//     }
//   }, [showOtpPopup]);

//   useEffect(() => {
//     if (!showOtpPopup) return;
//     const handler = (e) => {
//       if (e.key === "Enter") handleOtpSubmit();
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [showOtpPopup, otpDigits]); 

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });
//   console.log(form, "form cfk");

  // const triggerClose = () => {
  //   if (showOtpPopup) return;
  //   setClosing(true);
  //   onClose();
  //   setTimeout(() => {
  //     // console.log("onclose bbfjfjhfd", onClose);
  //     setClosing(false);
  //     // onClose();
  //   }, 500);
  // };

//   const handleSubmit = async () => {
//     try {
//       setAuthLoading(true);
//       if (isRegister) {
//         const res = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         console.log(res, 'response for register');

//         // create base user doc
//         await setDoc(doc(db, "users", res.user.uid), {
//           name: name,
//           email: email,
//           isVerified: false,
//           createdAt: new Date().toISOString(),
//         });

//         const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//         await reqOtp({ uid: res.user.uid });

//         setShowOtpPopup(true);
//         setResendTimer(60);
//       } else {
//         const res = await signInWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         console.log(res, 'response for register');
//         const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
//         await sendLogin({ uid: res.user.uid });
//         if (userData?.setUser) {
//           userData.setUser({
//             uid: user.uid,
//             email: user.email,
//             name: user.displayName || "",
//             photoURL: user.photoURL || null,
//           });
//         }

//         triggerClose();
//       }
//     } catch (err) {
//       console.error(err);
//       alert(err?.message || "Authentication failed.");
//     } finally {
//       setAuthLoading(false);
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       setAuthLoading(true);
//       const res = await signInWithPopup(auth, googleProvider);
//       const uid = res.user.uid;
  
//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);
  
//       if (snap.exists() && snap.data()?.isVerified) {
//         const docData = snap.data();
//         userData?.setUser({
//           uid,
//           email: res.user.email,
//           name: docData.name || res.user.displayName || "",
//           photoURL: docData.photoURL || res.user.photoURL || null,
//         });
//         onClose();
//       } else {
//         // Not verified (new or existing but unverified) → create/update and request OTP
//         await setDoc(
//           userRef,
//           {
//             email: res.user.email,
//             name: res.user.displayName || "",
//             phoneNumber: res.user.phoneNumber || '',
//             photoURL: res.user.photoURL || null,
//             isVerified: false,
//             createdAt: snap.exists() ? snap.data().createdAt : new Date().toISOString(),
//           },
//           { merge: true }
//         );
  
//         const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//         await reqOtp({ uid });
//         setShowOtpPopup(true);
//         setResendTimer(60);
//       }
//     } catch (err) {
//       console.error("Google login error:", err);
//       alert(err?.message || "Google sign-in failed.");
//     } finally {
//       setAuthLoading(false);
//     }
//   };

  
//   // const handleGoogleLogin = async () => {
//   //   try {
//   //     setAuthLoading(true);

//   //     const res = await signInWithPopup(auth, googleProvider);

//   //     const userRef = doc(db, "users", res.user.uid);
//   //     const userSnap = await getDoc(userRef);

//   //     if (userSnap.exists()) {
//   //       await updateDoc(userRef, {
//   //         email: res.user.email,
//   //         name: res.user.displayName || "",
//   //         photoURL: res.user.photoURL || null,
//   //       }, { merge: true });
//   //     } else {
//   //       await setDoc(userRef, {
//   //         email: res.user.email,
//   //         name: res.user.displayName || "",
//   //         phoneNumber: res.user.phoneNumber || '',
//   //         photoURL: res.user.photoURL || null,
//   //         isVerified: false, // 🔒 requires OTP on first time
//   //         createdAt: new Date().toISOString(),
//   //       }, { merge: true });
//   //     }

//   //     const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//   //     console.log(reqOtp, "reqOtp djndjknjs");
//   //     await reqOtp({ uid: res.user.uid });

//   //     setShowOtpPopup(true);
//   //     setResendTimer(60);

//   //   } catch (err) {
//   //     console.error("Google login error:", err);
//   //     alert(err?.message || "Google sign-in failed.");
//   //   } finally {
//   //     setAuthLoading(false);
//   //   }
//   // };
//   // const handleGoogleLogin = async () => {
//   //   try {
//   //     setAuthLoading(true);
//   //     const res = await signInWithPopup(auth, googleProvider);
//   //     console.log("response from handlegoogle login", res);

//   //     // ensure user doc exists (or merge updates)


//   //     await setDoc(
//   //       doc(db, "users", res.user.uid),
//   //       {
//   //         email: res.user.email,
//   //         name: res.user.displayName || "",
//   //         photoURL: res.user.photoURL || null,
//   //         isVerified: false, // 🔒 requires OTP on first time
//   //         createdAt: new Date().toISOString(),
//   //       },
//   //       { merge: true }
//   //     );

//   //     // request OTP & show popup
//   //     const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//   //     console.log(reqOtp, "see here for reqOtp");

//   //     await reqOtp({ uid: res.user.uid });
//   //     setShowOtpPopup(true);
//   //     setResendTimer(60);
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert(err?.message || "Google sign-in failed.");
//   //   } finally {
//   //     setAuthLoading(false);
//   //   }
//   // };

//   const handleOtpChange = (val, idx) => {
//     if (!/^\d?$/.test(val)) return;
//     const copy = [...otpDigits];
//     copy[idx] = val;
//     setOtpDigits(copy);
//     if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
//     if (!val && idx > 0) {
//       // allow backspace to move focus back
//       const active = document.activeElement;
//       if (active && active.value === "") {
//         otpRefs.current[idx - 1]?.focus();
//       }
//     }
//   };

//   const handleOtpPaste = (e) => {
//     const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
//     if (!pasted) return;
//     const arr = pasted.split("");
//     const next = ["", "", "", "", "", ""].map((_, i) => arr[i] || "");
//     setOtpDigits(next);
//     setTimeout(() => {
//       const lastFilled = Math.max(0, next.findLastIndex((d) => d !== ""));
//       otpRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
//     }, 0);
//   };

//   const handleOtpSubmit = async () => {
//     try {
//       setLoadingOtp(true);
//       setOtpError("");
//       const code = otpDigits.join("");

//       if (code.length !== 6) {
//         setOtpError("Please enter all 6 digits.");
//         setLoadingOtp(false);
//         return;
//       }

//       const verifyOtp = httpsCallable(functions, "verifySignupOtpV1");
//       await verifyOtp({ uid: user.uid, code });

//       await updateDoc(doc(db, "users", user.uid), { isVerified: true });

//       const sendLogin = httpsCallable(functions, "sendLoginEmailV1");
//       await sendLogin({ uid: user.uid });

//       console.log(isAuthModal, "authClose hit here");
      
//       setShowOtpPopup(false);
//       onClose();
//       setOtpDigits(["", "", "", "", "", ""]);
//       if (userData?.setUser) {
//         userData.setUser({
//           uid: user.uid,
//           email: user.email,
//           name: user.displayName || "",
//           photoURL: user.photoURL || null,
//         });
//       }
//     } catch (err) {
//       console.error(err);
//       setOtpError(err?.message || "OTP verification failed.");
//     } finally {
//       setLoadingOtp(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     try {
//       const reqOtp = httpsCallable(functions, "requestSignupOtpV1");
//       await reqOtp({ uid: user.uid });
//       setOtpDigits(["", "", "", "", "", ""]);
//       setResendTimer(60);
//       otpRefs.current[0]?.focus();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to resend OTP. Try again.");
//     }
//   };

//   const particles = Array.from({ length: 120 });

//   if (!isOpen) {
//     console.log("!open");

//     return null;
//   }

 

//   console.log(showInfoPopup, "showInfoPopupshowInfoPopup");

//   return (
//     <>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
            // onClick={() => {
            //   if (!showOtpPopup) triggerClose();
            // }}
//           >
//             <motion.div
//               initial={{ opacity: 1, scale: 1 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.3 }}
              // onClick={(e) => e.stopPropagation()}
              // className="relative w-96"
//             >
//               {/* Dust Particles */}
//               {closing &&
//                 particles.map((_, i) => (
//                   <motion.span
//                     key={i}
//                     className="absolute w-1 h-1 bg-white dark:bg-gray-700 rounded"
//                     style={{
//                       top: `${Math.random() * 100}%`,
//                       left: `${Math.random() * 100}%`,
//                     }}
//                     initial={{ opacity: 1 }}
//                     animate={{
//                       x: Math.random() * 400,
//                       y: (Math.random() - 0.5) * 200,
//                       opacity: 0,
//                       scale: 0,
//                     }}
//                     transition={{ duration: 1.5, ease: "easeOut" }}
//                   />
//                 ))}

//               {/* Modal Content */}
//               <div
//                 className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative z-10 ${closing ? "animate-disintegrate" : ""
//                   }`}
//               >
//                 <h2 className="text-xl font-bold mb-4">
//                   {isRegister ? "Register" : "Sign In"}
//                 </h2>

//                 {/* {isRegister && (
//                 <input
//                   type="text"
//                   name="name"
//                   placeholder="Name"
//                   className="border p-2 w-full mb-2 rounded"
//                   onChange={(val) => setName(val)}
//                 />
//               )} */}

//                 <input
//                   type="email"
//                   name="email"
//                   placeholder="Email"
//                   className="border p-2 w-full mb-2 rounded"
//                   onChange={(val) => setEmail(val)}
//                 />

//                 <input
//                   type="password"
//                   name="password"
//                   placeholder="Password"
//                   className="border p-2 w-full mb-4 rounded"
//                   onChange={(val) => setPassword(val)}
//                 />

//                 <button
//                   onClick={handleSubmit}
//                   disabled={authLoading}
//                   className="w-full bg-purple-600 text-white p-2 rounded mb-3 disabled:opacity-50"
//                 >
//                   {authLoading
//                     ? isRegister
//                       ? "Creating account…"
//                       : "Signing in…"
//                     : isRegister
//                       ? "Register"
//                       : "Sign In"}
//                 </button>

//                 {/* Social Logins */}
//                 <div className="flex justify-center gap-6 mb-4">
//                   <button
//                     onClick={handleGoogleLogin}
//                     disabled={authLoading}
//                     className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
//                   >
//                     <FaGoogle className="text-red-500 text-xl" />
//                   </button>
//                   <button
//                     onClick={() => alert("Twitter login coming soon!")}
//                     className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
//                   >
//                     <FaTwitter className="text-sky-500 text-xl" />
//                   </button>
//                   <button
//                     onClick={() => alert("Apple login coming soon!")}
//                     className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
//                   >
//                     <FaApple className="text-black dark:text-white text-xl" />
//                   </button>
//                 </div>
//                 <p
//                   className="text-blue-600 cursor-pointer text-sm text-center"
//                   onClick={() => {
                   
//                     setIsRegister(true);
//                     setShowInfoPopup(true);
//                     setIsAuthModal(false);
                    
//                   }}
//                 >
//                   {isRegister
//                     ? "Already have an account? Sign In"
//                     : "Don’t have an account? →  Register"}
//                 </p>

//               </div>
//             </motion.div>



//             {/* OTP POPUP */}
//             <AnimatePresence>
//               {showOtpPopup && (
//                 <motion.div
//                   className="fixed inset-0 flex items-center justify-center bg-black/60 z-[200]"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                 >
//                   <motion.div
//                     initial={{ scale: 0.9, opacity: 0 }}
//                     animate={{ scale: 1, opacity: 1 }}
//                     exit={{ scale: 0.9, opacity: 0 }}
//                     className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg text-center w-96"
//                     onPaste={handleOtpPaste}
//                   >
//                     <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
//                       Verify Your Email
//                     </h3>
//                     <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
//                       Enter the 6-digit OTP sent to your email to activate your
//                       account.
//                     </p>

//                     {/* OTP Inputs */}
//                     <div className="flex justify-between mb-4">
//                       {otpDigits.map((digit, i) => (
//                         <input
//                           key={i}
//                           ref={(el) => (otpRefs.current[i] = el)}
//                           type="text"
//                           maxLength={1}
//                           value={digit}
//                           inputMode="numeric"
//                           onChange={(e) => handleOtpChange(e.target.value, i)}
//                           className="w-10 h-12 border rounded text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#0090DE]"
//                         />
//                       ))}
//                     </div>

//                     {otpError && (
//                       <p className="text-red-500 text-sm mb-2">{otpError}</p>
//                     )}

//                     <button
//                       onClick={handleOtpSubmit}
//                       disabled={loadingOtp}
//                       className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition disabled:opacity-50"
//                     >
//                       {loadingOtp ? "Verifying…" : "Verify OTP"}
//                     </button>

//                     <div className="mt-3">
//                       <button
//                         onClick={handleResendOtp}
//                         disabled={resendTimer > 0}
//                         className="text-blue-600 text-sm disabled:opacity-50"
//                       >
//                         {resendTimer > 0
//                           ? `Resend OTP in ${resendTimer}s`
//                           : "Resend OTP"}
//                       </button>
//                     </div>
//                   </motion.div>
                 
//                 </motion.div>
//               )}

//             </AnimatePresence>
//           </motion.div>
//         )}
//       </AnimatePresence>
     
// {showInfoPopup && (
//   <UserInfoPopup
//     user={userData}
//     isOpen={showInfoPopup}
//     onCloseUserInfo={() => setShowInfoPopup(false)}
//     setIsAuthModal={setIsAuthModal}
//   />
// )}
//     </>
//   );
// }

// export default AuthModal;
