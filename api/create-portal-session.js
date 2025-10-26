// /api/create-portal-session.js
// 認証: Firebase ID トークン（Authorization: Bearer <idToken>）
// 返却: { url: "https://billing.stripe.com/..." }

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ---- Firebase Admin 初期化（使い回しOK）----
let admin;
try {
  admin = require("firebase-admin");
} catch {}
if (!admin?.apps?.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

async function verifyUser(req) {
  const h = req.headers.authorization || "";
  const idToken = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!idToken) throw new Error("No token");
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded; // { uid, email, ... }
}

async function findOrCreateCustomerByEmail(email, uid) {
  // まず検索（Search API 推奨 / 有効前提）。無効なら list fallback。
  try {
    const found = await stripe.customers.search({ query: email:'${email}' });
    if (found?.data?.length) return found.data[0];
  } catch (_) {
    const listed = await stripe.customers.list({ email, limit: 1 });
    if (listed?.data?.length) return listed.data[0];
  }
  // なければ作成
  return await stripe.customers.create({
    email,
    metadata: { firebaseUID: uid || "" },
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const user = await verifyUser(req);
    if (!user?.email) throw new Error("No email");

    const { return_url } = (req.body || {});
    const customer = await findOrCreateCustomerByEmail(user.email, user.uid);

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: return_url || `${req.headers.origin || ""}/account`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("[create-portal-session] error", e);
    return res.status(401).json({ error: e.message || "unauthorized" });
  }
};