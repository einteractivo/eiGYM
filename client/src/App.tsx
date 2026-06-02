import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemberManagement from './pages/MemberManagement';
import AttendanceTracking from './pages/AttendanceTracking';
import PlansManagement from './pages/PlansManagement';
import ClassesPage from './pages/ClassesPage';
import SchedulesPage from './pages/SchedulesPage';
import Trainers from './pages/Trainers';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import EquipmentPage from './pages/EquipmentPage';
import CashFlow from './pages/CashFlow';
import Expenses from './pages/Expenses';
import AttendanceHistory from './pages/AttendanceHistory';
import LicenseExpired from './pages/LicenseExpired';
import UnauthorizedMachine from './pages/UnauthorizedMachine';
import SpecialClassesPage from './pages/SpecialClassesPage';
import AttendanceRanking from './pages/AttendanceRanking';
import AttendanceStats from './pages/AttendanceStats';
import SaasGyms from './pages/SaasGyms';
import Reports from './pages/Reports';
import GymRegistration from './pages/GymRegistration';
import SaasUsers from './pages/SaasUsers';

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-gym-dark flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If SuperAdmin tries to access gym-specific routes, redirect to SaaS panel
    if (user.role === 'SUPERADMIN') {
      return <Navigate to="/saas/gyms" />;
    }
    // For other roles (Reception/Trainer), redirect to their default allowed area
    return <Navigate to="/members" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register-gym" element={<GymRegistration />} />

            <Route path="/saas/gyms" element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <SaasGyms />
              </ProtectedRoute>
            } />

            <Route path="/saas/users" element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <SaasUsers />
              </ProtectedRoute>
            } />

            <Route path="/" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/members" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <MemberManagement />
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <AttendanceTracking />
              </ProtectedRoute>
            } />
            <Route path="/attendance-history" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <AttendanceHistory />
              </ProtectedRoute>
            } />
            <Route path="/attendance-ranking" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <AttendanceRanking />
              </ProtectedRoute>
            } />
            <Route path="/attendance-stats" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <AttendanceStats />
              </ProtectedRoute>
            } />

            <Route path="/payments" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <Payments />
              </ProtectedRoute>
            } />

            <Route path="/plans" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PlansManagement />
              </ProtectedRoute>
            } />

            <Route path="/classes" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ClassesPage />
              </ProtectedRoute>
            } />

            <Route path="/special-classes" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <SpecialClassesPage />
              </ProtectedRoute>
            } />

            <Route path="/schedules" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <SchedulesPage />
              </ProtectedRoute>
            } />

            <Route path="/trainers" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <Trainers />
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProductsPage />
              </ProtectedRoute>
            } />

            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <POSPage />
              </ProtectedRoute>
            } />

            <Route path="/equipment" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION', 'TRAINER']}>
                <EquipmentPage />
              </ProtectedRoute>
            } />

            <Route path="/cash-flow" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <CashFlow />
              </ProtectedRoute>
            } />

            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <Expenses />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/license-expired" element={<LicenseExpired />} />
            <Route path="/unauthorized-machine" element={<UnauthorizedMachine />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
