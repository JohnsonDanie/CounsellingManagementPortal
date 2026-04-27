import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Edit3, Trash2, 
  ExternalLink, Play, Wind, Sparkles, X, Save, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResourceCMS = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    content_url: '',
    type: 'article',
    category: 'General'
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resource = null) => {
    setError('');
    if (resource) {
      setFormData(resource);
      setIsEditing(true);
    } else {
      setFormData({
        id: null,
        title: '',
        description: '',
        content_url: '',
        type: 'article',
        category: 'General'
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('resources')
          .update({
            title: formData.title,
            description: formData.description,
            content_url: formData.content_url,
            type: formData.type,
            category: formData.category
          })
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([{
            title: formData.title,
            description: formData.description,
            content_url: formData.content_url,
            type: formData.type,
            category: formData.category
          }]);
        if (error) throw error;
      }
      
      setShowModal(false);
      fetchResources();
    } catch (err) {
      console.error('Error saving resource:', err);
      setError(err.message || 'Failed to save resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Failed to delete resource.');
    }
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '0.4rem', fontWeight: 800 }}>Content Management</h1>
          <p style={{ color: 'var(--text-light)' }}>Manage the self-help resources available to students.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={18} /> Add New Resource
        </button>
      </div>

      {/* Main Container */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by title or category keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            Loading resources...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: '#64748b' }}>Resource</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: '#64748b' }}>Type</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: '#64748b' }}>Category</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>{res.title}</p>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.description}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: getTypeStyle(res.type).bg, color: getTypeStyle(res.type).color,
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        {getTypeIcon(res.type)} {res.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px', color: '#475569' }}>
                        {res.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a href={res.content_url} target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', padding: '0.5rem', borderRadius: '6px', background: '#f5f3ff', cursor: 'pointer', display: 'flex' }} title="Preview">
                          <ExternalLink size={16} />
                        </a>
                        <button onClick={() => handleOpenModal(res)} style={{ color: '#3b82f6', padding: '0.5rem', borderRadius: '6px', background: '#eff6ff', border: 'none', cursor: 'pointer' }} title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(res.id)} style={{ color: '#ef4444', padding: '0.5rem', borderRadius: '6px', background: '#fef2f2', border: 'none', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredResources.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto', display: 'block' }} />
                      No resources found. Add your first resource to help students.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }} />
          
          <div style={{ 
            position: 'relative', width: '100%', maxWidth: '600px', background: 'white', 
            borderRadius: '24px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary-blue)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Sparkles size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  {isEditing ? 'Edit Resource' : 'Add New Resource'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Resource Title</label>
                <input 
                  type="text" required value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. 5-Minute Box Breathing"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Description</label>
                <textarea 
                  required value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Briefly describe how this helps..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Content Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                  >
                    <option value="article">Article / Guide</option>
                    <option value="video">Video</option>
                    <option value="exercise">Interactive Exercise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Category / Tag</label>
                  <input 
                    type="text" required value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g. Anxiety, Stress, General"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>Keywords connect to student assessments.</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>External Link URL</label>
                <input 
                  type="url" required value={formData.content_url} 
                  onChange={e => setFormData({...formData, content_url: e.target.value})}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ResourceCMS;
