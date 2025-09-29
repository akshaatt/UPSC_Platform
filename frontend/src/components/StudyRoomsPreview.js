import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, ArrowRight, AlertTriangle } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StudyRoomsPreview() {
  const images = [
    "/images/students/student1.png",
    "/images/students/student2.png",
    "/images/students/student3.png",
    "/images/students/student4.png",
    "/images/students/student5.png",
    "/images/students/student6.png",
    "/images/students/student7.png",
  ];

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [popup, setPopup] = useState(null);

  const nav = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const unsubDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) setPlan(snap.data().plan || "lakshya");
          else setPlan("lakshya");
        });
        return () => unsubDoc();
      } else {
        setPlan("guest");
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const handleExplore = () => {
    if (!user || plan === "guest") {
      setPopup("⚠️ Please log in and subscribe to access Study Rooms.");
      return;
    }
    if (plan === "lakshya") {
      setPopup(
        "🎓 You’ve used your 1 trial room. Upgrade to Safalta, Shikhar, or Samarpan for unlimited access!"
      );
      return;
    }
    // ✅ Valid user → redirect
    nav("/study-rooms");
  };

  const headline = "Join Live Study Rooms";

  return (
    <section className="relative bg-white dark:bg-gray-900 py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-center md:text-left">
          {/* Animated Gradient Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            {headline.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.6 }}
                transition={{ delay: i * 0.05 }}
                className={
                  char === " "
                    ? "inline-block mx-1"
                    : "inline-block bg-gradient-to-r from-[#0090DE] via-[#00c4ff] to-[#0090DE] bg-clip-text text-transparent animate-gradient"
                }
              >
                {char}
              </motion.span>
            ))}
          </h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            Participate in doubt clarification sessions, peer learning, and
            interactive discussions with expert teachers.
          </motion.p>

          {/* Extra Info */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-3 text-base text-gray-500 dark:text-gray-400"
          >
            Raise your doubts, practice answer writing, evaluate peers’
            responses, and learn from India’s top educators — all in a
            collaborative space designed to boost your UPSC preparation.
          </motion.p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-6 justify-center md:justify-start">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="flex flex-col items-center bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-2xl shadow transition"
            >
              <Users className="h-6 w-6 text-[#0090DE]" />
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                500+
              </p>
              <p className="text-sm text-gray-500">Active Students</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -1 }}
              className="flex flex-col items-center bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-2xl shadow transition"
            >
              <Calendar className="h-6 w-6 text-[#0090DE]" />
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                20+
              </p>
              <p className="text-sm text-gray-500">Upcoming Rooms</p>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={handleExplore}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative mt-8 px-8 py-3 bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Study Rooms <ArrowRight className="h-5 w-5" />
            </span>
            <motion.span
              initial={{ y: "100%" }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-medium"
            >
              Click to explore rooms now!
            </motion.span>
          </motion.button>
        </div>

        {/* Right Image Slideshow */}
        <div className="relative flex justify-center items-center h-[450px]">
          <div className="relative w-[450px] h-[450px] flex items-center justify-center">
            <AnimatePresence custom={direction}>
              <motion.img
                key={current}
                src={images[current]}
                alt="Student"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute w-full h-full object-contain"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
            onClick={() => setPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md text-center"
            >
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-lg text-gray-800 dark:text-white font-semibold">
                {popup}
              </p>
              <button
                onClick={() => setPopup(null)}
                className="mt-4 px-6 py-2 rounded-lg bg-[#0090DE] text-white hover:bg-[#007bbd] transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
