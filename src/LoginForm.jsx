// src/LoginForm.jsx
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import "./auth.css";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // ここでパスワード簡易バリデーション（必要に応じて強化）
        if (password.length < 8) {
          alert("パスワードは8文字以上にしてください。");
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        // 必要なら確認メール送信: import { sendEmailVerification } して呼び出し
        // await sendEmailVerification(auth.currentUser);
      }
    } catch (err) {
      alert(err.message || "エラーが発生しました");
    }
  };

  const onGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      alert(err.message || "Googleログインでエラーが発生しました");
    }
  };

  const onReset = async () => {
    if (!email) return alert("リセット用にメールアドレスを入力してください。");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("パスワード再設定メールを送信しました。");
    } catch (err) {
      alert(err.message || "送信に失敗しました");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-wrapper">
        {/* ヘッダーコピー */}
        <header className="auth-headline">
          <p className="tagline">あなたの心にやさしく寄り添う</p>
          <h1 className="brand">
            <span className="brand-strong">MentalGPT</span>
            <span className="brand-sub"> powered by ChatGPT</span>
            <span className="brand-badge">β版</span>
          </h1>
          <p className="subcopy">より良く進化させていきます。</p>
        </header>

        {/* カード */}
        <section className="auth-card" role="region" aria-label="ログインカード">
          <form onSubmit={onSubmit} className="auth-form">
            <label className="field">
              <span>メールアドレス</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span>パスワード</span>
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上を推奨"
              />
              <small className="hint">英大小字・数字・記号を混ぜると安全です</small>
            </label>

            <button type="submit" className="btn primary">
              {mode === "login" ? "ログイン" : "新規登録"}
            </button>

            <button type="button" className="btn ghost" onClick={onGoogle}>
              Googleでログイン
            </button>

            <div className="aux">
              <button type="button" className="link" onClick={onReset}>
                パスワードをお忘れの方
              </button>
              <span className="sep">／</span>
              {mode === "login" ? (
                <button type="button" className="link" onClick={() => setMode("signup")}>
                  新規登録はこちら
                </button>
              ) : (
                <button type="button" className="link" onClick={() => setMode("login")}>
                  既にアカウントをお持ちの方
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
