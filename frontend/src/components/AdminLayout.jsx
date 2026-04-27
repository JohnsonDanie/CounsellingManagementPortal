import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Settings, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div style={{
      width: '260px',
      backgroundColor: '#0f172a', // Darker theme for admin
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#38bdf8'
        }}>
          <Database size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: '0.1rem' }}>
            System Admin
          </h2>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nile University Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Core Modules</div>
        
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          <BookOpen size={18} /> Resource CMS
        </NavLink>
        
        {user?.user_metadata?.role === 'admin' && (
          <NavLink to="/admin/oversight" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={18} /> System Oversight
          </NavLink>
        )}
      </nav>

      {/* Footer Profile */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {user?.user_metadata?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{user?.user_metadata?.name || 'Desk Officer'}</p>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 0' }}
        >
          <LogOut size={16} /> Sign Out Securely
        </button>
      </div>

      <style>{`
        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #cbd5e1;
          font-weight: 500;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .admin-nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .admin-nav-link.active {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
