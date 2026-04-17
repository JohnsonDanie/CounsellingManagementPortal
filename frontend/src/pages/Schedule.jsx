import React, { useState, useEffect } from 'react';
import { Video, UserIcon, Sparkles, StopCircle, Clock, FileText } from 'lucide-react';
import SOAPGenerator from '../components/SOAPGenerator';

const Schedule = () => {
  const [selectedType, setSelectedType] = useState('virtual');
  const [selectedCounselor, setSelectedCounselor] = useState('wilson');
  const [showSOAP, setShowSOAP] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  const [ongoingSession, setOngoingSession] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

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

  const openSOAP = (patientName) => {
    setActivePatient({ name: patientName });
    setShowSOAP(true);
  };

  const startSession = (patientName) => {
    setOngoingSession({ name: patientName });
    openSOAP(patientName);
  };

  const finishSession = () => {
    const patientToDocument = ongoingSession;
    setOngoingSession(null);
    openSOAP(patientToDocument.name);
  };

  const counselors = [
    { id: 'chen', name: 'Dr. Sarah Chen', title: 'CLINICAL LEAD', image: 'https://ui-avatars.com/api/?name=SC&background=random' },
    { id: 'wilson', name: 'Dr. James Wilson', title: 'RESIDENCY ADVISOR', image: 'https://ui-avatars.com/api/?name=JW&background=random' },
    { id: 'thorne', name: 'Dr. Marcus Thorne', title: 'ETHICS BOARD', image: 'https://ui-avatars.com/api/?name=MT&background=random' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SCHEDULING</p>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Find Your Session</h1>
          <p style={{ color: 'var(--text-light)', maxWidth: '600px' }}>Select a counselor and session type to view available clinical rotations and academic counseling hours.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '0.25rem' }}>
          <button style={{ padding: '0.5rem 1.5rem', background: 'var(--white)', borderRadius: 'var(--radius-sm)', fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}>Weekly</button>
          <button style={{ padding: '0.5rem 1.5rem', color: 'var(--text-light)', fontWeight: 500 }}>Monthly</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: '500px' }}>
        {/* Left Panel */}
        <div style={{ width: '320px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>SESSION TYPE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div 
                onClick={() => setSelectedType('virtual')}
                style={{ backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: selectedType === 'virtual' ? '2px solid var(--primary-blue)' : '2px solid transparent', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--secondary-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={18} color="var(--primary-blue)" /></div>
                  <span style={{ fontWeight: 500 }}>Virtual Consult</span>
                </div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedType === 'virtual' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>}
                </div>
              </div>
              
              <div 
                onClick={() => setSelectedType('in-person')}
                style={{ backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: selectedType === 'in-person' ? '2px solid var(--primary-blue)' : '2px solid transparent', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--secondary-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={18} color="var(--primary-blue)" /></div>
                  <span style={{ fontWeight: 500 }}>In-Person Clinic</span>
                </div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)' }}>
                  {selectedType === 'in-person' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)', margin: '2px' }}></div>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>SELECT COUNSELOR</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {counselors.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCounselor(c.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    backgroundColor: selectedCounselor === c.id ? 'var(--white)' : 'transparent',
                    border: selectedCounselor === c.id ? '2px solid var(--primary-blue)' : '2px solid transparent',
                    boxShadow: selectedCounselor === c.id ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <img src={c.image} alt={c.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.1rem' }}>{c.name}</h4>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.05em' }}>{c.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Panel - Calendar Grid Mock */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) repeat(2, 0.8fr)', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { day: 'MON', date: '12' },
              { day: 'TUE', date: '13' },
              { day: 'WED', date: '14' },
              { day: 'THU', date: '15' },
              { day: 'FRI', date: '16' },
              { day: 'SAT', date: '17', disabled: true },
              { day: 'SUN', date: '18', disabled: true }
            ].map((d, i) => (
              <div key={i} style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: d.disabled ? '#f8fafc' : 'white', borderRight: i < 6 ? '1px solid var(--border-color)' : 'none' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: d.disabled ? '#cbd5e1' : 'var(--text-light)', marginBottom: '0.25rem' }}>{d.day}</p>
                <h3 style={{ fontSize: '1.5rem', color: d.disabled ? '#cbd5e1' : 'var(--text-dark)' }}>{d.date}</h3>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) repeat(2, 0.8fr)', flex: 1 }}>
            {/* Mocking the columns with events */}
            <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>09:00 AM</div>
              <div style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>10:00 AM</div>
              <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>11:30 AM</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>09:00 AM</div>
              <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>10:30 AM</div>
              <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>02:30 PM</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>08:00 AM</div>
               <div style={{ backgroundColor: 'var(--primary-blue)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>09:30 AM</div>
               <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>11:00 AM</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>10:00 AM</div>
                <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>01:00 PM</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>09:00 AM</div>
                <div style={{ backgroundColor: 'var(--accent-light-blue)', color: 'var(--primary-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>10:30 AM</div>
            </div>
            {/* Disabled weekends */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{transform: 'rotate(-90deg)', color: '#cbd5e1', fontSize: '0.75rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>NO SESSIONS</span></div>
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{transform: 'rotate(-90deg)', color: '#cbd5e1', fontSize: '0.75rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>NO SESSIONS</span></div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar Content */}
      <div style={{ backgroundColor: '#3b5f8f', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <img src={counselors.find(c => c.id === selectedCounselor)?.image} style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', border: '2px solid rgba(255,255,255,0.2)' }} />
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>SELECTED SESSION</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Virtual Advisory with {counselors.find(c => c.id === selectedCounselor)?.name}</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>Wed, Jun 14 &nbsp;•&nbsp; 09:30 AM - 10:15 AM</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => openSOAP("Scheduled Student")}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Generate SOAP
          </button>
          <button 
            onClick={() => startSession("Scheduled Student")}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Start Session
          </button>
          <button style={{ backgroundColor: 'white', color: 'var(--primary-blue)', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '1rem', border: 'none' }}>Confirm Appointment</button>
        </div>
      </div>
      <SOAPGenerator 
        isOpen={showSOAP} 
        onClose={() => setShowSOAP(false)} 
        patientName={activePatient?.name} 
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

export default Schedule;
