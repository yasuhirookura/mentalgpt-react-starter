// /api/account-summary.js
// 認証: Firebase ID トークン（Authorization: Bearer <idToken>）
// 返却: { plan_name, next_invoice_date, status }

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ---- Firebase Admin 初期化 ----
const admin = require("firebase-admin");

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

async function verifyUser(req) {
  const h = req.headers.authorization || "";
  const idToken = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!idToken) {
    const err = new Error("No token");
    err.code = 401;
    throw err;
  }
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded; // { uid, email, ... }
}

async function getCustomerByEmail(email) {
  // Stripe Search が使えないアカウントもあるので list にフォールバック
  try {
    const found = await stripe.customers.search({ query: email:'${email}' });

    if (found?.data?.length) return found.data[0];
  } catch (e) {
    // ignore and fallback
  }

  const listed = await stripe.customers.list({ email, limit: 1 });
  if (listed?.data?.length) return listed.data[0];

  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const user = await verifyUser(req);
    if (!user?.email) return res.status(400).json({ error: "No email" });

    const customer = await getCustomerByEmail(user.email);
    if (!customer) {
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

    const sub =
      subs.data.find((s) => s.status === "active" || s.status === "trialing") ||
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
      status: sub.status,
    });
  } catch (e) {
    console.error("[account-summary] error", e);

    // トークン関連だけ401、それ以外は500に
    const status = e.code === 401 ? 401 : 500;
    return res.status(status).json({ error: e.message || "error" });
  }
};
