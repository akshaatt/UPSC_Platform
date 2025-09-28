// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import Navbar from "./components/Navbar";
import AnimatedBanner from "./components/AnimatedBanner";
import WelcomeMessage from "./components/WelcomeMessage";
import AiSearch from "./components/AiSearch";
import ResourceCards from "./components/ResourceCards";
import AboutUs from "./components/AboutUs";
import TestPreview from "./components/TestPreview";

import Library from "./pages/Library";
import Maps from "./pages/Maps";
import Dynasty from "./pages/Dynasty";
import Papers from "./pages/Papers";
import Tests from "./pages/Tests";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import TopicTests from "./pages/TopicTests";
import PrelimsTests from "./pages/PrelimsTests"; // ✅ new page

import AuthModal from "./components/AuthModal";
import SubscriptionPopup from "./components/SubscriptionPopup";
import UserInfoPopup from "./components/UserInfoPopup";

function HomePage() {
  return (
    <>
      <AnimatedBanner />
      <WelcomeMessage />

      <div className="max-w-5xl mx-auto px-6 py-10 text-center text-gray-700 dark:text-gray-300">
        <h2 className="text-2xl font-bold mb-4">Welcome to Satyapath</h2>
        <p>
          Explore study rooms, ask your doubts, and access curated UPSC materials.
          Start your journey today!
        </p>

        <AiSearch />
        <ResourceCards />
      </div>

      <AboutUs />
      <TestPreview />
    </>
  );
}

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);

        // ✅ realtime updates so subscription / info updates reflect immediately
        unsubUserDoc = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserDoc(data);

            if (!data.phone || !data.address) {
              setShowInfoPopup(true);
            }
          } else {
            setUserDoc({});
            setShowInfoPopup(true);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserDoc(null);
        setShowInfoPopup(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // ✅ Protected routes wrapper
  const ProtectedTopicTests = ({ children }) => {
    if (loading) return <div className="pt-24 text-center">Checking subscription…</div>;
    if (!user) return <Navigate to="/" replace />;

    if (!["safalta", "shikhar", "samarpan"].includes(userDoc?.plan || "lakshya")) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading…</div>;
  }

  // ✅ Force OTP modal until verified
  if (user && userDoc && userDoc.isVerified === false) {
    return (
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <AuthModal isOpen={true} onClose={() => {}} />
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar
          onLoginClick={() => setIsAuthOpen(true)}
          onSubscriptionClick={() => setIsSubscriptionOpen(true)}
        />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/resources/maps" element={<Maps />} />
          <Route path="/resources/dynasty" element={<Dynasty />} />
          <Route path="/resources/papers" element={<Papers />} />
          <Route path="/tests" element={<Tests />} />

          {/* ✅ TopicTests & PrelimsTests protected by subscription */}
          <Route
            path="/topic-tests"
            element={
              <ProtectedTopicTests>
                <TopicTests />
              </ProtectedTopicTests>
            }
          />
          <Route
            path="/prelims-tests"
            element={
              <ProtectedTopicTests>
                <PrelimsTests />
              </ProtectedTopicTests>
            }
          />
        </Routes>

        {/* Global Modals */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <SubscriptionPopup
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
        />
        <UserInfoPopup
          user={user}
          isOpen={showInfoPopup}
          onClose={() => setShowInfoPopup(false)}
        />
      </div>
    </Router>
  );
}

export default App;
