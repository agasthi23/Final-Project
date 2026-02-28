import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
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

import './styles/theme.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── User protected routes ── */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
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
            <ProtectedRoute>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/tariff" element={
            <ProtectedRoute>
              <AdminLayout><TariffManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminLayout><UserManagement /></AdminLayout>
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;