import React from 'react';
import { BookOpen, Play, Wind, ExternalLink, Sparkles, ArrowRight } from 'lucide-react';

const ResourceLibrary = ({ resources, isLoading }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Play size={16} />;
      case 'exercise': return <Wind size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'video': return { bg: '#fff7ed', color: '#c2410c' };
      case 'exercise': return { bg: '#f0fdfa', color: '#0f766e' };
      default: return { bg: '#eff6ff', color: '#1d4ed8' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '200px', borderRadius: '24px', backgroundColor: '#f1f5f9', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }} />
        ))}
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f8fafc', 
        borderRadius: '32px', border: '2px dashed #e2e8f0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
      }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={32} color="#94a3b8" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Your tailored guide is ready</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>Complete a quick wellness check-in to see resources curated specifically for you.</p>
        </div>
        <button style={{ 
          marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '12px', 
          background: 'white', border: '1px solid #e2e8f0', color: '#235291',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          Check-in Now <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {resources.map((res, idx) => {
        const style = getTypeStyle(res.type);
        return (
          <div 
            key={res.id}
            className="resource-card"
            style={{ 
              backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '28px', padding: '1.75rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              animation: `card-fade-in 0.5s ease backwards ${idx * 0.1}s`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(35, 82, 145, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(35, 82, 145, 0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
              e.currentTarget.style.borderColor = '#f1f5f9';
            }}
            onClick={() => window.open(res.content_url, '_blank')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ 
                width: '42px', height: '42px', borderRadius: '14px', background: style.bg, color: style.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 16px ${style.bg}`
              }}>
                {getTypeIcon(res.type)}
              </div>
              <span style={{ 
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', 
                color: '#94a3b8', letterSpacing: '0.1em', background: '#f8fafc',
                padding: '0.3rem 0.6rem', borderRadius: '8px'
              }}>
                {res.category}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.6rem', lineHeight: 1.4 }}>{res.title}</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6' }}>{res.description}</p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: style.color, letterSpacing: '0.05em' }}>{res.type.toUpperCase()}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExternalLink size={14} color="#94a3b8" />
              </div>
            </div>

            {/* Subtle background decoration */}
            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', background: `${style.bg}40`, borderRadius: '50%', filter: 'blur(30px)', zIndex: 0 }} />
          </div>
        );
      })}

      <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @keyframes card-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ResourceLibrary;

