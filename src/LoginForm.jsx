// src/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./LoginForm.css";

export default function LoginForm() {
const [email, setEmail] = useState("");
const [pw, setPw] = useState("");
const [msg, setMsg] = useState("");
const [loading, setLoading] = useState(false);

const onSubmit = async (e) => {
e.preventDefault();
setMsg("");

if (!email || !pw) {
setMsg("メールとパスワードを入力してください。");
return;
}

try {
setLoading(true);
await signInWithEmailAndPassword(auth, email, pw);
window.location.replace("/dashboard");
} catch (e2) {
console.error("[Login] error", e2);
setMsg(`${e2.code || "error"}: ${e2.message || e2.toString()}`);
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

<form className="auth-form" onSubmit={onSubmit}>
<label>
メールアドレス
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
autoComplete="email"
placeholder="you@example.com"
/>
</label>

<label>
パスワード
<input
type="password"
value={pw}
onChange={(e) => setPw(e.target.value)}
autoComplete="current-password"
placeholder="********"
/>
</label>

{msg && <div className="alert">{msg}</div>}

<button className="primary" type="submit" disabled={loading}>
{loading ? "処理中…" : "ログイン"}
</button>
</form>

<p className="reset-link">
<a href="/reset-password">パスワードをお忘れですか？</a>
</p>
</div>
</div>
);
}