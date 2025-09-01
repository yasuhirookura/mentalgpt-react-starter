// src/components/SiteFooter.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label="フッターナビゲーション">
          <ul className="links">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/pricing">料金</Link></li>
            <li><Link to="/terms">利用規約</Link></li>
            <li><Link to="/privacy">プライバシー</Link></li>
            <li><Link to="/legal">特定商取引法</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/login">ログイン</Link></li>
          </ul>
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
  );...