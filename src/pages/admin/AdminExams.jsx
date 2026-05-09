import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminExams() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [showQModal, setShowQModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', mata_pelajaran: '', durasi: 60,
    tanggal_mulai: '', tanggal_selesai: '',
    show_result_to_student: false, shuffle_questions: true, shuffle_options: true,
    max_attempts: 1, passing_grade: 0
  });
  const [qForm, setQForm] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'A', tipe: 'mcq', bobot: 1 });

  const token = getToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const toJakartaISO = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T').slice(0, 16);
  };

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setExams(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditExam(null);
    const now = new Date();
    const later = new Date(now.getTime() + 3600000);
    setForm({
      title: '', description: '', mata_pelajaran: '', durasi: 60,
      tanggal_mulai: toJakartaISO(now),
      tanggal_selesai: toJakartaISO(later),
      show_result_to_student: false, shuffle_questions: true, shuffle_options: true,
      max_attempts: 1, passing_grade: 0
    });
    setShowModal(true);
  };

  const openEdit = (exam) => {
    setEditExam(exam);
    setForm({
      title: exam.title, description: exam.description || '', mata_pelajaran: exam.mata_pelajaran || '',
      durasi: exam.durasi, tanggal_mulai: toJakartaISO(exam.tanggal_mulai),
      tanggal_selesai: toJakartaISO(exam.tanggal_selesai),
      show_result_to_student: exam.show_result_to_student, shuffle_questions: exam.shuffle_questions,
      shuffle_options: exam.shuffle_options, max_attempts: exam.max_attempts, passing_grade: exam.passing_grade || 0
    });
    setShowModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    const url = editExam ? `/api/exams/${editExam.id}` : '/api/exams';
    const method = editExam ? 'PUT' : 'POST';
    // Force inputs to be parsed as GMT+7 before converting to UTC for the database
    const t_mulai = new Date(form.tanggal_mulai + '+07:00').toISOString();
    const t_selesai = new Date(form.tanggal_selesai + '+07:00').toISOString();
    const payload = { ...form, tanggal_mulai: t_mulai, tanggal_selesai: t_selesai };
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Gagal menyimpan');
      await fetchExams();
      setShowModal(false);
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus ujian ini? Semua data terkait akan ikut terhapus.')) return;
    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      await fetchExams();
    } catch (e) { alert(e.message); }
  };

  const openQuestions = async (examId) => {
    setSelectedExamId(examId);
    try {
      const res = await fetch(`/api/exams/${examId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setQuestions(d.questions || []); }
    } catch (e) { console.error(e); }
    setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'A', tipe: 'mcq', bobot: 1 });
    setShowQModal(true);
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/exams/${selectedExamId}/questions`, {
        method: 'POST', headers, body: JSON.stringify({ questions: [qForm] })
      });
      if (!res.ok) throw new Error('Gagal menambah soal');
      const data = await res.json();
      setQuestions([...questions, ...data]);
      setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'A', tipe: 'mcq', bobot: 1 });
    } catch (e) { alert(e.message); }
  };

  const deleteQuestion = async (qId) => {
    if (!confirm('Hapus soal ini?')) return;
    try {
      await fetch(`/api/exams/questions/${qId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setQuestions(questions.filter(q => q.id !== qId));
    } catch (e) { alert(e.message); }
  };

  const inputStyle = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const inputBg = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' };
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1.5";

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Ujian</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola ujian, soal, dan pengaturan</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          + Buat Ujian
        </button>
      </div>

      {/* Exam list */}
      <div className="space-y-3">
        {exams.length === 0 ? (
          <div className="rounded-xl p-12 text-center border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <p className="text-gray-400">Belum ada ujian. Klik "Buat Ujian" untuk memulai.</p>
          </div>
        ) : exams.map(exam => {
          const now = new Date();
          const isActive = exam.is_active && new Date(exam.tanggal_mulai) <= now && new Date(exam.tanggal_selesai) >= now;
          return (
            <div key={exam.id} className="rounded-xl p-5 border transition-all hover:border-blue-500/30" style={{ background: '#1e293b', borderColor: '#334155' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold">{exam.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {isActive ? 'Aktif' : exam.is_active ? 'Terjadwal' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>📚 {exam.mata_pelajaran || '-'}</span>
                    <span>⏱ {exam.durasi} menit</span>
                    <span>📅 {new Date(exam.tanggal_mulai).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                    <span>📊 Submissions: {exam.total_submissions || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openQuestions(exam.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">Soal</button>
                  <Link to={`/admin/exams/${exam.id}/results`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all">Hasil</Link>
                  <button onClick={() => openEdit(exam)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">Edit</button>
                  <button onClick={() => handleDelete(exam.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <div className="p-6 border-b" style={{ borderColor: '#334155' }}>
              <h2 className="text-xl font-bold text-white">{editExam ? 'Edit Ujian' : 'Buat Ujian Baru'}</h2>
            </div>
            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div><label className={labelStyle}>Judul Ujian *</label><input required className={inputStyle} style={inputBg} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ujian Tengah Semester - Matematika" /></div>
              <div><label className={labelStyle}>Mata Pelajaran</label><input className={inputStyle} style={inputBg} value={form.mata_pelajaran} onChange={e => setForm({...form, mata_pelajaran: e.target.value})} placeholder="Matematika" /></div>
              <div><label className={labelStyle}>Deskripsi</label><textarea className={inputStyle} style={inputBg} rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi ujian..." /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Waktu Mulai *</label><input type="datetime-local" required className={inputStyle} style={inputBg} value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} /></div>
                <div><label className={labelStyle}>Waktu Selesai *</label><input type="datetime-local" required className={inputStyle} style={inputBg} value={form.tanggal_selesai} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelStyle}>Durasi (menit) *</label><input type="number" min="1" required className={inputStyle} style={inputBg} value={form.durasi} onChange={e => setForm({...form, durasi: Number(e.target.value)})} /></div>
                <div><label className={labelStyle}>Max Percobaan</label><input type="number" min="1" className={inputStyle} style={inputBg} value={form.max_attempts} onChange={e => setForm({...form, max_attempts: Number(e.target.value)})} /></div>
                <div><label className={labelStyle}>Passing Grade (%)</label><input type="number" min="0" max="100" className={inputStyle} style={inputBg} value={form.passing_grade} onChange={e => setForm({...form, passing_grade: Number(e.target.value)})} /></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'shuffle_questions', label: 'Acak Soal' },
                  { key: 'shuffle_options', label: 'Acak Opsi' },
                  { key: 'show_result_to_student', label: 'Tampilkan Nilai' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all" style={{ borderColor: form[item.key] ? '#3b82f6' : '#334155', background: form[item.key] ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                    <input type="checkbox" checked={form[item.key]} onChange={e => setForm({...form, [item.key]: e.target.checked})} className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${form[item.key] ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                      {form[item.key] && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <span className="text-gray-300 text-sm">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#334155' }}>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-gray-300 text-sm font-medium hover:bg-white/5" style={{ borderColor: '#334155' }}>Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#334155' }}>
              <h2 className="text-xl font-bold text-white">Kelola Soal ({questions.length} soal)</h2>
              <button onClick={() => setShowQModal(false)} className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Existing questions */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="rounded-xl p-4 border flex items-start gap-3" style={{ background: '#0f172a', borderColor: '#334155' }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-500/20 text-blue-400 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 text-sm" dangerouslySetInnerHTML={{ __html: q.question_text }}></p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {['a', 'b', 'c', 'd', 'e'].map(l => q[`option_${l}`] && (
                            <span key={l} className={`text-xs px-2 py-1 rounded ${q.correct_answer === l.toUpperCase() ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                              {l.toUpperCase()}: {q[`option_${l}`].substring(0, 30)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-300 text-xs flex-shrink-0">Hapus</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add question form */}
              <div className="rounded-xl p-5 border" style={{ borderColor: '#3b82f6', background: 'rgba(59,130,246,0.05)' }}>
                <h3 className="text-blue-400 font-bold text-sm mb-4">+ Tambah Soal Baru</h3>
                <form onSubmit={addQuestion} className="space-y-3">
                  <div><label className={labelStyle}>Teks Soal *</label><textarea required rows="2" className={inputStyle} style={inputBg} value={qForm.question_text} onChange={e => setQForm({...qForm, question_text: e.target.value})} placeholder="Tulis pertanyaan..." /></div>
                  <div className="space-y-2">
                    {['a', 'b', 'c', 'd', 'e'].map(l => (
                      <div key={l} className="flex items-center gap-2">
                        <span className="w-7 text-center font-bold text-gray-400 text-sm">{l.toUpperCase()}</span>
                        <input className={inputStyle} style={inputBg} value={qForm[`option_${l}`]} onChange={e => setQForm({...qForm, [`option_${l}`]: e.target.value})} placeholder={`Opsi ${l.toUpperCase()}`} required={l !== 'e'} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelStyle}>Jawaban Benar</label>
                      <select className={inputStyle} style={inputBg} value={qForm.correct_answer} onChange={e => setQForm({...qForm, correct_answer: e.target.value})}>
                        {['A','B','C','D','E'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div><label className={labelStyle}>Bobot Nilai</label><input type="number" min="1" className={inputStyle} style={inputBg} value={qForm.bobot} onChange={e => setQForm({...qForm, bobot: Number(e.target.value)})} /></div>
                  </div>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Tambah Soal</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
