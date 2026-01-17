// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { auth, authReady, db } from "../firebase";

export default function Archive() {
const [uid, setUid] = useState("");
const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");
const [rows, setRows] = useState([]);
const [openDay, setOpenDay] = useState("");

// 認証の確定を待って uid を持つ
useEffect(() => {
let alive = true;

(async () => {
try {
await authReady;
const unsub = onAuthStateChanged(auth, (u) => {
if (!alive) return;
setUid(u ? u.uid : "");
});
return () => unsub();
} catch (e) {
if (!alive) return;
setErr(String(e?.message || e));
}
})();

return () => {
alive = false;
};
}, []);

// uid が取れたら Firestore から取得
useEffect(() => {
let alive = true;
if (!uid) {
setLoading(false);
return;
}

(async () => {
setLoading(true);
setErr("");
try {
const q = query(
collection(db, "conversations"),
where("uid", "==", uid),
orderBy("createdAt", "desc"),
limit(400)
);
const snap = await getDocs(q);
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
if (!alive) return;
setRows(list);
// デフォルトで最新日を開く
const firstDay = list.length ? dayKey(list[0].createdAt) : "";
setOpenDay(firstDay);
} catch (e) {
if (!alive) return;
setErr(String(e?.message || e));
} finally {
if (!alive) return;
setLoading(false);
}
})();

return () => {
alive = false;
};
}, [uid]);

const grouped = useMemo(() => {
const map = new Map();
for (const r of rows) {
const dk = dayKey(r.createdAt);
if (!map.has(dk)) map.set(dk, []);
map.get(dk).push(r);
}
return Array.from(map.entries()); // [[day, items], ...] createdAt desc なので day も概ねdesc
}, [rows]);

if (!uid) {
return (
<main className="container" style={{ maxWidth: 820 }}>
<header style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
<h1 style={{ margin: 0 }}>アーカイブ</h1>
<span style={{ marginLeft: "auto" }}>
<Link to="/dashboard">投稿</Link> / <Link to="/mypage">マイページ</Link>
</span>
</header>
<p style={{ color: "#666" }}>ログインしてください。</p>
</main>
);
}

return (
<main className="container" style={{ maxWidth: 980 }}>
<header style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
<h1 style={{ margin: 0 }}>アーカイブ</h1>
<span style={{ marginLeft: "auto" }}>
<Link to="/dashboard">投稿</Link> / <Link to="/mypage">マイページ</Link>
</span>
</header>

{loading && <p>読み込み中…</p>}
{err && (
<p style={{ color: "#c00", whiteSpace: "pre-wrap" }}>
エラー: {err}
</p>
)}

{!loading && !err && grouped.length === 0 && (
<p style={{ color: "#666" }}>履歴がまだありません。</p>
)}

<div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, marginTop: 12 }}>
{/* 左：日付一覧 */}
<aside
style={{
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 10,
background: "#fff",
height: "70vh",
overflowY: "auto",
}}
>
{grouped.map(([day, items]) => (
<button
key={day}
onClick={() => setOpenDay(day)}
style={{
width: "100%",
textAlign: "left",
padding: "10px 10px",
borderRadius: 10,
border: "1px solid #e5e7eb",
marginBottom: 8,
background: openDay === day ? "#e7f1ff" : "#fff",
cursor: "pointer",
}}
>
<div style={{ fontWeight: 700 }}>{formatDay(day)}</div>
<div style={{ fontSize: 12, color: "#666" }}>{items.length}件</div>
</button>
))}
</aside>

{/* 右：その日の会話 */}
<section
style={{
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 12,
background: "#fff",
height: "70vh",
overflowY: "auto",
}}
>
<h2 style={{ marginTop: 0 }}>{openDay ? formatDay(openDay) : "—"}</h2>

{(grouped.find(([d]) => d === openDay)?.[1] || [])
.slice()
.reverse() // その日の中では古い→新しい順で表示
.map((m) => (
<Bubble key={m.id} role={m.role} content={m.content || m.userMessage || ""} createdAt={m.createdAt} />
))}
</section>
</div>
</main>
);
}

function Bubble({ role, content, createdAt }) {
const isUser = role === "user";
const label = isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム";
return (
<div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "10px 0" }}>
<div
style={{
background: role === "ai" ? "#f6f6f6" : isUser ? "#e7f1ff" : "#fff6e6",
border: "1px solid #e5e7eb",
padding: "10px 12px",
borderRadius: 12,
maxWidth: "85%",
lineHeight: 1.8,
whiteSpace: "pre-wrap",
wordBreak: "break-word",
}}
>
<div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
{label} ・ {formatTime(createdAt)}
</div>
<div>{content}</div>
</div>
</div>
);
}

// createdAt が Timestamp / string / Date のどれでも日付キーを作る
function dayKey(createdAt) {
try {
const d = toDate(createdAt);
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${dd}`;
} catch {
return "unknown";
}
}

function toDate(v) {
if (!v) return new Date(0);
if (v instanceof Date) return v;
if (typeof v === "string") return new Date(v);
// Firestore Timestamp っぽい
if (typeof v.toDate === "function") return v.toDate();
if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
return new Date(v);
}

function formatDay(day) {
if (!day || day === "unknown") return "不明";
return day.replace(/-/g, "/");
}

function formatTime(createdAt) {
try {
return toDate(createdAt).toLocaleString("ja-JP");
} catch {
return "";
}
}