// src/pages/MentorshipPageAdvanced.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  addDoc,
  deleteDoc,
  serverTimestamp,
  where,
  orderBy,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Loader2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Trash2,
  CreditCard,
  XCircle,
} from "lucide-react";

const IS_PRODUCTION = false;

export default function MentorshipPageAdvanced() {
  const [user] = useAuthState(auth);
  const [userDoc, setUserDoc] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDone, setPaymentDone] = useState(false);
  const [uniqueCode, setUniqueCode] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [freeLeft, setFreeLeft] = useState(0);
  const [price, setPrice] = useState(0);

  // cancel popup
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelInput, setCancelInput] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const containerRef = useRef(null);

  // 🔹 Fetch user data
  useEffect(() => {
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

  // 🔹 Fetch mentors
  useEffect(() => {
    const q = query(collection(db, "mentors"));
    const unsub = onSnapshot(q, (snap) =>
      setMentors(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // 🔹 Fetch booked slots
  useEffect(() => {
    const q = query(collection(db, "mentorshipBookings"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data().slotId);
      setBookedSlots(data);
    });
    return () => unsub();
  }, []);

  // 🔹 Fetch user's bookings
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "mentorshipBookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyBookings(data);
    });
    return () => unsub();
  }, [user]);

  // 🔹 Fetch slots for selected mentor
  useEffect(() => {
    if (!selectedMentor) return;
    const q = query(
      collection(db, "mentors", selectedMentor.id, "slots"),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [selectedMentor]);

  // 🔹 Calculate free limits dynamically
  useEffect(() => {
    if (!userDoc) return;
    const plan = userDoc?.plan?.toLowerCase();
    const bookingCount = myBookings.length;
    let freeLimit = 0;
    if (plan === "samarpan") freeLimit = 10;
    else if (plan === "shikhar") freeLimit = 4;
    else if (plan === "safalta") freeLimit = 1;
    const left = Math.max(freeLimit - bookingCount, 0);
    setFreeLeft(left);
  }, [userDoc, myBookings]);

  const hasActiveBooking = myBookings.some((b) => b.status !== "completed");

  // 🔹 Cancel Popup
  const openCancelPopup = (booking) => {
    setBookingToCancel(booking);
    setCancelInput("");
    setShowCancelPopup(true);
  };

  const confirmCancel = async () => {
    if (cancelInput.trim().toUpperCase() !== "CONFIRM") {
      alert("Please type CONFIRM to proceed with cancellation.");
      return;
    }
    try {
      await deleteDoc(doc(db, "mentorshipBookings", bookingToCancel.id));
      alert("Booking cancelled successfully.");
      setShowCancelPopup(false);
      setBookingToCancel(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Payment handler with free trial system
  const handlePayment = async () => {
    if (hasActiveBooking)
      return alert("You already have an active booking.");
    if (!selectedMentor || !selectedSlot)
      return alert("Please select a mentor and slot.");

    const plan = userDoc?.plan?.toLowerCase();
    const bookingCount = myBookings.length;

    let freeLimit = 0;
    if (plan === "samarpan") freeLimit = 10;
    else if (plan === "shikhar") freeLimit = 4;
    else if (plan === "safalta") freeLimit = 1;

    const isFree = bookingCount < freeLimit;
    const sessionPrice = isFree ? 0 : 500;
    const paymentStatus = isFree ? "free" : IS_PRODUCTION ? "paid" : "test";

    if (!isFree) {
      const confirmPay = window.confirm(
        "This session costs ₹500. Do you want to proceed?"
      );
      if (!confirmPay) return;
    }

    const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    setUniqueCode(randomCode);
    setPrice(sessionPrice);
    setPaymentDone(true);

    await addDoc(collection(db, "mentorshipBookings"), {
      userId: user?.uid,
      userName: userDoc?.name || "Aspirant",
      mentorId: selectedMentor.id,
      mentorName: selectedMentor.name,
      slotId: selectedSlot.id,
      slotTime: selectedSlot.time,
      slotDate: selectedSlot.date,
      code: randomCode,
      createdAt: serverTimestamp(),
      status: paymentStatus,
      price: sessionPrice,
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="animate-spin text-cyan-400" size={48} />
      </div>
    );

  const plan = userDoc?.plan?.toLowerCase();
  if (!["samarpan", "safalta", "shikhar"].includes(plan))
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
        <AlertCircle className="text-red-400 mb-3" size={48} />
        <p>Upgrade your plan to access Mentorship.</p>
      </div>
    );

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 font-[Inter] py-20"
    >
      {/* Header */}
      <h1 className="text-5xl font-bold text-white tracking-tight text-center mb-3">
        Personal Mentorship
      </h1>
      <p className="text-center text-gray-400 text-lg mb-10">
        Plan:{" "}
        <span className="font-semibold text-cyan-400 capitalize">
          {userDoc?.plan}
        </span>{" "}
        | Free Mentorships Left:{" "}
        <span className="text-emerald-400 font-semibold">{freeLeft}</span>
      </p>

      {/* My Bookings */}
      <motion.div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg p-6 mb-10 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">
          My Bookings
        </h2>
        {myBookings.length === 0 ? (
          <p className="text-center text-gray-400">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-3 text-left">Mentor</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="p-3">{b.mentorName}</td>
                    <td className="p-3">{b.slotDate}</td>
                    <td className="p-3">{b.slotTime}</td>
                    <td className="p-3 font-mono text-cyan-300">{b.code}</td>
                    <td
                      className={`p-3 font-semibold ${
                        b.status === "completed"
                          ? "text-emerald-400"
                          : b.status === "free"
                          ? "text-cyan-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {b.status}
                    </td>
                    <td className="p-3">
                      {b.status !== "completed" && (
                        <button
                          onClick={() => openCancelPopup(b)}
                          className="text-red-400 hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Mentor and Slots */}
      {!selectedMentor && (
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <motion.div
              key={m.id}
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedMentor(m)}
              className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300">
                  <User />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {m.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {m.qualification}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                {m.description ||
                  "Guidance, strategy, and support for your preparation."}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {selectedMentor && !selectedSlot && (
        <div className="max-w-5xl mx-auto mt-10">
          <button
            onClick={() => setSelectedMentor(null)}
            className="text-cyan-400 hover:underline mb-4 text-sm"
          >
            ← Change Mentor
          </button>
          <h2 className="text-2xl font-semibold text-cyan-300 text-center mb-6">
            Available Slots with {selectedMentor.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {slots.map((s) => {
              const isBooked = bookedSlots.includes(s.id);
              return (
                <motion.div
                  key={s.id}
                  whileHover={!isBooked ? { y: -4 } : {}}
                  onClick={() => !isBooked && setSelectedSlot(s)}
                  className={`rounded-2xl border p-6 text-center transition ${
                    isBooked
                      ? "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                      : "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                  }`}
                >
                  <Clock className="mx-auto text-cyan-400 mb-2" />
                  <p className="font-semibold text-white">
                    {new Date(s.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-gray-400 text-sm">{s.time}</p>
                  {isBooked && (
                    <p className="text-xs text-red-400 mt-2">Booked</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {selectedSlot && (
        <div className="text-center mt-12">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            Confirm & Pay ₹500
          </h2>
          <p className="text-gray-400 mb-8">
            {freeLeft > 0
              ? `You still have ${freeLeft} free mentorship${
                  freeLeft > 1 ? "s" : ""
                } left. This session will be FREE.`
              : "No free mentorships left. This session will cost ₹500."}
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePayment}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold shadow-md"
          >
            <CreditCard size={18} className="inline mr-2" />
            {freeLeft > 0 ? "Book Free Session" : "Pay & Confirm"}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {paymentDone && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-12 max-w-lg mx-auto bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 text-center text-white"
          >
            <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-3 text-cyan-300">
              {price === 0 ? "Free Mentorship Booked!" : "Payment Successful"}
            </h2>
            <p className="text-gray-400 mb-4">
              {price === 0
                ? `This was a free session. You now have ${Math.max(
                    freeLeft - 1,
                    0
                  )} free mentorship${freeLeft - 1 === 1 ? "" : "s"} left.`
                : `You now have ${freeLeft} free mentorship${freeLeft === 1 ? "" : "s"} remaining.`}
            </p>
            <div className="bg-white/10 p-4 rounded-lg font-mono text-lg tracking-wider mb-4 select-all">
              {uniqueCode}
            </div>
            <button
              onClick={() => {
                setPaymentDone(false);
                setSelectedSlot(null);
                setSelectedMentor(null);
              }}
              className="text-cyan-400 hover:underline text-sm"
            >
              ← Back to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Popup */}
      <AnimatePresence>
        {showCancelPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
            >
              <XCircle className="mx-auto text-red-400 mb-3" size={48} />
              <h2 className="text-2xl font-semibold text-white mb-3">
                Are you sure you want to cancel?
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Cancelling this session will{" "}
                <span className="text-red-400 font-semibold">
                  not refund your money
                </span>
                .<br />
                Please be very sure before proceeding — we value both your and
                our mentor’s time.
              </p>
              <input
                type="text"
                placeholder='Type "CONFIRM" to cancel'
                value={cancelInput}
                onChange={(e) => setCancelInput(e.target.value)}
                className="w-full bg-white/10 text-gray-100 rounded-lg p-2 mb-4 text-center placeholder-gray-500 focus:outline-none"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={confirmCancel}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  Confirm Cancel
                </button>
                <button
                  onClick={() => setShowCancelPopup(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
