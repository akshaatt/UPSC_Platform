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
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

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
import DailyExam from "./components/DailyExam"; // ✅ Added

// Pages
import Library from "./pages/Library";
import Maps from "./pages/Maps";
import Dynasty from "./pages/Dynasty";
import PreviousPapers from "./pages/PreviousPapers";
import Newspapers from "./pages/Newspapers";
import Tests from "./pages/Tests";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import TopicTests from "./pages/TopicTests";
import PrelimsTests from "./pages/PrelimsTests";
import StudyRoom from "./pages/StudyRoom";
import TestListPage from "./pages/TestListPage";
import TestRunner from "./pages/TestRunner";
import CurrentAffairs from "./pages/CurrentAffairs";
import MainsTab from "./pages/MainsTab"; 
import DailyQuiz from "./pages/DailyQuiz"; // ✅ Added

// ✅ Homepage
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
          Explore study rooms, ask your doubts, and access curated UPSC
          materials. Start your journey today!
        </p>

        <AiSearch />
        <ResourceCards />
      </div>

      <AboutUs />
      <TestPreview />
      <ToppersTalk videos={videos} />
      <StudyRoomsPreview />

      {/* ✅ Daily Exam Component */}
      
        <DailyExam />
      
    </>
  );
}

// ✅ Wrapper for Router
function AppWrapper() {
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);

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

  const ProtectedTopicTests = ({ children }) => {
    if (loading)
      return <div className="pt-24 text-center">Checking subscription…</div>;
    if (!user) return <Navigate to="/" replace />;

    if (
      !["safalta", "shikhar", "samarpan"].includes(userDoc?.plan || "lakshya")
    ) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">Loading…</div>
    );
  }

  if (user && userDoc && userDoc.isVerified === false) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar
        onLoginClick={() => setIsAuthOpen(true)}
        onSubscriptionClick={() => setIsSubscriptionOpen(true)}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/dailyquiz" element={<DailyQuiz />} /> {/* ✅ New Route */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/resources/maps" element={<Maps />} />
        <Route path="/resources/dynasty" element={<Dynasty />} />
        <Route path="/resources/papers" element={<PreviousPapers />} />
        <Route path="/resources/newspapers" element={<Newspapers />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/study-rooms" element={<StudyRoom />} />
        <Route path="/current-affairs" element={<CurrentAffairs />} />

        {/* Protected */}
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
          path="/tests/:examType/:subject/:subtopic"
          element={
            <ProtectedTopicTests>
              <TestListPage />
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

        {/* ✅ Mains Tab Page */}
        <Route
          path="/mains-tab"
          element={
            <ProtectedTopicTests>
              <MainsTab />
            </ProtectedTopicTests>
          }
        />
      </Routes>

      {/* ✅ Footer only on homepage */}
      {location.pathname === "/" && (
        <Footer onContactClick={() => setIsContactOpen(true)} />
      )}

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
      <ContactUsModal
        open={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
