// src/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, authReady } from "./firebase"; // ←同じ階層ならこれ

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authReady; // ← 重要：初期化（特にiPhone/Safariで効く）
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err?.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>ログイン</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "ログイン中…" : "ログイン"}
        </button>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </main>
  );
}