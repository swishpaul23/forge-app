import { useState, useCallback } from "react";

const toLocalDateStr = (d = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getWeekDates = (referenceDate = new Date()) => {
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

export const useTimeBlocks = (sb, user) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBlocks = useCallback(async (referenceDate = new Date()) => {
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

  const saveBlock = useCallback(async (block) => {
    if (!sb || !user) return null;
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
    if (block.id) {
      // Update existing
      const { data } = await sb.from("time_blocks").update(row).eq("id", block.id).select().single();
      if (data) setBlocks(prev => prev.map(b => b.id === block.id ? data : b));
      return data;
    } else {
      // Insert new
      const { data } = await sb.from("time_blocks").insert(row).select().single();
      if (data) setBlocks(prev => [...prev, data]);
      return data;
    }
  }, [sb, user]);

  const deleteBlock = useCallback(async (blockId) => {
    if (!sb || !user) return;
    await sb.from("time_blocks").delete().eq("id", blockId).eq("user_id", user.id);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, [sb, user]);

  const toggleComplete = useCallback(async (blockId) => {
    if (!sb || !user) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const newVal = !block.completed;
    await sb.from("time_blocks").update({ completed: newVal }).eq("id", blockId);
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, completed: newVal } : b));
    return newVal;
  }, [sb, user, blocks]);

  return { blocks, loading, loadBlocks, saveBlock, deleteBlock, toggleComplete, getWeekDates };
};

export { toLocalDateStr, getWeekDates };
