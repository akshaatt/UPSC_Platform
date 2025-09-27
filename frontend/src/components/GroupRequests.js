import React from "react";

function GroupRequests() {
  return (
    <section className="p-4 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold mb-2">Group Requests</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">UPSC Question</h3>
          <p className="text-gray-500 text-sm">
            Invite friends for a study session.
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">UPSC Preparation</h3>
          <p className="text-gray-500 text-sm">
            Join group discussions for better learning.
          </p>
        </div>
      </div>
    </section>
  );
}

export default GroupRequests;
