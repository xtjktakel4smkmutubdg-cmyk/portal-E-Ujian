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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #4f46e5 100%)' }}>

      {/* Animated mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07] animate-float"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.06] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }}></div>
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)', animation: 'float 10s ease-in-out infinite 1s' }}></div>

        {/* Small decorative dots */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-indigo-300/20 animate-float"></div>
        <div className="absolute top-[60%] right-[15%] w-3 h-3 rounded-full bg-violet-300/15 animate-float-slow"></div>
        <div className="absolute top-[80%] left-[30%] w-1.5 h-1.5 rounded-full bg-indigo-200/25 animate-float"></div>
        <div className="absolute top-[25%] right-[35%] w-2 h-2 rounded-full bg-purple-300/15" style={{ animation: 'float 7s ease-in-out infinite 2s' }}></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
      </div>

      <div className="w-full max-w-[420px] px-5 relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl mb-5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)' }}>
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Portal E-Ujian</h1>
          <p className="text-indigo-200/80 text-sm font-medium">Sistem Ujian Online Terintegrasi</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{ background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
          <h2 className="text-xl font-bold text-[var(--text)] mb-0.5">Login Peserta</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-7">Masukkan kredensial Anda untuk memulai ujian</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-100 flex items-center gap-2.5 animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="username">Username</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input id="username" type="text" required autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] input-glow transition-all bg-[var(--bg-alt)] hover:bg-white placeholder-[var(--text-muted)]"
                  placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input id="password" type="password" required autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] input-glow transition-all bg-[var(--bg-alt)] hover:bg-white placeholder-[var(--text-muted)]"
                  placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm btn-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gradient-primary"
              style={{ boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--text-muted)]">Hubungi administrator jika Anda belum memiliki akun</p>
          </div>
        </div>

        <p className="text-center text-indigo-300/50 text-xs mt-7 font-medium">
          © {new Date().getFullYear()} Portal E-Ujian • Sistem Ujian Online
        </p>
      </div>
    </div>
  );
}
