// src/pages/Mentorship.jsx
import React from "react";
import { motion } from "framer-motion";
import { UserCheck, Target, BarChart3, Video, Lock } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Mentorship() {
  const [user] = useAuthState(auth);
  const [userDoc, setUserDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserDoc(snap.data());
      }
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  const isAllowed =
    userDoc &&
    ["safalta", "shikhar", "samarpan"].includes(
      (userDoc.plan || "lakshya").toLowerCase()
    );

  return (
    <section className="relative min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* ✨ Animated soft gradient background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(6,182,212,0.08), transparent 50%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.08), transparent 50%)",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* 🌫️ Floating glow particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 opacity-50 blur-2xl"
          style={{
            width: Math.random() * 80 + 60,
            height: Math.random() * 80 + 60,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* HERO SECTION */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Personal Mentorship <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                for UPSC Aspirants
              </span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              One-on-one strategic mentorship for dedicated learners. 
              Weekly reviews, custom roadmaps, and expert feedback — everything 
              to elevate your UPSC preparation experience.
            </p>

            {loading ? (
              <p className="text-gray-500">Checking access...</p>
            ) : !isAllowed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-gray-700 font-medium shadow-sm"
              >
                <Lock size={20} className="text-cyan-500" />
                Unlock with a{" "}
                <span className="font-semibold text-cyan-600">
                  Premium Plan
                </span>
              </motion.div>
            ) : (
              <motion.a
                href="/mentorship"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Book Your Session
              </motion.a>
            )}
          </motion.div>

          {/* ✅ RIGHT SIDE HERO IMAGE BOX */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex items-center justify-center"
          >
            <div className="w-auto h-auto bg-gradient-to-br from-cyan-50 via-blue-50 to-white border border-cyan-100 shadow-[0_8px_40px_rgba(6,182,212,0.15)] rounded-3xl overflow-hidden flex items-center justify-center">
              <motion.img
                src="/assets/satyapath-logo.png"
                alt="Satyapath Logo"
                className="w-96 opacity-80"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* FEATURE GRID */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <FeatureCard
            icon={<UserCheck size={30} />}
            title="1-on-1 Mentorship"
            desc="Get personalized guidance from experts who know the UPSC pattern inside out."
          />
          <FeatureCard
            icon={<Target size={30} />}
            title="Custom Study Strategy"
            desc="Tailored plans for your strengths and weaknesses with consistent follow-ups."
          />
          <FeatureCard
            icon={<BarChart3 size={30} />}
            title="Progress Analytics"
            desc="Visualize your weekly progress with data-driven insights and test analysis."
          />
          <FeatureCard
            icon={<Video size={30} />}
            title="Interactive Sessions"
            desc="Live 1:1 mentor calls — discuss strategy, improve focus, and stay accountable."
          />
        </motion.div>
      </div>
    </section>
  );
}

/* 🔹 Feature Card Component */
function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(6,182,212,0.12)" }}
      transition={{ duration: 0.3 }}
      className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl mb-5 shadow-lg">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
