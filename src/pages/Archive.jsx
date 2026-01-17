// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
collection,
query,
where,
orderBy,
getDocs,
limit,
} from "firebase/firestore";
import { auth, authReady, db } from "../firebase";

function toDateKey(ts) {
// ts: Firestore Timestamp or Date or string
try {
const d =
ts?.toDate?.() ? ts.toDate() :
ts instanceof Date ? ts :
typeof ts === "string" ? new Date(ts) :
null;
if (!d || isNaN(d.getTime())) return "unknown";
// 例: 2026-01-18
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${day}`;
} catch {
return "unknown";
}
}

function fmt(ts) {
try {
const d = ts?.toDate?.() ? ts.toDate() : new Date(ts);
return d.toLocaleString("ja-JP");
} catch {
return "";
}
}

export default function Archive() {
const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");
const [items, setItems] = useState([]); // {id, createdAt, userMessage, gptResponse}
const [activeDay, setActiveDay] = useState("");

useEffect(() => {
(async () => {
setLoading(true);
setErr("");
try {
const u = await authReady;
if (!u) {
setItems([]);
setActiveDay("");
return;
}

// ※ where(uid==) + orderBy(createdAt desc) は
// インデックスが要求されることがあります（エラーにリンクが出ます）
const q = query(
collection(db, "conversations"),
where("uid", "==", u.uid),
orderBy("createdAt", "desc"),
limit(500)
);

const snap = await getDocs(q);
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setItems(list);

// 最初は最新日のタブを開く
const firstKey = list.length ? toDateKey(list[0].createdAt) : "";
setActiveDay(firstKey);
} catch (e) {
console.error("[Archive] load error", e);
setErr(e?.message || String(e));
} finally {
setLoading(false);
}
})();
}, []);

const grouped = useMemo(() => {
const map = new Map();
for (const it of items) {
const key = toDateKey(it.createdAt);
if (!map.has(key)) map.set(key, []);
map.get(key).push(it);
}
// Mapを配列に（キー降順）
const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
return { map, keys };
}, [items]);

const activeList = grouped.map.get(activeDay) || [];

return (
<main className="container" style={{ maxWidth: 900 }}>
<header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "10px 0" }}>
<h1 style={{ margin: 0 }}>アーカイブ</h1>
<span style={{ marginLeft: "auto" }}>
<Link to="/dashboard">投稿へ</Link> / <Link to="/mypage">マイページ</Link>
</span>
</header>

{loading && <p>読み込み中…</p>}
{err && (
<div style={{ background: "#fff6e6", border: "1px solid #f3e2b8", padding: 12, borderRadius: 8 }}>
<div style={{ fontWeight: 700, marginBottom: 6 }}>読み込みエラー</div>
<div style={{ whiteSpace: "pre-wrap" }}>{err}</div>
<div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
※ `where(uid==)` + `orderBy(createdAt)` は Firestore のインデックス作成が必要な場合があります。
エラー文に出るリンクから作成してください。
</div>
</div>
)}

{!loading && !err && items.length === 0 && (
<p style={{ color: "#666" }}>
まだ履歴がありません。<Link to="/dashboard">投稿</Link>してみてください。
</p>
)}

{!loading && !err && items.length > 0 && (
<div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}>
{/* 日付一覧 */}
<aside style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, background: "#fff" }}>
<div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>日付</div>
{grouped.keys.map((k) => (
<button
key={k}
onClick={() => setActiveDay(k)}
style={{
width: "100%",
textAlign: "left",
padding: "8px 10px",
marginBottom: 6,
borderRadius: 8,
border: "1px solid #e5e7eb",
background: k === activeDay ? "#e7f1ff" : "#fff",
cursor: "pointer",
}}
>
{k} <span style={{ color: "#666", fontSize: 12 }}>({grouped.map.get(k)?.length || 0})</span>
</button>
))}
</aside>

{/* 会話一覧 */}
<section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
<h2 style={{ marginTop: 0, fontSize: 16 }}>{activeDay || "（日付未選択）"}</h2>

{activeList.map((it) => (
<div key={it.id} style={{ padding: "10px 0", borderTop: "1px solid #f0f0f0" }}>
<div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{fmt(it.createdAt)}</div>

<div style={{ background: "#e7f1ff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, marginBottom: 8 }}>
<div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>あなた</div>
<div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{it.userMessage || ""}</div>
</div>

<div style={{ background: "#f6f6f6", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
<div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>MentalGPT</div>
<div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{it.gptResponse || ""}</div>
</div>
</div>
))}
</section>
</div>
)}
</main>
);
}