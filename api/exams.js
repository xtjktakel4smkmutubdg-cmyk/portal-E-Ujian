import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireAdmin } from './middleware.js';

const router = express.Router();

// Get all exams (admin gets all, student gets active + in schedule)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('exams').select('*').order('tanggal_mulai', { ascending: false });

    if (req.user.role === 'siswa') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    // For students, also fetch their sessions to show status
    if (req.user.role === 'siswa' && data.length > 0) {
      const { data: sessions } = await supabase
        .from('exam_sessions')
        .select('exam_id, is_submitted, total_score, percentage, is_passed')
        .eq('user_id', req.user.id);

      const sessionMap = {};
      (sessions || []).forEach(s => {
        if (!sessionMap[s.exam_id]) sessionMap[s.exam_id] = [];
        sessionMap[s.exam_id].push(s);
      });

      data.forEach(exam => {
        exam.my_sessions = sessionMap[exam.id] || [];
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single exam
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (req.user.role === 'admin') {
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', id)
        .order('nomor_urut', { ascending: true });
      exam.questions = questions || [];

      // Count sessions
      const { count } = await supabase
        .from('exam_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', id)
        .eq('is_submitted', true);
      exam.total_submissions = count || 0;
    }

    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create exam (Admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, mata_pelajaran, durasi, tanggal_mulai, tanggal_selesai,
            show_result_to_student, shuffle_questions, shuffle_options, max_attempts, passing_grade, study_material_url } = req.body;

    const { data, error } = await supabase
      .from('exams')
      .insert([{
        title, description, mata_pelajaran, durasi,
        tanggal_mulai, tanggal_selesai,
        show_result_to_student: show_result_to_student || false,
        shuffle_questions: shuffle_questions !== false,
        shuffle_options: shuffle_options !== false,
        max_attempts: max_attempts || 1,
        passing_grade: passing_grade || 0,
        study_material_url: study_material_url || null,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase.from('admin_activity_log').insert([{
      admin_id: req.user.id, action: 'CREATE_EXAM',
      details: { exam_id: data.id, title }
    }]);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update exam (Admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const fields = ['title', 'description', 'mata_pelajaran', 'durasi', 'tanggal_mulai',
                    'tanggal_selesai', 'is_active', 'show_result_to_student', 'shuffle_questions',
                    'shuffle_options', 'max_attempts', 'passing_grade', 'study_material_url'];
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const { data, error } = await supabase
      .from('exams').update(updates).eq('id', id).select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete exam (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Ujian berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add questions (Admin)
router.post('/:id/questions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    // Get current max nomor_urut
    const { data: existing } = await supabase
      .from('questions').select('nomor_urut').eq('exam_id', id)
      .order('nomor_urut', { ascending: false }).limit(1);

    let startOrder = (existing && existing.length > 0) ? existing[0].nomor_urut + 1 : 1;

    const toInsert = questions.map((q, i) => ({
      exam_id: id,
      question_text: q.question_text,
      option_a: q.option_a || null,
      option_b: q.option_b || null,
      option_c: q.option_c || null,
      option_d: q.option_d || null,
      option_e: q.option_e || null,
      correct_answer: q.correct_answer,
      tipe: q.tipe || 'mcq',
      bobot: q.bobot || 1,
      nomor_urut: startOrder + i,
      image_url: q.image_url || null,
    }));

    const { data, error } = await supabase.from('questions').insert(toInsert).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update question (Admin)
router.put('/questions/:qId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { qId } = req.params;
    const updates = {};
    const fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
                    'correct_answer', 'tipe', 'bobot', 'nomor_urut', 'image_url'];
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const { data, error } = await supabase.from('questions').update(updates).eq('id', qId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete question (Admin)
router.delete('/questions/:qId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { qId } = req.params;
    const { error } = await supabase.from('questions').delete().eq('id', qId);
    if (error) throw error;
    res.json({ message: 'Soal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get exam results (Admin)
router.get('/:id/results', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('*, users(nama, username, kelas, no_peserta)')
      .eq('exam_id', id)
      .eq('is_submitted', true)
      .order('finished_at', { ascending: false });

    if (error) throw error;

    // Get violation counts per session
    for (let session of sessions) {
      const { data: violations } = await supabase
        .from('exam_violations')
        .select('violation_type, description, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });
      session.violations = violations || [];
    }

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed answers for a session (Admin)
router.get('/session/:sessionId/answers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data, error } = await supabase
      .from('answers')
      .select('*, questions(question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, tipe, bobot)')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Duplicate an exam along with its questions
router.post('/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the original exam
    const { data: originalExam, error: fetchError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalExam) {
      return res.status(404).json({ error: 'Ujian tidak ditemukan' });
    }

    // Prepare duplicate exam data
    const duplicateExamData = { ...originalExam };
    delete duplicateExamData.id;
    delete duplicateExamData.created_at;
    duplicateExamData.title = duplicateExamData.title + ' (Copy)';
    duplicateExamData.is_active = false; // Duplicated exams are inactive by default

    // Insert duplicated exam
    const { data: newExam, error: insertExamError } = await supabase
      .from('exams')
      .insert([duplicateExamData])
      .select()
      .single();

    if (insertExamError) throw insertExamError;

    // Fetch original questions
    const { data: originalQuestions, error: fetchQError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', id);

    if (fetchQError) throw fetchQError;

    // Duplicate questions if any
    if (originalQuestions && originalQuestions.length > 0) {
      const duplicatedQuestions = originalQuestions.map(q => {
        const { id, created_at, ...qData } = q;
        return {
          ...qData,
          exam_id: newExam.id
        };
      });

      const { error: insertQError } = await supabase
        .from('questions')
        .insert(duplicatedQuestions);

      if (insertQError) throw insertQError;
    }

    res.status(201).json(newExam);
  } catch (error) {
    console.error('Error duplicating exam:', error);
    res.status(500).json({ error: 'Gagal menduplikasi ujian' });
  }
});

export default router;
