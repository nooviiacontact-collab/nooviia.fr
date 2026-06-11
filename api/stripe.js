const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient()
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { email } = req.body;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email,
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: 'https://nooviiafr.vercel.app/dashboard?subscribed=true',
        cancel_url: 'https://nooviiafr.vercel.app/tarifs',
      });
      return res.json({ success: true, url: session.url });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message, type: err.type });
    }
  }
};
