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
  const [phase, setPhase] = useState('info');
  const [sessionId, setSessionId] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [examInfo, setExamInfo] = useState(null);
  const timerRef = useRef(null);
  const token = getToken();
  const { violationCount, showWarning, warningMessage, autoSubmitted, dismissWarning } = useAntiCheat(sessionId, token, phase === 'exam');

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Ujian tidak ditemukan');
        setExam(await res.json());
        const resR = await fetch(`/api/sessions/exam/${id}/my-results`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resR.ok) { const rd = await resR.json(); if (rd.has_result) setResult(rd); }
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    fetchExam();
  }, [id, token]);

  useEffect(() => {
    if (phase !== 'exam' || remainingSeconds <= 0) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => { if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => { if (autoSubmitted) { clearInterval(timerRef.current); setPhase('result'); setTimeout(() => navigate('/'), 10000); } }, [autoSubmitted]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const startRes = await fetch('/api/sessions/start', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ exam_id: id }) });
      if (!startRes.ok) { const d = await startRes.json(); throw new Error(d.error); }
      const { session } = await startRes.json();
      setSessionId(session.id);
      const qRes = await fetch(`/api/sessions/${session.id}/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!qRes.ok) { const d = await qRes.json(); throw new Error(d.error); }
      const qData = await qRes.json();
      setQuestions(qData.questions); setAnswers(qData.existing_answers || {}); setRemainingSeconds(qData.remaining_seconds); setExamInfo(qData.exam); setCurrentIdx(0); setPhase('exam'); requestFullscreen();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const saveAnswer = useCallback(async (qId, ans) => {
    if (!sessionId) return;
    try { await fetch(`/api/sessions/${sessionId}/answer`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: qId, answer: ans }) }); } catch (err) { console.error(err); }
  }, [sessionId, token]);

  const handleAnswer = (qId, val) => { setAnswers(prev => ({ ...prev, [qId]: val })); saveAnswer(qId, val); };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Apakah Anda yakin ingin mengumpulkan ujian? Jawaban tidak dapat diubah setelah dikumpulkan.')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Gagal mengumpulkan ujian');
      const data = await res.json(); clearInterval(timerRef.current); exitFullscreen();
      setResult({ ...data, show_details: exam?.show_result_to_student }); setPhase('result');
    } catch (err) { alert(err.message); } finally { setSubmitting(false); }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center"><div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-[var(--text-secondary)] text-sm font-medium">Memuat ujian...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="card-premium p-8 max-w-md w-full text-center animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[var(--danger)] mb-2">Gagal Memuat Ujian</h2>
        <p className="text-[var(--text-secondary)] mb-6 text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl text-white font-semibold btn-premium gradient-primary">Kembali</button>
      </div>
    </div>
  );

  // Result phase
  if (phase === 'result' || (result && phase === 'info')) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="card-premium p-10 max-w-lg w-full text-center animate-scale-in">
          {autoSubmitted ? (
            <><div className="text-6xl mb-5">⛔</div><h2 className="text-2xl font-extrabold text-[var(--danger)] mb-2">Ujian Dihentikan</h2><p className="text-[var(--text-secondary)] mb-6 text-sm">Ujian Anda telah otomatis dikumpulkan karena terlalu banyak pelanggaran ({violationCount}).</p></>
          ) : result?.auto_submitted ? (
            <><div className="text-6xl mb-5">⏰</div><h2 className="text-2xl font-extrabold text-amber-600 mb-2">Waktu Habis</h2><p className="text-[var(--text-secondary)] mb-6 text-sm">Ujian telah otomatis dikumpulkan karena waktu habis.</p></>
          ) : (
            <><div className="text-6xl mb-5">{result?.is_passed ? '🎉' : '📝'}</div><h2 className="text-2xl font-extrabold text-[var(--text)] mb-2">{result?.show_details !== false ? (result?.is_passed ? 'Selamat! Anda Lulus!' : 'Ujian Selesai') : 'Ujian Telah Dikumpulkan'}</h2></>
          )}
          {result?.show_details !== false && result?.percentage !== undefined ? (
            <div className="my-7 p-6 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--bg-alt)' }}>
              <div className="text-5xl font-extrabold mb-2" style={{ color: result?.is_passed ? '#10b981' : '#ef4444' }}>{result.percentage?.toFixed(1)}%</div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Skor: {result.total_score}/{result.max_score} • Waktu: {Math.floor((result.time_spent_seconds || 0) / 60)} menit</p>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] my-7 text-sm">{result?.message || 'Hasil ujian Anda telah disimpan.'}</p>
          )}
          <button onClick={() => navigate('/')} className="px-8 py-3 rounded-xl text-white font-bold btn-premium gradient-primary" style={{ boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  // Pre-exam info phase
  if (phase === 'info') {
    const now = new Date(); const mulai = new Date(exam.tanggal_mulai); const selesai = new Date(exam.tanggal_selesai);
    const canStart = now >= mulai && now <= selesai && exam.is_active;
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="card-premium max-w-xl w-full overflow-hidden animate-fade-in">
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}>
            <h1 className="text-2xl font-extrabold mb-1 tracking-tight">{exam.title}</h1>
            {exam.mata_pelajaran && <p className="text-indigo-200 font-medium">{exam.mata_pelajaran}</p>}
          </div>
          <div className="p-6 space-y-5">
            {exam.description && <p className="text-[var(--text-secondary)] text-sm">{exam.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Durasi', value:`${exam.durasi} menit`, icon:'⏱' },
                { label:'Percobaan', value:`Max ${exam.max_attempts}x`, icon:'🔄' },
                { label:'Mulai', value:mulai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}), icon:'📅' },
                { label:'Berakhir', value:selesai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}), icon:'🏁' },
                { label:'Passing Grade', value:`${exam.passing_grade||0}%`, icon:'🎯' },
                { label:'Soal Diacak', value:exam.shuffle_questions?'Ya':'Tidak', icon:'🔀' },
              ].map((item,i) => (
                <div key={i} className="rounded-xl p-3 border border-[var(--border)]" style={{ background: 'var(--bg-alt)' }}>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">{item.icon} {item.label}</span>
                  <p className="font-bold text-sm text-[var(--text)] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 border border-amber-200" style={{ background: 'rgba(245,158,11,0.06)' }}>
              <h3 className="font-bold text-amber-700 text-sm mb-2">⚠️ Peraturan Ujian</h3>
              <ul className="text-xs text-amber-700 space-y-1.5">
                <li>• Ujian dalam mode <strong>fullscreen</strong></li>
                <li>• Dilarang <strong>berpindah tab/aplikasi</strong></li>
                <li>• Dilarang <strong>menyalin teks, screenshot, atau klik kanan</strong></li>
                <li>• Pelanggaran <strong>tercatat dan dilaporkan</strong></li>
                <li>• <strong>5 pelanggaran</strong> = ujian otomatis dikumpulkan</li>
                <li>• Soal ditampilkan <strong>satu per satu</strong> secara acak</li>
              </ul>
            </div>
            {!canStart && (
              <div className="rounded-xl p-4 border border-red-200 text-center" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <p className="text-red-600 font-semibold text-sm">{now < mulai ? `Ujian belum dimulai. Mulai pada ${mulai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}` : 'Ujian sudah berakhir'}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-alt)] transition-all">Kembali</button>
              {canStart && (
                <button onClick={handleStart} className="flex-1 py-3 rounded-xl text-white font-bold btn-premium gradient-success" style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>🚀 Mulai Ujian</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam phase
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => questions.some(q => q.id === k)).length;
  const isUrgent = remainingSeconds <= 300;

  return (
    <div className="min-h-screen flex flex-col exam-mode" style={{ background: 'var(--bg)' }}>
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card-premium p-8 max-w-md mx-4 animate-shake text-center" style={{ border: '3px solid var(--danger)' }}>
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-xl font-extrabold text-[var(--danger)] mb-3">PELANGGARAN TERDETEKSI!</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">{warningMessage}</p>
            <div className="flex items-center justify-center gap-2 mb-5 text-sm text-[var(--danger)] font-bold">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white gradient-danger">{violationCount}</span>
              <span>/ 5 Pelanggaran</span>
            </div>
            <button onClick={dismissWarning} className="px-6 py-2.5 rounded-xl text-white font-bold btn-premium gradient-danger">Saya Mengerti</button>
          </div>
        </div>
      )}
      {showWarning && <div className="violation-flash"></div>}

      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-[var(--border)]" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-[var(--text)] text-sm truncate max-w-[200px]">{examInfo?.title}</span>
          <div className="flex items-center gap-3">
            {violationCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {violationCount}
              </div>
            )}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-bold text-lg border ${isUrgent ? 'text-[var(--danger)]' : 'text-[var(--primary)]'}`}
              style={{ background: isUrgent ? 'var(--danger-soft)' : 'var(--accent-soft)', borderColor: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)', ...(isUrgent ? { animation: 'countdown-pulse 1s infinite' } : {}) }}>
              ⏱ {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Main question */}
        <div className="flex-1">
          <div className="card-premium overflow-hidden animate-fade-in" key={currentIdx}>
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'var(--bg-alt)' }}>
              <div><span className="text-sm text-[var(--text-secondary)]">Soal</span><span className="text-2xl font-extrabold text-[var(--primary)] ml-2">{currentIdx + 1}</span><span className="text-sm text-[var(--text-secondary)] ml-1">dari {questions.length}</span></div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${answers[currentQ?.id] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>{answers[currentQ?.id] ? '✓ Terjawab' : 'Belum dijawab'}</span>
            </div>
            <div className="p-6">
              <div className="text-[var(--text)] text-base leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentQ?.question_text }}></div>
              <div className="space-y-2.5">
                {['a','b','c','d','e'].map(letter => {
                  const optVal = currentQ?.[`option_${letter}`]; if (!optVal) return null;
                  const val = letter.toUpperCase(); const isSelected = answers[currentQ?.id] === val;
                  return (
                    <button key={letter} onClick={() => handleAnswer(currentQ.id, val)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${isSelected ? 'border-[var(--primary)] shadow-md' : 'border-[var(--border)] hover:border-indigo-200'}`}
                      style={isSelected ? { background: 'var(--accent-soft)', boxShadow: '0 0 0 3px var(--primary-glow)' } : {}}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${isSelected ? 'gradient-primary text-white' : 'bg-[var(--bg-alt)] text-[var(--text-secondary)]'}`}>{val}</span>
                      <span className={`text-sm pt-1 ${isSelected ? 'text-[var(--primary)] font-semibold' : 'text-[var(--text)]'}`}>{optVal}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between" style={{ background: 'var(--bg-alt)' }}>
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>Sebelumnya
              </button>
              {currentIdx === questions.length - 1 ? (
                <button onClick={() => handleSubmit(false)} disabled={submitting} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-success disabled:opacity-50" style={{ boxShadow:'0 4px 12px rgba(16,185,129,0.25)' }}>
                  {submitting ? 'Mengumpulkan...' : '✓ Kumpulkan Ujian'}
                </button>
              ) : (
                <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold btn-premium gradient-primary flex items-center gap-2">
                  Selanjutnya<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 hidden md:block">
          <div className="card-premium sticky top-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]" style={{ background:'var(--bg-alt)' }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Navigasi Soal</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">{answeredCount}/{questions.length} terjawab</p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id]; const isCurrent = idx === currentIdx;
                  return (
                    <button key={q.id} onClick={() => setCurrentIdx(idx)}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${isCurrent ? 'gradient-primary text-white shadow-md scale-110' : isAnswered ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <div className="h-2 bg-[var(--bg-alt)] rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }}></div></div>
                <p className="text-xs text-[var(--text-secondary)] mt-2 text-center font-medium">{Math.round((answeredCount / questions.length) * 100)}% selesai</p>
              </div>
              <button onClick={() => handleSubmit(false)} disabled={submitting} className="w-full mt-3 py-2.5 rounded-xl text-white text-xs font-bold btn-premium gradient-success disabled:opacity-50" style={{ boxShadow:'0 4px 12px rgba(16,185,129,0.25)' }}>✓ Kumpulkan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
