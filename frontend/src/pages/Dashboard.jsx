import React, { useState, useEffect } from 'react';
import {
  Clock, AlertTriangle, BookOpen, AlertCircle, CheckCircle2,
  User, PhoneCall, Workflow, Siren, Users, ArrowRight,
  ClipboardList, XCircle, ChevronDown, UserCheck, Sparkles, FileText,
  Pause, Play, StopCircle, Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SOAPGenerator from '../components/SOAPGenerator';

const PriorityBadge = ({ priority }) => {
  const styles = {
    Emergency: { bg: '#fee2e2', color: '#b91c1c' },
    Urgent: { bg: '#fef3c7', color: '#92400e' },
    Routine: { bg: '#dcfce7', color: '#15803d' },
  };
  const s = styles[priority] || styles.Routine;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
      {priority}
    </span>
  );
};

const getSourceBadge = (type, source) => {
  switch (type) {
    case 'emergency':
      return <span className="pill" style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: '4px' }} />{source}</span>;
    case 'referral':
      return <span className="pill" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.7rem' }}><Workflow size={10} style={{ display: 'inline', marginRight: '4px' }} />{source}</span>;
    default:
      return <span className="pill" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}><BookOpen size={10} style={{ display: 'inline', marginRight: '4px' }} />{source}</span>;
  }
};

