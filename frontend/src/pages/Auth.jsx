import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Stethoscope, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' or 'counselor'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // FIX-07: Client-side validation before network call
    if (!isLogin) {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, role, fullName);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--secondary-bg)', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>Clinical Portal</h1>
          <p style={{ color: 'var(--text-light)' }}>{isLogin ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}</p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div 
                  onClick={() => setRole('student')}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                    border: role === 'student' ? '2px solid var(--primary-blue)' : '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: role === 'student' ? 'var(--accent-light-blue)' : 'white',
                    color: role === 'student' ? 'var(--primary-blue)' : 'var(--text-light)'
                  }}
                >
                  <GraduationCap size={24} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student</span>
                </div>
                <div 
                  onClick={() => setRole('counselor')}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                    border: role === 'counselor' ? '2px solid var(--primary-blue)' : '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: role === 'counselor' ? 'var(--accent-light-blue)' : 'white',
                    color: role === 'counselor' ? 'var(--primary-blue)' : 'var(--text-light)'
                  }}
                >
                  <Stethoscope size={24} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Counselor</span>
                </div>
              </div>
            </div>
          )}

          {!isLogin && (
            <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '1rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', paddingRight: '3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {isLogin && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (err) {
                    setError(err.message || 'Google login failed. Please try again.');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'white',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.5 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.2-2.1 3.5-5.2 3.5-8.9z" fill="#4285F4"/>
                  <path d="M12 24c3.2 0 6-1.1 8-3l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.2 7.4 24 12 24z" fill="#34A853"/>
                  <path d="M5.3 14.1c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3V6.4H1.3C.5 8.1 0 10 0 12s.5 3.9 1.3 5.6l4-3.5z" fill="#FBBC05"/>
                  <path d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.4 0 3.3 2.8 1.3 6.4l4 3.1c.9-2.9 3.6-5 6.7-5z" fill="#EA4335"/>
                </svg>
                Sign in with University Google Account
              </button>
            </>
          )}
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
