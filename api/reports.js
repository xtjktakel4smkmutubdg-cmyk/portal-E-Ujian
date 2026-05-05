import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();

// Helper for Predicate
const getPredicate = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
};

// Get Raport for Siswa
router.get('/my-report', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { data: attempts, error } = await supabase
            .from('exam_attempts')
            .select('*, exam:exams(title)')
            .eq('siswa_id', req.user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let totalScore = 0;
        const reportList = attempts.map(attempt => {
            const finalScore = attempt.manual_score !== null ? attempt.manual_score : attempt.score;
            totalScore += Number(finalScore);
            return {
                id: attempt.id,
                exam_title: attempt.exam?.title,
                original_score: attempt.score,
                final_score: finalScore,
                predicate: getPredicate(finalScore),
                notes: attempt.notes,
                date: attempt.end_time
            };
        });

        const average_score = reportList.length > 0 ? (totalScore / reportList.length) : 0;

        res.json({
            student_name: req.user.name,
            average_score: average_score,
            average_predicate: getPredicate(average_score),
            total_exams: reportList.length,
            details: reportList
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all students reports (Guru/Admin)
router.get('/students', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        // Fetch users who are siswa
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('role', 'siswa');

        if (studentError) throw studentError;

        // Fetch their attempts
        const { data: attempts, error: attemptError } = await supabase
            .from('exam_attempts')
            .select('*, exam:exams(title)')
            .eq('status', 'completed');

        if (attemptError) throw attemptError;

        const result = students.map(student => {
            const studentAttempts = attempts.filter(a => a.siswa_id === student.id);
            let totalScore = 0;

            const detailAttempts = studentAttempts.map(a => {
                const finalScore = a.manual_score !== null ? a.manual_score : a.score;
                totalScore += Number(finalScore);
                return {
                    id: a.id,
                    exam_title: a.exam?.title,
                    original_score: a.score,
                    final_score: finalScore,
                    notes: a.notes,
                    date: a.end_time
                };
            });

            const average_score = detailAttempts.length > 0 ? (totalScore / detailAttempts.length) : 0;

            return {
                ...student,
                average_score,
                average_predicate: getPredicate(average_score),
                total_exams: detailAttempts.length,
                attempts: detailAttempts
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update manual score and notes (Guru/Admin)
router.put('/attempt/:id', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { manual_score, notes } = req.body;

        const { data, error } = await supabase
            .from('exam_attempts')
            .update({
                manual_score: manual_score !== '' ? manual_score : null,
                notes: notes
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
