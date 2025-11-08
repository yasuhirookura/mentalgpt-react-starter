// /api/stripe-webhook.js
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel で Stripe Webhook を受けるときは bodyParser を切る
// Next.js 形式でも Vercel の Node でもこの書き方でOK
module.exports = async (req, res) => {
// Stripe は POST でしか来ない
if (req.method !== 'POST') {
return res.status(200).json({ ok: true });
}

const sig = req.headers['stripe-signature'];
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 生ボディを自分で集める
const chunks = [];
try {
for await (const chunk of req) {
chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
}
} catch (err) {
console.error('[webhook] failed to read body:', err);
return res.status(400).send('Unable to read body');
}
const rawBody = Buffer.concat(chunks);

let event;
try {
// ここで署名を検証する
event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
} catch (err) {
console.error('[webhook] signature verify failed:', err.message);
return res.status(400).send(`Webhook Error: ${err.message}`);
}

// ここまで来たら Stripe → あなた の通信はOK
// あとは event.type ごとに処理する
try {
switch (event.type) {
case 'checkout.session.completed': {
const session = event.data.object;
// ここで session.customer_email や session.metadata を使って
// Firebase で「このユーザーは有料プランにしたよ」って記録する想定
console.log('[webhook] checkout completed:', session.id);
break;
}

case 'customer.subscription.updated': {
const sub = event.data.object;
console.log('[webhook] subscription updated:', sub.id, sub.status);
break;
}

case 'customer.subscription.deleted': {
const sub = event.data.object;
console.log('[webhook] subscription deleted:', sub.id);
break;
}

default: {
// 使ってないイベントは黙ってOK返す
console.log('[webhook] unhandled event:', event.type);
}
}

// Stripe に「受け取ったよ」と返す
return res.status(200).json({ received: true });
} catch (err) {
console.error('[webhook] handler error:', err);
return res.status(500).send('Webhook handler failed');
}
};