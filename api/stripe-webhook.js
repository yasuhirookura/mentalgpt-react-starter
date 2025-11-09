// /api/stripe-webhook.js
const Stripe = require("stripe");

// Stripe の秘密鍵（本番なら sk_live...）
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Stripe は必ず POST で来る
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // 生ボディを自分で集める
  const chunks = [];
  try {
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
  } catch (err) {
    console.error("[webhook] failed to read body:", err);
    return res.status(400).send("Unable to read body");
  }
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    // 署名検証：ここで失敗すると 400
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ここまで来たら Stripe → あなた の通信はOK
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("[webhook] checkout completed:", session.id, {
          email: session.customer_details?.email,
          metadata: session.metadata,
        });
        // ★本当はここで Firebase 更新とかを書く
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        console.log(
          "[webhook] subscription updated:",
          sub.id,
          sub.status
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        console.log("[webhook] subscription deleted:", sub.id);
        break;
      }
      default: {
        console.log("[webhook] unhandled event:", event.type);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return res.status(500).send("Webhook handler failed");
  }
};

// ←← これが超重要！！ Vercelに「ボディは触るな」と伝える
module.exports.config = {
  api: {
    bodyParser: false,
  },
};