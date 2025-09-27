import React from "react";
import { useNavigate } from "react-router-dom";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="flex justify-between items-center p-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl mt-4">
      <div>
        <h2 className="text-3xl font-bold dark:text-yellow-300">UPSC Study Hub</h2>
        <p className="text-gray-600 mt-2 dark:text-gray-300">
          A modern platform for UPSC aspirants. Access books, ask questions, and
          join discussions.
        </p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => navigate("/library")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            📚 Library
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            Ask a Question
          </button>
        </div>
      </div>
      <img
        src="https://via.placeholder.com/150"
        alt="Illustration"
        className="w-40"
      />
    </section>
  );
}

export default HeroSection;
