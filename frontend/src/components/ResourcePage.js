import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FileText, FileImage, FileType2 } from "lucide-react";

function ResourcePage({ category, title }) {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "resources"), where("category", "==", category));
    const unsub = onSnapshot(q, (snap) => {
      setResources(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [category]);

  const handleDownload = (res) => {
    const link = document.createElement("a");
    link.href = res.fileUrl;
    link.download = `SATYAPATH - ${res.fileName}`;
    link.click();
  };

  const renderPreview = (res) => {
    const fileName = res.fileName.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-red-100 text-red-600">
          <FileText size={40} />
          <p className="font-bold mt-2">.PDF</p>
        </div>
      );
    }

    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-blue-100 text-blue-600">
          <FileType2 size={40} />
          <p className="font-bold mt-2">.DOCX</p>
        </div>
      );
    }

    if (fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) {
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-orange-100 text-orange-600">
          <FileType2 size={40} />
          <p className="font-bold mt-2">.PPTX</p>
        </div>
      );
    }

    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-green-100 text-green-600">
          <FileType2 size={40} />
          <p className="font-bold mt-2">.XLSX</p>
        </div>
      );
    }

    // default → image preview
    return (
      <div className="relative group">
        <img
          src={res.fileUrl}
          alt={res.title}
          className="w-full h-40 object-cover opacity-70 group-hover:opacity-100 transition"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <span className="text-white font-semibold">Click to download</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
        {title}
      </h2>

      {resources.length === 0 ? (
        <p className="text-center text-gray-500">No resources available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition"
            >
              {renderPreview(res)}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {res.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {res.fileName}
                </p>
                <button
                  onClick={() => handleDownload(res)}
                  className="mt-3 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#0090DE] to-[#00c4ff] text-white font-medium hover:opacity-90 transition"
                >
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResourcePage;
