import { useState } from "react";
import { TEMPLATES, type Template } from "../../constants/templates";

type LibraryMode = "main" | "secondary";
type OnPick = (template: Template, isSecondary: boolean, nonNegs?: string[]) => void;

const DIFF_COLOUR: Record<string, string> = {
  "Hard": "var(--err)",
  "Intense": "var(--warn)",
  "Moderate": "var(--ok)",
  "You decide": "var(--text-2)"
};

// ── Bottom Drawer ─────────────────────────────────────────────
type DetailDrawerProps = {
  template: Template | null;
  mode: LibraryMode;
  isOpen: boolean;
  onClose: () => void;
  onPick: OnPick;
};
const DetailDrawer = ({ template, mode, isOpen, onClose, onPick }: DetailDrawerProps) => {
  const [selectedNonNegs, setSelectedNonNegs] = useState<string[]>([]);
  const [editingTasks, setEditingTasks] = useState(false);

  const toggleNonNeg = (key: string) => {
    setSelectedNonNegs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handlePick = () => {
    // template is guaranteed non-null here: the early return below bails
    // out before this can be invoked from JSX when template is null.
    onPick(template!, mode === "secondary", selectedNonNegs);
    onClose();
  };

  // Reset state when drawer closes
  const handleClose = () => {
    setSelectedNonNegs([]);
    setEditingTasks(false);
    onClose();
  };

  if (!isOpen || !template) return null;

  const isCustom = template.id === "custom";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-1)",
        borderRadius: "20px 20px 0 0",
        maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        zIndex: 101,
      }}>
        {/* Handle */}
        <div style={{ padding: "12px 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: "var(--bg-3)", borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: "0 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
              {template.tag} · {isCustom ? "∞" : template.duration} days
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: ".04em", lineHeight: 1, color: "var(--text-0)" }}>
              {template.name}
            </div>
            {/* Difficulty badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, padding: "4px 10px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: DIFF_COLOUR[template.difficulty] || "var(--accent)", flexShrink: 0 }} />
              <span style={{ color: DIFF_COLOUR[template.difficulty] || "var(--accent)" }}>{template.difficulty}</span>
            </div>
          </div>
          <div
            onClick={handleClose}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-1)", borderRadius: 8, cursor: "pointer", color: "var(--text-2)", flexShrink: 0 }}
          >×</div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>

          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-1)", lineHeight: 1.6, marginBottom: 20 }}>
            {template.about}
          </p>

          {/* Benefits */}
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 10 }}>
            Benefits
          </div>
          {template.benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: "var(--accent)", fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-1)", lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}

          {/* Best For */}
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-2)", marginTop: 16, marginBottom: 8 }}>
            Best For
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-1)", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>
            {template.bestFor}
          </p>

          {/* Daily Tasks */}
          {template.kpis.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-2)" }}>
                  Daily Tasks
                </div>
                <button
                  onClick={() => setEditingTasks(p => !p)}
                  style={{ padding: "5px 12px", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 6, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--text-2)", cursor: "pointer" }}
                >
                  {editingTasks ? "Done" : "Edit Tasks"}
                </button>
              </div>

              {editingTasks && (
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 11, color: "var(--text-2)", marginBottom: 10 }}>
                  Tap to mark as non-negotiable. Missing a non-neg = 0% day.
                </div>
              )}
              {!editingTasks && selectedNonNegs.length > 0 && (
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 11, color: "var(--warn)", marginBottom: 10 }}>
                  ◆ {selectedNonNegs.length} non-negotiable{selectedNonNegs.length > 1 ? "s" : ""} selected
                </div>
              )}

              {template.kpis.map(k => {
                const isNonNeg = selectedNonNegs.includes(k.key);
                return (
                  <div
                    key={k.key}
                    onClick={() => editingTasks && toggleNonNeg(k.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", marginBottom: 6, borderRadius: 8,
                      background: isNonNeg ? "var(--warn)10" : "var(--bg-2)",
                      border: `1px solid ${isNonNeg ? "var(--warn)40" : "var(--border-0)"}`,
                      cursor: editingTasks ? "pointer" : "default",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ color: isNonNeg ? "var(--warn)" : "var(--accent)", fontSize: 10, flexShrink: 0 }}>
                      {isNonNeg ? "◆" : "●"}
                    </span>
                    <span style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: isNonNeg ? "var(--warn)" : "var(--text-1)" }}>
                      {k.label}
                    </span>
                    {isNonNeg && (
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".1em", color: "var(--warn)" }}>
                        NON-NEG
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Custom challenge — no tasks to show */}
          {isCustom && (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-2)", fontStyle: "italic", marginBottom: 20 }}>
              You'll define your own tasks in the next step.
            </p>
          )}

          {/* Spacer so CTA isn't clipped */}
          <div style={{ height: 16 }} />
        </div>

        {/* CTA — sticky at bottom */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-0)", flexShrink: 0 }}>
          <button
            onClick={handlePick}
            style={{
              width: "100%", padding: "14px 0",
              background: "var(--accent)", border: "none", borderRadius: 10,
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: ".08em",
              color: "#080807", cursor: "pointer",
            }}
          >
            {mode === "secondary" ? "+ Start as Secondary" : "→ Start Challenge"}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Main Component ────────────────────────────────────────────
