// api/chat.js

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/* =========================
   Firebase Admin init (Vercel)
   ========================= */
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
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded; // { uid, email, ... }
}

// JST日付 "YYYY-MM-DD"
function getJstDateString() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + 9 * 60 * 60000);
  return jst.toISOString().split("T")[0];
}

/**
 * users/{uid} の fields を使って日次回数を管理
 */
async function checkAndIncrementDailyUsage(uid) {
  const today = getJstDateString();
  const ref = db.collection("users").doc(uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
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
      return { ok: false, dailyLimit, usedToday, today };
    }

    tx.set(
      ref,
      {
        usageDate: today,
        usedToday: usedToday + 1,
        plan,
        dailyLimit,
      },
      { merge: true }
    );

    return { ok: true, dailyLimit, usedToday: usedToday + 1, today };
  });
}

/** ✅ conversations へ保存（サーバー時刻で確定） */
async function saveConversation({ uid, role, content }) {
  const dayKey = getJstDateString();
  await db.collection("conversations").add({
    uid,
    role, // "user" | "ai"
    content,
    dayKey, // "YYYY-MM-DD" (JST)
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * ✅ 直近の会話履歴を Firestore から取得
 * - sameDayOnly=true なら今日分のみ
 * - limitN は「合計メッセージ数」(user+ai をまとめてN件)
 */
async function loadRecentConversation({ uid, limitN = 20, sameDayOnly = true }) {
  const today = getJstDateString();

  let q = db.collection("conversations").where("uid", "==", uid);
  if (sameDayOnly) q = q.where("dayKey", "==", today);

  // createdAt desc で直近N件
  q = q.orderBy("createdAt", "desc").limit(limitN);

  const snap = await q.get();

  // desc で取ってるので、OpenAIに渡すため asc に戻す
  const rows = [];
  snap.forEach((doc) => {
    const d = doc.data() || {};
    rows.push({
      role: d.role,
      content: d.content,
      createdAt: d.createdAt,
    });
  });
  rows.reverse();

  // OpenAI用 role 変換（Firestore: "ai" → OpenAI: "assistant"）
  const messages = rows
    .filter((m) => (m.role === "user" || m.role === "ai") && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

  return messages;
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

    // ✅ ① 認証（Bearer ID token）
    const user = await verifyUser(req);
    const uid = user?.uid;
    if (!uid) return res.status(401).json({ error: "unauthorized" });

    // ✅ ② 回数チェック＆加算（サーバー側で確定）
    const usage = await checkAndIncrementDailyUsage(uid);
    if (!usage.ok) {
      return res.status(429).json({
        error: "daily_limit",
        message: "本日の上限に達しました。明日またお待ちしています。",
        dailyLimit: usage.dailyLimit,
        usedToday: usage.usedToday,
        date: usage.today,
      });
    }

    // ✅ ③ OpenAI 呼び出し
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    // ✅ ここが本丸：Firestoreから履歴を読み、今回の質問の前に積む
    // まずは「今日分のみ」「直近20件」くらいが安全
    let history = [];
    try {
      history = await loadRecentConversation({ uid, limitN: 20, sameDayOnly: true });
    } catch (e) {
      console.error("[api/chat] loadRecentConversation failed", e);
      history = [];
    }

    // ✅ system は「履歴を踏まえてOK」な文に（“覚えていません”固定文は入れない）
    const systemPrompt =
      "あなたは優しく簡潔に寄り添うメンタルサポーターです。"
      + " 以下の会話履歴（このユーザーの過去の投稿とあなたの返答）が与えられている場合は、"
      + " その範囲で文脈を踏まえて自然に会話してください。"
      + " 履歴にないことは推測せず、必要なら質問してください。";

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history, // ← ここに直近履歴が入る（user/assistant）
        { role: "user", content: userMessage }, // ← 最後に今回
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
    const text = data.choices?.[0]?.message?.content?.trim() || "（応答を取得できませんでした）";

    // ✅ ④ 履歴を保存（ユーザー投稿 → AI返信）
    try {
  await saveConversation({ uid, role: "user", content: userMessage });
  await saveConversation({ uid, role: "ai", content: text });
} catch (e) {
  console.error("[api/chat] saveConversation failed", e);
  return res.status(500).json({
    error: "save_failed",
    detail: String(e?.message || e)
  });
}

    return res.status(200).json({
      text,
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