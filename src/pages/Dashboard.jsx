// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

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
content:
"ワンコだよ。ここはUIのモック画面！\n犬/猫を切り替えて、投稿→返答の見た目を確認してね。",
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
// 下にスクロール
const el = listRef.current;
if (!el) return;
el.scrollTop = el.scrollHeight;
}, [messages.length]);

const helperText = useMemo(() => {
if (tone === "auto") return "口調：自動（ユーザー文から判定）";
if (tone === "polite") return "口調：丁寧";
return "口調：カジュアル";
}, [tone]);

function onSend() {
if (!canSend) return;

const userMsg = {
id: cryptoId(),
role: "user",
pet,
author: "あなた",
at: formatDateTime(new Date()),
content: text.trim(),
};

// 返答（モック）
const reply = mockReply(text.trim(), pet, tone);

const petMsg = {
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: formatDateTime(new Date()),
content: reply,
};

setMessages((prev) => [...prev, userMsg, petMsg]);
setText("");
}

function onClear() {
const now = formatDateTime(new Date());
setMessages([
{
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: now,
content:
`${petName}だよ。会話をクリアしたよ。\n気軽に話しかけてね。`,
},
]);
}

function setSample(kind) {
if (kind === "polite") {
setTone("polite");
setText("今日はちょっと疲れました。やさしく話を聞いてほしいです。");
} else {
setTone("casual");
setText("なんかモヤモヤする〜。ちょい元気出したい！");
}
}

function onKeyDown(e) {
if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
onSend();
}
}

return (
<div className="pgpt">
<style>{css}</style>

{/* Header */}
<div className="pgpt__header">
<div className="pgpt__titleArea">
<div className="pgpt__title">PetGPT</div>
<div className="pgpt__badge">β版 UI mock</div>
</div>

<div className="pgpt__headerRight">
<div className="pgpt__tone">{helperText}</div>

<div className="pgpt__seg" role="tablist" aria-label="pet selector">
<button
className={`pgpt__segBtn ${pet === "dog" ? "isActive" : ""}`}
onClick={() => setPet("dog")}
type="button"
>
🐶 <span>犬</span>
</button>
<button
className={`pgpt__segBtn ${pet === "cat" ? "isActive" : ""}`}
onClick={() => setPet("cat")}
type="button"
>
🐱 <span>猫</span>
</button>
</div>
</div>
</div>

{/* Chat list */}
<div className="pgpt__list" ref={listRef}>
{messages.map((m) => (
<div
key={m.id}
className={`pgpt__row ${m.role === "user" ? "isUser" : "isPet"}`}
>
{/* 左のアイコン */}
{m.role === "pet" ? (
<div className="pgpt__avatarWrap">
<div className="pgpt__avatar">
<img src={m.pet === "dog" ? "/img/dog_1.png" : "/img/cat_1.png"} alt={m.pet} />
</div>
</div>
) : (
<div className="pgpt__avatarWrap">
<div className="pgpt__avatar pgpt__avatar--user">
<span>🙂</span>
</div>
</div>
)}

<div className="pgpt__bubbleArea">
<div className="pgpt__meta">
<span className="pgpt__author">
{m.role === "pet" ? (m.pet === "dog" ? "ワンコ" : "ニャンコ") : "あなた"}
</span>
<span className="pgpt__dot">・</span>
<span className="pgpt__time">{m.at}</span>
</div>

<div className={`pgpt__bubble ${m.role === "user" ? "isUser" : "isPet"}`}>
{m.content.split("\n").map((line, idx) => (
<p key={idx} className="pgpt__p">
{line}
</p>
))}
</div>
</div>
</div>
))}
</div>

{/* Composer */}
<div className="pgpt__composer">
<div className="pgpt__inputRow">
<textarea
className="pgpt__input"
placeholder="今の気分や、話したいことをどうぞ（400文字まで）"
value={text}
onChange={(e) => setText(e.target.value)}
onKeyDown={onKeyDown}
maxLength={400}
/>
<button
className="pgpt__send"
onClick={onSend}
disabled={!canSend}
type="button"
>
送信
</button>
</div>

<div className="pgpt__bottomRow">
<div className="pgpt__count">
{text.length} / 400
</div>

<div className="pgpt__actions">
<button className="pgpt__chip" type="button" onClick={() => setSample("polite")}>
丁寧サンプル
</button>
<button className="pgpt__chip" type="button" onClick={() => setSample("casual")}>
カジュアルサンプル
</button>
<button className="pgpt__chip danger" type="button" onClick={onClear}>
会話をクリア
</button>
</div>
</div>

<div className="pgpt__hint">
⌘/Ctrl + Enter で送信
</div>
</div>
</div>
);
}

/* ---------------- helpers ---------------- */

function mockReply(userText, pet, tone) {
const isDog = pet === "dog";

// tone auto: 末尾が「です/ます」っぽいなら丁寧
const autoPolite = /です|ます|ください|でしょうか/.test(userText);
const effectiveTone = tone === "auto" ? (autoPolite ? "polite" : "casual") : tone;

if (effectiveTone === "polite") {
return isDog
? `承知しました。\n${pick([
"無理しすぎていませんか？",
"少し休める時間はありますか？",
"今いちばんつらいのは、どの部分でしょう？",
])}\n（※ここはモック返答です）`
: `かしこまりました。\n${pick([
"その気持ち、ちゃんと大事にしてね。",
"いま必要なのは、休憩？それとも整理？",
"少しだけ状況を教えてもらってもいい？",
])}\n（※ここはモック返答です）`;
}

// casual
return isDog
? `うんうん、わかる〜。\n${pick([
"今日はえらい！まず深呼吸しよ。",
"いま一番モヤるポイントどこ？",
"小さいことでもOK、吐き出して〜。",
])}\n（※ここはモック返答だよ）`
: `うん、あるある。\n${pick([
"まず温かい飲み物でもいこ？",
"その話、もうちょい聞かせて。",
"焦らなくて大丈夫。いま何が一番しんどい？",
])}\n（※ここはモック返答にゃ）`;
}

