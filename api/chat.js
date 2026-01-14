// api/chat.js
function cors(res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Vary", "Origin");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

import admin from "firebase-admin";

if (!admin.apps.length) {
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({
credential: admin.credential.cert({
projectId: process.env.FIREBASE_PROJECT_ID,
clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
privateKey,
}),
});
}
const db = admin.firestore();

async function verifyUser(req) {
const h = req.headers.authorization || "";
const idToken = h.startsWith("Bearer ") ? h.slice(7) : null;
if (!idToken) throw new Error("No token");
return await admin.auth().verifyIdToken(idToken); // { uid, email, ... }
}

// JST日付 "YYYY-MM-DD"
function getJstDateString() {
const now = new Date();
const utc = now.getTime() + now.getTimezoneOffset() * 60000;
const jst = new Date(utc + 9 * 60 * 60000);
return jst.toISOString().split("T")[0];
}

/**
* users/{uid} に usage を持つ
* users/{uid}/conversations に履歴を積む
*/
async function incrementUsageAndSaveConversation({ uid, userMessage, aiMessage }) {
const today = getJstDateString();

const userRef = db.collection("users").doc(uid);
const convRef = userRef.collection("conversations").doc(); // auto id

return await db.runTransaction(async (tx) => {
const snap = await tx.get(userRef);
const data = snap.exists ? snap.data() : {};

const plan = data?.plan || "free";
const dailyLimit =
typeof data?.dailyLimit === "number"
? data.dailyLimit
: plan === "standard"
? 30
: plan === "light"
? 10
: 10;

const usageDate = data?.usageDate || null;
let usedToday = typeof data?.usedToday === "number" ? data.usedToday : 0;

if (usageDate !== today) usedToday = 0;

if (usedToday >= dailyLimit) {
return { ok: false, dailyLimit, usedToday, today, plan };
}

// usage 更新
tx.set(
userRef,
{
usageDate: today,
usedToday: usedToday + 1,
plan,
dailyLimit,
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
},
{ merge: true }
);

// 履歴保存（今日の分として保存）
tx.set(convRef, {
date: today,
userMessage,
aiMessage,
createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

return { ok: true, dailyLimit, usedToday: usedToday + 1, today, plan };
});
}

export default async function handler(req, res) {
cors(res);

if (req.method === "OPTIONS") return res.status(204).end();
if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

try {
const { message, messages } = req.body || {};
const userMessage =
message ?? (Array.isArray(messages) ? messages[messages.length - 1]?.content : null);

if (!userMessage || typeof userMessage !== "string") {
return res.status(400).json({ error: "message is required" });
}

// ✅ 認証
const user = await verifyUser(req);
const uid = user?.uid;
if (!uid) return res.status(401).json({ error: "unauthorized" });

// ✅ OpenAI 呼び出し（先に成功を確定させる）
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

const payload = {
model: "gpt-4o-mini",
messages: [
{ role: "system", content: "あなたは優しく簡潔に寄り添うメンタルサポーターです。" },
{ role: "user", content: userMessage },
],
temperature: 0.7,
max_tokens: 350,
};

const resp = await fetch("https://api.openai.com/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${apiKey}`,
},
body: JSON.stringify(payload),
});

if (!resp.ok) {
const err = await resp.text();
console.error("[api/chat] OpenAI error", resp.status, err);
return res.status(500).json({ error: "OpenAI error", status: resp.status, detail: err });
}

const data = await resp.json();
const aiMessage = data.choices?.[0]?.message?.content?.trim() || "（応答を取得できませんでした）";

// ✅ 成功したので usage 加算＋履歴保存
const usage = await incrementUsageAndSaveConversation({ uid, userMessage, aiMessage });
if (!usage.ok) {
return res.status(429).json({
error: "daily_limit",
message: "本日の上限に達しました。明日またお待ちしています。",
dailyLimit: usage.dailyLimit,
usedToday: usage.usedToday,
date: usage.today,
});
}

return res.status(200).json({
text: aiMessage,
usage: { usedToday: usage.usedToday, dailyLimit: usage.dailyLimit, date: usage.today },
});
} catch (e) {
console.error("[api/chat] server error", e);
const msg = String(e?.message || e || "");
if (msg.includes("No token") || msg.includes("Firebase ID token")) {
return res.status(401).json({ error: "unauthorized" });
}
return res.status(500).json({ error: "server error" });
}
}