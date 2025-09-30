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

  // total time
  const totalSeconds = useMemo(() => {
    const n = testDoc?.questions?.length || 0;
    return n * 30;
  }, [testDoc]);

  // Fetch test
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const ref = doc(
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
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("❌ Test not found.");
          navigate("/");
          return;
        }

        const data = snap.data();
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          alert("❌ This test has no questions.");
          navigate("/");
          return;
        }

        setTestDoc({ id: snap.id, ...data });
        setSecondsLeft(data.questions.length * 30);

        const user = auth.currentUser;
        if (user) {
          const attemptRef = doc(db, "attempts", `${testId}_${user.uid}`);
          const attemptSnap = await getDoc(attemptRef);
          if (attemptSnap.exists()) {
            alert("⚠️ You have already attempted this test.");
            navigate("/");
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [examType, subject, subtopic, testId, navigate]);

  // Start test
  const startTest = async () => {
    setMediaError("");
    try {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
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

  // Cleanup
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Timer
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

  // Detect fullscreen exit
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

  // Detect tab switch
  useEffect(() => {
    if (!started) return;

    const triggerTabViolation = () => {
      if (tabWarnings === 0) {
        setTabWarnings(1);
        setViolationReason("tab-warning");
      } else if (tabWarnings === 1) {
        setTabWarnings(2);
        setViolationReason("unfair-means");
        setTimeout(() => {
          handleSubmit("unfair-means");
          navigate("/");
        }, 5000);
      }
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
  }, [started, tabWarnings, navigate]);

  if (loading) return <div className="pt-24 text-center">Loading test…</div>;

  const q = testDoc.questions[current];
  const n = testDoc.questions.length;
  const qKey = q?.id || `q${current}`;

  const selectAnswer = (idx) =>
    setAnswers((prev) => ({ ...prev, [qKey]: idx }));

  const formatMMSS = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  // Evaluate test
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
      };
    });
    const marks = correct * 3 - wrong * 1;
    return { correct, wrong, total: n, marks, detail };
  };

  // Submit test
  const handleSubmit = async (why = "submit") => {
    const res = computeScore();
    setResult(res);
    setShowResults(true);

    try {
      const user = auth.currentUser;
      const attemptId = `${testId}_${user?.uid || "anon"}`;
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

  // Pie chart
  const Pie = ({ correct, wrong, total }) => {
    const bg = `conic-gradient(#22c55e 0 ${(
      (correct / total) *
      360
    ).toFixed()}deg,
    #ef4444 ${(correct / total) * 360}deg ${(
      ((correct + wrong) / total) *
      360
    ).toFixed()}deg,
    #9ca3af ${(((correct + wrong) / total) * 360).toFixed()}deg 360deg)`;
    return <div className="w-36 h-36 rounded-full" style={{ background: bg }} />;
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-20 px-4 md:px-8 bg-gray-900 text-gray-100"
    >
      {/* Start screen */}
      {!started && (
        <div className="max-w-4xl mx-auto bg-gray-800/70 p-6 rounded-2xl">
          <h1 className="text-2xl font-bold mb-2">
            {testDoc?.title || "Prelims Test"}
          </h1>
          <p className="text-gray-300 mb-4">
            The test will start in fullscreen with camera & microphone enabled.
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
            {/* Question nav */}
            <div className="bg-gray-800 p-4 rounded-xl">
              <p className="mb-2 text-sm">Questions</p>
              <div className="grid grid-cols-5 gap-2">
                {testDoc.questions.map((_, i) => {
                  const key = _.id || `q${i}`;
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
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question content */}
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="flex justify-between mb-4">
                <h2>Q{current + 1}</h2>
                <span>⏱ {formatMMSS(secondsLeft)}</span>
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
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4 rounded-xl">
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

      {/* Results popup */}
      <AnimatePresence>
        {showResults && result && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <motion.div className="bg-gray-900 p-6 rounded-2xl w-full max-w-4xl">
              <h3 className="text-2xl font-bold mb-4">Your Results</h3>
              <Pie correct={result.correct} wrong={result.wrong} total={result.total} />
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
