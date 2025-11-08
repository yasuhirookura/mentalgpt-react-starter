// /api/stripe-webhook.js
// Stripe → (このファイル) → Firebase に自動反映するWebhookエンドポイント

const getRawBody = require('raw-body');
const Stripe = require('stripe');
const admin = require('firebase-admin');

// --------------- Stripe 初期化 ---------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
apiVersion: '2024-06-20', // あなたのダッシュボードのAPIバージョンに近ければOK
});

// --------------- Firebase Admin 初期化 ---------------
if (!admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert({
projectId: process.env.FIREBASE_PROJECT_ID,
clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
// Vercelに入れるときに \n がエスケープされるので戻す
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}),
});
}

const auth = admin.auth();
const db = admin.firestore();

// --------------- 共通: Firebase にユーザーを作る/更新するヘルパー ---------------
async function upsertUserByEmail(email, plan, stripeCustomerId) {
try {
// 1) まず、そのメールのユーザーがいるか探す
let userRecord;
try {
userRecord = await auth.getUserByEmail(email);
} catch (e) {
// 見つからないときだけ作成
userRecord = await auth.createUser({
email,
emailVerified: true, // Stripe決済済みなのでtrueでOKとする
});
}

// 2) カスタムクレームにプランを入れておくと、フロントで「この人はlight」って読める
await auth.setCustomUserClaims(userRecord.uid, {
plan: plan, // 'light' | 'standard' | null
});

// 3) Firestoreにも保存しておく（ダッシュボードで見たいとき用）
await db
.collection('users')
.doc(userRecord.uid)
.set(
{
email,
plan,
stripeCustomerId: stripeCustomerId || null,
updatedAt: admin.firestore.FieldValue.serverTimestamp(),
},
{ merge: true }
);

console.log('[webhook] upserted user for', email, 'plan=', plan);
return userRecord.uid;
} catch (e) {
console.error('[webhook] upsertUserByEmail error', e);
throw e;
}
}

// --------------- 実際のWebhookハンドラ ---------------
module.exports = async (req, res) => {
if (req.method !== 'POST') {
return res.status(405).send('Method Not Allowed');
}

// Stripeの署名検証
let event;
try {
const sig = req.headers['stripe-signature'];
const buf = await getRawBody(req);

event = stripe.webhooks.constructEvent(
buf,
sig,
process.env.STRIPE_WEBHOOK_SECRET // ← Stripeダッシュボードで発行した whsec_... をVercelに入れておく
);
} catch (err) {
console.error('[webhook] signature verify failed', err.message);
return res.status(400).send(`Webhook Error: ${err.message}`);
}

try {
switch (event.type) {
// ① Checkoutが最後まで通ったとき（Apple Pay もここに来る）
case 'checkout.session.completed': {
const session = event.data.object;
const email = session.customer_details?.email || session.customer_email;
const customerId = session.customer;
// create-checkout-session.js で metadata に入れておいたものを読む
const priceIdFromMeta = session.metadata?.price_id || null;

// price_id → plan の対応づけ
let plan = null;
if (priceIdFromMeta === process.env.PRICE_ID_LIGHT) plan = 'light';
if (priceIdFromMeta === process.env.PRICE_ID_STANDARD) plan = 'standard';

if (email && plan) {
await upsertUserByEmail(email, plan, customerId);
} else {
console.warn('[webhook] checkout.completed but missing email or plan', {
email,
plan,
priceIdFromMeta,
});
}
break;
}

// ② サブスク状態が変わったとき（無料期間→有効、カード更新などもここ）
case 'customer.subscription.updated': {
const sub = event.data.object;
const customerId = sub.customer;

// 顧客情報からメールを取得
const customer = await stripe.customers.retrieve(customerId);
const email = customer.email;

// アクティブ判定
const isActive = sub.status === 'active' || sub.status === 'trialing';

// 今回のサブスクがどのpriceかを見る（1つだけ想定）
const priceId = sub.items?.data?.[0]?.price?.id;
let plan = null;
if (isActive) {
if (priceId === process.env.PRICE_ID_LIGHT) plan = 'light';
if (priceId === process.env.PRICE_ID_STANDARD) plan = 'standard';
} else {
// active じゃなければプランなしに落とす
plan = null;
}

if (email) {
await upsertUserByEmail(email, plan, customerId);
}
break;
}

// ③ 解約されたとき
case 'customer.subscription.deleted': {
const sub = event.data.object;
const customerId = sub.customer;
const customer = await stripe.customers.retrieve(customerId);
const email = customer.email;
if (email) {
// プランを null にする
await upsertUserByEmail(email, null, customerId);
}
break;
}

default: {
// 他のイベントはとりあえず無視
console.log('[webhook] unhandled event type', event.type);
}
}

// Stripeに「受け取ったよ」と返す
res.json({ received: true });
} catch (e) {
console.error('[webhook] handler error', e);
res.status(500).send('Internal error');
}