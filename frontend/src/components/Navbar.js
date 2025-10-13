// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, DEFAULT_AVATAR, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import AuthModal from "./AuthModal";
import SubscriptionPopup from "./SubscriptionPopup";
import ContactUsModal from "./ContactUsModal";
import { motion, AnimatePresence } from "framer-motion";
import OtpPopup from "./OtpPopup";

function Navbar() {
  const [user, setUser] = useState(null);      
  const [userDoc, setUserDoc] = useState(null); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOtpPopup, setIsOtpPopup] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false); 
  const [plan, setPlan] = useState(null);
  // const [isAuthOpen, setIsAuthOpen] = useState(false);
const [isOtpOpen, setIsOtpOpen] = useState(false);
const [pendingOtpUser, setPendingOtpUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      console.log(u, "u ghjk");
      
      if (!u) {
        setUser(null);
        setUserDoc(null);
        setPlan(null);
        setIsOtpPopup(false);
        sessionStorage.removeItem("otpShown");
        return;
      }

      const ref = doc(db, "users", u.uid);
      const unsubDoc = onSnapshot(ref, (snap) => {
        const data = snap.exists() ? snap.data() : null;
         console.log(data, "userData check ");

        if (data?.isVerified) {
          // only set if verified
          setUser(u);
          setUserDoc(data);
          setPlan(data?.plan || null);
          setIsOtpPopup(false);
          sessionStorage.removeItem("otpShown");
        } else {
          console.log("unverified", sessionStorage.getItem("otpShown"));
          if (!sessionStorage.getItem("otpShown")) {
            console.log("yes hit here");
            
            setIsOtpPopup(true);
            sessionStorage.setItem("otpShown", "true");
          }
          setUser(null);
          setUserDoc(data);
          setPlan(null);
          // setIsOtpPopup(false); 
        }
      });

      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

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

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const avatarSrc = user?.photoURL || userDoc?.photoURL || DEFAULT_AVATAR;
console.log ( "avatarSrc");

  return (
    <nav className="bg-black shadow-md shadow-gray-800/40 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1
          className="text-2xl font-bold cursor-pointer"
          style={{ color: "#0090DE" }}
          onClick={() => navigate("/")}
        >
          Satyapath
        </h1>

        {/* Links */}
        <div className="hidden md:flex space-x-8 text-white font-medium items-center">
          <button
            onClick={() => navigate("/services")}
            className="hover:text-[#0090DE] transition"
          >
            Services
          </button>
          <button
            onClick={() => navigate("/downloads")}
            className="hover:text-[#0090DE] transition"
          >
            Downloads
          </button>
          <button
            onClick={() => setIsContactOpen(true)}
            className="hover:text-[#0090DE] transition"
          >
            Contact Us
          </button>
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="hover:text-[#0090DE] transition flex items-center gap-1"
          >
            Subscription{" "}
            {plan && (
              <span className="text-gray-400 text-xs font-normal">
                ({titleFromKey(plan)})
              </span>
            )}
          </button>
        </div>

        {/* Auth / Dropdown */}
        {user ? (
          <div className="relative dropdown">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-white"
            >
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              {userDoc?.name || user?.displayName || "User"}
              <span>▼</span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  key="dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
                >
                  {plan && (
                    <div className="px-4 py-3 text-sm font-semibold text-center bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      <span className="px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs">
                        {titleFromKey(plan)} Plan
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/library");
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Library
                  </button>
                 
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-5 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "#0090DE" }}
          >
            Sign In / Register
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOtpRequest={(user) => { setPendingOtpUser(user); setIsOtpOpen(true); setIsAuthOpen(false); }}
        onLogin={(user) => { setUser(user); }}
      />

      <OtpPopup
        isOpen={isOtpOpen}
        onClose={() => { setIsOtpOpen(false); setPendingOtpUser(null); }}
        pendingUser={pendingOtpUser}
        onVerified={(user) => { setUser(user); /* maybe reload userDoc snapshot */ }}
      />

      {/* Modals */}
      {/* {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          userData={{ setUser }}
        />
      )}

      {isOtpPopup && (
        <OtpPopup
          isOpen={isOtpPopup}
          onClose={() => setIsOtpPopup(false)}
          userData={{ setUser }}
        />
      )} */}

      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
      <ContactUsModal
        open={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </nav>
  );
}

/* Helper */
function titleFromKey(key) {
  switch (key) {
    case "lakshya": return "Lakshya";
    case "safalta": return "Safalta";
    case "shikhar": return "Shikhar";
    case "samarpan": return "Samarpan";
    default: return "Unknown";
  }
}

export default Navbar;


// // src/components/Navbar.jsx
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { auth, DEFAULT_AVATAR, db } from "../firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, onSnapshot } from "firebase/firestore";
// import AuthModal from "./AuthModal";
// import SubscriptionPopup from "./SubscriptionPopup";
// import ContactUsModal from "./ContactUsModal";
// import { motion, AnimatePresence } from "framer-motion";
// import OtpPopup from "./OtpPopup";

// function Navbar() {
//   const [user, setUser] = useState(null);
//   const [userDoc, setUserDoc] = useState(null);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isAuthOpen, setIsAuthOpen] = useState(false);
//   const [isOtpPopup, setIsOtpPopup] = useState(false);
//   const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
//   const [isContactOpen, setIsContactOpen] = useState(false); 
//   const [plan, setPlan] = useState(null);
//   const navigate = useNavigate();


//   // useEffect(() => {
//   //   const unsubAuth = onAuthStateChanged(auth, (u) => {
//   //     if (!u) {
//   //       setUser(null);
//   //       setUserDoc(null);
//   //       setPlan(null);
//   //       return;
//   //     }
  
//   //     const ref = doc(db, "users", u.uid);
//   //     const unsubDoc = onSnapshot(ref, (snap) => {
//   //       const data = snap.exists() ? snap.data() : null;

//   //       if (data?.isVerified) {
//   //         setUser(u);
//   //         setUserDoc(data);
//   //         setPlan(data?.plan || null);
//   //       } else {
//   //         setUser(null);
//   //         setUserDoc(null);
//   //         setPlan(null);
//   //       }
//   //     });
//   //     return () => unsubDoc();
//   //   });
  
//   //   return () => unsubAuth();
//   // }, [user]);

//   function handleLogout() {
//     signOut(auth)
//       .then(() => {
//         console.log("User signed out successfully");
//         setUser(null);
//         navigate("/");
//       })
//       .catch((error) => {
//         console.error("Error signing out:", error);
//       });
//   }

//   console.log(user, "djhjhfs");
  
//   // Listen to auth + user doc
//   useEffect(() => {
//     // const unsubAuth = onAuthStateChanged(auth, (u) => {
//       // console.log(u, "from navbar");
//       // if (u) {
//         setIsAuthOpen(false);
//         // setUser(u);
//         setIsOtpPopup(true);
//         // const ref = doc(db, "users", u.uid);
//         // const unsubDoc = onSnapshot(ref, (snap) => {
//         //   const data = snap.exists() ? snap.data() : null;
//         //   setUserDoc(data);
//         //   setPlan(data?.plan || null);
//         // });
//         // setIsAuthOpen(false);
//         // return () => unsubDoc();
//       // } else {
//       //   setUserDoc(null);
//       //   setPlan(null);
//       //   setIsOtpPopup(false);
//       //   setIsAuthOpen(false);
//       // }
//     // });
//     // return () => unsubAuth();
//   }, []);

//   // useEffect(() => {
//   //   setIsAuthOpen(false);
//   // },[user])
//   // close dropdown if clicked outside
//   useEffect(() => {
//     const closeDropdown = (e) => {
//       if (!e.target.closest(".dropdown")) setDropdownOpen(false);
//     };
//     document.addEventListener("click", closeDropdown);
//     return () => document.removeEventListener("click", closeDropdown);
//   }, []);

//   const avatarSrc = user?.photoURL || userDoc?.photoURL || DEFAULT_AVATAR;

//   return (
//     <nav className="bg-black shadow-md shadow-gray-800/40 fixed w-full top-0 z-50">
//       <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//         {/* Logo */}
//         <h1
//           className="text-2xl font-bold cursor-pointer"
//           style={{ color: "#0090DE" }}
//           onClick={() => navigate("/")}
//         >
//           Satyapath
//         </h1>

//         {/* Links */}
//         <div className="hidden md:flex space-x-8 text-white font-medium items-center">
//           <button
//             onClick={() => navigate("/services")}
//             className="hover:text-[#0090DE] transition"
//           >
//             Services
//           </button>
//           <button
//             onClick={() => navigate("/downloads")}
//             className="hover:text-[#0090DE] transition"
//           >
//             Downloads
//           </button>
//           <button
//             onClick={() => setIsContactOpen(true)} // ✅ open modal only
//             className="hover:text-[#0090DE] transition"
//           >
//             Contact Us
//           </button>
//           <button
//             onClick={() => setIsSubscriptionOpen(true)}
//             className="hover:text-[#0090DE] transition flex items-center gap-1"
//           >
//             Subscription{" "}
//             {plan && (
//               <span className="text-gray-400 text-xs font-normal">
//                 ({titleFromKey(plan)})
//               </span>
//             )}
//           </button>
//         </div>

//         {/* Auth / Dropdown */}
//         {user ? (
//           <div className="relative dropdown">
//             <button
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//               className="flex items-center gap-2 text-white"
//             >
//               <img
//                 src={avatarSrc || user?.photoURL}
//                 alt="avatar"
//                 className="w-8 h-8 rounded-full object-cover border-2 border-white"
//                 onError={(e) => {
//                   e.currentTarget.src = DEFAULT_AVATAR;
//                 }}
//               />
//               {user?.name || user?.displayName || userDoc?.firstName || "User"}
//               <span>▼</span>
//             </button>

//             {/* Dropdown */}
//             <AnimatePresence>
//               {dropdownOpen && (
//                 <motion.div
//                   key="dropdown"
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.3 }}
//                   className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
//                 >
//                   {plan && (
//                     <div className="px-4 py-3 text-sm font-semibold text-center bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
//                       <span className="px-2 py-1 rounded-md bg-gray-900/80 text-white text-xs">
//                         {titleFromKey(plan)} Plan
//                       </span>
//                     </div>
//                   )}

//                   <button
//                     onClick={() => {
//                       navigate("/dashboard");
//                       setDropdownOpen(false);
//                     }}
//                     className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     Dashboard
//                   </button>
//                   <button
//                     onClick={() => {
//                       navigate("/profile");
//                       setDropdownOpen(false);
//                     }}
//                     className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     Profile
//                   </button>
//                   <button
//                     onClick={() => {
//                       navigate("/library");
//                       setDropdownOpen(false);
//                     }}
//                     className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     Library
//                   </button>
                 
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     Sign Out
//                   </button>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         ) : (
//           <button
//             onClick={() => setIsAuthOpen(true)}
//             className="px-5 py-2 rounded-lg text-white font-medium"
//             style={{ backgroundColor: "#0090DE" }}
//           >
//             Sign In / Register
//           </button>
//         )}
//       </div>

//       {isAuthOpen &&
//         <AuthModal
//         isOpen={isAuthOpen}
//         onClose={() => setIsAuthOpen(false)}
//         userData={{ setUser }}
//       />
//       }
//       {
//         isOtpPopup && 
//         <OtpPopup
//         isOpen={isOtpPopup}
//         onClose={() => setIsOtpPopup(false)}
//         userData={{ setUser }}/>
//       }
//       <SubscriptionPopup
//         isOpen={isSubscriptionOpen}
//         onClose={() => setIsSubscriptionOpen(false)}
//       />
//       <ContactUsModal
//         open={isContactOpen}
//         onClose={() => setIsContactOpen(false)}
//       />
//     </nav>
//   );
// }

// /* Helper */
// function titleFromKey(key) {
//   switch (key) {
//     case "lakshya":
//       return "Lakshya";
//     case "safalta":
//       return "Safalta";
//     case "shikhar":
//       return "Shikhar";
//     case "samarpan":
//       return "Samarpan";
//     default:
//       return "Unknown";
//   }
// }

// export default Navbar;
