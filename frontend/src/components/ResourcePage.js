import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { FileText, FileType2 } from "lucide-react";

function ResourcePage({ category, title }) {
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsub;

    try {
      const q = query(
        collection(db, "resources"),
        where("category", "==", category.toLowerCase()),
        orderBy("createdAt", "desc")
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setResources(docs);
        },
        () => {
          setError("fallback");
          const q2 = query(
            collection(db, "resources"),
            where("category", "==", category.toLowerCase())
          );
          unsub = onSnapshot(q2, (snap) => {
            const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setResources(docs);
          });
        }
      );
    } catch (err) {
      console.error("Error in query setup:", err.message);
    }

    return () => unsub && unsub();
  }, [category]);

  const handleDownload = async (res) => {
    try {
      const response = await fetch(res.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `SATYAPATH - ${res.title || res.fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  const renderPreview = (res) => {
    const fileName = res.fileName.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      return (
        <div className="flex flex-col items-center justify-center h-44 bg-red-900/40 text-red-400">
          <FileText size={42} />
          <p className="font-bold mt-2">.PDF</p>
        </div>
      );
    }

    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      return (
        <div className="flex flex-col items-center justify-center h-44 bg-blue-900/40 text-blue-400">
          <FileType2 size={42} />
          <p className="font-bold mt-2">.DOCX</p>
        </div>
      );
    }

    if (fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) {
      return (
        <div className="flex flex-col items-center justify-center h-44 bg-orange-900/40 text-orange-400">
          <FileType2 size={42} />
          <p className="font-bold mt-2">.PPTX</p>
        </div>
      );
    }

    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      return (
        <div className="flex flex-col items-center justify-center h-44 bg-green-900/40 text-green-400">
          <FileType2 size={42} />
          <p className="font-bold mt-2">.XLSX</p>
        </div>
      );
    }

    return (
      <div className="relative group overflow-hidden">
        <motion.img
          src={res.fileUrl}
          alt={res.title}
          className="w-full h-44 object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
          whileHover={{ scale: 1.05 }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          <span className="text-white font-semibold text-sm animate-pulse">
            Click to download
          </span>
        </div>
      </div>
    );
  };

  const subtitles = {
    maps: "Visualize Geography with Clarity",
    dynasty: "Trace Lineages and Historical Roots",
    papers: "Practice from Authentic Past Papers",
    newspapers: "Stay Updated with Daily Current Affairs",
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-6 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0f172a]">
      {/* 🌌 Animated Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-[20%] right-[-150px] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-100px] left-[30%] w-[450px] h-[450px] bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Heading + subtitle */}
      <div className="relative text-center mb-12">
        <motion.h2
          className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h2>
        <p className="mt-3 text-gray-400 italic text-sm">
          {subtitles[category.toLowerCase()]}
        </p>
      </div>

      {/* Resources grid */}
      {resources.length === 0 ? (
        <p className="relative text-center text-gray-400 italic z-10">
          {error === "fallback"
            ? "⚡ Showing fallback results. Please create Firestore index for better performance."
            : "No resources available yet."}
        </p>
      ) : (
        <motion.div
          layout
          className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 z-10"
        >
          {resources.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 0.5 }}
              className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-cyan-500/30 
                         bg-gray-900/70 border border-gray-700 backdrop-blur-xl 
                         transition-all duration-500 group"
            >
              {renderPreview(res)}
              <div className="p-5 flex flex-col items-center text-center">
                <h3 className="text-lg font-semibold text-gray-100 truncate">
                  {res.title}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {res.fileName}
                </p>
                <motion.button
                  onClick={() => handleDownload(res)}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 w-full px-4 py-2 rounded-lg bg-gradient-to-r 
                             from-cyan-500 via-blue-600 to-purple-600 text-white font-medium shadow-md
                             hover:shadow-lg hover:opacity-95 transition-all"
                >
                  ⬇ Download
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Disclaimer only for Newspapers */}
      {category.toLowerCase() === "newspapers" && (
        <div className="relative mt-16 max-w-4xl mx-auto p-4 rounded-xl bg-black/40 border border-white/10">
          <p className="text-xs md:text-sm text-gray-400 italic leading-relaxed">
            📰 Disclaimer: All newspapers belong to their respective companies.{" "}
            <span className="text-cyan-400 font-semibold">SATYAPATH</span> only provides a consolidated 
            access point for educational purposes.
          </p>
        </div>
      )}
    </div>
  );
}

export default ResourcePage;
