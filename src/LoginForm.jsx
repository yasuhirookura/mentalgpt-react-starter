// src/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
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

// ✅ persistence 設定＆初回復元を確定（firebase.js側を待つ）
await authReady;

// ✅ ログイン
const cred = await signInWithEmailAndPassword(auth, email, pw);
console.log("[Login] success uid=", cred?.user?.uid);

// ✅ iOS Safari 対策：トークン確定を待つ
try {
await cred.user.getIdToken(true);
} catch {}

// ✅ 「Authが確実に user になった」ことを1回確認してから遷移
await waitForUserSettled(2000);

// 行き先を決める（URL ?next=、localStorage、なければ /dashboard）
const params = new URLSearchParams(window.location.search);
const fromQuery = params.get("next");
const fromStorage = localStorage.getItem("mgpt_return_to");

const next =
(fromQuery && safePath(fromQuery)) ||
(fromStorage && safePath(fromStorage)) ||
"/dashboard";

localStorage.removeItem("mgpt_return_to");

// ✅ ここはまず「確実に動く」優先（白画面回避）
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

// ✅ iOSの「一瞬null」揺れ対策：最大timeoutMsだけ user を待つ
function waitForUserSettled(timeoutMs = 2000) {
return new Promise((resolve) => {
if (auth.currentUser) return resolve();

const t = setTimeout(() => {
unsub?.();
resolve();
}, timeoutMs);

const unsub = onAuthStateChanged(auth, (u) => {
if (u) {
clearTimeout(t);
unsub();
resolve();
}
});
});
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