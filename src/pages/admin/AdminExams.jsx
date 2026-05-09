import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminExams() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  
  // Question Modal States
  const [showQModal, setShowQModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);
  
  // AI Import States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiImportText, setAiImportText] = useState('');

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
  
  const openQuestions = async (examId) => { 
    setSelectedExamId(examId); 
    setIsEditingQuestion(false);
    setEditQuestionId(null);
    try { 
      const r=await fetch(`/api/exams/${examId}`,{headers:{'Authorization':`Bearer ${token}`}}); 
      if(r.ok){const d=await r.json();setQuestions(d.questions||[]);} 
    } catch(e){console.error(e);} 
    setQForm({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',option_e:'',correct_answer:'A',tipe:'mcq',bobot:1}); 
    setShowQModal(true); 
  };

  const saveQuestion = async (e) => { 
    e.preventDefault(); 
    try { 
      if (isEditingQuestion) {
        const r = await fetch(`/api/exams/questions/${editQuestionId}`, { method: 'PUT', headers, body: JSON.stringify(qForm) });
        if (!r.ok) throw new Error('Gagal update soal');
        const d = await r.json();
        setQuestions(questions.map(q => q.id === editQuestionId ? d : q));
        setIsEditingQuestion(false);
        setEditQuestionId(null);
      } else {
        const r=await fetch(`/api/exams/${selectedExamId}/questions`,{method:'POST',headers,body:JSON.stringify({questions:[qForm]})}); 
        if(!r.ok) throw new Error('Gagal tambah soal'); 
        const d=await r.json(); 
        setQuestions([...questions,...d]); 
      }
      setQForm({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',option_e:'',correct_answer:'A',tipe:'mcq',bobot:1}); 
    } catch(e){alert(e.message);} 
  };

  const deleteQuestion = async (qId) => { if(!confirm('Hapus soal?')) return; try { await fetch(`/api/exams/questions/${qId}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}}); setQuestions(questions.filter(q=>q.id!==qId)); } catch(e){alert(e.message);} };
  
  const editQuestionClick = (q) => {
    setQForm({
      question_text: q.question_text || '',
      option_a: q.option_a || '', option_b: q.option_b || '',
      option_c: q.option_c || '', option_d: q.option_d || '',
      option_e: q.option_e || '', correct_answer: q.correct_answer || 'A',
      tipe: q.tipe || 'mcq', bobot: q.bobot || 1
    });
    setIsEditingQuestion(true);
    setEditQuestionId(q.id);
    document.getElementById('qFormContainer')?.scrollIntoView({behavior: 'smooth'});
  };

  const cancelEdit = () => {
    setIsEditingQuestion(false);
    setEditQuestionId(null);
    setQForm({question_text:'',option_a:'',option_b:'',option_c:'',option_d:'',option_e:'',correct_answer:'A',tipe:'mcq',bobot:1});
  };

  const handleImportAI = async () => {
    try {
      const parsed = JSON.parse(aiImportText);
      if (!Array.isArray(parsed)) throw new Error('Format JSON harus berupa Array');
      const r = await fetch(`/api/exams/${selectedExamId}/questions`, {
        method: 'POST', headers, body: JSON.stringify({ questions: parsed })
      });
      if (!r.ok) throw new Error('Gagal import soal');
      const d = await r.json();
      setQuestions([...questions, ...d]);
      setAiImportText('');
      setShowAiModal(false);
      alert(`Berhasil import ${parsed.length} soal!`);
    } catch (e) {
      alert('Error import: ' + e.message + '\nPastikan format JSON sudah benar sesuai contoh.');
    }
  };

  const aiPromptTemplate = `Saya ingin kamu membuat 5 soal ujian pilihan ganda (A-E) untuk mata pelajaran [Tulis Pelajaran].
Tolong hasilkan dalam format Array JSON yang persis sama dengan struktur berikut (jangan tambahkan teks lain selain JSON agar bisa langsung di-copy).

Contoh Format:
[
  {
    "question_text": "Apa ibu kota negara Indonesia?",
    "option_a": "Bandung",
    "option_b": "Jakarta",
    "option_c": "Surabaya",
    "option_d": "Medan",
    "option_e": "Semarang",
    "correct_answer": "B",
    "bobot": 1
  }
]`;

  const iCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5280] focus:outline-none focus:border-[var(--admin-accent)] input-glow-admin transition-all";
  const iBg = { background:'rgba(12,15,26,0.6)', border:'1px solid var(--admin-border)' };
  const lCls = "block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1.5";

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Manajemen Ujian</h1><p className="text-[var(--admin-text-secondary)] mt-1 font-medium">Kelola ujian, soal, dan pengaturan sistem</p></div>
        <button onClick={openCreate} className="px-6 py-3 rounded-xl text-white text-sm font-bold btn-premium gradient-primary" style={{boxShadow:'0 4px 16px rgba(79,70,229,0.3)'}}>+ Buat Ujian</button>
      </div>

      <div className="space-y-4">
        {exams.length===0 ? (
          <div className="card-admin p-16 text-center"><div className="text-5xl mb-4 opacity-60">📝</div><p className="text-[var(--admin-text-secondary)] text-lg font-medium">Belum ada ujian yang dibuat.</p></div>
        ) : exams.map(exam => {
          const now=new Date(); const isActive=exam.is_active&&new Date(exam.tanggal_mulai)<=now&&new Date(exam.tanggal_selesai)>=now;
          return (
            <div key={exam.id} className="card-admin p-6 hover:border-[var(--admin-accent)] transition-colors duration-300">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white text-lg font-bold">{exam.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${isActive?'bg-emerald-500/15 text-emerald-400':'bg-white/5 text-[var(--admin-text-secondary)]'}`}>{isActive?'Aktif':exam.is_active?'Terjadwal':'Nonaktif'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--admin-text-secondary)] font-medium">
                    <span className="flex items-center gap-1">📚 {exam.mata_pelajaran||'-'}</span>
                    <span className="flex items-center gap-1">⏱ {exam.durasi} menit</span>
                    <span className="flex items-center gap-1">📅 {new Date(exam.tanggal_mulai).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'})}</span>
                    <span className="flex items-center gap-1">📊 {exam.total_submissions||0} Mengerjakan</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 grid grid-cols-2 sm:flex">
                  <button onClick={()=>openQuestions(exam.id)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20 transition-all text-center">📝 Soal</button>
                  <Link to={`/admin/exams/${exam.id}/results`} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-violet-500/12 text-violet-400 hover:bg-violet-500/20 transition-all text-center">📈 Hasil</Link>
                  <button onClick={()=>openEdit(exam)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] hover:bg-indigo-500/20 transition-all text-center">✏️ Edit</button>
                  <button onClick={()=>handleDelete(exam.id)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/12 text-red-400 hover:bg-red-500/20 transition-all text-center">🗑️ Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(8px)'}}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl animate-scale-in" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-8 border-b" style={{borderColor:'var(--admin-border)'}}>
              <h2 className="text-2xl font-extrabold text-white">{editExam?'Edit Detail Ujian':'Buat Ujian Baru'}</h2>
              <p className="text-[var(--admin-text-secondary)] mt-1 text-sm font-medium">Lengkapi pengaturan jadwal dan sistem penilaian.</p>
            </div>
            <form onSubmit={handleSaveExam} className="p-8 space-y-5">
              <div><label className={lCls}>Judul Ujian *</label><input required className={iCls} style={iBg} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Contoh: Ujian Tengah Semester Genap"/></div>
              <div><label className={lCls}>Mata Pelajaran</label><input className={iCls} style={iBg} value={form.mata_pelajaran} onChange={e=>setForm({...form,mata_pelajaran:e.target.value})} placeholder="Contoh: Matematika"/></div>
              <div><label className={lCls}>Deskripsi</label><textarea className={iCls} style={iBg} rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Instruksi tambahan..."/></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className={lCls}>Waktu Mulai (WIB) *</label><input type="datetime-local" required className={iCls} style={iBg} value={form.tanggal_mulai} onChange={e=>setForm({...form,tanggal_mulai:e.target.value})}/></div>
                <div><label className={lCls}>Waktu Selesai (WIB) *</label><input type="datetime-local" required className={iCls} style={iBg} value={form.tanggal_selesai} onChange={e=>setForm({...form,tanggal_selesai:e.target.value})}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div><label className={lCls}>Durasi (menit) *</label><input type="number" min="1" required className={iCls} style={iBg} value={form.durasi} onChange={e=>setForm({...form,durasi:Number(e.target.value)})}/></div>
                <div><label className={lCls}>Max Percobaan</label><input type="number" min="1" className={iCls} style={iBg} value={form.max_attempts} onChange={e=>setForm({...form,max_attempts:Number(e.target.value)})}/></div>
                <div><label className={lCls}>Batas Lulus (0-100)</label><input type="number" min="0" max="100" className={iCls} style={iBg} value={form.passing_grade} onChange={e=>setForm({...form,passing_grade:Number(e.target.value)})}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[{key:'shuffle_questions',label:'Acak Urutan Soal'},{key:'shuffle_options',label:'Acak Opsi Jawaban'},{key:'show_result_to_student',label:'Tampilkan Nilai'}].map(item=>(
                  <label key={item.key} className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all" style={{borderColor:form[item.key]?'var(--admin-accent)':'var(--admin-border)',background:form[item.key]?'var(--admin-accent-soft)':'transparent'}}>
                    <input type="checkbox" checked={form[item.key]} onChange={e=>setForm({...form,[item.key]:e.target.checked})} className="sr-only"/>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${form[item.key]?'bg-[var(--admin-accent)] border-[var(--admin-accent)]':'border-[var(--admin-text-secondary)]'}`}>{form[item.key]&&<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}</div>
                    <span className="text-[var(--admin-text-secondary)] text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-4 pt-6 border-t" style={{borderColor:'var(--admin-border)'}}>
                <button type="button" onClick={()=>setShowModal(false)} className="w-1/3 py-3.5 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-bold hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>Batal</button>
                <button type="submit" className="w-2/3 py-3.5 rounded-xl text-white text-sm font-bold btn-premium gradient-primary shadow-lg shadow-indigo-500/20">Simpan Ujian</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQModal && (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{backdropFilter:'blur(8px)'}}>
          <div className="w-full max-w-5xl max-h-[95vh] h-full flex flex-col rounded-3xl border shadow-2xl animate-scale-in" style={{background:'var(--admin-bg)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 md:p-8 border-b flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--admin-card)] rounded-t-3xl" style={{borderColor:'var(--admin-border)'}}>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Bank Soal ({questions.length} Butir)</h2>
                <p className="text-[var(--admin-text-secondary)] text-sm font-medium mt-1">Atur, edit, dan import pertanyaan ujian.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={()=>setShowAiModal(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold btn-premium gradient-primary shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                  <span>✨ Import dari AI</span>
                </button>
                <button onClick={()=>setShowQModal(false)} className="p-2.5 rounded-xl border text-[var(--admin-text-secondary)] hover:text-white hover:bg-white/5 transition-all" style={{borderColor:'var(--admin-border)'}}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((q,i)=>(
                    <div key={q.id} className="rounded-2xl p-6 border flex flex-col md:flex-row md:items-start gap-5 transition-all hover:border-[var(--admin-accent)]/50" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] flex-shrink-0">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base mb-4 font-medium leading-relaxed" dangerouslySetInnerHTML={{__html:q.question_text}}></p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['a','b','c','d','e'].map(l=>q[`option_${l}`]&&
                            <div key={l} className={`flex items-start gap-3 p-3 rounded-xl border ${q.correct_answer===l.toUpperCase()?'border-emerald-500/30 bg-emerald-500/10':'border-[var(--admin-border)] bg-black/20'}`}>
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${q.correct_answer===l.toUpperCase()?'bg-emerald-500 text-white':'bg-white/10 text-[var(--admin-text-secondary)]'}`}>{l.toUpperCase()}</span>
                              <span className={`text-sm ${q.correct_answer===l.toUpperCase()?'text-emerald-400 font-semibold':'text-[var(--admin-text-secondary)]'}`}>{q[`option_${l}`]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 mt-4 md:mt-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-5" style={{borderColor:'var(--admin-border)'}}>
                        <button onClick={()=>editQuestionClick(q)} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent)] hover:text-white transition-all text-center">Edit</button>
                        <button onClick={()=>deleteQuestion(q.id)} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-center">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--admin-border)]">
                  <div className="text-4xl mb-3 opacity-40">📭</div>
                  <p className="text-[var(--admin-text-secondary)] font-semibold">Bank soal masih kosong.</p>
                </div>
              )}

              <div id="qFormContainer" className="rounded-3xl p-6 md:p-8 border relative overflow-hidden" style={{borderColor:'var(--admin-border)',background:'var(--admin-card)'}}>
                <div className="absolute top-0 left-0 w-full h-1" style={{background: isEditingQuestion ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                <h3 className="text-white text-xl font-extrabold mb-6 flex items-center gap-3">
                  {isEditingQuestion ? <><span className="text-amber-400">✏️</span> Update Soal #{questions.findIndex(q=>q.id===editQuestionId)+1}</> : <><span className="text-emerald-400">✨</span> Tambah Soal Baru</>}
                </h3>
                
                <form onSubmit={saveQuestion} className="space-y-5">
                  <div>
                    <label className={lCls}>Pertanyaan *</label>
                    <textarea required rows="4" className={iCls} style={iBg} value={qForm.question_text} onChange={e=>setQForm({...qForm,question_text:e.target.value})} placeholder="Ketik pertanyaan di sini..."/>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                    {['a','b','c','d','e'].map(l=>(
                      <div key={l} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider ml-1">Pilihan {l.toUpperCase()} {l!=='e'&&'*'}</label>
                        <div className="flex items-center gap-3">
                          <input className={iCls} style={iBg} value={qForm[`option_${l}`]} onChange={e=>setQForm({...qForm,[`option_${l}`]:e.target.value})} placeholder={`Jawaban ${l.toUpperCase()}`} required={l!=='e'}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t" style={{borderColor:'var(--admin-border)'}}>
                    <div>
                      <label className={lCls}>Kunci Jawaban Benar</label>
                      <select className={iCls} style={{...iBg, cursor:'pointer'}} value={qForm.correct_answer} onChange={e=>setQForm({...qForm,correct_answer:e.target.value})}>
                        {['A','B','C','D','E'].map(v=><option key={v} value={v} className="bg-gray-900">Pilihan {v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Bobot Nilai</label>
                      <input type="number" min="1" className={iCls} style={iBg} value={qForm.bobot} onChange={e=>setQForm({...qForm,bobot:Number(e.target.value)})}/>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {isEditingQuestion && <button type="button" onClick={cancelEdit} className="w-1/3 py-3.5 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-bold hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>Batal Edit</button>}
                    <button type="submit" className={`${isEditingQuestion?'w-2/3':'w-full'} py-3.5 rounded-xl text-white text-sm font-bold btn-premium shadow-lg ${isEditingQuestion?'gradient-warning shadow-amber-500/20':'gradient-success shadow-emerald-500/20'}`}>
                      {isEditingQuestion ? '💾 Simpan Perubahan' : '➕ Tambahkan ke Bank Soal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fade-in" style={{backdropFilter:'blur(12px)'}}>
          <div className="w-full max-w-3xl rounded-3xl border shadow-2xl animate-scale-in flex flex-col max-h-[90vh]" style={{background:'var(--admin-card)',borderColor:'var(--admin-border)'}}>
            <div className="p-6 border-b flex justify-between items-center" style={{borderColor:'var(--admin-border)'}}>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2"><span>✨</span> Import Soal via AI</h2>
              <button onClick={()=>setShowAiModal(false)} className="text-[var(--admin-text-secondary)] hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5">
                <h3 className="text-indigo-400 font-bold mb-2">Langkah 1: Salin Prompt Ini</h3>
                <p className="text-[var(--admin-text-secondary)] text-sm mb-3">Copy teks di bawah dan berikan ke AI seperti ChatGPT, Claude, atau Gemini.</p>
                <div className="relative group">
                  <pre className="bg-black/40 p-4 rounded-xl text-xs text-indigo-200 whitespace-pre-wrap font-mono border border-indigo-500/20">
                    {aiPromptTemplate}
                  </pre>
                  <button onClick={()=>{navigator.clipboard.writeText(aiPromptTemplate); alert('Prompt tersalin!');}} className="absolute top-2 right-2 p-2 bg-indigo-500/20 text-indigo-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500 text-xs font-bold">Copy Prompt</button>
                </div>
              </div>

              <div>
                <h3 className="text-emerald-400 font-bold mb-2">Langkah 2: Paste Hasil JSON dari AI</h3>
                <p className="text-[var(--admin-text-secondary)] text-sm mb-3">Tempelkan teks format Array JSON yang diberikan oleh AI di kotak bawah ini.</p>
                <textarea 
                  rows="8" 
                  className={`${iCls} font-mono text-xs`} 
                  style={iBg} 
                  placeholder="[\n  {\n    &#34;question_text&#34;: &#34;...&#34;,\n    ...\n  }\n]"
                  value={aiImportText}
                  onChange={(e) => setAiImportText(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button onClick={()=>setShowAiModal(false)} className="w-1/3 py-3 rounded-xl border text-[var(--admin-text-secondary)] text-sm font-bold hover:bg-white/[0.04] transition-all" style={{borderColor:'var(--admin-border)'}}>Tutup</button>
                <button onClick={handleImportAI} disabled={!aiImportText.trim()} className="w-2/3 py-3 rounded-xl text-white text-sm font-bold btn-premium gradient-primary disabled:opacity-50">Jalankan Import</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

