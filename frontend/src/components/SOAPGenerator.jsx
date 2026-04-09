import React, { useState } from 'react';
import { 
  Sparkles, X, Save, Copy, RotateCcw, 
  ChevronRight, FileText, AlertCircle, Loader2 
} from 'lucide-react';
import { generateSOAPNote } from '../lib/geminiService';

const SOAPGenerator = ({ isOpen, onClose, patientName = "New Student" }) => {
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [soap, setSoap] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!rawNotes.trim()) {
      setError("Please enter raw session notes first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await generateSOAPNote(rawNotes);
      setSoap(result);
    } catch (err) {
      setError(err.message || "Failed to generate AI note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setSoap(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, this would save to Supabase/DB
    console.log("Saving SOAP Note:", soap);
    alert("SOAP Note saved to patient record successfully!");
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }} />

      {/* Main Modal */}
      <div style={{ 
        position: 'relative', width: '100%', maxWidth: '1200px', height: '90vh', 
        background: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--primary-blue), #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>AI SOAP Note Generator</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Assessing: <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{patientName}</span></p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }}>
            <X size={18} />
          </button>
        </div>

        {/* 2-Pane Content */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.6fr 1fr', background: '#f8fafc' }}>
          
          {/* Pane 1: INPUT (Raw Notes) */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raw Session Input</label>
              <button 
                onClick={() => setRawNotes('')}
                style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, background: 'transparent', border: 'none' }}>
                CLEAR
              </button>
            </div>
            <textarea 
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste or type raw session notes here... 
Example: Student arrived late and avoided eye contact. She said 'I feel like nobody cares about my work'. I noticed her hands were shaking. We discussed a study schedule."
              style={{
                flex: 1, padding: '1.25rem', borderRadius: '16px', border: '2px solid #e2e8f0',
                background: 'white', color: '#1e293b', fontSize: '1rem', lineHeight: 1.6,
                outline: 'none', resize: 'none', transition: 'border-color 0.2s',
                marginBottom: '0.5rem'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />

            {/* Restyled Generate Button */}
            <button 
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                padding: '1rem 2rem', borderRadius: '12px',
                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #1e293b, #334155)',
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '100%', fontWeight: 700, fontSize: '1rem'
              }}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>GENERATING...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate</span>
                </>
              )}
            </button>

            {error && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                {error}
              </div>
            )}
          </div>


          {/* Pane 3: OUTPUT (Editable S-O-A-P) */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinical Output (Editable)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button title="Copy to clipboard" style={{ p: '0.4rem', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#64748b' }}><Copy size={16} /></button>
                <button title="Reset fields" style={{ p: '0.4rem', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#64748b' }}><RotateCcw size={16} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { key: 'subjective', label: 'Subjective (S)', color: '#3b82f6' },
                { key: 'objective', label: 'Objective (O)', color: '#10b981' },
                { key: 'assessment', label: 'Assessment (A)', color: '#f59e0b' },
                { key: 'plan', label: 'Plan (P)', color: '#ef4444' }
              ].map((field) => (
                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: field.color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: field.color }}>{field.label}</span>
                  </div>
                  <textarea 
                    value={soap[field.key]}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`AI-generated ${field.key}...`}
                    style={{
                      width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px',
                      background: 'white', color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.5,
                      outline: 'none', transition: 'all 0.2s', minHeight: '100px'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = field.color; e.target.style.boxShadow = `0 0 0 4px ${field.color}10`; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto', color: '#64748b', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>Review generated output for clinical accuracy before saving.</span>
          </div>
          <button 
            onClick={onClose}
            className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
          <button 
            onClick={handleSave}
            className="btn-primary" style={{ padding: '0.75rem 2rem', gap: '0.6rem' }}>
            <Save size={18} /> Finalize Session Note
          </button>
        </div>

        <style>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            background: #1e293b;
          }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default SOAPGenerator;
