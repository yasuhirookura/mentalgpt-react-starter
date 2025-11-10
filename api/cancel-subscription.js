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
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) {
      return res.status(404).json({ error: 'user not found' });
    }
    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    // Firestoreにはさっき手で入れてたやつ
    const subscriptionId = userData.subscriptionId;
    const stripeCustomerId = userData.stripeCustomerId;

    // 2) Stripe側も止める（サブスクがある場合だけ）
    if (subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else if (stripeCustomerId) {
      // subscriptionId がない場合でも一応探す
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });
      if (subs.data[0]) {
        await stripe.subscriptions.update(subs.data[0].id, {
          cancel_at_period_end: true,
        });
      }
    }

    // 3) Firestoreにも「解約希望」を記録
    await userDoc.ref.update({
      cancelRequested: true,
      cancelRequestedAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, message: 'cancel scheduled' });
  } catch (err) {
    console.error('[cancel-subscription] error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
};