function pick(arr) {
return arr[Math.floor(Math.random() * arr.length)];
}

function formatDateTime(d) {
const pad = (n) => String(n).padStart(2, "0");
return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(
d.getHours()
)}:${pad(d.getMinutes())}`;
}

function cryptoId() {
// Safariでも動く程度に
try {
return crypto.randomUUID();
} catch {
return String(Date.now()) + "_" + String(Math.random()).slice(2);
}
}

/* ---------------- CSS ---------------- */

const css = `
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
background: #ffffffcc;
backdrop-filter: blur(10px);
border-bottom: 1px solid #e9ecf3;
padding: 14px 14px 10px;
display: flex;
gap: 12px;
align-items: center;
justify-content: space-between;
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
}

.pgpt__badge{
display:inline-flex;
width: fit-content;
font-size: 12px;
font-weight: 700;
background: #e7f0ff;
color: #0a6cff;
padding: 6px 10px;
border-radius: 999px;
}

.pgpt__headerRight{
display:flex;
flex-direction: column;
gap: 8px;
align-items: flex-end;
}

.pgpt__tone{
font-size: 12px;
color: #667085;
}

.pgpt__seg{
background: #f1f4fa;
border: 1px solid #e5e7ef;
border-radius: 999px;
padding: 4px;
display:flex;
gap: 4px;
}

.pgpt__segBtn{
border: 0;
background: transparent;
padding: 8px 12px;
border-radius: 999px;
font-size: 14px;
font-weight: 800;
color: #667085;
display:flex;
gap: 6px;
align-items: center;
}

.pgpt__segBtn.isActive{
background: #0a6cff;
color: #fff;
box-shadow: 0 6px 18px rgba(10,108,255,0.22);
}

.pgpt__segBtn span{
font-weight: 800;
}

.pgpt__list{
flex: 1;
padding: 16px 12px 10px;
overflow: auto;
}

.pgpt__row{
display:flex;
gap: 10px;
align-items: flex-start;
margin: 0 auto 14px;
max-width: 820px;
}

.pgpt__avatarWrap{
width: 64px;
flex: 0 0 64px;
display:flex;
justify-content: center;
}

.pgpt__avatar{
width: 58px;
height: 58px;
border-radius: 999px;
background: #f2f4f8;
border: 1px solid #e5e7ef;
overflow: hidden;
display:flex;
align-items: center;
justify-content: center;
}

/* ここが「犬を大きく、上寄せ、右の空き減らす」の要点 */
.pgpt__avatar img{
width: 150%;
height: 150%;
object-fit: contain;
transform: translateY(-8px);
}

.pgpt__avatar--user{
background: #ffffff;
}

.pgpt__bubbleArea{
flex: 1;
}

.pgpt__meta{
font-size: 12px;
color: #7a8194;
margin: 0 0 6px;
display:flex;
gap: 6px;
align-items: center;
}

.pgpt__author{
font-weight: 700;
}

.pgpt__dot{
opacity: 0.6;
}

.pgpt__bubble{
background: #fff;
border: 1px solid #e5e7ef;
border-radius: 18px;
padding: 12px 14px;
line-height: 1.5;
box-shadow: 0 8px 30px rgba(16,24,40,0.06);
width: fit-content;
max-width: 640px;
}

.pgpt__bubble.isUser{
background: #0a6cff0f;
border-color: #0a6cff33;
}

.pgpt__p{
margin: 0;
white-space: pre-wrap;
}

.pgpt__composer{
background: #fff;
border-top: 1px solid #e9ecf3;
padding: 12px;
}

.pgpt__inputRow{
max-width: 820px;
margin: 0 auto;
display:flex;
gap: 10px;
align-items: stretch;
}

.pgpt__input{
flex: 1;
min-height: 58px;
max-height: 160px;
resize: vertical;
border: 1px solid #e5e7ef;
border-radius: 16px;
padding: 14px 14px;
font-size: 16px;
outline: none;
}

.pgpt__input:focus{
border-color: #0a6cff66;
box-shadow: 0 0 0 4px rgba(10,108,255,0.10);
}

.pgpt__send{
width: 92px;
border: 0;
border-radius: 16px;
background: #0a6cff;
color: #fff;
font-weight: 800;
font-size: 16px;
}

.pgpt__send:disabled{
opacity: 0.45;
}

.pgpt__bottomRow{
max-width: 820px;
margin: 10px auto 0;
display:flex;
justify-content: space-between;
gap: 10px;
align-items: center;
}

.pgpt__count{
color: #7a8194;
font-size: 13px;
}

.pgpt__actions{
display:flex;
gap: 8px;
flex-wrap: wrap;
justify-content: flex-end;
}

.pgpt__chip{
border: 1px solid #e5e7ef;
background: #fff;
border-radius: 999px;
padding: 8px 12px;
font-weight: 700;
font-size: 13px;
}

.pgpt__chip.danger{
border-color: #ffd4d4;
}

.pgpt__hint{
max-width: 820px;
margin: 8px auto 0;
font-size: 12px;
color: #98a2b3;
text-align: right;
}

/* モバイル微調整 */
@media (max-width: 480px){
.pgpt__title{ font-size: 24px; }
.pgpt__avatarWrap{ width: 56px; flex-basis: 56px; }
.pgpt__avatar{ width: 52px; height: 52px; }
.pgpt__bubble{ max-width: 72vw; }
.pgpt__send{ width: 86px; }
}
`;