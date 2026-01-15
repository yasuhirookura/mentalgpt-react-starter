// src/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, authReady } from "./firebase";
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

// ✅ 起動直後の「一瞬null」対策：まず Auth 初期化（persistence含む）を確定
await authReady;

// ✅ ログイン
const cred = await signInWithEmailAndPassword(auth, email, pw);
console.log("[Login] success uid=", cred?.user?.uid);

// ✅ ログイン直後にトークンが発行されるまで少し待つ（iOS Safariの揺れ対策）
try {
await cred.user.getIdToken(true);
} catch {}

// 行き先を決める（URL ?next=、localStorage、なければ /dashboard）
const params = new URLSearchParams(window.location.search);
const fromQuery = params.get("next");
const fromStorage = localStorage.getItem("mgpt_return_to");
const next =
(fromQuery && safePath(fromQuery)) ||
(fromStorage && safePath(fromStorage)) ||
"/dashboard";

// 一度使ったら掃除
localStorage.removeItem("mgpt_return_to");

// ✅ SPA遷移でOK（window.location.assignだと再ロードでnull瞬間を踏みやすい）
window.history.replaceState({}, "", next);
window.dispatchEvent(new PopStateEvent("popstate"));
// react-router が popstate を拾わない構成のとき用の保険
window.location.replace(next);
} catch (e2) {
console.error("[Login] error", e2);
setMsg(`${e2.code || "error"}: ${e2.message || e2.toString()}`);
} finally {
setLoading(false);
}
};

// 外部URL等への遷移を防ぐ簡易ガード
function safePath(p) {
try {
if (!p || typeof p !== "string") return null;
if (!p.startsWith("/")) return null;
if (p.startsWith("/login")) return null;
return p;
} catch {
return null;
}
}

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