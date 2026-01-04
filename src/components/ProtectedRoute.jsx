// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = 判定中
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u); // u は user or null
    });
    return () => unsub();
  }, []);

  // 🔄 判定中（Auth復元待ち）
  if (user === undefined) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "#64748b" }}>確認中です…</p>
      </div>
    );
  }

  // 🚫 未ログイン
  if (!user) {
    const returnTo = location.pathname + location.search;
    localStorage.setItem("mgpt_return_to", returnTo);

    return <Navigate to={`/login?next=${encodeURIComponent(returnTo)}`} replace />;
  }

  // ✅ ログイン済み
  return children;
}
