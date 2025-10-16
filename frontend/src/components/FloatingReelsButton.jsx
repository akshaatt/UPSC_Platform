// src/components/FloatingReelsButton.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

export default function FloatingReelsButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide button on /reels page
  if (location.pathname === "/reels") return null;

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-[999]"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 🔹 Glowing background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-full blur-xl opacity-70"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>

      {/* 🔹 Actual Button */}
      <motion.button
        onClick={() => navigate("/reels")}
        title="Explore Satyapath Reels"
        className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-5 rounded-full shadow-lg hover:shadow-[0_0_25px_#00b8ff] transition-all flex items-center justify-center"
        whileHover={{
          scale: 1.15,
          rotate: 5,
          boxShadow: "0 0 30px rgba(0,160,255,0.7)",
        }}
        whileTap={{ scale: 0.9, rotate: -5 }}
      >
        {/* Animated play icon */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Play size={26} className="drop-shadow-lg" />
        </motion.div>
      </motion.button>

      {/* 🔹 Text tooltip */}
     
    </motion.div>
  );
}
