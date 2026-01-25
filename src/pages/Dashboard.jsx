// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function formatDateTime(d) {
const pad = (n) => String(n).padStart(2, "0");
return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(
d.getHours()
)}:${pad(d.getMinutes())}`;
}

function cryptoId() {
if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

export default function Dashboard() {
const [pet, setPet] = useState("dog"); // "dog" | "cat"
const [tone, setTone] = useState("auto"); // "auto" | "polite" | "casual"
const [text, setText] = useState("");
const [messages, setMessages] = useState(() => {
const now = formatDateTime(new Date());
return [
{
id: cryptoId(),
role: "pet",
pet: "dog",
author: "ワンコ",
at: now,
content: "ワンコだよ。ここはUIのモック画面！\n犬/猫を切り替えて、投稿→返答の見た目を確認してね。",
},
];
});

const listRef = useRef(null);

const petLabel = pet === "dog" ? "犬" : "猫";
const petEmoji = pet === "dog" ? "🐶" : "🐱";
const petName = pet === "dog" ? "ワンコ" : "ニャンコ";
const petImg = pet === "dog" ? "/img/dog_1.png" : "/img/cat_1.png";

const canSend = text.trim().length > 0 && text.length <= 400;

useEffect(() => {
const el = listRef.current;
if (!el) return;
el.scrollTop = el.scrollHeight;
}, [messages.length]);

function addUserMessage() {
if (!canSend) return;
const now = formatDateTime(new Date());
const userText = text.trim();
setText("");

const userMsg = {
id: cryptoId(),
role: "user",
author: "あなた",
at: now,
content: userText,
};

const petReplyText = (() => {
if (tone === "polite") return `うん、${petName}だよ。ちゃんと聞いたよ。\n「${userText}」ってことだね。`;
if (tone === "casual") return `おっけー！${petName}聞いた！\n「${userText}」だね。`;
// auto
return `${petName}だよ。\n「${userText}」ってことだね。`;
})();

const petMsg = {
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: formatDateTime(new Date()),
content: petReplyText,
};

setMessages((prev) => [...prev, userMsg, petMsg]);
}

function clearChat() {
const now = formatDateTime(new Date());
setMessages([
{
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: now,
content: `${petName}だよ。会話をクリアしたよ。\nまた話しかけてね。`,
},
]);
}

const css = `
/* ---------------- PetGPT mock Dashboard ---------------- */
.pgpt{
min-height: 100vh;
background: #f6f7fb;
display: flex;
flex-direction: column;
}

.pgpt__header{
position: sticky;
top: 0;
z-index: 10;
background: rgba(255,255,255,0.80);
backdrop-filter: blur(10px);
border-bottom: 1px solid #e9ecf3;
padding: 14px 16px 10px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 12px;
}

.pgpt__titleArea{
display:flex;
flex-direction: column;
gap: 6px;
}

.pgpt__title{
font-size: 26px;
font-weight: 800;
letter-spacing: 0.2px;
color: #0f172a;
line-height: 1.0;
}

.pgpt__badge{
align-self:flex-start;
font-size: 12px;
font-weight: 700;
padding: 6px 10px;
border-radius: 999px;
background: #e7f0ff;
color: #2563eb;
}

.pgpt__right{
display:flex;
flex-direction: column;
align-items: flex-end;
gap: 8px;
}

.pgpt__tone{
font-size: 12px;
color: #64748b;
}

.pgpt__petToggle{
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 999px;
padding: 4px;
display: inline-flex;
gap: 6px;
}

.pgpt__petBtn{
border: 0;
background: transparent;
padding: 8px 12px;
border-radius: 999px;
font-weight: 800;
font-size: 14px;
color: #334155;
cursor: pointer;
}

