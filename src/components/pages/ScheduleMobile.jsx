import React, { useState, useEffect } from "react";
import { useTimeBlocks, toLocalDateStr } from "../../hooks/useTimeBlocks";
import { useUserTags } from "../../hooks/useUserTags";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_H = 36;

const fmtTime = (h) => {
  const hh = Math.floor(h), mm = h % 1 === 0.5 ? "30" : "00";
  const ap = hh < 12 ? "am" : "pm";
  const disp = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${disp}:${mm}${ap}`;
};

const ScheduleMobile = ({ sb, user, toggle, toggleRegimen }) => {
  const { blocks, loadBlocks, saveBlock, deleteBlock, toggleComplete } = useTimeBlocks(sb, user);
  const { tags, saveTag } = useUserTags(sb, user);

  const [menuState, setMenuState] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [selTag, setSelTag] = useState(null);
  const [customColor, setCustomColor] = useState("#8B5CF6");
  const [customLabel, setCustomLabel] = useState("");

  const todayStr = toLocalDateStr();
  const todayBlocks = blocks.filter(b => b.date === todayStr);

  useEffect(() => { loadBlocks(); }, []);

  const getTag = (tagId) => tags.find(t => t.id === tagId) || { color: "#555", label: "" };

  const handleBlockTap = async (block) => {
    const newVal = await toggleComplete(block.id);
    if (block.task_key && toggle) toggle(block.task_key);
    if (block.is_regimen && block.task_key && toggleRegimen) toggleRegimen(block.task_key);
  };

  const handleSave = async () => {
    if (menuState?.block) {
      await saveBlock({ ...menuState.block, tag_id: selTag ?? menuState.block.tag_id });
    } else {
      if (!newLabel.trim()) { setMenuState(null); return; }
      await saveBlock({ date: todayStr, start_time: menuState.hour, duration: 1, label: newLabel.trim(), tag_id: selTag });
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
    setSelTag(null);
    setNewLabel("");
    setMenuState({ block: null, hour });
  };

  const openBlockMenu = (block) => {
    setSelTag(block.tag_id);
    setMenuState({ block, hour: block.start_time });
  };

  return (
    <div style={{ padding: "16px 0 80px" }}>
      {/* Header */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".2em", color: "var(--text-2)", marginBottom: 4 }}>Schedule</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "var(--text-0)", lineHeight: 1 }}>Today</div>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", marginLeft: 16 }}>
        {/* Time column */}
        <div style={{ width: 44, flexShrink: 0 }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: SLOT_H * 2, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, color: "var(--text-3)", letterSpacing: ".04em" }}>
                {h === 0 ? "" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`}
              </span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div style={{ flex: 1, borderLeft: "1px solid var(--border-0)", position: "relative", marginRight: 16 }}>
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div onClick={() => openSlotMenu(h)}
                style={{ height: SLOT_H, borderBottom: "1px solid var(--border-0)18", cursor: "pointer" }} />
              <div onClick={() => openSlotMenu(h + 0.5)}
                style={{ height: SLOT_H, borderBottom: "1px dashed var(--border-0)10", cursor: "pointer" }} />
            </React.Fragment>
          ))}

          {/* Now line */}
          {(() => {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            const top = (mins / 30) * SLOT_H;
            return (
              <div style={{ position: "absolute", left: 0, right: 0, top, height: 1, background: "var(--err)", zIndex: 3, pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: -3, top: -3, width: 6, height: 6, borderRadius: "50%", background: "var(--err)" }} />
              </div>
            );
          })()}

          {/* Blocks */}
          {todayBlocks.map(block => {
            const tag = getTag(block.tag_id);
            return (
              <div key={block.id}
                onClick={() => handleBlockTap(block)}
                onLongPress={() => openBlockMenu(block)}
                style={{
                  position: "absolute", left: 2, right: 2,
                  top: block.start_time * 2 * SLOT_H,
                  height: Math.max(block.duration * 2 * SLOT_H - 2, 26),
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

      {/* Bottom drawer menu */}
      {menuState && (
        <>
          <div onClick={() => setMenuState(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--bg-1)", borderRadius: "20px 20px 0 0",
            padding: "16px 20px 32px", zIndex: 101,
          }}>
            <div style={{ width: 36, height: 4, background: "var(--bg-3)", borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 10 }}>
              {menuState.block ? `Edit · ${fmtTime(menuState.hour)}` : `New block · ${fmtTime(menuState.hour)}`}
            </div>

            {!menuState.block && (
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="Task name..."
                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "var(--text-0)", fontFamily: "'DM Sans',sans-serif", marginBottom: 14, outline: "none" }} />
            )}

            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: "var(--mono-weight)", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 8 }}>Tag</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {tags.map(t => (
                <div key={t.id} onClick={() => setSelTag(selTag === t.id ? null : t.id)}
                  style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", textAlign: "center", color: "#fff",
                    background: t.color + "CC",
                    border: selTag === t.id ? "2px solid #fff4" : "2px solid transparent",
                  }}>{t.label}</div>
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

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave}
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
