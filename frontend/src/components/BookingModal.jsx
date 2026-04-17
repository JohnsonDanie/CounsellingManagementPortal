import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Video, User, 
  CheckCircle2, AlertCircle, ChevronRight, HelpCircle
} from 'lucide-react';
import { getAvailableSlots } from '../lib/bookingService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DURATIONS = [
  { label: '30 min', value: 30, desc: 'Quick check-in or follow-up' },
  { label: '60 min', value: 60, desc: 'Standard therapy session' },
  { label: '90 min', value: 90, desc: 'Extended consultation' },
  { label: '120 min', value: 120, desc: 'Intensive initial assessment' },
];

const BookingModal = ({ isOpen, onClose, counselor }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Date/Duration, 2: Slot Selection, 3: Success
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [sessionType, setSessionType] = useState('virtual');

  // Fetch slots whenever date or duration changes
  useEffect(() => {
    if (isOpen && counselor && step === 2) {
      loadSlots();
    }
  }, [selectedDate, duration, step]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const available = await getAvailableSlots(counselor.id, selectedDate, duration);
      setSlots(available);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          student_id: user.id,
          counselor_id: counselor.id,
          appointment_time: selectedSlot.iso,
          duration_minutes: duration,
          buffer_minutes: 30, // Default buffer
          session_type: sessionType,
          status: 'scheduled'
        });

      if (error) throw error;
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #ffffff, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--primary-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-blue)' }}>Book with {counselor?.full_name}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>{counselor?.title || 'Clinical Counselor'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>1. Select Date & Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-blue)' }} />
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}
                    />
                  </div>
                  <select 
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                  >
                    <option value="virtual">Virtual Session</option>
                    <option value="in-person">In-Person Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>2. Session Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {DURATIONS.map((d) => (
                    <button 
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      style={{
                        padding: '1rem', borderRadius: '16px', textAlign: 'left',
                        border: duration === d.value ? '2px solid var(--primary-blue)' : '1px solid #e2e8f0',
                        background: duration === d.value ? '#eff6ff' : 'white',
                        transition: 'all 0.2s', cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: duration === d.value ? 'var(--primary-blue)' : '#1e293b', marginBottom: '0.25rem' }}>{d.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <HelpCircle size={18} color="#64748b" style={{ marginTop: '0.1rem' }} />
                  <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                    Available slots will be updated based on your selected duration to ensure enough time is available for the full session.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Find Available Times <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Available starting times</h3>
                <button onClick={() => setStep(1)} style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change Date/Duration</button>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Clock size={32} className="animate-spin" color="var(--primary-blue)" />
                </div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff1f2', borderRadius: '16px', border: '1px solid #ffe4e6' }}>
                  <AlertCircle size={32} color="#e11d48" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 700, color: '#9f1239' }}>No slots found</p>
                  <p style={{ fontSize: '0.85rem', color: '#be123c', opacity: 0.8 }}>The counselor has no availability for this date/duration combination.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {slots.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedSlot(s)}
                      style={{
                        padding: '1rem 0.5rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700,
                        border: selectedSlot?.iso === s.iso ? '2px solid var(--primary-blue)' : '1px solid #e2e8f0',
                        background: selectedSlot?.iso === s.iso ? 'var(--primary-blue)' : '#f8fafc',
                        color: selectedSlot?.iso === s.iso ? 'white' : 'var(--primary-blue)',
                        transition: 'all 0.15s', cursor: 'pointer'
                      }}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}

              <button 
                disabled={!selectedSlot || bookingLoading}
                onClick={handleBook}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem', marginTop: '2rem' }}
              >
                {bookingLoading ? 'Securing Booking...' : 'Complete Booking'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <CheckCircle2 size={40} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Appointment Secured!</h2>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                Your {duration}-min {sessionType} session with {counselor?.full_name} is confirmed for {new Date(selectedSlot?.iso).toLocaleDateString()} at {selectedSlot?.time}.
              </p>
              <button 
                onClick={onClose}
                className="btn-secondary"
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}
              >
                Return to Dashboard
              </button>
            </div>
          )}

        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-spin { animation: spin 2s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default BookingModal;
