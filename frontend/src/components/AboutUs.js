import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SubscriptionPopup from "./SubscriptionPopup";

function AboutUs() {
  const canvasRef = useRef(null);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  // Responsive helper
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Rotating images
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((p) => (p + 1) % 3);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // Starry background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let stars = [];
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = 450);
    let rafId;

    const initStars = () => {
      stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2,
        twinkle: Math.random() * 100,
      }));
    };

    const animate = () => {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#001726");
      gradient.addColorStop(1, "#0090DE");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((s) => {
        s.twinkle += 0.05;
        const alpha = 0.5 + 0.5 * Math.sin(s.twinkle);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(animate);
    };

    initStars();
    animate();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = 450;
      initStars();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Animation variants for text
  const textParent = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.15 },
    },
    exit: { opacity: 0, y: -40, transition: { duration: 0.5 } },
  };
  const textChild = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
  };

  // Images
  const images = [
    { src: "/assets/about-1.png", alt: "UPSC Preparation" },
    { src: "/assets/about-2.png", alt: "Library" },
    { src: "/assets/about-3.png", alt: "Mentorship" },
  ];

  // Positions
  const POS_CENTER = { x: -10, y: -10 };
  const POS_TL = isMobile ? { x: -50, y: -50 } : { x: -70, y: -70 };
  const POS_BR = isMobile ? { x: 50, y: 50 } : { x: 70, y: 70 };

  const getPose = (idx) => {
    if (idx === activeIndex) return { ...POS_CENTER, scale: 1.2, z: 20, op: 1 };
    if (idx === (activeIndex + 1) % 3) return { ...POS_TL, scale: 0.85, z: 10, op: 0.9 };
    return { ...POS_BR, scale: 0.85, z: 10, op: 0.9 };
  };

  return (
    <section className="relative mt-20 w-full overflow-hidden">
      {/* Starry background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        {/* Left: text with animations */}
        <motion.div
          variants={textParent}
          initial="hidden"
          whileInView="show"
          exit="exit"
          viewport={{ once: false, amount: 0.3 }}
          className="text-gray-200 leading-relaxed"
        >
          <motion.h2
            variants={textChild}
            className="text-3xl md:text-4xl font-bold mb-6 text-white"
          >
            About <span className="text-[#00b4ff]">Satyapath</span>
          </motion.h2>

          <motion.p variants={textChild} className="mb-4">
            Satyapath means <strong>“Path of Truth”</strong>. We simplify the UPSC
            journey with the right resources, smart test series, and AI-powered
            guidance—so you focus on learning, not searching.
          </motion.p>

          <motion.p variants={textChild} className="mb-4">
            From <strong>notes, maps, and current affairs</strong> to{" "}
            <strong>mock tests and mentor guidance</strong>, everything lives in one
            place. Start with Lakshya (free) or go premium—Satyapath grows with you.
          </motion.p>

          <motion.p variants={textChild} className="mb-6">
            Our goal: save time, sharpen strategy, and help you walk confidently
            toward your IAS dream 🚀.
          </motion.p>

          <motion.div variants={textChild} className="mt-4 flex gap-4">
            <button
              onClick={() => setIsSubscriptionOpen(true)}
              className="px-6 py-2 rounded-lg bg-[#0090DE] hover:bg-[#007bbd] text-white font-semibold transition"
            >
              View Plans
            </button>
            <button
              onClick={() => (window.location.href = "/library")}
              className="px-6 py-2 rounded-lg bg-white/15 border border-white/20 hover:bg-white/25 text-white font-semibold transition"
            >
              Explore Library
            </button>
          </motion.div>
        </motion.div>

        {/* Right: rotating images, vertically centered */}
        <div className="relative flex justify-center items-center">
          <div className="relative w-[300px] md:w-[360px] h-[300px] md:h-[360px] flex items-center justify-center">
            {images.map((img, idx) => {
              const pose = getPose(idx);
              return (
                <motion.img
                  key={idx}
                  src={img.src}
                  alt={img.alt}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl"
                  style={{ width: isMobile ? 130 : 170, height: "auto" }}
                  initial={false}
                  animate={{
                    x: pose.x,
                    y: pose.y,
                    scale: pose.scale,
                    opacity: pose.op,
                    zIndex: pose.z,
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
    </section>
  );
}

export default AboutUs;
