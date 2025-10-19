// /api/stripe-webhook.js
const getRawBody = require('raw-body');
const Stripe = require('stripe');
const admin = require('firebase-admin');

// ---------- Stripe ----------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// ---------- Firebase Admin ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // 重要: 改行を戻す
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const auth = admin.auth();
const db = admin.firestore();

// ---------- Helper ----------
async function upsertUserByEmail(email, plan, stripeCustomerId) {
  try {
    // 既存ユーザー検索
    let user;
    try { user = await auth.getUserByEmail(email); } catch { /* not found */ }
    if (!user) {
      user = await auth.createUser({ email, emailVerified: true });
    }
    // カスタムクレームにプランを付与（例：{plan:'light'|'standard'|null}）
    await auth.setCustomUserClaims(user.uid, { plan });

    // Firestore に Stripe <-> Firebase のひも付けを保存（任意）
    await db.collection('users').doc(user.uid).set({
      email,
      plan,
      stripeCustomerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return user.uid;
  } catch (e) {
    console.error('[webhook] upsertUserByEmail error', e);
    throw e;
  }
}

// ---------- Handler ----------
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // ← Stripeダッシュボードで発行される署名シークレット
    );
  } catch (err) {
    console.error('[webhook] signature verify failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email;
        const customerId = session.customer;
        // どのプランかは line_items を取る or メタデータを見る
        // 最小実装：price -> plan の対応表
        const priceId = session?.metadata?.price_id || null;
        let plan = null;
        if (priceId === process.env.PRICE_ID_LIGHT) plan = 'light';
        if (priceId === process.env.PRICE_ID_STANDARD) plan = 'standard';

        if (email && plan) {
          await upsertUserByEmail(email, plan, customerId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        // 先に customerId -> email を引く（拡張したい場合は顧客オブジェクトから）
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;

        // アクティブかどうかで判定
        const active = sub.status === 'active' || sub.status === 'trialing';
        // 先頭アイテムの price を採用（単一プラン想定）
        const priceId = sub.items?.data?.[0]?.price?.id;
        let plan = null;
        if (active) {
          if (priceId === process.env.PRICE_ID_LIGHT) plan = 'light';
          if (priceId === process.env.PRICE_ID_STANDARD) plan = 'standard';
        }
        if (email) await upsertUserByEmail(email, plan, customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const email = customer.email;
        if (email) await upsertUserByEmail(email, null, sub.customer); // プラン解除
        break;
      }
      default:
        // 必要に応じて他イベントも
        break;
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[webhook] handler error', e);
    res.status(500).send('Internal error');
  }
};

// Vercel（Node/Edge）での生ボディ利用許可
module.exports.config = {
  api: { bodyParser: false },
};