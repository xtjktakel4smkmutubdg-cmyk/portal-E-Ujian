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

    if (now < mulai) return { label: 'Belum Dimulai', badgeClass: 'moodle-badge-default', canTake: false };
    if (now > selesai) return { label: 'Berakhir', badgeClass: 'moodle-badge-danger', canTake: false };

    const submitted = exam.my_sessions?.some(s => s.is_submitted);
    const attempts = exam.my_sessions?.filter(s => s.is_submitted).length || 0;
    if (submitted && attempts >= exam.max_attempts) return { label: 'Selesai', badgeClass: 'moodle-badge-success', canTake: false };
    if (submitted) return { label: `Selesai (${attempts}/${exam.max_attempts})`, badgeClass: 'moodle-badge-info', canTake: true };

    return { label: 'Tersedia', badgeClass: 'moodle-badge-success', canTake: true };
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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#6c757d] text-sm font-bold">Memuat data...</p>
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Ujian', value: exams.length, color: '#0f6cb6', icon: '📝' },
    { label: 'Tersedia', value: exams.filter(e => getExamStatus(e).canTake).length, color: '#5cb85c', icon: '✅' },
    { label: 'Selesai', value: exams.filter(e => e.my_sessions?.some(s => s.is_submitted)).length, color: '#5bc0de', icon: '🏆' },
    { label: 'Menunggu', value: exams.filter(e => new Date(e.tanggal_mulai) > new Date()).length, color: '#f0ad4e', icon: '⏳' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Bar */}
      <nav className="sticky top-0 z-40 bg-[#0f6cb6] border-b border-[#0a528c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[50px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-white/20 text-white text-sm font-bold">
              📋
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Portal E-Ujian</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-[#cce5ff] text-xs font-medium">
                Login sebagai <strong className="text-white">{user?.nama}</strong>
              </span>
            </div>
            <button onClick={logout}
              className="text-[#cce5ff] hover:text-white text-xs font-medium transition-colors">
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <div className="moodle-breadcrumb mb-4">
          <span>Dashboard</span>
        </div>

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#333]">Selamat Datang, {user?.nama}! 👋</h1>
          <p className="text-[#6c757d] mt-1 text-sm">Berikut daftar ujian yang tersedia untuk Anda</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="moodle-info-box" style={{ borderLeftColor: stat.color }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-xs text-[#6c757d] font-bold uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exam list */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#333] border-b pb-2 mb-4" style={{ borderColor: '#dee2e6' }}>
            Daftar Ujian
          </h2>

          {exams.length === 0 ? (
            <div className="card-admin p-14 text-center">
              <div className="text-5xl mb-4 opacity-80">📋</div>
              <p className="text-[#333] font-bold">Belum ada ujian yang tersedia saat ini</p>
              <p className="text-xs text-[#6c757d] mt-1">Ujian akan muncul ketika administrator telah membuat jadwal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {exams.map((exam) => {
                const status = getExamStatus(exam);
                const timeRemaining = getTimeRemaining(exam.tanggal_mulai);
                const bestScore = exam.my_sessions?.filter(s => s.is_submitted)
                  .reduce((best, s) => Math.max(best, Number(s.percentage) || 0), 0);

                return (
                  <div key={exam.id} className="card-admin">
                    <div className="p-4 flex flex-col h-full">
                      
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-[#0f6cb6] text-lg">{exam.title}</h3>
                        <span className={`moodle-badge ${status.badgeClass}`}>{status.label}</span>
                      </div>
                      
                      {exam.mata_pelajaran && <p className="text-sm font-semibold text-[#333] mb-3">{exam.mata_pelajaran}</p>}
                      
                      <div className="space-y-1 mb-4 flex-1">
                        <p className="text-sm text-[#6c757d]"><strong className="text-[#333]">Durasi:</strong> {exam.durasi} menit</p>
                        <p className="text-sm text-[#6c757d]"><strong className="text-[#333]">Mulai:</strong> {formatDate(exam.tanggal_mulai)}</p>
                        <p className="text-sm text-[#6c757d]"><strong className="text-[#333]">Berakhir:</strong> {formatDate(exam.tanggal_selesai)}</p>
                        {timeRemaining && <p className="text-sm text-[#8a6d3b] font-bold mt-2">⏳ {timeRemaining}</p>}
                      </div>

                      {bestScore > 0 && exam.show_result_to_student && (
                        <div className="mb-4 bg-[#f9f9f9] p-3 rounded border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-[#333]">Nilai Tertinggi</span>
                            <span className="text-xs font-bold" style={{ color: bestScore >= (exam.passing_grade || 0) ? '#5cb85c' : '#d9534f' }}>
                              {bestScore.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-[#e9ecef] rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${bestScore}%`, background: bestScore >= (exam.passing_grade || 0) ? '#5cb85c' : '#d9534f' }}></div>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto border-t pt-3" style={{ borderColor: '#dee2e6' }}>
                        {status.canTake ? (
                          <Link to={`/take-exam/${exam.id}`} className="moodle-btn moodle-btn-primary w-full text-center block">
                            Mulai Ujian
                          </Link>
                        ) : (
                          <button disabled className="moodle-btn moodle-btn-secondary w-full opacity-50 cursor-not-allowed">
                            {new Date(exam.tanggal_mulai) > new Date() ? 'Ujian Belum Tersedia' : 'Ujian Telah Berakhir'}
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
