// src/components/QueryResponsePopup.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { X } from "lucide-react";

export default function QueryResponsePopup() {
  const [queryDoc, setQueryDoc] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // ✅ Listen for resolved but unseen queries of this user
    const q = query(
      collection(db, "queries"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "resolved"),
      where("seen", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Take first unseen resolved query
        setQueryDoc({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });

    return () => unsub();
  }, []);

  const handleClose = async () => {
    if (queryDoc) {
      await updateDoc(doc(db, "queries", queryDoc.id), { seen: true });
      setQueryDoc(null);
    }
  };

  return (
    <AnimatePresence>
      {queryDoc && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-lg w-full relative border border-cyan-600"
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={handleClose}
            >
              <X className="h-5 w-5 text-gray-800 dark:text-gray-200" />
            </button>

            {/* Header */}
            <h2 className="text-2xl font-bold text-center text-cyan-500 mb-4">
              📩 Response to your Query
            </h2>

            {/* User Query */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4">
              <p className="text-gray-800 dark:text-gray-200 text-sm">
                <b>Your Query:</b> {queryDoc.query}
              </p>
              {queryDoc.createdAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Asked on:{" "}
                  {new Date(queryDoc.createdAt.toDate()).toLocaleString()}
                </p>
              )}
            </div>

            {/* Admin Reply */}
            <div className="bg-green-100 dark:bg-green-800 p-4 rounded-lg border border-green-400">
              <p className="text-green-800 dark:text-green-200 font-medium">
                <b>Admin Reply:</b>
              </p>
              <p className="mt-1 text-green-700 dark:text-green-300">
                {queryDoc.reply || "Your query has been resolved."}
              </p>
            </div>

            {/* Action */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
