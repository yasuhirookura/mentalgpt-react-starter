// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase"; // すでに firebase.js で export されている想定

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // パスワード形式チェック用（パスワード再設定フォームにも使える）
  function validatePassword(pw) {
    const errors = [];
    if (!pw || pw.length < 8)
      errors.push("8文字以上で入力してください。");
    if (!/[A-Z]/.test(pw))
      errors.push("英大文字を少なくとも1文字含めてください。");
    if (!/[a-z]/.test(pw))
      errors.push("英小文字を少なくとも1文字含めてください。");
    if (!/[0-9]/.test(pw))
      errors.push("数字を少なくとも1文字含めてください。");
    if (!/[!@#$%^&*()]/.test(pw))
      errors.push("記号（!@#$%^&*() など）を少なくとも1文字含めてください。");
    return errors;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!email) {
      setMsg("メールアドレスを入力してください。");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setMsg("パスワード再設定用メールを送信しました。メールをご確認ください。");
    } catch (e) {
      console.error("[ResetPassword] failed", e);
      setMsg(`エラー: ${e.message || e.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <h1>パスワードをお忘れですか？</h1>
        <p>登録メールアドレスを入力すると、再設定用のメールをお送りします。</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {msg && <div className="alert">{msg}</div>}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? "送信中…" : "再設定メールを送信"}
          </button>
        </form>

        <hr style={{ margin: "24px 0" }} />

        <div className="password-rules">
          <h3>🔐 パスワード設定のルール</h3>
          <ul>
            <li>8文字以上で入力してください</li>
            <li>英大文字・英小文字・数字・記号をそれぞれ1文字以上含めてください</li>
            <li>例: <code>Ex@mple123!</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}