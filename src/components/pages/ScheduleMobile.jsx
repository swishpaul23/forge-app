import React, { useState, useEffect } from "react";
import { useTimeBlocks, toLocalDateStr } from "../../hooks/useTimeBlocks";
import { useUserTags } from "../../hooks/useUserTags";

const SLOT_H = 36;
const ALL_SLOTS = Array.from({ length: 48 }, (_, i) => i * 0.5);
const DUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

const fmtTime = (h) => {
  const hh = Math.floor(h), mm = h % 1 === 0.5 ? "30" : "00";
  const ap = hh < 12 ? "am" : "pm";
  const disp = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${disp}:${mm}${ap}`;
};

const ScheduleMobile = ({ sb, user, challenges, kpis, toggle, regimen, regimenChecked, toggleRegimen, googleSync }) => {
  const { blocks, loadBlocks, saveBlock, deleteBlock, toggleComplete } = useTimeBlocks(sb, user, googleSync);
  const { tags, saveTag } = useUserTags(sb, user);

  const [menuState,    setMenuState]    = useState(null);
  const [newLabel,     setNewLabel]     = useState("");
  const [selTag,       setSelTag]       = useState(null);
  const [startTime,    setStartTime]    = useState(8);
  const [duration,     setDuration]     = useState(1);
  const [customColor,  setCustomColor]  = useState("#8B5CF6");
  const [customLabel,  setCustomLabel]  = useState("");

  const todayStr    = toLocalDateStr();
  const todayBlocks = blocks.filter(b => b.date === todayStr);

  useEffect(() => { loadBlocks(); }, []);

  const getTag = (tagId) => tags.find(t => t.id === tagId) || { color: "#888", label: "" };

  // ── Issue 4: dynamic display range ───────────────────────
  const getDisplayRange = () => {
    if (todayBlocks.length === 0) return { start: 7, end: 22 };
    const earliest = Math.min(...todayBlocks.map(b => b.start_time));
    const latest   = Math.max(...todayBlocks.map(b => b.start_time + b.duration));
    return { start: Math.max(0, Math.floor(earliest) - 1), end: Math.min(23, Math.ceil(latest) + 1) };
  };

  // ── Issue 3: unscheduled tasks ────────────────────────────
  const getUnscheduledTasks = () => {
    const scheduled = new Set(todayBlocks.filter(b => b.task_key).map(b => b.task_key));
    const tasks = [];
    (challenges?.main?.kpis || []).forEach(t => {
      if (!scheduled.has(t.key)) tasks.push({ key: t.key, label: t.label, source: "Challenge", is_regimen: false });
    });
    const dow = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    (regimen?.days?.[dow] || []).forEach(t => {
      if (!scheduled.has(t.id)) tasks.push({ key: t.id, label: t.label, source: "Regimen", is_regimen: true });
    });
    return tasks;
  };

  // ── Issue 1: tap block to complete, syncs dashboard ──────
  const handleBlockTap = async (block) => {
    await toggleComplete(block.id);
    if (block.task_key && !block.is_regimen && toggle) toggle(block.task_key);
    if (block.task_key && block.is_regimen && toggleRegimen) toggleRegimen(block.task_key);
  };

  const handleSave = async (taskOverride) => {
    const task = taskOverride || null;
    if (menuState?.block) {
      await saveBlock({ ...menuState.block, tag_id: selTag ?? menuState.block.tag_id, start_time: startTime, duration });
    } else if (task) {
      await saveBlock({ date: todayStr, start_time: startTime, duration: 1, label: task.label, tag_id: selTag, task_key: task.key, is_regimen: task.is_regimen });
    } else {
      if (!newLabel.trim()) { setMenuState(null); return; }
      await saveBlock({ date: todayStr, start_time: startTime, duration, label: newLabel.trim(), tag_id: selTag });
    }
    setMenuState(null);
    setNewLabel("");
    setSelTag(null);
  };

  const handleAddCustomTag = () => {
    if (!customLabel.trim()) return;
    saveTag({ id: `custom_${Date.now()}`, label: customLabel.trim(), color: customColor, is_system: false });
    setCustomLabel("");
  };

  const openSlotMenu = (hour) => {
    setSelTag(null); setNewLabel(""); setStartTime(hour); setDuration(1);
    setMenuState({ block: null, hour });
  };

  const openBlockMenu = (e, block) => {
    e.stopPropagation();
    setSelTag(block.tag_id); setStartTime(block.start_time); setDuration(block.duration);
    setMenuState({ block, hour: block.start_time });
  };

  const { start: rangeStart, end: rangeEnd } = getDisplayRange();
  const displayHours = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);
  const unscheduled  = getUnscheduledTasks();

  const nowTop = (() => {
    const now = new Date();
    return ((now.getHours() + now.getMinutes() / 60) - rangeStart) * SLOT_H * 2;
  })();

  return (
    <div style={{ padding: "16px 0 80px" }}>
      {/* Header */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".2em", color: "var(--text-2)", marginBottom: 4 }}>Schedule</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "var(--text-0)", lineHeight: 1 }}>Today</div>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", marginLeft: 16 }}>
        {/* Time column — dynamic range */}
        <div style={{ width: 44, flexShrink: 0 }}>
          {displayHours.map(h => (
            <div key={h} style={{ height: SLOT_H * 2, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, color: "var(--text-3)", letterSpacing: ".04em" }}>
                {h < 12 ? `${h === 0 ? "12" : h}am` : h === 12 ? "12pm" : `${h-12}pm`}
              </span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div style={{ flex: 1, borderLeft: "1px solid var(--border-0)", position: "relative", marginRight: 16 }}>
          {displayHours.map(h => (
            <React.Fragment key={h}>
              <div onClick={() => openSlotMenu(h)}
                style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)18", cursor: "pointer" }} />
              <div onClick={() => openSlotMenu(h + 0.5)}
                style={{ height: SLOT_H, borderBottom: "1px dashed var(--border-0)10", cursor: "pointer" }} />
            </React.Fragment>
          ))}

          {/* Now line */}
          {nowTop >= 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: nowTop, height: 1, background: "var(--err)", zIndex: 3, pointerEvents: "none" }}>
              <div style={{ position: "absolute", left: -3, top: -3, width: 6, height: 6, borderRadius: "50%", background: "var(--err)" }} />
            </div>
          )}

          {/* Blocks — offset by rangeStart */}
          {todayBlocks.map(block => {
            const tag      = getTag(block.tag_id);
            const topPx    = (block.start_time - rangeStart) * 2 * SLOT_H;
            const heightPx = Math.max(block.duration * 2 * SLOT_H - 2, 28);
            return (
              <div key={block.id}
                onClick={() => handleBlockTap(block)}
                onContextMenu={e => { e.preventDefault(); openBlockMenu(e, block); }}
                style={{
                  position: "absolute", left: 2, right: 2, top: topPx, height: heightPx,
                  background: tag.color + (block.completed ? "44" : "BB"),
                  borderRadius: 6, padding: "4px 8px",
                  fontSize: 11, fontWeight: 500, color: "#fff",
                  overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  cursor: "pointer", zIndex: 1,
                  opacity: block.completed ? 0.5 : 1,
                  textDecoration: block.completed ? "line-through" : "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <span>{block.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 8, opacity: .7 }}>{fmtTime(block.start_time)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom drawer */}
      {menuState && (
        <>
          <div onClick={() => setMenuState(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--bg-1)", borderRadius: "20px 20px 0 0",
            padding: "16px 20px 32px", zIndex: 101, maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--bg-3)", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 12 }}>
              {menuState.block ? "Edit block" : "New block"}
            </div>

            {/* Unscheduled tasks */}
            {!menuState.block && unscheduled.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 8 }}>From your tasks</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {unscheduled.map(t => (
                    <div key={t.key} onClick={() => handleSave(t)}
                      style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--border-1)", fontSize: 13, color: "var(--text-1)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                      <span>{t.label}</span>
                      <span style={{ fontSize: 10, color: "var(--text-2)" }}>{t.source}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--border-1)", margin: "12px 0" }} />
              </div>
            )}

            {/* Custom label */}
            {!menuState.block && (
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="Or type a custom task..."
                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "var(--text-0)", fontFamily: "'DM Sans',sans-serif", marginBottom: 14, outline: "none" }} />
            )}

            {/* Time + duration */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 6 }}>Start</div>
                <select value={startTime} onChange={e => setStartTime(parseFloat(e.target.value))}
                  style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--text-0)", fontFamily: "'IBM Plex Mono',monospace", outline: "none" }}>
                  {ALL_SLOTS.map(s => <option key={s} value={s}>{fmtTime(s)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 6 }}>Duration</div>
                <select value={duration} onChange={e => setDuration(parseFloat(e.target.value))}
                  style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--text-0)", fontFamily: "'IBM Plex Mono',monospace", outline: "none" }}>
                  {DUR_OPTIONS.map(d => <option key={d} value={d}>{d === 0.5 ? "30 min" : `${d} hr${d > 1 ? "s" : ""}`}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 8 }}>Tag</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {tags.map(t => (
                <div key={t.id} onClick={() => setSelTag(selTag === t.id ? null : t.id)}
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "center", color: "#fff", background: t.color + "CC", border: selTag === t.id ? "2px solid #fff4" : "2px solid transparent" }}>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Custom tag */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
                style={{ width: 32, height: 32, border: "1px solid var(--border-1)", borderRadius: 6, background: "var(--bg-2)", cursor: "pointer", padding: 2 }} />
              <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                placeholder="Custom tag..."
                style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--text-0)", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
              <button onClick={handleAddCustomTag}
                style={{ padding: "8px 12px", background: "var(--accent-lo)", border: "1px solid var(--accent)", borderRadius: 8, color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>+</button>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleSave(null)}
                style={{ flex: 1, padding: "13px 0", background: "var(--accent)", border: "none", borderRadius: 10, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: ".06em", color: "#080807", cursor: "pointer" }}>
                Save
              </button>
              {menuState.block && (
                <button onClick={async () => { await deleteBlock(menuState.block.id); setMenuState(null); }}
                  style={{ padding: "13px 16px", background: "#BF5D5D18", border: "1px solid #BF5D5D40", borderRadius: 10, fontSize: 13, color: "#BF5D5D", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScheduleMobile;