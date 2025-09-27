import React from "react";

function Stats() {
  const stats = [
    { label: "Questions", value: "420+" },
    { label: "Answers", value: "360+" },
    { label: "Forums", value: "50+" },
    { label: "Groups", value: "120+" },
  ];

  return (
    <div className="grid grid-cols-4 text-center my-6">
      {stats.map((s, i) => (
        <div key={i}>
          <h3 className="text-xl font-bold">{s.value}</h3>
          <p className="text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export default Stats;
