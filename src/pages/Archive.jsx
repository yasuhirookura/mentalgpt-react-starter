// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
collection,
query,
where,
orderBy,
limit,
getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, authReady } from "../firebase";

const PAGE_SIZE = 300;

export default function Archive() {
const [user, setUser] = useState(null);
const [items, setItems] = useState([]); // 1件 = 1メッセージ
const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");

const [openDay, setOpenDay] = useState(null);

useEffect(() => {
let unsub = () => {};
(async () => {
await authReady;
unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
})();
return () => unsub();
}, []);

useEffect(() => {
if (!user) {
setLoading(false);
return;
}
(async () => {
setLoading(true);
setErr("");
try {
const q = query(
collection(db, "conversations"),
where("uid", "==", user.uid),
orderBy("dayKey", "desc"),
orderBy("createdAt", "desc"),
limit(PAGE_SIZE)
);
const snap = await getDocs(q);
const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setItems(rows);

if (rows.length > 0) {
setOpenDay(rows[0].dayKey || null);
}
} catch (e) {
console.error("[Archive] load error", e);
setErr(e?.message || String(e));
} finally {
setLoading(false);
}
})();
}, [user?.uid]);

const grouped = useMemo(() => {
const map = new Map();
for (const it of items) {
const day = it.dayKey || "unknown";
if (!map.has(day)) map.set(day, []);
map.get(day).push(it);
}
const out = Array.from(map.entries()).map(([dayKey, list]) => ({
dayKey,
list: list
.slice()
.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)), // 古→新
}));
out.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)); // 新しい日→古い日
return out;
}, [items]);

const days = grouped.map((g) => g.dayKey);

if (!user) {
return (
<main className="container" style={{ maxWidth: 820 }}>
<h1>アーカイブ</h1>
<p>
<Link to="/login">ログイン</Link>してください。
</p>
</main>
);
}

return (
<main className="container" style={{ maxWidth: 980 }}>
<header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "10px 0" }}>
<h1 style={{ margin: 0 }}>アーカイブ</h1>
<span style={{ marginLeft: "auto" }}>
<Link to="/dashboard">投稿へ</Link> / <Link to="/mypage">マイページ</Link>
</span>
</header>

{err && (
<div style={{ background: "#fff3f3", border: "1px solid #ffd0d0", padding: 10, borderRadius: 10 }}>
<b>読み込みエラー</b>
<div style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 6 }}>{err}</div>
</div>
)}

<div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
{/* 左：日付 */}
<aside style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
<div style={{ fontWeight: 700, marginBottom: 8 }}>日付</div>

{loading && <div style={{ color: "#666" }}>読み込み中…</div>}
{!loading && days.length === 0 && <div style={{ color: "#888" }}>まだ履歴がありません</div>}

<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
{grouped.map((g) => (
<button
key={g.dayKey}
type="button"
onClick={() => setOpenDay(g.dayKey)}
style={{
textAlign: "left",
border: "1px solid #e5e7eb",
background: openDay === g.dayKey ? "#e7f1ff" : "#fff",
borderRadius: 10,
padding: "8px 10px",
cursor: "pointer",
}}
>
{g.dayKey}（{g.list.length}）
</button>
))}
</div>
</aside>

{/* 右：本文 */}
<section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff", minHeight: "60vh" }}>
{!openDay && <div style={{ color: "#888" }}>左の日付を選ぶと表示されます</div>}

{openDay && (
<>
<div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{openDay}</div>

<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{(grouped.find((g) => g.dayKey === openDay)?.list || []).map((m) => (
<Bubble key={m.id} role={m.role} content={pickContent(m)} createdAt={m.createdAt} />
))}
</div>
</>
)}
</section>
</div>
</main>
);
}

function Bubble({ role, content, createdAt }) {
const isUser = role === "user";
return (
<div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
<div
style={{
background: role === "ai" ? "#f6f6f6" : isUser ? "#e7f1ff" : "#fff6e6",
border: "1px solid #e5e7eb",
padding: "10px 12px",
borderRadius: 12,
maxWidth: "86%",
lineHeight: 1.8,
whiteSpace: "pre-wrap",
wordBreak: "break-word",
}}
>
<div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
{isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム"} ・ {formatTs(createdAt)}
</div>
<div>{content || "(本文なし)"}</div>
</div>
</div>
);
}

function pickContent(m) {
// ✅ Firestore実データの content を最優先
if (typeof m?.content === "string" && m.content.trim()) return m.content;

// 互換：昔の形が混ざってても拾う
if (m?.role === "user" && typeof m?.userMessage === "string") return m.userMessage;
if (m?.role === "ai" && typeof m?.gptResponse === "string") return m.gptResponse;

if (typeof m?.text === "string") return m.text;
if (typeof m?.message === "string") return m.message;

return "";
}

function toMillis(ts) {
if (!ts) return 0;
if (typeof ts.toMillis === "function") return ts.toMillis(); // Firestore Timestamp
const d = new Date(ts);
return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatTs(ts) {
const ms = toMillis(ts);
if (!ms) return "";
return new Date(ms).toLocaleString("ja-JP");
}