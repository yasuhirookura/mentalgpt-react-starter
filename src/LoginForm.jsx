// src/LoginForm.jsx
import React, { useMemo, useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, authReady } from "./firebase";
import "./LoginForm.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");     // 成功/案内メッセージ
  const [error, setError] = useState(""); // エラーメッセージ

  const isEmailLike = useMemo(() => {
    return typeof email === "string" && email.includes("@") && email.includes(".");
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      // iPhone/Safariで初期化・永続化が間に合わない系対策
      await authReady;

      const trimmedEmail = email.trim();
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // 成功時は通常 onAuthStateChanged 側で画面遷移する想定
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential") {
        setError("メールアドレスまたはパスワードが一致しません。念のためパスワード再設定もお試しください。");
      } else if (code === "auth/too-many-requests") {
        setError("試行回数が多すぎます。しばらく待ってから再度お試しください。");
      } else {
        setError(err?.message || "ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      await authReady;

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("パスワード再設定するメールアドレスを入力してください。");
        return;
      }
      await sendPasswordResetEmail(auth, trimmedEmail);
      setMsg("パスワード再設定メールを送信しました。受信ボックスをご確認ください。");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setError("このメールアドレスのユーザーが見つかりませんでした。");
      } else if (code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません。");
      } else {
        setError(err?.message || "再設定メールの送信に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <header className="brand">
        <span className="muted">あなたの心にやさしく寄り添う、AIメンタルサポート。</span>
        <div className="brand-strong">
          ログイン <span className="beta">β版</span>
        </div>
      </header>

      <section className="auth-card">
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            メールアドレス
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            パスワード
            <div className="pw-row">
              <input
                type={showPw ? "text" : "password"}
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPw((v) => !v)}
                aria-label="パスワード表示切替"
              >
                {showPw ? "隠す" : "表示"}
              </button>
            </div>
          </label>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? "ログイン中…" : "ログイン"}
          </button>

          {(error || msg) && (
            <p className="alert" role="alert">
              {error || msg}
            </p>
          )}

          <div className="reset-link">
            <a href="#reset" onClick={handleReset}>
              パスワードをお忘れですか？（再設定メール）
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}