import React, { useEffect, useState, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { getFunctions, httpsCallable } from "firebase/functions";
import { MessageCircle } from "lucide-react";
import {
  LogOut,
  LayoutGrid,
  BookPlus,
  Youtube,
  Video,
  Users,
  ExternalLink,
  Trash2,
  X,
  Newspaper,
  PenLine,
  Calendar,
} from "lucide-react"; 

import Logo from "../components/Logo.jsx";
import AddTests from "../components/AddTests";
import AddMainsQuestions from "./AddMainsQuestions";
import StudentMainsData from "../components/StudentMainsData";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  where,
  setDoc,
  getDocs
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// 🔹 Tabs
const tabs = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "room", label: "Create Room", icon: BookPlus },
  { key: "yt", label: "Add YouTube Video", icon: Youtube },
  { key: "custom", label: "Add Custom Video", icon: Video },
  { key: "resources", label: "Add Resource Cards", icon: BookPlus },
  { key: "library", label: "Library", icon: BookPlus },
  { key: "currentAffairs", label: "Current Affairs", icon: Newspaper },
  { key: "students", label: "Students", icon: Users },
  { key: "tests", label: "Add Prelims Test", icon: BookPlus },
  { key: "mains", label: "Add Mains Questions", icon: PenLine },
  { key: "mainsData", label: "Student Mains Data", icon: Users },
  { key: "dailyTestControl", label: "Daily Test Control", icon: PenLine }, // ✅ new tab
  { key: "csatControl", label: "CSAT Control", icon: BookPlus },
  { key: "queries", label: "User Queries", icon: MessageCircle },
  { key: "calendarControl", label: "Calendar", icon: Calendar },
  { key: "headlinesPdf", label: "Generate Headlines PDF", icon: Newspaper },


];

