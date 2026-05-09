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
  const [form, setForm] = useState({ nama:'', username:'', password:'', role:'siswa', kelas:'', no_peserta:'' });
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const token = getToken();
  const headers = { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' };

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { try { const r=await fetch('/api/users',{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok) setUsers(await r.json()); } catch(e){console.error(e);} finally{setLoading(false);} };
  const openCreate = () => { setEditUser(null); setForm({nama:'',username:'',password:'',role:'siswa',kelas:'',no_peserta:''}); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({nama:u.nama,username:u.username,password:'',role:u.role,kelas:u.kelas||'',no_peserta:u.no_peserta||''}); setShowModal(true); };
  
  const handleSave = async (e) => { 
    e.preventDefault(); 
    const url = editUser ? `/api/users/${editUser.id}` : '/api/users'; 
    const method = editUser ? 'PUT' : 'POST'; 
    const payload = {...form}; 
    if (editUser && !payload.password) delete payload.password; 
    try { 
      const r = await fetch(url, {method, headers, body: JSON.stringify(payload)}); 
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); } 
      await fetchUsers(); 
      setShowModal(false); 
    } catch(e) { alert(e.message); } 
  };
  
  const handleDelete = async (id) => { 
    if (!confirm('Hapus pengguna ini?')) return; 
    try { 
      const r = await fetch(`/api/users/${id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}); 
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); } 
      await fetchUsers(); 
    } catch(e) { alert(e.message); } 
  };
  
  const toggleActive = async (u) => { 
    try { 
      await fetch(`/api/users/${u.id}`, {method:'PUT', headers, body: JSON.stringify({is_active:!u.is_active})}); 
      await fetchUsers(); 
    } catch(e) { alert(e.message); } 
  };
  
  const handleBulkCreate = async () => { 
    try { 
      const lines = bulkText.trim().split('\n').filter(l=>l.trim()); 
      const usrs = lines.map(line => {
        const p = line.split(',').map(s=>s.trim());
        return {nama:p[0], username:p[1], password:p[2]||'password123', kelas:p[3]||'', no_peserta:p[4]||''};
      }); 
      if (usrs.some(u => !u.nama || !u.username)) return alert('Setiap baris harus memiliki nama dan username'); 
      const r = await fetch('/api/users/bulk', {method:'POST', headers, body:JSON.stringify({users:usrs})}); 
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); } 
      setBulkResult(await r.json()); 
      await fetchUsers(); 
    } catch(e) { alert(e.message); } 
  };

  const handleExportData = () => {
    const csvHeaders = ['Nama', 'Username', 'Role', 'Kelas', 'No. Peserta', 'Status', 'Catatan Password'];
    const csvRows = [
      csvHeaders.join(','),
      ...filtered.map(u => [
        `"${u.nama}"`,
        `"${u.username}"`,
        `"${u.role}"`,
        `"${u.kelas || '-'}"`,
        `"${u.no_peserta || '-'}"`,
        `"${u.is_active ? 'Aktif' : 'Nonaktif'}"`,
        `"Terenkripsi (Gunakan default password jika belum diubah)"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Login_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search && !u.nama.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const iCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-[var(--admin-accent)] input-glow-admin transition-all";
  const iBg = { background:'rgba(12,15,26,0.6)', border:'1px solid var(--admin-border)' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Pengguna</h1>
          <p className="text-[var(--admin-text-secondary)] text-sm font-medium mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportData} className="px-5 py-2.5 rounded-xl text-sm font-semibold border text-[var(--admin-text-secondary)] hover:bg-white/[0.04] transition-all flex items-center gap-2" style={{borderColor:'var(--admin-border)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={()=>{setBulkText('');setBulkResult(null);setShowBulkModal(true);}} className="px-5 py-2.5 rounded-xl text-sm font-semibold border text-[var(--admin-text-secondary)] hover:bg-white/[0.04] transition-all flex items-center gap-2" style={{borderColor:'var(--admin-border)'}}>
            📋 Bulk Import
          </button>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-primary flex items-center gap-2" style={{boxShadow:'0 4px 16px rgba(79,70,229,0.3)'}}>
            + Tambah User
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input className={iCls} style={iBg} placeholder="🔍 Cari nama atau username..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2">
          {[{key:'all',label:'Semua'},{key:'siswa',label:'Siswa'},{key:'admin',label:'Admin'}].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all border ${filter===f.key?'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] border-[var(--admin-accent)]':'text-[var(--admin-text-secondary)] border-[var(--admin-border)] hover:bg-white/[0.04]'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom:'1px solid var(--admin-border)'}}>
                {['Nama','Username','Role','Kelas','No. Peserta','Status','Aksi'].map(h=>
                  <th key={h} className="text-left text-[var(--admin-text-secondary)] font-semibold text-xs uppercase px-5 py-4 tracking-wider">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan="7" className="text-center text-[var(--admin-text-secondary)] py-12 font-medium">Tidak ada pengguna ditemukan</td></tr>
              ) : filtered.map(u=>(
                <tr key={u.id} className="hover:bg-white/[0.02] transition-all" style={{borderBottom:'1px solid var(--admin-border)'}}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner" style={{background:u.role==='admin'?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#4f46e5,#6366f1)'}}>
                        {u.nama?.charAt(0)}
                      </div>
                      <span className="text-white font-semibold text-base">{u.nama}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--admin-text-secondary)] font-mono text-sm">{u.username}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${u.role==='admin'?'bg-red-500/12 text-red-400 border border-red-500/20':'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] border border-[var(--admin-accent)]/20'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--admin-text-secondary)] font-medium">{u.kelas||'-'}</td>
                  <td className="px-5 py-4 text-[var(--admin-text-secondary)] font-medium">{u.no_peserta||'-'}</td>
                  <td className="px-5 py-4">
                    <button onClick={()=>toggleActive(u)} className={`text-xs px-3 py-1.5 rounded-full font-bold cursor-pointer transition-all border ${u.is_active?'bg-emerald-500/12 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20':'bg-white/5 text-[var(--admin-text-secondary)] border-white/10 hover:bg-white/10'}`}>
                      {u.is_active?'Aktif':'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-4">
                      <button onClick={()=>openEdit(u)} className="text-[var(--admin-accent)] text-sm font-semibold hover:text-white transition-colors">Edit</button>
                      <button onClick={()=>handleDelete(u.id)} className="text-red-400 text-sm font-semibold hover:text-red-300 transition-colors">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL USER (CREATE/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(8px)'}}>
          <div className="w-full max-w-xl rounded-2xl border animate-scale-in shadow-2xl" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b" style={{borderColor:'var(--admin-border)'}}>
              <h2 className="text-2xl font-bold text-white">{editUser?'Edit Pengguna':'Tambah Pengguna'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">Nama *</label>
                <input required className={iCls} style={iBg} value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="Masukkan nama lengkap"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">Username *</label>
                <input required className={iCls} style={iBg} value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Masukkan username unik"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">{editUser?'Password Baru (opsional)':'Password *'}</label>
                <input type="password" required={!editUser} className={iCls} style={iBg} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder={editUser ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">Role</label>
                  <select className={iCls} style={iBg} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="siswa">Siswa</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">Kelas</label>
                  <input className={iCls} style={iBg} value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})} placeholder="XII-IPA-1"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">No. Peserta</label>
                  <input className={iCls} style={iBg} value={form.no_peserta} onChange={e=>setForm({...form,no_peserta:e.target.value})} placeholder="001234"/>
                </div>
              </div>
              <div className="flex gap-4 pt-6 mt-4 border-t" style={{borderColor:'var(--admin-border)'}}>
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-3 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-bold hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-bold btn-premium gradient-primary shadow-lg">Simpan Pengguna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK IMPORT */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(8px)'}}>
          <div className="w-full max-w-2xl rounded-2xl border animate-scale-in shadow-2xl" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b flex justify-between items-center" style={{borderColor:'var(--admin-border)'}}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">📋 Bulk Import Siswa</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-[var(--admin-text-secondary)] hover:text-white transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[var(--admin-accent-soft)] border border-[var(--admin-accent)]/30 rounded-xl p-5 text-sm text-[var(--admin-accent)]">
                <p className="font-bold mb-2">Format yang didukung (Setiap baris adalah satu pengguna):</p>
                <code className="text-xs font-mono bg-black/20 p-2 rounded block text-[var(--admin-accent)] opacity-90 border border-[var(--admin-accent)]/10">
                  Nama Lengkap, Username, Password, Kelas, No.Peserta
                </code>
                <p className="mt-3 text-xs opacity-80">* Kolom Password, Kelas, dan No.Peserta bersifat opsional. Jika password kosong, default 'password123' akan digunakan.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--admin-text-secondary)] mb-2">Data CSV (Paste di sini)</label>
                <textarea className={`${iCls} font-mono text-xs`} style={iBg} rows="10" value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Ahmad Fauzi, ahmad.fauzi, pass123, XII-IPA-1, 001&#10;Budi Santoso, budi.santoso, pass123, XII-IPA-1, 002"/>
              </div>
              {bulkResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Berhasil menambahkan {bulkResult.created} pengguna!
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={()=>setShowBulkModal(false)} className="flex-1 py-3 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-bold hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>Tutup</button>
                <button onClick={handleBulkCreate} disabled={!bulkText.trim()} className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 btn-premium gradient-success shadow-lg">Mulai Import</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

