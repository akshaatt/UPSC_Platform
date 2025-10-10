// src/pages/DailyQuiz.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 🔧 Toggle for unlimited attempts & no attempt lock during testing
const TESTING_MODE = false; // set true when testing

// 📦 Plan → default attempts mapping
const PLAN_LIMITS = {
  lakshay: 1,
  safalta: 20,
  shikhar: 150,
  samarpan: 365,
};

export default function DailyQuiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isActive, setIsActive] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warning, setWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [result, setResult] = useState(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(false);

  const [updates, setUpdates] = useState([]);
  const [hasAttempted, setHasAttempted] = useState(false);

  // 🔑 plan & attempts
  const [userPlan, setUserPlan] = useState(null); // "lakshay" | ...
  const [attemptsLeft, setAttemptsLeft] = useState(null); // number
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planMsg, setPlanMsg] = useState("");

  const timerRef = useRef(null);
  const quizRef = useRef(null);
  const canvasRef = useRef(null);
  const user = auth.currentUser;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ⭐ Twinkling Stars Background (with onload guard)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let rafId;
    let stars = [];
    let bgReady = false;
    const bgImg = new Image();
    bgImg.src = "/space.jpg"; // put your image in public/space.jpg
    bgImg.onload = () => {
      bgReady = true;
    };

    const setupSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initStars = () => {
      // smaller stars, more count & faster twinkle — can tweak
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        t: Math.random() * Math.PI * 2,
        s: 0.03 + Math.random() * 0.035,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgReady) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      }

      stars.forEach((st) => {
        st.t += st.s;
        const a = 0.35 + 0.65 * Math.sin(st.t);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };

    setupSize();
    initStars();
    draw();

    window.addEventListener("resize", setupSize);
    return () => {
      window.removeEventListener("resize", setupSize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ✅ Attempt Lock per day (only when not in testing mode)
  useEffect(() => {
    if (!user || TESTING_MODE) return;
    const docRef = doc(db, "dailyQuizAttempts", `${user.uid}_${todayStr}`);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) setHasAttempted(true);
    });
  }, [user, todayStr]);

  // ✅ Quiz Activation
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "dailyQuizConfig", "settings"), (snap) => {
      if (snap.exists()) setIsActive(snap.data().isActive);
    });
    return () => unsub();
  }, []);

  // ✅ Load Quiz (one doc per day with array of questions)
  useEffect(() => {
    if (!started) return;
    const docRef = doc(db, "dailyQuizzes", todayStr);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const qs = data.questions || [];
        setQuestions(qs);
        setTimeLeft(Math.ceil(qs.length / 3) * 60);
      } else {
        setQuestions([]);
      }
    });
    return () => unsub();
  }, [started, todayStr]);

  // ✅ Fetch Updates (sidebar scores)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "dailyQuizAttempts"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        date: d.data().date,
        score: d.data().score,
      }));
      setUpdates(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
    });
    return () => unsub();
  }, [user]);

  // ✅ Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  // ✅ Fullscreen + Tab Protection
  useEffect(() => {
    if (!started) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setViolationCount((p) => p + 1);
        if (violationCount === 0) setWarning(true);
        else terminateTest("Exam terminated: multiple fullscreen violations.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && started) terminateTest("Exam terminated: tab switch detected.");
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [started, violationCount]);

  // ✅ Fetch/ensure user plan & attempts from users/{uid}
  useEffect(() => {
    if (!user) return;
    setLoadingPlan(true);
    const uref = doc(db, "users", user.uid);
    (async () => {
      try {
        const snap = await getDoc(uref);
        if (!snap.exists()) {
          // default user doc: lakshay, attempts=1
          const defaultPlan = "lakshay";
          await setDoc(
            uref,
            {
              plan: defaultPlan,
              attemptsLeft: PLAN_LIMITS[defaultPlan],
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          setUserPlan(defaultPlan);
          setAttemptsLeft(PLAN_LIMITS[defaultPlan]);
        } else {
          const data = snap.data();
          const plan = (data.plan || "lakshay").toLowerCase();
          let at = typeof data.attemptsLeft === "number" ? data.attemptsLeft : PLAN_LIMITS[plan] || 0;

          // If attemptsLeft missing, set to plan cap (only for new/migrated users)
          if (data.attemptsLeft == null) {
            await updateDoc(uref, { attemptsLeft: at });
          }

          setUserPlan(plan);
          setAttemptsLeft(at);
        }
      } catch (e) {
        setPlanMsg("Could not load plan details.");
      } finally {
        setLoadingPlan(false);
      }
    })();
  }, [user]);

  const requestFullscreen = () => {
    if (quizRef.current?.requestFullscreen) quizRef.current.requestFullscreen();
  };
  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
  };

  const terminateTest = (reason) => {
    exitFullscreen();
    setStarted(false);
    setAnswers({});
    alert(reason);
    window.location.href = "/";
  };

  const handleSubmit = async () => {
    if (!user) return alert("Login required.");
    let correct = 0,
      incorrect = 0,
      notAttempted = 0;
    const review = [];

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (!ans) notAttempted++;
      else if (ans === q.correct) correct++;
      else incorrect++;
      review.push({
        question: q.text,
        userAnswer: ans || "Not Attempted",
        correctAnswer: q.correct,
        isCorrect: ans === q.correct,
      });
    });

    const score = correct * 5 + incorrect * -2;
    const attemptId = `${user.uid}_${TESTING_MODE ? Date.now() : todayStr}`;

    await setDoc(doc(db, "dailyQuizAttempts", attemptId), {
      uid: user.uid,
      name: user.displayName || "Anonymous",
      email: user.email,
      score,
      total: questions.length,
      answers,
      correct,
      incorrect,
      notAttempted,
      date: todayStr,
      createdAt: serverTimestamp(),
    });

    exitFullscreen();
    setResult({ correct, incorrect, notAttempted, total: questions.length, score, review });
    setStarted(false);
    setAnswers({});
    if (!TESTING_MODE) setHasAttempted(true);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const COLORS = ["#22c55e", "#ef4444", "#a855f7"];
  const chartData = result
    ? [
        { name: "Correct", value: result.correct },
        { name: "Incorrect", value: result.incorrect },
        { name: "Not Attempted", value: result.notAttempted },
      ]
    : [];

  // 🧠 Start handler with atomic attempts decrement (when not testing)
  const confirmAndStart = async () => {
    if (!user) return alert("Login required.");
    if (!isActive) return alert("Test is currently inactive.");
    if (!acceptedTerms) return;

    setPlanMsg("");

    if (TESTING_MODE) {
      // Skip attempts logic
      setConfirmPopup(false);
      setStarted(true);
      requestFullscreen();
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error("User profile missing.");
        const data = snap.data();
        const plan = (data.plan || "lakshay").toLowerCase();
        const left = typeof data.attemptsLeft === "number" ? data.attemptsLeft : 0;

        if (left <= 0) {
          throw new Error(
            `No attempts left. Your plan: ${plan.toUpperCase()}. Please upgrade to continue.`
          );
        }

        tx.update(userRef, { attemptsLeft: left - 1 });
      });

      // success — locally reflect the decrement immediately
      setAttemptsLeft((x) => (typeof x === "number" ? Math.max(0, x - 1) : x));
      setConfirmPopup(false);
      setStarted(true);
      requestFullscreen();
    } catch (e) {
      setPlanMsg(e.message || "Could not start the test.");
    }
  };

  const planLimit = userPlan ? PLAN_LIMITS[userPlan] ?? 0 : 0;

  return (
    <div ref={quizRef} className="relative min-h-screen overflow-hidden text-white">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Branding + Plan/Attempts */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-4">
        <div className="text-2xl font-extrabold text-cyan-400">Satyapath</div>
        <div className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/20">
          {TESTING_MODE ? "TESTING MODE" : "LIVE"}
        </div>
      </div>
      <div className="absolute top-4 right-6 z-20 text-right">
        {!loadingPlan && userPlan && (
          <>
            <div className="text-sm text-cyan-300">
              Plan:&nbsp;<span className="font-semibold uppercase">{userPlan}</span> &nbsp;|&nbsp; Attempts Left:&nbsp;
              <span className={`font-semibold ${attemptsLeft > 0 ? "text-green-400" : "text-red-400"}`}>
                {attemptsLeft ?? "-"}
              </span>
              {planLimit ? ` / ${planLimit}` : ""}
            </div>
            {planMsg && <div className="text-xs text-red-300 mt-1">{planMsg}</div>}
          </>
        )}
      </div>

      {/* Instructions + Updates */}
      {!started && !result && (
        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-8 mt-20">
          {/* Instructions */}
          <motion.div
            className="bg-black/80 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-lg text-left"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-extrabold mb-6 text-white">
              Examination Protocol
            </h1>
            <ul className="space-y-3 text-gray-200 text-lg leading-relaxed">
              <li>✔ Duration auto-calculated (1/3 of total questions).</li>
              <li>⚡ Fullscreen enforced during test.</li>
              <li>⚠️ Exit fullscreen twice = termination.</li>
              <li>⛔ Switching tabs = termination.</li>
              <li>📊 +5 Correct, -2 Wrong, 0 Not Attempted.</li>
            </ul>

            {/* Plan Attempts Info */}
            <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-sm">
              <p className="font-semibold text-cyan-300 mb-2">Plan Attempts</p>
              <ul className="text-gray-200 space-y-1">
                <li>• Lakshay: 1 test</li>
                <li>• Safalta: 20 tests</li>
                <li>• Shikhar: 150 tests</li>
                <li>• Samarpan: 365 tests</li>
              </ul>
              {!loadingPlan && user && (
                <p className="mt-3 text-gray-300">
                  Your plan: <span className="font-semibold uppercase">{userPlan || "-"}</span> &nbsp;|&nbsp; Attempts left today:&nbsp;
                  <span className={`font-semibold ${attemptsLeft > 0 ? "text-green-400" : "text-red-400"}`}>
                    {attemptsLeft ?? "-"}
                  </span>
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="mt-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-5 h-5 accent-cyan-500"
              />
              <label htmlFor="terms" className="text-gray-100">
                Accept Terms & Conditions
              </label>
            </div>

            {/* Start Button */}
            <button
              disabled={
                !isActive ||
                !acceptedTerms ||
                (!TESTING_MODE && (loadingPlan || attemptsLeft <= 0)) ||
                (!TESTING_MODE && hasAttempted)
              }
              onClick={() => setConfirmPopup(true)}
              className={`mt-8 w-full py-3 rounded-xl font-bold text-lg transition-all duration-300
                ${
                  isActive &&
                  acceptedTerms &&
                  (TESTING_MODE || (!loadingPlan && attemptsLeft > 0 && !hasAttempted))
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white hover:scale-105"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
            >
              {!isActive
                ? "Test Not Active"
                : !acceptedTerms
                ? "Accept Terms to Start"
                : !TESTING_MODE && hasAttempted
                ? "Already Attempted Today"
                : !TESTING_MODE && (loadingPlan || attemptsLeft <= 0)
                ? "No Attempts Left"
                : "Start Test"}
            </button>
          </motion.div>

          {/* Updates */}
          <div className="bg-black/70 rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">📅 Your Daily Updates</h2>
            {updates.length === 0 ? (
              <p className="text-gray-400">No attempts yet.</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {updates.map((u, i) => (
                  <li
                    key={i}
                    className="flex justify-between px-4 py-2 bg-gray-800/60 rounded-lg border border-gray-700"
                  >
                    <span>{u.date}</span>
                    <span className="font-bold text-yellow-400">{u.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Confirm Start */}
      {confirmPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl text-center shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">
              Ready to Begin?
            </h2>

            {/* Attempts in modal */}
            {!TESTING_MODE && (
              <div className="text-sm text-gray-200 mb-4">
                Attempts left:{" "}
                <span className={`font-semibold ${attemptsLeft > 0 ? "text-green-400" : "text-red-400"}`}>
                  {attemptsLeft ?? "-"}
                </span>{" "}
                / {planLimit || "-"} (Plan: {userPlan?.toUpperCase()})
              </div>
            )}

            {planMsg && <div className="text-xs text-red-300 mb-3">{planMsg}</div>}

            <div className="flex gap-4 justify-center">
              <button
                onClick={confirmAndStart}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                disabled={!isActive || (!TESTING_MODE && (attemptsLeft <= 0 || loadingPlan))}
              >
                {TESTING_MODE ? "Start (Testing Mode)" : "Yes, Start"}
              </button>
              <button
                onClick={() => setConfirmPopup(false)}
                className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Warning for fullscreen exit once */}
      {warning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl text-center shadow-xl max-w-md">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ Fullscreen Violation</h2>
            <p className="text-gray-300 mb-6">You exited fullscreen. This is your only warning.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setWarning(false);
                  if (!document.fullscreenElement) requestFullscreen();
                }}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Test
              </button>
              <button
                onClick={() => terminateTest("Test ended by candidate.")}
                className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                End Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Panel */}
      {started && !warning && (
        <div className="relative z-10 max-w-6xl mx-auto mt-10">
          <motion.div className="bg-white/90 text-black rounded-2xl p-8 shadow-xl border border-gray-300">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-cyan-600">🚀 Daily Quiz</h1>
              <div className="text-2xl font-bold text-yellow-600">⏳ {formatTime(timeLeft)}</div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-3">
              <table className="w-full border-collapse text-lg">
                <thead>
                  <tr className="text-xl font-bold text-cyan-600 bg-gray-200">
                    <th className="border border-gray-300 p-3 text-left">Q. No</th>
                    <th className="border border-gray-300 p-3 text-left">Question</th>
                    <th className="border border-gray-300 p-3 text-left">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={idx} className="hover:bg-gray-100">
                      <td className="border border-gray-300 p-3 font-semibold">Q{idx + 1}</td>
                      <td className="border border-gray-300 p-3">{q.text}</td>
                      <td className="border border-gray-300 p-3">
                        <div className="space-y-2">
                          {q.options.map((opt, i) => (
                            <label key={i} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`q-${idx}`}
                                value={opt}
                                onChange={(e) =>
                                  setAnswers((p) => ({ ...p, [idx]: e.target.value }))
                                }
                                className="w-5 h-5"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <motion.button
              onClick={handleSubmit}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 font-bold text-black shadow-lg text-xl"
            >
              Submit Examination
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-y-auto p-6">
          <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl max-w-4xl w-full">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">🎉 Test Completed</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chart */}
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="mt-4 text-center text-lg text-yellow-400">
                  Final Score: {result.score}
                </p>
              </div>

              {/* Review */}
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {result.review.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      r.isCorrect
                        ? "bg-green-800/40 border border-green-600"
                        : "bg-red-800/30 border border-red-600"
                    }`}
                  >
                    <p className="font-semibold mb-2">
                      Q{i + 1}. {r.question}
                    </p>
                    <p>
                      Your Answer:{" "}
                      <span className={r.isCorrect ? "text-green-400" : "text-red-400"}>
                        {r.userAnswer}
                      </span>
                    </p>
                    {!r.isCorrect && (
                      <p>
                        Correct Answer:{" "}
                        <span className="text-green-400 font-semibold">{r.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold shadow-lg block mx-auto"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
