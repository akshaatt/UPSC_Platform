// src/hooks/useUserPlan.js
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function useUserPlan() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setPlan(null);
      return;
    }
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setPlan(snap.data().plan || "lakshya");
      else setPlan("lakshya");
    });
    return () => unsub();
  }, []);

  return plan; // null if logged out, otherwise "lakshya" | "safalta" | "shikhar" | "samarpan"
}
