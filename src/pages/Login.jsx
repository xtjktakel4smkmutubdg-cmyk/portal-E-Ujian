import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent, user } = useAuth();

  if (user && user.role === 'siswa') return <Navigate to="/" replace />;
  if (user && user._isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      loginStudent(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-[420px] px-5">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-4"
            style={{ background: '#0f6cb6' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#333] mb-1">Portal E-Ujian</h1>
          <p className="text-[#6c757d] text-sm">Sistem Ujian Online Terintegrasi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded border p-8" style={{ borderColor: '#dee2e6', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 className="text-lg font-bold text-[#333] mb-1">Login Peserta</h2>
          <p className="text-[#6c757d] text-sm mb-6">Masukkan kredensial Anda untuk memulai ujian</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="moodle-alert moodle-alert-danger flex items-center gap-2 animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="moodle-label" htmlFor="username">Username</label>
              <input id="username" type="text" required autoComplete="username"
                className="moodle-input"
                placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div>
              <label className="moodle-label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password"
                className="moodle-input"
                placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded text-white font-bold text-sm disabled:opacity-50 transition-all mt-2"
              style={{ background: '#0f6cb6' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#dee2e6' }}>
            <p className="text-center text-xs text-[#6c757d]">Hubungi administrator jika Anda belum memiliki akun</p>
          </div>
        </div>

        <p className="text-center text-[#adb5bd] text-xs mt-6">
          © {new Date().getFullYear()} Portal E-Ujian • Sistem Ujian Online
        </p>
      </div>
    </div>
  );
}
