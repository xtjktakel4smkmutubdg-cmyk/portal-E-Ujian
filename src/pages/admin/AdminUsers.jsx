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

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">Manajemen Pengguna</h1>
          <p className="text-[#6c757d] text-sm mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportData} className="moodle-btn moodle-btn-secondary">
            Export CSV
          </button>
          <button onClick={()=>{setBulkText('');setBulkResult(null);setShowBulkModal(true);}} className="moodle-btn moodle-btn-secondary">
            📋 Bulk Import
          </button>
          <button onClick={openCreate} className="moodle-btn moodle-btn-primary">
            + Tambah User
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input className="moodle-input" placeholder="🔍 Cari nama atau username..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 bg-[#f5f5f5] p-1 border rounded">
          {[{key:'all',label:'Semua'},{key:'siswa',label:'Siswa'},{key:'admin',label:'Admin'}].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${filter===f.key?'bg-white border text-[#0f6cb6] shadow-sm':'text-[#6c757d] hover:text-[#333] border border-transparent'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="moodle-table">
            <thead>
              <tr>
                {['Nama','Username','Role','Kelas','No. Peserta','Status','Aksi'].map(h=><th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan="7" className="text-center text-[#6c757d] py-10 font-medium">Tidak ada pengguna ditemukan</td></tr>
              ) : filtered.map(u=>(
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#0f6cb6] text-white flex items-center justify-center font-bold text-xs">
                        {u.nama?.charAt(0)}
                      </div>
                      <span className="font-semibold text-[#0f6cb6]">{u.nama}</span>
                    </div>
                  </td>
                  <td className="text-[#6c757d] font-mono text-sm">{u.username}</td>
                  <td>
                    <span className={`moodle-badge ${u.role==='admin'?'moodle-badge-danger':'moodle-badge-info'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-[#333] font-medium">{u.kelas||'-'}</td>
                  <td className="text-[#333] font-medium">{u.no_peserta||'-'}</td>
                  <td>
                    <button onClick={()=>toggleActive(u)} className={`moodle-badge cursor-pointer ${u.is_active?'moodle-badge-success':'moodle-badge-default'}`}>
                      {u.is_active?'Aktif':'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={()=>openEdit(u)} className="text-[#0f6cb6] text-sm font-semibold hover:underline">Edit</button>
                      <span className="text-[#ccc]">|</span>
                      <button onClick={()=>handleDelete(u.id)} className="text-[#d9534f] text-sm font-semibold hover:underline">Hapus</button>
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
        <div className="moodle-modal-overlay">
          <div className="moodle-modal">
            <div className="moodle-modal-header">
              <h2>{editUser?'Edit Pengguna':'Tambah Pengguna'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-[#666] hover:text-[#333]">✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="moodle-modal-body space-y-4">
                <div>
                  <label className="moodle-label">Nama *</label>
                  <input required className="moodle-input" value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="Masukkan nama lengkap"/>
                </div>
                <div>
                  <label className="moodle-label">Username *</label>
                  <input required className="moodle-input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Masukkan username unik"/>
                </div>
                <div>
                  <label className="moodle-label">{editUser?'Password Baru (opsional)':'Password *'}</label>
                  <input type="password" required={!editUser} className="moodle-input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder={editUser ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="moodle-label">Role</label>
                    <select className="moodle-input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                      <option value="siswa">Siswa</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="moodle-label">Kelas</label>
                    <input className="moodle-input" value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})} placeholder="XII-IPA-1"/>
                  </div>
                  <div>
                    <label className="moodle-label">No. Peserta</label>
                    <input className="moodle-input" value={form.no_peserta} onChange={e=>setForm({...form,no_peserta:e.target.value})} placeholder="001234"/>
                  </div>
                </div>
              </div>
              <div className="moodle-modal-footer">
                <button type="button" onClick={()=>setShowModal(false)} className="moodle-btn moodle-btn-secondary">Batal</button>
                <button type="submit" className="moodle-btn moodle-btn-primary">Simpan Pengguna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK IMPORT */}
      {showBulkModal && (
        <div className="moodle-modal-overlay">
          <div className="moodle-modal">
            <div className="moodle-modal-header">
              <h2>📋 Bulk Import Siswa</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-[#666] hover:text-[#333]">✖</button>
            </div>
            <div className="moodle-modal-body space-y-4">
              <div className="moodle-alert moodle-alert-info">
                <strong>Format yang didukung (Setiap baris adalah satu pengguna):</strong><br/>
                <code>Nama Lengkap, Username, Password, Kelas, No.Peserta</code><br/>
                <small>* Kolom Password, Kelas, dan No.Peserta opsional. Default password: password123</small>
              </div>
              <div>
                <label className="moodle-label">Data CSV (Paste di sini)</label>
                <textarea className="moodle-input font-mono text-xs" rows="8" value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Ahmad Fauzi, ahmad.fauzi, pass123, XII-IPA-1, 001&#10;Budi Santoso, budi.santoso, pass123, XII-IPA-1, 002"/>
              </div>
              {bulkResult && (
                <div className="moodle-alert moodle-alert-success">
                  ✅ Berhasil menambahkan {bulkResult.created} pengguna!
                </div>
              )}
            </div>
            <div className="moodle-modal-footer">
              <button onClick={()=>setShowBulkModal(false)} className="moodle-btn moodle-btn-secondary">Tutup</button>
              <button onClick={handleBulkCreate} disabled={!bulkText.trim()} className="moodle-btn moodle-btn-primary disabled:opacity-40">Mulai Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
