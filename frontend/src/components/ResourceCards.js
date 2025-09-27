import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";

function ResourceCards() {
  const [user] = useAuthState(auth);
  const [popup, setPopup] = useState({ show: false, message: "" });

  // ⚠️ Replace this with Firestore later
  const userPlan = user ? "lakshya" : null;

  // ✅ access rules
  const canAccessMaps =
    userPlan && ["lakshya", "safalta", "shikhar", "samarpan"].includes(userPlan);
  const canAccessDynasty =
    userPlan && ["safalta", "shikhar", "samarpan"].includes(userPlan);
  const canAccessPapers = !!userPlan;
  const canAccessNewspapers =
    userPlan && ["lakshya", "safalta", "shikhar", "samarpan"].includes(userPlan);

  const cards = [
    {
      title: "Maps",
      img: "/assets/maps.png",
      allowed: canAccessMaps,
      link: "/resources/maps",
      needPlan: "Lakshya or higher",
    },
    {
      title: "Dynasty Charts",
      img: "/assets/dynasty.png",
      allowed: canAccessDynasty,
      link: "/resources/dynasty",
      needPlan: "Safalta or higher",
    },
    {
      title: "Previous Year Papers",
      img: "/assets/papers.png",
      allowed: canAccessPapers,
      link: "/resources/papers",
      needPlan: "Any plan",
    },
    {
      title: "Newspapers",
      img: "/assets/newspapers.png",
      allowed: canAccessNewspapers,
      link: "/resources/newspapers",
      needPlan: "Lakshya or higher",
    },
  ];

  const handleClick = (card) => {
    if (!user) {
      setPopup({ show: true, message: "Please log in to access this resource." });
    } else if (!card.allowed) {
      setPopup({
        show: true,
        message: `This resource is locked. Please upgrade to ${card.needPlan}.`,
      });
    } else {
      window.location.href = card.link;
    }
  };

  return (
    <>
      {/* Cards Grid */}
      <div className="mt-12 max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            onClick={() => handleClick(card)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
            viewport={{ once: false, amount: 0.2 }}
            className="relative group rounded-2xl overflow-hidden shadow-lg cursor-pointer aspect-square max-h-[330px]"
          >
            {/* Card image */}
            <img
              src={card.img}
              alt={card.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay title */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-3 font-semibold text-lg">
              {card.title}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-sm text-center"
            >
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                Access Restricted
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{popup.message}</p>
              <button
                onClick={() => setPopup({ show: false, message: "" })}
                className="mt-2 px-5 py-2 bg-[#0090DE] text-white rounded-lg hover:bg-[#007bbd] transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ResourceCards;
