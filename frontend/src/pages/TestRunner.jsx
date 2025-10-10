// src/pages/TestRunner.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function TestRunner() {
  const { examType, subject, subtopic, testId } = useParams();
  const navigate = useNavigate();

  const [testDoc, setTestDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);

  const [mediaError, setMediaError] = useState("");
  const videoRefStart = useRef(null);
  const videoRefLive = useRef(null);
  const containerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState(null);

  const [violationReason, setViolationReason] = useState("");
  const [tabWarnings, setTabWarnings] = useState(0);

  // total time = 30 sec per question
  const totalSeconds = useMemo(() => {
    const n = testDoc?.questions?.length || 0;
    return n * 30;
  }, [testDoc]);

  // --- Fetch test & normalize JSON ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log("🔥 Params from URL:", { examType, subject, subtopic, testId });

        let ref;

        // ✅ CSAT tests
        if (examType === "csat") {
          if (subject === "maths") {
            ref = doc(
              db,
              "csatQuizzes",
              "maths",
              "subtopics",
              subtopic,
              "tests",
              testId
            );
          } else {
            ref = doc(db, "csatQuizzes", subject, "tests", testId);
          }
        }
        // ✅ Prelims tests
        else {
          ref = doc(
            db,
            "tests",
            examType,
            "subjects",
            subject,
            "subtopics",
            subtopic,
            "tests",
            testId
          );
        }

        console.log("📂 Firestore ref path:", ref.path);

        const snap = await getDoc(ref);
        if (!snap.exists()) {
          console.error("❌ No document found at:", ref.path);
          alert("❌ Test not found.");
          navigate("/");
          return;
        }

        const raw = snap.data();
        console.log("✅ Raw Firestore data:", raw);

        // Normalize JSON shape
        let questions = [];
        if (Array.isArray(raw?.questions)) questions = raw.questions;
        else if (Array.isArray(raw?.data)) questions = raw.data;
        else if (Array.isArray(raw)) questions = raw;
        else questions = [];

        questions = questions
          .filter(
            (q) => q && (q.question || q.text) && Array.isArray(q.options) && q.options.length > 0
          )
          .map((q, i) => ({
            id: q.id || `q${i}`,
            question: q.question || q.text,
            options: q.options,
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : null,
            answer: q.answer ?? q.correct ?? null,
            explanation: q.explanation ?? "",
          }));

        if (!questions.length) {
          alert("❌ This test has no questions.");
          navigate("/");
          return;
        }

        if (!mounted) return;

        const norm = {
          id: snap.id,
          title: raw.title || (examType === "csat" ? "CSAT Test" : "Prelims Test"),
          questions,
        };
        setTestDoc(norm);
        setSecondsLeft(questions.length * 30);

        // ✅ Prevent reattempt
        const user = auth.currentUser;
        if (user) {
          try {
            const attemptRef = doc(
              db,
              "attempts",
              `${examType}_${subject || "general"}_${subtopic || "general"}_${testId}_${user.uid}`
            );
            const attemptSnap = await getDoc(attemptRef);

            if (attemptSnap.exists()) {
              alert("⚠️ You have already attempted this test.");
              navigate("/");
              return;
            }
          } catch (err) {
            console.warn("⚠️ Attempt check failed, ignoring:", err.message);
          }
        }
      } catch (e) {
        console.error("🚨 Fetch failed:", e);
        alert("Failed to load test.");
        navigate("/");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [examType, subject, subtopic, testId, navigate]);

  // --- Start test (fullscreen + camera/mic) ---
  const startTest = async () => {
    setMediaError("");

    try {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not available");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (videoRefStart.current) {
        videoRefStart.current.srcObject = stream;
        videoRefStart.current.play().catch(() => {});
      }

      setStarted(true);

      setTimeout(() => {
        if (videoRefLive.current) {
          videoRefLive.current.srcObject = stream;
          videoRefLive.current.play().catch(() => {});
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setMediaError("⚠️ Camera & Microphone are required to start test.");
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // --- Timer ---
  useEffect(() => {
    if (!started || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(t);
  }, [started, secondsLeft]);

  useEffect(() => {
    if (started && secondsLeft === 0) {
      handleSubmit("timeout");
    }
  }, [started, secondsLeft]);

  // --- Fullscreen exit detection ---
  useEffect(() => {
    if (!started) return;
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setViolationReason("fullscreen-exit");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [started]);

  // --- Tab switch detection ---
  useEffect(() => {
    if (!started) return;

    const triggerTabViolation = () => {
      setTabWarnings((prev) => {
        if (prev === 0) {
          setViolationReason("tab-warning");
          return 1;
        }
        if (prev === 1) {
          setViolationReason("unfair-means");
          setTimeout(() => {
            handleSubmit("unfair-means");
            navigate("/");
          }, 5000);
          return 2;
        }
        return prev;
      });
    };

    const onBlur = triggerTabViolation;
    const onVisibility = () => {
      if (document.hidden) triggerTabViolation();
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [started, navigate]);

  if (loading) return <div className="pt-24 text-center">Loading test…</div>;
  if (!testDoc) return null;

  const q = testDoc.questions[current];
  const n = testDoc.questions.length;
  const qKey = q?.id || `q${current}`;

  const selectAnswer = (idx) =>
    setAnswers((prev) => ({ ...prev, [qKey]: idx }));

  const formatMMSS = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  // --- Evaluate ---
  const computeScore = () => {
    let correct = 0;
    let wrong = 0;
    const detail = testDoc.questions.map((ques, idx) => {
      const key = ques.id || `q${idx}`;
      const chosen = answers[key];
      const isCorrect =
        chosen === ques.correctIndex ||
        (ques.answer && ques.options[chosen] === ques.answer);

      if (chosen != null) {
        if (isCorrect) correct++;
        else wrong++;
      }

      return {
        index: idx + 1,
        question: ques.question,
        options: ques.options,
        correctIndex: ques.correctIndex ?? null,
        answer: ques.answer ?? null,
        chosenIndex: chosen ?? null,
        isCorrect: chosen != null ? isCorrect : null,
        explanation: ques.explanation ?? "",
      };
    });
    const marks = correct * 3 - wrong * 1;
    return { correct, wrong, total: n, marks, detail };
  };

  // --- Submit ---
  const handleSubmit = async (why = "submit") => {
    const res = computeScore();
    setResult(res);
    setShowResults(true);

    try {
      const user = auth.currentUser;
      const attemptId = `${examType}_${subject || "general"}_${subtopic || "general"}_${testId}_${user?.uid || "anon"}`;
      await setDoc(doc(db, "attempts", attemptId), {
        userId: user?.uid || "anon",
        examType,
        subject,
        subtopic,
        testId,
        title: testDoc.title || "",
        answers,
        ...res,
        attemptedAt: serverTimestamp(),
        endedBy: why,
        durationSeconds: totalSeconds - secondsLeft,
      });
    } catch (e) {
      console.error("Save failed", e);
    }

    mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // --- Simple pie chart ---
  const Pie = ({ correct, wrong, total }) => {
    const done = correct + wrong;
    const green = ((correct / total) * 360).toFixed(0);
    const redStart = green;
    const redEnd = (((done) / total) * 360).toFixed(0);
    const bg = `conic-gradient(#22c55e 0 ${green}deg, #ef4444 ${redStart}deg ${redEnd}deg, #9ca3af ${redEnd}deg 360deg)`;
    return <div className="w-36 h-36 rounded-full" style={{ background: bg }} />;
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-20 px-4 md:px-8 bg-gray-900 text-gray-100">
      {/* Start screen */}
      {!started && (
        <div className="max-w-4xl mx-auto bg-gray-800/70 p-6 rounded-2xl">
          <h1 className="text-2xl font-bold mb-2">{testDoc.title}</h1>
          <p className="text-gray-300 mb-4">
            The test will open in fullscreen with camera & microphone enabled.
          </p>
          <video
            ref={videoRefStart}
            muted
            playsInline
            className="w-60 h-40 bg-black rounded-lg object-cover"
          />
          {mediaError && <p className="text-red-400 mt-4">{mediaError}</p>}
          <button
            onClick={startTest}
            className="mt-6 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700"
          >
            Start Test
          </button>
        </div>
      )}

      {/* Test screen */}
      {started && (
        <>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-6">
            {/* Navigator */}
            <div className="bg-gray-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm">Questions</p>
                <span className="text-sm">⏱ {formatMMSS(secondsLeft)}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {testDoc.questions.map((qq, i) => {
                  const key = qq.id || `q${i}`;
                  const chosen = answers[key];
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`h-9 rounded ${
                        i === current
                          ? "bg-cyan-600"
                          : chosen != null
                          ? "bg-green-600/70"
                          : "bg-gray-700"
                      }`}
                      title={`Q${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question */}
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Q{current + 1}</h2>
              </div>
              <p className="mb-4">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const selected = answers[qKey] === idx;
                  return (
                    <label
                      key={idx}
                      className={`block p-3 rounded border cursor-pointer ${
                        selected
                          ? "bg-cyan-600/30 border-cyan-500"
                          : "bg-gray-900/40 border-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selected}
                        onChange={() => selectAnswer(idx)}
                        className="mr-2 accent-cyan-500"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={current === n - 1}
                  onClick={() => setCurrent((c) => Math.min(c + 1, n - 1))}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 rounded-xl">
              <div className="mb-4">
                Answered:{" "}
                <b>
                  {Object.keys(answers).length}/{n}
                </b>
              </div>
              <button
                onClick={() => handleSubmit("submit")}
                className="w-full py-2 rounded bg-purple-600 hover:bg-purple-700"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Floating camera */}
          <div className="fixed bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg z-50">
            <video
              ref={videoRefLive}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </>
      )}

      {/* Results */}
      <AnimatePresence>
        {showResults && result && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 p-6 rounded-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold mb-4">Your Results</h3>

              {/* Summary Section */}
              <div className="flex items-center gap-6 mb-6">
                <Pie correct={result.correct} wrong={result.wrong} total={result.total} />
                <div className="space-y-1">
                  <div>Total Questions: <b>{result.total}</b></div>
                  <div>Correct: <b className="text-green-400">{result.correct}</b></div>
                  <div>Wrong: <b className="text-red-400">{result.wrong}</b></div>
                  <div>Marks (3/-1): <b className="text-cyan-400">{result.marks}</b></div>

                  {/* 🔥 Feedback line */}
                  <div className="mt-3 text-lg font-semibold text-yellow-300">
                    {(() => {
                      const percent = (result.correct / result.total) * 100;
                      if (percent < 20) return "Keep practicing, you need to strengthen your basics.";
                      if (percent < 50) return "Good attempt, but you need more revision.";
                      if (percent < 75) return "Well done! You’re on the right track.";
                      return "Excellent! You’re exam-ready.";
                    })()}
                  </div>
                </div>
              </div>

              {/* Detailed Questions */}
              <div className="max-h-[50vh] overflow-auto rounded border border-gray-700 mt-6">
                {result.detail.map((d) => (
                  <div key={d.index} className="p-4 border-b border-gray-800">
                    <div className="mb-2 font-semibold">Q{d.index}. {d.question}</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {d.options.map((opt, i) => {
                        const isCorrect = i === d.correctIndex || (d.answer && opt === d.answer);
                        const isChosen = i === d.chosenIndex;
                        return (
                          <div
                            key={i}
                            className={[
                              "px-3 py-2 rounded border",
                              isCorrect
                                ? "border-green-500 bg-green-500/10"
                                : isChosen
                                ? "border-red-500 bg-red-500/10"
                                : "border-gray-700 bg-gray-800",
                            ].join(" ")}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    {d.explanation && (
                      <div className="mt-2 text-sm text-gray-300">
                        <b>Explanation: </b>{d.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResults(false);
                    navigate("/topic-test"); // 👈 change this if you want to redirect differently
                  }}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
                >
                  Commence More Tests
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Violation popup */}
      <AnimatePresence>
        {violationReason && !showResults && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <motion.div className="bg-gray-900 p-6 rounded-2xl text-center">
              {violationReason === "fullscreen-exit" && (
                <>
                  <h3 className="text-xl font-bold mb-2">⚠️ Fullscreen Exit</h3>
                  <p className="mb-6">You must stay in fullscreen during the test.</p>
                  <button
                    onClick={() => handleSubmit("violation")}
                    className="px-5 py-2 bg-red-600 rounded-lg mr-2"
                  >
                    End Test
                  </button>
                  <button
                    onClick={async () => {
                      setViolationReason("");
                      if (containerRef.current?.requestFullscreen) {
                        await containerRef.current.requestFullscreen();
                      }
                    }}
                    className="px-5 py-2 bg-green-600 rounded-lg"
                  >
                    Continue in Fullscreen
                  </button>
                </>
              )}

              {violationReason === "tab-warning" && (
                <>
                  <h3 className="text-xl font-bold mb-2">⚠️ Tab Switch Detected</h3>
                  <p className="text-yellow-400">
                    This is your first warning. Switching again will end your test.
                  </p>
                  <button
                    onClick={() => setViolationReason("")}
                    className="mt-4 px-5 py-2 bg-cyan-600 rounded-lg"
                  >
                    Resume Test
                  </button>
                </>
              )}

              {violationReason === "unfair-means" && (
                <>
                  <h3 className="text-xl font-bold mb-2">🚨 Unfair Means</h3>
                  <p className="text-red-400 mb-2">
                    Test ended due to repeated tab switching.
                  </p>
                  <p className="text-gray-400">Redirecting to home...</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
