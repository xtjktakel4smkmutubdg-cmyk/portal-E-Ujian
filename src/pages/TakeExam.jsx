import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TakeExam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch exam details
                const examRes = await fetch(`/api/exams/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!examRes.ok) throw new Error('Exam not found');
                const examData = await examRes.json();
                setExam(examData);

                // Check if user has already taken it
                const resultRes = await fetch(`/api/attempts/exam/${id}/results/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resultRes.ok) {
                    const resultData = await resultRes.json();
                    if (resultData.answers && resultData.answers.length > 0) {
                        setResult(resultData);
                    }
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchExamDetails();
    }, [id]);

    const handleStartAttempt = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const qRes = await fetch(`/api/attempts/exam/${id}/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!qRes.ok) throw new Error('Failed to load questions');
            const qData = await qRes.json();

            setQuestions(qData);
            setStarted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (qId, val) => {
        setAnswers({ ...answers, [qId]: val });
    };

    const handleSubmitExam = async () => {
        if (!window.confirm('Once you submit, you will no longer be able to change your answers for this attempt. Submit?')) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/attempts/exam/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers })
            });

            if (!res.ok) throw new Error('Failed to submit exam');

            // Reload page to show results
            window.location.reload();
        } catch (err) {
            alert(err.message);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="bg-red-50 text-red-500 p-4 rounded border border-red-200">{error}</div>;
    if (!exam) return <div>Exam not found.</div>;

    if (result) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold text-[#0f6cb6] mb-4">{exam.title}</h1>
                    <div className="bg-green-50 text-green-800 p-4 rounded mb-6 border border-green-200">
                        <h2 className="font-bold mb-2">You have completed this exam.</h2>
                        <p>Total Score: <strong>{result.totalScore}</strong> / {result.answers.length}</p>
                        <p>Percentage: <strong>{((result.totalScore / result.answers.length) * 100).toFixed(1)}%</strong></p>
                    </div>

                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Review Answers</h3>
                    <div className="space-y-6">
                        {result.answers.map((item, idx) => {
                            const isCorrect = item.answer === item.questions.correct_answer;
                            return (
                                <div key={idx} className={`p-4 border rounded ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 border border-gray-300 rounded flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="mb-2 font-medium" dangerouslySetInnerHTML={{__html: item.questions.question_text}}></p>
                                            <div className="text-sm space-y-1">
                                                <p>Your answer: <strong>{item.answer || '-'}</strong></p>
                                                {!isCorrect && <p className="text-green-600">Correct answer: <strong>{item.questions.correct_answer}</strong></p>}
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-gray-500 w-16 text-right">
                                            Mark {item.score} out of 1
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={() => navigate('/')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Back to course</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow-sm border border-gray-200 text-center">
                <h1 className="text-2xl font-bold text-[#0f6cb6] mb-6">{exam.title}</h1>
                <div className="bg-[#f8f9fa] border border-gray-200 p-6 rounded mb-8 inline-block text-left w-full max-w-md">
                    <p className="mb-2"><strong>Time limit:</strong> {exam.durasi} mins</p>
                    <p><strong>Grading method:</strong> Highest grade</p>
                </div>
                <div>
                    <button
                        onClick={handleStartAttempt}
                        className="bg-[#0f6cb6] text-white px-6 py-2 rounded font-medium hover:bg-[#0a528c] transition"
                    >
                        Attempt quiz now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto flex gap-6">
            <div className="flex-1 space-y-6 pb-20">
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-6">
                    <h2 className="font-bold text-lg text-[#0f6cb6]">{exam.title}</h2>
                </div>

                {questions.map((q, idx) => (
                    <div key={q.id} id={`q-${idx}`} className="bg-white rounded shadow-sm border border-gray-200 flex">
                        {/* Info Block (Moodle Style) */}
                        <div className="bg-[#f8f9fa] w-32 p-4 border-r border-gray-200 text-sm">
                            <p className="font-bold text-gray-700">Question <span className="text-xl">{idx + 1}</span></p>
                            <p className="text-gray-500 mt-2">Not yet answered</p>
                            <p className="text-gray-500 mt-1">Marked out of 1.00</p>
                        </div>
                        {/* Question Content */}
                        <div className="flex-1 p-6">
                            <div className="mb-4" dangerouslySetInnerHTML={{__html: q.question_text}}></div>

                            <div className="space-y-2">
                                {['a', 'b', 'c', 'd', 'e'].map(letter => {
                                    const optValue = q[`option_${letter}`];
                                    if (!optValue) return null;
                                    const val = letter.toUpperCase();
                                    return (
                                        <div key={letter} className="flex items-start">
                                            <input
                                                type="radio"
                                                id={`q_${q.id}_${val}`}
                                                name={`question-${q.id}`}
                                                value={val}
                                                checked={answers[q.id] === val}
                                                onChange={() => handleAnswerChange(q.id, val)}
                                                className="mt-1 mr-3 h-4 w-4 text-[#0f6cb6]"
                                            />
                                            <label htmlFor={`q_${q.id}_${val}`} className="text-gray-800 cursor-pointer">{letter}. {optValue}</label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Sidebar */}
            <div className="w-64 hidden md:block">
                <div className="bg-white rounded shadow-sm border border-gray-200 sticky top-4">
                    <div className="bg-[#f8f9fa] border-b border-gray-200 p-3">
                        <h3 className="font-bold text-gray-700 text-sm">Quiz navigation</h3>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => document.getElementById(`q-${idx}`).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className={`w-8 h-10 border rounded text-xs font-medium flex flex-col items-center
                                            ${isAnswered ? 'border-gray-500' : 'border-gray-300'}`}
                                    >
                                        <span className="w-full h-1/2 flex items-center justify-center bg-gray-100 border-b">{idx + 1}</span>
                                        <span className={`w-full h-1/2 ${isAnswered ? 'bg-gray-500' : 'bg-white'}`}></span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleSubmitExam}
                            disabled={submitting}
                            className="w-full text-left text-sm text-[#0f6cb6] hover:underline"
                        >
                            {submitting ? 'Submitting...' : 'Finish attempt ...'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
