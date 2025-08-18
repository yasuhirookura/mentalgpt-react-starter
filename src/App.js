// src/App.js
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Dashboard from "./Dashboard";
import LoginForm from "./LoginForm";

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // onAuthStateChanged が返ってこない・失敗する時の保険（5秒で解除）
    const safetyTimer = setTimeout(() => {
      setInitializing(false);
      console.warn("Auth init timed out -> showing login form");
    }, 5000);

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u || null);
        setInitializing(false);
        clearTimeout(safetyTimer);
      },
      (err) => {
        console.error("Auth init error:", err);
        setInitializing(false);
        clearTimeout(safetyTimer);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  if (initializing) return <div style={{ padding: 24 }}>読み込み中…</div>;
  return user ? <Dashboard user={user} /> : <LoginForm />;
}
