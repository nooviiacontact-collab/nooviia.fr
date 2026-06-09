require('dotenv').config();
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

// Créer une session de paiement (checkout)
router.post('/create-checkout', async (req, res) => {
  try {
    const { vendor_id, email, name } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      metadata: { vendor_id },
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/vendor-register?payment=cancel`,
    });
    res.json({ success: true, url: session.url, session_id: session.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vérifier le statut d'un abonnement
router.get('/subscription/:vendor_id', async (req, res) => {
  try {
    const { data: vendor } = await supabase
      .from('vendors').select('stripe_subscription_id, subscription_status')
      .eq('id', req.params.vendor_id).single();
    if (!vendor) return res.status(404).json({ success: false, error: 'Prestataire introuvable' });
    res.json({ success: true, status: vendor.subscription_status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Résilier un abonnement
router.post('/cancel/:vendor_id', async (req, res) => {
  try {
    const { data: vendor } = await supabase
      .from('vendors').select('stripe_subscription_id')
      .eq('id', req.params.vendor_id).single();
    if (!vendor?.stripe_subscription_id) {
      return res.status(404).json({ success: false, error: 'Abonnement introuvable' });
    }
    await stripe.subscriptions.update(vendor.stripe_subscription_id, {
      cancel_at_period_end: true
    });
    await supabase.from('vendors').update({ subscription_status: 'canceling' })
      .eq('id', req.params.vendor_id);
    res.json({ success: true, message: 'Abonnement résilié à la fin de la période' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook Stripe (événements automatiques)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook invalide' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const vendor_id = session.metadata.vendor_id;
      await supabase.from('vendors').update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_status: 'active',
        verified: true
      }).eq('id', vendor_id);
      console.log('✅ Abonnement activé pour vendor:', vendor_id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await supabase.from('vendors').update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await supabase.from('vendors').update({
        subscription_status: 'inactive',
        verified: false,
        active: false
      }).eq('stripe_subscription_id', sub.id);
      break;
    }
  }
  res.json({ received: true });
});

module.exports = router;
