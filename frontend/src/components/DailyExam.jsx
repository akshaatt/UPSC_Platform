import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DailyExam() {
  const nav = useNavigate();
  const [current, setCurrent] = useState(0);
  const canvasRef = useRef(null);

  // ✅ Public folder paths
  const images = [
    "/images/quiz/quiz1.jpg",
    "/images/quiz/quiz2.jpg",
    "/images/quiz/quiz3.jpg",
    "/images/quiz/quiz4.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  // ⭐ Custom Star Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let rafId = null;
    let stars = [];

    const setupSize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.style.width = "100%";
      canvas.style.height = "1000px";
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(1000 * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const initStars = () => {
      const wCss = canvas.width / (window.devicePixelRatio || 1);
      const hCss = canvas.height / (window.devicePixelRatio || 1);
      stars = Array.from({ length: 3500 }, () => ({
        x: Math.random() * wCss,
        y: Math.random() * hCss,
        r: Math.random() * 2 + 0.2, // smaller stars
        t: Math.random() * Math.PI * 2,
        s: 0.03 + Math.random() * 0.05, // faster twinkle
      }));
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#013456"); // lighter blue start
      grad.addColorStop(1, "#0390dc"); // lighter blue end
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((st) => {
        st.t += st.s;
        const a = 0.5 + 0.5 * Math.sin(st.t);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };

    setupSize();
    initStars();
    draw();

    window.addEventListener("resize", setupSize);
    return () => {
      window.removeEventListener("resize", setupSize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden text-white">
      <canvas ref={canvasRef} className="absolute inset-0 w-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Carousel */}
        <div className="flex flex-col items-center">
          <div className="relative w-[350px] h-[220px] rounded-xl overflow-hidden shadow-lg border border-white/10">
            <AnimatePresence>
              <motion.img
                key={current}
                src={images[current]}
                alt="Quiz"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.7 }}
              />
            </AnimatePresence>
          </div>
          <div className="flex mt-4 gap-3">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="preview"
                onClick={() => setCurrent(i)}
                className={`w-16 h-12 rounded-md object-cover cursor-pointer transition ${
                  i === current ? "ring-2 ring-cyan-400" : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Text */}
        <div className="text-center md:text-left">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-r from-cyan-300 to-[#ffffff] bg-clip-text text-transparent drop-shadow-sm">
              Routine Assessment Platform
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-200 text-lg mb-6 leading-relaxed"
          >
            A professional hub for <b>structured daily evaluations</b>.  
            Designed to simulate real exam conditions, provide in-depth analysis,
            and sharpen your preparation every evening.
          </motion.p>

          <ul className="space-y-3 mb-6 text-gray-200">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-cyan-400 w-5 h-5" /> Timed quizzes with real exam feel
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-cyan-400 w-5 h-5" /> Instant analytics & leaderboard
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-cyan-400 w-5 h-5" /> Curated questions updated daily
            </li>
          </ul>

          <motion.button
            onClick={() => nav("/dailyquiz")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-xl shadow-lg flex items-center gap-2 mx-auto md:mx-0"
          >
            🚀 Start Quiz <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
