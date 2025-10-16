import { useEffect, useState } from "react";

/**
 * Tracks how long the user keeps the website open (in seconds)
 * - Works globally (on any page)
 * - Pauses when tab not visible
 * - Resets at midnight automatically
 * - Persists in localStorage to survive reloads
 */
export default function useDailyActiveTime() {
  const [secondsToday, setSecondsToday] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("activeDate");
    const savedSeconds = parseInt(localStorage.getItem("activeSeconds") || "0", 10);

    if (savedDate === today) {
      setSecondsToday(savedSeconds);
    } else {
      localStorage.setItem("activeDate", today);
      localStorage.setItem("activeSeconds", "0");
    }

    let timerId = null;

    const tick = () => {
      setSecondsToday((prev) => {
        const next = prev + 1;
        localStorage.setItem("activeSeconds", next);
        localStorage.setItem("activeDate", today);
        return next;
      });
    };

    const start = () => {
      if (!timerId) timerId = setInterval(tick, 1000);
    };

    const stop = () => {
      if (timerId) clearInterval(timerId);
      timerId = null;
    };

    // Start when tab visible
    if (document.visibilityState === "visible") start();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Reset at midnight
    const now = new Date();
    const msToMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const resetTimer = setTimeout(() => {
      localStorage.setItem("activeSeconds", "0");
      localStorage.setItem("activeDate", new Date().toDateString());
      setSecondsToday(0);
    }, msToMidnight);

    return () => {
      clearInterval(timerId);
      clearTimeout(resetTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return secondsToday;
}
