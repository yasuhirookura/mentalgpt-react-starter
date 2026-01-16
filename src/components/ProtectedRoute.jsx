// src/components/ProtectedRoute.jsx
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking"); // checking | authed | guest
  const nullTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    let unsub = null;

    (async () => {
      // ✅ persistence確定 + 初回復元を待つ
      await authReady;

      // ✅ 以後の揺れ（iOS復帰直後の一瞬null）に耐える
      unsub = onAuthStateChanged(auth, (u) => {
        if (!alive) return;

        // すでにセットした「guest確定タイマー」があれば止める
        if (nullTimer.current) {
          clearTimeout(nullTimer.current);
          nullTimer.current = null;
        }

        if (u) {
          setStatus("authed");
          return;
        }

        // 🔥 ここが肝：nullでも即guestにしない（復帰直後の一瞬null対策）
        nullTimer.current = setTimeout(() => {
          if (!alive) return;
          // まだ null なら guest 確定
          setStatus("guest");
        }, 1200);
      });
    })();

    return () => {
      alive = false;
      if (nullTimer.current) clearTimeout(nullTimer.current);
      if (unsub) unsub();
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
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}