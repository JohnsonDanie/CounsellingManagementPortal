import React, { useState, useEffect } from 'react';
import { Calendar, UserIcon, Video, AlertCircle, Clock, HeartPulse, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, assessmentResult } = useAuth();
  const navigate = useNavigate();

  const isHighRisk = assessmentResult?.isHighRisk;
  const priority = assessmentResult?.priority;

  const [counselors, setCounselors] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Fetch Counselors
      const { data: cData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'counselor');
      
      const formattedCounselors = (cData || []).map(c => ({
        id: c.id,
        name: c.full_name,
        title: c.title || 'Senior Counselor',
        available: true, // simplified for now
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=235291&color=fff`
      }));
      setCounselors(formattedCounselors);

      // Fetch Upcoming Sessions
      const { data: aData } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          session_type,
          counselor:counselor_id (
            full_name
          )
        `)
        .eq('student_id', user.id)
        .gte('appointment_time', new Date().toISOString())
        .neq('status', 'cancelled')
        .order('appointment_time', { ascending: true })
        .limit(2);

      const formattedSessions = (aData || []).map(s => ({
        id: s.id,
        title: s.session_type === 'virtual' ? 'Virtual Advisory' : 'In-Person Session',
        counselor: s.counselor?.full_name || 'Dr. Miller',
        time: new Date(s.appointment_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
      }));
      setUpcomingSessions(formattedSessions);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>STUDENT PORTAL</p>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
          Welcome, {user?.user_metadata?.name || 'Alex'}
        </h1>
        <p style={{ color: 'var(--text-light)' }}>
          {isHighRisk
            ? 'A counselor has been made aware and will be with you soon.'
            : 'Manage your upcoming sessions and book appointments with counselors.'}
        </p>
      </div>

      {/* ─── PATH B: Calm Priority Support Card ─────────────────────── */}
      {isHighRisk && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          border: '1px solid #e0eaff',
          boxShadow: '0 2px 12px rgba(35,82,145,0.08)',
        }}>
          {/* Soft icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={24} color="#235291" />
          </div>

          {/* Message */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem' }}>
              You've been connected with a counselor
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Based on your check-in, we've made sure a counselor is ready for you as a priority — no booking needed. You can simply come in or wait to be contacted. You're not alone in this.
            </p>
          </div>

          {/* Soft queue badge */}
          <div style={{
            textAlign: 'center',
            background: '#f0f4ff',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            flexShrink: 0,
            border: '1px solid #c7d7f8',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '0.25rem' }}>Priority</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#235291' }}>Next</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>~15 min</div>
          </div>
        </div>
      )}

      {/* ─── PATH A: Routine CTA — Book a Session ──────────────────── */}
      {!isHighRisk && assessmentResult && (
        <div style={{
          background: 'linear-gradient(135deg, #235291, #3b6cb7)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 8px 24px rgba(35,82,145,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Assessment Complete — {assessmentResult.category} Support Recommended
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                Please select a convenient time slot from our self-service booking calendar.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/booking')}
            style={{ background: 'white', color: 'var(--primary-blue)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
          >
            Book Now <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ─── No assessment yet ─────────────────────────────────────── */}
      {!assessmentResult && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          border: '1px solid #bae6fd',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={24} color="#235291" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>Complete Your Well-Being Check-In</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Take the assessment so we can connect you with the right support.</p>
            </div>
          </div>
          <button onClick={() => navigate('/assessment')} className="btn-primary" style={{ borderRadius: '12px', flexShrink: 0 }}>
            Start Assessment <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ─── Main Grid ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>

        {/* Left Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #235291, #3b6cb7)', color: 'white', border: 'none' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.85, marginBottom: '0.5rem' }}>Total Clinical Hours</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>124.5</div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1.25rem', fontWeight: 600 }}>Upcoming Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingSessions.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No upcoming sessions.</p>
              ) : (
                upcomingSessions.map((s) => (
                  <div key={s.id} style={{ padding: '0.875rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: '#f8fafc' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmed</p>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{s.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{s.counselor} · {s.time}</p>
                  </div>
                ))
              )}

              {/* Status card for high-risk */}
              {isHighRisk && (
                <div style={{ padding: '0.875rem', background: priority === 'Emergency' ? '#fee2e2' : '#fef3c7', borderRadius: '10px', border: `1px solid ${priority === 'Emergency' ? '#fca5a5' : '#fde68a'}` }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: priority === 'Emergency' ? '#b91c1c' : '#92400e', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</p>
                  <h4 style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{priority} Queue</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Position #1 · ~15 min</p>
                </div>
              )}
            </div>
          </div>

          {/* Wellness Score Card */}
          {assessmentResult && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 600 }}>My Assessment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Priority</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                    background: priority === 'Emergency' ? '#fee2e2' : priority === 'Urgent' ? '#fef3c7' : '#dcfce7',
                    color: priority === 'Emergency' ? '#b91c1c' : priority === 'Urgent' ? '#92400e' : '#15803d',
                  }}>{priority}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Category</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{assessmentResult.category}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/assessment')}
                style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-blue)', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
              >
                Re-take Assessment
              </button>
            </div>
          )}
        </div>

        {/* Right Col — Counselors */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-blue)', marginBottom: '0.25rem' }}>
                {isHighRisk ? 'Your Assigned Support Team' : 'Book a Session'}
              </h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                {isHighRisk ? 'The counselors below have been notified of your case.' : 'Select an available counselor to schedule your session.'}
              </p>
            </div>
            {!isHighRisk && (
              <button onClick={() => navigate('/booking')} className="btn-primary" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
                <Calendar size={16} /> Open Calendar
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {counselors.map((counselor) => (
              <div
                key={counselor.id}
                style={{
                  border: isHighRisk && counselor.available ? '2px solid var(--primary-blue)' : '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.875rem',
                  background: counselor.available ? 'white' : '#f8fafc',
                  opacity: counselor.available ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                  boxShadow: isHighRisk && counselor.available ? '0 0 0 4px rgba(35,82,145,0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <img src={counselor.image} alt={counselor.name} style={{ width: '48px', height: '48px', borderRadius: '50%', filter: counselor.available ? 'none' : 'grayscale(80%)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: counselor.available ? 'var(--text-dark)' : 'var(--text-light)' }}>{counselor.name}</h4>
                      {counselor.available
                        ? <span className="pill" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem' }}>Available</span>
                        : <span className="pill" style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: '0.65rem' }}>Booked</span>
                      }
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.2rem' }}>{counselor.title}</p>
                  </div>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {counselor.available ? (
                    <>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Video size={13} /> Virtual</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><UserIcon size={13} /> In-Person</span>
                      </div>
                      {!isHighRisk && (
                        <button onClick={() => navigate('/booking')} className="btn-primary" style={{ padding: '0.45rem 0.875rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                          Book
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={13} /> Next: {counselor.nextAvailable}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseIn {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
