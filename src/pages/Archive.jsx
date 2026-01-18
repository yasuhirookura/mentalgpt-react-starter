// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
collection,
getDocs,
limit,
orderBy,
query,
where,
} from "firebase/firestore";
import { auth, authReady, db } from "../firebase";

function dayKeyJST(d = new Date()) {
// "YYYY-MM-DD" (Asia/Tokyo)
const s = new Intl.DateTimeFormat("en-CA", {
timeZone: "Asia/Tokyo",
year: "numeric",
month: "2-digit",
day: "2-digit",
}).format(d);
return s; // e.g. 2026-01-17
}

function toJpDateTime(ts) {
try {
const d = ts?.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
} catch {
return "";
}
}

function toJpTime(ts) {
try {
const d = ts?.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleTimeString("ja-JP", {
timeZone: "Asia/Tokyo",
hour: "2-digit",
minute: "2-digit",
});
} catch {
return "";
}
}

function useIsMobile(breakpointPx = 720) {
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
if (typeof window === "undefined") return;

const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`);
const update = () => setIsMobile(!!mql.matches);

update();

// Safari含め互換
if (mql.addEventListener) mql.addEventListener("change", update);
else mql.addListener(update);

return () => {
if (mql.removeEventListener) mql.removeEventListener("change", update);
else mql.removeListener(update);
};
}, [breakpointPx]);

return isMobile;
}

export default function Archive() {
const isMobile = useIsMobile(720);

const [uid, setUid] = useState("");
const [ready, setReady] = useState(false);

// 左：日付一覧（dayKey -> count）
const [days, setDays] = useState([]); // [{dayKey, count}]
const [selectedDay, setSelectedDay] = useState("");

// 右：その日のメッセージ
const [items, setItems] = useState([]); // [{id, role, content, createdAt}]
const [loadingDays, setLoadingDays] = useState(false);
const [loadingItems, setLoadingItems] = useState(false);
const [err, setErr] = useState("");

// 起動：auth確定→uid確定
useEffect(() => {
let unsub = null;
let alive = true;

(async () => {
try {
await authReady;
if (!alive) return;

unsub = onAuthStateChanged(auth, (u) => {
if (!alive) return;
setUid(u?.uid || "");
setReady(true);
});
} catch (e) {
console.error("[Archive] auth init error", e);
setErr("認証の初期化に失敗しました。");
setReady(true);
}
})();

return () => {
alive = false;
if (unsub) unsub();
};
}, []);

// uid確定後：日付一覧を作る（createdAt desc でざっくり取得→日付で集計）
useEffect(() => {
if (!ready) return;
if (!uid) return;

(async () => {
setLoadingDays(true);
setErr("");
try {
const ref = collection(db, "conversations");
const q = query(
ref,
where("uid", "==", uid),
orderBy("createdAt", "desc"),
limit(500)
);

const snap = await getDocs(q);
const map = new Map(); // dayKey -> count
snap.forEach((doc) => {
const data = doc.data() || {};
const dk = data.dayKey || "";
if (!dk) return;
map.set(dk, (map.get(dk) || 0) + 1);
});

const list = Array.from(map.entries())
.map(([dayKey, count]) => ({ dayKey, count }))
.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)); // desc

setDays(list);

// 初期選択：今日があれば今日、なければ最新
const today = dayKeyJST();
const initial =
list.find((x) => x.dayKey === today)?.dayKey ||
list[0]?.dayKey ||
"";
setSelectedDay(initial);
} catch (e) {
console.error("[Archive] load days error", e);
setErr("アーカイブ一覧の取得に失敗しました。");
} finally {
setLoadingDays(false);
}
})();
}, [ready, uid]);

// selectedDay が決まったら、その日の本文を読む
useEffect(() => {
if (!uid) return;
if (!selectedDay) {
setItems([]);
return;
}

(async () => {
setLoadingItems(true);
setErr("");
try {
const ref = collection(db, "conversations");
const q = query(
ref,
where("uid", "==", uid),
where("dayKey", "==", selectedDay),
orderBy("createdAt", "asc"),
limit(300)
);

const snap = await getDocs(q);
const list = [];
snap.forEach((doc) => {
const data = doc.data() || {};
list.push({
id: doc.id,
role: data.role || "system",
content: data.content || "",
createdAt: data.createdAt || "",
});
});
setItems(list);
} catch (e) {
console.error("[Archive] load day items error", e);
setErr("本文の取得に失敗しました（インデックス未作成の可能性もあります）。");
} finally {
setLoadingItems(false);
}
})();
}, [uid, selectedDay]);

const headerRight = useMemo(() => {
return (
<span style={{ marginLeft: "auto", fontSize: 14 }}>
<Link to="/dashboard">投稿へ</Link> / <Link to="/mypage">マイページ</Link>
</span>
);
}, []);

const lastItem = items.length ? items[items.length - 1] : null;
const dayCount = items.length;
const lastTime = lastItem ? toJpTime(lastItem.createdAt) : "—";

if (!ready) {
return (
<div style={{ textAlign: "center", paddingTop: 120 }}>
🔄 読み込み中…
</div>
);
}

return (
<main
className="container"
style={{
maxWidth: 980,
marginTop: 0,
paddingTop: 0,
paddingLeft: isMobile ? 12 : undefined,
paddingRight: isMobile ? 12 : undefined,
}}
>
<header
style={{
display: "flex",
alignItems: "baseline",
gap: 12,
margin: "8px 0 10px",
flexWrap: "wrap",
}}
>
<h1 style={{ margin: 0 }}>アーカイブ</h1>
{headerRight}
</header>

{err && (
<div
style={{
background: "#fff6e6",
border: "1px solid #f2d6a7",
padding: "10px 12px",
borderRadius: 10,
marginBottom: 10,
color: "#7a4b00",
}}
>
{err}
</div>
)}

<div
style={{
display: "grid",
gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
gap: 12,
alignItems: "start",
}}
>
{/* 左：日付一覧 */}
<section
style={{
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 12,
background: "#fff",
}}
>
<div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
日付
</div>

{loadingDays ? (
<div style={{ color: "#666" }}>読み込み中…</div>
) : days.length === 0 ? (
<div style={{ color: "#888" }}>まだ履歴がありません。</div>
) : (
<div
style={{
display: "flex",
flexDirection: isMobile ? "row" : "column",
gap: 8,
flexWrap: isMobile ? "nowrap" : "nowrap",
overflowX: isMobile ? "auto" : "visible",
WebkitOverflowScrolling: "touch",
paddingBottom: isMobile ? 4 : 0,
}}
>
{days.map((d) => {
const active = d.dayKey === selectedDay;
return (
<button
key={d.dayKey}
type="button"
onClick={() => setSelectedDay(d.dayKey)}
style={{
textAlign: "left",
padding: "10px 12px",
borderRadius: 10,
border: "1px solid #e5e7eb",
background: active ? "#e7f1ff" : "#fff",
cursor: "pointer",
fontSize: 14,
whiteSpace: "nowrap",
minWidth: isMobile ? 150 : "auto",
flex: isMobile ? "0 0 auto" : "initial",
}}
>
{d.dayKey}{" "}
<span style={{ color: "#666" }}>({d.count})</span>
</button>
);
})}
</div>
)}
</section>

{/* 右：本文 */}
<section
style={{
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 12,
background: "#fff",
minHeight: isMobile ? "auto" : "55vh",
}}
>
<div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
<h2 style={{ margin: 0, fontSize: 26 }}>{selectedDay || "—"}</h2>
<span style={{ fontSize: 12, color: "#666" }}>
{uid ? `uid: ${uid.slice(0, 8)}…` : ""}
</span>
</div>

{/* ★ 体験が締まる情報 */}
<div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
<div>この日の件数：{dayCount}</div>
<div>最終投稿：{dayCount ? lastTime : "—"}</div>
</div>

<div style={{ marginTop: 10 }}>
{loadingItems ? (
<div style={{ color: "#666" }}>読み込み中…</div>
) : items.length === 0 ? (
<div style={{ color: "#888" }}>この日の履歴はまだありません。</div>
) : (
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{items.map((m) => (
<Bubble
key={m.id}
role={m.role}
content={m.content}
createdAt={m.createdAt}
/>
))}
</div>
)}
</div>
</section>
</div>
</main>
);
}

function Bubble({ role, content, createdAt }) {
const isUser = role === "user";
const label = isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム";

return (
<div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
<div
style={{
background: role === "ai" ? "#f6f6f6" : isUser ? "#e7f1ff" : "#fff6e6",
border: "1px solid #e5e7eb",
padding: "10px 12px",
borderRadius: 12,
maxWidth: "92%",
lineHeight: 1.8,
whiteSpace: "pre-wrap",
wordBreak: "break-word",
}}
>
<div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
{label} ・ {toJpDateTime(createdAt)}
</div>
<div>{content}</div>
</div>
</div>
);
}