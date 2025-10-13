// src/components/ContactUsModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, Edit3, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { db, auth, storage } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ContactUsModal({ open, onClose }) {
  const [view, setView] = useState("menu");
  const [form, setForm] = useState({ name: "", phone: "", email: "", query: "" });
  const [file, setFile] = useState(null);
  const [thanks, setThanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef(null);

  // 🔒 Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  useEffect(() => {
    if (open) {
      setView("menu");
      setForm({ name: "", phone: "", email: "", query: "" });
      setFile(null);
      setThanks(false);
    }
  }, [open]);

  const validatePhone = (num) => /^[6-9]\d{9}$/.test(num);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!validatePhone(form.phone)) {
      alert("❌ Invalid phone number. Must be 10 digits starting with 6/7/8/9.");
      return;
    }
    setLoading(true);
    try {
      let imageUrl = "";
      if (file) {
        const storageRef = ref(storage, `queries/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "queries"), {
        ...form,
        userId: auth.currentUser?.uid || null,
        status: "pending",
        seen: false,
        type: view === "form" ? "form" : "call",
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setThanks(true);
      closeTimer.current = setTimeout(() => onClose?.(), 2500);
    } catch (err) {
      console.error("❌ Failed to submit query:", err);
      alert("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="contact-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="contact-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-2xl bg-gray-900 text-white p-6 shadow-[0_0_25px_#00c3ff]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#00c3ff] tracking-wide">
                {thanks ? "Submitted" : "Contact Us"}
              </h2>
              <button onClick={onClose}>
                <X className="h-5 w-5 text-gray-400 hover:text-[#00c3ff]" />
              </button>
            </div>

            {!thanks ? (
              <>
                {view === "menu" && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setView("form")}
                      className="px-4 py-3 rounded-xl bg-[#00c3ff] text-white font-semibold shadow-[0_0_10px_#00c3ff] hover:brightness-110"
                    >
                      <Edit3 className="inline mr-2" /> Fill Form
                    </button>
                    <button
                      onClick={() => setView("call")}
                      className="px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-[0_0_10px_rgba(139,92,246,0.8)] hover:brightness-110"
                    >
                      <Phone className="inline mr-2" /> Request Call
                    </button>
                  </div>
                )}

                {view === "form" && (
                  <form onSubmit={onSubmitForm} className="space-y-3">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone (10 digits)"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />
                    <textarea
                      required
                      value={form.query}
                      onChange={(e) => setForm({ ...form, query: e.target.value })}
                      placeholder="Your Query..."
                      rows={3}
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />

                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700">
                        <ImageIcon className="h-5 w-5 text-[#00c3ff]" />
                        <span className="text-sm text-gray-300">Attach Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {file && (
                        <span className="text-sm text-gray-400">
                          {file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-[#00c3ff] text-white font-bold shadow-[0_0_10px_#00c3ff] hover:brightness-110"
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                )}

                {view === "call" && (
                  <form onSubmit={onSubmitForm} className="space-y-3">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone (10 digits)"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-[#00c3ff]/40 text-white placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.8)] hover:brightness-110"
                    >
                      {loading ? "Submitting..." : "Request Call"}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-bold text-lg">Thank you! Your query has been sent.</h3>
                <p className="text-gray-400 text-sm">We will get back to you soon.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
