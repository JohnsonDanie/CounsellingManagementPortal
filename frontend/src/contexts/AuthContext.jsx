import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState(null);

  useEffect(() => {
    // 1. Check active sessions and sets the user
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          const allowedDomains = ['builtbysalih.com', 'nileuniversity.edu.ng'];
          const userDomain = session.user.email?.split('@')[1];

          if (!allowedDomains.includes(userDomain)) {
            supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
          fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        // Ensure loading is always cleared — a hanging getSession() causes a permanent blank screen
        console.error('Session check failed:', err);
        setLoading(false);
      });

    // 2. Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const allowedDomains = ['builtbysalih.com', 'nileuniversity.edu.ng'];
        const userDomain = session.user.email?.split('@')[1];
        
        if (!allowedDomains.includes(userDomain)) {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          alert("Unauthorized Domain: Please use your university email.");
          return;
        }
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
        emailRedirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
        data: {
          role: role,
          full_name: fullName,
        }
      }
    });
    if (error) throw error;

    // FIX-02: Create the profiles row immediately so fetchProfile() never fails
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          role: role,
          email: email,
        });
      if (profileError) {
        // Non-fatal: profile may already exist via DB trigger
        console.warn('Profile row creation warning:', profileError.message);
      }
    }

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

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });
    if (error) throw error;
    return data;
  };

  const isAllowedDomain = (email) => {
    const allowedDomains = ['builtbysalih.com', 'nileuniversity.edu.ng'];
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
    isAllowedDomain,
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
