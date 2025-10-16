// src/components/SplashScreen.jsx — Final Stable Cinematic 6.5s Version
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({
  onFinish = () => {},
  title = "SATYAPATH",
  tagline = "Your one stop destination for all UPSC Affairs",
}) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState("intro"); // intro → hold → exit
  const timers = useRef([]);

  // total = 6.5s
  const introDuration = 4000;
  const holdDuration = 1000;
  const exitDuration = 2800;

  useEffect(() => {
    // clear any running timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    timers.current.push(setTimeout(() => setPhase("hold"), introDuration));
    timers.current.push(
      setTimeout(() => setPhase("exit"), introDuration + holdDuration)
    );
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        onFinish?.();
      }, introDuration + holdDuration + exitDuration + 200)
    );

    return () => timers.current.forEach(clearTimeout);
  }, []); // run once

  const letterVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 1, 0.5, 1] },
    }),
  };

  const letterExitVariants = {
    exit: (i) => {
      const angle = (i / title.length) * Math.PI * 2;
      const distance = 120 + Math.random() * 80;
      return {
        opacity: 0,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0.9,
        rotate: (Math.random() - 0.5) * 40,
        transition: {
          duration: 1.1,
          delay: i * 0.04,
          ease: [0.22, 1, 0.36, 1],
        },
      };
    },
  };

  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (phase === "exit") {
      setParticles(
        Array.from({ length: 35 }).map(() => ({
          id: Math.random(),
          dx: (Math.random() - 0.5) * 250,
          dy: (Math.random() - 0.5) * 250,
          size: 2 + Math.random() * 2,
          duration: 1 + Math.random() * 0.7,
          delay: Math.random() * 0.4,
        }))
      );
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background:
              "radial-gradient(circle at center, #02030a 0%, #050913 45%, #000000 100%)",
          }}
        >
          {/* Black Sun */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 420,
              height: 420,
              background:
                "radial-gradient(circle at center, rgba(3,3,7,1) 0%, rgba(2,3,6,1) 55%, rgba(2,3,5,0.95) 100%)",
              boxShadow: "0 0 160px 32px rgba(3,6,18,0.45) inset",
              zIndex: 1,
            }}
            animate={{
              scale: [0.97, 1.02, 0.99],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Blue Aura */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 700,
              height: 700,
              background:
                "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.15) 25%, transparent 60%)",
              filter: "blur(60px)",
              zIndex: 0,
            }}
            animate={{
              opacity: [0.6, 0.9, 0.6],
              scale: [0.98, 1.04, 1],
              transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Title */}
          <div
            style={{
              zIndex: 5,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            {title.split("").map((ch, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={phase === "exit" ? letterExitVariants : letterVariants}
                initial="hidden"
                animate={phase === "exit" ? "exit" : "visible"}
                style={{
                  fontSize: "clamp(40px, 6vw, 90px)",
                  fontWeight: 800,
                  background:
                    "linear-gradient(90deg, #60a5fa 0%, #3b82f6 45%, #1d4ed8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 4px 24px rgba(59,130,246,0.3)",
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={
              phase === "exit"
                ? { opacity: 0, y: -8, transition: { duration: 0.6 } }
                : { opacity: 1, y: 0, transition: { duration: 0.6, delay: 1 } }
            }
            style={{
              marginTop: 18,
              color: "rgba(190,210,255,0.85)",
              fontSize: "clamp(14px, 1.4vw, 18px)",
              textAlign: "center",
              zIndex: 10,
            }}
          >
            {tagline}
          </motion.p>

          {/* Exit Particles */}
          {phase === "exit" &&
            particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: p.dx,
                  y: p.dy,
                  opacity: 0,
                  scale: 0.5,
                  transition: {
                    duration: p.duration,
                    delay: p.delay,
                    ease: "easeOut",
                  },
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: "rgba(59,130,246,0.9)",
                  filter: "blur(1.5px)",
                  zIndex: 3,
                }}
              />
            ))}

          {/* Fade Out Overlay */}
          {phase === "exit" && (
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000",
                zIndex: 999,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 1] }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
