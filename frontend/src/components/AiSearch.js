import React, { useState } from "react";

function AiSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAnswer("⚠️ Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 max-w-3xl mx-auto px-6 text-center">
      {/* Search Bar */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask any UPSC-related question..."
          className="flex-1 px-4 py-3 outline-none text-gray-700"
        />
        <button
          onClick={handleAsk}
          className="px-5 py-3 bg-[#0090DE] text-white font-semibold hover:bg-[#007bbd] transition"
        >
          Ask
        </button>
      </div>

      {/* Answer */}
      <div className="mt-6 text-left">
        {loading && <p className="text-gray-500">🤔 Thinking...</p>}
        {answer && (
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 text-gray-800">
            <h3 className="font-bold mb-2 text-[#0090DE]">AI Answer:</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiSearch;
