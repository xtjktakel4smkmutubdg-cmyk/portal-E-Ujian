import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ exams: 0, users: 0, sessions: 0, activeExams: 0 });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    try {
      const [examsRes, usersRes] = await Promise.all([
        fetch('/api/exams', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const exams = examsRes.ok ? await examsRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];
      const now = new Date();

      setStats({
        exams: exams.length,
        users: users.filter(u => u.role === 'siswa').length,
        activeExams: exams.filter(e => e.is_active && new Date(e.tanggal_mulai) <= now && new Date(e.tanggal_selesai) >= now).length,
        totalAdmins: users.filter(u => u.role === 'admin').length
      });

      setRecentExams(exams.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const statCards = [
    { label: 'Total Ujian', value: stats.exams, icon: '📝', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Ujian Aktif', value: stats.activeExams, icon: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Siswa', value: stats.users, icon: '👥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Admin', value: stats.totalAdmins, icon: '🔐', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Selamat datang di panel administrasi Portal E-Ujian</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-xl p-5 border transition-all hover:scale-[1.02]"
            style={{ background: '#1e293b', borderColor: '#334155' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: card.bg }}>
                {card.icon}
              </div>
              <span className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/exams" className="rounded-xl p-5 border flex items-center gap-4 transition-all hover:scale-[1.01]"
          style={{ background: '#1e293b', borderColor: '#334155' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold">Buat Ujian Baru</h3>
            <p className="text-gray-400 text-sm">Tambah ujian dengan soal dan pengaturan</p>
          </div>
        </Link>
        <Link to="/admin/users" className="rounded-xl p-5 border flex items-center gap-4 transition-all hover:scale-[1.01]"
          style={{ background: '#1e293b', borderColor: '#334155' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold">Tambah Peserta</h3>
            <p className="text-gray-400 text-sm">Kelola akun siswa dan peserta ujian</p>
          </div>
        </Link>
      </div>

      {/* Recent exams */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#1e293b', borderColor: '#334155' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#334155' }}>
          <h2 className="text-white font-bold">Ujian Terbaru</h2>
          <Link to="/admin/exams" className="text-blue-400 text-sm hover:underline">Lihat semua →</Link>
        </div>
        {recentExams.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada ujian. Buat ujian pertama Anda!</div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#334155' }}>
            {recentExams.map(exam => {
              const now = new Date();
              const isActive = exam.is_active && new Date(exam.tanggal_mulai) <= now && new Date(exam.tanggal_selesai) >= now;
              return (
                <div key={exam.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-all" style={{ borderColor: '#334155' }}>
                  <div>
                    <p className="text-white font-medium text-sm">{exam.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{exam.mata_pelajaran || '-'} • {exam.durasi} menit</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Link to={`/admin/exams/${exam.id}/results`} className="text-blue-400 text-xs hover:underline">Hasil</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
