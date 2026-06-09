const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email, password, name, type } = req.body;

  if (action === 'register') {
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { name, type: type || 'client' },
      email_confirm: true
    });
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, user: data.user });
  }

  if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, user: data.user, session: data.session });
  }
};
