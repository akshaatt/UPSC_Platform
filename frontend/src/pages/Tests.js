import React, { useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import SubscriptionPopup from "../components/SubscriptionPopup";

function Tests() {
  const [user] = useAuthState(auth);
  const [openSub, setOpenSub] = useState(false);

  const userPlan = useMemo(
    () => (user ? (localStorage.getItem("plan") || "lakshya") : null),
    [user]
  );

  const allowed = !!user && ["safalta", "shikhar", "samarpan"].includes(userPlan);

  if (!allowed) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tests Locked</h2>
          {!user ? (
            <p className="text-gray-700 dark:text-gray-300">
              Please log in to access tests. Safalta plan or higher required.
            </p>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              Upgrade to <strong>Safalta</strong> or higher to unlock chapter-wise and subject-wise tests.
            </p>
          )}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => setOpenSub(true)}
              className="px-5 py-2 bg-[#0090DE] text-white rounded-lg hover:bg-[#007bbd] transition"
            >
              View Plans
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg transition"
            >
              Go Home
            </button>
          </div>
        </div>

        <SubscriptionPopup isOpen={openSub} onClose={() => setOpenSub(false)} />
      </div>
    );
  }

  // Allowed content (placeholder)
  return (
    <div className="pt-24 max-w-5xl mx-auto px-6">
      <h1 className="text-2xl font-bold mb-4">📚 Tests</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Your chapter-wise and subject-wise tests will appear here.
      </p>

      {/* You can design filters here later */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {["Polity", "Geography", "History", "Economy", "Environment", "Science"].map(
          (name) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Topic-wise tests coming soon.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Tests;
