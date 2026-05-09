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
  const handleSave = async (e) => { e.preventDefault(); const url=editUser?`/api/users/${editUser.id}`:'/api/users'; const method=editUser?'PUT':'POST'; const payload={...form}; if(editUser&&!payload.password) delete payload.password; try { const r=await fetch(url,{method,headers,body:JSON.stringify(payload)}); if(!r.ok){const d=await r.json();throw new Error(d.error);} await fetchUsers(); setShowModal(false); } catch(e){alert(e.message);} };
  const handleDelete = async (id) => { if(!confirm('Hapus pengguna ini?')) return; try { const r=await fetch(`/api/users/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}}); if(!r.ok){const d=await r.json();throw new Error(d.error);} await fetchUsers(); } catch(e){alert(e.message);} };
  const toggleActive = async (u) => { try { await fetch(`/api/users/${u.id}`,{method:'PUT',headers,body:JSON.stringify({is_active:!u.is_active})}); await fetchUsers(); } catch(e){alert(e.message);} };
  const handleBulkCreate = async () => { try { const lines=bulkText.trim().split('\n').filter(l=>l.trim()); const usrs=lines.map(line=>{const p=line.split(',').map(s=>s.trim());return{nama:p[0],username:p[1],password:p[2]||'password123',kelas:p[3]||'',no_peserta:p[4]||''};}); if(usrs.some(u=>!u.nama||!u.username)) return alert('Setiap baris harus memiliki nama dan username'); const r=await fetch('/api/users/bulk',{method:'POST',headers,body:JSON.stringify({users:usrs})}); if(!r.ok){const d=await r.json();throw new Error(d.error);} setBulkResult(await r.json()); await fetchUsers(); } catch(e){alert(e.message);} };

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search && !u.nama.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const iCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-[var(--admin-accent)] input-glow-admin transition-all";
  const iBg = { background:'rgba(12,15,26,0.6)', border:'1px solid var(--admin-border)' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Pengguna</h1><p className="text-[var(--admin-text-secondary)] text-sm font-medium">{users.length} pengguna terdaftar</p></div>
        <div className="flex gap-2">
          <button onClick={()=>{setBulkText('');setBulkResult(null);setShowBulkModal(true);}} className="px-4 py-2 rounded-xl text-sm font-semibold border text-[var(--admin-text-secondary)] hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>📋 Bulk Import</button>
          <button onClick={openCreate} className="px-5 py-2 rounded-xl text-white text-sm font-bold btn-premium gradient-primary" style={{boxShadow:'0 4px 16px rgba(79,70,229,0.3)'}}>+ Tambah User</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><input className={iCls} style={iBg} placeholder="🔍 Cari nama atau username..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="flex gap-2">
          {[{key:'all',label:'Semua'},{key:'siswa',label:'Siswa'},{key:'admin',label:'Admin'}].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${filter===f.key?'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] border-[var(--admin-accent)]':'text-[var(--admin-text-secondary)] border-[var(--admin-border)] hover:bg-white/[0.04]'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid var(--admin-border)'}}>{['Nama','Username','Role','Kelas','No. Peserta','Status','Aksi'].map(h=><th key={h} className="text-left text-[var(--admin-text-secondary)] font-semibold text-xs uppercase px-4 py-3.5 tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan="7" className="text-center text-[var(--admin-text-secondary)] py-12 font-medium">Tidak ada pengguna ditemukan</td></tr>
              : filtered.map(u=>(
                <tr key={u.id} className="hover:bg-white/[0.02] transition-all" style={{borderBottom:'1px solid var(--admin-border)'}}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:u.role==='admin'?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#4f46e5,#6366f1)'}}>{u.nama?.charAt(0)}</div><span className="text-white font-semibold">{u.nama}</span></div></td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)] font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.role==='admin'?'bg-red-500/12 text-red-400':'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{u.kelas||'-'}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{u.no_peserta||'-'}</td>
                  <td className="px-4 py-3"><button onClick={()=>toggleActive(u)} className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-all ${u.is_active?'bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20':'bg-white/5 text-[var(--admin-text-secondary)] hover:bg-white/10'}`}>{u.is_active?'Aktif':'Nonaktif'}</button></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={()=>openEdit(u)} className="text-[var(--admin-accent)] text-xs font-semibold hover:underline">Edit</button><button onClick={()=>handleDelete(u.id)} className="text-red-400 text-xs font-semibold hover:underline">Hapus</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-lg rounded-2xl border animate-scale-in" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b" style={{borderColor:'var(--admin-border)'}}><h2 className="text-xl font-bold text-white">{editUser?'Edit Pengguna':'Tambah Pengguna'}</h2></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">Nama *</label><input required className={iCls} style={iBg} value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})}/></div>
              <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">Username *</label><input required className={iCls} style={iBg} value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></div>
              <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">{editUser?'Password Baru (opsional)':'Password *'}</label><input type="password" required={!editUser} className={iCls} style={iBg} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">Role</label><select className={iCls} style={iBg} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="siswa">Siswa</option><option value="admin">Admin</option></select></div>
                <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">Kelas</label><input className={iCls} style={iBg} value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})} placeholder="XII-IPA-1"/></div>
                <div><label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5">No. Peserta</label><input className={iCls} style={iBg} value={form.no_peserta} onChange={e=>setForm({...form,no_peserta:e.target.value})}/></div>
              </div>
              <div className="flex gap-3 pt-4 border-t" style={{borderColor:'var(--admin-border)'}}>
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-semibold hover:bg-white/[0.04]" style={{borderColor:'var(--admin-border)'}}>Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-xl rounded-2xl border animate-scale-in" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b" style={{borderColor:'var(--admin-border)'}}><h2 className="text-xl font-bold text-white">📋 Bulk Import</h2></div>
            <div className="p-6 space-y-4">
              <div className="bg-[var(--admin-accent-soft)] border border-[var(--admin-accent)]/20 rounded-xl p-4 text-sm text-[var(--admin-accent)]">
                <p className="font-semibold mb-1">Format: Nama, Username, Password, Kelas, No.Peserta</p>
                <code className="text-xs opacity-70 block mt-1">Ahmad Fauzi, ahmad.fauzi, password123, XII-IPA-1, 001</code>
              </div>
              <textarea className={iCls} style={iBg} rows="8" value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Budi Santoso, budi.santoso, pass123, XII-IPA-1, 001"/>
              {bulkResult && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm font-semibold">✅ Berhasil menambahkan {bulkResult.created} pengguna!</div>}
              <div className="flex gap-3">
                <button onClick={()=>setShowBulkModal(false)} className="flex-1 py-2.5 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-semibold hover:bg-white/[0.04]" style={{borderColor:'var(--admin-border)'}}>Tutup</button>
                <button onClick={handleBulkCreate} disabled={!bulkText.trim()} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 btn-premium gradient-success">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
