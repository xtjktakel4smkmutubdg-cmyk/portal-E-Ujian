import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex items-center text-xl font-bold text-primary">
                            Portal Ujian
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700">Hi, {user?.name} ({user?.role})</span>
                        <button
                            onClick={logout}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
