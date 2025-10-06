// src/components/StudentMainsData.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collectionGroup, query, onSnapshot } from "firebase/firestore";

export default function StudentMainsData() {
  const [subs, setSubs] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    // 🔥 Fetch all mainsSubmissions across all users
    const q = query(collectionGroup(db, "mainsSubmissions"));
    const unsub = onSnapshot(q, (snap) => {
      setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 🔍 Group submissions by userId
  const grouped = subs.reduce((acc, s) => {
    if (!s.userId) return acc;
    if (!acc[s.userId]) {
      acc[s.userId] = {
        userId: s.userId,
        userName: s.userName || "—",
        userEmail: s.userEmail || "—",
        plan: s.plan || "—",
        submissions: [],
      };
    }
    acc[s.userId].submissions.push(s);
    return acc;
  }, {});

  // 🔍 Filter by search
  const students = Object.values(grouped).filter(
    (u) =>
      u.userName.toLowerCase().includes(search.toLowerCase()) ||
      u.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-100">
        📑 Student Mains Data
      </h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
      />

      {students.length === 0 ? (
        <p className="text-sm text-gray-400">No submissions found.</p>
      ) : (
        <div className="space-y-4">
          {students.map((stu) => (
            <div
              key={stu.userId}
              className="rounded-xl bg-gray-900 border border-gray-700"
            >
              {/* Header */}
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === stu.userId ? null : stu.userId)
                }
              >
                <div>
                  <p className="font-semibold text-gray-100">
                    {stu.userName} | {stu.userEmail}
                  </p>
                  <p className="text-sm text-gray-400">
                    Plan:{" "}
                    <span className="text-cyan-400 font-medium">
                      {stu.plan}
                    </span>
                  </p>
                </div>
                <button className="text-cyan-400 text-sm">
                  {expanded === stu.userId ? "▲ Hide" : "▼ View"}
                </button>
              </div>

              {/* Submissions */}
              {expanded === stu.userId && (
                <div className="p-4 space-y-4 border-t border-gray-700">
                  {stu.submissions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-gray-800 border border-gray-600"
                    >
                      <p className="text-sm text-gray-300 mb-1">
                        <b>Question:</b> {s.questionText}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        Status: {s.status || "submitted"}
                      </p>

                      {/* Files */}
                      {s.fileUrls?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {s.fileUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
                              download
                            >
                              {url.includes(".pdf")
                                ? `📄 PDF ${i + 1}`
                                : `📝 File ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Typed Answer */}
                      {s.typedAnswer && (
                        <details>
                          <summary className="cursor-pointer text-cyan-400 text-sm">
                            View Typed Answer
                          </summary>
                          <pre className="whitespace-pre-wrap text-sm text-gray-300 mt-1">
                            {s.typedAnswer}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
