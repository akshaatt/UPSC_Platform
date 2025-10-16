import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Heart, Share2, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* 🔹 Utility to randomize order */
function shuffleArray(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Reels() {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedLocal, setLikedLocal] = useState({});
  const [muted, setMuted] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef(null);
  const videoRefs = useRef(new Map());
  const observerRef = useRef(null);

  // ✅ Hide Navbar & Scrollbar
 useEffect(() => {
  const navbar = document.querySelector("nav");
  let originalDisplay = null;

  if (navbar) {
    originalDisplay = navbar.style.display || window.getComputedStyle(navbar).display;
    navbar.style.display = "none";
  }

  // prevent scroll when reels open
  document.body.style.overflow = "hidden";

  return () => {
    if (navbar && originalDisplay !== null) {
      navbar.style.display = originalDisplay; // restore EXACT original display value
    }
    document.body.style.overflow = "auto";
  };
}, []);


  // ✅ Fetch Reels + Listen Live + Check User Likes
  useEffect(() => {
    const fetchReels = async () => {
      const snapshot = await getDocs(collection(db, "reels"));
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = all.filter((r) => r.videoUrl);
      setReels(shuffleArray(filtered));
      setLoading(false);
    };
    fetchReels();

    const unsub = onSnapshot(collection(db, "reels"), async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = shuffleArray(list.filter((r) => r.videoUrl));
      setReels(filtered);

      const user = auth.currentUser;
      if (!user) return;

      const likedState = {};
      await Promise.all(
        filtered.map(async (r) => {
          const likeDoc = await getDoc(doc(db, "reels", r.id, "likes", user.uid));
          likedState[r.id] = likeDoc.exists();
        })
      );
      setLikedLocal(likedState);
    });

    return () => unsub();
  }, []);

  // ✅ Auto play/pause logic
  useEffect(() => {
    if (!containerRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-id");
          const vid = videoRefs.current.get(id);
          if (!vid) return;

          if (entry.isIntersecting) {
            videoRefs.current.forEach((v, key) => {
              if (key !== id && !v.paused) v.pause();
            });
            vid.play().catch(() => {});
            setCurrentIndex(Number(entry.target.getAttribute("data-index")));
          } else {
            vid.pause();
          }
        });
      },
      { threshold: 0.8 }
    );

    const items = containerRef.current.querySelectorAll(".reel-item");
    items.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current.disconnect();
  }, [reels]);

  const registerVideoRef = useCallback((id, node) => {
    if (node) videoRefs.current.set(id, node);
    else videoRefs.current.delete(id);
  }, []);

  // ✅ Like System with Firestore Subcollection
  const handleLike = async (reel, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to like this reel.");
      return;
    }

    const likeRef = doc(db, "reels", reel.id, "likes", user.uid);
    const reelRef = doc(db, "reels", reel.id);

    try {
      const docSnap = await getDoc(likeRef);
      let newCount = reel.likeCount || 0;

      if (docSnap.exists()) {
        // 🔹 Unlike
        await deleteDoc(likeRef);
        newCount = Math.max(newCount - 1, 0);
        setLikedLocal((prev) => ({ ...prev, [reel.id]: false }));
      } else {
        // 🔹 Like
        await setDoc(likeRef, { userId: user.uid, likedAt: new Date() });
        newCount += 1;
        setLikedLocal((prev) => ({ ...prev, [reel.id]: true }));
        setLikeAnimation(reel.id);
        setTimeout(() => setLikeAnimation(null), 800);
      }

      await updateDoc(reelRef, { likeCount: newCount });
      setReels((prev) =>
        prev.map((r) => (r.id === reel.id ? { ...r, likeCount: newCount } : r))
      );
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  // ✅ Share Reel
  const handleShare = async (reel) => {
    const url = `${window.location.origin}/reels?reel=${reel.id}`;
    const text = reel.title
      ? `${reel.title} — Watch on Satyapath`
      : "Check this UPSC reel on Satyapath!";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Satyapath Reel", text, url });
      } catch {}
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        "_blank"
      );
    }
  };

  // ✅ Mute/Unmute toggle
  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      videoRefs.current.forEach((vid) => (vid.muted = newMuted));
      return newMuted;
    });
  };

  // ✅ Scroll navigation
  const scrollReel = (dir) => {
    containerRef.current.scrollBy({
      top: dir === "up" ? -window.innerHeight : window.innerHeight,
      behavior: "smooth",
    });
  };

  // ✅ Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/");
      if (e.key === "ArrowDown") scrollReel("down");
      if (e.key === "ArrowUp") scrollReel("up");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="reels"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-gradient-to-b from-black via-[#020d16] to-black flex items-center justify-center"
      >
        {/* Close */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 right-6 z-50 bg-white/90 rounded-full p-2 shadow-md hover:scale-105 transition"
        >
          <X size={20} />
        </button>

        {/* Reels Container */}
        <div
          ref={containerRef}
          className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory flex flex-col items-center scroll-smooth hide-scrollbar"
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

          {loading ? (
            <div className="h-screen flex flex-col items-center justify-center text-white gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-[#0090DE] border-t-transparent rounded-full"
              ></motion.div>
              <p className="text-gray-300 text-sm">Loading Satyapath Reels...</p>
            </div>
          ) : (
            reels.map((r, idx) => (
              <motion.section
                key={r.id}
                className="reel-item snap-start min-h-screen w-full flex items-center justify-center"
                data-id={r.id}
                data-index={idx}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="relative w-[400px] h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-black border-2 border-[#0090DE]/60"
                  whileHover={{ scale: 1.01, boxShadow: "0px 0px 25px #0090DE80" }}
                >
                  <video
                    ref={(el) => registerVideoRef(r.id, el)}
                    src={r.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    loop
                    muted={muted}
                    preload="metadata"
                  />

                  {/* 🔹 Heart Animation (spin + fly burst) */}
                  <AnimatePresence>
                    {likeAnimation === r.id && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        animate={{
                          scale: [0, 1.8, 1],
                          opacity: [0, 1, 0],
                          rotate: [0, 360],
                          y: [0, -80],
                        }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                      >
                        <Heart
                          size={140}
                          className="text-[#0090DE] drop-shadow-[0_0_15px_#0090DE80]"
                          fill="#0090DE"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Topic */}
                  {r.topic && (
                    <div className="absolute top-6 left-4 bg-black/40 text-white text-sm px-3 py-1 rounded-full z-20">
                      {r.topic}
                    </div>
                  )}

                  {/* Title */}
                  <div className="absolute bottom-12 left-4 text-white z-20">
                    <h3 className="text-lg font-bold drop-shadow-md">{r.title}</h3>
                  </div>

                  {/* Brand Watermark */}
                  <div className="absolute bottom-4 left-4 text-[#0090DE] text-xs font-semibold opacity-80">
                    Satyapath • UPSC Simplified
                  </div>

                  {/* Right Controls */}
                  <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                    <motion.button
                      onClick={(e) => handleLike(r, e)}
                      whileTap={{ scale: 1.3 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Heart
                        size={50}
                        className={`transition-all ${
                          likedLocal[r.id]
                            ? "text-[#0090DE] fill-[#0090DE]"
                            : "text-white"
                        }`}
                      />
                      <span className="text-base font-bold text-white">
                        {r.likeCount || 0}
                      </span>
                    </motion.button>

                    <button
                      onClick={() => handleShare(r)}
                      className="bg-white/10 text-white p-3 rounded-full hover:scale-110 transition"
                    >
                      <Share2 size={26} />
                    </button>

                    <button
                      onClick={toggleMute}
                      className="bg-white/10 text-white p-3 rounded-full hover:scale-110 transition"
                    >
                      {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                  </div>
                </motion.div>
              </motion.section>
            ))
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => scrollReel("up")}
          className="absolute top-1/2 left-6 -translate-y-1/2 bg-[#0090DE]/20 hover:bg-[#0090DE]/40 text-white p-3 rounded-full z-50"
        >
          ↑
        </button>
        <button
          onClick={() => scrollReel("down")}
          className="absolute top-1/2 right-6 -translate-y-1/2 bg-[#0090DE]/20 hover:bg-[#0090DE]/40 text-white p-3 rounded-full z-50"
        >
          ↓
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
