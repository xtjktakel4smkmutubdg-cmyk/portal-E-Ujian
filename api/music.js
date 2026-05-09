import express from 'express';
import { supabase } from './db.js';
import { requireAuth, requireAdmin } from './middleware.js';
import axios from 'axios';
import Form from 'form-data';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Student requests a song
router.post('/request', requireAuth, async (req, res) => {
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
router.get('/requests', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/tracks', requireAuth, async (req, res) => {
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

// Admin uploads track
const UPLOAD_KEY = "AIzaBj7z2z3xBjsk";
const UPLOAD_DOMAIN = 'https://c.termai.cc';

router.post('/upload', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File wajib diupload' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Judul wajib diisi' });

    let ext = 'mp3';
    try {
      const typeInfo = await fileTypeFromBuffer(req.file.buffer);
      if (typeInfo && typeInfo.ext) ext = typeInfo.ext;
    } catch (e) {
      console.warn('Could not determine file type:', e);
    }

    const formData = new Form();
    formData.append('file', req.file.buffer, { filename: 'file.' + ext });

    const response = await axios.post(`${UPLOAD_DOMAIN}/api/upload?key=${UPLOAD_KEY}`, formData, {
      headers: {
        ...formData.getHeaders()
      },
    });

    if (!response.data || !response.data.status) {
       throw new Error('Gagal mengupload ke server storage');
    }

    const audio_url = response.data.path;

    const { data, error } = await supabase
      .from('music_tracks')
      .insert([{ title, audio_url }])
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error upload:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.delete('/tracks/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('music_tracks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/requests/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('music_requests').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin approves/rejects request
router.put('/requests/:id', requireAuth, requireAdmin, async (req, res) => {
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
