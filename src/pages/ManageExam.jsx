import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManageExam() {
    const navigate = useNavigate();
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        duration_minutes: 60,
        max_questions: 1
    });
    const [questions, setQuestions] = useState([
        { question_text: '', options: ['', '', '', ''], correct_option: 0 }
    ]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExamChange = (e) => {
        setExamData({ ...examData, [e.target.name]: e.target.value });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        if (field === 'option') {
            newQuestions[index].options[value.optionIndex] = value.text;
        } else {
            newQuestions[index][field] = value;
        }
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_option: 0 }]);
        setExamData({ ...examData, max_questions: questions.length + 1 });
    };

    const removeQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
        setExamData({ ...examData, max_questions: newQuestions.length });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            // 1. Create Exam
            const examRes = await fetch('/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(examData)
            });

            const examResult = await examRes.json();
            if (!examRes.ok) throw new Error(examResult.error || 'Failed to create exam');

            // 2. Add Questions
            const qRes = await fetch(`/api/exams/${examResult.id}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ questions })
            });

            const qResult = await qRes.json();
            if (!qRes.ok) throw new Error(qResult.error || 'Failed to add questions');

            alert('Exam created successfully!');
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Create New Exam</h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Exam Details Section */}
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Exam Settings</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Exam Title</label>
                        <input type="text" name="title" required value={examData.title} onChange={handleExamChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={examData.description} onChange={handleExamChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
                            <input type="number" name="duration_minutes" required min="1" value={examData.duration_minutes} onChange={handleExamChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                        <button type="button" onClick={addQuestion} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            + Add Question
                        </button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white p-6 rounded-lg shadow border-l-4 border-primary">
                            <div className="flex justify-between mb-4">
                                <h3 className="font-medium">Question {qIndex + 1}</h3>
                                {questions.length > 1 && (
                                    <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 text-sm hover:underline">Remove</button>
                                )}
                            </div>

                            <textarea
                                required
                                placeholder="Enter question text..."
                                value={q.question_text}
                                onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 mb-4"
                                rows="2"
                            />

                            <div className="space-y-2 pl-4">
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={q.correct_option === oIndex}
                                            onChange={() => handleQuestionChange(qIndex, 'correct_option', oIndex)}
                                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                                            required
                                        />
                                        <input
                                            type="text"
                                            required
                                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                            value={opt}
                                            onChange={(e) => handleQuestionChange(qIndex, 'option', { optionIndex: oIndex, text: e.target.value })}
                                            className="flex-1 border border-gray-300 rounded p-1 text-sm"
                                        />
                                        {q.correct_option === oIndex && <span className="text-xs text-green-600 font-bold ml-2">Correct Answer</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-6 py-2 rounded-lg shadow font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Exam & Questions'}
                    </button>
                </div>
            </form>
        </div>
    );
}
