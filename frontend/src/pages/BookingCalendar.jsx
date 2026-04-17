import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Search, Star, MessageSquare, 
  MapPin, Calendar, Clock, ArrowRight,
  Info, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BookingModal from '../components/BookingModal';

const BookingCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'counselor');

      if (error) throw error;
      setCounselors(data || []);
    } catch (err) {
      console.error('Error fetching counselors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCounselors = counselors.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openBooking = (c) => {
    setSelectedCounselor(c);
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Hero Section */}
      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Self-Service Portal</p>
        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Book a Counseling Session</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6 }}>
          Select a specialist from our clinical team. All slots automatically enforce a 30-minute 
          health buffer and support sessions up to 2 hours.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '1rem', 
        padding: '1.25rem 1.75rem', background: '#f0f9ff', 
        borderRadius: '20px', border: '1px solid #bae6fd' 
      }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Info size={20} color="#0284c7" />
        </div>
        <div>
          <p style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 700 }}>Intelligent Scheduling active</p>
          <p style={{ fontSize: '0.8rem', color: '#0284c7', opacity: 0.85 }}>Only available, conflict-free time slots are displayed for your convenience.</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '1rem 1rem 1rem 3.25rem', 
              borderRadius: '16px', border: '1px solid #e2e8f0', 
              fontSize: '0.95rem', background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          />
        </div>
        <select style={{ padding: '0 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, color: '#475569', background: 'white' }}>
          <option>All Specializations</option>
          <option>Academic Stress</option>
          <option>Anxiety & Grief</option>
          <option>Career Guidance</option>
        </select>
      </div>

      {/* Counselor Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={40} color="var(--primary-blue)" className="animate-spin" />
        </div>
      ) : filteredCounselors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569' }}>No counselors available</h3>
          <p style={{ color: '#94a3b8' }}>Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredCounselors.map((c) => (
            <div key={c.id} className="card" style={{ 
              padding: '1.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: '1px solid #f1f5f9'
            }}
            onClick={() => openBooking(c)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            >
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '20px', 
                  background: 'var(--secondary-bg)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-blue)'
                }}>
                  {c.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{c.full_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-blue)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Star size={14} fill="currentColor" /> {c.title || 'Senior Advisor'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                  <MapPin size={16} /> <span>Clinical Center, Wing A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                  <MessageSquare size={16} /> <span>Available for Virtual & In-Person</span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDir: 'column' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Next Available</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>Today, 2:00 PM</span>
                </div>
                <button className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Book Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        counselor={selectedCounselor}
      />

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BookingCalendar;
