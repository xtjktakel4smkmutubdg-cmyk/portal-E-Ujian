import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();

// Get questions for a student taking an exam
router.get('/exam/:examId/questions', authenticateToken, async (req, res) => {
    try {
        const { examId } = req.params;

        // Don't return correct_answer to students
        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, exam_id, question_text, option_a, option_b, option_c, option_d, option_e, tipe')
            .eq('exam_id', examId);

        if (error) throw error;
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit answers
router.post('/exam/:examId/submit', authenticateToken, async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body; // { [questionId]: 'A', [questionId2]: 'essay answer' }
        const userId = req.user.id;

        // Fetch questions to score MCQ
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('*')
            .eq('exam_id', examId);

        if (qError) throw qError;

        let inserts = [];

        for (let q of questions) {
            let answer = answers[q.id] || null;
            let score = 0;

            if (q.tipe === 'mcq' && answer === q.correct_answer) {
                score = 1;
            }

            inserts.push({
                user_id: userId,
                exam_id: examId,
                question_id: q.id,
                answer: answer,
                score: score
            });
        }

        // Remove existing answers to allow retakes, or block retakes
        await supabase
            .from('answers')
            .delete()
            .eq('user_id', userId)
            .eq('exam_id', examId);

        const { error: insertError } = await supabase
            .from('answers')
            .insert(inserts);

        if (insertError) throw insertError;

        res.json({ message: 'Exam submitted successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user results for a specific exam
router.get('/exam/:examId/results/me', authenticateToken, async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('answers')
            .select('id, question_id, answer, score, questions(question_text, correct_answer, tipe)')
            .eq('exam_id', examId)
            .eq('user_id', userId);

        if (error) throw error;

        const totalScore = data.reduce((sum, item) => sum + Number(item.score || 0), 0);

        res.json({
            answers: data,
            totalScore
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all results for an exam
router.get('/exam/:examId/results', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { examId } = req.params;

        const { data, error } = await supabase
            .from('answers')
            .select('id, user_id, answer, score, users(nama, username), questions(id, question_text, tipe, correct_answer)')
            .eq('exam_id', examId);

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Grade an essay
router.post('/grade/:answerId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { answerId } = req.params;
        const { score } = req.body;

        const { error } = await supabase
            .from('answers')
            .update({ score })
            .eq('id', answerId);

        if (error) throw error;
        res.json({ message: 'Graded successfully' });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
});

export default router;
