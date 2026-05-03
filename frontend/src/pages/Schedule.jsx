import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SOAPGenerator from '../components/SOAPGenerator';
import VideoRoom from '../components/VideoRoom';
import { Video, UserIcon, Sparkles, StopCircle, Clock, FileText, Monitor } from 'lucide-react';

const Schedule = () => {
  const [selectedType, setSelectedType] = useState('virtual');
  const [showSOAP, setShowSOAP] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  const [ongoingSession, setOngoingSession] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [activeVideoRoom, setActiveVideoRoom] = useState(null);

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
    const mins = Math.floor(totalSeconds / 10); // Simplified for demo scale
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openSOAP = (patientName, studentId = null, appointmentId = null) => {
    setActivePatient({ name: patientName, studentId, appointmentId });
    setShowSOAP(true);
  };

  const startSession = (appt) => {
    setOngoingSession(appt);
    openSOAP(appt.student?.full_name, appt.student_id, appt.id);
  };

  const finishSession = () => {
    const patientToDocument = ongoingSession;
    setOngoingSession(null);
    openSOAP(
      patientToDocument.student?.full_name || "New Student", 
      patientToDocument.student_id, 
      patientToDocument.id
    );
  };

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const openVideoRoom = (appt) => {
    setActiveVideoRoom({
      roomName: `portal-session-${appt.id}`,
      patientName: appt.student?.full_name
    });
    setShowVideo(true);
  };

  useEffect(() => {
    if (user?.id) {
      fetchCounselorAppointments(user.id);
      fetchMatchedStudents(user.id);
    }
  }, [user?.id]);

  const fetchMatchedStudents = async (counselorId) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('crisis_flags')
        .select(`
          id,
          student_id,
          assessment:assessment_id (
            symptoms_description,
            category,
            priority_score
          ),
          student:student_id (
            full_name
          )
        `)
        .eq('assigned_counselor_id', counselorId)
        .eq('referral_status', 'Pending');
      
      if (error) throw error;
      setMatchedStudents(data || []);
    } catch (err) {
      console.error('Error fetching matched students:', err);
    }
  };

  const handleDragStart = (student) => {
    setDraggedStudent(student);
    setIsDragging(true);
  };

  const handleDrop = async (dayOffset, hour) => {
    if (!draggedStudent) return;
    
    setIsDragging(false);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    targetDate.setHours(hour, 0, 0, 0);

    const newAppt = {
      student_id: draggedStudent.student_id,
      counselor_id: user.id,
      appointment_time: targetDate.toISOString(),
      duration_minutes: draggedStudent.duration || 90,
      buffer_minutes: 2,
      session_type: selectedType,
      source: 'System Booking',
      status: 'scheduled'
    };

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppt)
        .select(`
          id,
          appointment_time,
          duration_minutes,
          session_type,
          student:student_id (
            full_name
          )
        `)
        .single();

      if (!error && data) {
        setAppointments(prev => [...prev, data]);
        // Update referral status in DB
        await supabase
          .from('crisis_flags')
          .update({ referral_status: 'In Progress' })
          .eq('id', draggedStudent.id);
          
        setMatchedStudents(prev => prev.filter(s => s.id !== draggedStudent.id));
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
    }
    setDraggedStudent(null);
  };

  const fetchCounselorAppointments = async (counselorId) => {
    setLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          duration_minutes,
          session_type,
          student:student_id (
            full_name
          )
        `)
        .eq('counselor_id', counselorId)
        .neq('status', 'cancelled');

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching counselor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const counselorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.name || 'C')}&background=random`;

  // Helper to check if a specific time/day has an appointment
  const getAppointmentForSlot = (dayOffset, hour) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    return appointments.find(a => {
      const apptDate = new Date(a.appointment_time);
      const apptDuration = a.duration_minutes || 90;
      const apptEnd = new Date(apptDate.getTime() + apptDuration * 60000);
      
      // Check if the requested hour falls within the session duration
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      return slotTime >= apptDate && slotTime < apptEnd;
    });
  };

  const getSlotPriority = (dayOffset, hour) => {
    if (hour === 12) return 'break';
    if (getAppointmentForSlot(dayOffset, hour)) return 'occupied';
    
    // Greedy: Is it adjacent to another appointment on the same day?
    const hasPrev = getAppointmentForSlot(dayOffset, hour - 1);
    const hasNext = getAppointmentForSlot(dayOffset, hour + 1);
    
    if (hasPrev || hasNext) return 'optimal';
    return 'available';
  };

  const timeSlots = [9, 10, 11, 12, 13, 14, 15, 16];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── VIDEO ROOM MODAL ─────────────────────────────────────────── */}
      <VideoRoom 
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        roomName={activeVideoRoom?.roomName}
        patientName={activeVideoRoom?.patientName}
      />

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
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>ROUTINE REFERRALS (DRAG & DROP)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matchedStudents.filter(s => s.assessment?.priority_score !== 'Urgent' && s.assessment?.priority_score !== 'Emergency').length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  No routine referrals
                </div>
              ) : (
                matchedStudents
                  .filter(s => s.assessment?.priority_score !== 'Urgent' && s.assessment?.priority_score !== 'Emergency')
                  .map((s) => (
                  <div 
                    key={s.id} 
                    draggable="true"
                    onDragStart={() => handleDragStart(s)}
                    style={{ 
                      backgroundColor: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'grab',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{s.student?.full_name}</h4>
                      <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#f1f5f9', color: '#64748b', fontWeight: 700 }}>{s.assessment?.priority_score}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', lineHeight: '1.4', fontStyle: 'italic' }}>
                      "{s.assessment?.symptoms_description.substring(0, 80)}..."
                    </p>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: 'var(--primary-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{s.assessment?.category}</span>
                      <select 
                        value={s.duration} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setMatchedStudents(prev => prev.map(item => item.id === s.id ? { ...item, duration: val } : item));
                        }}
                        style={{ fontSize: '0.7rem', padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value={90}>90 mins</option>
                        <option value={120}>120 mins</option>
                        <option value={150}>150 mins</option>
                        <option value={180}>180 mins</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '1rem', textAlign: 'center' }}>
              <Sparkles size={12} /> Only routine cases can be scheduled manually
            </p>
          </div>
          
        </div>

        {/* Right Panel - Calendar Grid Mock */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) repeat(2, 0.8fr)', borderBottom: '1px solid var(--border-color)' }}>
            {/* FIX-09: Compute real current week dates instead of hardcoded values */}
            {(() => {
              const today = new Date();
              const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
              const monday = new Date(today);
              monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
              return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                return {
                  day: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
                  date: d.getDate().toString(),
                  disabled: i >= 5,
                  isToday: d.toDateString() === today.toDateString(),
                };
              });
            })().map((d, i) => (
              <div key={i} style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: d.disabled ? '#f8fafc' : 'white', borderRight: i < 6 ? '1px solid var(--border-color)' : 'none' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: d.disabled ? '#cbd5e1' : 'var(--text-light)', marginBottom: '0.25rem' }}>{d.day}</p>
                <h3 style={{ fontSize: '1.5rem', color: d.disabled ? '#cbd5e1' : 'var(--text-dark)' }}>{d.date}</h3>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) repeat(2, 0.8fr)', flex: 1 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
              const nineAM = getAppointmentForSlot(dayOffset, 9);
              const tenAM = getAppointmentForSlot(dayOffset, 10);
              const elevenAM = getAppointmentForSlot(dayOffset, 11);
              const isWeekend = dayOffset >= 5;

              return (
                <div 
                  key={dayOffset} 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = 'rgba(35, 82, 145, 0.05)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.backgroundColor = isWeekend ? '#f8fafc' : 'transparent'; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = isWeekend ? '#f8fafc' : 'transparent'; handleDrop(dayOffset, 9); }}
                  style={{ borderRight: dayOffset < 6 ? '1px solid var(--border-color)' : 'none', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: isWeekend ? '#f8fafc' : 'transparent', transition: 'background-color 0.2s' }}
                >
                  {isWeekend ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ transform: 'rotate(-90deg)', color: '#cbd5e1', fontSize: '0.75rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>NO SESSIONS</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {timeSlots.map(hour => {
                        const appt = getAppointmentForSlot(dayOffset, hour);
                        const priority = getSlotPriority(dayOffset, hour);
                        const isOptimal = priority === 'optimal' && isDragging;
                        
                        if (priority === 'break') {
                          return (
                            <div key={hour} style={{ 
                              padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700,
                              background: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 10px, #e2e8f0 10px, #e2e8f0 20px)',
                              color: 'var(--text-light)', border: '1px solid var(--border-color)', opacity: 0.6
                            }}>
                              LUNCH BREAK
                            </div>
                          );
                        }

                        if (appt) {
                          const isEmergency = appt.priority === 'Urgent' || appt.priority === 'Emergency' || appt.source === 'Internal Referral';
                          const apptStartHour = new Date(appt.appointment_time).getHours();
                          const isStart = apptStartHour === hour;

                          if (!isStart) {
                            return (
                              <div key={hour} style={{ 
                                backgroundColor: isEmergency ? '#fef2f2' : '#f8fafc', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `1px dashed ${isEmergency ? '#ef4444' : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                              }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isEmergency ? '#ef4444' : '#64748b' }}>
                                  (Continuing) {appt.student?.full_name}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div key={hour} style={{ 
                              backgroundColor: 'var(--white)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: isEmergency ? '2px solid #ef4444' : '1px solid var(--border-color)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                              position: 'relative', zIndex: 1
                            }}>
                              {isEmergency && (
                                <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#ef4444', color: 'white', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>SYSTEM ALLOCATED</div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isEmergency ? '#ef4444' : 'var(--primary-blue)' }}>{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{appt.student?.full_name}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {appt.session_type === 'virtual' && (
                                  <button 
                                    onClick={() => openVideoRoom(appt)}
                                    style={{ flex: 1, background: '#8b5cf6', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                  >
                                    <Monitor size={12} /> VIDEO
                                  </button>
                                )}
                                <button onClick={() => startSession(appt)} style={{ flex: 1, background: isEmergency ? '#ef4444' : 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>START</button>
                                <button onClick={() => openSOAP(appt.student?.full_name, appt.student_id, appt.id)} style={{ background: isEmergency ? '#fef2f2' : '#eff6ff', color: isEmergency ? '#ef4444' : '#eff6ff', border: `1px solid ${isEmergency ? '#ef4444' : 'var(--primary-blue)'}`, padding: '0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>SOAP</button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={hour}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary-blue)'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = isOptimal ? '#22c55e' : 'transparent'; }}
                            onDrop={(e) => { e.preventDefault(); handleDrop(dayOffset, hour); }}
                            style={{ 
                              backgroundColor: isOptimal ? '#f0fdf4' : '#f1f5f9', 
                              color: isOptimal ? '#166534' : '#94a3b8', 
                              padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, 
                              transition: 'all 0.2s', border: '2px dashed',
                              borderColor: isOptimal ? '#22c55e' : 'transparent'
                            }}
                          >
                            {isOptimal ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                <Sparkles size={12} /> {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'} (Optimal)
                              </div>
                            ) : (
                              `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Bottom Bar Content */}
      <div style={{ backgroundColor: '#3b5f8f', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <img src={counselorAvatar} style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', border: '2px solid rgba(255,255,255,0.2)' }} />
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>LOGGED IN AS</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{user?.user_metadata?.name}</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>Managing Clinical Rotations & Referrals</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => openSOAP("Ad-hoc Session", null, null)}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Generate SOAP
          </button>
          <button 
            style={{ backgroundColor: 'white', color: 'var(--primary-blue)', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '1rem', border: 'none' }}>Confirm Appointment</button>
        </div>
      </div>
      <SOAPGenerator 
        isOpen={showSOAP} 
        onClose={() => setShowSOAP(false)} 
        patientName={activePatient?.name} 
        studentId={activePatient?.studentId}
        appointmentId={activePatient?.appointmentId}
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
