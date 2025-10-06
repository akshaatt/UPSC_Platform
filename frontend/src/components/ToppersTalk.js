// src/components/ToppersTalk.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ToppersTalk() {
  const [videos, setVideos] = useState([]);
  const [index, setIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const visibleCount = 3;

  // 🔥 Fetch videos from Firestore
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "videos"));
        const videoData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVideos(videoData);
      } catch (err) {
        console.error("❌ Failed to load videos:", err);
      }
    };
    fetchVideos();
  }, []);

  const handleNext = () => {
    if (index < videos.length - visibleCount) setIndex(index + 1);
  };
  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  // Helper to get YouTube videoId
  const getVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
    } catch {
      return "";
    }
  };

  return (
    <section className="relative py-20 mt-16 overflow-hidden text-white">
      {/* 🌌 Stars + Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00111f] via-[#002244] to-[#000000] opacity-90"></div>
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#ffffff] to-[#ffffff] bg-clip-text text-transparent drop-shadow">
            Toppers’ Talk
          </h2>
          <p className="mt-3 text-lg font-normal text-gray-400">
            Insights, strategies, and guidance directly from UPSC toppers.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <motion.div
            animate={{ x: -index * 320 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="flex gap-6"
          >
            {videos.map((video, i) => {
              const videoId = getVideoId(video.url);
              const thumbnail = videoId
                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                : "https://via.placeholder.com/300x200.png?text=No+Preview";

              return (
                <motion.div
                  key={video.id || i}
                  whileHover={{ scale: 1.05 }}
                  className="w-[300px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-xl bg-gray-900/80 backdrop-blur-md border border-gray-700"
                  onClick={() => setActiveVideo(video.url)}
                >
                  {/* Thumbnail */}
                  <div className="relative group">
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition">
                      <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                  </div>
                  {/* Title */}
                  <div className="p-4">
                    <h3 className="text-base font-medium leading-snug text-gray-200">
                      {video.title}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            disabled={index === 0}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#0090DE] to-[#00c4ff] p-3 rounded-full text-white disabled:opacity-30 transition shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={index >= videos.length - visibleCount}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#0090DE] to-[#00c4ff] p-3 rounded-full text-white disabled:opacity-30 transition shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Popup Player */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${getVideoId(activeVideo)}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full px-3 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
