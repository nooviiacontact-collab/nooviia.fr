const { createClient } = require('@supabase/supabase-js');

module.exports = (req, res) => {
  res.json({ success: true, message: 'Nooviia API opérationnelle', version: '1.0.0' });
};
