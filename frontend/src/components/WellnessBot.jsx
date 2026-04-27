import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const WellnessBot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi ${user?.user_metadata?.name?.split(' ')[0] || 'there'}! I'm your wellness companion. I'm here 24/7. Just checking in—how have you been feeling since your last session?`,
      options: ['Much better', 'About the same', 'Feeling overwhelmed']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking and logic
    setTimeout(() => {
      processBotResponse(text.toLowerCase());
    }, 1200);
  };

  const processBotResponse = async (input) => {
    let botResponse = {};

    if (input.includes('better') || input.includes('good') || input.includes('great')) {
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "That's wonderful to hear! Remember, your resilience strategies from your last session are a great tool to keep that momentum going. Need anything else?",
        options: ['Show me resources', 'No thanks, I am good']
      };
    } else if (input.includes('same')) {
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "Understood. Consistency can be a good thing, but if you feel stuck, we can always tweak your plan. Would you like to review some daily wellness tips?",
        options: ['Yes, please', 'No, not right now']
      };
    } else if (input.includes('overwhelmed') || input.includes('worse') || input.includes('stress') || input.includes('bad')) {
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "I'm really sorry you're feeling that way. It's okay to have tough days. Based on what you're sharing, I highly recommend scheduling a quick check-in session with your counselor. I can also notify them mapping this trend. Shall we do that?",
        options: ['Yes, notify my counselor', 'Just show me resources']
      };
    } else if (input.includes('yes, notify')) {
      await alertCounselor();
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "Done. I've sent a confidential alert to your clinical counselor regarding your recent mood trend. They will be checking in on you soon. You can also book a session directly right now.",
        options: ['Book Session Now', 'Maybe later']
      };
    } else if (input.includes('notify center') || input.includes('yes, notify my counselor')) {
       await alertCounselor();
       botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "I've sent an update to your counselor so they are aware of this trend and can update your care plan. Please take care of yourself, and consider booking a session.",
        options: ['Book Session Now']
      };
    } else if (input.includes('book session now')) {
      navigate('/booking');
      setIsOpen(false);
      return;
    } else if (input.includes('show me resources')) {
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "Here are some of our tailored resources! You can find more structured modules right on your dashboard.",
        options: []
      };
      // Might want to add a trigger here to scroll to resources.
    } else {
      botResponse = {
        id: Date.now(),
        sender: 'bot',
        text: "I hear you. My automated chat is a bit limited, but remember I'm always monitoring your trends to help. If you ever need immediate clinical support, I recommend reaching out directly.",
        options: ['Return to Check-in']
      };
    }

    setIsTyping(false);
    setMessages(prev => [...prev, botResponse]);
  };

  const alertCounselor = async () => {
    try {
      // 1. Fetch the student's assigned counselor or a crisis response counselor
      const { data: cData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'counselor')
        .limit(1)
        .single();
      
      if (!cData) return;

      // 2. Create Notification
      await supabase.from('notifications').insert({
        user_id: cData.id,
        type: 'alert',
        title: 'Negative Trend Alert',
        message: `Student ${user?.user_metadata?.name} reported feeling overwhelmed during their automated bot check-in. Review their care plan.`,
        is_read: false
      });

      // 3. (Optional) Log a crisis flag for visibility on the dashboard sidebar
      await supabase.from('crisis_flags').insert({
        student_id: user.id,
        assigned_counselor_id: cData.id,
        notes: 'Automated Chatbot detected worsening emotional trends. Prompt intervention recommended.',
        status: 'investigating'
      });
      
    } catch (err) {
      console.error('Error notifying counselor:', err);
    }
  };

  return (
    <>
      {/* FAB (Floating Action Button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary-blue)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(35,82,145,0.3)',
            cursor: 'pointer',
            border: 'none',
            zIndex: 1000,
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={32} />
          {/* Notification Dot Mock */}
          <div style={{
            position: 'absolute', top: '0', right: '0', width: '16px', height: '16px',
            background: '#ef4444', borderRadius: '50%', border: '2px solid white'
          }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '350px',
          height: '500px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-blue), #3b6cb7)',
            padding: '1rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '50%' }}>
                <Bot size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Wellness Chat</h3>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '16px',
                  borderBottomRightRadius: msg.sender === 'user' ? '2px' : '16px',
                  background: msg.sender === 'user' ? 'var(--primary-blue)' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  boxShadow: msg.sender === 'bot' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  border: msg.sender === 'bot' ? '1px solid #e2e8f0' : 'none'
                }}>
                  {msg.text}
                </div>
                
                {/* Options / Quick Replies */}
                {msg.options && msg.options.length > 0 && msg.id === messages[messages.length - 1].id && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-start' }}>
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(opt)}
                        style={{
                          background: 'white', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)',
                          padding: '0.4rem 0.8rem', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer',
                          fontWeight: 600, transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.target.style.background = 'var(--primary-blue)'; e.target.style.color = 'white'; }}
                        onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.color = 'var(--primary-blue)'; }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.75rem 1rem', borderRadius: '16px', borderBottomLeftRadius: '2px', border: '1px solid #e2e8f0', display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <div style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                <div style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid var(--border-color)',
                outline: 'none', fontSize: '0.9rem'
              }}
            />
            <button
              onClick={() => handleSend(inputText)}
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim() ? 'var(--primary-blue)' : '#cbd5e1', color: 'white',
                border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: inputText.trim() ? 'pointer' : 'default',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '-2px' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WellnessBot;
