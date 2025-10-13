// /api/create-checkout-session.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    const { plan } = req.body; // "light" or "standard"
    const priceId =
      plan === "standard"
        ? process.env.PRICE_ID_STANDARD
        : process.env.PRICE_ID_LIGHT;

    // ✅ ライトプランだけ7日間のトライアルをつける
    const trialDays = plan === "light" ? 7 : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      // 👇 ここにトライアル期間を設定
      subscription_data: trialDays ? { trial_period_days: trialDays } : {},
      success_url: `${process.env.SITE_BASE_URL}/mypage?status=success`,
      cancel_url: `${process.env.SITE_BASE_URL}/pricing?status=cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[stripe session error]", err);
    res.status(500).json({ error: "stripe_session_failed" });
  }
}