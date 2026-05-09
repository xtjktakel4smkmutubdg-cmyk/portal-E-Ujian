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
      <div className="text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Memuat...</p>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Ujian', value: stats.exams, icon: '📝', color: '#0f6cb6' },
    { label: 'Ujian Aktif', value: stats.activeExams, icon: '🟢', color: '#5cb85c' },
    { label: 'Total Siswa', value: stats.users, icon: '👥', color: '#f0ad4e' },
    { label: 'Admin', value: stats.totalAdmins, icon: '🔐', color: '#d9534f' },
  ];

  return (
    <div className="space-y-6">
      <div className="moodle-breadcrumb mb-2">
        <Link to="/admin/dashboard">Dashboard</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#333]">Dashboard</h1>
        <p className="text-[#6c757d] text-sm mt-1">Selamat datang di panel administrasi Portal E-Ujian</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="moodle-info-box" style={{ borderLeftColor: card.color }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-2xl font-bold text-[#333]">{card.value}</span>
            </div>
            <p className="text-[#6c757d] text-xs font-bold uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-admin p-4">
          <h3 className="text-[#333] font-bold border-b pb-2 mb-3">Tindakan Cepat</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/admin/exams" className="text-[#0f6cb6] hover:underline flex items-center gap-2 text-sm">
                <span>📝</span> Buat / Kelola Ujian
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="text-[#0f6cb6] hover:underline flex items-center gap-2 text-sm">
                <span>👥</span> Tambah Peserta Ujian
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Recent exams */}
        <div className="card-admin">
          <div className="p-4 border-b bg-[#f5f5f5]">
            <h3 className="text-[#333] font-bold text-sm">Ujian Terbaru</h3>
          </div>
          {recentExams.length === 0 ? (
            <div className="p-6 text-center text-[#6c757d] text-sm">
              <p>Belum ada ujian. Buat ujian pertama Anda!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="moodle-table">
                <thead>
                  <tr>
                    <th>Nama Ujian</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExams.map((exam) => {
                    const now = new Date();
                    const isActive = exam.is_active && new Date(exam.tanggal_mulai) <= now && new Date(exam.tanggal_selesai) >= now;
                    return (
                      <tr key={exam.id}>
                        <td>
                          <div className="font-semibold text-[#0f6cb6]">{exam.title}</div>
                          <div className="text-xs text-[#6c757d] mt-1">{exam.mata_pelajaran || '-'} • {exam.durasi} menit</div>
                        </td>
                        <td>
                          {isActive ? (
                            <span className="moodle-badge moodle-badge-success">Aktif</span>
                          ) : (
                            <span className="moodle-badge moodle-badge-default">Nonaktif</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/admin/exams/${exam.id}/results`} className="text-[#0f6cb6] text-xs font-semibold hover:underline">Lihat Hasil</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
