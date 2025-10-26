// src/pages/Welcome.jsx
import React, { useState } from "react";
import { auth } from "../firebase";
import {
fetchSignInMethodsForEmail,
sendPasswordResetEmail,
} from "firebase/auth";

/**
* Gmail系だけ比較用にゆるやか正規化（. と +以降を無視）
* ※送信自体はユーザー入力のまま行います（表示と送達を優先）。
*/
function canonicalEmailForCompare(email) {
const e = (email || "").trim().toLowerCase();
const [local, domain] = e.split("@");
if (domain === "gmail.com" || domain === "googlemail.com") {
const noPlus = (local || "").split("+")[0];
const noDots = noPlus.replace(/\./g, "");
return `${noDots}@gmail.com`;
}
return e;
}

export default function Welcome() {
const [email, setEmail] = useState("");
const [sent, setSent] = useState(false);
const [msg, setMsg] = useState("");
const [loading, setLoading] = useState(false);

const handleSend = async (e) => {
e?.preventDefault?.();
setMsg("");

const raw = email.trim();
if (!raw) {
setMsg("メールアドレスを入力してください。");
return;
}

try {
setLoading(true);

// 1) 既存ユーザーか事前チェック（重複作成を防ぐ）
const methods = await fetchSignInMethodsForEmail(
auth,
canonicalEmailForCompare(raw)
);

if (methods.length === 0) {
setMsg(
"このメールアドレスの登録が見つかりません。お申し込みがまだの方は「料金を見る」からプランを選択してください。"
);
return;
}

// 2) 既存ユーザーならパスワード設定/再設定メールを送る
await sendPasswordResetEmail(auth, raw, {
url: `${window.location.origin}/login`,
handleCodeInApp: false,
});

setSent(true);
setMsg(
"パスワード設定用のメールを送信しました。メール内のリンクから設定を完了し、ログインしてください。"
);
} catch (err) {
console.error("[Welcome] send reset failed:", err);
setMsg(
`エラー: ${
err?.code === "auth/invalid-email"
? "メールアドレスの形式が正しくありません。"
: err?.message || String(err)
}`
);
} finally {
setLoading(false);
}
};

return (
<main className="auth-wrap">
<div className="auth-card">
<h1 className="brand">
<span className="muted">ようこそ</span>
<br />
<span className="brand-strong">MentalGPT</span>
<span className="beta"> β版</span>
</h1>

{sent ? (
<>
<p style={{ marginBottom: 12 }}>
送信しました。メールをご確認ください（数分かかる場合があります）。
</p>
{msg && <div className="alert">{msg}</div>}
<p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
※ メールが見つからない場合は、
<br />
・迷惑メールフォルダを確認
<br />
・受信設定で
<code style={{ padding: "0 4px" }}>no-reply@…</code> を許可
<br />
・入力したメールアドレスに誤りがないか再確認
</p>
</>
) : (
<form className="auth-form" onSubmit={handleSend}>
<p>登録済みのメールアドレスを入力してください。</p>
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

<button className="primary" type="submit" disabled={loading}>
{loading ? "送信中…" : "メールを送信"}
</button>
</form>
)}
</div>
</main>
);
}