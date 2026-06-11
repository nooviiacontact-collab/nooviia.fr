const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { email } = req.body;
      
      // Debug: log env vars presence
      console.log('STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
      console.log('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 8));
      console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);

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
      console.error('Stripe full error:', JSON.stringify(err, null, 2));
      return res.status(500).json({ success: false, error: err.message, type: err.type, code: err.code });
    }
  }
};
