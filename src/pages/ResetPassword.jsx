// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("パスワードリセット用のメールを送信しました。メールをご確認ください。");
    } catch (err) {
      setError("メールアドレスが登録されていないか、無効です。");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", textAlign: "center" }}>
      <h2>パスワードをリセット</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="登録したメールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          リセットメールを送信
        </button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ResetPassword;