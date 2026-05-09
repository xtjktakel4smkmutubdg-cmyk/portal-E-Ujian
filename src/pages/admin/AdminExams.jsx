import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminExams() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [showQModal, setShowQModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ title:'', description:'', mata_pelajaran:'', durasi:60, tanggal_mulai:'', tanggal_selesai:'', show_result_to_student:false, shuffle_questions:true, shuffle_options:true, max_attempts:1, passing_grade:0 });
  const [qForm, setQForm] = useState({ question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', option_e:'', correct_answer:'A', tipe:'mcq', bobot:1 });

  const token = getToken();
  const headers = { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' };
  const toJakartaISO = (d) => { if(!d) return ''; return new Date(d).toLocaleString('sv-SE',{timeZone:'Asia/Jakarta'}).replace(' ','T').slice(0,16); };

  useEffect(() => { fetchExams(); }, []);
  const fetchExams = async () => { try { const r = await fetch('/api/exams',{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok) setExams(await r.json()); } catch(e){console.error(e);} finally{setLoading(false);} };
  const openCreate = () => { setEditExam(null); const n=new Date(); const l=new Date(n.getTime()+3600000); setForm({title:'',description:'',mata_pelajaran:'',durasi:60,tanggal_mulai:toJakartaISO(n),tanggal_selesai:toJakartaISO(l),show_result_to_student:false,shuffle_questions:true,shuffle_options:true,max_attempts:1,passing_grade:0}); setShowModal(true); };
  const openEdit = (exam) => { setEditExam(exam); setForm({title:exam.title,description:exam.description||'',mata_pelajaran:exam.mata_pelajaran||'',durasi:exam.durasi,tanggal_mulai:toJakartaISO(exam.tanggal_mulai),tanggal_selesai:toJakartaISO(exam.tanggal_selesai),show_result_to_student:exam.show_result_to_student,shuffle_questions:exam.shuffle_questions,shuffle_options:exam.shuffle_options,max_attempts:exam.max_attempts,passing_grade:exam.passing_grade||0}); setShowModal(true); };
  const handleSaveExam = async (e) => { e.preventDefault(); const url=editExam?`/api/exams/${editExam.id}`:'/api/exams'; const method=editExam?'PUT':'POST'; const t_m=new Date(form.tanggal_mulai+'+07:00').toISOString(); const t_s=new Date(form.tanggal_selesai+'+07:00').toISOString(); try { const r=await fetch(url,{method,headers,body:JSON.stringify({...form,tanggal_mulai:t_m,tanggal_selesai:t_s})}); if(!r.ok) throw new Error('Gagal menyimpan'); await fetchExams(); setShowModal(false); } catch(e){alert(e.message);} };
  const handleDelete = async (id) => { if(!confirm('Hapus ujian ini?')) return; try { await fetch(`/api/exams/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}}); await fetchExams(); } catch(e){alert(e.message);} };
  const openQuestions = async (examId) => { setSelectedExamId(examId); try { const r=await fetch(`/api/exams/${examId}`,{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok){const d=await r.json();setQuestions(d.questions||[]);} } catch(e){console.error(e);} setQForm({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',option_e:'',correct_answer:'A',tipe:'mcq',bobot:1}); setShowQModal(true); };
  const addQuestion = async (e) => { e.preventDefault(); try { const r=await fetch(`/api/exams/${selectedExamId}/questions`,{method:'POST',headers,body:JSON.stringify({questions:[qForm]})}); if(!r.ok) throw new Error('Gagal'); const d=await r.json(); setQuestions([...questions,...d]); setQForm({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',option_e:'',correct_answer:'A',tipe:'mcq',bobot:1}); } catch(e){alert(e.message);} };
  const deleteQuestion = async (qId) => { if(!confirm('Hapus soal?')) return; try { await fetch(`/api/exams/questions/${qId}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}}); setQuestions(questions.filter(q=>q.id!==qId)); } catch(e){alert(e.message);} };

  const iCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-[var(--admin-accent)] input-glow-admin transition-all";
  const iBg = { background:'rgba(12,15,26,0.6)', border:'1px solid var(--admin-border)' };
  const lCls = "block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5";

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Ujian</h1><p className="text-[var(--admin-text-secondary)] text-sm mt-1 font-medium">Kelola ujian, soal, dan pengaturan</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-primary" style={{boxShadow:'0 4px 16px rgba(79,70,229,0.3)'}}>+ Buat Ujian</button>
      </div>

      <div className="space-y-3">
        {exams.length===0 ? (
          <div className="card-admin p-14 text-center"><div className="text-4xl mb-3 opacity-60">📝</div><p className="text-[var(--admin-text-secondary)] font-medium">Belum ada ujian.</p></div>
        ) : exams.map(exam => {
          const now=new Date(); const isActive=exam.is_active&&new Date(exam.tanggal_mulai)<=now&&new Date(exam.tanggal_selesai)>=now;
          return (
            <div key={exam.id} className="card-admin p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><h3 className="text-white font-bold">{exam.title}</h3><span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isActive?'bg-emerald-500/15 text-emerald-400':'bg-white/5 text-[var(--admin-text-secondary)]'}`}>{isActive?'Aktif':exam.is_active?'Terjadwal':'Nonaktif'}</span></div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--admin-text-secondary)] font-medium"><span>📚 {exam.mata_pelajaran||'-'}</span><span>⏱ {exam.durasi} menit</span><span>📅 {new Date(exam.tanggal_mulai).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'})}</span><span>📊 {exam.total_submissions||0}</span></div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>openQuestions(exam.id)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20 transition-all">Soal</button>
                  <Link to={`/admin/exams/${exam.id}/results`} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/12 text-violet-400 hover:bg-violet-500/20 transition-all">Hasil</Link>
                  <button onClick={()=>openEdit(exam)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] hover:bg-indigo-500/20 transition-all">Edit</button>
                  <button onClick={()=>handleDelete(exam.id)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/12 text-red-400 hover:bg-red-500/20 transition-all">Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border animate-scale-in" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b" style={{borderColor:'var(--admin-border)'}}><h2 className="text-xl font-bold text-white">{editExam?'Edit Ujian':'Buat Ujian Baru'}</h2></div>
            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div><label className={lCls}>Judul *</label><input required className={iCls} style={iBg} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Judul ujian"/></div>
              <div><label className={lCls}>Mata Pelajaran</label><input className={iCls} style={iBg} value={form.mata_pelajaran} onChange={e=>setForm({...form,mata_pelajaran:e.target.value})}/></div>
              <div><label className={lCls}>Deskripsi</label><textarea className={iCls} style={iBg} rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lCls}>Mulai *</label><input type="datetime-local" required className={iCls} style={iBg} value={form.tanggal_mulai} onChange={e=>setForm({...form,tanggal_mulai:e.target.value})}/></div>
                <div><label className={lCls}>Selesai *</label><input type="datetime-local" required className={iCls} style={iBg} value={form.tanggal_selesai} onChange={e=>setForm({...form,tanggal_selesai:e.target.value})}/></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={lCls}>Durasi (mnt) *</label><input type="number" min="1" required className={iCls} style={iBg} value={form.durasi} onChange={e=>setForm({...form,durasi:Number(e.target.value)})}/></div>
                <div><label className={lCls}>Max Percobaan</label><input type="number" min="1" className={iCls} style={iBg} value={form.max_attempts} onChange={e=>setForm({...form,max_attempts:Number(e.target.value)})}/></div>
                <div><label className={lCls}>Passing (%)</label><input type="number" min="0" max="100" className={iCls} style={iBg} value={form.passing_grade} onChange={e=>setForm({...form,passing_grade:Number(e.target.value)})}/></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{key:'shuffle_questions',label:'Acak Soal'},{key:'shuffle_options',label:'Acak Opsi'},{key:'show_result_to_student',label:'Tampil Nilai'}].map(item=>(
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all" style={{borderColor:form[item.key]?'var(--admin-accent)':'var(--admin-border)',background:form[item.key]?'var(--admin-accent-soft)':'transparent'}}>
                    <input type="checkbox" checked={form[item.key]} onChange={e=>setForm({...form,[item.key]:e.target.checked})} className="sr-only"/>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${form[item.key]?'bg-[var(--admin-accent)] border-[var(--admin-accent)]':'border-[var(--admin-text-secondary)]'}`}>{form[item.key]&&<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}</div>
                    <span className="text-[var(--admin-text-secondary)] text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t" style={{borderColor:'var(--admin-border)'}}>
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-semibold hover:bg-white/[0.04]" style={{borderColor:'var(--admin-border)'}}>Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(4px)'}}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border animate-scale-in" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b flex items-center justify-between" style={{borderColor:'var(--admin-border)'}}>
              <h2 className="text-xl font-bold text-white">Kelola Soal ({questions.length})</h2>
              <button onClick={()=>setShowQModal(false)} className="text-[var(--admin-text-secondary)] hover:text-white p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-6 space-y-6">
              {questions.length>0&&<div className="space-y-2">{questions.map((q,i)=>(<div key={q.id} className="rounded-xl p-4 border flex items-start gap-3" style={{background:'var(--admin-bg)',borderColor:'var(--admin-border)'}}><span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] flex-shrink-0">{i+1}</span><div className="flex-1 min-w-0"><p className="text-[var(--admin-text)] text-sm" dangerouslySetInnerHTML={{__html:q.question_text}}></p><div className="flex flex-wrap gap-2 mt-2">{['a','b','c','d','e'].map(l=>q[`option_${l}`]&&<span key={l} className={`text-xs px-2 py-1 rounded-lg font-medium ${q.correct_answer===l.toUpperCase()?'bg-emerald-500/15 text-emerald-400':'bg-white/5 text-[var(--admin-text-secondary)]'}`}>{l.toUpperCase()}: {q[`option_${l}`].substring(0,30)}</span>)}</div></div><button onClick={()=>deleteQuestion(q.id)} className="text-red-400 text-xs font-semibold">Hapus</button></div>))}</div>}
              <div className="rounded-xl p-5 border" style={{borderColor:'var(--admin-accent)',background:'var(--admin-accent-soft)'}}>
                <h3 className="text-[var(--admin-accent)] font-bold text-sm mb-4">+ Tambah Soal Baru</h3>
                <form onSubmit={addQuestion} className="space-y-3">
                  <div><label className={lCls}>Teks Soal *</label><textarea required rows="2" className={iCls} style={iBg} value={qForm.question_text} onChange={e=>setQForm({...qForm,question_text:e.target.value})}/></div>
                  <div className="space-y-2">{['a','b','c','d','e'].map(l=>(<div key={l} className="flex items-center gap-2"><span className="w-7 text-center font-bold text-[var(--admin-text-secondary)] text-sm">{l.toUpperCase()}</span><input className={iCls} style={iBg} value={qForm[`option_${l}`]} onChange={e=>setQForm({...qForm,[`option_${l}`]:e.target.value})} placeholder={`Opsi ${l.toUpperCase()}`} required={l!=='e'}/></div>))}</div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={lCls}>Jawaban Benar</label><select className={iCls} style={iBg} value={qForm.correct_answer} onChange={e=>setQForm({...qForm,correct_answer:e.target.value})}>{['A','B','C','D','E'].map(v=><option key={v} value={v}>{v}</option>)}</select></div><div><label className={lCls}>Bobot</label><input type="number" min="1" className={iCls} style={iBg} value={qForm.bobot} onChange={e=>setQForm({...qForm,bobot:Number(e.target.value)})}/></div></div>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold btn-premium gradient-success" style={{boxShadow:'0 4px 12px rgba(16,185,129,0.25)'}}>Tambah Soal</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
