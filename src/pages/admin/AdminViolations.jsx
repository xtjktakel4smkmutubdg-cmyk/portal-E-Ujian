import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminViolations() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const token = getToken();

  useEffect(() => { fetchExams(); }, []);
  const fetchExams = async () => { try { const r=await fetch('/api/exams',{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok) setExams(await r.json()); } catch(e){console.error(e);} finally{setLoading(false);} };
  const fetchResults = async (examId) => { setSelectedExam(examId); if(!examId){setResults([]);return;} try { const r=await fetch(`/api/exams/${examId}/results`,{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok){const d=await r.json();setResults(d.filter(r=>r.violation_count>0).sort((a,b)=>b.violation_count-a.violation_count));} } catch(e){console.error(e);} };

  const violationTypeLabels = {
    tab_switch: { label:'Berpindah Tab', icon:'🔄', severity:'high' },
    window_blur: { label:'Pindah Aplikasi', icon:'👀', severity:'high' },
    copy_attempt: { label:'Percobaan Salin', icon:'📋', severity:'medium' },
    right_click: { label:'Klik Kanan', icon:'🖱️', severity:'low' },
    keyboard_shortcut: { label:'Shortcut Keyboard', icon:'⌨️', severity:'medium' },
    devtools: { label:'DevTools', icon:'🔧', severity:'critical' },
    fullscreen_exit: { label:'Keluar Fullscreen', icon:'⬜', severity:'medium' },
  };
  
  const getSeverityColor = (s) => { 
    switch(s){ 
      case 'critical': return 'text-[#d9534f] bg-[#f2dede] border-[#ebccd1]'; 
      case 'high': return 'text-[#8a6d3b] bg-[#fcf8e3] border-[#faebcc]'; 
      case 'medium': return 'text-[#31708f] bg-[#d9edf7] border-[#bce8f1]'; 
      default: return 'text-[#6c757d] bg-[#e9ecef] border-[#dee2e6]'; 
    } 
  };

  const totalViolations = results.reduce((s,r)=>s+r.violation_count,0);
  const autoSubmitted = results.filter(r=>r.auto_submitted).length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="moodle-breadcrumb">
        <span>Monitor Kecurangan</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#333]">🚨 Monitor Kecurangan</h1>
        <p className="text-[#6c757d] text-sm mt-1">Pantau pelanggaran peserta selama ujian</p>
      </div>

      <div className="flex items-center gap-4 bg-[#fff] p-4 border rounded">
        <label className="font-bold text-[#333]">Pilih Ujian:</label>
        <select value={selectedExam} onChange={e=>fetchResults(e.target.value)}
          className="moodle-input max-w-md">
          <option value="">-- Pilih Ujian --</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {selectedExam && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label:'Peserta Melanggar', value:results.length, color:'#d9534f', icon:'⚠️' },
              { label:'Total Pelanggaran', value:totalViolations, color:'#f0ad4e', icon:'🚨' },
              { label:'Auto-Submit', value:autoSubmitted, color:'#d9534f', icon:'⛔' },
            ].map((s,i)=>(
              <div key={i} className="moodle-info-box" style={{borderLeftColor:s.color}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-2xl font-bold text-[#333]">{s.value}</span>
                </div>
                <p className="text-[#6c757d] text-xs font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {results.length===0 ? (
            <div className="card-admin p-14 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-[#5cb85c] font-bold text-lg">Tidak ada pelanggaran terdeteksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(r=>(
                <div key={r.id} className="card-admin overflow-hidden" style={{borderColor:r.violation_count>=5?'#d9534f':'#dee2e6'}}>
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#f5f5f5] transition-all" onClick={()=>setExpandedSession(expandedSession===r.id?null:r.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs" style={{background:r.violation_count>=5?'#d9534f':'#f0ad4e'}}>
                        {r.violation_count}
                      </div>
                      <div>
                        <p className="text-[#333] font-bold">{r.users?.nama||'-'}</p>
                        <p className="text-[#6c757d] text-xs">{r.users?.kelas||'-'} • {r.users?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.auto_submitted && <span className="moodle-badge moodle-badge-danger">AUTO-SUBMIT</span>}
                      <span className="text-[#0f6cb6] text-xs font-semibold">{expandedSession===r.id ? 'Sembunyikan' : 'Lihat Detail'}</span>
                    </div>
                  </div>
                  {expandedSession===r.id && r.violations && (
                    <div className="border-t p-4 bg-[#f9f9f9]">
                      <table className="moodle-table">
                        <thead>
                          <tr>
                            <th>Tipe Pelanggaran</th>
                            <th>Deskripsi</th>
                            <th>Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.violations.map((v,i)=>{
                            const info=violationTypeLabels[v.violation_type]||{label:v.violation_type,icon:'⚠️',severity:'low'};
                            return (
                              <tr key={i} className={getSeverityColor(info.severity)}>
                                <td className="font-semibold">
                                  {info.icon} {info.label}
                                </td>
                                <td>{v.description}</td>
                                <td className="text-xs">{new Date(v.created_at).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta'})}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
