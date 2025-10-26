// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function Account() {
const [user, setUser] = useState(null);
const [summary, setSummary] = useState(null); // サマリ（プラン・請求日 等）
const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");

useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u || null);
setErr("");
setSummary(null);
if (!u) {
setLoading(false);
return;
}
try {
setLoading(true);
const idToken = await u.getIdToken();
const r = await fetch("/api/account-summary", {
headers: { Authorization: `Bearer ${idToken}` },
});
const j = await r.json();
if (!r.ok) throw new Error(j?.error || "failed");
setSummary(j);
} catch (e) {
console.error(e);
setErr("アカウント情報の取得に失敗しました。");
} finally {
setLoading(false);
}
});
return () => unsub();
}, []);

const gotoPortal = async () => {
try {
if (!user) return;
const idToken = await user.getIdToken();
const r = await fetch("/api/create-portal-session", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${idToken}`,
},
body: JSON.stringify({
// 返り先（ポータルから戻るボタン）
return_url: `${window.location.origin}/account`,
}),
});
const j = await r.json();
if (!r.ok || !j?.url) throw new Error(j?.error || "failed");
window.location.assign(j.url);
} catch (e) {
console.error(e);
alert("お支払い管理画面への遷移に失敗しました。時間をおいて再度お試しください。");
}
};

const confirmCancel = async () => {
const ok = window.confirm("本当に解約しますか？\n解約手続きは Stripe の管理画面で完了します。");
if (ok) gotoPortal();
};

const fmtDate = (tsSec) => {
if (!tsSec) return "—";
try {
const d = new Date(tsSec * 1000);
return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(d);
} catch {
return "—";
}
};

return (
<main style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
<h1>マイページ</h1>

{loading && <p>読み込み中…</p>}
{err && <p style={{ color: "crimson" }}>{err}</p>}

{!!user && (
<section style={card}>
<h2 style={h2}>アカウント</h2>
<div style={row}><span>メールアドレス</span><span>{user.email}</span></div>
</section>
)}

{!!summary && (
<section style={card}>
<h2 style={h2}>ご契約プラン</h2>
<div style={row}><span>現在のプラン</span><span>{summary.plan_name || "—"}</span></div>
<div style={row}><span>次回請求日</span><span>{fmtDate(summary.next_invoice_date)}</span></div>

<div style={{ display: "flex", gap: 8, marginTop: 12 }}>
<button className="outline" onClick={gotoPortal}>お支払いを管理</button>
{/* 解約導線（ポータルの「解約」セクションにて実施） */}
<button className="ghost" onClick={confirmCancel}>解約する</button>
</div>
<p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
※「お支払いを管理」「解約する」は Stripe のカスタマーポータルで行います。
</p>
</section>
)}

{!loading && !user && (
<p>ログインしていません。<a href="/login">ログイン</a>してください。</p>
)}
</main>
);
}

const card = {
background: "#fff",
borderRadius: 16,
padding: 16,
boxShadow: "0 12px 28px rgba(2, 6, 23, .06)",
marginTop: 16,
};
const h2 = { margin: "0 0 12px", fontSize: 20 };
const row = {
display: "grid",
gridTemplateColumns: "160px 1fr",
gap: 12,
padding: "8px 0",
borderTop: "1px solid #eef2f7",
};