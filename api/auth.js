import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'portal_ujian_secret_key_123';

router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role && ['admin', 'guru', 'siswa'].includes(role) ? role : 'siswa';

        const { data, error } = await supabase
            .from('users')
            .insert([{ email, password_hash, name, role: userRole }])
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: data.id, role: data.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: data.id, name: data.name, email: data.email, role: data.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
