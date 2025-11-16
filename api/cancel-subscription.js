// /api/cancel-subscription.js
const Stripe = require('stripe');
const admin = require('firebase-admin');

// Vercel/Nodeで複数回初期化しないためのおまじない
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    // 1) email から Firestore の users を探す
    const snap = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snap.empty) {
      // ユーザー自体が見つからない場合は「アクティブな契約なし扱い」
      return res.status(200).json({
        ok: true,
        status: 'no_user_in_firestore',
        message: 'no active subscription',
      });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    const subscriptionId = userData.subscriptionId;
    const stripeCustomerId = userData.stripeCustomerId;

    let canceled = false;

    // 2) subscriptionId があればそれを優先して止める
    if (subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      canceled = true;
    } else if (stripeCustomerId) {
      // 3) subscriptionId がなくても、customer から trialing/active を探す
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all', // active だけでなく trialing も含めて取得
        limit: 10,
      });

      const target = subs.data.find(
        (s) => s.status === 'active' || s.status === 'trialing'
      );

      if (target) {
        await stripe.subscriptions.update(target.id, {
          cancel_at_period_end: true,
        });
        canceled = true;
      }
    }

    // 4) Firestoreにも「解約希望」を記録（ログ用）
    await userDoc.ref.update({
      cancelRequested: true,
      cancelRequestedAt: new Date().toISOString(),
      lastCancelStatus: canceled ? 'cancel_at_period_end' : 'no_active_subscription',
    });

    // 5) フロント用のステータスを返す
    if (!canceled) {
      return res.status(200).json({
        ok: true,
        status: 'no_active_subscription',
        message: 'no active subscription',
      });
    }

    return res.status(200).json({
      ok: true,
      status: 'cancel_scheduled',
      message: 'cancel scheduled at period end',
    });
  } catch (err) {
    console.error('[cancel-subscription] error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
};