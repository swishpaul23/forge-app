import React, { useState, useEffect } from 'react';

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Forge.",
    body: "Quick tour — 5 steps. Takes 20 seconds.",
    position: "center",
  },
  {
    id: "dashboard",
    target: "tut-home",
    title: "Your Dashboard",
    body: "Check in your daily tasks here. Do this every day to build your streak.",
    position: "right",
  },
  {
    id: "wall",
    target: "tut-wall",
    title: "The Wall",
    body: "Every day you check in, a block gets forged. Watch your consistency stack up.",
    position: "right",
  },
  {
    id: "partners",
    target: "tut-partners",
    title: "Partners",
    body: "Add someone grinding alongside you. Message them, nudge them, stay accountable.",
    position: "right",
  },
  {
    id: "deepwork",
    target: "tut-deepwork",
    title: "Deep Work",
    body: "Focus mode with a timer and your tasks. Use it when you need to lock in.",
    position: "bottom",
  },
];

/**
 * Tutorial - Interactive onboarding tutorial overlay
 */
const Tutorial = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (!current.target) { setTargetRect(null); return; }
    const el = document.getElementById(current.target);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step, current.target]);

  const next = () => { if (isLast) onDone(); else setStep(s => s + 1); };

  const PAD = 12;
  const spotStyle = targetRect ? {
    position: "fixed",
    top: targetRect.top - PAD,
    left: targetRect.left - PAD,
    width: targetRect.width + PAD * 2,
    height: targetRect.height + PAD * 2,
    borderRadius: 10,
    boxShadow: "0 0 0 9999px rgba(0,0,0,.78)",
    zIndex: 9998,
    pointerEvents: "none",
    border: "2px solid var(--accent)",
    transition: "all .25s cubic-bezier(.4,0,.2,1)",
  } : null;

  const tooltipStyle = () => {
    const base = {
      position: "fixed", zIndex: 9999,
      background: "var(--bg-2)",
      border: "1px solid var(--border-accent)",
      borderRadius: 12,
      padding: "20.7px 23px",
      width: 276,
      boxShadow: "0 12px 40px rgba(0,0,0,.6)",
    };
    if (!targetRect || current.position === "center") {
      return { ...base, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 322 };
    }
    const W = window.innerWidth;
    if (current.position === "right") {
      const idealLeft = targetRect.left + targetRect.width + PAD + 16;
      const fitsRight = idealLeft + base.width + 16 <= W;
      const left = fitsRight ? idealLeft : targetRect.left - base.width - PAD - 16;
      return { ...base, top: targetRect.top - PAD, left: Math.max(8, left) };
    }
    if (current.position === "bottom") {
      const idealLeft = targetRect.left - PAD;
      const left = Math.min(idealLeft, W - 322 - 16);
      return { ...base, top: targetRect.top + targetRect.height + PAD + 16, left: Math.max(8, left), width: 322 };
    }
    return base;
  };

  return (
    <>
      {!targetRect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", zIndex: 9998 }} onClick={next} />
      )}
      {spotStyle && <div style={spotStyle} />}
      <div style={tooltipStyle()}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.2, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 25.3, letterSpacing: ".04em", lineHeight: 1, marginBottom: 8 }}>
          {current.title}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.65, color: "var(--text-1)", lineHeight: 1.6, marginBottom: 16 }}>
          {current.body}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={next}
            style={{ background: "var(--accent)", border: "none", borderRadius: 7, padding: "8px 18px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#080807", cursor: "pointer" }}>
            {isLast ? "Got it →" : "Next →"}
          </button>
          <button
            onClick={onDone}
            style={{ background: "none", border: "none", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-2)", cursor: "pointer" }}>
            Skip
          </button>
        </div>
      </div>
    </>
  );
};

export default Tutorial;
