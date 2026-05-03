import React, { useState, useEffect } from 'react';
import { Calendar, UserIcon, Video, AlertCircle, Clock, HeartPulse, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ResourceLibrary from '../components/ResourceLibrary';
// FIX-10: WellnessBot moved to Layout.jsx — removed import here

const StudentDashboard = () => {
  const { user, assessmentResult } = useAuth();
  const navigate = useNavigate();

  const isHighRisk = assessmentResult?.isHighRisk;
  const priority = assessmentResult?.priority;

  const [counselors, setCounselors] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [pendingSurvey, setPendingSurvey] = useState(null);

  // Helper to extract searchable keywords from student story
  const extractKeywords = (text) => {
    if (!text) return [];
    const STOP_WORDS = new Set(['i', 'the', 'a', 'and', 'to', 'is', 'am', 'was', 'my', 'me', 'in', 'on', 'with', 'it', 'was', 'because']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !STOP_WORDS.has(word));
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const [localAssessment, setLocalAssessment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setResourcesLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      // 1. Fetch Latest Assessment for Tailored Support
      const { data: assessData } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const studentNeeds = assessData || assessmentResult;
      setLocalAssessment(studentNeeds);

      // 2. Fetch Counselors
      const { data: cData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'counselor');
      
      const formattedCounselors = (cData || []).map(c => ({
        id: c.id,
        name: c.full_name,
        title: c.title || 'Senior Counselor',
        available: true,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=235291&color=fff`
      }));
      setCounselors(formattedCounselors);

      // 3. Fetch Upcoming Sessions
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
        counselor: s.counselor?.full_name || 'Assigned Counselor',
        time: new Date(s.appointment_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        session_type: s.session_type  // FIX-11: pass through so Join Video button can gate on it
      }));
      setUpcomingSessions(formattedSessions);

      // 4. Fetch and Smart-Filter Resources
      const { data: rData } = await supabase.from('resources').select('*');
      
      if (rData) {
        let prioritized = [];
        
        if (studentNeeds) {
          const storyKeywords = extractKeywords(studentNeeds.symptoms_description);
          const needsCategory = studentNeeds.category?.toLowerCase();

          // TIER 1: Exact keyword matches from the user story
          if (storyKeywords.length > 0) {
            prioritized = rData.filter(res => 
              res.tags?.some(tag => storyKeywords.includes(tag.toLowerCase()))
            );
          }

          // TIER 2: Category matches (if we don't have enough prioritized results)
          if (prioritized.length < 3 && needsCategory) {
            const catMatches = rData.filter(res => 
              res.category.toLowerCase().includes(needsCategory) && 
              !prioritized.find(p => p.id === res.id)
            );
            prioritized = [...prioritized, ...catMatches];
          }
        }

        // TIER 3: General Wellness fallback
        if (prioritized.length < 3) {
          const general = rData.filter(res => 
            res.category === 'General' && 
            !prioritized.find(p => p.id === res.id)
          );
          prioritized = [...prioritized, ...general];
        }

        // TIER 4: Ultimate fallback (any remaining resources)
        if (prioritized.length < 3) {
          const others = rData.filter(res => !prioritized.find(p => p.id === res.id));
          prioritized = [...prioritized, ...others];
        }

        setResources(prioritized.slice(0, 3)); 
      }

      // 5. Fetch Pending Surveys
      const { data: surveyData } = await supabase
        .from('surveys')
        .select('*')
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
      
      if (surveyData) {
        setPendingSurvey(surveyData);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setResourcesLoading(false);
    }
  };

  const displayAssessment = localAssessment || assessmentResult;
  const isHighRiskVal = displayAssessment?.priority_score === 'Emergency' || displayAssessment?.isHighRisk;
  const priorityVal = displayAssessment?.priority_score || displayAssessment?.priority || 'Routine';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>STUDENT PORTAL</p>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
          Welcome, {user?.user_metadata?.name}
        </h1>
        <p style={{ color: 'var(--text-light)' }}>
          {isHighRiskVal
            ? 'A counselor has been made aware and will be with you soon.'
            : 'Manage your upcoming sessions and book appointments with counselors.'}
        </p>
      </div>

      {/* ─── ACTION BANNER: Pending Survey ───────────────────────────── */}
      {pendingSurvey && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Action Required: Post-Session Check-in</h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>Tell us how your recent session went. It only takes a minute.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/survey')}
            style={{ background: 'white', color: '#059669', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}
          >
            Start Check-in
          </button>
        </div>
      )}

      {/* ─── PATH B: Calm Priority Support Card ─────────────────────── */}
      {isHighRiskVal && (
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
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={24} color="#235291" />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem' }}>
              You've been connected with a counselor
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Based on your check-in, we've made sure a counselor is ready for you as a priority — no booking needed. You can simply come in or wait to be contacted. You're not alone in this.
            </p>
          </div>

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
      {!isHighRiskVal && displayAssessment && (
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
                Assessment Complete — {displayAssessment.category} Support Recommended
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
      {!displayAssessment && (
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
                    {/* FIX-11: Join Video Call button for virtual sessions */}
                    {s.session_type === 'virtual' && (
                      <button
                        onClick={() => window.open(`https://meet.jit.si/portal-session-${s.id}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`, '_blank')}
                        style={{ marginTop: '0.6rem', width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-blue)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <Video size={13} /> Join Video Call
                      </button>
                    )}
                  </div>
                ))
              )}
              {isHighRisk && (
                <div style={{ padding: '0.875rem', background: priority === 'Emergency' ? '#fee2e2' : '#fef3c7', borderRadius: '10px', border: `1px solid ${priority === 'Emergency' ? '#fca5a5' : '#fde68a'}` }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: priority === 'Emergency' ? '#b91c1c' : '#92400e', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</p>
                  <h4 style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{priority} Queue</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Position #1 · ~15 min</p>
                </div>
              )}
            </div>
          </div>

          {displayAssessment && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 600 }}>My Assessment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Priority</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                    background: priorityVal === 'Emergency' ? '#fee2e2' : priorityVal === 'Urgent' ? '#fef3c7' : '#dcfce7',
                    color: priorityVal === 'Emergency' ? '#b91c1c' : priorityVal === 'Urgent' ? '#92400e' : '#15803d',
                  }}>{priorityVal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Category</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{displayAssessment.category}</span>
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

        {/* Right Col — Support & Resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Counselors List - Only show if no upcoming sessions */}
          {upcomingSessions.length === 0 && (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-blue)', marginBottom: '0.25rem' }}>
                    {isHighRiskVal ? 'Your Assigned Support Team' : 'Available Counselors'}
                  </h2>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    {isHighRiskVal ? 'The counselors below have been notified of your case.' : 'Select an available counselor to schedule your session.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                {counselors.map((counselor) => (
                  <div
                    key={counselor.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      display: 'flex', flexDirection: 'column', gap: '0.875rem',
                      background: 'white',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                      <img src={counselor.image} alt={counselor.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)' }}>{counselor.name}</h4>
                          <span className="pill" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem' }}>Active</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, marginTop: '0.2rem' }}>{counselor.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Resources */}
          <div className="card" style={{ padding: '2rem', border: '1px solid #bae6fd', background: 'linear-gradient(to bottom right, #ffffff, #f0f9ff)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sparkles color="var(--primary-blue)" size={24} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-blue)', fontWeight: 700 }}>Tailored Support For You</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Personalized resources based on your recent wellness goals.</p>
              </div>
            </div>
            
            <ResourceLibrary resources={resources} isLoading={resourcesLoading} />
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
              >
                Explore Full Library <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* FIX-10: WellnessBot now lives in Layout.jsx and persists across all student routes */}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;

