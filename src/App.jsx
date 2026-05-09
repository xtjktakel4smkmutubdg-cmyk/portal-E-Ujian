import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Student Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TakeExam from './pages/TakeExam';

// Admin Pages (lazy loaded)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminExams = lazy(() => import('./pages/admin/AdminExams'));
const AdminExamResults = lazy(() => import('./pages/admin/AdminExamResults'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminViolations = lazy(() => import('./pages/admin/AdminViolations'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[var(--text-secondary)]">Memuat...</p>
    </div>
  </div>
);

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'siswa') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !user._isAdmin) return <Navigate to="/admin" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/take-exam/:id" element={<StudentRoute><TakeExam /></StudentRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="exams" element={<AdminExams />} />
                <Route path="exams/:id/results" element={<AdminExamResults />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="violations" element={<AdminViolations />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
