import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ReportCard() {
    const { user } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/reports/my-report', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setReportData(data);
                }
            } catch (error) {
                console.error("Error fetching report", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) return <div className="flex justify-center p-8">Loading...</div>;
    if (!reportData) return <div className="p-8">No report data available.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header className="bg-white p-6 rounded-lg shadow border-t-4 border-primary">
                <h1 className="text-2xl font-bold text-gray-800">Raport Siswa</h1>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Nama Siswa</p>
                        <p className="font-semibold text-lg">{reportData.student_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Ujian</p>
                        <p className="font-semibold text-lg">{reportData.total_exams}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Nilai Rata-rata</p>
                        <p className="font-semibold text-2xl text-primary">{Number(reportData.average_score).toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Predikat</p>
                        <p className="font-semibold text-2xl text-green-600">{reportData.average_predicate}</p>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Detail Nilai Ujian</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-sm">
                                <th className="p-4 border-b">Mata Pelajaran / Ujian</th>
                                <th className="p-4 border-b">Tanggal</th>
                                <th className="p-4 border-b">Nilai Akhir</th>
                                <th className="p-4 border-b">Predikat</th>
                                <th className="p-4 border-b">Catatan Guru</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.map((detail, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50 text-sm">
                                    <td className="p-4 font-medium">{detail.exam_title || 'Ujian'}</td>
                                    <td className="p-4 text-gray-500">{new Date(detail.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold">{Number(detail.final_score).toFixed(1)}</td>
                                    <td className="p-4 font-bold text-green-600">{detail.predicate}</td>
                                    <td className="p-4 italic text-gray-600">{detail.notes || '-'}</td>
                                </tr>
                            ))}
                            {reportData.details.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Belum ada ujian yang diselesaikan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
