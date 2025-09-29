import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Utility: normalize user-entered date/time
function parseDateInput(input) {
  // Accepts formats like "09/29/2025", "2025-09-29"
  try {
    const d = new Date(input);
    if (!isNaN(d)) {
      return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }
  } catch {}
  return "";
}

function parseTimeInput(input) {
  // Accepts "1:20 PM", "13:20"
  try {
    const d = new Date(`1970-01-01T${input}`);
    if (!isNaN(d)) {
      return d.toTimeString().slice(0, 5); // "HH:mm"
    }
    // Handle AM/PM manually
    const match = input.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      let minutes = parseInt(match[2] || "0", 10);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  } catch {}
  return "";
}

export default function CreateRoom() {
  const [room, setRoom] = useState({
    title: "",
    description: "",
    date: "", // free text
    time: "", // free text
    link: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setRoom({ ...room, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const normalizedDate = parseDateInput(room.date);
    const normalizedTime = parseTimeInput(room.time);

    if (!room.title || !normalizedDate || !normalizedTime || !room.link) {
      setMsg("❌ Please enter valid title, date, time, and meeting link.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "studyRooms"), {
        title: room.title,
        description: room.description,
        date: normalizedDate,
        time: normalizedTime,
        link: room.link,
        createdAt: serverTimestamp(),
      });
      setMsg("✅ Room created successfully!");
      setRoom({ title: "", description: "", date: "", time: "", link: "" });
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-black/50 text-white rounded-2xl p-6 border border-cyan-500/30">
      <h2 className="text-xl font-bold mb-4">➕ Create Study Room</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          name="title"
          value={room.title}
          onChange={onChange}
          placeholder="Room title"
          className="w-full rounded-lg bg-black/40 border border-cyan-500/40 p-3"
        />
        <textarea
          name="description"
          value={room.description}
          onChange={onChange}
          placeholder="Short description (optional)"
          className="w-full rounded-lg bg-black/40 border border-cyan-500/40 p-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            name="date"
            value={room.date}
            onChange={onChange}
            placeholder="Enter date (e.g., 2025-09-29 or 09/29/2025)"
            className="w-full rounded-lg bg-black/40 border border-cyan-500/40 p-3"
          />
          <input
            type="text"
            name="time"
            value={room.time}
            onChange={onChange}
            placeholder="Enter time (e.g., 13:20 or 1:20 PM)"
            className="w-full rounded-lg bg-black/40 border border-cyan-500/40 p-3"
          />
        </div>
        <input
          name="link"
          value={room.link}
          onChange={onChange}
          placeholder="Meeting link (Google Meet/Zoom)"
          className="w-full rounded-lg bg-black/40 border border-cyan-500/40 p-3"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 font-semibold"
        >
          {saving ? "Saving..." : "Create Room"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
