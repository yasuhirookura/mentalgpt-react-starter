import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="footer-nav">
          <Link to="/about">About</Link>
          <Link to="/pricing">料金</Link>
          <Link to="/terms">利用規約</Link>
          <Link to="/privacy">プライバシー</Link>
          <Link to="/legal">特定商取引法</Link>
          <Link to="/login">ログイン</Link>
        </nav>

        <div className="footer-contact">
          <div>運営：ベースボール（個人事業主）/ Okulab</div>
        </div>

        <p className="copy">
          © 2025 MentalGPT / Okulab / baseball<br />
          “ChatGPT” は OpenAI の商標です。AI応答は OpenAI の API（ChatGPT）を利用しています。
        </p>
      </div>
    </footer>
  );
}