// api/chat.js
// Firestoreの会話履歴（直近N件）を読み込んで OpenAI に渡す版（修正版）

import admin from "firebase-admin";

/* =========================
   Firebase Admin 初期化
========================= */
function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)"
    );
  }

  // Vercelの環境変数で改行が \\n になるケース対策
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
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
  } catch {
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

  // 古い→新しい順に
  list.reverse();
  return list;
}

/* =========================
   OpenAI 呼び出し（Chat Completions）
========================= */
async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

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
  return data?.choices?.[0]?.message?.content?.trim() || "（応答を取得できませんでした）";
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

    // 1) まず “直近履歴” を読む（今回の投稿はまだ混ぜない）
    const history = await loadRecentHistory(uid, 20);

    // 2) 今回のユーザー投稿を保存（ログは確実に残す）
    await saveConversation({ uid, role: "user", content: userMessage });

    // 3) OpenAIに渡すmessagesを組み立て
    //    role の変換: Firestoreの "ai" → OpenAIの "assistant"
    const systemPrompt = `
あなたは『MentalGPT』として振る舞います。
ユーザーの気持ちに寄り添い、丁寧で具体的に返答してください。

重要:
- あなたには「このリクエスト内に渡された会話履歴」があります。履歴がある場合は必ず参照してください。
- ユーザーが「直前の内容を覚えていますか？」等と尋ねた場合、履歴から直前の内容を短く要約して答えてください。
- 履歴が渡されているのに「覚えていません」「記憶できません」などの定型文で逃げないでください。
- ただし、履歴に存在しないことは推測せず、必要なら確認質問をしてください。
`.trim();

    const mappedHistory = history
      .filter((m) => m && m.content)
      .map((m) => {
        if (m.role === "ai" || m.role === "assistant") return { role: "assistant", content: m.content };
        if (m.role === "user") return { role: "user", content: m.content };
        return { role: "system", content: m.content };
      });

    const messages = [
      { role: "system", content: systemPrompt },
      ...mappedHistory,
      { role: "user", content: userMessage }, // ★今回の入力は1回だけ
    ];

    // 4) OpenAI呼び出し
    const answer = await callOpenAI(messages);

    // 5) AI返答をFirestoreに保存
    await saveConversation({ uid, role: "ai", content: answer });

    // 6) 返す（Dashboard側は data.text を見ているので text）
    return res.status(200).json({ text: answer });
  } catch (e) {
    console.error("[api/chat] error", e);
    const status = e?.status ? Number(e.status) : 500;
    return res.status(status).json({
      error: "server_error",
      message: e?.message || "server error",
    });
  }
}