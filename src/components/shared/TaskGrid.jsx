import React from 'react';
import { TASK_CATEGORIES } from '../../constants/templates';

/**
 * CompletionRing - Circular progress indicator
 */
export const CompletionRing = ({ done, total, isScaled }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pctVal = total > 0 ? done / total : 0;
  const offset = circ * (1 - pctVal);
  const color = isScaled ? "#D4B22A"
    : pctVal === 1 ? "var(--ok)"
    : pctVal > 0.5 ? "var(--accent)"
    : "var(--warn)";

  return (
    <svg className="ring-svg" width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={4} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition:"stroke-dashoffset .6s cubic-bezier(.4,0,.2,1), stroke .3s" }}
      />
      <text x={36} y={40} textAnchor="middle"
        style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, fill:color, letterSpacing:".02em" }}>
        {done}/{total}
      </text>
    </svg>
  );
};

const SCALED_LABELS = {
  w1: "Move for 15 min (scaled)",
  w2: "Stretch or walk (scaled)",
  diet: "Eat intentionally (scaled)",
  water: "Drink intentionally (scaled)",
  read: "Read 1 page (scaled)",
  photo: "Note your state (scaled)",
  workout: "Move for 15 min (scaled)",
  mindset: "1 min reflection (scaled)",
  shipped: "Make progress on app (scaled)",
  deployed: "Push any commit (scaled)",
  docs: "Write one paragraph (scaled)",
  no_ai: "Limit AI use (scaled)",
  dw: "30 min focused work (scaled)",
};

/**
 * TaskGrid - Grid of task cards with completion state
 */
const TaskGrid = ({ tasks, taskState, toggle, isScaled }) => {
  const done = tasks.filter(t => taskState[t.key]).length;
  const total = tasks.length;

  const nonNegTasks = tasks.filter(t => t.nonNeg);
  const nonNegDone = nonNegTasks.filter(t => taskState[t.key]).length;
  const hasNonNegs = nonNegTasks.length > 0;
  const allNonNegDone = hasNonNegs && nonNegDone === nonNegTasks.length;
  const scaledDone = isScaled ? (hasNonNegs ? nonNegDone : done) : done;
  const scaledTotal = isScaled ? (hasNonNegs ? nonNegTasks.length : total) : total;
  const displayPct = scaledTotal > 0 ? Math.round((scaledDone / scaledTotal) * 100) : 0;
  const ringDone = isScaled ? scaledDone : done;
  const ringTotal = isScaled ? scaledTotal : total;

  const getSubMessage = () => {
    if (isScaled) {
      if (allNonNegDone && done < total) return "Non-negs locked in — keep going if you can.";
      if (allNonNegDone && done === total) return "All tasks done — scaled day complete.";
      return `${nonNegTasks.length - nonNegDone} non-neg${nonNegTasks.length - nonNegDone === 1 ? "" : "s"} remaining`;
    }
    if (done === total && total > 0) return "All tasks done — excellent.";
    return `${total - done} task${total - done === 1 ? "" : "s"} remaining`;
  };

  const catSummary = Object.entries(
    tasks.reduce((acc, t) => {
      const cat = t.cat || "other";
      if (!acc[cat]) acc[cat] = { done: 0, total: 0 };
      acc[cat].total++;
      if (taskState[t.key]) acc[cat].done++;
      return acc;
    }, {})
  );

  return (
    <div>
      {/* Ring header */}
      <div className="ring-wrap" style={isScaled ? { borderColor: "#D4B22A30", background: "#D4B22A06" } : {}}>
        <CompletionRing done={ringDone} total={ringTotal} isScaled={isScaled} />
        <div className="ring-info">
          <div className="ring-pct" style={{ color: isScaled ? (allNonNegDone ? "var(--ok)" : "#D4B22A") : done === total && total > 0 ? "var(--ok)" : done > 0 ? "var(--accent)" : "var(--text-2)" }}>
            {displayPct}%
            {isScaled && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, marginLeft: 8, color: "#D4B22A", letterSpacing: ".1em" }}>SCALED</span>}
          </div>
          <div className="ring-sub">
            {getSubMessage()}
          </div>
          <div className="ring-cats">
            {catSummary.map(([cat, s]) => {
              const info = TASK_CATEGORIES[cat] || TASK_CATEGORIES.other;
              return (
                <div key={cat} style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".1em",
                  padding: "2px 7px", borderRadius: 3,
                  border: `1px solid ${info.color}44`,
                  color: s.done === s.total ? info.color : "var(--text-2)",
                  background: s.done === s.total ? `${info.color}15` : "transparent",
                  transition: "all .2s",
                }}>
                  {info.label} {s.done}/{s.total}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task cards grid */}
      <div className="tasks-grid">
        {tasks.map(t => {
          const isDone = taskState[t.key];
          const cat = TASK_CATEGORIES[t.cat || "other"] || TASK_CATEGORIES.other;
          const cardColor = isScaled ? "#D4B22A" : cat.color;
          const label = isScaled ? (SCALED_LABELS[t.key] || t.label + " (scaled)") : t.label;

          return (
            <div
              key={t.key}
              className={`task-card ${isDone ? "done" : ""}`}
              onClick={() => toggle(t.key)}
            >
              {isDone && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 10,
                  background: `${cardColor}0C`,
                  border: `1px solid ${cardColor}30`,
                  pointerEvents: "none",
                }} />
              )}
              {isScaled && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: "#D4B22A40", borderRadius: "10px 10px 0 0",
                  pointerEvents: "none",
                }} />
              )}
              <div className="task-card-top">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-card-label" style={isScaled && !isDone ? { color: "var(--text-1)", fontSize: 12 } : {}}>
                    {label}
                  </div>
                  {t.nonNeg && (
                    <div style={{
                      fontFamily: "'IBM Plex Mono',monospace", fontSize: 7, letterSpacing: ".14em",
                      color: "var(--warn)", marginTop: 3, display: "flex", alignItems: "center", gap: 4,
                    }}>
                      ◆ NON-NEG
                    </div>
                  )}
                </div>
                <div className="task-cat-tag" style={{
                  color: cardColor,
                  borderColor: `${cardColor}44`,
                  background: `${cardColor}12`,
                  flexShrink: 0,
                }}>
                  {isScaled ? "MVT" : cat.label}
                </div>
              </div>
              <div className="task-card-bottom">
                <div className="task-done-stamp" style={{ color: cardColor }}>
                  ✓ Done
                </div>
                <div className="task-check" style={isDone ? {
                  background: cardColor, borderColor: cardColor,
                } : {}}>
                  {isDone && "✓"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskGrid;
