import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getFunctions, httpsCallable } from "firebase/functions";
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
          </motion.div>
        </main>
      </div>
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



