// src/components/SiteFooter.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function SiteFooter() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.assign("/"); // ログアウト後トップへ
    } catch (err) {
      console.error("signOut error", err);
      alert("ログアウトに失敗しました。");
    }
  };

  const mailTo = `mailto:info@okulab.com?subject=${encodeURIComponent(
    "【MentalGPT】お問い合わせ"
  )}&body=${encodeURIComponent(
    お手数ですが、以下をご記入ください。\n・ご利用のメールアドレス：${user?.email || ""}\n・内容：
  )}`;

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
          <a href={mailTo}>お問い合わせ</a>
          {user ? (
            <a href="/logout" onClick={handleLogout}>
              ログアウト
            </a>
          ) : (
            <Link to="/login">ログイン</Link>
          )}
        </nav>

        <p className="org">
          運営：ベースボール（個人事業主） /{" "}
          <a href="https://okulab.com/">Okulab</a>
        </p>

        <p className="copy">
          © 2025 MentalGPT / Okulab / baseball
          <br />
          ※ MentalGPT は医療・診断・治療の代替となるものではありません。
          <br />
          必要に応じて専門の医師やカウンセラーへご相談ください。
          <br />
          <br />
          “ChatGPT” は OpenAI の商標です。AI応答には OpenAI の API（ChatGPT）を利用しています。
        </p>
      </div>
    </footer>
  );
}