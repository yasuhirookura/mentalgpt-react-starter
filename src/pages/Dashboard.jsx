// src/pages/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

const MAX = 400;
const HINTS = [
"良い回答を考え中です…",
"言葉を大切に選んでいます…",
"あなたの気持ちに寄り添っています…",
"少しだけお待ちください…"
];

// ← 本番のデプロイURL（末尾スラッシュなし）
const PROD_BASE =
"https://mentalgpt-react-starter-9c6nk7xui-yasuhirookuras-projects.vercel.app";

export default function Dashboard() {
const nav = useNavigate();
const [text, setText] = useState(localStorage.getItem("draft") || "");
const [isLoading, setIsLoading] = useState(false);
const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
const [messages, setMessages] = useState([]); // { id, role:"user"|"ai"|"system", content, createdAt }
const [pageCount, setPageCount] = useState(10);
const [todayCount, setTodayCount] = useState(0); // MVP: 表示用
const [planLimit, setPlanLimit] = useState(10); // MVP: 10固定（後で連携）
const endRef = useRef(null);

// 初期ロード（MVPではダミー）
async function fetchInitial() {
try {
setMessages([]);
setTodayCount(0);
setPlanLimit(10); // 標準なら30に
} catch (e) {
console.error("[init] error", e);
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
const tempId = `temp_${Date.now()}`;
const userMsg = {
id: tempId,
role: "user",
content: body,
createdAt: new Date().toISOString()
};

try {
// 入力欄クリア（失敗したら復元する）
setText("");
localStorage.setItem("draft", "");

// 楽観的表示
setMessages(prev => [...prev, userMsg]);
setTodayCount(c => c + 1);

// ▼ 送信部：ローカルなら本番の /api/chat を叩く
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1";
const API_BASE = isLocal ? PROD_BASE : ""; // 本番(Vercel)では相対パスでOK

console.log("[send] POST", `${API_BASE}/api/chat`, { message: body });
const res = await fetch(`${API_BASE}/api/chat`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ message: body }) // server(api/chat.js) の期待どおり "message"
});

if (!res.ok) {
const t = await res.text().catch(() => "");
throw new Error(`POST /api/chat failed: ${res.status} ${t}`);
}

const data = await res.json();
const aiMsg = {
id: `ai_${Date.now()}`,
role: "ai",
// server は { text } を返す実装なので両対応
content: data.text ?? data.content ?? "(応答なし)",
createdAt: new Date().toISOString()
};

setMessages(prev => [...prev, aiMsg]);

setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
} catch (e) {
console.error("[send] error", e);
setTodayCount(c => Math.max(0, c - 1));
setText(body);
localStorage.setItem("draft", body);
setMessages(prev => [
...prev,
{
id: `err_${Date.now()}`,
role: "system",
content: "送信に失敗しました。もう一度お試しください。",
createdAt: new Date().toISOString()
}
]);
} finally {
setIsLoading(false);
}
}

// Enterは改行・送信はボタンのみ
function onKeyDown(e) {
// 何もしない（Enter送信を無効）
}

useEffect(() => { fetchInitial(); }, []);
useEffect(() => { localStorage.setItem("draft", text); }, [text]);
useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

const visibleMessages = messages.slice(-pageCount);
const over = text.length > MAX;
const remain = Math.max(planLimit - todayCount, 0);

return (
<main className="container" style={{ maxWidth: 680 }}>
<header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
<h1 style={{ margin: 0 }}>投稿</h1>
<span style={{ fontSize: 13, color: "#666" }}>
今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
</span>
<span style={{ marginLeft: "auto", fontSize: 13 }}>
<Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
</span>
</header>

{/* 入力欄 */}
<div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
<TextareaAutosize
value={text}
onChange={(e) => setText(e.target.value)}
onKeyDown={onKeyDown}
placeholder="いまの気持ちを自由に書いてください（400文字まで）"
minRows={4} /* 初期の高さ */
maxRows={12} /* 伸びる上限 */
style={{
width: "100%",
border: "none",
outline: "none",
resize: "none", // 手動リサイズは無効
lineHeight: 1.8,
fontSize: 16
}}
/>

<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ fontSize: 13, color: over ? "#c00" : "#666" }}>
{Math.min(text.length, MAX)} / {MAX}
</span>
<div style={{ marginLeft: "auto" }}>
<button
onClick={handleSend}
disabled={isLoading || !text.trim() || over || todayCount >= planLimit}
className="btn btn-primary"
>
{isLoading ? "考え中…" : "送信"}
</button>
</div>
</div>

{isLoading && (
<div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: "#3b6" }}>
<span style={{
width: 10, height: 10, borderRadius: "50%",
animation: "pulse 1.2s ease-in-out infinite",
display: "inline-block", background: "#39f"
}} />
<span style={{ fontSize: 13 }}>{hint}</span>
</div>
)}
</div>

{/* 履歴 */}
<section>
{visibleMessages.map(m => (
<MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
))}

{messages.length > pageCount ? (
<div style={{ textAlign: "center", margin: "12px 0 24px" }}>
<button className="btn btn-outline" onClick={() => setPageCount(c => c + 10)}>もっと見る</button>
<span style={{ margin: "0 8px", color: "#999" }}> / </span>
<Link to="/archive">アーカイブ</Link>
</div>
) : (
<div style={{ textAlign: "center", margin: "12px 0 24px" }}>
<Link to="/archive">アーカイブへ</Link>
</div>
)}

<div ref={endRef} />
</section>
</main>
);
}

function MessageBubble({ role, content, createdAt }) {
const isUser = role === "user";
return (
<div style={{
display: "flex",
justifyContent: isUser ? "flex-end" : "flex-start",
marginBottom: 8
}}>
<div style={{
background: isUser ? "#e7f1ff" : "#f6f6f6",
border: "1px solid #ddd",
padding: "10px 12px",
borderRadius: 12,
maxWidth: "85%",
lineHeight: 1.8,
whiteSpace: "pre-wrap",
wordBreak: "break-word",
}}>
<div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
{isUser ? "あなた" : "MentalGPT"} ・ {formatTime(createdAt)}
</div>
<div>{content}</div>
</div>
</div>
);
}

function formatTime(ts) {
try {
const d = new Date(ts);
return d.toLocaleString("ja-JP");
} catch {
return "";
}
}