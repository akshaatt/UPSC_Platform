import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

const IS_PRODUCTION = false;

export default function MentorshipPage() {
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

  // 🔹 Fetch user plan
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

  // 🔹 Fetch booked slots (real-time)
  useEffect(() => {
    const q = query(collection(db, "mentorshipBookings"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data().slotId);
      setBookedSlots(data);
    });
    return () => unsub();
  }, []);

  // 🔹 Fetch current user’s bookings (real-time)
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

const hasActiveBooking = myBookings.some((b) => b.status !== "completed");


  // ✅ Cancel Booking
  const handleCancelBooking = async (booking) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await deleteDoc(doc(db, "mentorshipBookings", booking.id));
      alert("✅ Booking cancelled successfully.");
      setSelectedSlot(null);
      setSelectedMentor(null);
      setPaymentDone(false);
      setUniqueCode("");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ✅ Book Slot (Mock Payment)
  const handlePayment = async () => {
    if (hasActiveBooking)
      return alert("❌ You already have an active booking.");

    if (!selectedMentor || !selectedSlot)
      return alert("Please select a mentor and slot.");

    const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    setUniqueCode(randomCode);
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
      status: IS_PRODUCTION ? "paid" : "test",
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-cyan-600" size={40} />
      </div>
    );

  const plan = userDoc?.plan?.toLowerCase();
  if (!["samarpan", "safalta", "shikhar"].includes(plan))
    return (
      <div className="h-screen flex flex-col justify-center items-center text-gray-700">
        <AlertCircle className="text-red-500 mb-3" size={40} />
        <p>Upgrade your plan to access Mentorship.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-800 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* 🌟 Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-extrabold text-cyan-600 mb-2">
            Personal Mentorship
          </h1>
          <p className="text-gray-600">
            Your Plan:{" "}
            <span className="font-semibold capitalize text-cyan-700">
              {userDoc?.plan || "Free"}
            </span>
          </p>
        </motion.div>

        {/* 📘 Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-10 border border-cyan-100"
        >
          <h2 className="text-xl font-semibold mb-4 text-cyan-700">
            Instructions Before Booking
          </h2>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>This is a 1-on-1 mentorship session with your mentor.</li>
            <li>Each session costs ₹500 and lasts 45 minutes.</li>
            <li>You can only have one active booking at a time.</li>
            <li>Cancel to free your slot if you can’t attend.</li>
          </ul>
        </motion.div>

        {/* 🧾 My Bookings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6 text-cyan-700 text-center">
            My Bookings
          </h2>
          <div className="overflow-auto border border-cyan-100 rounded-2xl shadow-md">
            {myBookings.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                No bookings yet.
              </p>
            ) : (
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-cyan-50 text-cyan-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Mentor</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {b.mentorName}
                      </td>
                      <td className="px-4 py-2">{b.slotDate}</td>
                      <td className="px-4 py-2">{b.slotTime}</td>
                      <td className="px-4 py-2 text-cyan-700 font-mono">
                        {b.code}
                      </td>
                      <td
                        className={`px-4 py-2 capitalize font-semibold ${
                          b.status === "completed"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {b.status}
                      </td>
                      <td className="px-4 py-2">
                        {b.status !== "completed" && (
                          <button
                            onClick={() => handleCancelBooking(b)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 size={16} /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Booking Flow */}
        {!hasActiveBooking && !paymentDone && (
          <>
            {/* Mentor Selection */}
            {!selectedMentor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-semibold mb-6 text-center text-cyan-700">
                  Select Your Mentor
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {mentors.map((m) => (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      key={m.id}
                      onClick={() => setSelectedMentor(m)}
                      className="cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <User className="text-cyan-600" size={26} />
                        <div>
                          <h3 className="text-lg font-semibold">{m.name}</h3>
                          <p className="text-sm text-gray-500">
                            {m.qualification}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {m.description ||
                          "Mentorship guidance and strategy sessions."}
                      </p>
                      <p className="text-xs text-cyan-600 mt-1">
                        {m.specialization || ""}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Slot Selection */}
            {selectedMentor && !selectedSlot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mt-12"
              >
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="mb-6 text-cyan-600 hover:underline text-sm"
                >
                  ← Change Mentor
                </button>
                <h2 className="text-2xl font-semibold mb-6 text-center text-cyan-700">
                  Available Slots with {selectedMentor.name}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {slots.length === 0 && (
                    <p className="text-center text-gray-500 col-span-3">
                      No slots available.
                    </p>
                  )}
                  {slots.map((s) => {
                    const isBooked = bookedSlots.includes(s.id);
                    return (
                      <motion.div
                        key={s.id}
                        whileHover={!isBooked ? { scale: 1.05 } : {}}
                        onClick={() => !isBooked && setSelectedSlot(s)}
                        className={`cursor-pointer border rounded-2xl p-6 shadow-md text-center transition ${
                          isBooked
                            ? "bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed"
                            : "bg-white border-gray-200 hover:shadow-lg"
                        }`}
                      >
                        <Clock className="mx-auto mb-2 text-cyan-600" />
                        <p className="font-semibold">
                          {new Date(s.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-gray-600 text-sm">{s.time}</p>
                        {isBooked && (
                          <p className="text-xs text-red-500 mt-2">Booked</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Payment */}
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mt-12 text-center"
              >
                <h2 className="text-2xl font-semibold mb-4 text-cyan-700">
                  Confirm & Pay ₹500
                </h2>
                <p className="text-gray-600 mb-8">
                  Once paid, your mentorship session will be booked.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePayment}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg"
                >
                  Pay ₹500 & Confirm
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {/* ✅ Confirmation */}
        {paymentDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-12 max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center"
          >
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-cyan-700 mb-3">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Take a screenshot of this confirmation and carry it for your
              mentorship session.
            </p>
            <div className="bg-gray-100 text-gray-800 font-mono text-lg tracking-wider p-4 rounded-lg mb-4 select-all">
              {uniqueCode}
            </div>
            <button
              onClick={() => {
                setPaymentDone(false);
                setSelectedSlot(null);
                setSelectedMentor(null);
              }}
              className="text-cyan-600 mt-4 hover:underline text-sm"
            >
              ← Back to Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
