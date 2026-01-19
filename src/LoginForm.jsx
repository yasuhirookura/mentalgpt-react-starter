// src/LoginForm.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, authReady } from "./firebase"; // LoginForm.jsx と firebase.js が同じ階層ならこれ

import "./LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMsg("");

    try {
      // iPhone/Safari 含む初期化待ち
      await authReady;

      // email は trim、password は trim しない（意図的な空白の可能性があるため）
      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // ✅ ここで明示的に遷移（onAuthStateChanged任せにしない）
      setMsg("ログインしました。移動します…");
      navigate("/dashboard", { replace: true }); // ←あなたの実ルートに合わせて変更OK
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential") {
        setError("メールアドレスまたはパスワードが一致しません。念のためパスワード再設定もお試しください。");
      } else if (code === "auth/too-many-requests") {
        setError("試行回数が多すぎます。しばらく待ってから再度お試しください。");
      } else {
        setError(err?.message || "ログインに失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <span className="muted">あなたの心にやさしく寄り添う、AIメンタルサポート。</span>
          <div>
            <span className="brand-strong">ログイン</span>
            <span className="beta">β版</span>
          </div>
        </div>

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
                aria-label="toggle password visibility"
              >
                {showPw ? "非表示" : "表示"}
              </button>
            </div>
          </label>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? "ログイン中…" : "ログイン"}
          </button>

          {error && <div className="alert">{error}</div>}
          {msg && <div className="alert" style={{ background: "#ecfeff", borderColor: "#67e8f9", color: "#155e75" }}>{msg}</div>}

          <div className="reset-link">
            <a href="/reset">パスワードをお忘れですか？（再設定メール）</a>
          </div>
        </form>
      </div>
    </div>
  );
}