import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function TakeExam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const initExam = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Get exam details to show before starting
                const examRes = await fetch(`/api/exams/${id}`, { headers });
                if (!examRes.ok) throw new Error('Exam not found');
                const examData = await examRes.json();
                setExam(examData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        initExam();
    }, [id]);

    useEffect(() => {
        if (!attempt || !exam) return;

        // Calculate time left
        const startTime = new Date(attempt.start_time).getTime();
        const durationMs = exam.duration_minutes * 60 * 1000;
        const endTime = startTime + durationMs;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const remaining = endTime - now;

            if (remaining <= 0) {
                clearInterval(timer);
                setTimeLeft(0);
                handleFinishAttempt(); // Auto submit
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [attempt, exam]);

    const handleStartAttempt = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const startRes = await fetch('/api/attempts/start', {
                method: 'POST',
                headers,
                body: JSON.stringify({ exam_id: id })
            });
            const attemptData = await startRes.json();

            if (!startRes.ok) throw new Error(attemptData.error);
            setAttempt(attemptData);

            if (attemptData.status === 'completed') {
                setError('You have already completed this exam.');
                setLoading(false);
                return;
            }

            const qRes = await fetch(`/api/attempts/${attemptData.id}/questions`, { headers });
            const qData = await qRes.json();

            if (!qRes.ok) throw new Error(qData.error);

            setQuestions(qData.questions);

            // Map existing answers
            const ansMap = {};
            qData.answers.forEach(a => {
                ansMap[a.question_id] = a.selected_option;
            });
            setAnswers(ansMap);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = async (questionId, optionIndex) => {
        const newAnswers = { ...answers, [questionId]: optionIndex };
        setAnswers(newAnswers);

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/attempts/${attempt.id}/answer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question_id: questionId, selected_option: optionIndex })
            });
        } catch (err) {
            console.error("Failed to save answer", err);
        }
    };

    const handleFinishAttempt = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/attempts/${attempt.id}/finish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Exam completed! Your score is ${Number(data.score).toFixed(1)}%`);
                navigate('/');
            }
        } catch (err) {
            alert('Failed to submit exam. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (ms) => {
        if (!ms) return '00:00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) return <div>Loading exam...</div>;
    if (error) return <div className="text-red-500 bg-red-100 p-4 rounded">{error}</div>;
    if (!exam) return <div>Exam not found.</div>;

    // Before starting
    if (!attempt) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow mt-8 text-center">
                <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
                <p className="text-gray-600 mb-6">{exam.description}</p>
                <div className="bg-blue-50 p-4 rounded mb-8 inline-block text-left">
                    <p><strong>Duration:</strong> {exam.duration_minutes} Minutes</p>
                    <p><strong>Questions:</strong> {exam.max_questions}</p>
                </div>
                <div>
                    <button
                        onClick={handleStartAttempt}
                        className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition"
                    >
                        Start Exam Now
                    </button>
                </div>
            </div>
        );
    }

    // Exam in progress
    return (
        <div className="max-w-4xl mx-auto flex gap-6 relative">
            <div className="flex-1 space-y-6 pb-20">
                <div className="bg-white p-4 rounded-lg shadow sticky top-4 z-10 flex justify-between items-center border-b-4 border-primary">
                    <h2 className="font-bold text-lg truncate w-1/2">{exam.title}</h2>
                    <div className="text-right flex items-center gap-4">
                        <div className={`font-mono text-xl font-bold ${timeLeft < 300000 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                            Time Left: {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => {
                                if(window.confirm('Are you sure you want to submit your exam now?')) handleFinishAttempt();
                            }}
                            disabled={submitting}
                            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Finish Exam'}
                        </button>
                    </div>
                </div>

                {questions.map((q, idx) => (
                    <div key={q.id} id={`q-${idx}`} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="font-medium text-lg mb-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm mr-2">{idx + 1}</span>
                            {q.question_text}
                        </h3>
                        <div className="space-y-2 ml-8">
                            {q.options.map((opt, oIdx) => (
                                <label key={oIdx} className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`question-${q.id}`}
                                        checked={answers[q.id] === oIdx}
                                        onChange={() => handleAnswerSelect(q.id, oIdx)}
                                        className="h-4 w-4 text-primary"
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Sidebar */}
            <div className="w-64 hidden md:block">
                <div className="bg-white p-4 rounded-lg shadow sticky top-4">
                    <h3 className="font-bold mb-3 border-b pb-2">Exam Navigation</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => document.getElementById(`q-${idx}`).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                className={`h-8 w-8 rounded text-sm font-medium flex items-center justify-center border
                                    ${answers[q.id] !== undefined
                                        ? 'bg-gray-600 text-white border-gray-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
