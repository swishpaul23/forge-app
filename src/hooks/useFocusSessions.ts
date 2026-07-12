import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getTodayStr } from '../utils/dates';
import type { Database } from '../types/supabase';

type FocusSessionRow = Database['public']['Tables']['focus_sessions']['Row'];

// TODO: type this — this hook predates a schema change and is currently
// unused (not wired into the live app). It reads/writes `date` and
// `duration_minutes`, but the generated focus_sessions Row exposes
// `created_at` and `duration_seconds` instead. Augmenting the generated Row
// with the legacy fields keeps types green without rewriting the dead logic.
interface FocusSession extends FocusSessionRow {
  date?: string;
  duration_minutes?: number;
}

interface SaveSessionInput {
  durationMinutes: number;
  tasksCompleted?: unknown[];
  cycles?: number;
}

/**
 * Hook for managing focus/deep work sessions
 */
export function useFocusSessions(user: User | null | undefined) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
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
  const saveSession = useCallback(async (sessionData: SaveSessionInput) => {
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
  const getSessionsForDate = useCallback((date: string) => {
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
