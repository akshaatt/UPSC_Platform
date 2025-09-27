import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnimatedBanner from "./components/AnimatedBanner";
import WelcomeMessage from "./components/WelcomeMessage";
import AiSearch from "./components/AiSearch";
import ResourceCards from "./components/ResourceCards";
import AboutUs from "./components/AboutUs";
import TestPreview from "./components/TestPreview";

// your existing pages
import Library from "./pages/Library";
import Maps from "./pages/Maps";
import Dynasty from "./pages/Dynasty";
import Papers from "./pages/Papers";
import Tests from "./pages/Tests";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";


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
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <Routes>
          {/* home */}
          <Route path="/" element={<HomePage />} />

          {/* existing pages */}
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />

          {/* resources */}
          <Route path="/resources/maps" element={<Maps />} />
          <Route path="/resources/dynasty" element={<Dynasty />} />
          <Route path="/resources/papers" element={<Papers />} />
          {/* if you add newspapers page later: */}
          {/* <Route path="/resources/newspapers" element={<Newspapers />} /> */}

          {/* tests */}
          <Route path="/tests" element={<Tests />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
