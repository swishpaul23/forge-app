import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTimeBlocks, toLocalDateStr, getWeekDates } from "../../hooks/useTimeBlocks";
import { useUserTags, SYSTEM_TAGS } from "../../hooks/useUserTags";

// ── Constants ─────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_H = 32; // px per 30min slot
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fmtTime = (h) => {
  const hh = Math.floor(h), mm = h % 1 === 0.5 ? "30" : "00";
  const ap = hh < 12 ? "am" : "pm";
  const disp = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${disp}:${mm}${ap}`;
};

const todayLocalStr = () => toLocalDateStr(new Date());

const getTodayDowIdx = () => {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;   // Mon=0 … Sun=6
};

// ── Tag floating menu ─────────────────────────────────────────
const TagMenu = ({ tags, block, slotInfo, onSave, onDelete, onClose, onAddTag }) => {
  const [selTag, setSelTag] = useState(block?.tag_id || null);
  const [label, setLabel] = useState(block?.label || "");
  const [customColor, setCustomColor] = useState("#8B5CF6");
  const [customLabel, setCustomLabel] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSave = () => {
    if (!block && !label.trim()) return;
    onSave({ tag_id: selTag, label: block ? undefined : label });
    onClose();
  };

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    onAddTag({ id: `custom_${Date.now()}`, label: customLabel.trim(), color: customColor, is_system: false });
    setCustomLabel("");
  };

  return (
    <div ref={ref} style={{
      position: "fixed", background: "#1C1C18", border: "1px solid #2A2A25",
      borderRadius: 10, padding: 12, zIndex: 9999, minWidth: 200,
      boxShadow: "0 8px 32px rgba(0,0,0,.6)",
      left: slotInfo.x, top: slotInfo.y,
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "#5A5751", marginBottom: 8 }}>
        {block ? "Edit block" : "New block"}
      </div>

      {/* Label input for new blocks */}
      {!block && (
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="Task name..."
          style={{ width: "100%", background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "6px 8px", fontSize: 12, color: "#EDEAE3", fontFamily: "'DM Sans',sans-serif", marginBottom: 10, outline: "none" }}
        />
      )}

      {/* Tag grid */}
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#5A5751", marginBottom: 6 }}>Tag</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 10 }}>
        {tags.map(t => (
          <div key={t.id}
            onClick={() => setSelTag(selTag === t.id ? null : t.id)}
            style={{
              padding: "5px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
              cursor: "pointer", textAlign: "center", color: "#fff",
              background: t.color + "CC",
              border: selTag === t.id ? "2px solid #fff4" : "2px solid transparent",
              transition: "all .12s",
            }}
          >{t.label}</div>
        ))}
      </div>

      {/* Custom tag creator */}
      <div style={{ borderTop: "1px solid #2A2A25", paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#5A5751", marginBottom: 6 }}>Custom tag</div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
            style={{ width: 28, height: 28, border: "1px solid #2A2A25", borderRadius: 4, background: "#161613", cursor: "pointer", padding: 2 }} />
          <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddCustom()}
            placeholder="Tag name..."
            style={{ flex: 1, background: "#111110", border: "1px solid #2A2A25", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#EDEAE3", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
          <button onClick={handleAddCustom}
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

// ── Main component ────────────────────────────────────────────
const SchedulePage = ({ sb, user, challenges, kpis, toggle, regimen, regimenChecked, toggleRegimen }) => {
  const { blocks, loading, loadBlocks, saveBlock, deleteBlock, toggleComplete } = useTimeBlocks(sb, user);
  const { tags, saveTag, deleteTag } = useUserTags(sb, user);

  const [view, setView] = useState("week");
  const [weekRef, setWeekRef] = useState(new Date());
  const [menuState, setMenuState] = useState(null); // { block, slotInfo, slotDay, slotHour }
  const [tooltip, setTooltip] = useState(null);     // { text, x, y }

  const weekDates = getWeekDates(weekRef);
  const todayStr  = todayLocalStr();
  const todayIdx  = getTodayDowIdx();

  useEffect(() => { loadBlocks(weekRef); }, [weekRef]);

  const openMenu = (e, block, slotDay, slotHour) => {
    e.stopPropagation();
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = e.clientX + 10, y = e.clientY + 10;
    if (x + 220 > vw) x = e.clientX - 230;
    if (y + 340 > vh) y = e.clientY - 350;
    setMenuState({ block, slotInfo: { x, y }, slotDay, slotHour });
  };

  const handleSave = async ({ tag_id, label }) => {
    const { block, slotDay, slotHour } = menuState;
    if (block) {
      await saveBlock({ ...block, tag_id: tag_id ?? block.tag_id });
    } else {
      await saveBlock({
        date: slotDay,
        start_time: slotHour,
        duration: 1,
        label,
        tag_id,
      });
    }
  };

  const handleDelete = async () => {
    if (menuState?.block) await deleteBlock(menuState.block.id);
  };

  const handleBlockClick = async (e, block) => {
    e.stopPropagation();
    if (e.shiftKey) {
      // Shift+click = toggle complete, sync with challenge/regimen
      const newVal = await toggleComplete(block.id);
      if (block.task_key && toggle) toggle(block.task_key);
      if (block.is_regimen && block.task_key && toggleRegimen) toggleRegimen(block.task_key);
    } else {
      openMenu(e, block, block.date, block.start_time);
    }
  };

  const getTag = (tagId) => tags.find(t => t.id === tagId) || { color: "#555", label: "None" };

  const visibleDates = view === "week" ? weekDates : [todayStr];
  const visibleDows  = view === "week" ? [0,1,2,3,4,5,6] : [todayIdx];

  return (
    <div className="page" style={{ maxWidth: "100%", padding: "28px 32px 80px" }}>
      {/* Header */}
      <div className="a0" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div className="pg-tag">Schedule</div>
          <div className="pg-title">Time Blocks</div>
          <div className="pg-sub">Plan your day. Tap shift+click a block to complete it.</div>
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

        {/* Time column */}
        <div style={{ width: 52, flexShrink: 0, borderRight: "1px solid var(--border-0)" }}>
          <div style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)" }} />
          {HOURS.map(h => (
            <div key={h} style={{ height: SLOT_H * 2, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, color: "var(--text-3)", letterSpacing: ".04em" }}>
                {h === 0 ? "" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`}
              </span>
            </div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "flex", flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
          {visibleDates.map((dateStr, colIdx) => {
            const dowIdx  = visibleDows[colIdx];
            const isToday = dateStr === todayStr;
            const isDimmed = view === "week" && !isToday;
            const dayBlocks = blocks.filter(b => b.date === dateStr);

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
                  {HOURS.map(h => (
                    <React.Fragment key={h}>
                      {/* Full hour slot */}
                      <div onClick={e => openMenu(e, null, dateStr, h)}
                        style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)18", cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)08"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      />
                      {/* Half hour slot */}
                      <div onClick={e => openMenu(e, null, dateStr, h + 0.5)}
                        style={{ height: SLOT_H, borderBottom: "1px dashed var(--border-0)10", cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent)08"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      />
                    </React.Fragment>
                  ))}

                  {/* Now line */}
                  {isToday && (() => {
                    const now = new Date();
                    const mins = now.getHours() * 60 + now.getMinutes();
                    const top = (mins / 30) * SLOT_H;
                    return (
                      <div style={{ position: "absolute", left: 0, right: 0, top, height: 1, background: "var(--err)", zIndex: 3, pointerEvents: "none" }}>
                        <div style={{ position: "absolute", left: -3, top: -3, width: 6, height: 6, borderRadius: "50%", background: "var(--err)" }} />
                      </div>
                    );
                  })()}

                  {/* Task blocks */}
                  {dayBlocks.map(block => {
                    const tag = getTag(block.tag_id);
                    const topPx = block.start_time * 2 * SLOT_H;
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
                          opacity: block.completed ? 0.5 : 1,
                          transition: "filter .15s",
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
        <TagMenu
          tags={tags}
          block={menuState.block}
          slotInfo={menuState.slotInfo}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setMenuState(null)}
          onAddTag={saveTag}
        />
      )}

      {/* Hover tooltip */}
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
