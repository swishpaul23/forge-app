import { useState, useCallback } from "react";
import type { SupabaseClientType, SupabaseClientUntyped, User } from "../types";
import type { Database } from "../types/supabase";
import type { GoogleSyncHook } from "./useGoogleSync";

// TODO(google-sync): gcal_event_id is added by supabase/google_schema.sql —
// once that's applied and `supabase.ts` is regenerated, drop this
// intersection and rely on the generated Row type directly.
export type TimeBlock = Database["public"]["Tables"]["time_blocks"]["Row"] & {
  gcal_event_id?: string | null;
};
type TimeBlockInput = Database["public"]["Tables"]["time_blocks"]["Insert"] & {
  id?: string;
  gcal_event_id?: string | null;
};

const toLocalDateStr = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getWeekDates = (referenceDate: Date = new Date()): string[] => {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return toLocalDateStr(nd);
  });
};

export const useTimeBlocks = (
  sb: SupabaseClientType | null,
  user: User | null | undefined,
  googleSync?: GoogleSyncHook
) => {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(false);

  // Persists a newly-created GCal event id both to the DB and local state,
  // so a later edit within the same session sees it and PATCHes instead of
  // creating a duplicate event. Fire-and-forget from the caller's side —
  // never awaited by saveBlock, never blocks the UI.
  const persistGcalEventId = useCallback(async (blockId: string, gcalEventId: string) => {
    if (!sb) return;
    await (sb as SupabaseClientUntyped).from("time_blocks").update({ gcal_event_id: gcalEventId }).eq("id", blockId);
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, gcal_event_id: gcalEventId } : b));
  }, [sb]);

  const loadBlocks = useCallback(async (referenceDate: Date = new Date()) => {
    if (!sb || !user) return;
    setLoading(true);
    const dates = getWeekDates(referenceDate);
    const { data } = await sb
      .from("time_blocks")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", dates[0])
      .lte("date", dates[6])
      .order("start_time", { ascending: true });
    if (data) setBlocks(data);
    setLoading(false);
  }, [sb, user]);

  const saveBlock = useCallback(async (block: TimeBlockInput) => {
    if (!sb || !user) return null;
    const wasUpdate = !!block.id;
    const row = {
      user_id: user.id,
      date: block.date || toLocalDateStr(),
      start_time: block.start_time,
      duration: block.duration || 1,
      label: block.label,
      tag_id: block.tag_id || null,
      task_key: block.task_key || null,
      is_regimen: block.is_regimen || false,
      completed: block.completed || false,
    };
    let saved: TimeBlock | null;
    if (block.id) {
      // Update existing
      const { data } = await sb.from("time_blocks").update(row).eq("id", block.id).select().single();
      if (data) setBlocks(prev => prev.map(b => b.id === block.id ? data : b));
      saved = data;
    } else {
      // Insert new
      const { data } = await sb.from("time_blocks").insert(row).select().single();
      if (data) setBlocks(prev => [...prev, data]);
      saved = data;
    }

    // Google Calendar sync is a fire-and-forget side effect — Supabase
    // remains the source of truth and this call is never awaited here, so
    // it can't slow down or block saveBlock's caller.
    if (saved && googleSync?.isConnected) {
      if (wasUpdate) {
        void googleSync.updateCalendarEvent(saved);
      } else {
        void googleSync.pushBlockToCalendar(saved).then(eventId => {
          if (eventId) void persistGcalEventId(saved!.id, eventId);
        });
      }
    }

    return saved;
  }, [sb, user, googleSync, persistGcalEventId]);

  const deleteBlock = useCallback(async (blockId: string) => {
    if (!sb || !user) return;
    const block = blocks.find(b => b.id === blockId);
    await sb.from("time_blocks").delete().eq("id", blockId).eq("user_id", user.id);
    setBlocks(prev => prev.filter(b => b.id !== blockId));

    if (block?.gcal_event_id && googleSync?.isConnected) {
      void googleSync.deleteCalendarEvent(block.gcal_event_id);
    }
  }, [sb, user, blocks, googleSync]);

  const toggleComplete = useCallback(async (blockId: string) => {
    if (!sb || !user) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const newVal = !block.completed;
    await sb.from("time_blocks").update({ completed: newVal }).eq("id", blockId);
    const updated = { ...block, completed: newVal };
    setBlocks(prev => prev.map(b => b.id === blockId ? updated : b));

    if (googleSync?.isConnected) {
      void googleSync.updateCalendarEvent(updated);
    }

    return newVal;
  }, [sb, user, blocks, googleSync]);

  return { blocks, loading, loadBlocks, saveBlock, deleteBlock, toggleComplete, getWeekDates };
};

export { toLocalDateStr, getWeekDates };
