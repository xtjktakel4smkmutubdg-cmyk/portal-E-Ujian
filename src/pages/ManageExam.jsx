import React, { useState, useEffect } from 'react';

export default function ManageExam() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Exam Modal
    const [showExamModal, setShowExamModal] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [examForm, setExamForm] = useState({ title: '', durasi: 60, tanggal: new Date().toISOString().slice(0, 16) });

    // Question Modal
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [newQuestion, setNewQuestion] = useState({
        question_text: '',
        option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
        correct_answer: 'A',
        tipe: 'mcq'
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch exams');
            const data = await res.json();
            setExams(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openExamModal = (exam = null) => {
        if (exam) {
            setCurrentExam(exam);
            // format date for datetime-local input
            const dateObj = new Date(exam.tanggal);
            dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
            setExamForm({ title: exam.title, durasi: exam.durasi, tanggal: dateObj.toISOString().slice(0, 16) });
        } else {
            setCurrentExam(null);
            setExamForm({ title: '', durasi: 60, tanggal: new Date().toISOString().slice(0, 16) });
        }
        setShowExamModal(true);
    };

    const closeExamModal = () => {
        setShowExamModal(false);
        setCurrentExam(null);
    };

    const handleExamSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = currentExam ? `http://localhost:3000/api/exams/${currentExam.id}` : `http://localhost:3000/api/exams`;
            const method = currentExam ? 'PUT' : 'POST';

            const payload = {
                ...examForm,
                tanggal: new Date(examForm.tanggal).toISOString()
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save exam');

            await fetchExams();
            closeExamModal();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/exams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete exam');
            setExams(exams.filter(e => e.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const openQuestionModal = async (examId) => {
        setSelectedExamId(examId);
        await fetchQuestions(examId);
        setShowQuestionModal(true);
    };

    const closeQuestionModal = () => {
        setShowQuestionModal(false);
        setSelectedExamId(null);
        setQuestions([]);
        resetNewQuestion();
    };

    const fetchQuestions = async (examId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/exams/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch questions');
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (err) {
            alert(err.message);
        }
    };

    const resetNewQuestion = () => {
        setNewQuestion({
            question_text: '',
            option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
            correct_answer: 'A',
            tipe: 'mcq'
        });
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/exams/${selectedExamId}/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ questions: [newQuestion] })
            });

            if (!res.ok) throw new Error('Failed to add question');
            await fetchQuestions(selectedExamId);
            resetNewQuestion();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm('Delete question?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/api/exams/questions/${qId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete question');
            setQuestions(questions.filter(q => q.id !== qId));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading exams...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border-b">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f6cb6]">Course Management</h1>
                    <p className="text-sm text-gray-600">Site Administration / Courses / Manage exams and categories</p>
                </div>
                <button
                    onClick={() => openExamModal()}
                    className="bg-[#0f6cb6] text-white px-4 py-2 rounded text-sm hover:bg-[#0a528c]"
                >
                    Create new course/exam
                </button>
            </div>

            {error && <div className="text-red-500 bg-red-50 p-4 rounded border border-red-200">{error}</div>}

            <div className="bg-white shadow-sm rounded border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f8f9fa]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Exam Title</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map(exam => (
                            <tr key={exam.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-[#0f6cb6]">{exam.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{new Date(exam.tanggal).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{exam.durasi} mins</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center space-x-3">
                                    <button onClick={() => openQuestionModal(exam.id)} className="text-green-600 hover:text-green-900 hover:underline">Questions</button>
                                    <button onClick={() => openExamModal(exam)} className="text-[#0f6cb6] hover:text-[#0a528c] hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteExam(exam.id)} className="text-red-600 hover:text-red-900 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Exam Modal */}
            {showExamModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeExamModal}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleExamSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {currentExam ? 'Edit Exam Settings' : 'Add New Exam'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Course / Exam full name</label>
                                            <input type="text" required className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0f6cb6] sm:text-sm" value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Exam Date & Time</label>
                                            <input type="datetime-local" required className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0f6cb6] sm:text-sm" value={examForm.tanggal} onChange={(e) => setExamForm({...examForm, tanggal: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Time limit (minutes)</label>
                                            <input type="number" min="1" required className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-[#0f6cb6] sm:text-sm" value={examForm.durasi} onChange={(e) => setExamForm({...examForm, durasi: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" className="w-full inline-flex justify-center rounded border border-transparent shadow-sm px-4 py-2 bg-[#0f6cb6] text-base font-medium text-white hover:bg-[#0a528c] sm:ml-3 sm:w-auto sm:text-sm">
                                        Save and return
                                    </button>
                                    <button type="button" onClick={closeExamModal} className="mt-3 w-full inline-flex justify-center rounded border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeQuestionModal}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-[#0f6cb6]">Edit quiz</h3>
                                    <button onClick={closeQuestionModal} className="text-gray-400 hover:text-gray-500">
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Existing Questions */}
                                    <div className="bg-[#f8f9fa] border p-4 rounded">
                                        <h4 className="font-bold text-gray-700 mb-2">Questions ({questions.length})</h4>
                                        {questions.length === 0 ? <p className="text-sm text-gray-500">No questions have been added yet.</p> : (
                                            <ul className="divide-y divide-gray-200">
                                                {questions.map((q, idx) => (
                                                    <li key={q.id} className="py-3 flex justify-between bg-white px-3 mb-2 border rounded shadow-sm">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-500">{idx + 1}.</span>
                                                                <span className="text-sm" dangerouslySetInnerHTML={{__html: q.question_text}}></span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteQuestion(q.id)} className="ml-4 text-red-500 hover:text-red-700 text-sm">Delete</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Add New Question Form */}
                                    <div className="border border-[#0f6cb6] p-4 rounded">
                                        <h4 className="font-bold text-[#0f6cb6] mb-4 border-b pb-2">Add a new question (Multiple Choice)</h4>
                                        <form onSubmit={handleAddQuestion} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Question text</label>
                                                <textarea required rows="3" className="mt-1 block w-full border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-[#0f6cb6] sm:text-sm" value={newQuestion.question_text} onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}></textarea>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {['a', 'b', 'c', 'd', 'e'].map(letter => (
                                                    <div key={letter} className="flex items-center space-x-2">
                                                        <span className="font-bold text-gray-500 uppercase w-6">{letter}.</span>
                                                        <input type="text" required className="block w-full border border-gray-300 rounded py-1 px-2 text-sm focus:outline-none focus:ring-[#0f6cb6]" value={newQuestion[`option_${letter}`]} onChange={(e) => setNewQuestion({...newQuestion, [`option_${letter}`]: e.target.value})} />
                                                    </div>
                                                ))}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                                                <select className="mt-1 block w-full sm:w-32 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-[#0f6cb6] sm:text-sm" value={newQuestion.correct_answer} onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}>
                                                    <option value="A">A</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                    <option value="D">D</option>
                                                    <option value="E">E</option>
                                                </select>
                                            </div>

                                            <div className="pt-2">
                                                <button type="submit" className="bg-[#0f6cb6] text-white px-4 py-2 rounded text-sm hover:bg-[#0a528c]">Save changes</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
