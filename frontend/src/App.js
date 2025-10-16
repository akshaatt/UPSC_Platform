// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy, setDoc } from "firebase/firestore";

// Components
import Navbar from "./components/Navbar";
import AnimatedBanner from "./components/AnimatedBanner";
import WelcomeMessage from "./components/WelcomeMessage";
import AiSearch from "./components/AiSearch";
import ResourceCards from "./components/ResourceCards";
import AboutUs from "./components/AboutUs";
import TestPreview from "./components/TestPreview";
import ToppersTalk from "./components/ToppersTalk";
import StudyRoomsPreview from "./components/StudyRoomsPreview";
import AuthModal from "./components/AuthModal";
import SubscriptionPopup from "./components/SubscriptionPopup";
import UserInfoPopup from "./components/UserInfoPopup";
import Footer from "./components/Footer";
import ContactUsModal from "./components/ContactUsModal";
import CurrentAffairsBanner from "./components/CurrentAffairsBanner";
import DailyExam from "./components/DailyExam";
import QueryResponsePopup from "./components/QueryResponsePopup";
import Mentorship from "./components/Mentorship";
import FloatingReelsButton from "./components/FloatingReelsButton";
import SplashScreen from "./components/SplashScreen";
import useDailyActiveTime from "./hooks/useDailyActiveTime";

// Pages
import Library from "./pages/Library";
import Maps from "./pages/Maps";
import Dynasty from "./pages/Dynasty";
import PreviousPapers from "./pages/PreviousPapers";
import Newspapers from "./pages/Newspapers";
import Tests from "./pages/Tests";
import Profile from "./pages/Profile";
import TopicTests from "./pages/TopicTests";
import PrelimsTests from "./pages/PrelimsTests";
import StudyRoom from "./pages/StudyRoom";
import TestRunner from "./pages/TestRunner";
import CurrentAffairs from "./pages/CurrentAffairs";
import MainsTab from "./pages/MainsTab";
import DailyQuiz from "./pages/DailyQuiz";
import Csat from "./pages/Csat";
import AboutUPSC from "./pages/AboutUPSC";
import ExclusiveNotes from "./pages/ExclusiveNotes";
import MentorshipPage from "./pages/MentorshipPage";
import Reels from "./pages/Reels";

// ----------------- Homepage -----------------
function HomePage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <AnimatedBanner />
      <CurrentAffairsBanner />
      <WelcomeMessage />

      <div className="max-w-5xl mx-auto px-6 py-10 text-center text-gray-700 dark:text-gray-300">
        <h2 className="text-2xl font-bold mb-4">Welcome to Satyapath</h2>
        <p>
          Explore study rooms, mentorship sessions, and access curated UPSC
          materials. Start your journey today!
        </p>

        <AiSearch />
        <ResourceCards />
      </div>

      <AboutUs />
      <TestPreview />
      <ToppersTalk videos={videos} />
      <StudyRoomsPreview />
      <DailyExam />
      <Mentorship />
    </>
  );
}

// ----------------- App Wrapper -----------------
function AppWrapper() {
  const location = useLocation();
  const dailyActiveTime = useDailyActiveTime(); // global active-time hook
  const background = location.state && location.state.background;

  // UI state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Auth / user state
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  // Splash control
  const [showSplash, setShowSplash] = useState(true);

  // Firebase auth + user document subscription
  useEffect(() => {
    let unsubUserDoc = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        unsubUserDoc = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserDoc(data);
            if (!data.phone || !data.address) setShowInfoPopup(true);
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

  /* ----------------------------
      🔥 NEW: Daily Usage Saver
  ----------------------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const todayKey = new Date().toISOString().split("T")[0]; // e.g. "2025-10-16"

    // Save every 1 minute
    const interval = setInterval(async () => {
      try {
        await setDoc(
          doc(db, "users", uid, "dailyUsage", todayKey),
          {
            seconds: dailyActiveTime,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Error updating daily usage:", err);
      }
    }, 60000); // every 1 min

    // Reset at midnight (00:00)
    const resetCheck = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Reset active time in hook
        window.location.reload(); // optional: reload app to refresh chart
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(resetCheck);
    };
  }, [dailyActiveTime]);

  // Protected route wrapper
  const ProtectedTopicTests = ({ children }) => {
    if (loading) return <div className="pt-24 text-center">Checking subscription…</div>;
    if (!user) return <Navigate to="/" replace />;
    if (!["safalta", "shikhar", "samarpan"].includes(userDoc?.plan || "lakshya")) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar
        onLoginClick={() => setIsAuthOpen(true)}
        onSubscriptionClick={() => setIsSubscriptionOpen(true)}
      />

      <Routes location={background || location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/aboutupsc" element={<AboutUPSC />} />
        <Route path="/dailyquiz" element={<DailyQuiz />} />
        <Route path="/profile" element={<Profile dailyActiveTime={dailyActiveTime} />} />
        <Route path="/library" element={<Library />} />
        <Route path="/resources/maps" element={<Maps />} />
        <Route path="/resources/dynasty" element={<Dynasty />} />
        <Route path="/resources/papers" element={<PreviousPapers />} />
        <Route path="/resources/newspapers" element={<Newspapers />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/study-rooms" element={<StudyRoom />} />
        <Route path="/current-affairs" element={<CurrentAffairs />} />
        <Route path="/csat-tests" element={<Csat />} />
        <Route path="/exclusive-notes" element={<ExclusiveNotes />} />
        <Route path="/reels" element={<Reels />} />

        {/* Protected routes */}
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
        <Route
          path="/tests/:examType/:subject/:subtopic/:testId"
          element={
            <ProtectedTopicTests>
              <TestRunner />
            </ProtectedTopicTests>
          }
        />
        <Route
          path="/mains-tab"
          element={
            <ProtectedTopicTests>
              <MainsTab />
            </ProtectedTopicTests>
          }
        />
        <Route
          path="/mentorship"
          element={
            <ProtectedTopicTests>
              <MentorshipPage />
            </ProtectedTopicTests>
          }
        />
      </Routes>

      {background && location.pathname === "/reels" && <Reels />}

      {location.pathname === "/" && (
        <Footer onContactClick={() => setIsContactOpen(true)} />
      )}

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SubscriptionPopup isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} />
      <UserInfoPopup user={user} isOpen={showInfoPopup} onClose={() => setShowInfoPopup(false)} />
      <ContactUsModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <QueryResponsePopup />
      <FloatingReelsButton />
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
