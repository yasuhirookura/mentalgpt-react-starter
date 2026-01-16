// src/components/ProtectedRoute.jsx
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  // checking | authed | guest
  const [status, setStatus] = useState("checking");

  // iOSの「一瞬null」対策：nullのとき即guestにせず、少し待つ
  const logoutTimerRef = useRef(null);
  const lastUidRef = useRef(""); // 直前にログインしていたuid（デバッグ用にも）

  useEffect(() => {
    let alive = true;

    const clearLogoutTimer = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };

    (async () => {
      // ✅ persistence設定＆初回復元を待つ
      await authReady;
      if (!alive) return;

      // ✅ 初期状態（復元後の currentUser をまず採用）
      const initial = auth.currentUser;
      if (initial) {
        lastUidRef.current = initial.uid || "";
        setStatus("authed");
      } else {
        setStatus("checking"); // すぐ guest にせず、購読で確定させる
      }

      // ✅ 以降の変化を監視（iOSの揺れ対策つき）
      const unsub = onAuthStateChanged(auth, (u) => {
        if (!alive) return;

        if (u) {
          // ログイン状態なら即 authed
          lastUidRef.current = u.uid || "";
          clearLogoutTimer();
          setStatus("authed");
          return;
        }

        // u が null の場合：
        // iOS Safari では “一瞬null” があり得るので、少し待ってから guest にする
        clearLogoutTimer();
        logoutTimerRef.current = setTimeout(() => {
          if (!alive) return;
          // 待った後にも currentUser が復活していなければ guest
          const cur = auth.currentUser;
          if (cur) {
            lastUidRef.current = cur.uid || "";
            setStatus("authed");
          } else {
            setStatus("guest");
          }
        }, 1200); // 0.8〜2秒くらいが現実的。まずは 1.2s 推奨
      });

      // ✅ cleanup
      return () => {
        unsub();
      };
    })();

    return () => {
      alive = false;
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
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