// src/pages/Welcome.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from "firebase/auth";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (e) {
      console.error(e);
      setError("メール送信に失敗しました。メールアドレスをご確認ください。");
    }
  };

  return (
    <main className="container">
      <h1>ようこそ！</h1>
      <p>登録されたメールアドレスにパスワード設定用リンクをお送りします。</p>

      {sent ? (
        <p>送信しました。メールをご確認ください。</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレスを入力"
          />
          <button onClick={handleSend}>メールを送信</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </main>
  );
}