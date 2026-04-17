import React, { useState, useEffect } from 'react';
import { Save, Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { updateCounselorAvailability } from '../lib/bookingService';

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const AvailabilitySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [availability, setAvailability] = useState(
    DAYS.map((day, index) => ({
      day_of_week: index,
      day_name: day,
      start_time: '09:00',
      end_time: '17:00',
      is_active: index >= 1 && index <= 5 // Monday-Friday active by default
    }))
  );

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_availability')
        .select('*')
        .eq('counselor_id', user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const merged = DAYS.map((day, index) => {
          const found = data.find(d => d.day_of_week === index);
          return found ? { ...found, day_name: day } : {
            day_of_week: index,
            day_name: day,
            start_time: '09:00',
            end_time: '17:00',
            is_active: false
          };
        });
        setAvailability(merged);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load schedule settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const nextAvail = [...availability];
    nextAvail[index][field] = value;
    setAvailability(nextAvail);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSuccess(false);
    setError(null);
    try {
      // Upsert each day's availability
      for (const item of availability) {
        await updateCounselorAvailability(
          user.id,
          item.day_of_week,
          item.start_time,
          item.end_time,
          item.is_active
        );
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save availability settings.');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div style={{ animate: 'spin 1s linear infinite' }}>
          <Clock size={32} color="var(--primary-blue)" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Scheduling Controls</p>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-blue)', marginBottom: '0.75rem', fontWeight: 800 }}>Weekly Availability</h1>
        <p style={{ color: 'var(--text-light)', maxWidth: '600px', lineHeight: 1.6 }}>
          Define your standard working hours. The system will automatically calculate conflict-free 
          slots and enforce a <strong>30-minute buffer</strong> between all sessions.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {availability.map((day, idx) => (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '140px 1fr 1fr 100px', 
              alignItems: 'center', 
              gap: '2rem',
              padding: '1.25rem',
              borderRadius: '16px',
              background: day.is_active ? 'white' : '#f8fafc',
              opacity: day.is_active ? 1 : 0.7,
              border: day.is_active ? '1px solid #e2e8f0' : '1px solid transparent',
              transition: 'all 0.2s',
              boxShadow: day.is_active ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
            }}>
              <div style={{ fontWeight: 700, color: day.is_active ? 'var(--primary-blue)' : 'var(--text-light)', fontSize: '1rem' }}>{day.day_name}</div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>Starts At</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="time" 
                    value={day.start_time}
                    disabled={!day.is_active}
                    onChange={(e) => handleChange(idx, 'start_time', e.target.value)}
                    style={{ 
                      width: '100%', padding: '0.75rem', borderRadius: '10px', 
                      border: '1px solid var(--border-color)', background: day.is_active ? 'white' : '#f1f5f9',
                      fontSize: '0.9rem', fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>Ends At</label>
                <input 
                  type="time" 
                  value={day.end_time}
                  disabled={!day.is_active}
                  onChange={(e) => handleChange(idx, 'end_time', e.target.value)}
                  style={{ 
                    width: '100%', padding: '0.75rem', borderRadius: '10px', 
                    border: '1px solid var(--border-color)', background: day.is_active ? 'white' : '#f1f5f9',
                    fontSize: '0.9rem', fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={day.is_active}
                    onChange={(e) => handleChange(idx, 'is_active', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '2.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem', 
          background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)', 
          borderRadius: '16px', 
          border: '1px solid #bae6fd' 
        }}>
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
               <Clock size={20} color="#0369a1" />
             </div>
             <div>
               <p style={{ fontSize: '0.9rem', color: '#0c4a6e', fontWeight: 700, marginBottom: '0.1rem' }}>Smart Gap Protection</p>
               <p style={{ fontSize: '0.75rem', color: '#0369a1', opacity: 0.8 }}>A default 30-min buffer is applied between sessions.</p>
             </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {success && (
                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', animation: 'fadeIn 0.3s' }}>
                  <Check size={20} /> Changes Saved Successfully
                </span>
              )}
              {error && (
                <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={20} /> {error}
                </span>
              )}
              <button 
                onClick={handleSave}
                disabled={saveLoading}
                className="btn-primary"
                style={{ 
                  padding: '1rem 3rem', borderRadius: '12px', 
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(35, 82, 145, 0.3)',
                  transition: 'all 0.2s',
                  transform: saveLoading ? 'scale(0.98)' : 'none'
                }}
              >
                <Save size={20} /> {saveLoading ? 'Updating...' : 'Apply Schedule'}
              </button>
           </div>
        </div>
      </div>

      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 54px;
          height: 28px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        input:checked + .slider {
          background-color: var(--primary-blue);
        }
        input:focus + .slider {
          box-shadow: 0 0 1px var(--primary-blue);
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(26px);
          -ms-transform: translateX(26px);
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default AvailabilitySettings;
