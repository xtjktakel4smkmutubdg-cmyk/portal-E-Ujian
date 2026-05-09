import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ nama: '', username: '', password: '', role: 'siswa', kelas: '', no_peserta: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const token = getToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ nama: '', username: '', password: '', role: 'siswa', kelas: '', no_peserta: '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ nama: u.nama, username: u.username, password: '', role: u.role, kelas: u.kelas || '', no_peserta: u.no_peserta || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editUser ? `/api/users/${editUser.id}` : '/api/users';
    const method = editUser ? 'PUT' : 'POST';
    const payload = { ...form };
    if (editUser && !payload.password) delete payload.password;
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchUsers();
      setShowModal(false);
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchUsers();
    } catch (e) { alert(e.message); }
  };

  const toggleActive = async (u) => {
    try {
      await fetch(`/api/users/${u.id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: !u.is_active }) });
      await fetchUsers();
    } catch (e) { alert(e.message); }
  };

  const handleBulkCreate = async () => {
    try {
      const lines = bulkText.trim().split('\n').filter(l => l.trim());
      const users = lines.map(line => {
        const parts = line.split(',').map(s => s.trim());
        return { nama: parts[0], username: parts[1], password: parts[2] || 'password123', kelas: parts[3] || '', no_peserta: parts[4] || '' };
      });

      if (users.some(u => !u.nama || !u.username)) {
        return alert('Setiap baris harus memiliki nama dan username');
      }

      const res = await fetch('/api/users/bulk', { method: 'POST', headers, body: JSON.stringify({ users }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setBulkResult(data);
      await fetchUsers();
    } catch (e) { alert(e.message); }
  };

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search && !u.nama.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inputStyle = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputBg = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Pengguna</h1>
          <p className="text-gray-400 text-sm">{users.length} pengguna terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setBulkText(''); setBulkResult(null); setShowBulkModal(true); }}
            className="px-4 py-2 rounded-xl text-sm font-medium border text-gray-300 hover:bg-white/5 transition-all" style={{ borderColor: '#334155' }}>
            📋 Bulk Import
          </button>
          <button onClick={openCreate}
            className="px-5 py-2 rounded-xl text-white text-sm font-bold hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            + Tambah User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input className={inputStyle} style={inputBg} placeholder="🔍 Cari nama atau username..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'siswa', label: 'Siswa' },
            { key: 'admin', label: 'Admin' }
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === f.key ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-gray-400 border-[#334155] hover:bg-white/5'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#1e293b', borderColor: '#334155' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Nama', 'Username', 'Role', 'Kelas', 'No. Peserta', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium text-xs uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-gray-500 py-12">Tidak ada pengguna ditemukan</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid #334155' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                        {u.nama?.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{u.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.kelas || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.no_peserta || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-all ${u.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-blue-400 text-xs hover:underline">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 text-xs hover:underline">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <div className="p-6 border-b" style={{ borderColor: '#334155' }}>
              <h2 className="text-xl font-bold text-white">{editUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Lengkap *</label><input required className={inputStyle} style={inputBg} value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Username *</label><input required className={inputStyle} style={inputBg} value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">{editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label><input type="password" required={!editUser} className={inputStyle} style={inputBg} value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                  <select className={inputStyle} style={inputBg} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="siswa">Siswa</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Kelas</label><input className={inputStyle} style={inputBg} value={form.kelas} onChange={e => setForm({...form, kelas: e.target.value})} placeholder="XII-IPA-1" /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">No. Peserta</label><input className={inputStyle} style={inputBg} value={form.no_peserta} onChange={e => setForm({...form, no_peserta: e.target.value})} /></div>
              </div>
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#334155' }}>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-gray-300 text-sm font-medium hover:bg-white/5" style={{ borderColor: '#334155' }}>Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border" style={{ background: '#1e293b', borderColor: '#334155' }}>
            <div className="p-6 border-b" style={{ borderColor: '#334155' }}>
              <h2 className="text-xl font-bold text-white">📋 Bulk Import Pengguna</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                <p className="font-medium mb-1">Format per baris (dipisahkan koma):</p>
                <code className="text-xs text-blue-200 block mt-1">Nama, Username, Password, Kelas, No.Peserta</code>
                <code className="text-xs text-blue-200/60 block mt-1">Contoh: Ahmad Fauzi, ahmad.fauzi, password123, XII-IPA-1, 001</code>
              </div>
              <textarea className={inputStyle} style={inputBg} rows="8" value={bulkText} onChange={e => setBulkText(e.target.value)}
                placeholder="Budi Santoso, budi.santoso, pass123, XII-IPA-1, 001&#10;Siti Aminah, siti.aminah, pass123, XII-IPA-2, 002" />

              {bulkResult && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm">
                  ✅ Berhasil menambahkan {bulkResult.created} pengguna!
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowBulkModal(false)} className="flex-1 py-2.5 rounded-xl border text-gray-300 text-sm font-medium hover:bg-white/5" style={{ borderColor: '#334155' }}>Tutup</button>
                <button onClick={handleBulkCreate} disabled={!bulkText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  Import Pengguna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
