// api/cancel-subscription.js
const Stripe = require("stripe");

module.exports = async (req, res) => {
  // 簡単なヘルスチェック（GETで開いたとき用）
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { STRIPE_SECRET_KEY } = process.env;
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing");
    }
    const stripe = Stripe(STRIPE_SECRET_KEY);

    // フロントから送ってもらう
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    // 1) このメールのCustomerをStripeから探す
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.status(404).json({ error: "customer not found" });
    }

    const customer = customers.data[0];

    // 2) そのCustomerの有効なサブスクリプションを取る
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active", // “trialing” も含めたいときは配列で
      expand: ["data.default_payment_method"],
      limit: 1,
    });

    if (!subs.data.length) {
      // ここに来る＝もう解約済み or もともと契約してない
      return res.status(200).json({ ok: true, message: "no active subscription" });
    }

    const sub = subs.data[0];

    // 3) 今回は「すぐ止める」方式にします
    const canceled = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: false, // trueにすると今月いっぱいで止まる
    });

    return res.status(200).json({
      ok: true,
      subscription_id: canceled.id,
      status: canceled.status,
    });
  } catch (err) {
    console.error("[cancel-subscription] error:", err);
    return res
      .status(500)
      .json({ error: err.message || "internal error in cancel-subscription" });
  }
};