import React, { useEffect, useState } from "react";
import { auth, db, DEFAULT_AVATAR, storage } from "../firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaCrown, FaPhoneAlt, FaHome, FaUpload, FaCheckCircle } from "react-icons/fa";

// Helper for plan durations
const PLAN_DURATION = {
  safalta: 30, // days
  shikhar: 150, // 5 months
  samarpan: 365, // 1 year
};

function calcExpiry(startDate, plan) {
  if (!startDate || !plan) return null;
  const d = new Date(startDate.toDate());
  d.setDate(d.getDate() + (PLAN_DURATION[plan] || 0));
  return d;
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [dailyTime, setDailyTime] = useState(0); // seconds

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [userData, setUserData] = useState(null);
  // Track auth + userDoc
  const navigate = useNavigate();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log(user, "user from profile");
      
      if (user) {
        const data = await fetchUserData(user.uid);
        console.log(data, "data");
        
        setUserData(data);
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, [])

  async function fetchUserData(uid) {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log("User Firestore Data:", data);
        return data;
      } else {
        console.log("No such user document!");
        return null;
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      return null;
    }
  }

  console.log(userData, "UserData from user");

 


  // Load today’s usage from Firestore when user logs in
  // useEffect(() => {
  //   if (!user) return;
  //   const ref = doc(db, "dailyUsage", `${user.uid}_${todayKey()}`);

  //   const fetchAndListen = async () => {
  //     const snap = await getDoc(ref);
  //     if (snap.exists()) {
  //       setDailyTime(snap.data().seconds || 0);
  //     } else {
  //       setDailyTime(0);
  //     }

  //     // live listener
  //     onSnapshot(ref, (docSnap) => {
  //       if (docSnap.exists()) {
  //         setDailyTime(docSnap.data().seconds || 0);
  //       }
  //     });
  //   };

  //   fetchAndListen();
  // }, [user]);

  // Increment timer every second + save to Firestore
  // useEffect(() => {
  //   if (!user) return;
  //   const ref = doc(db, "dailyUsage", `${user.uid}_${todayKey()}`);

  //   const interval = setInterval(() => {
  //     setDailyTime((prev) => {
  //       const updated = prev + 1;

  //       setDoc(
  //         ref,
  //         {
  //           uid: user.uid,
  //           date: todayKey(),
  //           seconds: updated,
  //           updatedAt: serverTimestamp(),
  //         },
  //         { merge: true }
  //       );

  //       return updated;
  //     });
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [user]);

  if (!userData) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Please login to view profile.</p>
      </div>
    );
  }

  const plan = userDoc?.plan;
  const planStart = userDoc?.planStart;
  const expiryDate = calcExpiry(planStart, plan);

  const avatarSrc = userDoc?.photoURL || userData?.photoURL || DEFAULT_AVATAR;

  // const onFileChange = async (e) => {
  //   if (!userData || !userData.uid) {
  //     alert("User not loaded yet!");
  //     return;
  //   }

  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   if (!file.type.startsWith("image/")) {
  //     alert("Please select an image file (jpg, png, webp).");
  //     return;
  //   }

  //   try {
  //     setUploading(true);
  //     setUploadPct(0);

  //     const ext = file.name.split(".").pop() || "jpg";
  //     const ref = storageRef(storage, `avatars/${userData.uid}.${ext}`);

  //     const task = uploadBytesResumable(ref, file);
  //     task.on("state_changed", (snap) => {
  //       const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
  //       setUploadPct(pct);
  //     });

  //     await task;
  //     const url = await getDownloadURL(ref);

  //     await updateProfile(userData, { photoURL: url });
  //     await setDoc(
  //       doc(db, "users", userData.uid),
  //       { photoURL: url, updatedAt: serverTimestamp() },
  //       { merge: true }
  //     );

  //     setUserDoc((prev) => ({ ...prev, photoURL: url }));

  //     setShowSavedPopup(true);
  //     setTimeout(() => setShowSavedPopup(false), 1800);
  //   } catch (err) {
  //     console.error("Upload error:", err);
  //     alert("Failed to upload image. Please try again.");
  //   } finally {
  //     setUploading(false);
  //     setUploadPct(0);
  //   }
  // };

  function handleLogout() {
      signOut(auth)
        .then(() => {
          console.log("User signed out successfully");
          setUser(null);
          navigate("/");
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    }
  
  const onFileChange = async (e) => {
    console.log(e, userData, "fcghvjbkn");
    
    // if (!userData || !userData.uid) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (jpg, png, webp).");
      return;
    }

    try {
      setUploading(true);
      setUploadPct(0);

      const ext = file.name.split(".").pop() || "jpg";
      const storageReference = storageRef(storage, `avatars/${userData.uid}.${ext}`);

      const uploadTask = uploadBytesResumable(storageReference, file);

      uploadTask.on("state_changed", (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadPct(pct);
      });

      await uploadTask;
      const url = await getDownloadURL(storageReference);

      // Update Firebase Auth profile
      await updateProfile(userData, { photoURL: url });

      // Update Firestore user doc
      await setDoc(
        doc(db, "users", userData.uid),
        { photoURL: url, updatedAt: serverTimestamp() },
        { merge: true }
      );

      // Update local state so image shows immediately
      setUserDoc((prev) => ({ ...prev, photoURL: url }));

      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 1800);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };
  console.log(userDoc, "userDoc here see");

  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Banner */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[#0090DE] to-[#001726]">
        <motion.div
          className="absolute -bottom-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl"
          animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-24 right-10 w-96 h-96 bg-[#0090DE]/30 rounded-full blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-24">
        {/* Profile Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative overflow-visible"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Avatar + Upload */}
          <div className="flex flex-col items-center -mt-16">
            <motion.img
              src={avatarSrc}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
              whileHover={{ scale: 1.05, rotate: 1.5 }}
              transition={{ type: "spring", stiffness: 220 }}
            />

            {/* Upload control */}
            <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full cursor-pointer hover:brightness-110 transition">
              <FaUpload />
              <span>Upload New Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={!userData}
                // disabled={!userData || uploading}
                // disabled={!userData}
              />
            </label>

            {uploading && <p>Uploading: {uploadPct}%</p>}
      {showSavedPopup && <p className="text-green-600">Uploaded successfully!</p>}

      {userData?.photoURL && (
        <img src={userData.photoURL} alt="Profile" className="mt-4 w-24 h-24 rounded-full object-cover" />
      )}
            {/* {uploading && (
              <div className="mt-2 w-56 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0090DE] transition-all"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            )} */}

            <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
              {userData.displayName || userData?.firstName || "User"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{userData.email}</p>

            {/* Subscription Plan */}
            {plan && (
              <div className="mt-3 px-4 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200">
                <FaCrown className="text-yellow-500" />
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </div>
            )}

            {/* <button
              onClick={handleLogout}
              className="mt-4 px-5 py-2 bg-[#0090DE] text-white rounded-full hover:bg-[#007bbd] transition"
            >
              Sign Out
            </button> */}
          </div>

          {/* Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                <FaPhoneAlt /> Phone Number
              </h3>
              <p className="text-gray-800 dark:text-white font-medium">
                {userData?.phoneNumber || "Not added"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                <FaHome /> Address
              </h3>
              <p className="text-gray-800 dark:text-white font-medium">
                {userData?.address || "Not added"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Plan Start Date
              </h3>
              <p className="text-gray-800 dark:text-white font-medium">
                {userData?.planStart
                  ? userData.planStart.toDate().toDateString()
                  : "Not available"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Plan Expiry Date
              </h3>
              <p className="text-gray-800 dark:text-white font-medium">
                {expiryDate ? expiryDate.toDateString() : "Not available"}
              </p>
            </div>
          </div>

          {/* Daily Usage Tracker */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
              <FaClock /> Daily Usage Time
            </h3>
            <p className="mt-2 text-2xl font-bold text-[#0090DE] font-mono">
              {formatDuration(dailyTime)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tracked from 00:00 hrs – 24:00 hrs
            </p>
          </div>
        </motion.div>
      </div>

      {/* Saved popup */}
      <AnimatePresence>
        {showSavedPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl text-center"
            >
              <FaCheckCircle className="mx-auto text-emerald-500 mb-2" size={48} />
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                Profile photo updated!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your new picture is now visible across Satyapath.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* helpers */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
