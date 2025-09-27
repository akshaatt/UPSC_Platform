import React from "react";

function Popular() {
  return (
    <section className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Popular</h2>
      <div className="p-4 border rounded-lg">
        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-md text-sm">
          25 Votes
        </span>
        <h3 className="mt-2 font-semibold">
          Which books are must for UPSC preparation?
        </h3>
        <p className="text-gray-500 text-sm">by Matthew Anderson</p>
        <div className="flex gap-4 text-gray-500 mt-2 text-sm">
          <span>2 Answers</span>
          <span>5 Comments</span>
        </div>
      </div>
    </section>
  );
}

export default Popular;
