import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                // Fetch exams
                const examsRes = await fetch('/api/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (examsRes.ok) {
                    const examsData = await examsRes.json();
                    setExams(examsData);
                }

                // Fetch history for siswa
                if (user.role === 'siswa') {
                    const histRes = await fetch('/api/attempts/history', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (histRes.ok) {
                        const histData = await histRes.json();
                        setHistory(histData);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.role]);

    if (loading) return <div className="flex justify-center p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <header className="bg-white p-6 rounded-lg shadow border-l-4 border-primary">
                <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}</h1>
                <p className="text-gray-600 mt-1">Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>

                {['admin', 'guru'].includes(user.role) && (
                    <div className="mt-4 flex gap-4">
                        <Link to="/manage-exam" className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                            Create New Exam
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 transition">
                                User Management
                            </Link>
                        )}
                    </div>
                )}
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Available Exams</h2>
                        {exams.length === 0 ? (
                            <p className="text-gray-500">No exams available right now.</p>
                        ) : (
                            <div className="grid gap-4">
                                {exams.map(exam => (
                                    <div key={exam.id} className="border rounded-lg p-4 hover:shadow-md transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-primary">{exam.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                                                <div className="text-xs text-gray-500 mt-2 flex gap-4">
                                                    <span>Duration: {exam.duration_minutes} mins</span>
                                                    <span>Questions: {exam.max_questions}</span>
                                                    <span>By: {exam.guru?.name}</span>
                                                </div>
                                            </div>
                                            {user.role === 'siswa' && (
                                                <Link to={`/take-exam/${exam.id}`} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                                                    Take Exam
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {user.role === 'siswa' && (
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Recent Attempts</h2>
                            {history.length === 0 ? (
                                <p className="text-gray-500">No exam attempts yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {history.slice(0, 5).map(attempt => (
                                        <div key={attempt.id} className="border-l-2 border-primary pl-3 py-1">
                                            <p className="font-medium">{attempt.exam?.title}</p>
                                            <div className="flex justify-between text-sm mt-1">
                                                <span className={`${attempt.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {attempt.status}
                                                </span>
                                                {attempt.score !== null && <span className="font-bold">{Number(attempt.score).toFixed(1)}%</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
