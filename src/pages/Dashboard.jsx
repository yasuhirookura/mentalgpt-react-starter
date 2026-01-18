// src/pages/Dashboard.jsx
import "../styles/Button.css";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { auth, authReady, db } from "../firebase";

const MAX = 400;
const HINTS = [
"良い回答を考え中です…",
"言葉を大切に選んでいます…",
"あなたの気持ちに寄り添っています…",
"少しだけお待ちください…",
];

// ✅ デバッグ表示のON/OFF（通常運用は false 推奨）
const SHOW_DEBUG = false;

function dayKeyJST(d = new Date()) {
return new Intl.DateTimeFormat("en-CA", {
timeZone: "Asia/Tokyo",
year: "numeric",
month: "2-digit",
day: "2-digit",
}).format(d); // YYYY-MM-DD
}

function toJpDateTime(ts) {
try {
const d = ts?.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
} catch {
return "";
}
}

export default function Dashboard() {
const [text, setText] = useState(localStorage.getItem("draft") || "");
const [isLoading, setIsLoading] = useState(false);
const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);

// Firestoreから読んだ「今日の履歴」をここに表示
const [messages, setMessages] = useState([]);

// ✅ サーバー基準の回数（ブラウザが変わっても一致する）
const [todayCount, setTodayCount] = useState(0);
const [planLimit, setPlanLimit] = useState(10);

// auth表示用
const [userUid, setUserUid] = useState("");
const [userEmail, setUserEmail] = useState("");

const endRef = useRef(null);

useEffect(() => {
localStorage.setItem("draft", text);
}, [text]);

