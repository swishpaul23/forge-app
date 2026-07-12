import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getTodayStr } from '../utils/dates';
import { buildWall } from '../utils/helpers';
import type { Database } from '../types/supabase';

type ChallengeTaskRow = Database['public']['Tables']['challenge_tasks']['Row'];

export interface ChallengeKpi {
  key: string;
  label: string;
  cat: string;
  nonNeg: boolean;
}

export interface ShapedChallenge {
  id: string;
  name: string;
  tag: string;
  dayNum: number;
  totalDays: number;
  streak: number;
  consistency: number;
  color: string;
  mission: string;
  is_main: boolean;
  created_at: string | null;
  start_date: string;
  kpis: ChallengeKpi[];
  wall?: unknown;
}

export interface ChallengesState {
  main: ShapedChallenge | null;
  secondary: ShapedChallenge[];
}

interface CreateChallengeInput {
  tasks?: { key?: string; label: string; cat?: string; nonNeg?: boolean }[];
  name: string;
  tag?: string;
  days?: number;
  totalDays?: number;
  color?: string;
  mission?: string | null;
  isMain?: boolean;
}

const EMPTY_CHALLENGES: ChallengesState = { main: null, secondary: [] };

/**
 * Hook for managing challenge state
 * Handles loading, creating, updating challenges
 */
export function useChallenge(user: User | null | undefined) {
  const [challenges, setChallenges] = useState<ChallengesState>(EMPTY_CHALLENGES);
  const [loading, setLoading] = useState(false);

  // Load challenges from DB
  const loadChallenges = useCallback(async (uid: string) => {
    if (!uid || !supabase) return;
    setLoading(true);
    
    try {
      const { data: chs } = await supabase
        .from("challenges")
        .select("*, challenge_tasks(*)")
        .eq("user_id", uid)
        .eq("archived", false)
        .order("created_at", { ascending: true });

      if (!chs || chs.length === 0) {
        setChallenges(EMPTY_CHALLENGES);
        setLoading(false);
        return null;
      }

      const today = getTodayStr();
      const todayForCalc = new Date(today + "T12:00:00");
      const msPerDay = 24 * 60 * 60 * 1000;

      const shaped = chs.map(ch => {
        const startStr = ch.start_date || ch.created_at?.split("T")[0];
        const startDate = new Date(startStr + "T12:00:00");
        const dayNum = Math.floor((todayForCalc.getTime() - startDate.getTime()) / msPerDay) + 1;

        return {
          id: ch.id,
          name: ch.name,
          tag: ch.tag || "CUSTOM",
          dayNum: Math.min(Math.max(dayNum, 1), ch.total_days),
          totalDays: ch.total_days,
          streak: ch.streak || 0,
          consistency: ch.consistency || 0,
          color: ch.color || "#D4922A",
          mission: ch.mission || "",
          is_main: ch.is_main,
          created_at: ch.created_at,
          start_date: startStr,
          kpis: (ch.challenge_tasks || [])
            .sort((a: ChallengeTaskRow, b: ChallengeTaskRow) => a.sort_order! - b.sort_order!)
            .map((t: ChallengeTaskRow) => ({
              key: t.key,
              label: t.label,
              cat: t.cat || "other",
              nonNeg: t.non_neg || false,
            })),
        };
      });

      const main = shaped.find(c => c.is_main) || null;
      const secondary = shaped.filter(c => !c.is_main).slice(0, 3);

      setChallenges({
        main: main ? { ...main, wall: buildWall() } : null,
        secondary,
      });

      setLoading(false);
      return { main, secondary };
    } catch (e) {
      console.warn("loadChallenges:", e);
      setLoading(false);
      return null;
    }
  }, []);

  // Create a new challenge
  const createChallenge = useCallback(async (challengeData: CreateChallengeInput) => {
    if (!user?.id || !supabase) return null;

    const { tasks, ...cd } = challengeData;
    
    try {
      // Calculate start_date as today
      const startDate = getTodayStr();

      const { data: ch, error: chErr } = await supabase
        .from("challenges")
        .insert({
          user_id: user.id,
          name: cd.name,
          tag: cd.tag || "CUSTOM",
          total_days: cd.days || cd.totalDays,
          day_num: 1,
          streak: 0,
          consistency: 0,
          color: cd.color || "#D4922A",
          mission: cd.mission || null,
          is_main: cd.isMain !== false,
          archived: false,
          start_date: startDate,
        })
        .select()
        .single();

      if (chErr) throw chErr;

      // Insert tasks
      if (tasks?.length) {
        const { error: tErr } = await supabase.from("challenge_tasks").insert(
          tasks.map((t, i) => ({
            challenge_id: ch.id,
            key: t.key || `task_${i}`,
            label: t.label,
            cat: t.cat || "other",
            non_neg: t.nonNeg || false,
            sort_order: i,
          }))
        );
        if (tErr) throw tErr;
      }

      // Reload challenges
      await loadChallenges(user.id);
      return ch;
    } catch (e) {
      console.warn("createChallenge:", e);
      return null;
    }
  }, [user, loadChallenges]);

  // Archive/delete a challenge
  const deleteChallenge = useCallback(async (challengeId: string) => {
    if (!user?.id || !supabase) return false;

    try {
      await supabase
        .from("challenges")
        .update({ archived: true })
        .eq("id", challengeId);

      await loadChallenges(user.id);
      return true;
    } catch (e) {
      console.warn("deleteChallenge:", e);
      return false;
    }
  }, [user, loadChallenges]);

  // Update challenge fields
  const updateChallenge = useCallback(async (challengeId: string, updates: Database['public']['Tables']['challenges']['Update']) => {
    if (!supabase) return false;

    try {
      await supabase
        .from("challenges")
        .update(updates)
        .eq("id", challengeId);

      if (user?.id) await loadChallenges(user.id);
      return true;
    } catch (e) {
      console.warn("updateChallenge:", e);
      return false;
    }
  }, [user, loadChallenges]);

  // Check if user has an active challenge
  const hasChallenge = !!challenges.main;

  return {
    challenges,
    setChallenges,
    loading,
    hasChallenge,
    loadChallenges,
    createChallenge,
    deleteChallenge,
    updateChallenge,
    EMPTY_CHALLENGES,
  };
}
