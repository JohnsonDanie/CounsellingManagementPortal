import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostSessionSurvey = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [followedPlan, setFollowedPlan] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPendingSurveys();
  }, [user]);

  const fetchPendingSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*, appointments(appointment_time, counselor:profiles(full_name))')
        .eq('student_id', user.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      setPendingSurveys(data || []);
      if (data && data.length > 0) {
        setCurrentSurvey(data[0]);
      } else {
        // If they navigate here without a pending survey, push them back
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error("Error fetching surveys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Please provide a rating.");
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          status: 'completed',
          rating,
          followed_plan: followedPlan,
          feedback,
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSurvey.id);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 2500);
      
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback. Try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading your session data...</div>;
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '400px' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Thank You!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6 }}>Your feedback helps us improve our clinical services.</p>
        </div>
      </div>
    );
  }

  if (!currentSurvey) return null;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 4rem auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Automated Follow-up</p>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-blue)', marginBottom: '0.5rem', fontWeight: 800 }}>Session Check-In</h1>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>
          It's been 24 hours since your session with <strong>{currentSurvey.appointments?.counselor?.full_name || 'your counselor'}</strong>. Please let us know how it went.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
              How would you rate the session?
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: star <= rating ? '#fbbf24' : '#e2e8f0',
                    transition: 'color 0.2s', padding: '0.2rem'
                  }}
                >
                  <Star size={36} fill={star <= rating ? '#fbbf24' : 'none'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
              Were you able to attempt the Plan or coping strategies discussed?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setFollowedPlan(true)}
                style={{ 
                  flex: 1, padding: '1rem', borderRadius: '12px', border: followedPlan === true ? '2px solid var(--primary-blue)' : '1px solid #cbd5e1', 
                  background: followedPlan === true ? '#eff6ff' : 'white', color: followedPlan === true ? 'var(--primary-blue)' : '#475569',
                  fontWeight: 600, transition: 'all 0.2s'
                }}>
                Yes, I tried
              </button>
              <button 
                type="button"
                onClick={() => setFollowedPlan(false)}
                style={{ 
                  flex: 1, padding: '1rem', borderRadius: '12px', border: followedPlan === false ? '2px solid var(--primary-blue)' : '1px solid #cbd5e1', 
                  background: followedPlan === false ? '#eff6ff' : 'white', color: followedPlan === false ? 'var(--primary-blue)' : '#475569',
                  fontWeight: 600, transition: 'all 0.2s'
                }}>
                No, not yet
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
              Any private feedback for the clinic? (Optional)
            </label>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your counselor does not see this directly. It helps us improve administration."
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', minHeight: '100px', resize: 'vertical', fontSize: '0.95rem', color: '#334155' }}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '1rem', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, marginTop: '1rem' }}>
            {submitting ? 'Submitting...' : 'Submit Check-in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostSessionSurvey;