// 起動：auth確定→購読→ usage + 今日の履歴ロード
useEffect(() => {
let unsub = null;
let alive = true;

(async () => {
try {
await authReady;
if (!alive) return;

unsub = onAuthStateChanged(auth, async (u) => {
if (!alive) return;

setUserUid(u?.uid || "");
setUserEmail(u?.email || "");

if (!u) {
setMessages([]);
return;
}

await refreshUsage();
await reloadTodayFromFirestore(u.uid);
});
} catch (e) {
console.error("[Dashboard] boot error", e);
}
})();

return () => {
alive = false;
if (unsub) unsub();
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function refreshUsage() {
try {
const u = auth.currentUser;
if (!u) return;

const idToken = await u.getIdToken();
const res = await fetch("/api/usage", {
method: "GET",
headers: { Authorization: `Bearer ${idToken}` },
});

const data = await res.json().catch(() => ({}));
if (res.ok && data?.usage) {
setTodayCount(Number(data.usage.usedToday ?? 0));
setPlanLimit(Number(data.usage.dailyLimit ?? 10));
} else {
console.warn("[usage] not ok", res.status, data);
}
} catch (e) {
console.error("[usage] fetch error", e);
}
}

async function reloadTodayFromFirestore(uid) {
try {
const dk = dayKeyJST();
const ref = collection(db, "conversations");
const q = query(
ref,
where("uid", "==", uid),
where("dayKey", "==", dk),
orderBy("createdAt", "asc"),
limit(200)
);
const snap = await getDocs(q);
const list = [];
snap.forEach((doc) => {
const d = doc.data() || {};
list.push({
id: doc.id,
role: d.role || "system",
content: d.content || "",
createdAt: d.createdAt || "",
});
});
setMessages(list);
setTimeout(() => scrollToBottom(false), 0);
} catch (e) {
console.error("[Dashboard] reloadTodayFromFirestore error", e);
}
}

async function handleSend() {
const body = text.trim();
if (!body) return;
if (body.length > MAX) return;
if (isLoading) return;

if (todayCount >= planLimit) {
alert("本日の上限に達しました。明日またご利用ください。");
return;
}

setIsLoading(true);
setText("");
localStorage.setItem("draft", "");

// UIは即反映（ただし最終はFirestoreから読み直す）
const optimistic = {
id: `tmp_user_${Date.now()}`,
role: "user",
content: body,
createdAt: new Date(),
};
setMessages((prev) => [...prev, optimistic]);
setTimeout(() => scrollToBottom(false), 0);

try {
await authReady;
const u = auth.currentUser;
const idToken = u ? await u.getIdToken() : null;

const res = await fetch("/api/chat", {
method: "POST",
headers: {
"Content-Type": "application/json",
...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
},
body: JSON.stringify({ message: body }),
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
const msg =
data?.message ||
(data?.error === "daily_limit"
? "本日の上限に達しました。"
: `送信に失敗しました（${res.status}）`);
throw new Error(msg);
}

// usage更新
if (data?.usage) {
setTodayCount(Number(data.usage.usedToday ?? todayCount));
setPlanLimit(Number(data.usage.dailyLimit ?? planLimit));
} else {
await refreshUsage();
}

// ✅ サーバー側がFirestoreへ保存している前提なので、ここで “今日の履歴” を再同期するのが安全
if (u?.uid) {
await reloadTodayFromFirestore(u.uid);
} else {
// いちおう画面だけ追加
const aiMsg = {
id: `tmp_ai_${Date.now()}`,
role: "ai",
content: data.text ?? data.content ?? "(応答なし)",
createdAt: new Date(),
};
setMessages((prev) => [...prev, aiMsg]);
}

setTimeout(() => scrollToBottom(), 0);
} catch (e) {
console.error("[send] error", e);
setMessages((prev) => [
...prev,
{
id: `err_${Date.now()}`,
role: "system",
content: e?.message || "送信に失敗しました。もう一度お試しください。",
createdAt: new Date(),
},
]);
setTimeout(() => scrollToBottom(), 0);
} finally {
setIsLoading(false);
}
}

function scrollToBottom(smooth = true) {
const el = endRef.current;
if (!el) return;
el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
}

const over = text.length > MAX;
const remain = Math.max(planLimit - todayCount, 0);

return (
<main className="container" style={{ maxWidth: 820, marginTop: 0, paddingTop: 0 }}>
<header
style={{
display: "flex",
flexWrap: "wrap",
alignItems: "baseline",
gap: 10,
margin: "8px 0 4px",
}}
>
<h1 style={{ margin: 0 }}>投稿</h1>

<span style={{ fontSize: 13, color: "#666" }}>
今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
</span>

{/* ✅ デバッグ表示（通常は非表示） */}
{SHOW_DEBUG && (
<span style={{ fontSize: 11, color: "#999" }}>
uid: {userUid || "(未取得)"} {userEmail ? ` / ${userEmail}` : ""} / dayKey: {dayKeyJST()}
</span>
)}

<span style={{ marginLeft: "auto", fontSize: 13 }}>
<Link to="/archive">アーカイブ</Link> / <Link to="/mypage">マイページ</Link>
</span>
</header>

{/* 会話（今日の履歴） */}
<div
style={{
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: "12px",
minHeight: "52vh",
maxHeight: "72vh",
overflowY: "auto",
background: "#fff",
display: "flex",
flexDirection: "column",
gap: 10,
}}
>
{messages.length === 0 && (
<p style={{ color: "#888", textAlign: "center", margin: "12px 0" }}>
直近の履歴はここに表示されます。下の入力欄から気持ちを書いてみてください。
</p>
)}

{messages.map((m) => (
<MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
))}

<div ref={endRef} />
</div>

{/* 入力エリア */}
<div style={{ position: "sticky", bottom: 8, marginTop: 8 }}>
<div
style={{
display: "flex",
gap: 8,
alignItems: "flex-end",
background: "#f9fafb",
border: "1px solid #e5e7eb",
borderRadius: 12,
padding: 10,
}}
>
<TextareaAutosize
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="今の気分や、頭に浮かんだことを、自由にどうぞ（400文字まで）"
minRows={2}
maxRows={10}
style={{
flex: 1,
border: "none",
outline: "none",
resize: "none",
background: "transparent",
lineHeight: 1.8,
fontSize: 16,
}}
/>

<button
type="button"
aria-label="送信"
onClick={handleSend}
disabled={isLoading || !text.trim() || over || todayCount >= planLimit}
title={over ? "文字数が多すぎます" : "送信"}
className="sendButton"
>
<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<circle cx="24" cy="24" r="23" />
<polygon points="18,12 36,24 18,36" fill="white" />
</svg>
</button>
</div>

<div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
<span style={{ fontSize: 12, color: over ? "#c00" : "#666" }}>
{Math.min(text.length, MAX)} / {MAX}
</span>
{isLoading && <span style={{ fontSize: 12, color: "#0a6cff", marginLeft: 8 }}>{hint}</span>}
</div>
</div>
</main>
);
}

/* ------ バブル ------ */
function MessageBubble({ role, content, createdAt }) {
const isUser = role === "user";
return (
<div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "8px 0" }}>
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
{isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム"} ・ {toJpDateTime(createdAt)}
</div>
<div>{content}</div>
</div>
</div>
);
}