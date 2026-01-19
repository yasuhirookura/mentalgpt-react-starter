// src/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, authReady } from "./firebase"; // ← 同じ階層でOK

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("[Login] submit clicked");
    console.log("[Login] email =", email);

    setLoading(true);
    setError("");

    try {
      console.log("[Login] waiting authReady...");
      await authReady; // ← Safari / iOS 対策の要
      console.log("[Login] authReady resolved");

      console.log("[Login] try signInWithEmailAndPassword");
      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log("[Login] signIn success", result.user?.uid);
    } catch (err) {
      console.error("[Login] signIn error", err);
      setError(err?.message || "ログインに失敗しました");
    } finally {
      console.log("[Login] finished");
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

        {error && (
          <p style={{ color: "crimson", marginTop: 8 }}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}