export default function Dashboard() {
  const nav = useNavigate();
  const [active, setActive] = useState("overview");

  const logout = () => {
    localStorage.removeItem("admin_auth");
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            UID: {auth.currentUser?.uid || "Not signed in"}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white/70 dark:bg-white/10 px-4 py-2 text-sm text-gray-800 dark:text-gray-100 border border-white/30 hover:bg-white/90 dark:hover:bg-white/20 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[220px_1fr] gap-6 p-6">
        {/* Sidebar */}
        <aside className="glass rounded-2xl p-4">
          <nav className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  active === key
                    ? "bg-white/70 dark:bg-white/10 text-gray-900 dark:text-gray-100"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="glass rounded-2xl p-6">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {active === "overview" && <Overview />}
            {active === "room" && <CreateRoom />}
            {active === "yt" && <AddYouTubeVideo />}
            {active === "custom" && <AddCustomVideo />}
            {active === "resources" && <AddResourceCards />}
            {active === "library" && <LibraryAdmin />}
            {active === "currentAffairs" && <CurrentAffairsAdmin />}
            {active === "students" && <StudentsTable />}
            {active === "tests" && <AddTests />}
            {active === "mains" && <AddMainsQuestions />}
            {active === "mainsData" && <StudentMainsData />}
            {active === "dailyTestControl" && <DailyTestControl />} {/* ✅ New */}
            {active === "csatControl" && <CsatControl />}
            {active === "queries" && <QueriesAdmin />}
            {active === "calendarControl" && <CalendarAdmin />}
            {active === "headlinesPdf" && <HeadlinesPdfGenerator />}



          </motion.div>
        </main>
      </div>
    </div>
  );
}
/*---------------------------
HEADLINE PDF GENERATOR
---------------------------*/
function HeadlinesPdfGenerator() {
  const [headline, setHeadline] = useState("");
  const [headlines, setHeadlines] = useState([]);
  const [date, setDate] = useState("");

  const addHeadline = () => {
    if (!headline.trim()) return;
    setHeadlines([...headlines, headline.trim()]);
    setHeadline("");
  };

  const deleteHeadline = (i) => {
    setHeadlines(headlines.filter((_, idx) => idx !== i));
  };

  const generatePDF = async () => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const templateImg = "/White and Black Professional Magazine Cover.png"; 
  // ✅ ensure this file is in public folder

  let y = 90; // Headlines start below "HERE ARE YOUR MAJOR CURRENT AFFAIRS"
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  const lineHeight = 10;
  const maxPerPage = 15;

  let count = 0;
  for (let i = 0; i < headlines.length; i++) {
    if (count === 0) {
      // Background template
      doc.addImage(templateImg, "PNG", 0, 0, pageWidth, pageHeight);

      // Insert Date (top right near DATE:)
      if (date) {
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(date, pageWidth - 40, 42); 
      }
    }

    // Headline text
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    const text = `${i + 1}. ${headlines[i]}`;
    const splitText = doc.splitTextToSize(text, rightMargin - leftMargin);
    doc.text(splitText, leftMargin, y);

    y += splitText.length * 8 + lineHeight;
    count++;

    // Page overflow
    if (y > pageHeight - 30 || count >= maxPerPage) {
      doc.addPage();
      y = 90;
      count = 0;
    }
  }

  doc.save(`Satyapath_Headlines_${date || "no-date"}.pdf`);
};


  return (
    <div className="p-6 bg-gray-900 rounded-xl space-y-6 text-white">
      <h2 className="text-2xl font-bold text-cyan-400">📰 Generate Daily Current Affairs PDF</h2>

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white"
      />

      {/* Headline input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Enter a headline"
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={addHeadline}
          className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700"
        >
          ➕ Add
        </button>
      </div>

      {/* Headlines list */}
      <div className="space-y-2">
        {headlines.map((h, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-2 bg-gray-800 rounded border border-gray-700"
          >
            <span>{i + 1}. {h}</span>
            <button
              onClick={() => deleteHeadline(i)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {headlines.length > 0 && (
        <button
          onClick={generatePDF}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-semibold hover:opacity-90"
        >
          🚀 Generate PDF
        </button>
      )}
    </div>
  );
}
/*===========================
calender
===========================*/
function CalendarAdmin() {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [events, setEvents] = useState([]);

  const [pdfTitle, setPdfTitle] = useState("");
  const [file, setFile] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [msg, setMsg] = useState("");
  const storage = getStorage();

  // 🔹 Fetch Events
  useEffect(() => {
    const q = query(collection(db, "upscCalendarEvents"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // 🔹 Fetch Downloads
  useEffect(() => {
    const q = query(collection(db, "upscCalendarDownloads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setDownloads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // 🔹 Add Event
  const addEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return setMsg("⚠️ Title and date required.");
    try {
      await addDoc(collection(db, "upscCalendarEvents"), {
        title: eventTitle,
        date: eventDate,
        createdAt: serverTimestamp(),
      });
      setEventTitle("");
      setEventDate("");
      setMsg("✅ Event added!");
    } catch (err) {
      setMsg("❌ Error: " + err.message);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    await deleteDoc(doc(db, "upscCalendarEvents", id));
  };

  // 🔹 Upload PDF
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!pdfTitle || !file) return setMsg("⚠️ Title and file required.");
    try {
      const storagePath = `upsc-calendar/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, "upscCalendarDownloads"), {
        title: pdfTitle,
        fileName: file.name,
        fileUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      setPdfTitle("");
      setFile(null);
      setMsg("✅ File uploaded!");
    } catch (err) {
      setMsg("❌ Upload failed: " + err.message);
    }
  };

  const handleDeletePdf = async (item) => {
    if (!window.confirm("Delete this file?")) return;
    await deleteObject(ref(storage, item.storagePath));
    await deleteDoc(doc(db, "upscCalendarDownloads", item.id));
  };

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold text-gray-100">📅 UPSC Calendar Control</h2>

      {/* Add Event */}
      <div className="bg-gray-900 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">➕ Add Event</h3>
        <form onSubmit={addEvent} className="flex gap-3">
          <input
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Event title (e.g., Prelims Exam)"
            className="flex-1 p-3 rounded bg-gray-800 text-white"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="p-3 rounded bg-gray-800 text-white"
          />
          <button className="px-4 py-2 bg-cyan-600 rounded text-white">Add</button>
        </form>
        <div className="mt-4 space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex justify-between bg-gray-800 p-3 rounded">
              <span className="text-white">{ev.title} — {ev.date}</span>
              <button
                onClick={() => deleteEvent(ev.id)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upload PDF */}
      <div className="bg-gray-900 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">📂 Upload Calendar PDF</h3>
        <form onSubmit={handleUpload} className="flex gap-3 flex-wrap">
          <input
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="PDF Title"
            className="flex-1 p-3 rounded bg-gray-800 text-white"
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="p-3 text-white"
          />
          <button className="px-4 py-2 bg-purple-600 rounded text-white">Upload</button>
        </form>
        <div className="mt-4 space-y-2">
          {downloads.map((d) => (
            <div key={d.id} className="flex justify-between bg-gray-800 p-3 rounded">
              <span className="text-white">{d.title}</span>
              <div className="flex gap-2">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  View
                </a>
                <button
                  onClick={() => handleDeletePdf(d)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg && <p className="text-sm text-cyan-400">{msg}</p>}
    </div>
  );
}

/*------------------------------
conatct us
------------------------------*/
function QueriesAdmin() {
  const [queries, setQueries] = useState([]);
  const [replies, setReplies] = useState({});
  const [passwords, setPasswords] = useState({});

  useEffect(() => {
    const q = query(collection(db, "queries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setQueries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Resolve handler
  const markResolved = async (id, type) => {
    if (passwords[id] !== "1234") {
      alert("❌ Wrong password. Resolve not allowed.");
      return;
    }

    let updateData = { status: "resolved" };
    if (type === "form") {
      updateData.reply = replies[id] || "No reply provided.";
    }

    await setDoc(doc(db, "queries", id), updateData, { merge: true });

    // reset
    setReplies((prev) => ({ ...prev, [id]: "" }));
    setPasswords((prev) => ({ ...prev, [id]: "" }));
  };

  // ✅ Export All Queries to Excel (Firestore direct)
  const exportToExcel = async () => {
    try {
      const snap = await getDocs(collection(db, "queries"));
      if (snap.empty) {
        alert("No queries in Firestore");
        return;
      }

      const data = snap.docs.map((d) => {
        const q = d.data();
        return {
          Name: q.name,
          Phone: q.phone,
          Email: q.email || "N/A",
          Query: q.query,
          Type: q.type === "form" ? "Form Submission" : "Call Request",
          Reply: q.reply || "N/A",
          Status: q.status === "resolved" ? "Solved" : "Unsolved",
          CreatedAt: q.createdAt
            ? new Date(q.createdAt.toDate()).toLocaleString()
            : "N/A",
          Image: q.imageUrl || "N/A",
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Queries");
      XLSX.writeFile(wb, "all_queries_backup.xlsx");
    } catch (err) {
      console.error("❌ Excel export failed:", err);
      alert("Failed to export queries");
    }
  };

  // ✅ Delete only from UI
  const deleteFromUI = (id) => {
    setQueries((prev) => prev.filter((q) => q.id !== id));
  };

  const pending = queries.filter((q) => q.status === "pending");
  const resolved = queries.filter((q) => q.status === "resolved");

  const renderTypeBadge = (type) => {
    if (type === "form") {
      return (
        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
          📄 Form
        </span>
      );
    }
    if (type === "call") {
      return (
        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded">
          📞 Call
        </span>
      );
    }
    return null;
  };

  // ✅ Show image block
  const renderImage = (q) => {
    if (!q.imageUrl) return null;
    return (
      <div className="mt-3">
        <p className="text-gray-400 text-sm mb-1">📷 Attached Image:</p>
        <a href={q.imageUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={q.imageUrl}
            alt="attachment"
            className="w-32 h-32 object-cover rounded-lg border border-gray-600 hover:scale-105 transition"
          />
        </a>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold text-cyan-400 flex items-center gap-3">
          📩 User Queries
          {/* ✅ Pending Counter (Blinking) */}
          {pending.length > 0 && (
            <span className="ml-2 px-3 py-1 text-sm font-bold rounded-full bg-red-600 text-white animate-pulse">
              {pending.length}
            </span>
          )}
        </h2>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold shadow-md"
        >
          📊 Download All Queries (Excel)
        </button>
      </div>

      {/* Pending */}
      <h3 className="text-xl font-semibold text-yellow-400 mb-3">⏳ Pending</h3>
      {pending.length === 0 ? (
        <p className="text-gray-500 mb-6">No pending queries</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {pending.map((q) => (
            <div
              key={q.id}
              className="p-5 bg-gray-800/80 border border-gray-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-lg text-cyan-300">
                  {q.name} {renderTypeBadge(q.type)}
                </p>
                <button
                  onClick={() => deleteFromUI(q.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  🗑 Remove (UI)
                </button>
              </div>
              <p className="text-gray-400">📞 {q.phone}</p>
              <p className="text-gray-300 mt-2">{q.query}</p>

              {/* Image block */}
              {renderImage(q)}

              {q.type === "form" && (
                <div className="mt-3 space-y-3">
                  <textarea
                    placeholder="Write your reply..."
                    value={replies[q.id] || ""}
                    onChange={(e) =>
                      setReplies((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded-lg bg-gray-900 text-white border border-gray-600"
                  />
                  <input
                    type="password"
                    placeholder="Enter password (1234)"
                    value={passwords[q.id] || ""}
                    onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded-lg bg-gray-900 text-white border border-gray-600"
                  />
                  <button
                    onClick={() => markResolved(q.id, "form")}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
                  >
                    ✅ Resolve & Reply
                  </button>
                </div>
              )}

              {q.type === "call" && (
                <div className="mt-3 space-y-3">
                  <input
                    type="password"
                    placeholder="Enter password (1234)"
                    value={passwords[q.id] || ""}
                    onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    className="w-full p-2 rounded-lg bg-gray-900 text-white border border-gray-600"
                  />
                  <button
                    onClick={() => markResolved(q.id, "call")}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md"
                  >
                    ☎️ I Have Called
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolved */}
      <h3 className="text-xl font-semibold text-green-400 mb-3">✔️ Resolved</h3>
      {resolved.length === 0 ? (
        <p className="text-gray-500">No resolved queries</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {resolved.map((q) => (
            <div
              key={q.id}
              className="p-5 bg-gray-800/60 border border-gray-700 rounded-xl shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-lg text-cyan-300">
                  {q.name} {renderTypeBadge(q.type)}
                </p>
                <button
                  onClick={() => deleteFromUI(q.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  🗑 Remove (UI)
                </button>
              </div>
              <p className="text-gray-400">📞 {q.phone}</p>
              <p className="text-gray-300 mt-2">{q.query}</p>

              {/* Image block */}
              {renderImage(q)}

              {q.type === "form" && q.reply && (
                <div className="mt-2 p-3 bg-green-900/40 border border-green-600 rounded-lg">
                  <p className="text-green-400 text-sm">💬 Reply: {q.reply}</p>
                </div>
              )}
              {q.type === "call" && (
                <p className="text-purple-400 mt-2">📞 Call request handled</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   ✅ New Component: DailyTestControl
----------------------------*/
/* ---------------------------
   ✅ New Component: DailyTestControl
----------------------------*/
function DailyTestControl() {
  const [isActive, setIsActive] = useState(false);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [todayTest, setTodayTest] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayRef = doc(db, "dailyQuizzes", today);

  // ✅ Load config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "dailyQuizConfig", "settings"), (snap) => {
      if (snap.exists()) setIsActive(snap.data().isActive || false);
    });
    return () => unsub();
  }, []);

  // ✅ Load today's test (only one doc)
  useEffect(() => {
    const unsub = onSnapshot(todayRef, (snap) => {
      if (snap.exists()) setTodayTest({ id: snap.id, ...snap.data() });
      else setTodayTest(null);
    });
    return () => unsub();
  }, []);

  // ✅ Toggle
  const toggleTest = async () => {
    try {
      await setDoc(doc(db, "dailyQuizConfig", "settings"), {
        isActive: !isActive,
      }, { merge: true });
      setMsg(`✅ Test ${!isActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      setMsg("❌ Error: " + err.message);
    }
  };

  // ✅ Upload JSON
  const uploadJson = async () => {
    if (todayTest) {
      return setMsg("⚠️ A test already exists for today. Please delete it first.");
    }
    if (!file) return setMsg("⚠️ Please select a JSON file first.");

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        return setMsg("❌ Invalid JSON: Expected an array of questions.");
      }

      await setDoc(todayRef, {
        date: today,
        questions: jsonData,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Test JSON uploaded successfully!");
      setFile(null);
    } catch (err) {
      setMsg("❌ Failed to upload: " + err.message);
    }
  };

  // ✅ Delete today's test
  const deleteTest = async () => {
    if (!window.confirm("Delete today's uploaded test?")) return;
    try {
      await deleteDoc(todayRef);
      setMsg("🗑️ Today's test deleted.");
    } catch (err) {
      setMsg("❌ Delete failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">⚡ Daily Test Control</h2>

      {/* Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTest}
          className={`px-6 py-2 rounded-lg font-semibold ${
            isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isActive ? "Deactivate Test" : "Activate Test"}
        </button>
        <span className="text-gray-300">
          Current Status:{" "}
          <b className={isActive ? "text-green-400" : "text-red-400"}>
            {isActive ? "Active" : "Inactive"}
          </b>
        </span>
      </div>

      {/* Upload JSON */}
      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <h3 className="text-lg font-semibold text-white">📂 Upload Test JSON</h3>

        {todayTest ? (
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-white font-medium mb-2">
              ✅ Test already uploaded for today
            </p>
            <p className="text-sm text-gray-400">
              {todayTest.questions?.length || 0} questions • {todayTest.date}
            </p>
            <button
              onClick={deleteTest}
              className="mt-3 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Delete Today's Test
            </button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 
                file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
            <button
              onClick={uploadJson}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              Upload Test File
            </button>
          </>
        )}
      </div>

      {msg && <p className="text-sm mt-2 text-cyan-400">{msg}</p>}
    </div>
  );
}
/*--------------------------------
CSAT PANEL
--------------------------------*/
/* ---------------------------
   ✅ New Component: CSAT Control
----------------------------*/
function CsatControl() {
  const [topic, setTopic] = useState("comprehension");
  const [subtopic, setSubtopic] = useState("");
  const [file, setFile] = useState(null);
  const [tests, setTests] = useState([]);
  const [msg, setMsg] = useState("");

  // Topics
  const topics = [
    "comprehension",
    "interpersonal-skills",
    "logical-reasoning",
    "decision-making",
    "general-mental-ability",
    "basic-numeracy",
    "data-interpretation",
    "maths",
    "complete-csat-tests",
  ];

  const mathsSubtopics = [
    "lcm-hcf",
    "rational-numbers",
    "square-cube-roots",
    "averages",
    "set-theory",
    "decimal-fractions",
    "ratio-proportion",
    "simplification",
    "number-system",
    "surds-indices",
    "divisibility",
    "percentages",
    "remainder-theorem",
    "probability",
    "trains",
    "boats-streams",
    "time-work",
    "partnership",
    "si-ci",
    "mensuration",
    "time-distance",
    "profit-loss",
    "work-wages",
    "pipes-cisterns",
    "permutation-combination",
    "alligation-mixtures",
    "geometry",
  ];

  // 🔥 Load tests for selected topic/subtopic
  useEffect(() => {
    const path =
      topic === "maths" && subtopic
        ? collection(db, "csatQuizzes", "maths", "subtopics", subtopic, "tests")
        : collection(db, "csatQuizzes", topic, "tests");

    const unsub = onSnapshot(path, (snap) => {
      setTests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [topic, subtopic]);

  // ✅ Upload JSON file
  const uploadJson = async () => {
    if (!file) return setMsg("⚠️ Please select a JSON file.");
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) return setMsg("❌ Invalid JSON format (must be array).");

      const testId = "test-" + Date.now();

      const ref =
        topic === "maths" && subtopic
          ? doc(db, "csatQuizzes", "maths", "subtopics", subtopic, "tests", testId)
          : doc(db, "csatQuizzes", topic, "tests", testId);

      await setDoc(ref, {
        title: `Test ${tests.length + 1}`,
        description: `Auto-uploaded test for ${subtopic || topic}`,
        questions: data,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Test uploaded successfully!");
      setFile(null);
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  // ✅ Delete test
  const deleteTest = async (id) => {
    if (!window.confirm("Delete this test?")) return;

    const ref =
      topic === "maths" && subtopic
        ? doc(db, "csatQuizzes", "maths", "subtopics", subtopic, "tests", id)
        : doc(db, "csatQuizzes", topic, "tests", id);

    await deleteDoc(ref);
    setMsg("🗑️ Test deleted.");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">📝 CSAT Test Control</h2>

      {/* Topic Selection */}
      <div className="flex gap-4">
        <select
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setSubtopic("");
          }}
          className="p-3 rounded bg-gray-800 text-white"
        >
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {topic === "maths" && (
          <select
            value={subtopic}
            onChange={(e) => setSubtopic(e.target.value)}
            className="p-3 rounded bg-gray-800 text-white"
          >
            <option value="">-- Select Subtopic --</option>
            {mathsSubtopics.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File Upload */}
      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <input
          type="file"
          accept="application/json"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 
            file:rounded-lg file:border-0 file:text-sm file:font-semibold 
            file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <button
          onClick={uploadJson}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Upload Test JSON
        </button>
      </div>

      {/* Tests List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">📂 Existing Tests</h3>
        {tests.length === 0 ? (
          <p className="text-gray-400">No tests available for this topic.</p>
        ) : (
          <div className="space-y-2">
            {tests.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center p-4 rounded bg-gray-800 text-white"
              >
                <div>
                  <p className="font-medium">{t.title || t.id}</p>
                  <p className="text-sm text-gray-400">{t.description}</p>
                </div>
                <button
                  onClick={() => deleteTest(t.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && <p className="text-cyan-400 text-sm">{msg}</p>}
    </div>
  );
}


/* ---------------------------
   Component: Current Affairs Admin
   (PDF Upload + Headlines, auto-max 5)
----------------------------*/
function CurrentAffairsAdmin() {
  const storage = getStorage();

  // PDFs
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfDate, setPdfDate] = useState(new Date().toISOString().slice(0, 10));
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfs, setPdfs] = useState([]);

  // Headlines
  const [headline, setHeadline] = useState("");
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    const q1 = query(collection(db, "currentAffairsPdfs"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(q1, (snap) =>
      setPdfs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const q2 = query(collection(db, "currentAffairsHeadlines"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) =>
      setHeadlines(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Upload PDF
  const uploadPdf = async (e) => {
    e.preventDefault();
    if (!pdfTitle || !pdfFile) return alert("Provide title and PDF file.");

    const storagePath = `current-affairs/${Date.now()}-${pdfFile.name}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, pdfFile);
    const fileUrl = await getDownloadURL(fileRef);

    await addDoc(collection(db, "currentAffairsPdfs"), {
      title: pdfTitle,
      date: pdfDate,
      fileName: pdfFile.name,
      storagePath,
      fileUrl,
      createdAt: serverTimestamp(),
    });

    setPdfTitle("");
    setPdfFile(null);
  };

  const deletePdf = async (item) => {
    if (!window.confirm("Delete this PDF?")) return;
    if (item.storagePath) await deleteObject(ref(storage, item.storagePath));
    await deleteDoc(doc(db, "currentAffairsPdfs", item.id));
  };

  // Headlines (max 5)
  const addHeadline = async (e) => {
    e.preventDefault();
    if (!headline.trim()) return;

    const refColl = collection(db, "currentAffairsHeadlines");
    await addDoc(refColl, { text: headline.trim(), createdAt: serverTimestamp() });
    setHeadline("");

    // prune extra
    const q = query(refColl, orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
      const docs = snap.docs;
      const extras = docs.slice(5);
      extras.forEach((d) => deleteDoc(doc(db, "currentAffairsHeadlines", d.id)));
    });
  };

  const deleteHeadline = async (id) => {
    await deleteDoc(doc(db, "currentAffairsHeadlines", id));
  };

  return (
    <div className="space-y-10">
      {/* Upload PDF */}
      <div className="rounded-xl bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">📰 Upload Daily PDF</h2>
        <form onSubmit={uploadPdf} className="flex flex-col md:flex-row gap-3">
          <input
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="PDF Title"
            className="flex-1 p-3 rounded bg-gray-800 text-white"
          />
          <input
            type="date"
            value={pdfDate}
            onChange={(e) => setPdfDate(e.target.value)}
            className="p-3 rounded bg-gray-800 text-white"
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="p-3 text-white"
          />
          <button className="px-4 py-2 bg-cyan-600 text-white rounded">Upload</button>
        </form>

        <div className="mt-6 space-y-2">
          {pdfs.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-gray-800 p-3 rounded"
            >
              <div>
                <p className="text-white">{p.title}</p>
                <p className="text-xs text-gray-400">
                  {p.date} • {p.fileName}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={p.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  View
                </a>
                <button
                  onClick={() => deletePdf(p)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Headlines */}
      <div className="rounded-xl bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          🔥 Manage Headlines (max 5)
        </h2>
        <form onSubmit={addHeadline} className="flex gap-3">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Add headline"
            className="flex-1 p-3 rounded bg-gray-800 text-white"
          />
          <button className="px-4 py-2 bg-purple-600 text-white rounded">
            Add
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {headlines.map((h) => (
            <span
              key={h.id}
              className="px-3 py-2 bg-white/10 rounded-full text-white text-sm flex items-center gap-2"
            >
              {h.text}
              <button
                onClick={() => deleteHeadline(h.id)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Oldest headline auto-deletes after 5.
        </p>
      </div>
    </div>
  );
}


/* ---------------------------
   Components: Overview
----------------------------*/
function Overview() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        Quick Overview
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Use the left tabs to create rooms, add videos, or manage resources.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Study Rooms" collectionName="studyRooms" />
        <StatCard title="Videos" collectionName="videos" />
        <StatCard title="Students" collectionName="users" />
      </div>
    </div>
  );
}

function StatCard({ title, collectionName }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), (snap) =>
      setCount(snap.size)
    );
    return () => unsub();
  }, [collectionName]);

  return (
    <div className="rounded-xl p-4 bg-white/70 dark:bg-white/10 border border-white/30">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
        {count}
      </p>
    </div>
  );
}

/* ---------------------------
   Component: LibraryAdmin
----------------------------*/
function LibraryAdmin() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState("");
  const storage = getStorage();

  useEffect(() => {
    const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setMsg("⚠️ Please provide a title and select a file.");
      return;
    }
    try {
      const storagePath = `library/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, "library"), {
        title,
        fileName: file.name,
        fileUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Book uploaded successfully!");
      setTitle("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMsg("❌ Upload failed: " + err.message);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      if (book.storagePath) {
        await deleteObject(ref(storage, book.storagePath));
      }
      await deleteDoc(doc(db, "library", book.id));
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-100">📚 Manage Library</h2>
      <form
        onSubmit={handleUpload}
        className="flex flex-col gap-3 bg-gray-900 p-6 rounded-lg"
      >
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="p-2 text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 rounded text-white"
        >
          Upload PDF
        </button>
        {msg && <p className="text-sm text-cyan-400">{msg}</p>}
      </form>

      {/* Books list */}
      <div className="mt-6 space-y-3">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex items-center justify-between bg-gray-800 p-3 rounded"
          >
            <span className="text-white">{book.title}</span>
            <div className="flex gap-2">
              <a
                href={book.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Download
              </a>
              <button
                onClick={() => handleDelete(book)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------
   Components: Add Resource Cards
----------------------------*/
function AddResourceCards() {
  const [category, setCategory] = useState("maps");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [resources, setResources] = useState([]);

  // ✅ Fetch resources
  useEffect(() => {
    const q = query(
      collection(db, "resources"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setResources(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [category]);

  // ✅ Upload file
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!title || !file) {
      setMsg("⚠️ Please provide a title and file.");
      return;
    }
    setSaving(true);
    try {
      const storage = getStorage();
      const storagePath = `resources/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, "resources"), {
        category,
        title,
        fileName: file.name,
        storagePath,
        fileUrl,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ File uploaded successfully!");
      setTitle("");
      setFile(null);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete file
  const remove = async (res) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const storage = getStorage();
      if (res.storagePath) {
        const fileRef = ref(storage, res.storagePath);
        await deleteObject(fileRef).catch(() => {});
      }
      await deleteDoc(doc(db, "resources", res.id));
      setMsg("🗑️ Deleted successfully!");
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-100">📂 Add Resource Cards</h2>

      {/* Upload Form */}
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl bg-gray-900 p-6 rounded-2xl shadow-lg">
        {/* Category Select */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-600 
                     bg-gray-800 text-white"
        >
          <option value="maps">Maps</option>
          <option value="dynasty">Dynasty Charts</option>
          <option value="papers">Previous Year Papers</option>
          <option value="newspapers">Newspapers</option>
        </select>

        {/* Title Input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter file title"
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400"
        />

        {/* File Upload */}
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-semibold shadow-lg"
        >
          {saving ? "Uploading..." : "Upload File"}
        </button>

        {msg && <p className="text-sm mt-2 text-cyan-400">{msg}</p>}
      </form>

      {/* Recent Resources */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">
          📑 Recent {category} files
        </h3>

        {resources.length === 0 ? (
          <p className="text-sm text-gray-400">No files yet.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {resources.map((res) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-4 rounded-lg 
                             bg-gray-800 border border-gray-700 shadow-lg"
                >
                  <div>
                    <p className="font-medium text-white">{res.title}</p>
                    <p className="text-xs text-gray-400">{res.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={res.fileUrl}
                      download={`SATYAPATH - ${res.title || res.fileName}`}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm shadow"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => remove(res)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm shadow"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   Components: Create Room
----------------------------*/
function CreateRoom() {
  const [room, setRoom] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    link: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setRoom((r) => ({ ...r, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!room.title || !room.date || !room.time || !room.link) {
      setMsg("Please fill title, date, time and meeting link.");
      return;
    }
    setSaving(true);
    try {
      const startAt = new Date(`${room.date}T${room.time}`);
      await addDoc(collection(db, "studyRooms"), {
        ...room,
        startAt,
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
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Create Room
      </h2>

      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <input
          name="title"
          value={room.title}
          onChange={onChange}
          placeholder="Room title"
          className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <textarea
          name="description"
          value={room.description}
          onChange={onChange}
          placeholder="Short description (optional)"
          className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            name="date"
            value={room.date}
            onChange={onChange}
            className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100"
          />
          <input
            type="time"
            name="time"
            value={room.time}
            onChange={onChange}
            className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100"
          />
        </div>
        <input
          name="link"
          value={room.link}
          onChange={onChange}
          placeholder="Meeting link (Google Meet / Zoom)"
          className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
        >
          {saving ? "Saving..." : "Create Room"}
        </button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>

      <RecentRooms />
    </div>
  );
}
function RecentRooms() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "studyRooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    await deleteDoc(doc(db, "studyRooms", id));
  };

  const openRegistrations = (roomId) => {
    setSelectedRoom(roomId);
    const q = query(
      collection(db, "registrations"),
      where("roomId", "==", roomId)
    );
    return onSnapshot(q, (snap) => {
      setRegistrations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Recent Rooms
      </h3>
      {rooms.length === 0 ? (
        <p className="text-sm text-gray-500">No rooms yet.</p>
      ) : (
        <div className="space-y-3">
          {rooms.slice(0, 8).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border bg-white/70 dark:bg-white/5 px-4 py-3"
            >
              <div
                className="min-w-0 cursor-pointer"
                onClick={() => openRegistrations(r.id)}
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {r.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {r.date} • {r.time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.link && (
                  <a href={r.link} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-white/10">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button onClick={() => remove(r.id)} className="p-2 rounded-lg text-red-500 hover:bg-white/70 dark:hover:bg-white/10">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registrations
                </h2>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>

              {registrations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No users registered for this room yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-auto">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex justify-between"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {reg.name || "—"}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {reg.email || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------
   Components: Add YouTube
----------------------------*/
// (unchanged — keep your AddYouTubeVideo and AddCustomVideo here)

/* ---------------------------
   Components: Students
----------------------------*/
// (unchanged — keep your StudentsTable here)

/* ---------------------------
   Components: Add YouTube
----------------------------*/
function AddYouTubeVideo() {
  const [form, setForm] = useState({ title: "", url: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/");
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {}
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const videoId = getYouTubeId(form.url);
    if (!form.title || !videoId) {
      setMsg("Please provide a title and a valid YouTube link.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "videos"), {
        type: "youtube",
        title: form.title,
        url: form.url,
        videoId,
        description: form.description || "",
        createdAt: serverTimestamp(),
      });
      setMsg("✅ YouTube video saved!");
      setForm({ title: "", url: "", description: "" });
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Add YouTube Video
      </h2>

      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Video title"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <input
          name="url"
          value={form.url}
          onChange={onChange}
          placeholder="YouTube URL"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Short description (optional)"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
        >
          {saving ? "Saving..." : "Add Video"}
        </button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>

      {/* List recent videos */}
      <RecentVideos filterType="youtube" />
    </div>
  );
}

/* ---------------------------
   Components: Add Custom Video
----------------------------*/
function AddCustomVideo() {
  const [form, setForm] = useState({ title: "", url: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.title || !form.url) {
      setMsg("Please provide a title and a video URL.");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "videos"), {
        type: "custom",
        title: form.title,
        url: form.url,
        description: form.description || "",
        createdAt: serverTimestamp(),
      });
      setMsg("✅ Custom video saved!");
      setForm({ title: "", url: "", description: "" });
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Add Custom Video
      </h2>

      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Video title"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <input
          name="url"
          value={form.url}
          onChange={onChange}
          placeholder="Direct video URL or CDN link"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Short description (optional)"
          className="w-full rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 p-3 text-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
        >
          {saving ? "Saving..." : "Add Video"}
        </button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>

      {/* List recent videos */}
      <RecentVideos filterType="custom" />
    </div>
  );
}

/* ---------------------------
   Components: Recent Videos (common)
----------------------------*/
function RecentVideos({ filterType }) {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVideos(filterType ? all.filter((v) => v.type === filterType) : all);
    });
    return () => unsub();
  }, [filterType]);

  const remove = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    await deleteDoc(doc(db, "videos", id));
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Recent Videos
      </h3>
      {videos.length === 0 ? (
        <p className="text-sm text-gray-500">No videos yet.</p>
      ) : (
        <div className="space-y-3">
          {videos.slice(0, 8).map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {v.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {v.type === "youtube" ? "YouTube" : "Custom"} •{" "}
                  {v.videoId ? `ID: ${v.videoId}` : v.url?.slice(0, 40)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-white/10"
                    title="Open link"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => remove(v.id)}
                  className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Components: Students
----------------------------*/
function StudentsTable() {
  const [users, setUsers] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [inputKey, setInputKey] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null); // user being deleted

  const SECRET_KEY = "iShIkAaKsHaT"; // 🔑 Replace with your secure key

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", sortOrder));
    const unsub = onSnapshot(q, (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [sortOrder]);

  const handleDelete = async (id) => {
    if (inputKey !== SECRET_KEY) {
      alert("❌ Wrong admin key! You cannot delete this student.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      setDeleting(id);
      const functions = getFunctions();
      const deleteUserAccount = httpsCallable(functions, "deleteUserAccount");

      await deleteUserAccount({ uid: id });

      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("✅ User deleted from Firebase Auth + Firestore (email sent)!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("❌ Failed to delete user: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // 🔍 Filter users
  const filteredUsers = users.filter(
    (u) =>
      (u.name || u.fullName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // 📊 Stats
  const totalStudents = users.length;
  const planCounts = users.reduce((acc, u) => {
    const plan = (u.plan || "Free").toLowerCase();
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  // 📂 Export CSV
  const exportCSV = () => {
    const csv = Papa.unparse(
      filteredUsers.map((u) => ({
        Name: u.name || u.fullName || "—",
        Email: u.email || "—",
        Phone: u.phone || "—",
        Plan: u.plan || "Free",
        PlanExpiry: u.planExpiry?.toDate
          ? u.planExpiry.toDate().toLocaleDateString()
          : "—",
        RegisteredOn: u.createdAt?.toDate
          ? u.createdAt.toDate().toLocaleDateString()
          : "—",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "students.csv");
  };

  // 📂 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredUsers.map((u) => ({
        Name: u.name || u.fullName || "—",
        Email: u.email || "—",
        Phone: u.phone || "—",
        Plan: u.plan || "Free",
        PlanExpiry: u.planExpiry?.toDate
          ? u.planExpiry.toDate().toLocaleDateString()
          : "—",
        RegisteredOn: u.createdAt?.toDate
          ? u.createdAt.toDate().toLocaleDateString()
          : "—",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "students.xlsx");
  };

  // 📂 Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Students Report", 14, 16);

    const tableData = filteredUsers.map((u) => [
      u.name || u.fullName || "—",
      u.email || "—",
      u.phone || "—",
      u.plan || "Free",
      u.planExpiry?.toDate
        ? u.planExpiry.toDate().toLocaleDateString()
        : "—",
      u.createdAt?.toDate
        ? u.createdAt.toDate().toLocaleDateString()
        : "—",
    ]);

    autoTable(doc, {
      head: [["Name", "Email", "Phone", "Plan", "Expiry", "Registered"]],
      body: tableData,
      startY: 22,
    });

    doc.save("students.pdf");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Students
      </h2>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg text-cyan-700 dark:text-cyan-200 font-semibold">
          Total Students: {totalStudents}
        </div>
        {Object.entries(planCounts).map(([plan, count]) => (
          <div
            key={plan}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300"
          >
            {plan.charAt(0).toUpperCase() + plan.slice(1)}: {count}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="password"
          placeholder="Enter Admin Key"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
        >
          Sort by Date ({sortOrder === "asc" ? "↑" : "↓"})
        </button>
        <input
          type="text"
          placeholder="Search by name/email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={exportCSV}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
        >
          Export CSV
        </button>
        <button
          onClick={exportExcel}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
        >
          Export Excel
        </button>
        <button
          onClick={exportPDF}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Export PDF
        </button>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <p className="text-sm text-gray-500">No students found.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-white/30 dark:border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/70 dark:bg-white/10">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Plan</Th>
                <Th>Expiry</Th>
                <Th>Date of Registration</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/50 dark:hover:bg-white/5">
                  <Td>{u.name || u.fullName || "—"}</Td>
                  <Td>{u.email || "—"}</Td>
                  <Td>{u.phone || "—"}</Td>
                  <Td className="capitalize">{u.plan || "Free"}</Td>
                  <Td>
                    {u.planExpiry?.toDate
                      ? u.planExpiry.toDate().toLocaleDateString()
                      : "—"}
                  </Td>
                  <Td>
                    {u.createdAt?.toDate
                      ? u.createdAt.toDate().toLocaleDateString()
                      : "—"}
                  </Td>
                  <Td>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      className={`px-3 py-1 rounded text-xs text-white ${
                        deleting === u.id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {deleting === u.id ? "Deleting…" : "Delete"}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
      {children}
    </th>
  );
}
function Td({ children }) {
  return (
    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{children}</td>
  );
}



