// /api/checkout-email.js
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { session_id } = req.query || {};
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const email =
      session?.customer_details?.email ||
      session?.customer_email ||
      null;

    if (!email) return res.status(404).json({ error: 'email not found' });

    res.status(200).json({ email });
  } catch (e) {
    console.error('[checkout-email]', e);
    res.status(500).json({ error: 'internal error' });
  }
};