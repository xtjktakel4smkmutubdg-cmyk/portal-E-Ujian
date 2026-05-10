import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminExamResults() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const token = getToken();

  useEffect(() => { fetchData(); }, [id]);
  const fetchData = async () => { try { const [eR,rR]=await Promise.all([fetch(`/api/exams/${id}`,{headers:{'Authorization':`Bearer ${token}`}}),fetch(`/api/exams/${id}/results`,{headers:{'Authorization':`Bearer ${token}`}})]); if(eR.ok) setExam(await eR.json()); if(rR.ok) setResults(await rR.json()); } catch(e){console.error(e);} finally{setLoading(false);} };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await fetch(`/api/export/exam/${id}/${format}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export gagal');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Hasil_${exam?.title||'export'}.${format==='excel'?'xlsx':'pdf'}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); } finally { setExporting(''); }
  };

  const openReview = async (session) => {
    setSelectedSession(session);
    setLoadingReview(true);
    setShowReviewModal(true);
    try {
      const res = await fetch(`/api/exams/session/${session.id}/answers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSessionAnswers(await res.json());
    } catch (e) { console.error(e); } finally { setLoadingReview(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin"></div></div>;

  const total = results.length;
  const passed = results.filter(r => r.is_passed).length;
  const avg = total > 0 ? (results.reduce((s,r) => s+Number(r.percentage),0)/total).toFixed(1) : 0;
  const avgDur = total > 0 ? Math.round(results.reduce((s,r) => s+(r.time_spent_seconds||0),0)/total/60) : 0;

  return (
    <div className="space-y-6">
      <div className="moodle-breadcrumb">
        <Link to="/admin/dashboard">Dashboard</Link>
        <span className="separator">/</span>
        <Link to="/admin/exams">Manajemen Ujian</Link>
        <span className="separator">/</span>
        <span>Hasil Ujian</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">Hasil Ujian: {exam?.title}</h1>
          <p className="text-[#6c757d] text-sm mt-1">{exam?.mata_pelajaran||'-'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>handleExport('excel')} disabled={!!exporting||total===0} className="moodle-btn moodle-btn-success flex items-center gap-2">
            {exporting==='excel'?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>:'📊'} Export Excel
          </button>
          <button onClick={()=>handleExport('pdf')} disabled={!!exporting||total===0} className="moodle-btn moodle-btn-danger flex items-center gap-2">
            {exporting==='pdf'?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>:'📄'} Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Peserta', value:total, icon:'👥', color:'#0f6cb6' },
          { label:'Lulus', value:passed, icon:'✅', color:'#5cb85c' },
          { label:'Rata-rata', value:`${avg}%`, icon:'📊', color:'#f0ad4e' },
          { label:'Durasi Rata-rata', value:`${avgDur} mnt`, icon:'⏱', color:'#5bc0de' },
        ].map((s,i) => (
          <div key={i} className="moodle-info-box" style={{borderLeftColor:s.color}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-bold text-[#333]">{s.value}</span>
            </div>
            <p className="text-[#6c757d] text-xs font-bold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="moodle-table">
            <thead>
              <tr>
                {['No','Nama','Kelas','Skor','Persentase','Status','Durasi','Pelanggaran','Waktu Submit', 'Aksi'].map(h=><th key={h} className={h==='Aksi'?'text-center':''}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.length===0 ? <tr><td colSpan="9" className="text-center text-[#6c757d] py-10 font-medium">Belum ada peserta yang menyelesaikan ujian ini</td></tr>
              : results.map((r,i) => (
                <tr key={r.id}>
                  <td className="text-center">{i+1}</td>
                  <td>
                    <div className="font-semibold text-[#0f6cb6]">{r.users?.nama||'-'}</div>
                    <div className="text-xs text-[#6c757d]">{r.users?.no_peserta||r.users?.username}</div>
                  </td>
                  <td>{r.users?.kelas||'-'}</td>
                  <td className="font-mono text-center">{r.total_score}/{r.max_score}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-sm overflow-hidden">
                        <div className="h-full" style={{width:`${r.percentage}%`,background:r.is_passed?'#5cb85c':'#d9534f'}}></div>
                      </div>
                      <span className="text-xs font-bold" style={{color:r.is_passed?'#5cb85c':'#d9534f'}}>{r.percentage}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    {r.is_passed ? <span className="moodle-badge moodle-badge-success">LULUS</span> : <span className="moodle-badge moodle-badge-danger">GAGAL</span>}
                  </td>
                  <td className="text-right">{Math.round((r.time_spent_seconds||0)/60)} mnt</td>
                  <td className="text-center">
                    {r.violation_count>0 ? <span className="moodle-badge moodle-badge-danger">{r.violation_count}</span> : <span className="text-[#6c757d]">-</span>}
                  </td>
                  <td className="text-xs text-[#6c757d]">
                    {r.finished_at?new Date(r.finished_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'-'}
                  </td>
                  <td className="text-center">
                    <button onClick={()=>openReview(r)} className="moodle-btn moodle-btn-info text-xs py-1 px-2">🔍 Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {showReviewModal && (
        <div className="moodle-modal-overlay">
          <div className="moodle-modal moodle-modal-lg">
            <div className="moodle-modal-header">
              <h2>Review Jawaban: {selectedSession?.users?.nama}</h2>
              <button onClick={()=>setShowReviewModal(false)} className="text-[#666] hover:text-[#333]">✖</button>
            </div>
            <div className="moodle-modal-body max-h-[70vh] overflow-y-auto space-y-6 p-6">
              {loadingReview ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin"></div></div>
              ) : sessionAnswers.length === 0 ? (
                <p className="text-center text-[#6c757d]">Tidak ada data jawaban.</p>
              ) : (
                sessionAnswers.map((ans, idx) => (
                  <div key={ans.id} className="p-4 border rounded bg-white" style={{ borderColor: ans.is_correct ? '#d6e9c6' : '#ebccd1' }}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-[#333]">Soal {idx + 1}</span>
                      <span className={ans.is_correct ? 'text-[#3c763d] font-bold' : 'text-[#a94442] font-bold'}>
                        {ans.questions?.tipe === 'mcq' ? (ans.is_correct ? '✅ Benar' : '❌ Salah') : '📝 Perlu Review Manual'} ({ans.score} poin)
                      </span>
                    </div>
                    <div className="text-sm text-[#333] mb-3" dangerouslySetInnerHTML={{ __html: ans.questions?.question_text }}></div>
                    
                    <div className="bg-[#f9f9f9] p-3 rounded text-sm border border-[#eee]">
                      {ans.questions?.tipe === 'mcq' ? (
                        <>
                          <p><strong>Jawaban Siswa:</strong> {ans.answer ? `${ans.answer}. ${ans.questions[`option_${ans.answer.toLowerCase()}`] || ''}` : '-'}</p>
                          <p className="text-[#3c763d] mt-1"><strong>Kunci Jawaban:</strong> {ans.questions?.correct_answer}. {ans.questions[`option_${ans.questions?.correct_answer?.toLowerCase()}`] || ''}</p>
                        </>
                      ) : ans.questions?.tipe === 'essai' ? (
                        <div>
                          <strong>Jawaban Siswa (Essai):</strong>
                          <div className="mt-1 p-2 bg-white border rounded whitespace-pre-wrap">{ans.answer || '-'}</div>
                        </div>
                      ) : ans.questions?.tipe === 'audio' ? (
                        <div>
                          <strong>Jawaban Siswa (Audio):</strong>
                          <div className="mt-1">
                            {ans.answer ? <audio controls src={ans.answer} className="w-full h-10" /> : <span className="text-red-500 italic">Tidak ada rekaman</span>}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="moodle-modal-footer">
              <button onClick={()=>setShowReviewModal(false)} className="moodle-btn moodle-btn-secondary">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
