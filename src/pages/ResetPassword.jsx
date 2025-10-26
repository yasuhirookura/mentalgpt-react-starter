// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  // かんたんなメール形式チェック（最低限）
  const isEmailLike = (v) => /\S+@\S+\.\S+/.test(v || "");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setOk(false);

    if (!email || !isEmailLike(email)) {
      setMsg("正しいメールアドレスを入力してください。");
      return;
    }

    try {
      setLoading(true);

      // ★ リセット完了後は /login に戻す（Firebase-hosted 画面を使用）
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setOk(true);
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
        <h1 className="brand" style={{ marginBottom: 6 }}>
          <span className="muted">アカウントのパスワード再設定</span>
          <br />
          <span className="brand-strong">Reset your password</span>
        </h1>

        {!ok && (
          <>
            <p>登録メールアドレスを入力すると、再設定用のメールをお送りします。</p>

            <form onSubmit={onSubmit} className="auth-form" noValidate>
              <label>
                メールアドレス
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              {msg && (
                <div className="alert" role="alert" aria-live="polite">
                  {msg}
                </div>
              )}

              <button
                type="submit"
                className="primary"
                disabled={loading}
                style={{ fontSize: 16, height: 48 }}
              >
                {loading ? "送信中…" : "再設定メールを送信"}
              </button>

              <div className="switch-row">
                <Link className="link" to="/login">
                  ログインに戻る
                </Link>
              </div>
            </form>

            <hr style={{ margin: "24px 0" }} />
            <div className="password-rules">
              <h3>🔐 パスワード設定のルール</h3>
              <ul>
                <li>8文字以上で入力してください</li>
                <li>英大文字・英小文字・数字・記号をそれぞれ1文字以上含めてください</li>
                <li>
                  例: <code>Ex@mple123!</code>
                </li>
              </ul>
            </div>
          </>
        )}

        {ok && (
          <div>
            <div
              className="alert"
              style={{
                background: "#ecfdf5",
                borderColor: "#34d399",
                color: "#065f46",
                marginBottom: 16,
              }}
              role="status"
              aria-live="polite"
            >
              {msg}
            </div>

            <Link
              to="/login"
              className="primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontSize: 16,
                height: 48,
                padding: "0 18px",
              }}
            >
              ログイン画面へ戻る
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}