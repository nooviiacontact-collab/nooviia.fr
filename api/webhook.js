const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient()
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    if (email) {
      await supabase.from('vendors')
        .update({ stripe_customer_id: customerId, subscription_status: 'active' })
        .eq('email', email);
    }
  }

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.paused') {
    const customerId = session.customer;
    await supabase.from('vendors')
      .update({ subscription_status: 'inactive' })
      .eq('stripe_customer_id', customerId);
  }

  if (event.type === 'customer.subscription.resumed' || event.type === 'invoice.payment_succeeded') {
    const customerId = session.customer;
    await supabase.from('vendors')
      .update({ subscription_status: 'active' })
      .eq('stripe_customer_id', customerId);
  }

  return res.json({ received: true });
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
