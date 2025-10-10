import React from "react";
import { motion } from "framer-motion";

function AnimatedBanner() {
  // ⭐ Generate 350 stars with size 2–4px
  const stars = Array.from({ length: 350 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 2, // 2–4px
    delay: Math.random() * 5,
  }));

  return (
    <section className="relative w-full min-h-[70vh] overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 animate-gradient bg-[length:200%_200%] bg-gradient-to-br from-[#001726] via-[#0090DE] to-[#000000] opacity-50 mix-blend-overlay" />
      </div>

      {/* Floating Blobs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#0090DE]/40 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-16 right-16 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ⭐ Twinkling Stars */}
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 3,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-[5] max-w-6xl mx-auto px-6 pt-28 pb-14 md:pt-36 md:pb-20">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-white text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg"
        >
          Satyapath — Your Path to{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
            UPSC
          </span>{" "}
          Success
        </motion.h1>

        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="mt-4 max-w-2xl text-white/85 text-base md:text-lg leading-relaxed"
        >
          Study together in focused rooms, clear doubts instantly, access curated notes, and get
          AI-powered guidance — all in one place.
        </motion.p>

        {/* Buttons */}
        {/* Buttons */}
<motion.div
  initial={{ y: 28, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
  className="mt-8 flex flex-col sm:flex-row gap-3"
>
  <a
    href="/aboutupsc"
    className="px-5 py-2.5 rounded-lg font-semibold text-center text-white shadow-lg"
    style={{ backgroundColor: "#0090DE" }}
  >
    All About UPSC
  </a>
  <a
    href="/library"
    className="px-5 py-2.5 rounded-lg font-semibold text-center text-white/90 hover:text-white border border-white/30 hover:border-white/60 transition shadow-md"
  >
    Explore Library
  </a>
</motion.div>

        {/* Chips */}
        <div className="relative mt-10 flex flex-wrap gap-4">
          <FloatingChip label="📚 500+ Books" delay={0} />
          <FloatingChip label="🤖 AI Mentor" delay={0.15} />
          <FloatingChip label="🧑‍🤝‍🧑 Doubt Rooms" delay={0.3} />
        </div>
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.7)]" />

      {/* Gradient animation */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient { animation: gradientShift 12s ease-in-out infinite; }
      `}</style>
    </section>
  );
}

function FloatingChip({ label, delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: [0, -6, 0], opacity: 1 }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-3 py-1.5 text-white text-sm shadow-md">
        {label}
      </div>
    </motion.div>
  );
}

export default AnimatedBanner;
