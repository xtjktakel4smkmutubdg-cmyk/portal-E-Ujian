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

  const [form, setForm] = useState({ title:'', description:'', mata_pelajaran:'', durasi:60, tanggal_mulai:'', tanggal_selesai:'', show_result_to_student:false, shuffle_questions:true, shuffle_options:true, max_attempts:1, passing_grade:0, study_material_url:'' });
  const [qForm, setQForm] = useState({ question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', option_e:'', correct_answer:'A', tipe:'mcq', bobot:1 });

  const token = getToken();
  const headers = { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' };
  const toJakartaISO = (d) => { if(!d) return ''; return new Date(d).toLocaleString('sv-SE',{timeZone:'Asia/Jakarta'}).replace(' ','T').slice(0,16); };

  useEffect(() => { fetchExams(); }, []);
  const fetchExams = async () => { try { const r = await fetch('/api/exams',{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok) setExams(await r.json()); } catch(e){console.error(e);} finally{setLoading(false);} };
  
  const openCreate = () => { setEditExam(null); const n=new Date(); const l=new Date(n.getTime()+3600000); setForm({title:'',description:'',mata_pelajaran:'',durasi:60,tanggal_mulai:toJakartaISO(n),tanggal_selesai:toJakartaISO(l),show_result_to_student:false,shuffle_questions:true,shuffle_options:true,max_attempts:1,passing_grade:0, study_material_url:''}); setShowModal(true); };
  const openEdit = (exam) => { setEditExam(exam); setForm({title:exam.title,description:exam.description||'',mata_pelajaran:exam.mata_pelajaran||'',durasi:exam.durasi,tanggal_mulai:toJakartaISO(exam.tanggal_mulai),tanggal_selesai:toJakartaISO(exam.tanggal_selesai),show_result_to_student:exam.show_result_to_student,shuffle_questions:exam.shuffle_questions,shuffle_options:exam.shuffle_options,max_attempts:exam.max_attempts,passing_grade:exam.passing_grade||0, study_material_url:exam.study_material_url||''}); setShowModal(true); };
  
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#0f6cb6] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="moodle-breadcrumb">
        <Link to="/admin/dashboard">Dashboard</Link>
        <span className="separator">/</span>
        <span>Manajemen Ujian</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#333]">Manajemen Ujian</h1>
        <button onClick={openCreate} className="moodle-btn moodle-btn-primary">+ Buat Ujian Baru</button>
      </div>

      <div className="card-admin overflow-x-auto">
        {exams.length===0 ? (
          <div className="p-10 text-center text-[#6c757d]">
            <p>Belum ada ujian yang dibuat.</p>
          </div>
        ) : (
          <table className="moodle-table">
            <thead>
              <tr>
                <th>Judul Ujian</th>
                <th>Mata Pelajaran</th>
                <th>Waktu & Durasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => {
                const now=new Date(); 
                const isActive=exam.is_active&&new Date(exam.tanggal_mulai)<=now&&new Date(exam.tanggal_selesai)>=now;
                return (
                  <tr key={exam.id}>
                    <td className="font-semibold text-[#0f6cb6]">{exam.title}</td>
                    <td>{exam.mata_pelajaran || '-'}</td>
                    <td>
                      <div className="text-sm">{new Date(exam.tanggal_mulai).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</div>
                      <div className="text-xs text-[#6c757d]">{exam.durasi} menit</div>
                    </td>
                    <td>
                      {isActive ? <span className="moodle-badge moodle-badge-success">Aktif</span> : exam.is_active ? <span className="moodle-badge moodle-badge-info">Terjadwal</span> : <span className="moodle-badge moodle-badge-default">Nonaktif</span>}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={()=>openQuestions(exam.id)} className="moodle-btn moodle-btn-success text-xs py-1 px-2">📝 Soal</button>
                        <Link to={`/admin/exams/${exam.id}/results`} className="moodle-btn moodle-btn-primary text-xs py-1 px-2">📈 Hasil</Link>
                        <button onClick={()=>openEdit(exam)} className="moodle-btn moodle-btn-secondary text-xs py-1 px-2">✏️ Edit</button>
                        <button onClick={()=>handleDelete(exam.id)} className="moodle-btn moodle-btn-danger text-xs py-1 px-2">🗑️ Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Main Exam Modal */}
      {showModal && (
        <div className="moodle-modal-overlay">
          <div className="moodle-modal">
            <div className="moodle-modal-header">
              <h2>{editExam ? 'Edit Pengaturan Ujian' : 'Tambah Ujian Baru'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-[#666] hover:text-[#333]">✖</button>
            </div>
            <form onSubmit={handleSaveExam}>
              <div className="moodle-modal-body space-y-4">
                <div>
                  <label className="moodle-label">Judul Ujian *</label>
                  <input required className="moodle-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Contoh: Ujian Tengah Semester Genap"/>
                </div>
                <div>
                  <label className="moodle-label">Mata Pelajaran</label>
                  <input className="moodle-input" value={form.mata_pelajaran} onChange={e=>setForm({...form,mata_pelajaran:e.target.value})} placeholder="Contoh: Matematika"/>
                </div>
                <div>
                  <label className="moodle-label">Materi Belajar (URL PDF/Word)</label>
                  <input className="moodle-input" value={form.study_material_url} onChange={e=>setForm({...form,study_material_url:e.target.value})} placeholder="URL Materi (Google Drive/S3) opsional"/>
                </div>
                <div>
                  <label className="moodle-label">Deskripsi</label>
                  <textarea className="moodle-input" rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Instruksi tambahan..."/>
                </div>
                
                <div className="moodle-section-header mt-4">Jadwal & Waktu</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="moodle-label">Waktu Mulai (WIB) *</label>
                    <input type="datetime-local" required className="moodle-input" value={form.tanggal_mulai} onChange={e=>setForm({...form,tanggal_mulai:e.target.value})}/>
                  </div>
                  <div>
                    <label className="moodle-label">Waktu Selesai (WIB) *</label>
                    <input type="datetime-local" required className="moodle-input" value={form.tanggal_selesai} onChange={e=>setForm({...form,tanggal_selesai:e.target.value})}/>
                  </div>
                </div>

                <div className="moodle-section-header mt-4">Pengaturan Penilaian & Eksekusi</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="moodle-label">Durasi (menit) *</label>
                    <input type="number" min="1" required className="moodle-input" value={form.durasi} onChange={e=>setForm({...form,durasi:Number(e.target.value)})}/>
                  </div>
                  <div>
                    <label className="moodle-label">Max Percobaan</label>
                    <input type="number" min="1" className="moodle-input" value={form.max_attempts} onChange={e=>setForm({...form,max_attempts:Number(e.target.value)})}/>
                  </div>
                  <div>
                    <label className="moodle-label">Batas Lulus (0-100)</label>
                    <input type="number" min="0" max="100" className="moodle-input" value={form.passing_grade} onChange={e=>setForm({...form,passing_grade:Number(e.target.value)})}/>
                  </div>
                </div>
                
                <div className="mt-4 border p-3 bg-[#f9f9f9]">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={form.shuffle_questions} onChange={e=>setForm({...form,shuffle_questions:e.target.checked})} />
                    <span className="text-sm font-semibold">Acak Urutan Soal</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={form.shuffle_options} onChange={e=>setForm({...form,shuffle_options:e.target.checked})} />
                    <span className="text-sm font-semibold">Acak Opsi Jawaban</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.show_result_to_student} onChange={e=>setForm({...form,show_result_to_student:e.target.checked})} />
                    <span className="text-sm font-semibold">Tampilkan Nilai ke Siswa</span>
                  </label>
                </div>
              </div>
              <div className="moodle-modal-footer">
                <button type="button" onClick={()=>setShowModal(false)} className="moodle-btn moodle-btn-secondary">Batal</button>
                <button type="submit" className="moodle-btn moodle-btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQModal && (
        <div className="moodle-modal-overlay">
          <div className="moodle-modal moodle-modal-lg">
            <div className="moodle-modal-header">
              <div className="flex items-center gap-4">
                <h2>Bank Soal Ujian</h2>
                <span className="moodle-badge moodle-badge-info">{questions.length} Soal</span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowAiModal(true)} className="moodle-btn moodle-btn-success text-xs">✨ Import AI</button>
                <button onClick={()=>setShowQModal(false)} className="text-[#666] hover:text-[#333] ml-2">✖</button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row">
              {/* Question Form Sidebar */}
              <div id="qFormContainer" className="w-full md:w-1/3 p-4 bg-[#f9f9f9] border-b md:border-b-0 md:border-r">
                <h3 className="font-bold text-[#0f6cb6] mb-4">
                  {isEditingQuestion ? 'Edit Soal' : 'Tambah Soal'}
                </h3>
                <form onSubmit={saveQuestion} className="space-y-4">
                  <div>
                    <label className="moodle-label">Pertanyaan *</label>
                    <textarea required rows="3" className="moodle-input" value={qForm.question_text} onChange={e=>setQForm({...qForm,question_text:e.target.value})} placeholder="Teks soal..."/>
                  </div>
                  
                  {['a','b','c','d','e'].map(l=>(
                    <div key={l}>
                      <label className="moodle-label text-xs">Opsi {l.toUpperCase()} {l!=='e'&&'*'}</label>
                      <input className="moodle-input text-sm py-1.5" value={qForm[`option_${l}`]} onChange={e=>setQForm({...qForm,[`option_${l}`]:e.target.value})} required={l!=='e'}/>
                    </div>
                  ))}

                  <div>
                    <label className="moodle-label">Jawaban Benar</label>
                    <select className="moodle-input" value={qForm.correct_answer} onChange={e=>setQForm({...qForm,correct_answer:e.target.value})}>
                      {['A','B','C','D','E'].map(v=><option key={v} value={v}>Opsi {v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="moodle-label">Bobot Nilai</label>
                    <input type="number" min="1" className="moodle-input" value={qForm.bobot} onChange={e=>setQForm({...qForm,bobot:Number(e.target.value)})}/>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button type="submit" className="moodle-btn moodle-btn-primary w-full justify-center">
                      {isEditingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
                    </button>
                    {isEditingQuestion && (
                      <button type="button" onClick={cancelEdit} className="moodle-btn moodle-btn-secondary w-full justify-center">Batal Edit</button>
                    )}
                  </div>
                </form>
              </div>

              {/* Questions List */}
              <div className="w-full md:w-2/3 p-4 overflow-y-auto max-h-[60vh]">
                {questions.length === 0 ? (
                  <div className="text-center text-[#666] py-10">Belum ada soal. Silakan tambahkan.</div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={q.id} className="border p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[#333] flex gap-2">
                            <span className="bg-[#0f6cb6] text-white w-6 h-6 flex items-center justify-center rounded-sm text-xs">{i+1}</span>
                            <span dangerouslySetInnerHTML={{__html:q.question_text}}></span>
                          </h4>
                          <div className="flex gap-1 ml-2">
                            <button onClick={()=>editQuestionClick(q)} className="text-[#0f6cb6] hover:underline text-xs">Edit</button>
                            <span className="text-[#ccc]">|</span>
                            <button onClick={()=>deleteQuestion(q.id)} className="text-[#d9534f] hover:underline text-xs">Hapus</button>
                          </div>
                        </div>
                        <ul className="text-sm space-y-1 ml-8">
                          {['a','b','c','d','e'].map(l => q[`option_${l}`] && (
                            <li key={l} className={q.correct_answer === l.toUpperCase() ? "font-bold text-[#5cb85c]" : "text-[#333]"}>
                              {l.toUpperCase()}. {q[`option_${l}`]}
                              {q.correct_answer === l.toUpperCase() && " (Benar)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal */}
      {showAiModal && (
        <div className="moodle-modal-overlay">
          <div className="moodle-modal">
            <div className="moodle-modal-header">
              <h2>Import Soal via AI</h2>
              <button onClick={()=>setShowAiModal(false)} className="text-[#666] hover:text-[#333]">✖</button>
            </div>
            <div className="moodle-modal-body space-y-4">
              <div className="moodle-alert moodle-alert-info">
                <strong>Langkah 1:</strong> Copy prompt di bawah ini dan berikan ke AI (ChatGPT/Claude/Gemini).
                <div className="mt-2 bg-white border p-2 text-xs font-mono overflow-auto max-h-32">
                  {aiPromptTemplate}
                </div>
              </div>
              
              <div>
                <label className="moodle-label">Langkah 2: Paste Hasil JSON dari AI</label>
                <textarea 
                  rows="8" 
                  className="moodle-input font-mono text-xs" 
                  placeholder="[ { ... } ]"
                  value={aiImportText}
                  onChange={(e) => setAiImportText(e.target.value)}
                />
              </div>
            </div>
            <div className="moodle-modal-footer">
              <button onClick={()=>setShowAiModal(false)} className="moodle-btn moodle-btn-secondary">Tutup</button>
              <button onClick={handleImportAI} disabled={!aiImportText.trim()} className="moodle-btn moodle-btn-primary disabled:opacity-50">Jalankan Import</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
