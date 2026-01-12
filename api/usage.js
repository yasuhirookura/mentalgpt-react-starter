// api/usage.js
import admin from "firebase-admin";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

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
  return await admin.auth().verifyIdToken(idToken);
}

// JST日付 "YYYY-MM-DD"
function getJstDateString() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + 9 * 60 * 60000);
  return jst.toISOString().split("T")[0];
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const user = await verifyUser(req);
    const uid = user?.uid;
    if (!uid) return res.status(401).json({ error: "unauthorized" });

    const today = getJstDateString();
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
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
    const usedTodayRaw = typeof data?.usedToday === "number" ? data.usedToday : 0;
    const usedToday = usageDate === today ? usedTodayRaw : 0;

    return res.status(200).json({
      usage: { usedToday, dailyLimit, date: today, plan },
    });
  } catch (e) {
    const msg = String(e?.message || e || "");
    if (msg.includes("No token") || msg.includes("Firebase ID token")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    return res.status(500).json({ error: "server error" });
  }
}