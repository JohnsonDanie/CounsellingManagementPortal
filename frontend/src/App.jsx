import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import ConfirmRotation from './pages/ConfirmRotation';
import Auth from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import Assessment from './pages/Assessment';
import BookingCalendar from './pages/BookingCalendar';
import PatientLogs from './pages/PatientLogs';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AvailabilitySettings from './pages/AvailabilitySettings';
import ResourceCMS from './pages/ResourceCMS';
import SystemOversight from './pages/SystemOversight';
import PostSessionSurvey from './pages/PostSessionSurvey';
import './App.css';

// ── Protected Route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (allowedRoles && !allowedRoles.includes(user.user_metadata?.role)) {
    return <Navigate to={user.user_metadata?.role === 'student' ? '/student-dashboard' : '/dashboard'} replace />;
  }
  return children;
};

// ── Assessment Guard: redirects students to /assessment if not yet done ────
const StudentRoute = ({ children }) => {
  const { user, loading, assessmentResult } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.user_metadata?.role !== 'student') return <Navigate to="/dashboard" replace />;
  if (!assessmentResult) return <Navigate to="/assessment" replace />;
  return children;
};

// ── Role-based root redirect ───────────────────────────────────────────────
const MainRedirect = () => {
  const { user, assessmentResult } = useAuth();
  
  if (!user) return <Navigate to="/auth" replace />;

  const role = user.user_metadata?.role;

  if (role === 'student') {
    if (!assessmentResult) return <Navigate to="/assessment" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }
  
  if (role === 'desk_officer' || role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (role === 'counselor') {
    return <Navigate to="/dashboard" replace />;
  }

  // FIX-17: Polished unknown-role fallback card
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '3rem 2.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.75rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Account Setup Required</h2>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.75rem', fontSize: '0.9rem' }}>Your account doesn't have a role assigned yet. Please contact your system administrator to resolve this.</p>
        <button onClick={() => window.location.href = '/auth'} className="btn-secondary" style={{ width: '100%', padding: '0.875rem' }}>Back to Login</button>
      </div>
    </div>
  );
};

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    // FIX-16: Branded animated spinner instead of plain text
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1.25rem', background: '#f8fafc' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#235291', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Loading Portal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={user ? <MainRedirect /> : <Auth />} />

        <Route
          path="/assessment"
          element={
            user?.user_metadata?.role === 'student'
              ? <Assessment />
              : <Navigate to="/auth" replace />
          }
        />

        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" />}>
          <Route index element={<MainRedirect />} />

          {/* SHARED PAGES */}
          <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* COUNSELOR ONLY */}
          <Route path="dashboard" element={<ProtectedRoute allowedRoles={['counselor']}><Dashboard /></ProtectedRoute>} />
          <Route path="schedule" element={<ProtectedRoute allowedRoles={['counselor']}><Schedule /></ProtectedRoute>} />
          <Route path="patient-logs" element={<ProtectedRoute allowedRoles={['counselor']}><PatientLogs /></ProtectedRoute>} />
          <Route path="availability" element={<ProtectedRoute allowedRoles={['counselor']}><AvailabilitySettings /></ProtectedRoute>} />

          {/* STUDENT ONLY */}
          <Route path="student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
          <Route path="booking" element={<StudentRoute><BookingCalendar /></StudentRoute>} />
          <Route path="survey" element={<StudentRoute><PostSessionSurvey /></StudentRoute>} />
          <Route path="confirm-rotation" element={<ProtectedRoute allowedRoles={['student', 'counselor']}><ConfirmRotation /></ProtectedRoute>} />
        </Route>

        <Route path="/admin" element={user ? <AdminLayout /> : <Navigate to="/auth" />}>
          <Route index element={<ProtectedRoute allowedRoles={['desk_officer', 'admin']}><ResourceCMS /></ProtectedRoute>} />
          <Route path="oversight" element={<ProtectedRoute allowedRoles={['admin']}><SystemOversight /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
