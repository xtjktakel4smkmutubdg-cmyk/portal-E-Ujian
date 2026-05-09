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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0c0f1a 0%, #111627 40%, #171c2e 100%)' }}>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(129, 140, 248, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(129, 140, 248, 0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06] animate-float"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent 70%)' }}></div>
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.04] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}></div>
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-red-400/20 animate-float"></div>
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-indigo-400/15 animate-float-slow"></div>
      </div>

      <div className="w-full max-w-[420px] px-5 animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Panel</h1>
          <p className="text-[var(--admin-text-secondary)] text-sm mt-1.5 font-medium">Portal E-Ujian • Akses Administrator</p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(23, 28, 46, 0.9)', border: '1px solid rgba(42, 48, 80, 0.6)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3.5 rounded-xl text-sm flex items-center gap-2.5 animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-2">Username Admin</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-red-400 input-glow-admin transition-all"
                style={{ background: 'rgba(12, 15, 26, 0.7)', border: '1px solid rgba(42, 48, 80, 0.6)' }}
                placeholder="admin" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-red-400 input-glow-admin transition-all"
                style={{ background: 'rgba(12, 15, 26, 0.7)', border: '1px solid rgba(42, 48, 80, 0.6)' }}
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm btn-premium disabled:opacity-50 gradient-danger"
              style={{ boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </span>
              ) : '🔐 Masuk Admin Panel'}
            </button>
          </form>
        </div>
        <p className="text-center text-[var(--admin-text-secondary)] text-xs mt-7 opacity-50">Halaman ini khusus untuk administrator</p>
      </div>
    </div>
  );
}
