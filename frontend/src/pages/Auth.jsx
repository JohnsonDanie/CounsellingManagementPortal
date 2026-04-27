import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Stethoscope } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' or 'counselor'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '1rem' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
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
