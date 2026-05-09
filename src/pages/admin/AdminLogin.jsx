import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin, user } = useAuth();

  if (user && user._isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      loginAdmin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-[400px] px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-4"
            style={{ background: '#0f6cb6' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Portal E-Ujian</h1>
          <p className="text-gray-500 text-sm mt-1">Akses Administrator</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded border p-6" style={{ borderColor: '#dee2e6', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Login Admin</h2>
          <p className="text-gray-500 text-sm mb-5">Masukkan kredensial administrator Anda</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="moodle-alert moodle-alert-danger flex items-center gap-2 animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            <div>
              <label className="moodle-label" htmlFor="admin-username">Username</label>
              <input id="admin-username" type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="moodle-input" placeholder="admin" autoComplete="username" />
            </div>
            <div>
              <label className="moodle-label" htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="moodle-input" placeholder="••••••••" autoComplete="current-password" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded text-white font-bold text-sm disabled:opacity-50 transition-all"
              style={{ background: '#0f6cb6' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </span>
              ) : '🔐 Masuk Admin Panel'}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-400 text-xs mt-6">Halaman ini khusus untuk administrator</p>
      </div>
    </div>
  );
}
