import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from './db.js';
import { authenticateToken, requireAdmin } from './middleware.js';

const router = express.Router();

// Get all users (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, kelas, search } = req.query;
    let query = supabase
      .from('users')
      .select('id, nama, username, role, kelas, no_peserta, is_active, created_at')
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (kelas) query = query.eq('kelas', kelas);
    if (search) query = query.or(`nama.ilike.%${search}%,username.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user (Admin)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, username, role, kelas, no_peserta, is_active, created_at')
      .eq('id', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (Admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nama, username, password, role, kelas, no_peserta } = req.body;
    if (!nama || !username || !password) {
      return res.status(400).json({ error: 'Nama, username, dan password harus diisi' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ nama, username, password: hashedPassword, role: role || 'siswa', kelas, no_peserta }])
      .select('id, nama, username, role, kelas, no_peserta')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Username sudah digunakan' });
      throw error;
    }

    await supabase.from('admin_activity_log').insert([{
      admin_id: req.user.id, action: 'CREATE_USER',
      details: { user_id: data.id, username, role: role || 'siswa' }
    }]);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk create users (Admin)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Data users harus berupa array' });
    }

    const salt = await bcrypt.genSalt(10);
    const toInsert = await Promise.all(users.map(async (u) => ({
      nama: u.nama,
      username: u.username,
      password: await bcrypt.hash(u.password || 'password123', salt),
      role: u.role || 'siswa',
      kelas: u.kelas || null,
      no_peserta: u.no_peserta || null,
    })));

    const { data, error } = await supabase
      .from('users').insert(toInsert)
      .select('id, nama, username, role, kelas, no_peserta');

    if (error) throw error;

    await supabase.from('admin_activity_log').insert([{
      admin_id: req.user.id, action: 'BULK_CREATE_USERS',
      details: { count: data.length }
    }]);

    res.status(201).json({ created: data.length, users: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (Admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, username, role, password, kelas, no_peserta, is_active } = req.body;
    const updates = {};
    if (nama !== undefined) updates.nama = nama;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (kelas !== undefined) updates.kelas = kelas;
    if (no_peserta !== undefined) updates.no_peserta = no_peserta;
    if (is_active !== undefined) updates.is_active = is_active;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('users').update(updates).eq('id', id)
      .select('id, nama, username, role, kelas, no_peserta, is_active')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change admin password
router.put('/admin/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const { data: admin } = await supabase
      .from('users').select('password').eq('id', req.user.id).single();

    const valid = await bcrypt.compare(current_password, admin.password);
    if (!valid) return res.status(400).json({ error: 'Password lama salah' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(new_password, salt);

    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
