import React, { useState } from "react";
import { TEMPLATES } from "../../constants/templates";

const DIFF_COLOUR = {
  "Hard": "var(--err)",
  "Intense": "var(--warn)",
  "Moderate": "var(--ok)",
  "You decide": "var(--text-2)"
};

const LibraryDesktop = ({ onPick, isSecondaryMode, onClose, hasMain }) => {
  const [mode, setMode] = useState(isSecondaryMode || hasMain ? "secondary" : "main");
  const [active, setActive] = useState(null);
  const [selectedNonNegs, setSelectedNonNegs] = useState([]);
  const [editingTasks, setEditingTasks] = useState(false);

  const selected = TEMPLATES.find(t => t.id === active);
  const isSecMode = mode === "secondary" || isSecondaryMode;

  const handleSelectTemplate = (id) => {
    if (active !== id) setSelectedNonNegs([]);
    setActive(prev => prev === id ? null : id);
  };

  const toggleNonNeg = (key) => {
    setSelectedNonNegs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className={isSecondaryMode ? "" : "page"} style={isSecondaryMode ? { padding: "28px" } : { maxWidth: "100%" }}>
      {!isSecondaryMode && (
        <div className="a0">
          <div className="pg-tag">Challenge Library</div>
          <div className="pg-title">Start a Challenge</div>
          <div className="pg-sub">Pre-built programs. Or define your own rules.</div>
        </div>
      )}
      {isSecondaryMode && (
        <div style={{ marginBottom: 20 }}>
          <div className="modal-tag">Add Secondary Challenge</div>
          <div className="modal-title" style={{ fontSize: 28 }}>Pick Your Next Front</div>
          <div className="modal-desc" style={{ marginBottom: 0 }}>Choose a template to run alongside your main challenge.</div>
        </div>
      )}

      {!isSecondaryMode && (
        <div className="lib-mode-row" style={{ marginTop: 24 }}>
          <button
            className={`lib-mode-btn ${mode === "main" ? "on" : ""}`}
            onClick={() => !hasMain && setMode("main")}
            style={{ opacity: hasMain ? .35 : 1, cursor: hasMain ? "not-allowed" : "pointer", position: "relative" }}
            title={hasMain ? "You already have an active main challenge. Complete or abandon it first." : ""}
          >
            Set as Main {hasMain && <span style={{ fontSize: 8, letterSpacing: ".08em", marginLeft: 4, color: "var(--warn)" }}>LOCKED</span>}
          </button>
          <button className={`lib-mode-btn ${mode === "secondary" ? "on" : ""}`} onClick={() => setMode("secondary")}>Add as Secondary</button>
        </div>
      )}
      {!isSecondaryMode && hasMain && mode === "main" && (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 9, letterSpacing: ".1em", color: "var(--warn)", marginTop: 10 }}>
          ⚠ You have an active main challenge. Abandon it first to start a new one.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isSecondaryMode ? "1fr" : "380px 1fr", gap: 24, marginTop: isSecondaryMode ? 0 : 20, alignItems: "stretch" }}>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {TEMPLATES.map((t, i) => {
            const isCustom = t.id === "custom";
            return (
              <div key={t.id}
                className={`tpl a${Math.min(i + 1, 5)} ${active === t.id ? "active" : ""}`}
                style={isCustom ? {
                  background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)",
                  borderStyle: "dashed",
                  borderColor: active === t.id ? "var(--accent)" : "var(--border-1)",
                } : undefined}
                onClick={() => isSecondaryMode ? onPick(t) : handleSelectTemplate(t.id)}>

                {!isSecondaryMode && (
                  <div className="tpl-tooltip">
                    <div className="tpl-tooltip-diff" style={{ color: DIFF_COLOUR[t.difficulty] || "var(--accent)" }}>
                      {t.difficulty} · {t.duration} days
                    </div>
                    <div className="tpl-tooltip-text">{t.blurb}</div>
                  </div>
                )}

                <div className="tpl-tag">{t.tag} · {isCustom ? "∞" : t.duration}D</div>
                <div className="tpl-name" style={isCustom ? { display: "flex", alignItems: "center", gap: 8 } : undefined}>
                  {isCustom && <span style={{ fontSize: 16 }}>+</span>}
                  {t.name}
                </div>
                <div className="tpl-desc">{t.kpis.length > 0 ? `${t.kpis.length} daily tasks` : "Define your own tasks"}</div>
                {isSecondaryMode ? (
                  <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 9.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                    {t.blurb}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", color: active === t.id ? "var(--text-0)" : "var(--accent)", opacity: .9, display: "flex", alignItems: "center", gap: 6 }}>
                    {active === t.id ? "↑ Close" : isCustom ? "→ Create yours" : "→ Learn more"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right detail column */}
        <div style={{ display: isSecondaryMode ? "none" : "flex", flexDirection: "column" }}>
          {!selected ? (
            <div style={{
              height: "100%", minHeight: 520, flex: 1,
              border: "1px dashed var(--border-1)", borderRadius: 12,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <div style={{ fontSize: 28, color: "var(--text-3)", opacity: .4 }}>◆</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--text-3)", opacity: .5 }}>
                Select a challenge to preview
              </div>
            </div>
          ) : (
            <div className="lib-detail">
              <div className="lib-detail-tag">{selected.tag} · {selected.duration} days</div>
              <div className="lib-detail-name">{selected.name}</div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, padding: "4px 10px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: DIFF_COLOUR[selected.difficulty] || "var(--accent)", flexShrink: 0 }} />
                <span style={{ color: DIFF_COLOUR[selected.difficulty] || "var(--accent)" }}>{selected.difficulty}</span>
              </div>

              <div className="lib-detail-about">{selected.about}</div>

              <div className="lib-detail-section">Benefits</div>
              {selected.benefits.map((b, i) => (
                <div key={i} className="lib-detail-benefit">
                  <span style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}>◆</span>
                  <span>{b}</span>
                </div>
              ))}

              <div className="lib-detail-section">Best For</div>
              <div className="lib-detail-best">{selected.bestFor}</div>

              {selected.kpis.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
                    <div className="lib-detail-section" style={{ margin: 0 }}>Daily Tasks</div>
                    <button
                      className="btn btn-g"
                      style={{ fontSize: 10, padding: "5px 12px", letterSpacing: ".08em" }}
                      onClick={() => setEditingTasks(!editingTasks)}
                    >
                      {editingTasks ? "Done" : "Edit Tasks"}
                    </button>
                  </div>

                  {!editingTasks && selectedNonNegs.length > 0 && (
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 12, color: "var(--warn)", marginTop: 8, marginBottom: 4 }}>
                      ◆ {selectedNonNegs.length} non-negotiable{selectedNonNegs.length > 1 ? "s" : ""} selected
                    </div>
                  )}
                  {editingTasks && (
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 12, color: "var(--text-2)", marginTop: 8, marginBottom: 8 }}>
                      Click tasks to mark as non-negotiable. Missing a non-neg = 0% day.
                    </div>
                  )}

                  {selected.kpis.map(k => {
                    const isNonNeg = selectedNonNegs.includes(k.key);
                    return (
                      <div
                        key={k.key}
                        onClick={() => editingTasks && toggleNonNeg(k.key)}
                        style={{
                          fontSize: 15,
                          color: isNonNeg ? "var(--warn)" : "var(--text-1)",
                          padding: "10px 12px",
                          marginTop: 4,
                          borderRadius: 8,
                          background: isNonNeg ? "var(--warn)10" : "var(--bg-2)",
                          border: `1px solid ${isNonNeg ? "var(--warn)40" : "var(--border-0)"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: editingTasks ? "pointer" : "default",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ color: isNonNeg ? "var(--warn)" : "var(--accent)", fontSize: 10 }}>
                          {isNonNeg ? "◆" : "●"}
                        </span>
                        <span style={{ flex: 1 }}>{k.label}</span>
                        {isNonNeg && (
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 8, letterSpacing: ".1em", color: "var(--warn)" }}>
                            NON-NEG
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              <button className="btn btn-a w100"
                style={{ justifyContent: "center", marginTop: 22, fontSize: 15, padding: "12px 0" }}
                onClick={() => { onPick(selected, isSecMode, selectedNonNegs); setActive(null); setSelectedNonNegs([]); }}>
                {isSecMode ? `+ Start as Secondary` : `→ Start Challenge`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryDesktop;