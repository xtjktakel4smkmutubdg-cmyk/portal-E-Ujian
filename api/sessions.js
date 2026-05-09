import express from 'express';
import { supabase } from './db.js';
import { authenticateToken, requireStudent } from './middleware.js';

const router = express.Router();

// Helper: shuffle array (Fisher-Yates)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Start exam session
router.post('/start', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { exam_id } = req.body;
    const userId = req.user.id;

    // Get exam
    const { data: exam, error: examErr } = await supabase
      .from('exams').select('*').eq('id', exam_id).single();
    if (examErr || !exam) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    // Check if exam is active and within schedule
    const now = new Date();
    const mulai = new Date(exam.tanggal_mulai);
    const selesai = new Date(exam.tanggal_selesai);

    if (!exam.is_active) return res.status(403).json({ error: 'Ujian tidak aktif' });
    if (now < mulai) return res.status(403).json({ error: 'Ujian belum dimulai' });
    if (now > selesai) return res.status(403).json({ error: 'Ujian sudah berakhir' });

    // Check max attempts
    const { count } = await supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('exam_id', exam_id)
      .eq('is_submitted', true);

    if (count >= exam.max_attempts) {
      return res.status(403).json({ error: `Anda sudah mencapai batas percobaan (${exam.max_attempts}x)` });
    }

    // Check for existing unsubmitted session
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', exam_id)
      .eq('is_submitted', false)
      .single();

    if (existingSession) {
      // Resume existing session
      return res.json({ session: existingSession, resumed: true });
    }

    // Create new session
    const { data: session, error: sessionErr } = await supabase
      .from('exam_sessions')
      .insert([{
        user_id: userId,
        exam_id: exam_id,
        ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      }])
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    res.status(201).json({ session, resumed: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get questions for session (one at a time, shuffled, no correct_answer)
router.get('/:sessionId/questions', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const { data: session, error: sErr } = await supabase
      .from('exam_sessions')
      .select('*, exams(*)')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (sErr || !session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    if (session.is_submitted) return res.status(403).json({ error: 'Ujian sudah disubmit' });

    // Check time limit
    const startedAt = new Date(session.started_at);
    const elapsed = (Date.now() - startedAt.getTime()) / 1000;
    const timeLimit = session.exams.durasi * 60;

    if (elapsed > timeLimit) {
      // Auto-submit
      await autoSubmitSession(sessionId, session.exam_id);
      return res.status(403).json({ error: 'Waktu ujian sudah habis. Ujian telah otomatis disubmit.' });
    }

    // Get questions
    let { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, exam_id, question_text, option_a, option_b, option_c, option_d, option_e, tipe, nomor_urut, image_url')
      .eq('exam_id', session.exam_id)
      .order('nomor_urut', { ascending: true });

    if (qErr) throw qErr;

    // Shuffle questions if enabled
    if (session.exams.shuffle_questions) {
      questions = shuffleArray(questions);
    }

    // Shuffle options if enabled (DISABLED due to scoring mismatch bug)
    /*
    if (session.exams.shuffle_options) {
      questions = questions.map(q => {
        if (q.tipe !== 'mcq') return q;
        const options = [
          { key: 'A', val: q.option_a },
          { key: 'B', val: q.option_b },
          { key: 'C', val: q.option_c },
          { key: 'D', val: q.option_d },
          { key: 'E', val: q.option_e },
        ].filter(o => o.val);

        const shuffled = shuffleArray(options);
        const result = { ...q, option_a: null, option_b: null, option_c: null, option_d: null, option_e: null };
        const keys = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'];
        shuffled.forEach((o, i) => { result[keys[i]] = o.val; });
        // Store mapping for scoring
        result._option_map = {};
        shuffled.forEach((o, i) => {
          result._option_map[String.fromCharCode(65 + i)] = o.key;
        });
        return result;
      });
    }
    */

    // Get existing answers
    const { data: existingAnswers } = await supabase
      .from('answers')
      .select('question_id, answer')
      .eq('session_id', sessionId);

    const answerMap = {};
    (existingAnswers || []).forEach(a => { answerMap[a.question_id] = a.answer; });

    const remainingSeconds = Math.max(0, Math.floor(timeLimit - elapsed));

    res.json({
      questions,
      existing_answers: answerMap,
      remaining_seconds: remainingSeconds,
      exam: {
        title: session.exams.title,
        durasi: session.exams.durasi,
        total_questions: questions.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save answer for a single question (auto-save)
router.post('/:sessionId/answer', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question_id, answer, time_spent_seconds } = req.body;

    // Verify session
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('id, user_id, is_submitted')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    if (session.is_submitted) return res.status(403).json({ error: 'Ujian sudah disubmit' });

    // Upsert answer
    const { data, error } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        question_id,
        answer,
        time_spent_seconds: time_spent_seconds || 0,
        answered_at: new Date().toISOString()
      }, { onConflict: 'session_id,question_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit exam
router.post('/:sessionId/submit', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await finalizeSession(sessionId, req.user.id, false);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record violation
router.post('/:sessionId/violation', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { violation_type, description } = req.body;

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('id, user_id, violation_count, exam_id')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    // Insert violation
    await supabase.from('exam_violations').insert([{
      session_id: sessionId,
      violation_type,
      description
    }]);

    // Increment violation count
    const newCount = (session.violation_count || 0) + 1;
    await supabase.from('exam_sessions')
      .update({ violation_count: newCount })
      .eq('id', sessionId);

    // Auto-submit after 5 violations
    if (newCount >= 5) {
      await autoSubmitSession(sessionId, session.exam_id);
      return res.json({ violation_count: newCount, auto_submitted: true, message: 'Ujian disubmit otomatis karena pelanggaran berlebihan' });
    }

    res.json({ violation_count: newCount, auto_submitted: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my results for an exam
router.get('/exam/:examId/my-results', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { examId } = req.params;

    // Check if show_result_to_student
    const { data: exam } = await supabase
      .from('exams').select('show_result_to_student, title').eq('id', examId).single();

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', req.user.id)
      .eq('is_submitted', true)
      .order('finished_at', { ascending: false });

    if (!sessions || sessions.length === 0) {
      return res.json({ has_result: false });
    }

    const latestSession = sessions[0];

    if (!exam.show_result_to_student) {
      return res.json({
        has_result: true,
        show_details: false,
        message: 'Hasil ujian tidak ditampilkan oleh penyelenggara',
        submitted_at: latestSession.finished_at,
        attempts: sessions.length
      });
    }

    // Get answers
    const { data: answers } = await supabase
      .from('answers')
      .select('*, questions(question_text, correct_answer, tipe, bobot, option_a, option_b, option_c, option_d, option_e)')
      .eq('session_id', latestSession.id);

    res.json({
      has_result: true,
      show_details: true,
      session: latestSession,
      answers: answers || [],
      exam_title: exam.title
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Helper Functions ===

async function finalizeSession(sessionId, userId, isAutoSubmit = false) {
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*, exams(*)')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (!session) throw new Error('Sesi tidak ditemukan');
  if (session.is_submitted) throw new Error('Ujian sudah disubmit sebelumnya');

  // Get all questions and answers
  const { data: questions } = await supabase
    .from('questions').select('*').eq('exam_id', session.exam_id);

  const { data: answers } = await supabase
    .from('answers').select('*').eq('session_id', sessionId);

  const answerMap = {};
  (answers || []).forEach(a => { answerMap[a.question_id] = a; });

  let totalScore = 0;
  let maxScore = 0;

  // Score each answer
  for (const q of questions) {
    maxScore += Number(q.bobot);
    const ans = answerMap[q.id];
    if (ans && q.tipe === 'mcq') {
      const isCorrect = ans.answer === q.correct_answer;
      const score = isCorrect ? Number(q.bobot) : 0;
      totalScore += score;

      await supabase.from('answers').update({
        is_correct: isCorrect,
        score
      }).eq('id', ans.id);
    }
  }

  const startedAt = new Date(session.started_at);
  const finishedAt = new Date();
  const timeSpent = Math.floor((finishedAt - startedAt) / 1000);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const isPassed = percentage >= (session.exams.passing_grade || 0);

  await supabase.from('exam_sessions').update({
    is_submitted: true,
    finished_at: finishedAt.toISOString(),
    time_spent_seconds: timeSpent,
    total_score: totalScore,
    max_score: maxScore,
    percentage: Math.round(percentage * 100) / 100,
    is_passed: isPassed,
    auto_submitted: isAutoSubmit
  }).eq('id', sessionId);

  return {
    message: isAutoSubmit ? 'Ujian disubmit otomatis' : 'Ujian berhasil disubmit',
    total_score: totalScore,
    max_score: maxScore,
    percentage: Math.round(percentage * 100) / 100,
    is_passed: isPassed,
    time_spent_seconds: timeSpent,
    auto_submitted: isAutoSubmit
  };
}

async function autoSubmitSession(sessionId, examId) {
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('user_id, is_submitted')
    .eq('id', sessionId)
    .single();

  if (!session || session.is_submitted) return;
  return finalizeSession(sessionId, session.user_id, true);
}

export default router;
