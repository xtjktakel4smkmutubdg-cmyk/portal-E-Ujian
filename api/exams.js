import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();

// Get all exams
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('tanggal', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single exam details (with questions for admin)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .single();

        if (examError) throw examError;

        let response = { ...exam };

        if (req.user.role === 'admin') {
            const { data: questions, error: qError } = await supabase
                .from('questions')
                .select('*')
                .eq('exam_id', id);

            if (!qError) {
                response.questions = questions;
            }
        }

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new exam (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { title, durasi, tanggal } = req.body;

        const { data, error } = await supabase
            .from('exams')
            .insert([{ title, durasi, tanggal }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update exam (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, durasi, tanggal } = req.body;

        const { data, error } = await supabase
            .from('exams')
            .update({ title, durasi, tanggal })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete exam (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('exams')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manage questions for exam (Admin only)
router.post('/:id/questions', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const questions = req.body.questions; // Array

        const questionsToInsert = questions.map(q => ({
            exam_id: id,
            ...q
        }));

        const { data, error } = await supabase
            .from('questions')
            .insert(questionsToInsert)
            .select();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Question
router.delete('/questions/:qId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { qId } = req.params;
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', qId);

        if (error) throw error;
        res.json({ message: 'Question deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
