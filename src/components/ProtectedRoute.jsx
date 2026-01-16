// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking"); // checking | authed | guest

  useEffect(() => {
    let alive = true;

    (async () => {
      // ✅ まず persistence 設定＆初回復元を待つ
      await authReady;

      // ✅ その後も iOS の「一瞬null」揺れに耐えるため、購読を維持
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!alive) return;
        setStatus(u ? "authed" : "guest");
      });

      return () => unsub();
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div style={{ textAlign: "center", paddingTop: 120, fontSize: 16 }}>
        🔄 認証を確認中…
      </div>
    );
  }

  if (status === "guest") {
    // 次に戻れるように next を付ける
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}