.pgpt__petBtnActive{
background: linear-gradient(180deg, #3b82f6, #2563eb);
color: #fff;
}

.pgpt__main{
width: min(980px, calc(100% - 24px));
margin: 18px auto 0;
flex: 1;
display:flex;
flex-direction: column;
gap: 14px;
}

.pgpt__list{
background: #fff;
border: 1px solid #eef1f6;
border-radius: 18px;
padding: 14px;
min-height: 280px;
max-height: 52vh;
overflow: auto;
}

.pgpt__row{
display:flex;
gap: 12px;
padding: 12px;
border-radius: 16px;
}

.pgpt__row + .pgpt__row{
border-top: 1px dashed #eef1f6;
}

.pgpt__avatarWrap{
width: 84px;
height: 84px;
border-radius: 999px;
background: #f7ebd3; /* ★ここが指定色 */
display:flex;
align-items:center;
justify-content:center;
flex: 0 0 auto;
overflow: hidden; /* ★四角っぽいのが出ないように */
border: 1px solid rgba(15,23,42,0.06);
}

.pgpt__avatar{
width: 115%;
height: 115%;
object-fit: contain;
display:block;
}

/*
.pgpt__avatar{
width: 72%;
height: 72%;
object-fit: contain;
display:block;
}
*/

.pgpt__bubbleArea{
flex: 1;
min-width: 0;
}

.pgpt__meta{
display:flex;
align-items:center;
gap: 10px;
color: #64748b;
font-size: 13px;
margin-bottom: 8px;
}

.pgpt__author{
font-weight: 900;
color: #0f172a;
}

.pgpt__bubble{
background: #ffffff;
border: 1px solid #eef1f6;
border-radius: 16px;
padding: 12px 14px;
box-shadow: 0 8px 18px rgba(15,23,42,0.06);
white-space: pre-wrap;
line-height: 1.7;
color: #0f172a;
}

.pgpt__composer{
background: #fff;
border: 1px solid #eef1f6;
border-radius: 18px;
padding: 12px;
display:flex;
flex-direction: column;
gap: 10px;
}

.pgpt__inputRow{
display:flex;
gap: 10px;
align-items: stretch;
}

.pgpt__textarea{
flex: 1;
min-height: 84px;
resize: none;
padding: 14px;
border-radius: 14px;
border: 1px solid #e5e7eb;
outline: none;
font-size: 16px;
}

.pgpt__send{
width: 140px;
border: 0;
border-radius: 14px;
background: #93c5fd;
color: #fff;
font-weight: 900;
font-size: 16px;
cursor: pointer;
}

.pgpt__send:disabled{
background: #cbd5e1;
cursor: not-allowed;
}

.pgpt__counterRow{
display:flex;
justify-content: space-between;
align-items:center;
color: #64748b;
font-size: 12px;
}

.pgpt__actions{
display:flex;
gap: 10px;
justify-content:flex-end;
flex-wrap: wrap;
}

.pgpt__actionBtn{
border: 1px solid #e5e7eb;
background: #fff;
border-radius: 999px;
padding: 10px 14px;
font-weight: 800;
cursor: pointer;
}

.pgpt__actionDanger{
border-color: rgba(239,68,68,0.35);
color: #ef4444;
}

/* PCだけ 画像を大きめに */
@media (min-width: 900px){
.pgpt__avatarWrap{
width: 126px;
height: 126px;
}
.pgpt__avatar{
width: 115%;
height: 115%;
}
.pgpt__list{
max-height: 58vh;
}
}
`;

return (
<div className="pgpt">
<style>{css}</style>

<header className="pgpt__header">
<div className="pgpt__titleArea">
<div className="pgpt__title">PetGPT</div>
<div className="pgpt__badge">β版 UI mock</div>
</div>

<div className="pgpt__right">
<div className="pgpt__tone">口調：{tone === "auto" ? "自動（ユーザー文から判定）" : tone}</div>
<div className="pgpt__petToggle" role="tablist" aria-label="pet toggle">
<button
className={"pgpt__petBtn " + (pet === "dog" ? "pgpt__petBtnActive" : "")}
onClick={() => setPet("dog")}
type="button"
>
🐶 犬
</button>
<button
className={"pgpt__petBtn " + (pet === "cat" ? "pgpt__petBtnActive" : "")}
onClick={() => setPet("cat")}
type="button"
>
🐱 猫
</button>
</div>
</div>
</header>

<main className="pgpt__main">
<section className="pgpt__list" ref={listRef} aria-label="messages">
{messages.map((m) => {
const isPet = m.role === "pet";
const avatarSrc = isPet ? petImg : null;
return (
<div className="pgpt__row" key={m.id}>
<div className="pgpt__avatarWrap" aria-hidden={!isPet}>
{isPet ? <img className="pgpt__avatar" src={avatarSrc} alt={petLabel} /> : null}
</div>

<div className="pgpt__bubbleArea">
<div className="pgpt__meta">
<span className="pgpt__author">{isPet ? m.author : "あなた"}</span>
<span>・</span>
<span>{m.at}</span>
</div>
<div className="pgpt__bubble">{m.content}</div>
</div>
</div>
);
})}
</section>

<section className="pgpt__composer" aria-label="composer">
<div className="pgpt__inputRow">
<textarea
className="pgpt__textarea"
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="今の気分や、話したいことをどうぞ（400文字まで）"
maxLength={400}
/>
<button className="pgpt__send" onClick={addUserMessage} disabled={!canSend} type="button">
送信
</button>
</div>

<div className="pgpt__counterRow">
<div>{text.length} / 400</div>
<div>⌘/Ctrl + Enter で送信（※後で対応でもOK）</div>
</div>

<div className="pgpt__actions">
<button className="pgpt__actionBtn" type="button" onClick={() => setTone("polite")}>
丁寧サンプル
</button>
<button className="pgpt__actionBtn" type="button" onClick={() => setTone("casual")}>
カジュアルサンプル
</button>
<button className="pgpt__actionBtn pgpt__actionDanger" type="button" onClick={clearChat}>
会話をクリア
</button>
</div>
</section>
</main>
</div>
);
}