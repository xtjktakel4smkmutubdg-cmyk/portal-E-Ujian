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
  const getSeverityColor = (s) => { switch(s){ case 'critical': return 'bg-red-500/15 text-red-400 border-red-500/25'; case 'high': return 'bg-orange-500/15 text-orange-400 border-orange-500/25'; case 'medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/25'; default: return 'bg-white/5 text-[var(--admin-text-secondary)] border-white/10'; } };

  const totalViolations = results.reduce((s,r)=>s+r.violation_count,0);
  const autoSubmitted = results.filter(r=>r.auto_submitted).length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-extrabold text-white tracking-tight">🚨 Monitor Kecurangan</h1><p className="text-[var(--admin-text-secondary)] text-sm mt-1 font-medium">Pantau pelanggaran peserta selama ujian</p></div>

      <div className="flex items-center gap-4">
        <select value={selectedExam} onChange={e=>fetchResults(e.target.value)}
          className="flex-1 max-w-md px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--admin-accent)] input-glow-admin transition-all"
          style={{background:'rgba(12,15,26,0.6)',border:'1px solid var(--admin-border)'}}>
          <option value="">-- Pilih Ujian --</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {selectedExam && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Peserta Melanggar', value:results.length, gradient:'linear-gradient(135deg,#ef4444,#f87171)', shadow:'rgba(239,68,68,0.2)', icon:'⚠️' },
              { label:'Total Pelanggaran', value:totalViolations, gradient:'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow:'rgba(245,158,11,0.2)', icon:'🚨' },
              { label:'Auto-Submit', value:autoSubmitted, gradient:'linear-gradient(135deg,#dc2626,#ef4444)', shadow:'rgba(220,38,38,0.2)', icon:'⛔' },
            ].map((s,i)=>(
              <div key={i} className="card-admin p-4 animate-slide-in-up" style={{animationDelay:`${i*0.08}s`}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{background:s.gradient,boxShadow:`0 4px 12px ${s.shadow}`}}><span>{s.icon}</span></div>
                  <span className="text-2xl font-extrabold text-white">{s.value}</span>
                </div>
                <p className="text-[var(--admin-text-secondary)] text-xs font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {results.length===0 ? (
            <div className="card-admin p-14 text-center"><div className="text-5xl mb-3">✅</div><p className="text-emerald-400 font-semibold">Tidak ada pelanggaran terdeteksi</p></div>
          ) : (
            <div className="space-y-3">
              {results.map(r=>(
                <div key={r.id} className="card-admin overflow-hidden" style={{borderColor:r.violation_count>=5?'rgba(239,68,68,0.4)':'var(--admin-border)'}}>
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all" onClick={()=>setExpandedSession(expandedSession===r.id?null:r.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:r.violation_count>=5?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#f59e0b,#d97706)'}}>
                        {r.violation_count}
                      </div>
                      <div><p className="text-white font-semibold">{r.users?.nama||'-'}</p><p className="text-[var(--admin-text-secondary)] text-xs font-medium">{r.users?.kelas||'-'} • {r.users?.username}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.auto_submitted&&<span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-bold">AUTO-SUBMIT</span>}
                      <svg className={`w-5 h-5 text-[var(--admin-text-secondary)] transition-transform duration-200 ${expandedSession===r.id?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {expandedSession===r.id&&r.violations&&(
                    <div className="border-t px-4 py-3 space-y-2" style={{borderColor:'var(--admin-border)',background:'var(--admin-bg)'}}>
                      {r.violations.map((v,i)=>{
                        const info=violationTypeLabels[v.violation_type]||{label:v.violation_type,icon:'⚠️',severity:'low'};
                        return (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs ${getSeverityColor(info.severity)}`}>
                            <span>{info.icon}</span><span className="font-semibold">{info.label}</span>
                            <span className="text-[var(--admin-text-secondary)] flex-1">{v.description}</span>
                            <span className="text-[var(--admin-text-secondary)]">{new Date(v.created_at).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta'})}</span>
                          </div>
                        );
                      })}
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
