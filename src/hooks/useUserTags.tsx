import { useState, useEffect, useCallback } from "react";
import type { SupabaseClientType, User } from "../types";

export type UserTag = {
  id: string;
  label: string;
  color: string;
  is_system?: boolean | null;
  user_id?: string;
};

export const SYSTEM_TAGS: UserTag[] = [
  { id: "fitness", label: "Fitness", color: "#C0604A", is_system: true },
  { id: "mindset", label: "Mindset", color: "#7A6BBF", is_system: true },
  { id: "work",    label: "Work",    color: "#4A8ABF", is_system: true },
  { id: "rest",    label: "Rest",    color: "#4A8A6A", is_system: true },
];

export const useUserTags = (sb: SupabaseClientType | null, user: User | null | undefined) => {
  const [tags, setTags] = useState<UserTag[]>(SYSTEM_TAGS);
  const [loading, setLoading] = useState(false);

  const loadTags = useCallback(async () => {
    if (!sb || !user) return;
    setLoading(true);
    const { data } = await sb
      .from("user_tags")
      .select("*")
      .eq("user_id", user.id);

    if (data && data.length > 0) {
      // Merge: system tags overridden by DB versions, plus custom tags
      const dbMap = Object.fromEntries(data.map(t => [t.id, t]));
      const merged = SYSTEM_TAGS.map(t => dbMap[t.id] ? { ...t, ...dbMap[t.id] } : t);
      const custom = data.filter(t => !SYSTEM_TAGS.find(s => s.id === t.id));
      setTags([...merged, ...custom]);
    }
    setLoading(false);
  }, [sb, user]);

  useEffect(() => { loadTags(); }, [loadTags]);

  const saveTag = useCallback(async (tag: UserTag) => {
    if (!sb || !user) return;
    const row = { ...tag, user_id: user.id };
    await sb.from("user_tags").upsert(row, { onConflict: "id,user_id" });
    setTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      return exists ? prev.map(t => t.id === tag.id ? { ...t, ...tag } : t) : [...prev, tag];
    });
  }, [sb, user]);

  const deleteTag = useCallback(async (tagId: string) => {
    if (!sb || !user) return;
    // Don't allow deleting system tags
    if (SYSTEM_TAGS.find(t => t.id === tagId)) return;
    await sb.from("user_tags").delete().eq("id", tagId).eq("user_id", user.id);
    setTags(prev => prev.filter(t => t.id !== tagId));
  }, [sb, user]);

  return { tags, loading, saveTag, deleteTag, reload: loadTags };
};
