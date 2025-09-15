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

// 本番のデプロイURL（末尾スラなし）—ローカル実行時だけ使用
const PROD_BASE =
"https://mentalgpt-react-starter-9c6nk7xui-yasuhirookuras-projects.vercel.app";

export default function Dashboard() {
const nav = useNavigate();

// 入力欄は上ではなく “下部のコンポーザー” に置く前提で state 維持
const [text, setText] = useState(localStorage.getItem("draft") || "");
const [isLoading, setIsLoading] = useState(false);
const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
const [messages, setMessages] = useState([]); // { id, role:"user"|"ai"|"system", content, createdAt }
const [todayCount, setTodayCount] = useState(0); // MVP: 表示用
const [planLimit, setPlanLimit] = useState(10); // MVP: 10固定（後で連携）

const listRef = useRef(null); // スクロール用

// 初期ロード（MVP: ダミー）
async function fetchInitial() {
try {
setMessages([]);
setTodayCount(0);
setPlanLimit(10);
} catch (e) {
console.error("[init] error", e);
}
}

// 常に下までスクロール
useEffect(() => {
listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
}, [messages]);

useEffect(() => { fetchInitial(); }, []);
useEffect(() => { localStorage.setItem("draft", text); }, [text]);

async function handleSend() {
const body = text.trim();
if (!body || isLoading || body.length > MAX) return;

if (todayCount >= planLimit) {
alert("本日の上限に達しました。明日またご利用ください。");
return;
}

setIsLoading(true);

// 楽観的に自分メッセージを追加
const userMsg = {
id: `u_${Date.now()}`,
role: "user",
content: body,
createdAt: new Date().toISOString()
};
setMessages(prev => [...prev, userMsg]);
setTodayCount(c => c + 1);

// 入力欄はクリア（失敗時は復元）
setText("");
localStorage.setItem("draft", "");

try {
// ローカル時は本番の /api/chat を叩く。Vercel本番では相対 /api/chat
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1";
const API_BASE = isLocal ? PROD_BASE : "";

const res = await fetch(`${API_BASE}/api/chat`, {
method: "POST",
headers: { "Content-Type": "application/json" },
// server (api/chat.js) は { message } を期待
body: JSON.stringify({ message: body })
});

if (!res.ok) {
const t = await res.text().catch(() => "");
throw new Error(`POST /api/chat failed: ${res.status} ${t}`);
}

const data = await res.json();
const aiMsg = {
id: `ai_${Date.now()}`,
role: "ai",
content: data.text ?? data.content ?? "(応答なし)",
createdAt: new Date().toISOString()
};
setMessages(prev => [...prev, aiMsg]);
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

// Enter は改行、送信はボタンのみ（誤送信防止）
function onKeyDown(e) {
// 何もしない（Enter送信を無効）
}

const remain = Math.max(planLimit - todayCount, 0);

return (
<main className="chat-layout">
{/* ヘッダー */}
<header className="chat-header">
<div className="title">投稿</div>
<div className="meta">今日の利用回数：{todayCount} / {planLimit}（残り {remain}）</div>
<nav className="links">
<Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
</nav>
</header>

{/* メッセージリスト（下に向かって溜まる） */}
<section ref={listRef} className="chat-list">
{messages.map(m => (
<Bubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
))}
</section>

{/* 下部コンポーザー */}
<footer className="composer">
<div className="composer-inner">
<TextareaAutosize
value={text}
onChange={(e) => setText(e.target.value)}
onKeyDown={onKeyDown}
minRows={3}
maxRows={12}
maxLength={MAX}
placeholder="いまの気持ちを自由に書いてください（400文字まで）"
className="composer-input"
/>
<button
className="send-btn"
onClick={handleSend}
disabled={isLoading || !text.trim() || text.length > MAX}
aria-label="送信"
title="送信"
>
{/* 青い円＋白い三角（送信アイコン） */}
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
<circle cx="12" cy="12" r="12" fill="#3b82f6" />
<path d="M9 7l8 5-8 5V7z" fill="#fff" />
</svg>
</button>
</div>
<div className="composer-meta">
<span className={text.length > MAX ? "count over" : "count"}>
{Math.min(text.length, MAX)} / {MAX}
</span>
{isLoading && <span className="hint">{hint}</span>}
</div>
</footer>
</main>
);
}

/* ====== 小さなバブルコンポーネント ====== */
function Bubble({ role, content, createdAt }) {
const isUser = role === "user";
const isSystem = role === "system";
return (
<div className={"row " + (isUser ? "right" : "left")}>
<div className={"bubble " + (isUser ? "me" : isSystem ? "system" : "ai")}>
<div className="meta-line">
<span className="who">{isUser ? "あなた" : isSystem ? "System" : "MentalGPT"}</span>
<span>・{formatTime(createdAt)}</span>
</div>
<div className="content">{content}</div>
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