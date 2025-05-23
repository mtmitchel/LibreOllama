import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Get session from local storage initially
    const checkSession = async () => {
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error.message);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Unexpected error during auth check:', err);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, updatedSession) => {
      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);
    });

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [mounted]);

  // For development/testing purposes when auth is not enabled,
  // we'll provide a mock user ID that can be used by other hooks
  const mockUserId = '00000000-0000-0000-0000-000000000000';
  const getCurrentUserId = () => user?.id || mockUserId;

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    getCurrentUserId,
    signIn: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signUp: async (email: string, password: string) => {
      return supabase.auth.signUp({ email, password });
    },
    signOut: async () => {
      return supabase.auth.signOut();
    },
  };
} 