// api/create-checkout-session.js  ← ルート直下の /api フォルダ（CommonJS）
const Stripe = require('stripe');

module.exports = async (req, res) => {
  // ヘルスチェック（ブラウザ確認用）
  if (
    req.method === 'GET' &&
    (req.query.ping !== undefined || req.query.health !== undefined)
  ) {
    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      PRICE_ID_LIGHT,
      PRICE_ID_STANDARD,
      STRIPE_SECRET_KEY,
      SITE_BASE_URL,
    } = process.env;

    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing');
    if (!PRICE_ID_LIGHT || !PRICE_ID_STANDARD) throw new Error('PRICE_ID_* is missing');
    if (!SITE_BASE_URL) throw new Error('SITE_BASE_URL is missing');

    const stripe = Stripe(STRIPE_SECRET_KEY);

    const { plan } = req.body || {};
    if (plan !== 'light' && plan !== 'standard') {
      return res.status(400).json({ error: 'invalid plan' });
    }

    const priceId = plan === 'standard' ? PRICE_ID_STANDARD : PRICE_ID_LIGHT;
    const trialDays = plan === 'light' ? 7 : undefined; // ライトだけ 7日無料

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // 戻り先
      success_url: `${SITE_BASE_URL}/pricing?success=1`,
      cancel_url: `${SITE_BASE_URL}/pricing?canceled=1`,

      // ライトのときだけトライアル付与
      subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,

      // 🔑 Webhook で使う識別情報を残す
      metadata: {
        plan,           // 例: "light" / "standard"
        price_id: priceId, // 例: "price_XXXX"
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] error:', err);
    const msg = err?.message || 'internal error';
    return res.status(500).json({ error: msg });
  }
};