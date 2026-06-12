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
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email requis' });
      }

      // Find the Stripe customer by email
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (!customers.data.length) {
        return res.status(404).json({ success: false, error: 'Aucun abonnement trouvé pour cet email' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: 'https://nooviiafr.vercel.app/dashboard',
      });

      return res.json({ success: true, url: session.url });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message, type: err.type });
    }
  }
};
