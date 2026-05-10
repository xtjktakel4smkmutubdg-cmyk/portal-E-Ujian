import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireAdmin } from './middleware.js';

const router = express.Router();

// Get all settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');
    
    if (error) throw error;
    
    // Transform to object for easier use
    const settings = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.post('/update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // Expecting { key: value, key2: value2 }
    if (!settings) return res.status(400).json({ error: 'Settings wajib diisi' });

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value === null ? null : String(value),
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('settings')
        .upsert(update, { onConflict: 'key' });
      
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
