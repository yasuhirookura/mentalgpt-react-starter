// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const DOG_IMG = "/img/dog_1.png";
const CAT_IMG = "/img/cat_1.png";

// 画像の「円形背景色」
const AVATAR_BG = "#f7ebd3";

function cryptoId() {
if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(d = new Date()) {
const pad = (n) => String(n).padStart(2, "0");
return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
d.getMinutes()
)}`;
}

export default function Dashboard() {
const [pet, setPet] = useState("dog"); // dog | cat
const [tone, setTone] = useState("auto"); // auto | polite | casual
const [text, setText] = useState("");

const now = useMemo(() => formatDateTime(new Date()), []);
const [messages, setMessages] = useState(() => [
{
id: cryptoId(),
role: "pet",
pet: "dog",
author: "ワンコ",
at: now,
content: "ワンコだよ。ここはUIのモック画面！\n犬／猫を切り替えて、投稿→返答の見た目を確認してね。",
},
]);

const listRef = useRef(null);

const petLabel = pet === "dog" ? "犬" : "猫";
const petEmoji = pet === "dog" ? "🐶" : "🐱";
const petName = pet === "dog" ? "ワンコ" : "ニャンコ";
const petImg = pet === "dog" ? DOG_IMG : CAT_IMG;

const canSend = text.trim().length > 0 && text.trim().length <= 400;

useEffect(() => {
const el = listRef.current;
if (!el) return;
el.scrollTop = el.scrollHeight;
}, [messages.length]);

function pushUserMessage(content) {
const at = formatDateTime(new Date());
setMessages((prev) => [
...prev,
{ id: cryptoId(), role: "user", author: "あなた", at, content },
]);
}

function buildMockReply(userText) {
// 超ざっくり：語尾と雰囲気だけ変える
const base =
pet === "dog"
? `うんうん、${userText}\nそれ、いいね！`
: `ふむ…「${userText}」ね。\nなかなか良いじゃない。`;

if (tone === "polite") {
return base
.replace(/だよ/g, "です")
.replace(/いいね/g, "良いですね")
.replace(/うんうん/g, "なるほど")
.replace(/じゃない。/g, "ですね。");
}
if (tone === "casual") {
return base
.replace(/です/g, "だよ")
.replace(/良いですね/g, "いいね")
.replace(/なるほど/g, "うんうん");
}
// auto：ユーザー文の末尾が「！」多めならカジュアル寄せ、そうでなければ丁寧寄せ
const ex = (userText.match(/！|!/g) || []).length;
if (ex >= 2) {
return base
.replace(/です/g, "だよ")
.replace(/良いですね/g, "いいね");
}
return base
.replace(/だよ/g, "です")
.replace(/いいね/g, "良いですね")
.replace(/じゃない。/g, "ですね。");
}

function pushPetReply(userText) {
const at = formatDateTime(new Date());
const reply = buildMockReply(userText);
setMessages((prev) => [
...prev,
{ id: cryptoId(), role: "pet", pet, author: petName, at, content: reply },
]);
}

function onSend() {
const v = text.trim();
if (!v) return;
pushUserMessage(v);
setText("");

// 返答（モック）
setTimeout(() => pushPetReply(v), 250);
}

function onKeyDown(e) {
if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSend();
}

function clearChat() {
setMessages(() => [
{
id: cryptoId(),
role: "pet",
pet,
author: petName,
at: formatDateTime(new Date()),
content: `${petName}だよ。会話をクリアしたよ。\nまた話しかけてね。`,
},
]);
}

const css = `
/* ---------------- PetGPT mock Dashboard ---------------- */
.pgpt {
min-height: 100vh;
background: #f6f7fb;
display: flex;
flex-direction: column;
}

.pgpt__header {
position: sticky;
top: 0;
z-index: 10;
background: rgba(255