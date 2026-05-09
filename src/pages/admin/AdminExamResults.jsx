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

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  const total = results.length;
  const passed = results.filter(r => r.is_passed).length;
  const avg = total > 0 ? (results.reduce((s,r) => s+Number(r.percentage),0)/total).toFixed(1) : 0;
  const avgDur = total > 0 ? Math.round(results.reduce((s,r) => s+(r.time_spent_seconds||0),0)/total/60) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin/exams" className="text-[var(--admin-text-secondary)] hover:text-white transition-colors p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div className="flex-1"><h1 className="text-2xl font-extrabold text-white tracking-tight">Hasil Ujian</h1><p className="text-[var(--admin-text-secondary)] text-sm font-medium">{exam?.title} • {exam?.mata_pelajaran||'-'}</p></div>
        <div className="flex gap-2">
          <button onClick={()=>handleExport('excel')} disabled={!!exporting||total===0} className="px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 transition-all flex items-center gap-2">
            {exporting==='excel'?<div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>:'📊'} Excel
          </button>
          <button onClick={()=>handleExport('pdf')} disabled={!!exporting||total===0} className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all flex items-center gap-2">
            {exporting==='pdf'?<div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>:'📄'} PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Peserta', value:total, icon:'👥', gradient:'linear-gradient(135deg,#4f46e5,#6366f1)', shadow:'rgba(79,70,229,0.2)' },
          { label:'Lulus', value:passed, icon:'✅', gradient:'linear-gradient(135deg,#10b981,#34d399)', shadow:'rgba(16,185,129,0.2)' },
          { label:'Rata-rata', value:`${avg}%`, icon:'📊', gradient:'linear-gradient(135deg,#8b5cf6,#a78bfa)', shadow:'rgba(139,92,246,0.2)' },
          { label:'Durasi Rata-rata', value:`${avgDur} mnt`, icon:'⏱', gradient:'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow:'rgba(245,158,11,0.2)' },
        ].map((s,i) => (
          <div key={i} className="card-admin p-4 animate-slide-in-up" style={{animationDelay:`${i*0.08}s`}}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{background:s.gradient,boxShadow:`0 4px 12px ${s.shadow}`}}><span className="drop-shadow-sm">{s.icon}</span></div>
              <span className="text-2xl font-extrabold text-white">{s.value}</span>
            </div>
            <p className="text-[var(--admin-text-secondary)] text-xs font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid var(--admin-border)'}}>{['No','Nama','Kelas','Skor','Persentase','Status','Durasi','Pelanggaran','Waktu Submit'].map(h=><th key={h} className="text-left text-[var(--admin-text-secondary)] font-semibold text-xs uppercase px-4 py-3.5 tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {results.length===0 ? <tr><td colSpan="9" className="text-center text-[var(--admin-text-secondary)] py-12 font-medium">Belum ada peserta</td></tr>
              : results.map((r,i) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-all" style={{borderBottom:'1px solid var(--admin-border)'}}>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{i+1}</td>
                  <td className="px-4 py-3"><p className="text-white font-semibold">{r.users?.nama||'-'}</p><p className="text-[var(--admin-text-secondary)] text-xs">{r.users?.no_peserta||r.users?.username}</p></td>
                  <td className="px-4 py-3 text-[var(--admin-text)]">{r.users?.kelas||'-'}</td>
                  <td className="px-4 py-3 text-[var(--admin-text)] font-mono">{r.total_score}/{r.max_score}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}><div className="h-full rounded-full" style={{width:`${r.percentage}%`,background:r.is_passed?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,#ef4444,#f87171)'}}></div></div><span className="text-xs font-bold" style={{color:r.is_passed?'#10b981':'#ef4444'}}>{r.percentage}%</span></div></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.is_passed?'bg-emerald-500/15 text-emerald-400':'bg-red-500/12 text-red-400'}`}>{r.is_passed?'LULUS':'GAGAL'}</span></td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)] text-xs">{Math.round((r.time_spent_seconds||0)/60)} mnt</td>
                  <td className="px-4 py-3">{r.violation_count>0?<span className="text-xs px-2 py-1 rounded-full bg-red-500/12 text-red-400 font-bold">{r.violation_count}</span>:<span className="text-xs text-[var(--admin-text-secondary)]">0</span>}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)] text-xs">{r.finished_at?new Date(r.finished_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
