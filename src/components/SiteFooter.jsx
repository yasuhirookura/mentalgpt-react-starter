// src/components/SiteFooter.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
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
          <Link to="/login">ログイン</Link>
        </nav>

        <p className="org">
          運営：ベースボール（個人事業主） / <a href="https://okulab.com/">Okulab</a>
        </p>

        <p className="copy">
          © 2025 MentalGPT / Okulab / baseball<br />
          “ChatGPT” は OpenAI の商標です。AI応答には OpenAI の API（ChatGPT）を利用しています。
        </p>
      </div>
    </footer>
  );
}