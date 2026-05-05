import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                // Fetch exams
                const examsRes = await fetch('http://localhost:3000/api/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (examsRes.ok) {
                    const examsData = await examsRes.json();
                    setExams(examsData);
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
            <header className="bg-white p-6 rounded shadow-sm border-b">
                <h1 className="text-2xl font-bold text-[#0f6cb6]">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user.nama}!</p>
            </header>

            <div className="grid md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-6">
                    <section className="bg-white rounded shadow-sm border">
                        <div className="bg-[#f8f9fa] border-b p-4">
                            <h2 className="text-lg font-semibold text-gray-800">Available Courses / Exams</h2>
                        </div>
                        <div className="p-4">
                            {exams.length === 0 ? (
                                <p className="text-gray-500">No exams available right now.</p>
                            ) : (
                                <div className="grid gap-4">
                                    {exams.map(exam => (
                                        <div key={exam.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition flex items-center">
                                            <div className="w-16 h-16 bg-[#0f6cb6] text-white rounded flex items-center justify-center mr-4">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-[#0f6cb6] hover:underline">
                                                    <Link to={`/take-exam/${exam.id}`}>{exam.title}</Link>
                                                </h3>
                                                <div className="text-sm text-gray-600 mt-1 flex gap-4">
                                                    <span>Duration: {exam.durasi} mins</span>
                                                    <span>Date: {new Date(exam.tanggal).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Link to={`/take-exam/${exam.id}`} className="bg-white text-[#0f6cb6] border border-[#0f6cb6] px-4 py-2 rounded text-sm hover:bg-[#0f6cb6] hover:text-white transition">
                                                    Access
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="bg-white rounded shadow-sm border">
                        <div className="bg-[#f8f9fa] border-b p-3">
                            <h2 className="text-md font-semibold text-gray-800">Timeline</h2>
                        </div>
                        <div className="p-4 text-sm text-gray-600 text-center">
                            No upcoming activities due
                        </div>
                    </section>
                    <section className="bg-white rounded shadow-sm border">
                        <div className="bg-[#f8f9fa] border-b p-3">
                            <h2 className="text-md font-semibold text-gray-800">Calendar</h2>
                        </div>
                        <div className="p-4 flex justify-center">
                            <div className="text-center text-sm text-gray-500">
                                📅 Calendar widget would be here
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
