// src/App.js
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// デフォルト輸出をデフォルト import（波かっこなし）
import Dashboard from "./Dashboard";
// こちらもデフォルト輸出前提（あなたの LoginForm.jsx が export default なら波かっこなし）
import LoginForm from "./LoginForm";

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <div style={{ padding: 24 }}>読み込み中…</div>;

  return user ? <Dashboard user={user} /> : <LoginForm />;
}

export default App;
