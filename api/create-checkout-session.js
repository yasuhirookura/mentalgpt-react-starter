// api/create-checkout-session.js ← ルート直下の /api （CommonJS）
const Stripe = require("stripe");

module.exports = async (req, res) => {
// --- Healthcheck: 手動アクセス確認用 ---
if (
req.method === "GET" &&
(req.query.ping !== undefined || req.query.health !== undefined)
) {
return res.status(200).json({ ok: true, time: new Date().toISOString() });
}

if (req.method !== "POST") {
return res.status(405).json({ error: "Method Not Allowed" });
}

try {
const {
PRICE_ID_LIGHT,
PRICE_ID_STANDARD,
STRIPE_SECRET_KEY,
SITE_BASE_URL, // 任意：未設定時は下で推定
} = process.env;

if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is missing");
if (!PRICE_ID_LIGHT || !PRICE_ID_STANDARD)
throw new Error("PRICE_ID_* is missing");

// 成功/キャンセル後に戻すURLを決める
// ① 環境変数があればそれを使う
// ② なければヘッダから https://mentalgpt.okulab.com みたいに推定
const baseUrl =
SITE_BASE_URL ||
`${(req.headers["x-forwarded-proto"] || "https")}://${req.headers.host}`;

const stripe = Stripe(STRIPE_SECRET_KEY);

// フロントから送られてくる想定
const { plan, email, uid } = req.body || {};
if (plan !== "light" && plan !== "standard") {
return res.status(400).json({ error: "invalid plan" });
}

const priceId = plan === "standard" ? PRICE_ID_STANDARD : PRICE_ID_LIGHT;
const trialDays = plan === "light" ? 7 : undefined; // ライトだけ7日無料

const session = await stripe.checkout.sessions.create({
mode: "subscription",
payment_method_types: ["card"],
line_items: [{ price: priceId, quantity: 1 }],

// ← ここを baseUrl に直した！
success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${baseUrl}/pricing?canceled=1`,

// ライトのときだけトライアル付与
subscription_data: trialDays
? { trial_period_days: trialDays }
: undefined,

// webhookで誰の課金か分かるように
metadata: {
plan, // "light" | "standard"
price_id: priceId,
uid: uid || "",
email: email || "",
},

// Checkoutにメールを表示したい場合
customer_email: email || undefined,
});

return res.status(200).json({ url: session.url });
} catch (err) {
console.error("[create-checkout-session] error:", err);
const msg = err?.message || "internal error";
return res.status(500).json({ error: msg });
}
};