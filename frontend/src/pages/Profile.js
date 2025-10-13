import React, { useEffect, useState } from "react";
import { auth, db, DEFAULT_AVATAR, storage } from "../firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  uploadBytes,
  ref,
} from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaCrown,
  FaPhoneAlt,
  FaHome,
  FaUpload,
  FaCheckCircle,
} from "react-icons/fa";

// Plan durations (days)
const PLAN_DURATION = {
  safalta: 30,
  shikhar: 150,
  samarpan: 365,
};

// Calculate expiry date
function calcExpiry(startDate, plan) {
  if (!startDate || !plan) return null;
  const d = new Date(startDate.toDate());
  d.setDate(d.getDate() + (PLAN_DURATION[plan] || 0));
  return d;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [dailyTime, setDailyTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  // ✅ Get logged-in user and their Firestore data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const data = await fetchUserData(currentUser.uid);
        setUserData({ uid: currentUser.uid, ...data });
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  // ✅ Fetch Firestore user document
  async function fetchUserData(uid) {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.log("No user document found!");
        return {};
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      return {};
    }
  }


    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return; 
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
      if (!selectedFile) return;
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const userRef = doc(db, "users", userData?.uid);  
        await updateDoc(userRef, { photoURL: preview.toString() });
        // const storageRef = ref(storage, `images/${selectedFile.name}`);
        // await uploadBytes(storageRef, selectedFile);
        // const url = await getDownloadURL(storageRef);
        // console.log("Uploaded file URL:", url);
        // const response = await axios.post("https://your-api.com/upload", formData, {
        //   headers: {
        //     "Content-Type": "multipart/form-data",
        //   },
        // });
        // console.log("Upload successful", response.data);
      } catch (error) {
        console.error("Upload error", error);
      }
    };
  
    // const handleUpload = async () => {
    //   if (!selectedFile) return;
    //   const storageRef = ref(storage, `images/${selectedFile.name}`);
    //   await uploadBytes(storageRef, selectedFile);
    //   const url = await getDownloadURL(storageRef);
    //   console.log("Uploaded file URL:", url);
    // };



  
// const onFileChange = async (e) => {
//   if (!user) return alert("User not logged in");

//   const file = e.target.files?.[0];
//   console.log(file, "file here");
//   if (!file) return;

//   if (!file.type.startsWith("image/")) {
//     alert("Please select an image file (jpg, png, webp)");
//     return;
//   }

//   try {
//     setUploading(true);
//     setUploadPct(0);

//     const ext = file.name.split(".").pop() || "jpg";
//     var storageRef = firebase.storage().ref('profilePictures/' + file.name);

//     var task = storageRef.put(file);

//     var user = firebase.auth().currentUser;    
// //     const fileRef = storageRef(storage, `avatars/${user.uid}.${ext}`);
// //     const uploadTask = uploadBytesResumable(fileRef, file);
// // firebase.storage().ref('profilePictures/' + file.name);
//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         const pct = Math.round(
//           (snapshot.bytesTransferred / snapshot.totalBytes) * 100
//         );
//         setUploadPct(pct);
//       },
//       (error) => {
//         console.error("Upload error:", error);
//         alert("Upload failed. Please try again.");
//       }
//     );

//     await uploadTask;
//     const url = await getDownloadURL(fileRef);

//     // Firebase Auth profile update
//     await updateProfile(user, { photoURL: url });

//     // Firestore update
//     await setDoc(
//       doc(db, "users", user.uid),
//       { photoURL: url, updatedAt: serverTimestamp() },
//       { merge: true }
//     );

//     setUserData((prev) => ({ ...prev, photoURL: url }));
//     setShowSavedPopup(true);
//     setTimeout(() => setShowSavedPopup(false), 1800);
//   } finally {
//     setUploading(false);
//     setUploadPct(0);
//   }
// };

  // ✅ Handle profile photo upload
  // const onFileChange = async (e) => {
  //   if (!user) return alert("User not logged in");

  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   if (!file.type.startsWith("image/")) {
  //     alert("Please select an image file (jpg, png, webp)");
  //     return;
  //   }

  //   try {
  //     setUploading(true);
  //     setUploadPct(0);

  //     const ext = file.name.split(".").pop() || "jpg";
  //     const storageReference = storageRef(storage, `avatars/${user.uid}.${ext}`);

  //     const uploadTask = uploadBytesResumable(storageReference, file);

  //     uploadTask.on("state_changed", (snapshot) => {
  //       const pct = Math.round(
  //         (snapshot.bytesTransferred / snapshot.totalBytes) * 100
  //       );
  //       setUploadPct(pct);
  //     });

  //     await uploadTask;
  //     const url = await getDownloadURL(storageReference);

  //     // Update Firebase Auth profile
  //     await updateProfile(user, { photoURL: url });

  //     // Update Firestore
  //     await setDoc(
  //       doc(db, "users", user.uid),
  //       { photoURL: url, updatedAt: serverTimestamp() },
  //       { merge: true }
  //     );

  //     setUserData((prev) => ({ ...prev, photoURL: url }));
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

  // ✅ Handle logout
  
  function handleLogout() {
    signOut(auth)
      .then(() => {
        console.log("User signed out successfully");
        navigate("/");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }

  if (!userData) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Please login to view profile.</p>
      </div>
    );
  }

  const plan = userData?.plan;
  const planStart = userData?.planStart;
  const expiryDate = calcExpiry(planStart, plan);
  const avatarSrc = userData?.photoURL || DEFAULT_AVATAR;

  console.log(userData, "UserData from user");
  
  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 min-h-screen">
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
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative overflow-visible"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center -mt-16">
            <motion.img
              src={preview || avatarSrc}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
              whileHover={{ scale: 1.05 }}
            />
            {/* <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full cursor-pointer hover:brightness-110 transition">
              <FaUpload />
              <input type="file" accept="image/*" onChange={handleFileChange} />
      {/* {preview && <img src={preview} alt="preview" width="200" />} */}
              {/* <button onClick={handleUpload}>Upload</button> */}
              
              {/* <span>Upload New Photo</span> */}
              {/* <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
                disabled={uploading}
              /> */}
            {/* </label> */}

            {uploading && <p>Uploading: {uploadPct}%</p>}
            {showSavedPopup && (
              <p className="text-green-600">Uploaded successfully!</p>
            )}

            <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
              {userData.displayName || userData.name || "User"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {userData.email || "No email"}
            </p>

            {plan && (
              <div className="mt-3 px-4 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200">
                <FaCrown className="text-yellow-500" />
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard icon={<FaPhoneAlt />} title="Phone Number" value={userData.phone} />
            <InfoCard icon={<FaHome />} title="Address" value={userData.address} />
            <InfoCard
              title="Plan Start Date"
              value={
                userData.planStart
                  ? userData.planStart.toDate().toDateString()
                  : "Not available"
              }
            />
            <InfoCard
              title="Plan Expiry Date"
              value={expiryDate ? expiryDate.toDateString() : "Not available"}
            />
          </div>

          {/* Daily Usage */}
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
              <FaClock /> Daily Usage Time
            </h3>
            <p className="mt-2 text-2xl font-bold text-[#0090DE] font-mono">
              {formatDuration(dailyTime)}
            </p>
          </div>
        </motion.div>
      </div>

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

// Helper UI component
function InfoCard({ icon, title, value }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
      <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
        {icon} {title}
      </h3>
      <p className="text-gray-800 dark:text-white font-medium">
        {value || "Not added"}
      </p>
    </div>
  );
}

function formatDuration(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
