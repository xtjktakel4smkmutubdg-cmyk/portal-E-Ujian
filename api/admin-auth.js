import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'portal_ujian_secret_key_123';

// Admin Login — only accepts admin role
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', 'admin')
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Akun admin tidak aktif' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, nama: user.nama, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Log admin login
    await supabase.from('admin_activity_log').insert([{
      admin_id: user.id,
      action: 'LOGIN',
      details: { ip: req.ip, user_agent: req.headers['user-agent'] }
    }]);

    res.json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current admin
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Not an admin token' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nama, username, role')
      .eq('id', decoded.id)
      .eq('role', 'admin')
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(user);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
