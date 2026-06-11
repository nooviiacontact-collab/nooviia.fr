module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Test connexion Stripe sans appel API
  const key = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  
  // Test réseau vers Stripe
  let networkTest = 'not tested';
  try {
    const response = await fetch('https://api.stripe.com/v1/charges', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` }
    });
    networkTest = `HTTP ${response.status}`;
  } catch (e) {
    networkTest = `FAILED: ${e.message}`;
  }
  
  res.json({
    key_present: !!key,
    key_prefix: key?.substring(0, 12),
    price_id: priceId,
    network_to_stripe: networkTest,
    node_version: process.version,
    region: process.env.VERCEL_REGION
  });
};
