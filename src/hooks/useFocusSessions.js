import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { getTodayStr } from '../utils/dates';

/**
 * Hook for managing focus/deep work sessions
 */
export function useFocusSessions(user) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load focus sessions
  const loadSessions = useCallback(async () => {
    if (!user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setSessions(data || []);
    } catch (e) {
      console.warn("loadFocusSessions:", e);
    }
    setLoading(false);
  }, [user]);

  // Save a new focus session
  const saveSession = useCallback(async (sessionData) => {
    if (!user?.id || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: user.id,
          date: getTodayStr(),
          duration_minutes: sessionData.durationMinutes,
          tasks_completed: sessionData.tasksCompleted || [],
          cycles: sessionData.cycles || 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Reload sessions
      await loadSessions();
      return data;
    } catch (e) {
      console.warn("saveFocusSession:", e);
      return null;
    }
  }, [user, loadSessions]);

  // Get sessions for a specific date
  const getSessionsForDate = useCallback((date) => {
    return sessions.filter(s => s.date === date);
  }, [sessions]);

  // Get total focus time for today
  const todayFocusMinutes = sessions
    .filter(s => s.date === getTodayStr())
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return {
    sessions,
    loading,
    loadSessions,
    saveSession,
    getSessionsForDate,
    todayFocusMinutes,
  };
}
