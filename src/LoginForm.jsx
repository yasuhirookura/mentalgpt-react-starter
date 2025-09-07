// src/LoginForm.jsx
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";

// 旧 auth.css を LoginForm.css にリネームして読み込む
import "./LoginForm.css";

export default function LoginForm() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const resetMsg = () => setMsg("");

  const handleGoogle = async () => {
    resetMsg();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setMsg(e.message || "Googleログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMsg();

    if (!email || !password) {
      setMsg("メールとパスワードを入力してください。");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        if (password.length < 8) {
          setMsg("パスワードは8文字以上にしてください。");
          return;
        }
        if (password !== password2) {
          setMsg("確認用パスワードが一致しません。");
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // 確認メール送付（メール確認必須の運用）
        if (cred.user && !cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setMsg("確認メールを送信しました。受信箱をご確認ください。");
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user && !cred.user.emailVerified) {
          setMsg("メールアドレスが未確認です。確認メールを再送します。");
          try {
            await sendEmailVerification(cred.user);
          } catch {/* no-op */}
        }
      }
    } catch (e) {
      setMsg(e.message || "処理に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* ヘッダー（サイズ：中／大／小／中） */}
        <div className="auth-headline">
          <p className="tagline">あなたの心にやさしく寄り添う</p>
          <h1 className="brand">
            <span className="brand-strong">MentalGPT</span>
            <span className="brand-sub"> powered by ChatGPT</span>
            <span className="brand-badge">β版</span>
          </h1>
        </div>

        {/* カード（フォーム） */}
        <div className="auth-card">
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="field">
              <span>メールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                onFocus={resetMsg}
              />
            </label>

            <label className="field">
              <span>パスワード</span>
              <div className="pw-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="8文字以上を推奨"
                  onFocus={resetMsg}
                />
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? "隠す" : "表示"}
                </button>
              </div>
              <span className="hint">{mode === "signup" ? "新規登録時は8文字以上を推奨" : "\u00A0"}</span>
            </label>

            {mode === "signup" && (
              <label className="field">
                <span>パスワード（確認）</span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="もう一度入力"
                  onFocus={resetMsg}
                />
              </label>
            )}

            {msg && (
              <div className="alert" role="alert" style={{
                background: "#fff5f5",
                color: "#8a1c1c",
                border: "1px solid #f2c6c6",
                borderRadius: 8,
                padding: "10px 12px"
              }}>
                {msg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn primary">
              {loading ? "処理中…" : mode === "signup" ? "登録する" : "ログイン"}
            </button>

            <button
              type="button"
              disabled={loading}
              className="btn ghost"
              onClick={handleGoogle}
            >
              Googleでログイン
            </button>

            <div className="aux">
              {mode === "signup" ? (
                <>
                  すでにアカウントをお持ちですか？
                  <button
                    type="button"
                    className="link"
                    onClick={() => { setMode("login"); resetMsg(); }}
                  >
                    ログインへ
                  </button>
                </>
              ) : (
                <>
                  はじめての方は
                  <button
                    type="button"
                    className="link"
                    onClick={() => { setMode("signup"); resetMsg(); }}
                  >
                    新規登録
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}