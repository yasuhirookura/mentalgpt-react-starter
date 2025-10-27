// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Header() {
  const navigate = useNavigate();

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // ログアウト後トップページへ
    } catch (error) {
      console.error("ログアウト失敗:", error);
      alert("ログアウトに失敗しました。");
    }
  };

  // 現在ログイン中かを判定
  const isLoggedIn = !!auth.currentUser;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <strong>MentalGPT</strong>
          <span className="beta">β版</span>
        </Link>

        <nav className="nav-links">
          <Link to="/about">About</Link>
          <Link to="/pricing">料金</Link>
          <Link to="/faq">FAQ</Link>

          {/* 📩 お問合せリンク */}
          <a href="mailto:info@okulab.com" style={{ color: "#0a6cff" }}>
            お問合せ
          </a>

          {/* 🔐 ログイン ⇄ ログアウト */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="link"
              style={{
                background: "none",
                border: "none",
                color: "#0a6cff",
                cursor: "pointer",
              }}
            >
              ログアウト
            </button>
          ) : (
            <Link to="/login">ログイン</Link>
          )}
        </nav>
      </div>
    </header>
  );
}