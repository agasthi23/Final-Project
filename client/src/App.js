import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ── User pages
import Dashboard  from "./pages/Dashboard";
import AddBill    from "./pages/AddBill";
import Analytics  from "./pages/Analytics";
import Prediction from "./pages/PredictionPage";
import Income     from "./pages/Income";
import Report     from "./pages/Report";
import Profile    from "./pages/ProfilePage";

// ── Auth pages
import Login  from "./pages/Login";
import Signup from "./pages/Signup";

// ── Layouts
import MainLayout  from "./layout/mainlayout";
import AdminLayout from "./layout/AdminLayout";

// ── Admin pages
import AdminDashboard   from "./pages/admin/AdminDashboard";
import TariffManagement from "./pages/admin/tariff";
import UserManagement   from "./pages/admin/UserManagement";
import AdminProtectedRoute from './components/AdminProtectedRoute';

import './styles/theme.css';

// ── Smart root redirect based on role ──
// No token      → /login
// role: admin   → /admin
// role: user    → /dashboard
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>

            {/* ── Root: smart redirect based on role ── */}
            <Route path="/" element={<RootRedirect />} />

          {/* ── Public routes ── */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── User protected routes ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/add-bill" element={
            <ProtectedRoute>
              <MainLayout><AddBill /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <MainLayout><Analytics /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/predictions" element={
            <ProtectedRoute>
              <MainLayout><Prediction /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/income" element={
            <ProtectedRoute>
              <MainLayout><Income /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <MainLayout><Report /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout><Profile /></MainLayout>
            </ProtectedRoute>
          } />

          {/* ── Admin protected routes ── */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/tariff" element={
            <AdminProtectedRoute>
              <AdminLayout><TariffManagement /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminLayout><UserManagement /></AdminLayout>
            </AdminProtectedRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;