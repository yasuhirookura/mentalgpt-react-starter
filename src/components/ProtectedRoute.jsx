// src/components/ProtectedRoute.jsx
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  // ✅ 復帰直後の「一瞬null」を吸収する猶予（ms）
  const GRACE_MS = 1500;
  const timerRef = useRef(null);

  useEffect(() => {
    let unsub = null;
    let mounted = true;

    (async () => {
      await authReady;

      unsub = onAuthStateChanged(auth, (u) => {
        if (!mounted) return;

        // 1) user が取れたら即OK
        if (u) {
          if (timerRef.current) clearTimeout(timerRef.current);
          setUser(u);
          setChecking(false);
          return;
        }

        // 2) null のときは「すぐログインへ飛ばさず」少し待つ
        setChecking(true);
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          if (!mounted) return;
          setUser(null);
          setChecking(false);
        }, GRACE_MS);
      });
    })();

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (unsub) unsub();
    };
  }, []);

  if (checking) {
    return (
      <div style={{ textAlign: "center", paddingTop: 120, fontSize: 16 }}>
        🔄 読み込み中…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}