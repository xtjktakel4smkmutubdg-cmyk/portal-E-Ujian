import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-[#0f6cb6] shadow text-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex justify-between h-14">
                    <div className="flex">
                        <Link to="/" className="flex items-center text-xl font-bold">
                            Portal Ujian Online
                        </Link>
                        <div className="hidden md:flex ml-10 space-x-4 items-center">
                            <Link to={user?.role === 'admin' ? '/admin' : '/'} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#0a528c]">
                                Dashboard
                            </Link>
                            {user?.role === 'admin' && (
                                <Link to="/manage-exam" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#0a528c]">
                                    Site Administration
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-sm">
                            You are logged in as <strong>{user?.nama}</strong> ({user?.role})
                        </div>
                        <button
                            onClick={logout}
                            className="text-white hover:text-gray-200 text-sm font-medium transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
