import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState(null);

  useEffect(() => {
    // 1. Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const savedAssessment = localStorage.getItem('assessmentResult');
    if (savedAssessment) {
      setAssessmentResult(JSON.parse(savedAssessment));
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) throw error;

      // Merge Auth and Database Profile
      setUser({
        ...authUser,
        user_metadata: {
          ...authUser.user_metadata,
          role: profile.role,
          name: profile.full_name,
          title: profile.title
        }
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, role, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    
    setAssessmentResult(null);
    localStorage.removeItem('assessmentResult');
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setAssessmentResult(null);
    localStorage.removeItem('assessmentResult');
  };

  const setAssessmentComplete = (result) => {
    setAssessmentResult(result);
    localStorage.setItem('assessmentResult', JSON.stringify(result));
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    assessmentResult,
    setAssessmentComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
