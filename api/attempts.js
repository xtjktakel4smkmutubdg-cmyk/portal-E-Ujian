import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();

// Start exam attempt (Siswa)
router.post('/start', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { exam_id } = req.body;

        // Check if exam exists
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', exam_id)
            .single();

        if (examError || !exam) return res.status(404).json({ error: 'Exam not found' });

        // Check for existing active attempt
        const { data: existingAttempt } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('exam_id', exam_id)
            .eq('siswa_id', req.user.id)
            .eq('status', 'in_progress')
            .single();

        if (existingAttempt) {
            return res.json(existingAttempt); // Return existing
        }

        // Create new attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('exam_attempts')
            .insert([{
                exam_id,
                siswa_id: req.user.id,
                status: 'in_progress'
            }])
            .select()
            .single();

        if (attemptError) throw attemptError;
        res.status(201).json(attempt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get questions for active attempt (Siswa) - excludes correct answers
router.get('/:attemptId/questions', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { attemptId } = req.params;

        const { data: attempt } = await supabase
            .from('exam_attempts')
            .select('exam_id, status, siswa_id')
            .eq('id', attemptId)
            .single();

        if (!attempt || attempt.siswa_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, question_text, options') // omit correct_option
            .eq('exam_id', attempt.exam_id);

        if (error) throw error;

        // Get existing answers
        const { data: answers } = await supabase
            .from('attempt_answers')
            .select('question_id, selected_option')
            .eq('attempt_id', attemptId);

        res.json({ questions, answers: answers || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit/update answer for a question
router.post('/:attemptId/answer', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { question_id, selected_option } = req.body;

        const { data: attempt } = await supabase
            .from('exam_attempts')
            .select('status, siswa_id')
            .eq('id', attemptId)
            .single();

        if (!attempt || attempt.siswa_id !== req.user.id || attempt.status !== 'in_progress') {
            return res.status(400).json({ error: 'Invalid or completed attempt' });
        }

        // Upsert answer
        const { error } = await supabase
            .from('attempt_answers')
            .upsert({
                attempt_id: attemptId,
                question_id,
                selected_option
            }, { onConflict: 'attempt_id,question_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Finish attempt
router.post('/:attemptId/finish', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { attemptId } = req.params;

        const { data: attempt } = await supabase
            .from('exam_attempts')
            .select('*, exam:exams(*)')
            .eq('id', attemptId)
            .single();

        if (!attempt || attempt.siswa_id !== req.user.id || attempt.status !== 'in_progress') {
            return res.status(400).json({ error: 'Invalid or completed attempt' });
        }

        // Calculate score
        const { data: answers } = await supabase
            .from('attempt_answers')
            .select('*, question:questions(correct_option)')
            .eq('attempt_id', attemptId);

        let correctCount = 0;
        if (answers) {
            answers.forEach(ans => {
                if (ans.selected_option === ans.question.correct_option) {
                    correctCount++;
                }
            });
        }

        const { data: questions } = await supabase
            .from('questions')
            .select('id', { count: 'exact' })
            .eq('exam_id', attempt.exam_id);

        const totalQuestions = questions ? questions.length : 1;
        const score = (correctCount / totalQuestions) * 100;

        // Update attempt
        const { data: finalAttempt, error } = await supabase
            .from('exam_attempts')
            .update({
                status: 'completed',
                end_time: new Date().toISOString(),
                score: score
            })
            .eq('id', attemptId)
            .select()
            .single();

        if (error) throw error;
        res.json(finalAttempt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user attempt history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('exam_attempts').select('*, exam:exams(title)');

        if (req.user.role === 'siswa') {
            query = query.eq('siswa_id', req.user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
