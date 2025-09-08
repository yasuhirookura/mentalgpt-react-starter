// src/LoginForm.jsx
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
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

  // --- ログイン/新規登録 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMsg();
    console.log("[Login] handleSubmit start", { email, hasPw: !!password });

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
        console.log("[Signup] success", cred?.user?.uid);

        if (cred.user && !cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setMsg("確認メールを送信しました。受信箱をご確認ください。");
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log("[Login] success", cred?.user?.uid);

        if (cred.user && !cred.user.emailVerified) {
          setMsg("メールアドレスが未確認です。確認メールを再送します。");
          try {
            await sendEmailVerification(cred.user);
          } catch {}
        }
      }
    } catch (e) {
      console.error("[Auth error]", e);
      setMsg(`${e.code || "error"}: ${e.message || "処理に失敗しました。"}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Googleログイン ---
  const handleGoogle = async () => {
    resetMsg();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      console.log("[Google] success", cred?.user?.uid);
    } catch (e) {
      console.error("[Google error]", e);
      setMsg(`${e.code || "error"}: ${e.message || "Googleログインに失敗しました。"}`);
    } finally {
      setLoading(false);
    }
  };

  // --- パスワード再設定 ---
  const handleResetPw = async () => {
    resetMsg();
    if (!email) {
      setMsg("パスワード再設定にはメールアドレスを入力してください。");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMsg("パスワード再設定メールを送信しました。受信箱をご確認ください。");
    } catch (e) {
      console.error("[ResetPw error]", e);
      setMsg(`${e.code || "error"}: ${e.message || "パスワード再設定に失敗しました。"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="brand">
          <span className="muted">あなたの心にやさしく寄り添う</span>
          <br />
          <span className="brand-strong">MentalGPT</span>
          <span className="muted"> powered by ChatGPT</span>
          <span className="beta"> β版</span>
        </h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            メールアドレス
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

          <label>
            パスワード
            <div className="pw-row">
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
                className="ghost"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? "隠す" : "表示"}
              </button>
            </div>
          </label>

          {mode === "signup" && (
            <label>
              パスワード（確認）
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

          {msg && <div className="alert">{msg}</div>}

          <button type="submit" disabled={loading} className="primary">
            {loading ? "処理中…" : mode === "signup" ? "登録する" : "ログイン"}
          </button>

          <button
            type="button"
            disabled={loading}
            className="outline"
            onClick={handleGoogle}
          >
            Googleでログイン
          </button>

          {/* ▼ パスワード再設定 */}
          <div className="switch-row">
            <button type="button" className="link" onClick={handleResetPw} disabled={loading}>
              パスワードを忘れた方はこちら
            </button>
          </div>

          <div className="switch-row">
            {mode === "signup" ? (
              <>
                すでにアカウントをお持ちですか？{" "}
                <button type="button" className="link" onClick={() => setMode("login")}>
                  ログインへ
                </button>
              </>
            ) : (
              <>
                はじめての方は{" "}
                <button type="button" className="link" onClick={() => setMode("signup")}>
                  新規登録
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}