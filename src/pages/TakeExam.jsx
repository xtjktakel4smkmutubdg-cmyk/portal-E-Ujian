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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#6c757d] text-sm font-bold">Memuat ujian...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="card-admin p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#d9534f] mb-2">Gagal Memuat Ujian</h2>
        <p className="text-[#6c757d] mb-6 text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="moodle-btn moodle-btn-primary">Kembali ke Dashboard</button>
      </div>
    </div>
  );

  // Result phase
  if (phase === 'result' || (result && phase === 'info')) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="card-admin p-10 max-w-lg w-full text-center">
          {autoSubmitted ? (
            <>
              <div className="text-6xl mb-5">⛔</div>
              <h2 className="text-2xl font-bold text-[#d9534f] mb-2">Ujian Dihentikan</h2>
              <p className="text-[#6c757d] mb-6 text-sm">Ujian Anda telah otomatis dikumpulkan karena terlalu banyak pelanggaran ({violationCount}).</p>
            </>
          ) : result?.auto_submitted ? (
            <>
              <div className="text-6xl mb-5">⏰</div>
              <h2 className="text-2xl font-bold text-[#f0ad4e] mb-2">Waktu Habis</h2>
              <p className="text-[#6c757d] mb-6 text-sm">Ujian telah otomatis dikumpulkan karena waktu habis.</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-5">{result?.is_passed ? '🎉' : '📝'}</div>
              <h2 className="text-2xl font-bold text-[#333] mb-2">{result?.show_details !== false ? (result?.is_passed ? 'Selamat! Anda Lulus!' : 'Ujian Selesai') : 'Ujian Telah Dikumpulkan'}</h2>
            </>
          )}
          
          {result?.show_details !== false && result?.percentage !== undefined ? (
            <div className="my-6 p-6 bg-[#f9f9f9] rounded border" style={{ borderColor: '#dee2e6' }}>
              <div className="text-5xl font-bold mb-2" style={{ color: result?.is_passed ? '#5cb85c' : '#d9534f' }}>
                {result.percentage?.toFixed(1)}%
              </div>
              <p className="text-sm text-[#333] font-bold">Skor: {result.total_score}/{result.max_score} • Waktu: {Math.floor((result.time_spent_seconds || 0) / 60)} menit</p>
            </div>
          ) : (
            <p className="text-[#6c757d] my-6 text-sm font-bold">{result?.message || 'Hasil ujian Anda telah disimpan.'}</p>
          )}
          <button onClick={() => navigate('/')} className="moodle-btn moodle-btn-primary">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  // Pre-exam info phase
  if (phase === 'info') {
    const now = new Date(); const mulai = new Date(exam.tanggal_mulai); const selesai = new Date(exam.tanggal_selesai);
    const canStart = now >= mulai && now <= selesai && exam.is_active;
    return (
      <div className="min-h-screen bg-[#f5f5f5] p-4 flex items-center justify-center">
        <div className="card-admin max-w-2xl w-full">
          <div className="p-6 bg-[#0f6cb6] text-white rounded-t border-b" style={{ borderColor: '#0a528c' }}>
            <h1 className="text-2xl font-bold mb-1">{exam.title}</h1>
            {exam.mata_pelajaran && <p className="text-[#cce5ff] font-semibold">{exam.mata_pelajaran}</p>}
          </div>
          
          <div className="p-6 space-y-6">
            {exam.description && (
              <div className="moodle-info-box" style={{ borderLeftColor: '#0f6cb6' }}>
                <p className="text-[#333] text-sm">{exam.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <table className="moodle-table m-0">
                <tbody>
                  <tr>
                    <td className="font-bold text-[#333] w-1/2">Durasi</td>
                    <td>{exam.durasi} menit</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[#333]">Maks. Percobaan</td>
                    <td>{exam.max_attempts}x</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[#333]">Passing Grade</td>
                    <td>{exam.passing_grade || 0}%</td>
                  </tr>
                </tbody>
              </table>
              <table className="moodle-table m-0">
                <tbody>
                  <tr>
                    <td className="font-bold text-[#333] w-1/2">Waktu Mulai</td>
                    <td>{mulai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[#333]">Waktu Selesai</td>
                    <td>{selesai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[#333]">Acak Soal</td>
                    <td>{exam.shuffle_questions ? 'Ya' : 'Tidak'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="moodle-alert moodle-alert-warning">
              <h3 className="font-bold mb-2">⚠️ Peraturan Ujian</h3>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Ujian akan dijalankan dalam mode <strong>fullscreen</strong>.</li>
                <li>Dilarang <strong>berpindah tab atau aplikasi lain</strong> selama ujian berlangsung.</li>
                <li>Dilarang <strong>menyalin teks, screenshot, atau menggunakan klik kanan</strong>.</li>
                <li>Setiap pelanggaran akan <strong>tercatat dan dilaporkan</strong> ke administrator.</li>
                <li>Jika pelanggaran mencapai <strong>5 kali</strong>, ujian otomatis dikumpulkan.</li>
              </ul>
            </div>

            {!canStart && (
              <div className="moodle-alert moodle-alert-danger text-center">
                <strong>{now < mulai ? `Ujian belum dimulai. Tersedia pada ${mulai.toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}` : 'Ujian sudah berakhir'}</strong>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/')} className="moodle-btn moodle-btn-secondary flex-1 text-center">
                Kembali ke Dashboard
              </button>
              {canStart && (
                <button onClick={handleStart} className="moodle-btn moodle-btn-primary flex-1 text-center">
                  Mulai Ujian Sekarang
                </button>
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
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {showWarning && (
        <div className="moodle-modal-overlay z-[100]">
          <div className="moodle-modal">
            <div className="moodle-modal-header bg-[#f2dede] border-b border-[#ebccd1]">
              <h2 className="text-[#a94442] font-bold">🚨 PELANGGARAN TERDETEKSI!</h2>
            </div>
            <div className="moodle-modal-body text-center p-6">
              <p className="text-[#333] mb-4 text-lg">{warningMessage}</p>
              <div className="mb-6 p-3 bg-[#f2dede] border border-[#ebccd1] rounded text-[#a94442] font-bold">
                Peringatan: {violationCount} / 5 Pelanggaran
              </div>
              <button onClick={dismissWarning} className="moodle-btn moodle-btn-danger w-full">
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0f6cb6] text-white border-b border-[#0a528c]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-sm truncate max-w-[300px]">{examInfo?.title}</span>
          <div className="flex items-center gap-4">
            {violationCount > 0 && (
              <span className="bg-[#d9534f] px-2 py-1 rounded text-xs font-bold">
                ⚠️ {violationCount} Pelanggaran
              </span>
            )}
            <div className={`flex items-center gap-2 px-3 py-1 rounded font-mono font-bold text-lg bg-white ${isUrgent ? 'text-[#d9534f]' : 'text-[#333]'}`}>
              ⏱ {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-6 gap-6 items-start">
        {/* Main question */}
        <div className="flex-1 min-w-0">
          <div className="card-admin" key={currentIdx}>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-[#f9f9f9]" style={{ borderColor: '#dee2e6' }}>
              <div>
                <span className="text-[#333] font-bold text-lg">Soal {currentIdx + 1}</span>
                <span className="text-[#6c757d] text-sm ml-2">dari {questions.length}</span>
              </div>
              <span className={`moodle-badge ${answers[currentQ?.id] ? 'moodle-badge-success' : 'moodle-badge-default'}`}>
                {answers[currentQ?.id] ? 'Terjawab' : 'Belum Dijawab'}
              </span>
            </div>
            
            <div className="p-6 bg-white">
              <div className="text-[#333] text-base leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentQ?.question_text }}></div>
              
              <div className="space-y-3">
                {['a','b','c','d','e'].map(letter => {
                  const optVal = currentQ?.[`option_${letter}`]; if (!optVal) return null;
                  const val = letter.toUpperCase(); const isSelected = answers[currentQ?.id] === val;
                  return (
                    <label key={letter} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-[#e9f2f9] border-[#0f6cb6]' : 'bg-white border-[#dee2e6] hover:bg-[#f5f5f5]'}`}>
                      <input 
                        type="radio" 
                        name={`question_${currentQ?.id}`} 
                        value={val} 
                        checked={isSelected}
                        onChange={() => handleAnswer(currentQ.id, val)}
                        className="mt-1"
                      />
                      <span className="text-sm text-[#333] font-medium">{val}. {optVal}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-between bg-[#f9f9f9]" style={{ borderColor: '#dee2e6' }}>
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="moodle-btn moodle-btn-secondary disabled:opacity-50">
                « Sebelumnya
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button onClick={() => handleSubmit(false)} disabled={submitting} className="moodle-btn moodle-btn-success">
                  {submitting ? 'Mengumpulkan...' : 'Kumpulkan Ujian'}
                </button>
              ) : (
                <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} className="moodle-btn moodle-btn-primary">
                  Selanjutnya »
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="w-72 hidden lg:block shrink-0">
          <div className="card-admin sticky top-20">
            <div className="px-4 py-3 border-b bg-[#f9f9f9]" style={{ borderColor: '#dee2e6' }}>
              <h3 className="font-bold text-[#333]">Navigasi Soal</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id]; 
                  const isCurrent = idx === currentIdx;
                  
                  let btnClass = "w-10 h-10 rounded font-bold text-sm border flex items-center justify-center ";
                  if (isCurrent) {
                    btnClass += "bg-[#0f6cb6] text-white border-[#0a528c]";
                  } else if (isAnswered) {
                    btnClass += "bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]";
                  } else {
                    btnClass += "bg-white text-[#333] border-[#ccc] hover:bg-[#e6e6e6]";
                  }

                  return (
                    <button key={q.id} onClick={() => setCurrentIdx(idx)} className={btnClass}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="border-t pt-4" style={{ borderColor: '#dee2e6' }}>
                <p className="text-sm font-bold text-[#333] mb-2">Status Ujian</p>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#6c757d]">Terjawab</span>
                  <span className="font-bold">{answeredCount} / {questions.length}</span>
                </div>
                <div className="w-full bg-[#e9ecef] rounded-full h-1.5 mb-4">
                  <div className="bg-[#5cb85c] h-1.5 rounded-full" style={{ width: `${(answeredCount / questions.length) * 100}%` }}></div>
                </div>
                
                <button onClick={() => handleSubmit(false)} disabled={submitting} className="moodle-btn moodle-btn-success w-full">
                  Selesaikan Ujian
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
