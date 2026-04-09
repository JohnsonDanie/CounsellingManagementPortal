import React from 'react';
import { Search, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const avatarName = user?.user_metadata?.name?.replace(' ', '+') || 'User';

  return (
    <header style={{
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.875rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>

      {/* Left — Hamburger (tablet/mobile) + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-search" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: '9999px',
          width: '300px',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: '1rem' }} />
          <input
            type="text"
            placeholder="Search records, students..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              paddingLeft: '2.25rem',
              paddingRight: '1rem',
              paddingTop: '0.6rem',
              paddingBottom: '0.6rem',
              width: '100%',
              fontSize: '0.875rem',
              color: 'var(--text-dark)',
            }}
          />
        </div>
      </div>

      {/* Right — Icons + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>


        {/* User Avatar */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-blue)', flexShrink: 0 }}>
            <img
              src={`https://ui-avatars.com/api/?name=${avatarName}&background=235291&color=fff&size=68`}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          {/* Hide name/role on very small screens */}
          <div style={{ lineHeight: 1.2 }} className="avatar-text">
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-dark)' }}>
              {user?.user_metadata?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>
              {user?.user_metadata?.role || '—'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .avatar-text { display: none; }
          .header-search { width: 160px !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
