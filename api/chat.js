// api/chat.js
// Firestoreに保存された会話履歴（直近N件）を読み込んでから OpenAI に送る版

import admin from "firebase-admin";

// Node 18+ (Vercel) なら fetch が使えます
// もし古い環境なら node-fetch が必要ですが、Vercelは通常OKです。

/* =========================
   Firebase Admin 初期化
========================= */
function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)");
  }

  // Vercelの環境変数で改行が \n になるケース対策
  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function dayKeyJST(d = new Date()) {
  // YYYY-MM-DD (Asia/Tokyo)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/* =========================
   Auth (Firebase ID token)
========================= */
async function getUidFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;

  const idToken = m[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded?.uid || null;
  } catch (e) {
    return null;
  }
}

/* =========================
   Firestore: 会話の保存
========================= */
async function saveConversation({ uid, role, content }) {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("conversations").add({
    uid,
    role, // "user" or "ai" or "system"
    content: String(content || ""),
    createdAt: now,
    dayKey: dayKeyJST(),
  });
}

/* =========================
   Firestore: 直近N件取得
========================= */
async function loadRecentHistory(uid, limitN = 20) {
  const db = admin.firestore();

  // uid の直近N件を createdAt desc で取得 → 逆順にして時系列に戻す
  const snap = await db
    .collection("conversations")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  const list = [];
  snap.forEach((doc) => {
    const d = doc.data() || {};
    list.push({
      role: d.role || "system",
      content: d.content || "",
      createdAt: d.createdAt || null,
      dayKey: d.dayKey || "",
    });
  });

  // descで取ったので、古い→新しい順に戻す
  list.reverse();
  return list;
}

/* =========================
   OpenAI 呼び出し（Chat Completions）
   ※あなたの既存実装に合わせてRESTで書いています
========================= */
async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  // ここはあなたの運用モデルに合わせて変更OK
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`OpenAI error: ${resp.status} ${text}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const out = data?.choices?.[0]?.message?.content?.trim() || "";
  return out || "（応答を取得できませんでした）";
}

/* =========================
   Handler
========================= */
export default async function handler(req, res) {
  try {
    initFirebaseAdmin();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "method_not_allowed" });
    }

    const uid = await getUidFromRequest(req);
    if (!uid) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const body = req.body || {};
    const userMessage = String(body.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ error: "bad_request", message: "message is required" });
    }

    // 1) まずユーザー投稿を保存（＝確実にログが残る）
    await saveConversation({ uid, role: "user", content: userMessage });

    // 2) Firestoreから直近履歴を取得（これが“記憶”）
    const history = await loadRecentHistory(uid, 20);

    // 3) OpenAIに渡すmessagesを組み立て
    //    role の変換: Firestoreの "ai" → OpenAIの "assistant"
    const systemPrompt =
      "あなたは『MentalGPT』として、ユーザーの気持ちに寄り添い、短すぎず長すぎず、丁寧で具体的に返答します。過去の会話の文脈があれば自然に参照してください。";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((m) => m && m.content)
        .map((m) => {
          if (m.role === "ai") return { role: "assistant", content: m.content };
          if (m.role === "user") return { role: "user", content: m.content };
          return { role: "system", content: m.content };
        }),
      // ※念のため最後に今回の入力を入れておく（すでにhistoryに入ってるはずだが、整合が崩れた時の保険）
      { role: "user", content: userMessage },
    ];

    // 4) OpenAI呼び出し
    const answer = await callOpenAI(messages);

    // 5) AI返答をFirestoreに保存
    await saveConversation({ uid, role: "ai", content: answer });

    // 6) 返す（Dashboard側は data.text を見ているので text で返す）
    return res.status(200).json({
      text: answer,
      // usage を返している実装ならここにも合わせられますが、
      // 既存の /api/usage があるので、まずは text だけでOKです
    });
  } catch (e) {
    console.error("[api/chat] error", e);

    // OpenAI由来なら status を尊重
    const status = e?.status ? Number(e.status) : 500;
    return res.status(status).json({
      error: "server_error",
      message: e?.message || "server error",
    });
  }
}