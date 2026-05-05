import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();

// Get all exams (Siswa sees all, Guru sees their own, Admin sees all)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('exams').select('*, guru:guru_id(name)');

        if (req.user.role === 'guru') {
            query = query.eq('guru_id', req.user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single exam details (and questions if guru/admin)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*, guru:guru_id(name)')
            .eq('id', id)
            .single();

        if (examError) throw examError;

        let response = { ...exam };

        // Include questions if user is guru who created it or admin
        if (req.user.role === 'admin' || (req.user.role === 'guru' && exam.guru_id === req.user.id)) {
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

// Create new exam (Guru/Admin only)
router.post('/', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { title, description, duration_minutes, max_questions } = req.body;

        const { data, error } = await supabase
            .from('exams')
            .insert([{
                title,
                description,
                duration_minutes,
                max_questions,
                guru_id: req.user.id
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add questions to exam (Guru/Admin only)
router.post('/:id/questions', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const questions = req.body.questions; // Array of { question_text, options, correct_option }

        // Verify ownership
        const { data: exam } = await supabase.from('exams').select('guru_id').eq('id', id).single();
        if (!exam || (req.user.role === 'guru' && exam.guru_id !== req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized to add questions to this exam' });
        }

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

export default router;
