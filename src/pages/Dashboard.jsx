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
const [messages, setMessages] = useState([]); 
const [pageCount, setPageCount] = useState(10);
const [todayCount, setTodayCount] = useState(0); 
const [planLimit, setPlanLimit] = useState(10); 
const endRef = useRef(null);

// 初期ロード（MVPではダミー）
async function fetchInitial() {
try {
// ここは後で Firestore/自前API に差し替え
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

// 軽ガード（本実装はサーバー側で enforce）
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
const API_BASE = isLocal ? PROD_BASE : ""; 

console.log("[send] POST", `${API_BASE}/api/chat`, { message: body });
const res = await fetch(`${API_BASE}/api/chat`, {
method: "POST",
headers: { "Content-Type": "application/json" },
// ← server(api/chat.js) の期待どおり "message" で送る
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
// serverは { text } を返す実装なので両対応
content: data.text ?? data.content ?? "(応答なし)",
createdAt: new Date().toISOString()
};

// tempはそのまま残し、順に積む（見た目は時系列）
setMessages(prev => [...prev, aiMsg]);

// スクロール追従
setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
} catch (e) {
console.error("[send] error", e);
// 失敗時は回数を戻す & 入力を復元
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

// Enterは改行・送信はボタンのみ（IME確定Enterの誤送信防止）
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

{/* 入力 */}
<div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
<TextareaAutosize
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={onKeyDown}
  placeholder="いまの気持ちを自由に書いてください（400文字まで）"
  minRows={4} 
  maxRows={12} 
  style={{
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none", 
    lineHeight: 1.8,
    fontSize: 16
  }}
/>