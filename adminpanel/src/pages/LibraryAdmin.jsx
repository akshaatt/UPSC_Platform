import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "../firebase";

export default function LibraryAdmin() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!title || !author || !file) {
      setMsg("⚠️ Please fill in all fields.");
      return;
    }
    setSaving(true);
    try {
      const storage = getStorage();
      const storagePath = `library/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, "library"), {
        title,
        author,
        fileName: file.name,
        storagePath,
        fileUrl,
        createdAt: serverTimestamp(),
      });

      setMsg("✅ Book uploaded successfully!");
      setTitle("");
      setAuthor("");
      setFile(null);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (book) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      const storage = getStorage();
      if (book.storagePath) {
        const fileRef = ref(storage, book.storagePath);
        await deleteObject(fileRef).catch(() => {});
      }
      await deleteDoc(doc(db, "library", book.id));
      setMsg("🗑️ Deleted successfully!");
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-100">📚 Library Admin</h2>

      <form
        onSubmit={onSubmit}
        className="space-y-4 max-w-xl bg-gray-900 p-6 rounded-2xl shadow-lg"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title"
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author name"
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept="application/pdf"
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-semibold shadow-lg"
        >
          {saving ? "Uploading..." : "Upload Book"}
        </button>
        {msg && <p className="text-sm mt-2 text-cyan-400">{msg}</p>}
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">
          📖 Recent Books
        </h3>
        {books.length === 0 ? (
          <p className="text-sm text-gray-400">No books yet.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {books.map((book) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-gray-700 shadow-lg"
                >
                  <div>
                    <p className="font-medium text-white">{book.title}</p>
                    <p className="text-xs text-gray-400">
                      {book.author} • {book.fileName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={book.fileUrl}
                      download={`SATYAPATH - ${book.title}`}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm shadow"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => remove(book)}
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
