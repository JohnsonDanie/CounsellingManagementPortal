import React, { useState, useEffect } from 'react';
import { 
  Search, User, Calendar, CheckCircle2, Clock,
  History, Sparkles, StopCircle, Siren, LineChart as ChartIcon, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SOAPGenerator from '../components/SOAPGenerator';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// FIX-08: Colour palette covers all 8 Assessment symptom types
const CHART_COLORS = {
  'Anxiety': '#8b5cf6',
  'Depression': '#3b82f6',
  'Academic Stress': '#ec4899',
  'Personal Issues': '#f59e0b',
  'Social Problems': '#10b981',
  'Career Concerns': '#06b6d4',
  'Family Conflict': '#ef4444',
  'Grief / Loss': '#64748b',
  'Overall Mood': '#1e293b',
};

const PatientLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSOAP, setShowSOAP] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  const [ongoingSession, setOngoingSession] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // Progress Chart Stats
  const [showProgress, setShowProgress] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (ongoingSession) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerSeconds !== 0) {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [ongoingSession, timerSeconds]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openSOAP = (patient) => {
    setActivePatient(patient);
    setShowSOAP(true);
  };

  const fetchHistoricalData = async (patient) => {
    setActivePatient(patient);
    setShowProgress(true);
    setChartLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', patient.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformed = data.map(item => ({
        date: new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        ...item.severity_scores,
        'Overall Mood': item.priority_score === 'Emergency' ? 1 : item.priority_score === 'Urgent' ? 3 : 7 
      }));
      setHistoricalData(transformed);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const startSession = (patient) => {
    setOngoingSession(patient);
    openSOAP(patient);
  };

  const finishSession = () => {
    const patientToDocument = ongoingSession;
    setOngoingSession(null);
    openSOAP(patientToDocument);
  };

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ managed: 0, pending: 0, emergency: 0, resolved: 0 });

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      
      const { count: managedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: pendingCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('status', 'in_queue');
      const { count: emergencyCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('priority_score', 'Emergency');
      const { count: resolvedCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('status', 'resolved');

      setStats({
        managed: managedCount || 0,
        pending: pendingCount || 0,
        emergency: emergencyCount || 0,
        resolved: resolvedCount || 0
      });

      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          assessments (
            id,
            category,
            priority_score,
            status,
            created_at
          )
        `)
        .eq('role', 'student');

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = data.map(profile => {
        const latestAssessment = profile.assessments?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return {
          id: profile.id,
          name: profile.full_name,
          category: latestAssessment?.category || 'Not Assessed',
          priority: latestAssessment?.priority_score || 'Routine',
          lastSession: latestAssessment ? new Date(latestAssessment.created_at).toLocaleDateString() : 'None',
          status: latestAssessment?.status || 'Active'
        };
      });

      setPatients(formatted);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'resolved': return { bg: '#dcfce7', color: '#15803d' };
      case 'in-progress': return { bg: '#e0e7ff', color: '#4338ca' };
      case 'Needs Follow-up': return { bg: '#fef3c7', color: '#92400e' };
      case 'Dismissed': return { bg: '#f1f5f9', color: '#64748b' };
      case 'Active': return { bg: '#e0e7ff', color: '#4338ca' };
      default: return { bg: '#f1f5f9', color: '#444' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Emergency': return { bg: '#fee2e2', color: '#b91c1c' };
      case 'Urgent': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f0fdf4', color: '#166534' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── PROGRESS TREND MODAL ─────────────────────────────────────── */}
      {showProgress && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '2rem'
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: '900px',
            borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Clinical Trend: {activePatient?.name}</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Symptom severity tracking over time (higher = more intense)</p>
              </div>
              <button onClick={() => setShowProgress(false)} style={{ background: '#f8fafc', border: 'none', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>
            
            <div style={{ padding: '2rem', height: '450px' }}>
              {chartLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p>Loading clinical data...</p>
                </div>
              ) : historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    {/* FIX-08: Dynamic lines — one per symptom key actually present in data */}
                    {Object.keys(historicalData[0])
                      .filter(k => k !== 'date')
                      .map(key => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={CHART_COLORS[key] || '#94a3b8'}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))
                    }
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '16px' }}>
                  <History size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: '#64748b' }}>No clinical history found for this student.</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setShowProgress(false)}>Close Analysis</button>
            </div>
          </div>
        </div>
      )}

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
            <button 
              onClick={finishSession}
              style={{
                background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px',
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <StopCircle size={18} /> Finish Session
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '0.4rem' }}>Patient Management</h1>
          <p style={{ color: 'var(--text-light)' }}>Track student wellness progress and manage follow-up sessions.</p>
        </div>
        <button className="btn-primary">
          <Calendar size={18} /> Schedule New Intake
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {[
          { label: 'Total Managed', value: stats.managed.toString(), icon: User, color: '#3b82f6' },
          { label: 'Pending Follow-up', value: stats.pending.toString(), icon: Clock, color: '#f59e0b' },
          { label: 'Emergency Handled', value: stats.emergency.toString(), icon: Siren, color: '#ef4444' },
          { label: 'Resolved (Month)', value: stats.resolved.toString(), icon: CheckCircle2, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem 1.5rem' }}>Student Name</th>
                <th style={{ padding: '1rem 1.5rem' }}>Category</th>
                <th style={{ padding: '1rem 1.5rem' }}>Priority</th>
                <th style={{ padding: '1rem 1.5rem' }}>Last Session</th>
                <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.75rem' }}>
                        {p.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>{p.category}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, ...getPriorityStyle(p.priority) }}>
                      {p.priority}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>{p.lastSession}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, ...getStatusStyle(p.status) }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => fetchHistoricalData(p)}
                        style={{ color: '#8b5cf6', padding: '0.5rem', borderRadius: '6px', background: '#f5f3ff', border: 'none', cursor: 'pointer' }} 
                        title="View Progress">
                        <ChartIcon size={18} />
                      </button>
                      <button 
                        onClick={() => openSOAP(p)}
                        style={{ color: 'var(--primary-blue)', padding: '0.5rem', borderRadius: '6px', background: '#eff6ff', border: 'none', cursor: 'pointer' }}>
                        <Sparkles size={18} />
                      </button>
                      <button 
                        onClick={() => startSession(p)}
                        style={{ color: '#4338ca', padding: '0.5rem', borderRadius: '6px', background: '#e0e7ff', border: 'none', cursor: 'pointer' }}>
                        <Clock size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SOAPGenerator 
        isOpen={showSOAP} 
        onClose={() => setShowSOAP(false)} 
        patientName={activePatient?.name} 
        studentId={activePatient?.id}
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

export default PatientLogs;
