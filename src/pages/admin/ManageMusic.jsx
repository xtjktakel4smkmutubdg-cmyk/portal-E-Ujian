import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ManageMusic() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' or 'requests'
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (activeTab === 'tracks') {
        const res = await fetch('/api/music/tracks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setTracks(await res.json());
      } else {
        const res = await fetch('/api/music/requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setRequests(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !newTrackTitle) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload directly to external API to bypass Vercel payload limits
      const uploadRes = await fetch('https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Gagal mengupload ke server storage');
      const uploadData = await uploadRes.json();
      
      if (!uploadData || !uploadData.status || !uploadData.path) {
        throw new Error('Gagal mendapatkan URL audio');
      }

      // Save to database via our backend
      const res = await fetch('/api/music/save-track', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTrackTitle,
          audio_url: uploadData.path
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan data musik');
      }

      setNewTrackTitle('');
      setSelectedFile(null);
      await fetchData();
      alert('Musik berhasil diupload!');
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTrack = async (id) => {
    if (!window.confirm('Yakin ingin menghapus musik ini?')) return;
    try {
      const res = await fetch(`/api/music/tracks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setTracks(tracks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Yakin ingin menghapus request ini?')) return;
    try {
      const res = await fetch(`/api/music/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRequest = async (id, status) => {
    try {
      const res = await fetch(`/api/music/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border-b">
        <div>
          <h1 className="text-2xl font-bold text-[#0f6cb6]">Manajemen Musik</h1>
          <p className="text-sm text-gray-600">Upload lagu & Kelola request dari siswa</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-semibold text-sm ${activeTab === 'tracks' ? 'border-b-2 border-[#0f6cb6] text-[#0f6cb6]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('tracks')}
        >
          Daftar Musik (Playlist)
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm ${activeTab === 'requests' ? 'border-b-2 border-[#0f6cb6] text-[#0f6cb6]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('requests')}
        >
          Request Siswa
        </button>
      </div>

      {activeTab === 'tracks' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow-sm border">
            <h2 className="text-lg font-bold mb-4">Upload Musik Baru</h2>
            <form onSubmit={handleUpload} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Lagu</label>
                <input 
                  type="text" 
                  value={newTrackTitle} 
                  onChange={e => setNewTrackTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f6cb6]"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">File MP3</label>
                <input 
                  type="file" 
                  accept="audio/mpeg, audio/mp3"
                  onChange={e => setSelectedFile(e.target.files[0])}
                  className="w-full border rounded px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={uploading}
                className="bg-[#0f6cb6] text-white px-4 py-2 rounded text-sm hover:bg-[#0a528c] font-semibold h-[38px]"
              >
                {uploading ? 'Mengupload...' : 'Upload'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow-sm rounded border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Judul Lagu</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Audio</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Memuat...</td></tr>
                ) : tracks.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Belum ada musik</td></tr>
                ) : tracks.map(track => (
                  <tr key={track.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{track.title}</td>
                    <td className="px-6 py-4">
                      <audio controls src={track.audio_url} className="h-8 w-64"></audio>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteTrack(track.id)} className="text-red-600 hover:text-red-900 text-sm font-semibold">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white shadow-sm rounded border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f8f9fa]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Lagu Request</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Memuat...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Belum ada request lagu</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0f6cb6]">{req.users?.nama}</div>
                    <div className="text-xs text-gray-500">Kelas: {req.users?.kelas || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{req.song_title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold
                      ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${req.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      ${req.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateRequest(req.id, 'approved')} className="text-green-600 hover:underline text-sm font-semibold">Setujui</button>
                        <button onClick={() => handleUpdateRequest(req.id, 'rejected')} className="text-yellow-600 hover:underline text-sm font-semibold">Tolak</button>
                      </>
                    )}
                    <button onClick={() => handleDeleteRequest(req.id)} className="text-red-600 hover:underline text-sm font-semibold">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
