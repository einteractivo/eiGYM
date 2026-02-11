import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemberManagement from './pages/MemberManagement';
import AttendanceTracking from './pages/AttendanceTracking';
import PlansManagement from './pages/PlansManagement';
import ClassesPage from './pages/ClassesPage';
import SchedulesPage from './pages/SchedulesPage';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import EquipmentPage from './pages/EquipmentPage';
import CashFlow from './pages/CashFlow';
import Expenses from './pages/Expenses';

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-gym-dark flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect members/reception to /members if they try to access restricted areas
    return <Navigate to="/members" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER']}>
              <MemberManagement />
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER']}>
              <AttendanceTracking />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION']}>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="/plans" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <PlansManagement />
            </ProtectedRoute>
          } />

          <Route path="/classes" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <ClassesPage />
            </ProtectedRoute>
          } />

          <Route path="/schedules" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER']}>
              <SchedulesPage />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <ProductsPage />
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION']}>
              <POSPage />
            </ProtectedRoute>
          } />

          <Route path="/equipment" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION', 'TRAINER']}>
              <EquipmentPage />
            </ProtectedRoute>
          } />

          <Route path="/cash-flow" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION']}>
              <CashFlow />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'RECEPTION']}>
              <Expenses />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN']}>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
