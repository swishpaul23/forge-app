import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { getTodayStr } from '../utils/dates';

/**
 * Hook for managing checkins and daily task state
 * Handles loading checkins, toggling tasks, logging days
 */
export function useCheckins(user, challenge) {
  const [kpis, setKpis] = useState({});
  const [checkins, setCheckins] = useState({}); // { "YYYY-MM-DD": score }
  const [allCheckins, setAllCheckins] = useState({}); // { challengeId: { "YYYY-MM-DD": score } }
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [totalDaysForged, setTotalDaysForged] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load today's checkin and kpi state
  const loadTodayCheckin = useCallback(async () => {
    if (!user?.id || !challenge?.id || !supabase) return;

    const today = getTodayStr();

    try {
      const { data: todayCheckin } = await supabase
        .from("checkins")
        .select("completed_keys, score")
        .eq("challenge_id", challenge.id)
        .eq("date", today)
        .maybeSingle();

      // Build kpi state - start all as false
      const kpiState = {};
      (challenge.kpis || []).forEach(k => {
        kpiState[k.key] = false;
      });

      if (todayCheckin?.completed_keys) {
        todayCheckin.completed_keys.forEach(key => {
          if (kpiState.hasOwnProperty(key)) kpiState[key] = true;
        });
        setLoggedToday(true);
      } else {
        setLoggedToday(false);
      }

      setKpis(kpiState);
    } catch (e) {
      console.warn("loadTodayCheckin:", e);
    }
  }, [user, challenge]);

  // Load all checkins for the current challenge
  const loadCheckins = useCallback(async () => {
    if (!user?.id || !challenge?.id || !supabase) return;
    setLoading(true);

    try {
      const { data: rows } = await supabase
        .from("checkins")
        .select("date, score")
        .eq("challenge_id", challenge.id);

      const map = {};
      (rows || []).forEach(r => {
        map[r.date] = r.score;
      });

      // Auto-backfill missed days
      const today = getTodayStr();
      const startDate = challenge.start_date;
      
      if (startDate) {
        const missedDays = [];
        const start = new Date(startDate + "T12:00:00");
        const todayDate = new Date(today + "T12:00:00");

        for (let d = new Date(start); d < todayDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          if (!map[dateStr]) {
            missedDays.push(dateStr);
          }
        }

        // Backfill missed days with 0%
        if (missedDays.length > 0) {
          const inserts = missedDays.map(date => ({
            challenge_id: challenge.id,
            date,
            score: 0,
            completed_keys: [],
            day_mode: "auto",
          }));
          await supabase.from("checkins").upsert(inserts, { onConflict: "challenge_id,date" });

          missedDays.forEach(date => {
            map[date] = 0;
          });

          // Reset streak to 0 since we missed days
          await supabase.from("challenges").update({ streak: 0 }).eq("id", challenge.id);
        }
      }

      setCheckins(map);
      setLoggedToday(today in map);
      setLoading(false);
    } catch (e) {
      console.warn("loadCheckins:", e);
      setLoading(false);
    }
  }, [user, challenge]);

  // Load all challenge history with checkins (for Wall page)
  const loadChallengeHistory = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data: allChallenges } = await supabase
        .from("challenges")
        .select("id, name, tag, total_days, start_date, created_at, streak, consistency, is_main, archived, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!allChallenges) return;

      const challengeIds = allChallenges.map(c => c.id);

      const { data: allCheckinRows } = await supabase
        .from("checkins")
        .select("challenge_id, date, score")
        .in("challenge_id", challengeIds);

      // Group checkins by challenge_id
      const checkinsByChallenge = {};
      let totalForgedDays = 0;
      (allCheckinRows || []).forEach(c => {
        if (!checkinsByChallenge[c.challenge_id]) checkinsByChallenge[c.challenge_id] = {};
        checkinsByChallenge[c.challenge_id][c.date] = c.score;
        if (c.score > 0) totalForgedDays++;
      });

      // Filter challenges: keep only those with >1 checkin OR currently active
      const validChallenges = allChallenges.filter(c => {
        const checkinCount = Object.keys(checkinsByChallenge[c.id] || {}).length;
        return checkinCount > 1 || !c.archived;
      }).map(c => {
        const scores = Object.values(checkinsByChallenge[c.id] || {});
        return {
          id: c.id,
          name: c.name,
          tag: c.tag || "CUSTOM",
          totalDays: c.total_days,
          startDate: c.start_date || c.created_at?.split("T")[0],
          streak: c.streak || 0,
          consistency: c.consistency || 0,
          isMain: c.is_main,
          archived: c.archived,
          completedAt: c.completed_at,
          checkinCount: scores.filter(s => s > 0).length,
        };
      });

      setChallengeHistory(validChallenges);
      setAllCheckins(checkinsByChallenge);
      setTotalDaysForged(totalForgedDays);
    } catch (e) {
      console.warn("loadChallengeHistory:", e);
    }
  }, [user]);

  // Toggle a task on/off
  const toggle = useCallback(async (key) => {
    if (!challenge?.id || !supabase) return;

    setKpis(prev => {
      const updated = { ...prev, [key]: !prev[key] };

      // Save to DB
      const today = getTodayStr();
      const completed = Object.entries(updated).filter(([, v]) => v).map(([k]) => k);
      const total = (challenge.kpis || []).length;
      const score = total > 0 ? Math.round((completed.length / total) * 100) : 0;

      supabase.from("checkins").upsert({
        challenge_id: challenge.id,
        date: today,
        score,
        completed_keys: completed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "challenge_id,date" }).then(() => {});

      return updated;
    });
  }, [challenge]);

  // Log the day (finalize checkin)
  const logDay = useCallback(async (done, total) => {
    if (!challenge?.id || !supabase) return false;

    const today = getTodayStr();
    const score = total > 0 ? Math.round((done / total) * 100) : 0;

    try {
      await supabase.from("checkins").upsert({
        challenge_id: challenge.id,
        date: today,
        score,
        completed_keys: Object.entries(kpis).filter(([, v]) => v).map(([k]) => k),
        updated_at: new Date().toISOString(),
      }, { onConflict: "challenge_id,date" });

      setLoggedToday(true);
      setCheckins(prev => ({ ...prev, [today]: score }));

      // Update streak and consistency
      const currentStreak = score > 0 ? (challenge.streak || 0) + 1 : 0;
      
      // Calculate new consistency
      const allScores = Object.values({ ...checkins, [today]: score });
      const passingDays = allScores.filter(s => s > 0).length;
      const completedDays = allScores.length;
      const newConsistency = completedDays > 0 
        ? Math.min(100, Math.round((passingDays / completedDays) * 100))
        : 0;

      await supabase.from("challenges").update({
        streak: currentStreak,
        consistency: newConsistency,
      }).eq("id", challenge.id);

      return true;
    } catch (e) {
      console.warn("logDay:", e);
      return false;
    }
  }, [challenge, kpis, checkins]);

  // Load checkins when challenge changes
  useEffect(() => {
    if (challenge?.id) {
      loadCheckins();
      loadTodayCheckin();
    }
  }, [challenge?.id, loadCheckins, loadTodayCheckin]);

  // Load challenge history when user changes
  useEffect(() => {
    if (user?.id) {
      loadChallengeHistory();
    }
  }, [user?.id, loadChallengeHistory]);

  return {
    kpis,
    setKpis,
    checkins,
    setCheckins,
    allCheckins,
    challengeHistory,
    totalDaysForged,
    loggedToday,
    setLoggedToday,
    loading,
    toggle,
    logDay,
    loadCheckins,
    loadChallengeHistory,
  };
}
