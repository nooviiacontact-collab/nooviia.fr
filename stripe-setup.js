require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function setup() {
  try {
    // Créer le produit
    const product = await stripe.products.create({
      name: 'Nooviia Pro — Abonnement Prestataire',
      description: 'Accès complet à la plateforme Nooviia. Badge vérifié, annonces illimitées, 0% commission.',
    });
    console.log('✅ Produit créé:', product.id);

    // Créer le prix 28€/mois
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2800, // 28€ en centimes
      currency: 'eur',
      recurring: { interval: 'month' },
    });
    console.log('✅ Prix créé:', price.id);
    console.log('\n📋 Ajoute cette ligne dans ton .env :');
    console.log('STRIPE_PRICE_ID=' + price.id);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

setup();
