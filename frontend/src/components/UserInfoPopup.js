// src/components/UserInfoPopup.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { auth } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebase";

export default function UserInfoPopup({ user, isOpen, onCloseUserInfo, setIsAuthModal }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [pswrd, setPassword] = useState("");

  useEffect(() => {
    // If user prop available, prefill fields from user (if userDoc passed, use that)
    if (user && user.email) setEmail(user.email);
  }, [user]);

  // Validation: enable submit only when all required fields are truthy and user agreed.
  const isValid = firstName && lastName && phone && address && agree && (auth.currentUser?.uid || pswrd);

  const handleSubmit = async () => {
    if (!isValid) {
      alert("Please fill all fields and agree to Terms & Conditions.");
      return;
    }
    setSaving(true);
    try {
      // If no authenticated user, create one using email+password
      let uid = auth.currentUser?.uid;
      if (!uid) {
        const res = await createUserWithEmailAndPassword(auth, email, pswrd);
        uid = res.user.uid;
        // set display name
        await updateProfile(res.user, { displayName: firstName });
      } else {
        // update displayName for existing user
        await updateProfile(auth.currentUser, { displayName: firstName });
      }

      // Save/merge in Firestore
      await setDoc(
        doc(db, "users", uid),
        {
          firstName,
          lastName,
          gender,
          phoneNumber: phone,
          address,
          email,
          isVerified: false,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(), // if already exists it will just set createdAt, consider merging on server
        },
        { merge: true }
      );

      setShowSavedPopup(true);
      // close modal after a short delay
      setTimeout(() => {
        setShowSavedPopup(false);
        setIsAuthModal && setIsAuthModal(false);
        onCloseUserInfo && onCloseUserInfo();
      }, 1400);
    } catch (err) {
      console.error("Error saving user info:", err);
      alert(err?.message || "Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="relative w-[90%] max-w-md rounded-2xl bg-white p-6" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
          <button onClick={onCloseUserInfo} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <FaTimes size={18} />
          </button>

          <h2 className="text-2xl font-bold">Complete your profile</h2>
          <p className="text-sm text-gray-600 mt-2">This helps us personalize your experience.</p>

          <div className="mt-4 space-y-3">
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="flex-1 p-2 border rounded" />
              <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="flex-1 p-2 border rounded" />
            </div>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2 border rounded">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded" />
            <textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded" rows={3} />
            {!auth.currentUser && (
              <input placeholder="Password (create an account)" type="password" value={pswrd} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} />
              <span className="text-sm">I agree to the Terms & Conditions</span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={!isValid || saving} className={`mt-4 w-full py-2 rounded ${saving ? "opacity-70 cursor-wait" : "bg-[#0090DE] text-white"}`}>
            {saving ? "Saving..." : "Submit"}
          </button>
        </motion.div>

        {showSavedPopup && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white p-6 rounded-2xl text-center">
              <FaCheckCircle size={48} className="text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Saved successfully</h3>
              <p className="text-sm text-gray-600">Thanks — your profile is updated.</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// // src/components/UserInfoPopup.js
// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { doc, setDoc } from "firebase/firestore";
// import { FaCheckCircle , FaTimes} from "react-icons/fa";
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { auth, db } from "../firebase";
// export default function UserInfoPopup({ user, isOpen, onCloseUserInfo,  setIsAuthModal }) {
//   const [firstName, setFirstName] = useState("");
//   const [email, setEmail] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [gender, setGender] = useState("Male");
//   const [phone, setPhone] = useState("");
//   const [address, setAddress] = useState("");
//   const [agree, setAgree] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [showSavedPopup, setShowSavedPopup] = useState(false);
//   const [pswrd, setPassword] = useState("");

//   console.log(isOpen, "useInfo");
  
//   // if (!isOpen || !user) return null;

//   const disableSubmit = () => {
//     return firstName &&
//       lastName &&
//       pswrd &&
//       gender &&
//       phone &&
//       address &&
//       agree
//   }
  
//   // console.log(setIsAuthModal , "disableSubmit values");
  
//   const handleSubmit = async () => {
//     try {
//       setSaving(true);
//         const res = await createUserWithEmailAndPassword(auth, email, pswrd);
//         console.log("Firebase User:", res.user);
  
//         await setDoc(doc(db, "users", res.user.uid), {
//           displayName: firstName,
//           email: email,
//           address: address,
//           phoneNumber:phone,
//           isVerified: false,
//           createdAt: new Date().toISOString(),
//         });
  
//         await updateProfile(res.user, {
//           displayName: firstName,
//           phoneNumber: phone,

//         });
      
//         const currentUser = auth.currentUser;
//         console.log("Current logged in user:", currentUser);
  
//         // if (user?.setUser) {
//         //   user.setUser({
//         //     uid: res.user.uid,
//         //     email: res.user.email,
//         //     name: firstName,
//         //     photoURL: res.user.photoURL || null,
//         //   });
//         // }
//       setShowSavedPopup(true);
//       setIsAuthModal(false);
//         // setShowInfoPopup(true);
  
//       // } else {
//       //   // Sign In case
//       //   const res = await signInWithEmailAndPassword(auth, email, password);
//       //   console.log("User logged in:", res.user);
  
//       //   if (userData?.setUser) {
//       //     userData.setUser({
//       //       uid: res.user.uid,
//       //       email: res.user.email,
//       //       name: res.user.displayName || "",
//       //       photoURL: res.user.photoURL || null,
//       //     });
//       //   }
//       // }
//       // setSaving(false);
//       setTimeout(() => {
//         setShowSavedPopup(false);
//         setIsAuthModal(false);
//         onCloseUserInfo();
//       }, 2000); // 
//     } catch (err) {
//       console.error(err);
//       alert(err?.message || "Authentication failed.");
//     } finally {
//       setSaving(false);
//     }
//   };
//   // const handleSubmit = async () => {
//     // if (!firstName || !lastName || !gender || !phone || !address || !agree) {
//     //   alert("Please fill all fields and agree to Terms & Conditions.");
//     //   return;
//     // }
//   //   try {
//   //     setSaving(true);
//   //     await setDoc(
//   //       doc(db, "users", user.uid),
//   //       { firstName, lastName, gender, phone, address },
//   //       { merge: true }
//   //     );
//   //     setShowSavedPopup(true);
//       // setTimeout(() => {
//       //   setShowSavedPopup(false);
//       //   onCloseUserInfo();
//       // }, 2000); // auto close after 2s
//   //   } catch (err) {
//   //     console.error("Error saving user info:", err);
//   //     alert("Something went wrong. Please try again.");
//   //   } finally {
//   //     setSaving(false);
//   //   }
//   // };

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           key="userinfo-overlay"
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//         >
//           <motion.div
//             key="userinfo-modal"
//             initial={{ scale: 0.9, opacity: 0, y: 30 }}
//             animate={{ scale: 1, opacity: 1, y: 0 }}
//             exit={{ scale: 0.9, opacity: 0, y: 30 }}
//             transition={{ duration: 0.35, ease: "easeOut" }}
//             className="relative w-[90%] max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-8 text-center"
//           >
//               <button
//             onClick={onCloseUserInfo}
//             className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
//           >
//             <FaTimes size={20} />
//           </button>
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//               Welcome to <span className="text-[#0090DE]">Satyapath</span> 🚀
//             </h2>
//             <p className="mt-2 text-gray-600 dark:text-gray-300">
//               Complete your profile to unlock personalized features!
//             </p>

//             <div className="mt-6 space-y-4 text-left">
//             <input
//                 type="text"
//                 placeholder="Email"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//               <input
//                 type="text"
//                 placeholder="First Name"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//               />
//               <input
//                 type="text"
//                 placeholder="Last Name"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//               />
//               <select
//                 value={gender}
//                 onChange={(e) => setGender(e.target.value)}
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//               >
//                 <option>Male</option>
//                 <option>Female</option>
//               </select>
//               <input
//                 type="tel"
//                 placeholder="Enter your phone number"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//               />
//                <input
//                 type="Password"
//                 placeholder="Enter your password"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={pswrd}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <textarea
//                 placeholder="Enter your address"
//                 rows="3"
//                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0090DE] outline-none"
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//               />
//               <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
//                 <input
//                   type="checkbox"
//                   checked={agree}
//                   onChange={() => setAgree(!agree)}
//                 />
//                 I agree to the{" "}
//                 <span className="text-[#0090DE] cursor-pointer">
//                   Terms & Conditions
//                 </span>
//               </label>
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={!disableSubmit()}
//               className={`mt-6 w-full py-2 rounded-lg font-semibold transition ${
//                 saving
//                   ? "bg-[#0090DE]/70 text-white cursor-wait"
//                   : "bg-[#0090DE] text-white hover:bg-[#007bbd]"
//               }`}
//             >
//               {saving ? "Saving..." : "Submit"}
//             </button>
//           </motion.div>

//           {/* ✅ Saved Popup */}
//           <AnimatePresence>
//             {showSavedPopup && (
//               <motion.div
//                 key="saved-popup"
//                 className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//               >
//                 <motion.div
//                   initial={{ scale: 0.8, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   exit={{ scale: 0.8, opacity: 0 }}
//                   transition={{ duration: 0.3 }}
//                   className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl text-center"
//                 >
//                   <FaCheckCircle
//                     className="mx-auto text-green-500 mb-2"
//                     size={48}
//                   />
//                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">
//                     Saved Successfully 🎉
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-300 mt-1">
//                     Your details have been updated.
//                   </p>
//                 </motion.div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

