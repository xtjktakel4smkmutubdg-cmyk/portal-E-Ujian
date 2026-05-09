import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout, getToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setExams(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const mulai = new Date(exam.tanggal_mulai);
    const selesai = new Date(exam.tanggal_selesai);

    if (now < mulai) return { label: 'Belum Dimulai', color: 'bg-amber-50 text-amber-700 border border-amber-200', canTake: false };
    if (now > selesai) return { label: 'Berakhir', color: 'bg-gray-50 text-gray-500 border border-gray-200', canTake: false };

    const submitted = exam.my_sessions?.some(s => s.is_submitted);
    const attempts = exam.my_sessions?.filter(s => s.is_submitted).length || 0;
    if (submitted && attempts >= exam.max_attempts) return { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', canTake: false };
    if (submitted) return { label: `Selesai (${attempts}/${exam.max_attempts})`, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200', canTake: true };

    return { label: 'Tersedia', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', canTake: true };
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getTimeRemaining = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)} hari lagi`;
    if (hours > 0) return `${hours} jam ${mins} menit lagi`;
    return `${mins} menit lagi`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)] text-sm font-medium">Memuat data...</p>
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Ujian', value: exams.length, icon: '📝', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)', shadow: 'rgba(79, 70, 229, 0.15)' },
    { label: 'Tersedia', value: exams.filter(e => getExamStatus(e).canTake).length, icon: '✅', gradient: 'linear-gradient(135deg, #10b981, #34d399)', shadow: 'rgba(16, 185, 129, 0.15)' },
    { label: 'Selesai', value: exams.filter(e => e.my_sessions?.some(s => s.is_submitted)).length, icon: '🏆', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', shadow: 'rgba(139, 92, 246, 0.15)' },
    { label: 'Menunggu', value: exams.filter(e => new Date(e.tanggal_mulai) > new Date()).length, icon: '⏳', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', shadow: 'rgba(245, 158, 11, 0.15)' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Premium Top Bar */}
      <nav className="sticky top-0 z-40 glass"
        style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.97), rgba(79, 70, 229, 0.95))', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Portal E-Ujian</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-semibold">{user?.nama}</p>
              <p className="text-indigo-200/70 text-xs font-medium">{user?.kelas ? `Kelas ${user.kelas}` : 'Peserta Ujian'}</p>
            </div>
            <button onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">Selamat Datang, {user?.nama}! 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Berikut daftar ujian yang tersedia untuk Anda</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="card-premium p-4 animate-slide-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: stat.gradient, boxShadow: `0 4px 12px ${stat.shadow}` }}>
                  <span className="drop-shadow-sm">{stat.icon}</span>
                </div>
                <span className="text-2xl font-extrabold" style={{ color: stat.gradient.includes('#4f46e5') ? '#4f46e5' : stat.gradient.includes('#10b981') ? '#10b981' : stat.gradient.includes('#8b5cf6') ? '#8b5cf6' : '#f59e0b' }}>{stat.value}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exam list */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-primary">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            Daftar Ujian
          </h2>

          {exams.length === 0 ? (
            <div className="card-premium p-14 text-center">
              <div className="text-5xl mb-4 opacity-80">📋</div>
              <p className="text-[var(--text-secondary)] font-medium">Belum ada ujian yang tersedia saat ini</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Ujian akan muncul ketika administrator telah membuat jadwal</p>
            </div>
          ) : (
            exams.map((exam, i) => {
              const status = getExamStatus(exam);
              const timeRemaining = getTimeRemaining(exam.tanggal_mulai);
              const bestScore = exam.my_sessions?.filter(s => s.is_submitted)
                .reduce((best, s) => Math.max(best, Number(s.percentage) || 0), 0);

              return (
                <div key={exam.id}
                  className="card-premium overflow-hidden animate-slide-in-up group"
                  style={{ animationDelay: `${(i + 4) * 0.05}s` }}>
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 gradient-primary"
                      style={{ boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-[var(--text)] truncate">{exam.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.color}`}>{status.label}</span>
                      </div>
                      {exam.mata_pelajaran && <p className="text-sm text-[var(--primary)] font-semibold mb-1">{exam.mata_pelajaran}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] font-medium">
                        <span>⏱ {exam.durasi} menit</span>
                        <span>📅 {formatDate(exam.tanggal_mulai)}</span>
                        <span>🏁 {formatDate(exam.tanggal_selesai)}</span>
                        {timeRemaining && <span className="text-amber-600 font-semibold">⏳ {timeRemaining}</span>}
                      </div>
                      {bestScore > 0 && exam.show_result_to_student && (
                        <div className="mt-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-2 bg-[var(--bg-alt)] rounded-full overflow-hidden max-w-[200px]">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bestScore}%`, background: bestScore >= (exam.passing_grade || 0) ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)' }}></div>
                            </div>
                            <span className="text-xs font-bold" style={{ color: bestScore >= (exam.passing_grade || 0) ? '#10b981' : '#ef4444' }}>{bestScore.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {status.canTake ? (
                        <Link to={`/take-exam/${exam.id}`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm btn-premium gradient-primary"
                          style={{ boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)' }}>
                          Mulai Ujian
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                          </svg>
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)] font-medium">
                          {new Date(exam.tanggal_mulai) > new Date() ? 'Menunggu' : 'Selesai'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
