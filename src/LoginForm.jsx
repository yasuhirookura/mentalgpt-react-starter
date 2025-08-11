// src/LoginForm.js
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true: ログイン / false: 新規登録

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログイン成功！");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("登録成功！");
      }
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Googleログイン成功！");
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>{isLogin ? "ログイン" : "新規登録"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>
        <button type="submit">{isLogin ? "ログイン" : "登録"}</button>
      </form>
      <button onClick={handleGoogleLogin}>Googleでログイン</button><br/>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "新規登録はこちら" : "ログインはこちら"}
      </button>
    </div>
  );
};

export default LoginForm;