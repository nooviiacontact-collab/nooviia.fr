require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Nooviia API OK' }));

app.get('/api/vendors', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vendors').select('*').eq('active', true);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/ads', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ads').insert([req.body]).select();
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { error } = await supabase.from('contacts').insert([req.body]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`🚀 Nooviia sur http://localhost:${PORT}`);
  console.log(`📁 Fichiers statiques: ${path.join(__dirname, 'public')}`);
});
