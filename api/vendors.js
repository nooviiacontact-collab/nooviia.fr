const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('vendors').select('*').eq('active', true);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('vendors').insert([req.body]).select();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data: data[0] });
  }
};
