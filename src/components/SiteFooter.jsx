// src/components/SiteFooter.jsx
import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function SiteFooter() {
  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // ログアウト後はトップページへ戻る
      window.location.href = "/";
    } catch (error) {
      console.error("ログアウト失敗:", error);
      alert("ログアウトに失敗しました。");
    }
  };

  // 現在ログイン中かを判定
  const isLoggedIn = !!auth.currentUser;

  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="links" aria-label="フッターナビゲーション">
          <Link to="/about">About</Link>
          <Link to="/pricing">料金</Link>
          <Link to="/terms">利用規約</Link>
          <Link to="/privacy">プライバシー</Link>
          <Link to="/legal">特定商取引法</Link>
          <Link to="/faq">FAQ</Link>

          {/* 📩 お問い合わせリンク（メールアプリを開く） */}
          <a href="mailto:info@okulab.com" style={{ color: "#0a6cff" }}>
            お問合せ
          </a>

          {/* 🔐 ログイン or ログアウト切り替え */}
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

        <p className="org">
          運営：ベースボール（個人事業主） /{" "}
          <a href="https://okulab.com/">Okulab</a>
        </p>

        <p className="copy">
          © 2025-2026 MentalGPT / Okulab / baseball
          <br />
          ※ MentalGPT は医療・診断・治療の代替となるものではありません。<br />
          必要に応じて専門の医師やカウンセラーへご相談ください。<br />
          <br />
          “ChatGPT” は OpenAI の商標です。AI応答には OpenAI の API（ChatGPT）を利用しています。
        </p>
      </div>
    </footer>
  );
}