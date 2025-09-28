import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Send,
  Paperclip,
  Phone,
  MessageCircle,
  Edit3,
  CheckCircle2,
  UploadCloud,
  Trash2,
} from "lucide-react";

// 🔹 Backdrop with animated gradient
const Backdrop = ({ onClose, children }) => (
  <motion.div
    className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-[#0090DE]/60 via-[#00c4ff]/50 to-purple-500/40 backdrop-blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <div className="absolute inset-0" onClick={onClose} />
    <div
      className="relative z-10 flex min-h-full items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </motion.div>
);

// 🔹 Card with glow effect
const Card = ({ children }) => (
  <motion.div
    className="relative w-full max-w-2xl rounded-3xl bg-white/95 dark:bg-gray-900/95 shadow-2xl ring-1 ring-white/20 backdrop-blur-xl overflow-hidden border border-blue-200 dark:border-blue-900"
    role="dialog"
    aria-modal="true"
    initial={{ y: 40, opacity: 0, scale: 0.95 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: 30, opacity: 0, scale: 0.95 }}
    transition={{ type: "spring", damping: 20, stiffness: 200 }}
  >
    {children}
  </motion.div>
);

// 🔹 Animated tab buttons
const TabButton = ({ icon: Icon, children, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="group flex flex-col items-center gap-3 rounded-2xl px-6 py-6 font-bold transition shadow-lg bg-gradient-to-br from-[#0090DE] to-[#00c4ff] text-white hover:shadow-2xl"
  >
    <Icon className="h-7 w-7" />
    {children}
  </motion.button>
);

const Divider = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300/70 to-transparent dark:via-gray-600/70 my-4" />
);

// 🔹 Thank You screen
const ThankYou = ({ title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", damping: 20, stiffness: 200 }}
    className="flex flex-col items-center text-center py-10"
  >
    <CheckCircle2 className="h-14 w-14 text-green-500 mb-3 animate-bounce" />
    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>
    <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 italic">
      This window will close automatically.
    </p>
  </motion.div>
);

const AttachmentPill = ({ file, onRemove }) => {
  const isImage = /image\/(png|jpe?g|gif|webp)/i.test(file.type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-full bg-blue-50 dark:bg-gray-800 px-3 py-1 text-sm shadow"
    >
      {isImage ? (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-6 w-6 rounded object-cover"
        />
      ) : (
        <Paperclip className="h-4 w-4 text-blue-600" />
      )}
      <span className="max-w-[140px] truncate">{file.name}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>
    </motion.div>
  );
};

export default function ContactUsModal({ open, onClose }) {
  const [view, setView] = useState("menu"); // menu | form | chat | call | thanks
  const [thanksPayload, setThanksPayload] = useState({ title: "", subtitle: "" });
  const closeTimer = useRef(null);

  // Form
  const [form, setForm] = useState({ name: "", phone: "", email: "", query: "" });
  const [formFiles, setFormFiles] = useState([]);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      setView("menu");
      setForm({ name: "", phone: "", email: "", query: "" });
      setFormFiles([]);
      setChatMessages([]);
      setChatInput("");
      clearTimeout(closeTimer.current);
    }
    return () => clearTimeout(closeTimer.current);
  }, [open]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const startAutoClose = (ms = 3000) => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      onClose?.();
    }, ms);
  };

  // Submit Form
  const onSubmitForm = (e) => {
    e.preventDefault();
    setThanksPayload({
      title: "Thank you! Your query has been sent.",
      subtitle: "Our team will get back to you shortly.",
    });
    setView("thanks");
    startAutoClose();
  };

  // Send Chat
  const onClickChatSend = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: crypto.randomUUID(),
      self: true,
      text: chatInput,
      ts: new Date().toISOString(),
    };
    setChatMessages((m) => [...m, msg]);
    setChatInput("");
  };

  const onTerminateChat = () => {
    setChatMessages([]);
    setThanksPayload({
      title: "Chat ended. Thank you!",
      subtitle: "We hope your query was resolved.",
    });
    setView("thanks");
    startAutoClose();
  };

  // Call
  const onClickCallMe = () => {
    setThanksPayload({
      title: "Request received!",
      subtitle: "Our team will contact you within the next 60 minutes.",
    });
    setView("thanks");
    startAutoClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <Backdrop onClose={onClose}>
        <Card>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-6 bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white"
          >
            <h2 className="text-2xl font-extrabold">
              {view === "menu" && "Contact Us"}
              {view === "form" && "Submit Your Query"}
              {view === "chat" && "Live Chat"}
              {view === "call" && "Call Request"}
              {view === "thanks" && "Thank you!"}
            </h2>
            <button
              className="absolute right-4 top-4 rounded-full p-2 bg-white/20 hover:bg-white/40"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>

          <Divider />

          {/* Body */}
          <div className="p-6">
            {/* MENU */}
            {view === "menu" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <TabButton icon={Edit3} onClick={() => setView("form")}>
                  Fill the Form
                </TabButton>
                <TabButton icon={MessageCircle} onClick={() => setView("chat")}>
                  Chat with Us
                </TabButton>
                <TabButton icon={Phone} onClick={() => setView("call")}>
                  Call Us
                </TabButton>
              </motion.div>
            )}

            {/* FORM */}
            {view === "form" && (
              <motion.form
                onSubmit={onSubmitForm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full rounded-xl border px-3 py-3 shadow focus:ring-2 focus:ring-[#00c4ff]"
                />
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full rounded-xl border px-3 py-3 shadow focus:ring-2 focus:ring-[#00c4ff]"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-xl border px-3 py-3 shadow focus:ring-2 focus:ring-[#00c4ff]"
                />
                <textarea
                  required
                  value={form.query}
                  onChange={(e) => setForm({ ...form, query: e.target.value })}
                  placeholder="Your query..."
                  rows={3}
                  className="w-full rounded-xl border px-3 py-3 shadow focus:ring-2 focus:ring-[#00c4ff]"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl py-3 bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-bold hover:shadow-lg"
                >
                  Submit
                </button>
              </motion.form>
            )}

            {/* CHAT */}
            {view === "chat" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-inner">
                  {chatMessages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: m.self ? 30 : -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`mb-3 flex ${m.self ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${
                          m.self
                            ? "bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 rounded-xl border px-3 py-3 shadow focus:ring-2 focus:ring-[#00c4ff]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClickChatSend}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white"
                  >
                    <Send className="h-5 w-5" />
                  </motion.button>
                  <button
                    onClick={onTerminateChat}
                    className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700"
                  >
                    Terminate
                  </button>
                </div>
              </motion.div>
            )}

            {/* CALL */}
            {view === "call" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <p>Tap below and our team will call you within 60 minutes.</p>
                <button
                  onClick={onClickCallMe}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-bold hover:shadow-lg"
                >
                  <Phone className="inline h-5 w-5 mr-2" /> CALL ME
                </button>
              </motion.div>
            )}

            {/* THANK YOU */}
            {view === "thanks" && (
              <ThankYou title={thanksPayload.title} subtitle={thanksPayload.subtitle} />
            )}
          </div>
        </Card>
      </Backdrop>
    </AnimatePresence>
  );
}
