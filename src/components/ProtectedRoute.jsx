// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let unsub = null;

    (async () => {
      // ✅ ここが超重要：Authが確定するまで “判定しない”
      await authReady;

      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u || null);
        setChecked(true);
      });
    })();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // ✅ 判定前はリダイレクトしない（ここで飛ばすと「すぐログイン画面へ」になる）
  if (!checked) {
    return (
      <div style={{ textAlign: "center", paddingTop: 120, fontSize: 16 }}>
        🔄 読み込み中…
      </div>
    );
  }

  // ✅ Auth確定後にユーザーがいなければログインへ
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}