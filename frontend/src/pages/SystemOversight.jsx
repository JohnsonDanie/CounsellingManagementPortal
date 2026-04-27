import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Users, CheckCircle, 
  AlertTriangle, Filter, Search, Download, TrendingUp,
  Clock, ArrowUpRight, BarChart2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      {trend && (
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <ArrowUpRight size={14} /> {trend}
        </span>
      )}
    </div>
    <div>
      <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
      <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{value}</h3>
    </div>
  </div>
);

const SystemOversight = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAssessments: 0,
    emergencyCount: 0,
    resolutionRate: 0,
    activeCounselors: 0
  });
  const [crisisFlags, setCrisisFlags] = useState([]);

  useEffect(() => {
    fetchOversightData();
  }, []);

  const fetchOversightData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Metrics
      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      const { count: emergencyCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('priority_score', 'Emergency');

      const { count: resolvedCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      const { count: counselorCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'counselor');

      setMetrics({
        totalAssessments: assessmentCount || 0,
        emergencyCount: emergencyCount || 0,
        resolutionRate: assessmentCount ? Math.round((resolvedCount / assessmentCount) * 100) : 0,
        activeCounselors: counselorCount || 0
      });

      // 2. Fetch Active Crisis Flags
      const { data: flagData } = await supabase
        .from('crisis_flags')
        .select(`
          *,
          student:student_id (full_name),
          assessment:assessment_id (category, priority_score, symptoms_description)
        `)
        .order('flagged_at', { ascending: false });

      setCrisisFlags(flagData || []);

    } catch (err) {
      console.error('Error fetching oversight data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Administrator Module</p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>System Oversight</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Scanning university-wide clinical intake and crisis detection trends.</p>
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white' }}>
          <Download size={18} /> Export Data Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard label="Total Assessments" value={metrics.totalAssessments} icon={Activity} color="#3b82f6" trend="+12%" />
        <StatCard label="Critical Emergencies" value={metrics.emergencyCount} icon={ShieldAlert} color="#ef4444" trend="+3" />
        <StatCard label="Resolution Rate" value={`${metrics.resolutionRate}%`} icon={CheckCircle} color="#10b981" />
        <StatCard label="Active Clinicians" value={metrics.activeCounselors} icon={Users} color="#8b5cf6" trend="Online" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Active Crisis Feed */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Active Crisis Logs</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}><Filter size={16} /></button>
              <button style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}><Search size={16} /></button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Wait Time</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {crisisFlags.map((flag) => (
                  <tr key={flag.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          {flag.student?.full_name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{flag.student?.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800,
                        background: flag.assessment?.priority_score === 'Emergency' ? '#fee2e2' : '#fef3c7',
                        color: flag.assessment?.priority_score === 'Emergency' ? '#b91c1c' : '#92400e'
                      }}>
                        {flag.assessment?.priority_score || 'Urgent'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{flag.assessment?.category}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                        <Clock size={14} /> 12 mins
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6' }}>{flag.referral_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health / Trends Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <TrendingUp size={20} color="#38bdf8" />
              <h4 style={{ fontWeight: 700 }}>Intake Analysis</h4>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              High volume of "Academic Stress" flags detected in the last 24 hours. Suggesting automated resource blast to Engineering cohorts.
            </p>
            <button style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#38bdf8', color: '#0f172a', fontWeight: 700, border: 'none' }}>
              Trigger Action Plan
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="#8b5cf6" /> Clinician Workload
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: 'Dr. Sarah Miller', load: 85, color: '#ef4444' },
                { name: 'Prof. James Ade', load: 45, color: '#10b981' },
                { name: 'Dr. Emily Chen', load: 60, color: '#3b82f6' }
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: c.color }}>{c.load}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.load}%`, height: '100%', background: c.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemOversight;
