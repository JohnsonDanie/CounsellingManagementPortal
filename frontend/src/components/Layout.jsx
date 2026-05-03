import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import WellnessBot from './WellnessBot';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  // FIX-10: Only render the chatbot for student role
  const isStudent = user?.user_metadata?.role === 'student';

  return (
    <div className="app-container">
      {/* Mobile/Tablet overlay — tap to close sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar — gets .open class on mobile/tablet */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>

      {/* FIX-10: WellnessBot persists across all student routes */}
      {isStudent && <WellnessBot />}
    </div>
  );
};

export default Layout;
