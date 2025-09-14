// src/components/Header.jsx
import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Header({ plan }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login"; // ログアウト後にログイン画面へ
    } catch (e) {
      console.error("ログアウト失敗:", e);
      alert("ログアウトに失敗しました。時間をおいて再度お試しください。");
    }
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
      }}
    >
      {/* 左側ロゴ */}
      <a href="/" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>
        MentalGPT
      </a>

      {/* 右側アクション */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* プランが free または light の場合のみ「アップグレード」表示 */}
        {(plan === "free" || plan === "light") && (
          <a href="/pricing" className="btn secondary" style={{ textDecoration: "none" }}>
            アップグレード
          </a>
        )}
        <button onClick={handleLogout} className="btn">
          ログアウト
        </button>
      </div>
    </header>
  );
}