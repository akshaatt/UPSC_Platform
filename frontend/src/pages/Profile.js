import React, { useEffect, useState } from "react";
import { auth, DEFAULT_AVATAR } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Please login to view profile.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Banner with gentle motion */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[#0090DE] to-[#001726]">
        <motion.div
          className="absolute -bottom-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-24 right-10 w-96 h-96 bg-[#0090DE]/30 rounded-full blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20">
        {/* Profile card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative overflow-visible"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Avatar */}
          <motion.div
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={user.photoURL || DEFAULT_AVATAR}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
            />
          </motion.div>

          <div className="mt-20 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {user.displayName || "User"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

            <button
              onClick={() => signOut(auth)}
              className="mt-4 px-5 py-2 bg-[#0090DE] text-white rounded-full hover:bg-[#007bbd] transition"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
