import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Hook for managing authentication state
 * Handles user session, profile loading, and auth state changes
 */
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate a random 8-char uppercase invite code
  const genInviteCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  // Load profile from DB — auto-generate invite_code if missing
  const loadProfile = useCallback(async (uid) => {
    if (!uid || !supabase) return null;
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (data) {
        if (!data.invite_code) {
          const code = genInviteCode();
          await supabase.from("profiles").update({ invite_code: code }).eq("id", uid);
          data.invite_code = code;
        }
        setProfile(data);
        return data;
      }
    } catch (e) {
      console.warn("profile load:", e);
    }
    return null;
  }, []);

  // Save/update profile
  const saveProfile = useCallback(async (updates) => {
    if (!user?.id || !supabase) return null;
    try {
      const { data } = await supabase
        .from("profiles")
        .upsert({ id: user.id, updated_at: new Date().toISOString(), ...updates })
        .select()
        .single();
      if (data) setProfile(data);
      return data;
    } catch (e) {
      console.warn("profile save:", e);
      return null;
    }
  }, [user]);

  // Auth state listener
  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    loadProfile,
    saveProfile,
    setProfile,
  };
}
