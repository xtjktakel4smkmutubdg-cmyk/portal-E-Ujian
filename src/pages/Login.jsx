import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to login');

            login(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded shadow-md border-t-4 border-[#0f6cb6]">
                <div className="text-center">
                    <img className="mx-auto h-12 w-auto mb-4" src="https://moodle.org/theme/image.php/moodleorg/theme/1709605809/moodle-logo" alt="Moodle Logo" />
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Portal Ujian Online</h2>
                    <p className="mt-2 text-sm text-gray-600">Log in to your account</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center border border-red-200">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-[#0f6cb6] focus:border-[#0f6cb6] sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-[#0f6cb6] focus:border-[#0f6cb6] sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded text-white bg-[#0f6cb6] hover:bg-[#0a528c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f6cb6] disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-6 text-sm text-gray-600">
                    <p>Some courses may allow guest access</p>
                    <button className="mt-2 w-full py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 bg-white shadow-sm">Log in as a guest</button>
                </div>
            </div>
        </div>
    );
}
