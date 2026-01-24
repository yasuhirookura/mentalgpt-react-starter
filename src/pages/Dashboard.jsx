// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function cryptoId() {
if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function formatDateTime(d) {
const pad = (n) => String(n).padStart(2, "0");
return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
d.getMinutes()
)}`;
}

export default function Dashboard() {
const [pet, setPet] = useState("dog"); // dog | cat
const [tone, setTone] = useState("auto"); // auto | polite | casual
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

const css = useMemo(
() => `
:root{
--bg:#f6f7fb;
--card:#ffffff;
--line:#e9ecf3;
--text:#111827;
--muted:#6b7280;
--blue:#2563eb;
--blue2:#3b82f6;

--avatarSize:80px; /* 基本（モバイル〜） */
}
@media (min-width: 900px){
:root{ --avatarSize:120px; } /* PCだけ 150%相当 */
}

.pgpt{
min-height:100vh;
background:var(--bg);
display:flex;
flex-direction:column;
}

.pgpt__header{
position:sticky;
top:0;
z-index:10;
background:#ffffffcc;
backdrop-filter: blur(10px);
border-bottom:1px solid var(--line);
padding:14px 14px 10px;
display:flex;
align-items:center;
justify-content:space-between;
gap:12px;
}

.pgpt__titleArea{
display:flex;
flex-direction:column;
gap:6px;
}

.pgpt__title{
font-size:26px;
font-weight:800;
letter-spacing:0.2px;
color:var(--text);
}

.pgpt__badge{
display:inline-flex;
width:max-content;
align-items:center;
gap:8px;
padding:6px 10px;
border-radius:999px;
background:#eaf2ff;
color:var(--blue);
font-weight:700;
font-size:12px;
}

.pgpt__controls{
display:flex;
flex-direction:column;
align-items:flex-end;
gap:8px;
}

.pgpt__tone{
color:var(--muted);
font-size:12px;
}

.pgpt__seg{
background:#fff;
border:1px solid var(--line);
border-radius:999px;
padding:4px;
display:flex;
gap:4px;
}

.pgpt__segBtn{
border:0;
background:transparent;
padding:8px 12px;
border-radius:999px;
font-weight:800;
cursor:pointer;
color:var(--text);
}
.pgpt__segBtn.isActive{
background:linear-gradient(180deg, var(--blue2), var(--blue));
color:#fff;
}

.pgpt__main{
flex:1;
padding:20px 14px 14px;
}

.pgpt__list{
max-width:920px;
margin:0 auto;
display:flex;
flex-direction:column;
gap:14px;
}

.pgpt__msg{
background:var(--card);
border:1px solid var(--line);
border-radius:18px;
padding:16px;
display:flex;
gap:14px;
box-shadow:0 8px 20px rgba(17,24,39,0.06);
}

.pgpt__avatarWrap{
width:var(--avatarSize);
height:var(--avatarSize);
border-radius:50%;
overflow:hidden; /* ← これで“円形のみ”になる */
background:#fff; /* 円の背景は白だけ */
border:1px solid var(--line);
flex:0 0 auto;
box-shadow:0 8px 18px rgba(17,24,39,0.08);
}

.pgpt__avatarImg{
width:100%;
height:100%;
object-fit:cover; /* はみ出しは円内でトリミング */
display:block;
background:transparent;
}

.pgpt__meta{
display:flex;
align-items:center;
gap:10px;
margin-bottom:8px;
color:var(--muted);
font-size:13px;
}

.pgpt__author{
font-weight:800;
color:var(--text);
}

.pgpt__bubble{
background:#fff;
border:1px solid var(--line);
border-radius:16px;
padding:14px 16px;
white-space:pre-wrap;
line-height:1.7;
color:var(--text);
box-shadow:0 8px 16px rgba(17,24,39,0.05);
max-width:720px;
}

.pgpt__composer{
max-width:920px;
margin:14px auto 0;
background:#fff;
border:1px solid var(--line);
border-radius:18px;
padding:14px;
display:flex;
gap:12px;
align-items:stretch;
}

.pgpt__textarea{
flex:1;
border:1px solid var(--line);
border-radius:14px;
padding:14px;
resize:none;
outline:none;
font-size:16px;
line-height:1.6;
}

