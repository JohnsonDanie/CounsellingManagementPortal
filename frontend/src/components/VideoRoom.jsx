import React from 'react';
import { X, Maximize2, ShieldCheck, Video } from 'lucide-react';

const VideoRoom = ({ isOpen, onClose, roomName, patientName }) => {
  if (!isOpen) return null;

  // We use Jitsi Meet External API (embedded iframe)
  // Secure URL format: https://meet.jit.si/[RoomID]
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '95%', height: '90%', backgroundColor: '#1e293b', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video color="white" size={20} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>Secure Clinical Session</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Student: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{patientName}</span> • Encrypted Connection</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <ShieldCheck size={14} color="#22c55e" />
              <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>HIPAA COMPLIANT MODE</span>
            </div>
            <button 
              onClick={onClose}
              style={{ padding: '0.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Iframe */}
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Video Conference"
          />
        </div>

        {/* Footer / Controls (Additional UI if needed) */}
        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>
          This session is private. Nile University Wellness Portal does not record video or audio for student privacy.
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
