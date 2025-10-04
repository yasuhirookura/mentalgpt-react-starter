// src/pages/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

const MAX = 400;
const HINTS = [
"良い回答を考え中です…",
"言葉を大切に選んでいます…",
"あなたの気持ちに寄り添っています…",
"少しだけお待ちください…",
];

export default function Dashboard() {
const [text, setText] = useState(localStorage.getItem("draft") || "");
const [isLoading, setIsLoading] = useState(false);
const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
const [messages, setMessages] = useState([]); // { id, role:"user"|"ai"|"system", content, createdAt }
const [pageCount, setPageCount] = useState(30); // 初期表示件数（必要なら増やす）
const [todayCount, setTodayCount] = useState(0);
const [planLimit, setPlanLimit] = useState(10); // MVP: 10固定（後で連携）
const endRef = useRef(null);
const scrollWrapRef = useRef(null);

// 初期ロード（MVPではダミー）
async function fetchInitial() {
try {
// 後で Firestore / 自前API に差し替え
setMessages([]);
setTodayCount(0);
setPlanLimit(10);
} catch (e) {
console.error("[init] error", e);
}
}

// 自動スクロール（末尾へ）
function scrollToBottom(smooth = true) {
const el = endRef.current;
if (!el) return;
el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
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

// 入力欄クリア（失敗時に復元する）
setText("");
localStorage.setItem("draft", "");

// ユーザー投稿を先に表示（右寄せ）
const tempId = `temp_${Date.now()}`;
const userMsg = {
id: tempId,
role: "user",
content: body,
createdAt: new Date().toISOString(),
};
setMessages((prev) => [...prev, userMsg]);
setTodayCount((c) => c + 1);
setTimeout(() => scrollToBottom(false), 0);

try {
// 本番/ローカル問わず相対パスでOK（Vercel / dev proxy）
const res = await fetch("/api/chat", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ message: body }),
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
createdAt: new Date().toISOString(),
};

// 応答を最後に積む（左寄せ）
setMessages((prev) => [...prev, aiMsg]);
setTimeout(() => scrollToBottom(), 0);
} catch (e) {
console.error("[send] error", e);
// 失敗時は回数を戻す & 入力を復元 & エラーメッセージ
setTodayCount((c) => Math.max(0, c - 1));
setText(body);
localStorage.setItem("draft", body);
setMessages((prev) => [
...prev,
{
id: `err_${Date.now()}`,
role: "system",
content: "送信に失敗しました。もう一度お試しください。",
createdAt: new Date().toISOString(),
},
]);
setTimeout(() => scrollToBottom(), 0);
} finally {
setIsLoading(false);
}
}

// Enter は改行のみ（IME確定Enterの誤送信防止）→ 送信はボタン
function onKeyDown(e) {
// ここでは何もしない（Enter送信を無効）
// 将来、Ctrl+Enter送信にしたければ以下：
// if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend(); }
}

useEffect(() => {
fetchInitial();
}, []);

useEffect(() => {
localStorage.setItem("draft", text);
}, [text]);

useEffect(() => {
// メッセージ追加時に自動スクロール
scrollToBottom(false);
}, [messages.length]);

const visibleMessages = messages.slice(-pageCount);
const over = text.length > MAX;
const remain = Math.max(planLimit - todayCount, 0);

return (
<main className="container" style={{ maxWidth: 820, marginTop: 0, paddingTop: 0 }}>
{/* ヘッダ（必要最小限） */}
<header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0 4px" }}>
<h1 style={{ margin: 0 }}>投稿</h1>
<span style={{ fontSize: 13, color: "#666" }}>
今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
</span>
<span style={{ marginLeft: "auto", fontSize: 13 }}>
<Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
</span>
</header>

{/* スクロールエリア（履歴） */}
<div
ref={scrollWrapRef}
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
{/* 伸びる余白：メッセージを常に下に寄せる */}
<div style={{ flexGrow: 1 }} />

{visibleMessages.length === 0 && (
<p style={{ color: "#888", textAlign: "center", margin: "12px 0" }}>
ここに会話が表示されます。下の入力欄から気持ちを書いてみてください。
</p>
)}

{visibleMessages.map((m) => (
<MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
))}

{/* もっと見る */}
{messages.length > pageCount && (
<div style={{ textAlign: "center", margin: "12px 0 8px" }}>
<button className="btn btn-outline" onClick={() => setPageCount((c) => c + 20)}>
もっと見る
</button>
</div>
)}

<div ref={endRef} />
</div>

{/* 入力エリア（下部固定） */}
<div
style={{
position: "sticky",
bottom: 8,
marginTop: 8, // 負のマージンをやめ、自然な余白に
paddingTop: 0,
}}
>
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
onKeyDown={onKeyDown}
placeholder="いまの気持ちを自由に書いてください（400文字まで）"
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
onClick={handleSend}
disabled={isLoading || !text.trim() || over || todayCount >= planLimit}
title={over ? "文字数が多すぎます" : "送信"}
style={{
width: 44,
height: 44,
borderRadius: "999px",
border: "none",
background:
isLoading || !text.trim() || over || todayCount >= planLimit ? "#9bbcf7" : "#0a6cff",
color: "#fff",
display: "grid",
placeItems: "center",
cursor:
isLoading || !text.trim() || over || todayCount >= planLimit ? "not-allowed" : "pointer",
}}
>
{/* 青い円に白い三角形（送信アイコン） */}
<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path d="M3.4 20.6l17.2-8.6L3.4 3.4 5.8 11l9 1-9 1z" />
</svg>
</button>
</div>

{/* カウンタ & ヒント */}
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
<div
style={{
display: "flex",
justifyContent: isUser ? "flex-end" : "flex-start",
margin: "8px 0",
}}
>
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
{isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム"} ・ {formatTime(createdAt)}
</div>
<div>{content}</div>
</div>
</div>
);
}

/* ------ util ------ */
function formatTime(ts) {
try {
const d = new Date(ts);
return d.toLocaleString("ja-JP");
} catch {
return "";
}
}