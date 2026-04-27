import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyzeWellbeing } from '../utils/crisisEngine';
import {
  HeartPulse, BookOpen, Users, Briefcase, Brain,
  Frown, Meh, Smile, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

const SYMPTOM_TAGS = [
  { label: 'Academic Stress', icon: BookOpen, color: '#3b82f6' },
  { label: 'Anxiety', icon: Brain, color: '#8b5cf6' },
  { label: 'Personal Issues', icon: HeartPulse, color: '#ec4899' },
  { label: 'Social Problems', icon: Users, color: '#f59e0b' },
  { label: 'Career Concerns', icon: Briefcase, color: '#10b981' },
  { label: 'Depression', icon: Frown, color: '#6366f1' },
  { label: 'Family Conflict', icon: Users, color: '#ef4444' },
  { label: 'Grief / Loss', icon: HeartPulse, color: '#64748b' },
];

const MOOD_LABELS = {
  1: { label: 'Very Poor', icon: Frown, color: '#ef4444' },
  2: { label: 'Poor', icon: Frown, color: '#f97316' },
  3: { label: 'Low', icon: Frown, color: '#f59e0b' },
  4: { label: 'Below Average', icon: Meh, color: '#eab308' },
  5: { label: 'Neutral', icon: Meh, color: '#84cc16' },
  6: { label: 'Fair', icon: Meh, color: '#22c55e' },
  7: { label: 'Good', icon: Smile, color: '#10b981' },
  8: { label: 'Great', icon: Smile, color: '#14b8a6' },
  9: { label: 'Very Good', icon: Smile, color: '#06b6d4' },
  10: { label: 'Excellent', icon: Smile, color: '#3b82f6' },
};

const Assessment = () => {
  const { user, setAssessmentComplete } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [severityScores, setSeverityScores] = useState({});
  const [description, setDescription] = useState('');
  const [moodScore, setMoodScore] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const toggleTag = (label) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { priority, category, isHighRisk } = analyzeWellbeing(description, selectedTags, moodScore);

    try {
      const { data: assessment, error: assessErr } = await supabase
        .from('assessments')
        .insert({
          student_id: user.id,
          symptoms_description: description,
          category,
          priority_score: priority,
          severity_scores: severityScores,
          status: isHighRisk ? 'in_queue' : 'pending',
        })
        .select()
        .single();

      if (assessErr) throw assessErr;

      if (isHighRisk && assessment) {
        await supabase.from('crisis_flags').insert({
          assessment_id: assessment.id,
          student_id: user.id,
          queue_position: Math.floor(Math.random() * 3) + 1,
          referral_status: 'Pending',
        });
      }
    } catch (err) {
      console.error('Assessment save error:', err);
    }

    setAssessmentComplete({ priority, category, isHighRisk });
    setResult({ priority, category, isHighRisk });
    setStep(5);
    setSubmitting(false);
  };

  const handleContinue = () => {
    if (result?.isHighRisk) {
      navigate('/student-dashboard');
    } else {
      navigate('/booking');
    }
  };

  const MoodIcon = MOOD_LABELS[moodScore]?.icon || Meh;
  const moodColor = MOOD_LABELS[moodScore]?.color || '#64748b';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f8faff 50%, #fff5f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #235291, #4f80c0)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 10px rgba(35,82,145,0.25)',
          }}>
            <HeartPulse color="white" size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            Well-Being Check-In
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
            We care about how you're doing. This brief assessment helps us connect you with the right support.
          </p>
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              {['Symptoms', 'Severity', 'Story', 'Mood'].map((label, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  color: step > i ? '#235291' : step === i + 1 ? '#235291' : '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {label}
                </span>
              ))}
            </div>
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((step - 1) / 4) * 100}%`,
                background: 'linear-gradient(90deg, #235291, #4f80c0)',
                borderRadius: '99px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(35,82,145,0.1)',
          border: '1px solid rgba(35,82,145,0.08)',
        }}>

          {/* STEP 1 — Symptom Tags */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                What are you experiencing?
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {SYMPTOM_TAGS.map(({ label, icon: Icon, color }) => {
                  const active = selectedTags.includes(label);
                  return (
                    <div
                      key={label}
                      onClick={() => toggleTag(label)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.8rem', borderRadius: '12px',
                        border: active ? `2px solid ${color}` : '2px solid #e2e8f0',
                        background: active ? `${color}08` : '#fff', cursor: 'pointer'
                      }}
                    >
                      <Icon size={16} color={active ? color : '#94a3b8'} />
                      <span style={{ fontSize: '0.85rem' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => {
                  if (selectedTags.length > 0) {
                    const newScores = { ...severityScores };
                    selectedTags.forEach(t => { if(!newScores[t]) newScores[t] = 5; });
                    setSeverityScores(newScores);
                    setStep(2);
                  } else setStep(3);
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2 — Severity Sliders */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Symptom Intensity</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                {selectedTags.map(tag => (
                  <div key={tag}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600 }}>{tag}</span>
                      <span style={{ color: 'var(--primary-blue)', fontWeight: 800 }}>{severityScores[tag] || 5}/10</span>
                    </div>
                    <input type="range" min="1" max="10" value={severityScores[tag] || 5} onChange={(e) => setSeverityScores({...severityScores, [tag]: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--primary-blue)' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>Next</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Your Story */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Tell us more</h2>
              <textarea 
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Share whatever you are comfortable with..."
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', minHeight: '150px', marginBottom: '1.5rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(selectedTags.length > 0 ? 2 : 1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={() => setStep(4)} className="btn-primary" style={{ flex: 2 }}>Next</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Overall Mood */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2rem', textAlign: 'center' }}>How is your overall mood?</h2>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${moodColor}18`, border: `3px solid ${moodColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <MoodIcon size={36} color={moodColor} />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: moodColor }}>{moodScore}</div>
                <p style={{ fontWeight: 600, color: '#64748b' }}>{MOOD_LABELS[moodScore]?.label}</p>
              </div>
              <input type="range" min="1" max="10" value={moodScore} onChange={e => setMoodScore(parseInt(e.target.value))} style={{ width: '100%', accentColor: moodColor, marginBottom: '2rem' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flex: 2 }}>
                  {submitting ? 'Analyzing...' : 'Complete Assessment'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Result */}
          {step === 5 && result && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: result.isHighRisk ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                {result.isHighRisk ? <AlertTriangle color="#ef4444" /> : <CheckCircle2 color="#22c55e" />}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{result.isHighRisk ? 'Support is available.' : 'Thank you for sharing.'}</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Priority Level: <strong>{result.priority}</strong></p>
              <button 
                onClick={handleContinue} 
                className="btn-primary" 
                style={{ width: '100%' }}
              >
                {result.isHighRisk ? 'Go to Safety Dashboard' : 'Continue to Portal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assessment;
