import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, BookOpen,
  GraduationCap, HeartPulse, HelpCircle, LogOut,
  CalendarDays, X, AlertTriangle, Bell, Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── Logout Confirmation Modal ─────────────────────────────────────────────
const LogoutModal = ({ onConfirm, onCancel }) => (
  <>
    {/* Backdrop */}
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        animation: 'fadeIn 0.15s ease',
      }}
    />
    {/* Dialog */}
    <div style={{
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 101,
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      width: '90%',
      maxWidth: '380px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      animation: 'slideUp 0.2s ease',
    }}>
      <button
        onClick={onCancel}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', background: '#f1f5f9', border: 'none'
        }}
      >
        <X size={16} />
      </button>

      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: '#fef3c7', border: '1px solid #fde68a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.25rem',
      }}>
        <AlertTriangle size={24} color="#d97706" />
      </div>

      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
        Sign Out?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.75rem' }}>
        You'll need to sign back in to access your portal.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: '10px',
            background: '#f1f5f9', color: '#475569',
            fontWeight: 600, fontSize: '0.9rem', border: 'none'
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: '10px',
            background: '#235291', color: 'white',
            fontWeight: 600, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: 'none'
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  </>
);

// ── Sidebar ───────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, assessmentResult } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isHighRisk = assessmentResult?.isHighRisk;

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/auth');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <div
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: 'var(--white)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          transition: 'all 0.3s ease'
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'none',
            position: 'absolute', top: '1rem', right: '1rem',
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#f1f5f9', color: '#64748b', border: 'none'
          }}
          className="sidebar-close-btn"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #235291, #3b6cb7)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.05rem', lineHeight: 1.2 }}>
              Nile University
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Counseling Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem 1rem' }}>Menu</div>
          
          {user?.user_metadata?.role === 'student' ? (
            <>
              <NavLink to="/student-dashboard" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={19} /> My Dashboard
              </NavLink>

              {!isHighRisk && (
                <NavLink to="/booking" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <CalendarDays size={19} /> Book a Session
                </NavLink>
              )}

              <NavLink to="/confirm-rotation" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Calendar size={19} /> Appointments
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={19} /> Overview
              </NavLink>
              <NavLink to="/schedule" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Calendar size={19} /> Schedule
              </NavLink>
              <NavLink to="/patient-logs" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <ClipboardList size={19} /> Patient Logs
              </NavLink>
              <NavLink to="/availability" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <CalendarDays size={19} /> Availability
              </NavLink>
            </>
          )}

          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2rem 0 0.5rem 1rem' }}>Preferences</div>
          
          <NavLink to="/notifications" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Bell size={19} /> Notifications
          </NavLink>
          <NavLink to="/settings" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={19} /> Settings
          </NavLink>
        </nav>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="sidebar-link"
            style={{ justifyContent: 'flex-start', background: 'transparent', color: '#ef4444' }}
          >
            <LogOut size={19} /> Sign Out
          </button>
        </div>

        <style>{`
          .sidebar-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.7rem 1rem;
            border-radius: var(--radius-sm);
            color: var(--text-dark);
            font-weight: 500;
            font-size: 0.925rem;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            text-decoration: none;
          }
          .sidebar-link:hover {
            background-color: var(--secondary-bg);
            color: var(--primary-blue);
          }
          .sidebar-link.active {
            background-color: var(--secondary-bg);
            color: var(--primary-blue);
            font-weight: 600;
            box-shadow: inset 3px 0 0 var(--primary-blue);
          }
          @media (max-width: 1023px) {
            .sidebar-close-btn {
              display: flex !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default Sidebar;
