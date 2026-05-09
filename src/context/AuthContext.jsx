import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';

      if (token) {
        try {
          const endpoint = isAdmin ? '/api/admin/auth/me' : '/api/auth/me';
          const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            data._isAdmin = isAdmin;
            setUser(data);
          } else {
            clearAuth();
          }
        } catch (error) {
          console.error('Failed to verify token', error);
          clearAuth();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const loginStudent = (userData, token) => {
    setUser({ ...userData, _isAdmin: false });
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('isAdmin', 'false');
    navigate('/');
  };

  const loginAdmin = (userData, token) => {
    setUser({ ...userData, _isAdmin: true });
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('isAdmin', 'true');
    navigate('/admin/dashboard');
  };

  const logout = () => {
    const wasAdmin = user?._isAdmin;
    clearAuth();
    navigate(wasAdmin ? '/admin' : '/login');
  };

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
  };

  const getToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, loginStudent, loginAdmin, logout, loading, getToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
