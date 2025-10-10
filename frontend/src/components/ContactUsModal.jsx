// src/components/ContactUsModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, Edit3, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { db, auth, storage } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Backdrop = ({ onClose, children }) => (
  <motion.div
    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <div className="absolute inset-0" onClick={onClose} />
    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </motion.div>
);

const Card = ({ children }) => (
  <motion.div
    className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
    role="dialog"
    aria-modal="true"
    initial={{ y: 40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 30, opacity: 0 }}
  >
    {children}
  </motion.div>
);

export default function ContactUsModal({ open, onClose }) {
  const [view, setView] = useState("menu");
  const [form, setForm] = useState({ name: "", phone: "", email: "", query: "" });
  const [file, setFile] = useState(null);
  const [thanks, setThanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef(null);

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
      alert("❌ Invalid phone number. Must be 10 digits and start with 6/7/8/9.");
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

      // ✅ Save query in Firestore
      await addDoc(collection(db, "queries"), {
        ...form,
        userId: auth.currentUser?.uid || null,
        status: "pending",
        seen: false,
        type: view === "form" ? "form" : "call", // 🔥 differentiate
        imageUrl, // ✅ store uploaded image link
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
      <Backdrop onClose={onClose}>
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-600">
              {thanks ? "Submitted" : "Contact Us"}
            </h2>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {!thanks ? (
            <>
              {view === "menu" && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setView("form")}
                    className="px-4 py-3 rounded-xl bg-cyan-600 text-white font-semibold"
                  >
                    <Edit3 className="inline mr-2" /> Fill Form
                  </button>
                  <button
                    onClick={() => setView("call")}
                    className="px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold"
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
                    className="w-full p-3 border rounded"
                  />
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone (10 digits)"
                    className="w-full p-3 border rounded"
                  />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    className="w-full p-3 border rounded"
                  />
                  <textarea
                    required
                    value={form.query}
                    onChange={(e) => setForm({ ...form, query: e.target.value })}
                    placeholder="Your Query..."
                    rows={3}
                    className="w-full p-3 border rounded"
                  />

                  {/* ✅ File Upload */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">Attach Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {file && (
                      <span className="text-sm text-gray-600">
                        {file.name.length > 20
                          ? file.name.slice(0, 20) + "..."
                          : file.name}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cyan-600 text-white font-bold"
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
                    className="w-full p-3 border rounded"
                  />
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone (10 digits)"
                    className="w-full p-3 border rounded"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold"
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
              <p className="text-gray-500 text-sm">We will get back to you soon.</p>
            </div>
          )}
        </Card>
      </Backdrop>
    </AnimatePresence>
  );
}