type LibraryMobileProps = { onPick: OnPick; hasMain: boolean };
const LibraryMobile = ({ onPick, hasMain }: LibraryMobileProps) => {
  const [mode, setMode] = useState<LibraryMode>(hasMain ? "secondary" : "main");
  const [drawerTemplate, setDrawerTemplate] = useState<Template | null>(null);

  const handleCardTap = (t: Template) => {
    if (t.id === "custom") {
      // Custom goes straight to wizard — no detail to show
      onPick(t, mode === "secondary", []);
      return;
    }
    setDrawerTemplate(t);
  };

  return (
    <div style={{ padding: "20px 16px", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: 4 }}>
          Challenge Library
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, letterSpacing: ".02em", lineHeight: 0.95, color: "var(--text-0)" }}>
          Start a Challenge
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-1)", marginTop: 8 }}>
          Pre-built programs. Or define your own rules.
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => !hasMain && setMode("main")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border-1)",
            fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
            background: mode === "main" ? "var(--accent)" : "var(--bg-2)",
            color: mode === "main" ? "#080807" : "var(--text-2)",
            cursor: hasMain ? "not-allowed" : "pointer",
            opacity: hasMain ? 0.4 : 1,
          }}
        >
          Set as Main {hasMain && "🔒"}
        </button>
        <button
          onClick={() => setMode("secondary")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border-1)",
            fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
            background: mode === "secondary" ? "var(--accent)" : "var(--bg-2)",
            color: mode === "secondary" ? "#080807" : "var(--text-2)",
            cursor: "pointer",
          }}
        >
          Add as Secondary
        </button>
      </div>

      {hasMain && mode === "main" && (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, color: "var(--warn)", marginBottom: 16, letterSpacing: ".06em" }}>
          ⚠ Abandon your main challenge first to start a new one.
        </div>
      )}

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {TEMPLATES.map((t) => {
          const isCustom = t.id === "custom";
          return (
            <div
              key={t.id}
              onClick={() => handleCardTap(t)}
              style={{
                background: isCustom
                  ? "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)"
                  : "var(--bg-1)",
                border: `1px solid ${isCustom ? "var(--border-1)" : "var(--border-0)"}`,
                borderStyle: isCustom ? "dashed" : "solid",
                borderRadius: 10,
                padding: "14px 12px",
                cursor: "pointer",
                minHeight: 110,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
                  {t.tag} · {isCustom ? "∞" : t.duration}D
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: ".04em", lineHeight: 1, color: "var(--text-0)", marginBottom: 4 }}>
                  {isCustom && <span style={{ fontSize: 14, marginRight: 4 }}>+</span>}
                  {t.name}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--text-2)" }}>
                  {t.kpis.length > 0 ? `${t.kpis.length} daily tasks` : "Define your own tasks"}
                </div>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 'var(--mono-weight)', fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginTop: 10 }}>
                {isCustom ? "→ Create yours" : "→ Learn more"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail drawer */}
      <DetailDrawer
        template={drawerTemplate}
        mode={mode}
        isOpen={!!drawerTemplate}
        onClose={() => setDrawerTemplate(null)}
        onPick={onPick}
      />
    </div>
  );
};

export default LibraryMobile;