// /api/account-summary.js
// 認証: Firebase ID トークン（Authorization: Bearer <idToken>）
// 返却: { plan_name, next_invoice_date, status, raw? }

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ---- Firebase Admin 初期化（共通化）----
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

async function getCustomerByEmail(email) {
  try {
    const found = await stripe.customers.search({ query: email:'${email}' });
    if (found?.data?.length) return found.data[0];
  } catch (_) {
    const listed = await stripe.customers.list({ email, limit: 1 });
    if (listed?.data?.length) return listed.data[0];
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const user = await verifyUser(req);
    if (!user?.email) throw new Error("No email");

    const customer = await getCustomerByEmail(user.email);
    if (!customer) {
      // 未課金（無料プラン相当）
      return res.status(200).json({
        plan_name: "無料",
        next_invoice_date: null,
        status: "none",
      });
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price.product"],
    });

    // アクティブ/トライアル優先で拾う
    const sub =
      subs.data.find(s => s.status === "active" || s.status === "trialing") ||
      subs.data[0];

    if (!sub) {
      return res.status(200).json({
        plan_name: "無料",
        next_invoice_date: null,
        status: "none",
      });
    }

    const price = sub.items?.data?.[0]?.price;
    const product = price?.product;
    const planName =
      price?.nickname ||
      product?.name ||
      (price?.recurring?.interval === "month" ? "月額プラン" : "プラン");

    return res.status(200).json({
      plan_name: planName,
      next_invoice_date: sub.current_period_end || null, // UNIX秒
      status: sub.status, // active/trialing/canceled 等
    });
  } catch (e) {
    console.error("[account-summary] error", e);
    return res.status(401).json({ error: e.message || "unauthorized" });
  }
};