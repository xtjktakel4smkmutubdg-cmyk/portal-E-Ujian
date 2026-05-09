import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireAdmin } from './middleware.js';
import axios from 'axios';
import Form from 'form-data';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Student requests a song
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { song_title } = req.body;
    if (!song_title) return res.status(400).json({ error: 'Judul lagu wajib diisi' });

    const { data, error } = await supabase
      .from('music_requests')
      .insert([{ user_id: req.user.id, song_title }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin lists requests
router.get('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('music_requests')
      .select(`*, users (nama, kelas)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Everyone lists tracks
router.get('/tracks', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin saves track (bypassing Vercel limits by uploading from client)
router.post('/save-track', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, audio_url } = req.body;
    if (!title || !audio_url) return res.status(400).json({ error: 'Judul dan URL wajib diisi' });

    const { data, error } = await supabase
      .from('music_tracks')
      .insert([{ title, audio_url }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tracks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('music_tracks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('music_requests').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin approves/rejects request
router.put('/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const { error } = await supabase.from('music_requests').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
