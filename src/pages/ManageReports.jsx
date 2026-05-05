import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ManageReports() {
    const { user } = useAuth();
    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [manualScore, setManualScore] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/reports/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudentsData(data);
            }
        } catch (error) {
            console.error("Error fetching students reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/reports/attempt/${selectedAttempt.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    manual_score: manualScore,
                    notes: notes
                })
            });

            if (res.ok) {
                alert('Nilai dan catatan berhasil diperbarui!');
                setSelectedAttempt(null);
                fetchReports(); // Refresh data
            } else {
                alert('Gagal memperbarui nilai.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openModal = (attempt) => {
        setSelectedAttempt(attempt);
        setManualScore(attempt.final_score !== attempt.original_score ? attempt.final_score : '');
        setNotes(attempt.notes || '');
    };

    if (loading) return <div className="p-8 text-center">Loading reports...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold border-b pb-4">Manajemen Raport Siswa</h1>

            {studentsData.map(student => (
                <div key={student.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                            <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        <div className="text-right flex gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Rata-rata</p>
                                <p className="font-bold text-xl">{Number(student.average_score).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Predikat</p>
                                <p className="font-bold text-xl text-green-600">{student.average_predicate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="p-3">Ujian</th>
                                    <th className="p-3">Tanggal</th>
                                    <th className="p-3">Nilai Asli</th>
                                    <th className="p-3">Nilai Akhir</th>
                                    <th className="p-3">Catatan</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.attempts.map((attempt, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-3">{attempt.exam_title || 'Ujian'}</td>
                                        <td className="p-3">{new Date(attempt.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-gray-500">{Number(attempt.original_score).toFixed(1)}</td>
                                        <td className="p-3 font-bold">{Number(attempt.final_score).toFixed(1)}</td>
                                        <td className="p-3 italic text-gray-500 max-w-xs truncate">{attempt.notes || '-'}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => openModal(attempt)}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                Edit Nilai / Catatan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {student.attempts.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">Siswa belum memiliki riwayat ujian.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Modal Edit */}
            {selectedAttempt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Edit Nilai & Catatan</h2>
                        <p className="text-sm text-gray-600 mb-4">Ujian: {selectedAttempt.exam_title}</p>
                        <form onSubmit={handleSaveReview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Manual (Opsional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={manualScore}
                                    onChange={(e) => setManualScore(e.target.value)}
                                    placeholder={`Biarkan kosong untuk pakai nilai asli (${Number(selectedAttempt.original_score).toFixed(1)})`}
                                    className="w-full p-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Kosongkan kolom ini jika ingin menggunakan nilai asli sistem.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Guru</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="3"
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Tambahkan catatan untuk siswa..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAttempt(null)}
                                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
