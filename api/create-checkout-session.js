// api/create-checkout-session.js  ← ルート直下の /api フォルダ
const Stripe = require('stripe');

module.exports = async (req, res) => {
  // ヘルスチェック（ブラウザで開いたときの確認用）
  if (req.method === 'GET' && (req.query.ping !== undefined || req.query.health !== undefined)) {
    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      PRICE_ID_LIGHT,
      PRICE_ID_STANDARD,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY,
      SITE_BASE_URL,
    } = process.env;

    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing');
    if (!PRICE_ID_LIGHT || !PRICE_ID_STANDARD) throw new Error('PRICE_ID_* is missing');

    const stripe = Stripe(STRIPE_SECRET_KEY);

    const { plan } = req.body || {};
    const priceId = plan === 'standard' ? PRICE_ID_STANDARD : PRICE_ID_LIGHT;

    // ライトだけ 7日無料トライアル
    const trialDays = plan === 'light' ? 7 : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_BASE_URL}/pricing?success=1`,
      cancel_url: `${SITE_BASE_URL}/pricing?canceled=1`,
      subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
      // メタデータにプラン名を残しておく（後で管理画面やWebhookで参照しやすい）
      metadata: { plan },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] error:', err);
    const msg = err && err.message ? err.message : 'internal error';
    return res.status(500).json({ error: msg });
  }
};