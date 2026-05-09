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

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setExams(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchResults = async (examId) => {
    setSelectedExam(examId);
    if (!examId) { setResults([]); return; }
    try {
      const res = await fetch(`/api/exams/${examId}/results`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        // Only show sessions with violations
        setResults(data.filter(r => r.violation_count > 0).sort((a, b) => b.violation_count - a.violation_count));
      }
    } catch (e) { console.error(e); }
  };

  const violationTypeLabels = {
    tab_switch: { label: 'Berpindah Tab', icon: '🔄', severity: 'high' },
    window_blur: { label: 'Pindah Aplikasi', icon: '👀', severity: 'high' },
    copy_attempt: { label: 'Percobaan Salin', icon: '📋', severity: 'medium' },
    right_click: { label: 'Klik Kanan', icon: '🖱️', severity: 'low' },
    keyboard_shortcut: { label: 'Shortcut Keyboard', icon: '⌨️', severity: 'medium' },
    devtools: { label: 'DevTools', icon: '🔧', severity: 'critical' },
    fullscreen_exit: { label: 'Keluar Fullscreen', icon: '⬜', severity: 'medium' },
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalViolations = results.reduce((s, r) => s + r.violation_count, 0);
  const autoSubmitted = results.filter(r => r.auto_submitted).length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">🚨 Monitor Kecurangan</h1>
        <p className="text-gray-400 text-sm mt-1">Pantau pelanggaran yang dilakukan peserta selama ujian</p>
      </div>

      {/* Exam selector */}
      <div className="flex items-center gap-4">
        <select value={selectedExam} onChange={e => fetchResults(e.target.value)}
          className="flex-1 max-w-md px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <option value="">-- Pilih Ujian --</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {selectedExam && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Peserta Melanggar', value: results.length, color: '#ef4444', icon: '⚠️' },
              { label: 'Total Pelanggaran', value: totalViolations, color: '#f59e0b', icon: '🚨' },
              { label: 'Auto-Submit', value: autoSubmitted, color: '#dc2626', icon: '⛔' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: '#1e293b', borderColor: '#334155' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Violations list */}
          {results.length === 0 ? (
            <div className="rounded-xl p-12 border text-center" style={{ background: '#1e293b', borderColor: '#334155' }}>
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-400 font-medium">Tidak ada pelanggaran terdeteksi untuk ujian ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="rounded-xl border overflow-hidden" style={{ background: '#1e293b', borderColor: r.violation_count >= 5 ? '#ef444480' : '#334155' }}>
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => setExpandedSession(expandedSession === r.id ? null : r.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: r.violation_count >= 5 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        {r.violation_count}
                      </div>
                      <div>
                        <p className="text-white font-medium">{r.users?.nama || '-'}</p>
                        <p className="text-gray-500 text-xs">{r.users?.kelas || '-'} • {r.users?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.auto_submitted && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold">AUTO-SUBMIT</span>
                      )}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSession === r.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>

                  {expandedSession === r.id && r.violations && (
                    <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: '#334155', background: '#0f172a' }}>
                      {r.violations.map((v, i) => {
                        const info = violationTypeLabels[v.violation_type] || { label: v.violation_type, icon: '⚠️', severity: 'low' };
                        return (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${getSeverityColor(info.severity)}`}>
                            <span>{info.icon}</span>
                            <span className="font-medium">{info.label}</span>
                            <span className="text-gray-500 flex-1">{v.description}</span>
                            <span className="text-gray-500">{new Date(v.created_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
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
