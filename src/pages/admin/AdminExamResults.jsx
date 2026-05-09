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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [examRes, resultsRes] = await Promise.all([
        fetch(`/api/exams/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/exams/${id}/results`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (examRes.ok) setExam(await examRes.json());
      if (resultsRes.ok) setResults(await resultsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await fetch(`/api/export/exam/${id}/${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export gagal');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hasil_Ujian_${exam?.title || 'export'}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting('');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const totalSubmissions = results.length;
  const passedCount = results.filter(r => r.is_passed).length;
  const avgPercentage = totalSubmissions > 0 ? (results.reduce((s, r) => s + Number(r.percentage), 0) / totalSubmissions).toFixed(1) : 0;
  const avgDuration = totalSubmissions > 0 ? Math.round(results.reduce((s, r) => s + (r.time_spent_seconds || 0), 0) / totalSubmissions / 60) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin/exams" className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Hasil Ujian</h1>
          <p className="text-gray-400 text-sm">{exam?.title} • {exam?.mata_pelajaran || '-'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={!!exporting || totalSubmissions === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40 transition-all flex items-center gap-2">
            {exporting === 'excel' ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div> : '📊'}
            Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting || totalSubmissions === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all flex items-center gap-2">
            {exporting === 'pdf' ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : '📄'}
            PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Peserta', value: totalSubmissions, icon: '👥', color: '#3b82f6' },
          { label: 'Lulus', value: passedCount, icon: '✅', color: '#10b981' },
          { label: 'Rata-rata', value: `${avgPercentage}%`, icon: '📊', color: '#8b5cf6' },
          { label: 'Durasi Rata-rata', value: `${avgDuration} mnt`, icon: '⏱', color: '#f59e0b' },
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

      {/* Results table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#1e293b', borderColor: '#334155' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['No', 'Nama', 'Kelas', 'Skor', 'Persentase', 'Status', 'Durasi', 'Pelanggaran', 'Waktu Submit'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium text-xs uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr><td colSpan="9" className="text-center text-gray-500 py-12">Belum ada peserta yang mengumpulkan ujian</td></tr>
              ) : results.map((r, i) => (
                <tr key={r.id} className="hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid #334155' }}>
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{r.users?.nama || '-'}</p>
                    <p className="text-gray-500 text-xs">{r.users?.no_peserta || r.users?.username}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{r.users?.kelas || '-'}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{r.total_score}/{r.max_score}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, background: r.is_passed ? '#10b981' : '#ef4444' }}></div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: r.is_passed ? '#10b981' : '#ef4444' }}>{r.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.is_passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {r.is_passed ? 'LULUS' : 'GAGAL'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{Math.round((r.time_spent_seconds || 0) / 60)} mnt</td>
                  <td className="px-4 py-3">
                    {r.violation_count > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-bold">{r.violation_count}</span>
                    ) : (
                      <span className="text-xs text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.finished_at ? new Date(r.finished_at).toLocaleString('id-ID') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