.pgpt__send{
width:110px;
border:0;
border-radius:14px;
font-weight:900;
cursor:pointer;
background:linear-gradient(180deg, #93c5fd, #60a5fa);
color:#fff;
}
.pgpt__send:disabled{
cursor:not-allowed;
background:#cbd5e1;
color:#fff;
}

.pgpt__footerRow{
max-width:920px;
margin:8px auto 18px;
display:flex;
justify-content:space-between;
gap:10px;
padding:0 2px;
color:var(--muted);
font-size:13px;
}

.pgpt__btns{
display:flex;
gap:8px;
flex-wrap:wrap;
justify-content:flex-end;
}

.pgpt__miniBtn{
border:1px solid var(--line);
background:#fff;
border-radius:999px;
padding:10px 14px;
cursor:pointer;
font-weight:800;
}

.pgpt__miniBtn.danger{
border-color:#f1c0c0;
color:#b91c1c;
}
`,
[]
);

function addSample(kind) {
if (kind === "polite") {
setText("今日はちょっと疲れたかも。やさしく励ましてほしい。");
setTone("polite");
return;
}
if (kind === "casual") {
setText("ねえねえ、なんか元気でること言って！");
setTone("casual");
return;
}
}

function clearChat() {
setMessages([]);
setText("");
}

function makeReply(userText) {
const t = tone;
if (pet === "dog") {
if (t === "polite") return `わん…！大丈夫だよ。\n${userText}\n少し深呼吸して、できるだけ小さな一歩からいこう。`;
if (t === "casual") return `わんわん！\n${userText}\nそれならまず水飲も！で、1分だけやってみよ〜。`;
return `ワン！\n${userText}\n今の気持ち、もう少しだけ教えて？`;
} else {
if (t === "polite") return `にゃ…。\n${userText}\n無理しないで。今日は「できたこと」だけ数えてみよ？`;
if (t === "casual") return `にゃん！\n${userText}\nとりあえず肩回そ。で、1個だけ片付けよ〜。`;
return `ニャ。\n${userText}\nいま一番つらいポイントってどこ？`;
}
}

function onSend() {
if (!canSend) return;

const now = formatDateTime(new Date());
const userMsg = {
id: cryptoId(),
role: "user",
pet,
author: "あなた",
at: now,
content: text.trim(),
};

const reply = {
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: now,
content: makeReply(text.trim()),
};

setMessages((prev) => [...prev, userMsg, reply]);
setText("");
}

return (
<div className="pgpt">
<style>{css}</style>

<header className="pgpt__header">
<div className="pgpt__titleArea">
<div className="pgpt__title">PetGPT</div>
<div className="pgpt__badge">β版 UI mock</div>
</div>

<div className="pgpt__controls">
<div className="pgpt__tone">口調：{tone === "auto" ? "自動（ユーザー文から判定）" : tone}</div>
<div className="pgpt__seg" role="tablist" aria-label="pet switch">
<button
className={"pgpt__segBtn " + (pet === "dog" ? "isActive" : "")}
onClick={() => setPet("dog")}
type="button"
>
🐶 犬
</button>
<button
className={"pgpt__segBtn " + (pet === "cat" ? "isActive" : "")}
onClick={() => setPet("cat")}
type="button"
>
🐱 猫
</button>
</div>
</div>
</header>

<main className="pgpt__main">
<div className="pgpt__list" ref={listRef}>
{messages.length === 0 ? (
<div style={{ color: "#6b7280", textAlign: "center", padding: "30px 0" }}>会話がありません</div>
) : (
messages.map((m) => (
<div key={m.id} className="pgpt__msg">
<div className="pgpt__avatarWrap" aria-hidden="true">
{m.role === "pet" ? (
<img className="pgpt__avatarImg" src={m.pet === "dog" ? "/img/dog_1.png" : "/img/cat_1.png"} alt="" />
) : (
<div className="pgpt__avatarImg" style={{ display: "grid", placeItems: "center", fontWeight: 900 }}>
🙂
</div>
)}
</div>

<div style={{ flex: 1 }}>
<div className="pgpt__meta">
<span className="pgpt__author">{m.author}</span>
<span>・</span>
<span>{m.at}</span>
</div>
<div className="pgpt__bubble">{m.content}</div>
</div>
</div>
))
)}
</div>

<div className="pgpt__composer">
<textarea
className="pgpt__textarea"
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="今の気分や、話したいことをどうぞ（400文字まで）"
maxLength={400}
rows={3}
onKeyDown={(e) => {
if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSend();
}}
/>
<button className="pgpt__send" onClick={onSend} disabled={!canSend} type="button">
送信
</button>
</div>

<div className="pgpt__footerRow">
<div>{text.length} / 400</div>
<div className="pgpt__btns">
<button className="pgpt__miniBtn" type="button" onClick={() => addSample("polite")}>
丁寧サンプル
</button>
<button className="pgpt__miniBtn" type="button" onClick={() => addSample("casual")}>
カジュアルサンプル
</button>
<button className="pgpt__miniBtn danger" type="button" onClick={clearChat}>
会話をクリア
</button>
</div>
</div>
</main>
</div>
);
}