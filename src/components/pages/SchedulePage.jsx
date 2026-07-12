import React, { useState, useEffect, useRef } from "react";
import { useTimeBlocks, toLocalDateStr, getWeekDates } from "../../hooks/useTimeBlocks";
import { useUserTags } from "../../hooks/useUserTags";

const SLOT_H = 32;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_SLOTS = Array.from({ length: 48 }, (_, i) => i * 0.5);
const DUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

const fmtTime = (h) => {
  const hh = Math.floor(h), mm = h % 1 === 0.5 ? "30" : "00";
  const ap = hh < 12 ? "am" : "pm";
  const disp = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${disp}:${mm}${ap}`;
};

const todayLocalStr = () => toLocalDateStr(new Date());
const getTodayDowIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

// ── Time/duration selects ─────────────────────────────────────
const TimeSelect = ({ value, onChange, label }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-sub)" }}>{label}</div>
    <select value={value} onChange={e => onChange(parseFloat(e.target.value))}
      style={{ background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono',monospace", outline: "none", cursor: "pointer" }}>
      {ALL_SLOTS.map(s => <option key={s} value={s}>{fmtTime(s)}</option>)}
    </select>
  </div>
);

// ── Floating block menu ───────────────────────────────────────
const BlockMenu = ({ tags, block, slotInfo, slotHour, unscheduledTasks, onSave, onDelete, onClose, onAddTag }) => {
  const [selTag,      setSelTag]      = useState(block?.tag_id || null);
  const [label,       setLabel]       = useState("");
  const [startTime,   setStartTime]   = useState(block?.start_time ?? slotHour ?? 8);
  const [duration,    setDuration]    = useState(block?.duration || 1);
  const [customColor, setCustomColor] = useState("#8B5CF6");
  const [customLabel, setCustomLabel] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const handleSave = () => {
    if (!block && !label.trim()) return;
    onSave({ tag_id: selTag, label: block ? block.label : label, start_time: startTime, duration });
    onClose();
  };

  const handleQuickAdd = (task) => {
    onSave({ tag_id: selTag, label: task.label, start_time: startTime, duration: 1, task_key: task.key, is_regimen: task.is_regimen });
    onClose();
  };

  const handleAddCustomTag = () => {
    if (!customLabel.trim()) return;
    onAddTag({ id: `custom_${Date.now()}`, label: customLabel.trim(), color: customColor, is_system: false });
    setCustomLabel("");
  };

  return (
    <div ref={ref} style={{
      position: "fixed", background: "#1C1C18", border: "1px solid #2A2A25",
      borderRadius: 10, padding: 12, zIndex: 9999, minWidth: 220,
      boxShadow: "0 8px 32px rgba(0,0,0,.6)",
      left: slotInfo.x, top: slotInfo.y,
      maxHeight: "80vh", overflowY: "auto",
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-sub)", marginBottom: 8 }}>
        {block ? "Edit block" : "New block"}
      </div>

      {/* Unscheduled tasks quick-add */}
      {!block && unscheduledTasks.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-sub)", marginBottom: 6 }}>From your tasks</div>
          {unscheduledTasks.map(t => (
            <div key={t.key} onClick={() => handleQuickAdd(t)}
              style={{ padding: "5px 8px", borderRadius: 6, background: "#2A2A25", fontSize: 11, color: "#B8B4AE", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}
              onMouseEnter={e => e.currentTarget.style.background = "#D4922A18"}
              onMouseLeave={e => e.currentTarget.style.background = "#2A2A25"}>
              <span>{t.label}</span>
              <span style={{ fontSize: 9, color: "var(--text-sub)" }}>{t.source}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #2A2A25", margin: "8px 0" }} />
        </div>
      )}

      {/* Custom label */}
      {!block && (
        <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="Or type a custom task..."
          style={{ width: "100%", background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "6px 8px", fontSize: 12, color: "var(--text-primary)", fontFamily: "'DM Sans',sans-serif", marginBottom: 10, outline: "none" }} />
      )}

      {/* Time + duration */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <TimeSelect value={startTime} onChange={setStartTime} label="Start" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-sub)" }}>Duration</div>
          <select value={duration} onChange={e => setDuration(parseFloat(e.target.value))}
            style={{ background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "var(--text-primary)", fontFamily: "'IBM Plex Mono',monospace", outline: "none", cursor: "pointer" }}>
            {DUR_OPTIONS.map(d => <option key={d} value={d}>{d === 0.5 ? "30 min" : `${d} hr${d > 1 ? "s" : ""}`}</option>)}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-sub)", marginBottom: 6 }}>Tag</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 10 }}>
        {tags.map(t => (
          <div key={t.id} onClick={() => setSelTag(selTag === t.id ? null : t.id)}
            style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer", textAlign: "center", color: "#fff", background: t.color + "CC", border: selTag === t.id ? "2px solid #fff4" : "2px solid transparent", transition: "all .12s" }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Custom tag creator */}
      <div style={{ borderTop: "1px solid #2A2A25", paddingTop: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-sub)", marginBottom: 6 }}>Custom tag</div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
            style={{ width: 28, height: 28, border: "1px solid #2A2A25", borderRadius: 4, background: "#161613", cursor: "pointer", padding: 2 }} />
          <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddCustomTag()}
            placeholder="Tag name..."
            style={{ flex: 1, background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "var(--text-primary)", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
          <button onClick={handleAddCustomTag}
            style={{ padding: "5px 8px", background: "#D4922A18", border: "1px solid #D4922A40", borderRadius: 6, color: "#D4922A", fontSize: 12, cursor: "pointer" }}>+</button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={handleSave}
          style={{ flex: 1, padding: "7px 0", background: "#D4922A", border: "none", borderRadius: 6, fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: ".06em", color: "#080807", cursor: "pointer" }}>
          Save
        </button>
        {block && (
          <button onClick={() => { onDelete(); onClose(); }}
            style={{ padding: "7px 10px", background: "#BF5D5D18", border: "1px solid #BF5D5D40", borderRadius: 6, fontSize: 11, color: "#BF5D5D", cursor: "pointer" }}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────
const SchedulePage = ({ sb, user, challenges, kpis, toggle, regimen, regimenChecked, toggleRegimen, googleSync }) => {
  const { blocks, loadBlocks, saveBlock, deleteBlock, toggleComplete } = useTimeBlocks(sb, user, googleSync);
  const { tags, saveTag } = useUserTags(sb, user);

  const [view,      setView]      = useState("week");
  const [weekRef,   setWeekRef]   = useState(new Date());
  const [menuState, setMenuState] = useState(null);
  const [tooltip,   setTooltip]   = useState(null);

  const weekDates = getWeekDates(weekRef);
  const todayStr  = todayLocalStr();
  const todayIdx  = getTodayDowIdx();

  useEffect(() => { loadBlocks(weekRef); }, [weekRef]);

  // ── Issue 4: dynamic display range ───────────────────────
  const getDisplayRange = () => {
    const relevant = view === "week" ? blocks : blocks.filter(b => b.date === todayStr);
    if (relevant.length === 0) return { start: 7, end: 22 };
    const earliest = Math.min(...relevant.map(b => b.start_time));
    const latest   = Math.max(...relevant.map(b => b.start_time + b.duration));
    return { start: Math.max(0, Math.floor(earliest) - 1), end: Math.min(23, Math.ceil(latest) + 1) };
  };

  // ── Issue 3: unscheduled tasks for a date ────────────────
  const getUnscheduledTasks = (dateStr) => {
    const scheduled = new Set(blocks.filter(b => b.date === dateStr && b.task_key).map(b => b.task_key));
    const tasks = [];
    (challenges?.main?.kpis || []).forEach(t => {
      if (!scheduled.has(t.key)) tasks.push({ key: t.key, label: t.label, source: "Challenge", is_regimen: false });
    });
    (challenges?.secondary || []).forEach(ch =>
      (ch.kpis || []).forEach(t => {
        if (!scheduled.has(t.key)) tasks.push({ key: t.key, label: t.label, source: ch.name, is_regimen: false });
      })
    );
    const dow = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    (regimen?.days?.[dow] || []).forEach(t => {
      if (!scheduled.has(t.id)) tasks.push({ key: t.id, label: t.label, source: "Regimen", is_regimen: true });
    });
    return tasks;
  };

  const openMenu = (e, block, slotDay, slotHour) => {
    e.stopPropagation();
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = e.clientX + 10, y = e.clientY + 10;
    if (x + 240 > vw) x = e.clientX - 250;
    if (y + 460 > vh) y = e.clientY - 470;
    setMenuState({ block, slotInfo: { x, y }, slotDay, slotHour });
  };

  const handleSave = async ({ tag_id, label, start_time, duration, task_key, is_regimen }) => {
    const { block, slotDay } = menuState;
    if (block) {
      await saveBlock({ ...block, tag_id: tag_id ?? block.tag_id, start_time, duration });
    } else {
      await saveBlock({ date: slotDay, start_time, duration, label, tag_id, task_key: task_key || null, is_regimen: is_regimen || false });
    }
  };

  const handleDelete = async () => {
    if (menuState?.block) await deleteBlock(menuState.block.id);
  };

  // ── Issue 1: complete syncs to dashboard ─────────────────
  const handleBlockClick = async (e, block) => {
    e.stopPropagation();
    if (e.shiftKey) {
      await toggleComplete(block.id);
      if (block.task_key && !block.is_regimen && toggle) toggle(block.task_key);
      if (block.task_key && block.is_regimen && toggleRegimen) toggleRegimen(block.task_key);
    } else {
      openMenu(e, block, block.date, block.start_time);
    }
  };

  const getTag = (tagId) => tags.find(t => t.id === tagId) || { color: "#888", label: "None" };

  const { start: rangeStart, end: rangeEnd } = getDisplayRange();
  const displayHours = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);
  const visibleDates = view === "week" ? weekDates : [todayStr];
  const visibleDows  = view === "week" ? [0,1,2,3,4,5,6] : [todayIdx];

  return (
    <div className="page" style={{ maxWidth: "100%", padding: "28px 32px 80px" }}>
      {/* Header */}
      <div className="a0" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div className="pg-tag">Schedule</div>
          <div className="pg-title">Time Blocks</div>
          <div className="pg-sub">Click a slot to add. Shift+click a block to complete it.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {view === "week" && (
            <>
              <button onClick={() => setWeekRef(d => { const nd = new Date(d); nd.setDate(nd.getDate()-7); return nd; })}
                style={{ padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, color: "var(--text-2)", cursor: "pointer", fontSize: 13 }}>←</button>
              <button onClick={() => setWeekRef(new Date())}
                style={{ padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, color: "var(--text-2)", cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 10, letterSpacing: ".08em" }}>TODAY</button>
              <button onClick={() => setWeekRef(d => { const nd = new Date(d); nd.setDate(nd.getDate()+7); return nd; })}
                style={{ padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, color: "var(--text-2)", cursor: "pointer", fontSize: 13 }}>→</button>
            </>
          )}
          <button onClick={() => setView("week")}
            style={{ padding: "6px 14px", background: view==="week" ? "var(--accent-lo)" : "var(--bg-2)", border: `1px solid ${view==="week" ? "var(--accent)" : "var(--border-1)"}`, borderRadius: 6, color: view==="week" ? "var(--accent)" : "var(--text-2)", cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 10, letterSpacing: ".08em" }}>Week</button>
          <button onClick={() => setView("day")}
            style={{ padding: "6px 14px", background: view==="day" ? "var(--accent-lo)" : "var(--bg-2)", border: `1px solid ${view==="day" ? "var(--accent)" : "var(--border-1)"}`, borderRadius: 6, color: view==="day" ? "var(--accent)" : "var(--text-2)", cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 10, letterSpacing: ".08em" }}>Today</button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", border: "1px solid var(--border-0)", borderRadius: 10, overflow: "hidden", background: "var(--bg-1)" }}>

        {/* Time column — dynamic range */}
        <div style={{ width: 52, flexShrink: 0, borderRight: "1px solid var(--border-0)" }}>
          <div style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)" }} />
          {displayHours.map(h => (
            <div key={h} style={{ height: SLOT_H * 2, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, color: "var(--text-3)", letterSpacing: ".04em" }}>
                {h < 12 ? `${h === 0 ? "12" : h}am` : h === 12 ? "12pm" : `${h-12}pm`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div style={{ display: "flex", flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
          {visibleDates.map((dateStr, colIdx) => {
            const dowIdx    = visibleDows[colIdx];
            const isToday   = dateStr === todayStr;
            const isDimmed  = view === "week" && !isToday;
            const dayBlocks = blocks.filter(b => b.date === dateStr);

            const nowTop = (() => {
              const now = new Date();
              return ((now.getHours() + now.getMinutes() / 60) - rangeStart) * 2 * SLOT_H;
            })();

            return (
              <div key={dateStr} style={{
                flex: 1, borderRight: colIdx < visibleDates.length-1 ? "1px solid var(--border-0)" : "none",
                position: "relative", minWidth: 0,
                background: isToday ? "var(--accent-lo)" : "transparent",
                opacity: isDimmed ? 0.4 : 1,
                pointerEvents: isDimmed ? "none" : "auto",
              }}>
                {/* Day header */}
                <div style={{ height: SLOT_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${isToday ? "var(--accent-mid)" : "var(--border-0)"}`, position: "sticky", top: 0, background: "var(--bg-1)", zIndex: 2, gap: 1 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 8, letterSpacing: ".1em", color: isToday ? "var(--accent)" : "var(--text-3)", textTransform: "uppercase" }}>{DAY_NAMES[dowIdx]}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, lineHeight: 1, color: isToday ? "var(--accent)" : "var(--text-1)" }}>{new Date(dateStr + "T12:00:00").getDate()}</div>
                </div>

                {/* Slots */}
                <div style={{ position: "relative" }}>
                  {displayHours.map(h => (
                    <React.Fragment key={h}>
                      <div onClick={e => openMenu(e, null, dateStr, h)}
                        style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)18", cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)08"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"} />
                      <div onClick={e => openMenu(e, null, dateStr, h + 0.5)}
                        style={{ height: SLOT_H, borderBottom: "1px dashed var(--border-0)10", cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)08"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"} />
                    </React.Fragment>
                  ))}

                  {/* Now line — offset by rangeStart */}
                  {isToday && nowTop >= 0 && (
                    <div style={{ position: "absolute", left: 0, right: 0, top: nowTop, height: 1, background: "var(--err)", zIndex: 3, pointerEvents: "none" }}>
                      <div style={{ position: "absolute", left: -3, top: -3, width: 6, height: 6, borderRadius: "50%", background: "var(--err)" }} />
                    </div>
                  )}

                  {/* Blocks — top offset by rangeStart */}
                  {dayBlocks.map(block => {
                    const tag      = getTag(block.tag_id);
                    const topPx    = (block.start_time - rangeStart) * 2 * SLOT_H;
                    const heightPx = Math.max(block.duration * 2 * SLOT_H - 2, 22);
                    return (
                      <div key={block.id}
                        onClick={e => handleBlockClick(e, block)}
                        onMouseEnter={e => setTooltip({ text: `${fmtTime(block.start_time)} — ${fmtTime(block.start_time + block.duration)}  ·  ${tag.label}`, x: e.clientX + 12, y: e.clientY - 32 })}
                        onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX + 12, y: e.clientY - 32 } : null)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          position: "absolute", left: 2, right: 2, top: topPx, height: heightPx,
                          background: tag.color + (block.completed ? "44" : "BB"),
                          borderRadius: 5, padding: "3px 6px",
                          fontSize: 10, fontWeight: 500, color: "#fff",
                          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                          cursor: "pointer", zIndex: 1,
                          textDecoration: block.completed ? "line-through" : "none",
                          opacity: block.completed ? 0.5 : 1, transition: "filter .15s",
                        }}
                        onMouseOver={e => e.currentTarget.style.filter = "brightness(1.15)"}
                        onMouseOut={e => e.currentTarget.style.filter = "brightness(1)"}
                      >
                        {block.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        {tags.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: t.color }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 10, color: "var(--text-2)", letterSpacing: ".06em" }}>{t.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--err)" }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 10, color: "var(--text-2)", letterSpacing: ".06em" }}>Now</span>
        </div>
      </div>

      {/* Floating menu */}
      {menuState && (
        <BlockMenu
          tags={tags}
          block={menuState.block}
          slotInfo={menuState.slotInfo}
          slotHour={menuState.slotHour}
          unscheduledTasks={getUnscheduledTasks(menuState.slotDay)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setMenuState(null)}
          onAddTag={saveTag}
        />
      )}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x, top: tooltip.y,
          background: "#1E1E1A", border: "1px solid #2A2A25", borderRadius: 6,
          padding: "5px 10px", fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)",
          fontSize: 10, color: "var(--text-1)", pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap",
        }}>{tooltip.text}</div>
      )}
    </div>
  );
};

export default SchedulePage;