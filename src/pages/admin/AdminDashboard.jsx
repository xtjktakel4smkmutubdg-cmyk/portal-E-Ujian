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

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-[var(--admin-text-secondary)] text-sm">Memuat...</p>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Ujian', value: stats.exams, icon: '📝', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)', shadow: 'rgba(79, 70, 229, 0.2)' },
    { label: 'Ujian Aktif', value: stats.activeExams, icon: '🟢', gradient: 'linear-gradient(135deg, #10b981, #34d399)', shadow: 'rgba(16, 185, 129, 0.2)' },
    { label: 'Total Siswa', value: stats.users, icon: '👥', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', shadow: 'rgba(139, 92, 246, 0.2)' },
    { label: 'Admin', value: stats.totalAdmins, icon: '🔐', gradient: 'linear-gradient(135deg, #ef4444, #f87171)', shadow: 'rgba(239, 68, 68, 0.2)' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
        <p className="text-[var(--admin-text-secondary)] mt-1 font-medium">Selamat datang di panel administrasi Portal E-Ujian</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card-admin p-5 animate-slide-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                style={{ background: card.gradient, boxShadow: `0 4px 16px ${card.shadow}` }}>
                <span className="drop-shadow-sm">{card.icon}</span>
              </div>
              <span className="text-3xl font-extrabold text-white">{card.value}</span>
            </div>
            <p className="text-[var(--admin-text-secondary)] text-sm font-semibold">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/exams" className="card-admin p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center gradient-primary transition-all group-hover:scale-105"
            style={{ boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Buat Ujian Baru</h3>
            <p className="text-[var(--admin-text-secondary)] text-sm">Tambah ujian dengan soal dan pengaturan</p>
          </div>
          <svg className="w-5 h-5 text-[var(--admin-text-secondary)] group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
        <Link to="/admin/users" className="card-admin p-5 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Tambah Peserta</h3>
            <p className="text-[var(--admin-text-secondary)] text-sm">Kelola akun siswa dan peserta ujian</p>
          </div>
          <svg className="w-5 h-5 text-[var(--admin-text-secondary)] group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Recent exams */}
      <div className="card-admin overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)' }}>
          <h2 className="text-white font-bold">Ujian Terbaru</h2>
          <Link to="/admin/exams" className="text-[var(--admin-accent)] text-sm font-semibold hover:underline">Lihat semua →</Link>
        </div>
        {recentExams.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3 opacity-60">📝</div>
            <p className="text-[var(--admin-text-secondary)] font-medium">Belum ada ujian. Buat ujian pertama Anda!</p>
          </div>
        ) : (
          <div>
            {recentExams.map((exam, i) => {
              const now = new Date();
              const isActive = exam.is_active && new Date(exam.tanggal_mulai) <= now && new Date(exam.tanggal_selesai) >= now;
              return (
                <div key={exam.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all"
                  style={{ borderBottom: i < recentExams.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                  <div>
                    <p className="text-white font-semibold text-sm">{exam.title}</p>
                    <p className="text-[var(--admin-text-secondary)] text-xs mt-0.5 font-medium">{exam.mata_pelajaran || '-'} • {exam.durasi} menit</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-[var(--admin-text-secondary)]'}`}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Link to={`/admin/exams/${exam.id}/results`} className="text-[var(--admin-accent)] text-xs font-semibold hover:underline">Hasil</Link>
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
