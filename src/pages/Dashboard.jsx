// src/pages/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";

/* ---------- util ---------- */
function formatDateTime(d) {
return d.toLocaleString("ja-JP", {
year: "numeric",
month: "2-digit",
day: "2-digit",
hour: "2-digit",
minute: "2-digit",
});
}

/* ---------- Dashboard ---------- */
export default function Dashboard() {
const [pet, setPet] = useState("dog"); // dog | cat
const [tone, setTone] = useState("auto");
const [text, setText] = useState("");

const [messages, setMessages] = useState(() => {
const now = formatDateTime(new Date());
return [
{
id: crypto.randomUUID(),
role: "pet",
pet: "dog",
author: "ワンコ",
at: now,
content:
"ワンコだよ。ここはUIのモック画面！\n犬／猫を切り替えて、投稿→返答の見た目を確認してね。",
},
];
});

const listRef = useRef(null);

const petLabel = pet === "dog" ? "犬" : "猫";
const petEmoji = pet === "dog" ? "🐶" : "🐱";
const petName = pet === "dog" ? "ワンコ" : "ニャンコ";
const petImg =
pet === "dog" ? "/img/dog_1.png" : "/img/cat_1.png";

const canSend = text.trim().length > 0 && text.length <= 400;

/* 下に自動スクロール */
useEffect(() => {
const el = listRef.current;
if (!el) return;
el.scrollTop = el.scrollHeight;
}, [messages.length]);

/* ---------- handlers ---------- */
const handleSend = () => {
if (!canSend) return;

const now = formatDateTime(new Date());

setMessages((prev) => [
...prev,
{
id: crypto.randomUUID(),
role: "user",
author: "あなた",
at: now,
content: text,
},
{
id: crypto.randomUUID(),
role: "pet",
pet,
author: petName,
at: now,
content: `${petEmoji} うんうん、ちゃんと聞いてるよ。\n（※ここは返答UI確認用のダミーです）`,
},
]);

setText("");
};

/* ---------- render ---------- */
return (
<div className="petgpt-wrap">
{/* ---- inline CSS（このファイルだけに効く） ---- */}
<style>{`
.petgpt-wrap {
max-width: 900px;
margin: 0 auto;
padding: 16px;
}

.petgpt-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 16px;
}

.petgpt-title {
font-size: 22px;
font-weight: 700;
}

.badge {
font-size: 12px;
padding: 4px 8px;
border-radius: 999px;
background: #e8f0ff;
color: #356ae6;
margin-left: 8px;
}

.pet-switch {
display: flex;
gap: 8px;
}

.pet-switch button {
padding: 6px 12px;
border-radius: 999px;
border: 1px solid #ccc;
background: #fff;
cursor: pointer;
}

.pet-switch .active {
background: #356ae6;
color: #fff;
border-color: #356ae6;
}

.chat-list {
background: #f6f7fb;
border-radius: 12px;
padding: 16px;
height: 60vh;
overflow-y: auto;
margin-bottom: 16px;
}

.msg {
display: flex;
gap: 12px;
margin-bottom: 16px;
align-items: flex-start;
}

.msg.user {
justify-content: flex-end;
}

.msg.user .bubble {
background: #dbe8ff;
}

.bubble {
background: #fff;
padding: 12px 14px;
border-radius: 16px;
max-width: 70%;
white-space: pre-wrap;
box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.meta {
font-size: 12px;
color: #666;
margin-bottom: 4px;
}

/* ---- ペットアイコン ---- */
.pet-avatar {
width: 64px;
height: 64px;
border-radius: 50%;
background: #fff;
padding: 6px;
box-sizing: border-box;
flex-shrink: 0;
}

.pet-avatar img {
width: 100%;
height: 100%;
object-fit: contain;
}

/* ★ PCだけ150%拡大 ★ */
@media (min-width: 768px) {
.pet-avatar {
width: 96px; /* 64 × 1.5 */
height: 96px;
}
}

.input-area {
display: flex;
gap: 8px;
align-items: flex-end;
}

textarea {
flex: 1;
resize: none;
min-height: 64px;
padding: 12px;
border-radius: 12px;
border: 1px solid #ccc;
}

.send-btn {
padding: 12px 20px;
border-radius: 12px;
border: none;
background: #356ae6;
color: #fff;
font-weight: 600;
cursor: pointer;
}

.send-btn:disabled {
background: #aaa;
cursor: not-allowed;
}

.helper {
font-size: 12px;
color: #666;
margin-top: 6px;
text-align: right;
}
`}</style>

{/* ---- header ---- */}
<div className="petgpt-header">
<div>
<span className="petgpt-title">PetGPT</span>
<span className="badge">β版 UI mock</span>
</div>

<div className="pet-switch">
<button
className={pet === "dog" ? "active" : ""}
onClick={() => setPet("dog")}
>
🐶 犬
</button>
<button
className={pet === "cat" ? "active" : ""}
onClick={() => setPet("cat")}
>
🐱 猫
</button>
</div>
</div>

{/* ---- chat ---- */}
<div className="chat-list" ref={listRef}>
{messages.map((m) => (
<div
key={m.id}
className={`msg ${m.role === "user" ? "user" : ""}`}
>
{m.role === "pet" && (
<div className="pet-avatar">
<img src={petImg} alt={petLabel} />
</div>
)}

<div>
<div className="meta">
{m.author}・{m.at}
</div>
<div className="bubble">{m.content}</div>
</div>
</div>
))}
</div>

{/* ---- input ---- */}
<div className="input-area">
<textarea
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="今の気分や、話したいことをどうぞ（400文字まで）"
maxLength={400}
/>
<button
className="send-btn"
disabled={!canSend}
onClick={handleSend}
>
送信
</button>
</div>
<div className="helper">{text.length} / 400</div>
</div>
);
}