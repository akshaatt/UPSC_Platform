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
    <section className="relative py-24 px-6 bg-white text-gray-900 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 -left-16 w-72 h-72 bg-gradient-to-r from-cyan-200 via-blue-100 to-transparent blur-3xl opacity-60 rounded-full animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-gradient-to-l from-cyan-100 via-blue-50 to-transparent blur-3xl opacity-60 rounded-full animate-pulse" />

      <div className="max-w-7xl mx-auto relative z-10 text-center">
        {/* HEADER */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent"
        >
          Personal Mentorship Program
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-gray-600 mb-12 text-lg"
        >
          Designed exclusively for our premium learners — get{" "}
          <b>individual attention</b>, weekly progress tracking, and actionable
          insights to ensure your UPSC preparation is focused and effective.
        </motion.p>

        {loading ? (
          <p className="text-gray-500">Checking access...</p>
        ) : !isAllowed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-100 border border-gray-200 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 font-medium shadow-sm"
          >
            <Lock size={18} className="text-cyan-500" />
            Unlock this feature with <span className="font-semibold">a Subscription</span> plan
          </motion.div>
        ) : (
          <>
            {/* FEATURES GRID */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-12"
            >
              <FeatureCard
                icon={<UserCheck size={28} />}
                title="1-on-1 Mentorship"
                desc="Get personalized guidance from experienced mentors who understand your preparation style."
                delay={0.1}
              />
              <FeatureCard
                icon={<Target size={28} />}
                title="Custom Strategy"
                desc="Weekly strategy calls to help you focus on high-priority topics & weak areas."
                delay={0.2}
              />
              <FeatureCard
                icon={<BarChart3 size={28} />}
                title="Performance Review"
                desc="Detailed feedback on your test performance and study discipline."
                delay={0.3}
              />
              <FeatureCard
                icon={<Video size={28} />}
                title="Interactive Sessions"
                desc="Join 1 to 1 live mentoring for motivation and doubt clearance."
                delay={0.4}
              />
            </motion.div>

            {/* CTA CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition text-center"
            >
              <h3 className="text-2xl font-bold mb-3 text-cyan-700">
                Ready to Accelerate Your Journey?
              </h3>
              <p className="text-gray-600 mb-6">
                Book your first session and begin a guided roadmap toward
                success with Satyapath mentors.
              </p>
              <motion.a
                href="/mentorship"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Book Mentorship Now
              </motion.a>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

/* 🔹 Feature Card Component */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition transform hover:-translate-y-1"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl mb-4 mx-auto shadow-md">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
