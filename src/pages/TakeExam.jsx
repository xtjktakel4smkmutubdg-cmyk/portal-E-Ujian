import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAntiCheat, requestFullscreen, exitFullscreen } from '../hooks/useAntiCheat';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('info'); // 'info' | 'exam' | 'result'
  const [sessionId, setSessionId] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [examInfo, setExamInfo] = useState(null);
  const timerRef = useRef(null);

  const token = getToken();
  const { violationCount, showWarning, warningMessage, autoSubmitted, dismissWarning } =
    useAntiCheat(sessionId, token, phase === 'exam');

  // Fetch exam info
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Ujian tidak ditemukan');
        const data = await res.json();
        setExam(data);

        // Check previous results
        const resResult = await fetch(`/api/sessions/exam/${id}/my-results`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resResult.ok) {
          const rd = await resResult.json();
          if (rd.has_result) setResult(rd);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, token]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam' || remainingSeconds <= 0) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Auto-submitted by anti-cheat
  useEffect(() => {
    if (autoSubmitted) {
      clearInterval(timerRef.current);
      setPhase('result');
      setTimeout(() => navigate('/'), 10000);
    }
  }, [autoSubmitted]);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Start session
      const startRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: id })
      });
      if (!startRes.ok) { const d = await startRes.json(); throw new Error(d.error); }
      const { session } = await startRes.json();
      setSessionId(session.id);

      // Get questions
      const qRes = await fetch(`/api/sessions/${session.id}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!qRes.ok) { const d = await qRes.json(); throw new Error(d.error); }
      const qData = await qRes.json();

      setQuestions(qData.questions);
      setAnswers(qData.existing_answers || {});
      setRemainingSeconds(qData.remaining_seconds);
      setExamInfo(qData.exam);
      setCurrentIdx(0);
      setPhase('exam');
      requestFullscreen();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = useCallback(async (qId, ans) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: qId, answer: ans })
      });
    } catch (err) { console.error(err); }
  }, [sessionId, token]);

  const handleAnswer = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    saveAnswer(qId, val);
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Apakah Anda yakin ingin mengumpulkan ujian? Jawaban tidak dapat diubah setelah dikumpulkan.')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Gagal mengumpulkan ujian');
      const data = await res.json();
      clearInterval(timerRef.current);
      exitFullscreen();
      setResult({ ...data, show_details: exam?.show_result_to_student });
      setPhase('result');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)]">Memuat ujian...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-[var(--border)]">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[var(--danger)] mb-2">Gagal Memuat Ujian</h2>
        <p className="text-[var(--text-secondary)] mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90">Kembali</button>
      </div>
    </div>
  );

  // Result phase
  if (phase === 'result' || (result && phase === 'info')) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-[var(--border)] animate-fade-in text-center">
          {autoSubmitted ? (
            <>
              <div className="text-6xl mb-4">⛔</div>
              <h2 className="text-2xl font-bold text-[var(--danger)] mb-2">Ujian Dihentikan</h2>
              <p className="text-[var(--text-secondary)] mb-6">Ujian Anda telah otomatis dikumpulkan karena terlalu banyak pelanggaran ({violationCount} pelanggaran).</p>
            </>
          ) : result?.auto_submitted ? (
            <>
              <div className="text-6xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-amber-600 mb-2">Waktu Habis</h2>
              <p className="text-[var(--text-secondary)] mb-6">Ujian telah otomatis dikumpulkan karena waktu habis.</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">{result?.is_passed ? '🎉' : '📝'}</div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
                {result?.show_details !== false ? (result?.is_passed ? 'Selamat! Anda Lulus!' : 'Ujian Selesai') : 'Ujian Telah Dikumpulkan'}
              </h2>
            </>
          )}

          {result?.show_details !== false && result?.percentage !== undefined ? (
            <div className="my-6 p-6 rounded-xl bg-gray-50 border border-[var(--border)]">
              <div className="text-4xl font-bold mb-2" style={{ color: result?.is_passed ? '#10b981' : '#ef4444' }}>
                {result.percentage?.toFixed(1)}%
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Skor: {result.total_score}/{result.max_score} • Waktu: {Math.floor((result.time_spent_seconds || 0) / 60)} menit
              </p>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] my-6">{result?.message || 'Hasil ujian Anda telah disimpan.'}</p>
          )}

          <button onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-exam info phase
  if (phase === 'info') {
    const now = new Date();
    const mulai = new Date(exam.tanggal_mulai);
    const selesai = new Date(exam.tanggal_selesai);
    const canStart = now >= mulai && now <= selesai && exam.is_active;

    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-[var(--border)] overflow-hidden animate-fade-in">
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
            <h1 className="text-2xl font-bold mb-1">{exam.title}</h1>
            {exam.mata_pelajaran && <p className="text-blue-200">{exam.mata_pelajaran}</p>}
          </div>

          <div className="p-6 space-y-4">
            {exam.description && <p className="text-[var(--text-secondary)] text-sm">{exam.description}</p>}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Durasi', value: `${exam.durasi} menit`, icon: '⏱' },
                { label: 'Percobaan', value: `Max ${exam.max_attempts}x`, icon: '🔄' },
                { label: 'Mulai', value: mulai.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }), icon: '📅' },
                { label: 'Berakhir', value: selesai.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }), icon: '🏁' },
                { label: 'Passing Grade', value: `${exam.passing_grade || 0}%`, icon: '🎯' },
                { label: 'Soal Diacak', value: exam.shuffle_questions ? 'Ya' : 'Tidak', icon: '🔀' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)]">{item.icon} {item.label}</span>
                  <p className="font-semibold text-sm text-[var(--text)] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 text-sm mb-2">⚠️ Peraturan Ujian</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Ujian akan berlangsung dalam mode <strong>fullscreen</strong></li>
                <li>• Dilarang <strong>berpindah tab/aplikasi</strong> selama ujian</li>
                <li>• Dilarang <strong>menyalin teks, screenshot, atau klik kanan</strong></li>
                <li>• Setiap pelanggaran akan <strong>tercatat dan dilaporkan ke admin</strong></li>
                <li>• <strong>5 pelanggaran</strong> = ujian otomatis dikumpulkan</li>
                <li>• Soal ditampilkan <strong>satu per satu</strong> secara acak</li>
              </ul>
            </div>

            {!canStart && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600 font-medium text-sm">
                  {now < mulai ? `Ujian belum dimulai. Mulai pada ${mulai.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}` : 'Ujian sudah berakhir'}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-xl border border-[var(--border)] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-all">
                Kembali
              </button>
              {canStart && (
                <button onClick={handleStart}
                  className="flex-1 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  🚀 Mulai Ujian
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam phase — one question at a time
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => questions.some(q => q.id === k)).length;
  const isUrgent = remainingSeconds <= 300;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      {/* Violation Warning */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-shake text-center border-4 border-red-500">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-xl font-bold text-red-600 mb-3">PELANGGARAN TERDETEKSI!</h2>
            <p className="text-[var(--text-secondary)] mb-6">{warningMessage}</p>
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-red-600 font-bold">
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">{violationCount}</span>
              <span>/ 5 Pelanggaran</span>
            </div>
            <button onClick={dismissWarning} className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Violation flash overlay */}
      {showWarning && <div className="violation-flash"></div>}

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-[var(--border)] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--text)] text-sm truncate max-w-[200px]">{examInfo?.title}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Violation badge */}
            {violationCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                ⚠️ {violationCount}
              </div>
            )}

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-bold text-lg ${isUrgent ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
              style={isUrgent ? { animation: 'countdown-pulse 1s infinite' } : {}}>
              ⏱ {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Main question area */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden animate-fade-in" key={currentIdx}>
            {/* Question header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              <div>
                <span className="text-sm text-[var(--text-secondary)]">Soal</span>
                <span className="text-2xl font-bold text-[var(--accent)] ml-2">{currentIdx + 1}</span>
                <span className="text-sm text-[var(--text-secondary)] ml-1">dari {questions.length}</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${answers[currentQ?.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {answers[currentQ?.id] ? '✓ Terjawab' : 'Belum dijawab'}
              </span>
            </div>

            {/* Question content */}
            <div className="p-6">
              <div className="text-[var(--text)] text-base leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentQ?.question_text }}></div>

              {/* Options */}
              <div className="space-y-3">
                {['a', 'b', 'c', 'd', 'e'].map((letter) => {
                  const optVal = currentQ?.[`option_${letter}`];
                  if (!optVal) return null;
                  const val = letter.toUpperCase();
                  const isSelected = answers[currentQ?.id] === val;
                  return (
                    <button key={letter} onClick={() => handleAnswer(currentQ.id, val)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 hover:shadow-sm ${
                        isSelected ? 'border-[var(--accent)] bg-blue-50 shadow-sm' : 'border-[var(--border)] hover:border-blue-200 hover:bg-blue-50/30'
                      }`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                        isSelected ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{val}</span>
                      <span className={`text-sm pt-1 ${isSelected ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)]'}`}>{optVal}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-gray-50">
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                Sebelumnya
              </button>

              {currentIdx === questions.length - 1 ? (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {submitting ? 'Mengumpulkan...' : '✓ Kumpulkan Ujian'}
                </button>
              ) : (
                <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:shadow-lg flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  Selanjutnya
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — Question navigator */}
        <div className="w-56 hidden md:block">
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] sticky top-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50">
              <h3 className="text-sm font-bold text-[var(--text)]">Navigasi Soal</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{answeredCount}/{questions.length} terjawab</p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentIdx;
                  return (
                    <button key={q.id} onClick={() => setCurrentIdx(idx)}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                        isCurrent ? 'bg-[var(--accent)] text-white shadow-md scale-110' :
                        isAnswered ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }}></div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">{Math.round((answeredCount / questions.length) * 100)}% selesai</p>
              </div>

              <button onClick={() => handleSubmit(false)} disabled={submitting}
                className="w-full mt-3 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                ✓ Kumpulkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
