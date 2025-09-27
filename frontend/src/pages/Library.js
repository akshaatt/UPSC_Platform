import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function Library() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading Library...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please login to access the Library 📚</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-6xl mx-auto">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-[#0090DE] mb-6">Library</h1>
      <p className="text-gray-700 mb-10">
        Browse and download curated UPSC study material and reference books.
      </p>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Example Book Card */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">Indian Polity</h3>
            <p className="text-sm text-gray-500">by M. Laxmikanth</p>
            <a
              href="/books/indian_polity.pdf"
              download
              className="inline-block mt-3 px-4 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: "#0090DE" }}
            >
              Download
            </a>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">Indian Economy</h3>
            <p className="text-sm text-gray-500">by Ramesh Singh</p>
            <a
              href="/books/indian_economy.pdf"
              download
              className="inline-block mt-3 px-4 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: "#0090DE" }}
            >
              Download
            </a>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">History of Modern India</h3>
            <p className="text-sm text-gray-500">by Bipan Chandra</p>
            <a
              href="/books/history_modern.pdf"
              download
              className="inline-block mt-3 px-4 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: "#0090DE" }}
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Library;
