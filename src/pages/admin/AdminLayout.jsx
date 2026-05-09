import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/exams', label: 'Manajemen Ujian', icon: '📝' },
  { path: '/admin/users', label: 'Manajemen Pengguna', icon: '👥' },
  { path: '/admin/violations', label: 'Monitor Kecurangan', icon: '⚠️' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f5f5' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-[240px] flex-shrink-0 flex flex-col transition-transform duration-200`}
        style={{ background: '#fff', borderRight: '1px solid #dee2e6' }}>
        {/* Site branding */}
        <div className="p-4 border-b" style={{ borderColor: '#dee2e6', background: '#0f6cb6' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-white/20 text-white text-sm font-bold">
              📋
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Portal E-Ujian</h2>
              <p className="text-blue-100 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-2 px-2">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all mb-0.5 ${
                isActive
                  ? 'bg-blue-50 text-[#0f6cb6] font-bold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={({ isActive }) => isActive ? { borderLeft: '3px solid #0f6cb6' } : { borderLeft: '3px solid transparent' }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: '#dee2e6' }}>
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: '#0f6cb6' }}>
              {user?.nama?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm font-semibold truncate">{user?.nama}</p>
              <p className="text-gray-500 text-xs">Administrator</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full py-2 rounded text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all border"
            style={{ borderColor: '#dee2e6' }}>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top navbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 h-[50px] border-b"
          style={{ background: '#0f6cb6', borderColor: '#0a528c' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-1 md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <span className="text-white font-bold text-sm">Site Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-blue-100 text-xs hidden sm:block">
              Login sebagai <strong className="text-white">{user?.nama}</strong>
            </span>
            <button onClick={logout}
              className="text-blue-100 hover:text-white text-xs font-medium transition-colors">
              Log out
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