const Dashboard = () => {
  const { user, assessmentResult } = useAuth();
  
  // Real-time checks for assigned emergency patient
  const hasAssignedEmergency = assessmentResult?.priority === 'Emergency' && assessmentResult?.assignedCounselor?.id === user?.id;

  const [showSOAP, setShowSOAP] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  
  // Timer States
  const [ongoingSession, setOngoingSession] = useState(null); 
  const [timerSeconds, setTimerSeconds] = useState(0); 


  useEffect(() => {
    let interval;
    if (ongoingSession) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [ongoingSession]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openSOAP = (patient) => {
    setActivePatient(patient);
    setShowSOAP(true);
  };

  const startSession = (patient) => {
    setOngoingSession(patient);
    openSOAP(patient);
  };

  const finishSession = () => {
    const patientToDocument = ongoingSession;
    setOngoingSession(null);
    setTimerSeconds(0);
    // Auto-open SOAP generator for the patient just seen
    openSOAP(patientToDocument);
  };

  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState({ resolved: 0, active: 0, emergencies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channelCleanup = null;
    if (user) {
      fetchDashboardData();

      const setupRealtime = async () => {
        const { supabase } = await import('../lib/supabase');
        const channel = supabase.channel('realtime-queue')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'crisis_flags' },
            (payload) => {
              console.log('Realtime Queue Update Received:', payload);
              fetchDashboardData();
            }
          )
          .subscribe();
        
        return () => supabase.removeChannel(channel);
      };
      
      setupRealtime().then(cleanup => {
        channelCleanup = cleanup;
      });
    }

    return () => {
      if (channelCleanup) channelCleanup();
    };
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. Fetch Today's Appointments
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          duration_minutes,
          session_type,
          student:student_id (
            id,
            full_name
          )
        `)
        .eq('counselor_id', user.id)
        .gte('appointment_time', todayStart.toISOString())
        .lte('appointment_time', todayEnd.toISOString())
        .neq('status', 'cancelled')
        .order('appointment_time', { ascending: true });

      if (apptError) throw apptError;
      
      const formattedAppts = apptData.map(appt => ({
        id: appt.id,
        name: appt.student?.full_name || 'Generic Student',
        studentId: appt.student?.id,
        time: new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        source: 'System Booking',
        type: 'standard',
        session_type: appt.session_type
      }));
      setAppointments(formattedAppts);

      // 2. Fetch Digital Queue (Urgent/Emergency not yet attended)
      const { data: queueData } = await supabase
        .from('crisis_flags')
        .select(`
          id,
          assessment:assessment_id (
            category,
            priority_score,
            student_id,
            description:symptoms_description
          ),
          student_profile:student_id (
            full_name
          )
        `)
        .eq('referral_status', 'Pending')
        .order('flagged_at', { ascending: true });

      const formattedQueue = (queueData || []).map((q, idx) => ({
        id: q.id,
        position: idx + 1,
        name: q.student_profile?.full_name || 'Anonymous',
        priority: q.assessment?.priority_score || 'Urgent',
        waitTime: '~15 min', // static wait time for demo
        category: q.assessment?.category || 'General'
      }));
      setQueue(formattedQueue);

      // 3. Fetch Weekly Metrics
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: resolvedCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('created_at', weekAgo.toISOString());

      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: emergencyCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('priority_score', 'Emergency')
        .gte('created_at', weekAgo.toISOString());

      setMetrics({
        resolved: resolvedCount || 0,
        active: activeCount || 0,
        emergencies: emergencyCount || 0
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Page Header — No Daily/Weekly tags */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>COUNSELOR DASHBOARD</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
            Welcome back, {user?.user_metadata?.name || 'Dr. Miller'}
          </h1>
          <p style={{ color: 'var(--text-light)' }}>
            {ongoingSession ? `🔴 Session in progress with ${ongoingSession.name}` : `You have ${appointments.length} appointments today.`}
          </p>
        </div>
      </div>

      {/* ── ACTIVE SESSION TIMER BANNER ─────────────────────────────────── */}
      {ongoingSession && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #334155)',
          borderRadius: '20px',
          padding: '1.25rem 2rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'ping 1.5s infinite' }} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>Current Session</p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{ongoingSession.name}</h3>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.2rem' }}>Duration</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{formatTime(timerSeconds)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => openSOAP(ongoingSession)}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Sparkles size={18} /> Open SOAP Note
              </button>
              <button 
                onClick={finishSession}
                style={{
                  background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <StopCircle size={18} /> Finish Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMERGENCY ASSIGNMENT BANNER (Only shows if assigned) ────── */}
      {hasAssignedEmergency && (
        <div style={{
          background: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 12px 40px rgba(185,28,28,0.4)',
          animation: 'pulseIn 0.5s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Siren size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.2rem' }}>Instant Priority Assignment</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>New Emergency Case: New Student</h2>
              </div>
            </div>
            <PriorityBadge priority="Emergency" />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>
              "The student reported feeling hopeless and mentioned thoughts of self-harm. Immediate intervention requested."
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => startSession({ name: "New Student (Emergency)" })}
              style={{ background: 'white', color: '#7f1d1d', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}>
              <UserCheck size={18} /> Accept & Start Instant Session
            </button>
            <button 
              onClick={() => openSOAP({ name: "New Student (Emergency)" })}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} /> Generate AI SOAP Note
            </button>
            <button style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600 }}>
              Refer Externally
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Today's Appointments */}
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-blue)', fontWeight: 600, marginBottom: '1.25rem' }}>Scheduled Appointments</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {appointments.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '8px', marginRight: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.time}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{p.name}</h3>
                    {getSourceBadge(p.type, p.source)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {p.session_type === 'virtual' && (
                      <button 
                        onClick={() => window.open(`https://meet.jit.si/portal-session-${p.id}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`, '_blank')}
                        className="btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#059669', border: 'none' }}>
                        <Video size={14} /> Join
                      </button>
                    )}
                    <button 
                      onClick={() => openSOAP(p)}
                      className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FileText size={14} /> SOAP
                    </button>
                    <button 
                      onClick={() => startSession(p)}
                      className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Start</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Walk-in Digital Queue */}
          <div className="card" style={{ borderTop: '4px solid #fca5a5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--primary-blue)', fontWeight: 600 }}>Walk-in Digital Queue</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Waiting for availability</p>
              </div>
              <span className="pill" style={{ background: '#fee2e2', color: '#b91c1c' }}>{queue.length} Waiting</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {queue.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginRight: '1rem' }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{q.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{q.category} · Wait: {q.waitTime}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Attend</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Weekly Metrics */}
          <div className="card" style={{ background: '#f8fafc', border: 'none' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Weekly Metrics</p>
            {/* FIX-19: Show skeleton pulse while metrics are loading */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e2e8f0', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ height: '12px', borderRadius: '6px', background: '#e2e8f0', width: '60%', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
                      <div style={{ height: '10px', borderRadius: '6px', background: '#f1f5f9', width: '40%', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
                <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { icon: CheckCircle2, bg: '#dcfce7', color: '#15803d', label: 'Resolved Cases', value: `${metrics.resolved} Students` },
                  { icon: User, bg: '#e0e7ff', color: '#4338ca', label: 'Active Patients', value: `${metrics.active} Total` },
                  { icon: PhoneCall, bg: '#fee2e2', color: '#b91c1c', label: 'Emergencies', value: `${metrics.emergencies} This Week` },
                ].map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <m.icon size={18} color={m.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral Action Panel */}
          <div className="card" style={{ borderLeft: '4px solid #b91c1c', background: '#fff5f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#b91c1c" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#b91c1c' }}>Referral Action</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7f1d1d', lineHeight: 1.5, marginBottom: '1rem' }}>
              Document external referrals for severe psychiatric or physical crisis cases. 
            </p>
            <button className="btn-primary" style={{ width: '100%', padding: '0.6rem', background: '#b91c1c', fontSize: '0.85rem' }}>Submit New Referral</button>
          </div>
        </div>
      </div>

      <SOAPGenerator 
        isOpen={showSOAP} 
        onClose={() => setShowSOAP(false)} 
        patientName={activePatient?.name} 
        studentId={activePatient?.studentId}
        appointmentId={activePatient?.id}
      />
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(3); opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
