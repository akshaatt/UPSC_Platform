import React, { useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

function WelcomeMessage() {
  const [user, setUser] = useState(null);
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, (u) => {
  //     if (u) {
  //       // setUser(u);
        
        
  //       console.log("Already logged in:", u);
  //       // ✅ only show if not shown before in this session
  //       const alreadyShown = sessionStorage.getItem("welcomeShown");
  //       if (!alreadyShown) {
  //         setShow(true);
  //         sessionStorage.setItem("welcomeShown", "true");

  //         // auto-hide after 6s
  //         timerRef.current = setTimeout(() => setShow(false), 6000);
  //       }
  //     } else {
  //       setUser(null);
  //       setShow(false);
  //       sessionStorage.removeItem("welcomeShown"); // reset when logged out
  //     }
  //   });
  //   return () => {
  //     unsub();
  //     if (timerRef.current) clearTimeout(timerRef.current);
  //   };
  // }, []);

  // useEffect(() => {
  //     const unsubAuth = onAuthStateChanged(auth, (u) => {
  //       if (!u) {
  //         setUser(null);
  //         // setUserDoc(null);
  //         setPlan(null);
  //         setIsOtpPopup(false);
  //         return;
  //       }
  
  //       const ref = doc(db, "users", u.uid);
  //       const unsubDoc = onSnapshot(ref, (snap) => {
  //         const data = snap.exists() ? snap.data() : null;
  // console.log(data, "userData check ");
  
  //         if (data?.isVerified) {
  //           // only set if verified
  //           setUser(u);
  //           setUserDoc(data);
  //           setPlan(data?.plan || null);
  //           setIsOtpPopup(false);
  //         } else {
  //           // keep waiting until OTP verify
  //           setUser(null);
  //           setUserDoc(data);
  //           setPlan(null);
  //           setIsOtpPopup(true); // show OTP popup if unverified
  //         }
  //       });
  
  //       return () => unsubDoc();
  //     });
  
  //     return () => unsubAuth();
  //   }, []);

  // ✅ function to close + clear timer
  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-20 w-[92%] max-w-2xl"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Background */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(135deg, #0b0b0b 5%, #111827 30%, #0090DE 65%, #ffffff 100%)",
                }}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/90 hover:text-white"
                aria-label="Close welcome message"
              >
                <FaTimes />
              </button>

              {/* Content */}
              <div className="px-6 py-5 md:px-8 md:py-6 text-white">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold border border-white/20 shadow">
                  ✨ Satyapath Motivation
                </div>

                <h3 className="text-lg md:text-xl font-bold leading-snug">
                  👋 Welcome back, {user.displayName || user.email || "Aspirant"}!
                </h3>

                <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed">
                  Consistency beats intensity. Even 1 focused hour today plants a seed for
                  tomorrow’s success. Read smart, revise often, and keep your momentum. 🚀
                </p>

                {/* CTA */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleClose}
                    className="rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-semibold border border-white/20 transition"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeMessage;
