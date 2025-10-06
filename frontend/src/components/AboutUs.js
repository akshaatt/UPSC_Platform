import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionPopup from "./SubscriptionPopup";

function AboutUs() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveIndex((p) => (p + 1) % 3), 4000);
    return () => clearInterval(id);
  }, []);

  // starry background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sectionRef.current) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let rafId = null;
    let stars = [];

    const setupSize = () => {
      const ratio = window.devicePixelRatio || 1;
      const targetH = 500; // reduce height to center
      canvas.style.width = "100%";
      canvas.style.height = `${targetH}px`;
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(targetH * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const initStars = () => {
      const wCss = canvas.width / (window.devicePixelRatio || 1);
      const hCss = canvas.height / (window.devicePixelRatio || 1);
      stars = Array.from({ length: 160 }, () => ({
        x: Math.random() * wCss,
        y: Math.random() * hCss,
        r: Math.random() * 1.8 + 0.2,
        t: Math.random() * Math.PI * 2,
        s: 0.02 + Math.random() * 0.03,
      }));
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#001726");
      grad.addColorStop(1, "#0090DE");
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

  const textParent = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.15 },
    },
  };
  const textChild = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const images = [
    { src: "/assets/about-1.png", alt: "UPSC Mentorship" },
    { src: "/assets/about-2.png", alt: "UPSC Library" },
    { src: "/assets/about-3.png", alt: "UPSC Notes & Maps" },
  ];

  const SLOT_CENTER = { x: 0, y: 0, scale: 1.2, op: 1, z: 30 };
  const SLOT_LEFT = isMobile
    ? { x: -70, y: -50, scale: 0.9, op: 0.6, z: 20 }
    : { x: -120, y: -50, scale: 0.9, op: 0.6, z: 20 };
  const SLOT_RIGHT = isMobile
    ? { x: 70, y: 50, scale: 0.9, op: 0.6, z: 10 }
    : { x: 120, y: 50, scale: 0.9, op: 0.6, z: 10 };

  const slots = [SLOT_CENTER, SLOT_LEFT, SLOT_RIGHT];

  return (
    <section ref={sectionRef} className="relative mt-20 w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full pointer-events-none"
        aria-hidden="true"
      />

      {/* remove big padding → let items truly center */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12 items-center">
        {/* left text */}
        <motion.div
          variants={textParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          className="text-gray-200 leading-relaxed"
        >
          <motion.h2 variants={textChild} className="text-3xl md:text-4xl font-bold mb-6 text-white">
            About <span className="text-[#00b4ff]">Satyapath</span>
          </motion.h2>

          <motion.p variants={textChild} className="mb-4">
            Satyapath means <strong>“Path of Truth”</strong>. We simplify the UPSC journey with the
            right resources, smart test series, and AI-powered guidance—so you focus on learning, not
            searching.
          </motion.p>

          <motion.p variants={textChild} className="mb-4">
            From <strong>notes, maps, and current affairs</strong> to{" "}
            <strong>mock tests and mentor guidance</strong>, everything lives in one place. Start with
            Lakshya (free) or go premium—Satyapath grows with you.
          </motion.p>

          <motion.p variants={textChild} className="mb-6">
            Our goal: save time, sharpen strategy, and help you walk confidently toward your IAS dream 🚀.
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

        {/* right images */}
        <div className="relative flex items-center justify-center ">
          <div className="relative w-[420px] h-[420px] flex items-center justify-center ">
            <AnimatePresence>
              {images.map((img, idx) => {
                const slotIdx = (idx - activeIndex + images.length) % images.length;
                const slot = slots[slotIdx] || SLOT_RIGHT;

                return (
                  <motion.img
                    key={img.src + activeIndex}
                    src={img.src}
                    alt={img.alt}
                    className="absolute left-1/2  -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl"
                    style={{ width: isMobile ? 180 : 240, height: "auto" }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      x: slot.x,
                      y: slot.y,
                      scale: slot.scale,
                      opacity: slot.op,
                      zIndex: slot.z,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  />
                );
              })}
            </AnimatePresence>
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
