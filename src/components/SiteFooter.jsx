// src/components/SiteFooter.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="footer-nav">
        <Link to="/about">About</Link>
        <Link to="/pricing">料金</Link>
        <Link to="/terms">利用規約</Link>
        <Link to="/privacy">プライバシー</Link>
        <Link to="/legal">特定商取引法</Link>
        <Link to="/login">ログイン</Link>
      </nav>

      <div className="footer-org">
        運営：ベースボール（個人事業主） / <a href="https://okulab.com" target="_blank" rel="noreferrer">Okulab</a>
      </div>

      <div className="footer-copy">
        © 2025 MentalGPT / Okulab / baseball<br />
        ※「ChatGPT」はOpenAIの商標です。AI応答には OpenAI の API（ChatGPT）を利用しています。
      </div>
    </footer>
  );
}