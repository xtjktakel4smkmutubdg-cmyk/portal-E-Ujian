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

    if (now < mulai) return { label: 'Belum Dimulai', color: 'bg-yellow-100 text-yellow-800', canTake: false };
    if (now > selesai) return { label: 'Berakhir', color: 'bg-gray-100 text-gray-600', canTake: false };

    const submitted = exam.my_sessions?.some(s => s.is_submitted);
    const attempts = exam.my_sessions?.filter(s => s.is_submitted).length || 0;
    if (submitted && attempts >= exam.max_attempts) return { label: 'Selesai', color: 'bg-green-100 text-green-700', canTake: false };
    if (submitted) return { label: `Selesai (${attempts}/${exam.max_attempts})`, color: 'bg-blue-100 text-blue-700', canTake: true };

    return { label: 'Tersedia', color: 'bg-emerald-100 text-emerald-700', canTake: true };
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
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Portal E-Ujian</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-medium">{user?.nama}</p>
              <p className="text-blue-200 text-xs">{user?.kelas ? `Kelas ${user.kelas}` : 'Peserta Ujian'}</p>
            </div>
            <button onClick={logout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-[var(--text)]">Selamat Datang, {user?.nama}! 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1">Berikut daftar ujian yang tersedia untuk Anda</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Ujian', value: exams.length, icon: '📝', color: '#3b82f6' },
            { label: 'Tersedia', value: exams.filter(e => getExamStatus(e).canTake).length, icon: '✅', color: '#10b981' },
            { label: 'Selesai', value: exams.filter(e => e.my_sessions?.some(s => s.is_submitted)).length, icon: '🏆', color: '#8b5cf6' },
            { label: 'Belum Dimulai', value: exams.filter(e => new Date(e.tanggal_mulai) > new Date()).length, icon: '⏳', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border)] hover:shadow-md transition-all animate-slide-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exam list */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Daftar Ujian
          </h2>

          {exams.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-[var(--border)]">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-[var(--text-secondary)]">Belum ada ujian yang tersedia saat ini</p>
            </div>
          ) : (
            exams.map((exam, i) => {
              const status = getExamStatus(exam);
              const timeRemaining = getTimeRemaining(exam.tanggal_mulai);
              const bestScore = exam.my_sessions?.filter(s => s.is_submitted)
                .reduce((best, s) => Math.max(best, Number(s.percentage) || 0), 0);

              return (
                <div key={exam.id}
                  className="bg-white rounded-xl border border-[var(--border)] hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-in-up"
                  style={{ animationDelay: `${(i + 4) * 0.05}s` }}>
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
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
                      {exam.mata_pelajaran && <p className="text-sm text-[var(--accent)] font-medium mb-1">{exam.mata_pelajaran}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        <span>⏱ {exam.durasi} menit</span>
                        <span>📅 {formatDate(exam.tanggal_mulai)}</span>
                        <span>🏁 {formatDate(exam.tanggal_selesai)}</span>
                        {timeRemaining && <span className="text-amber-600 font-medium">⏳ {timeRemaining}</span>}
                      </div>
                      {bestScore > 0 && exam.show_result_to_student && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[200px]">
                              <div className="h-full rounded-full transition-all" style={{ width: `${bestScore}%`, background: bestScore >= (exam.passing_grade || 0) ? '#10b981' : '#ef4444' }}></div>
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
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                          Mulai Ujian
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                          </svg>
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">
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
