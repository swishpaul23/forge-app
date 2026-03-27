import React, { useState, useEffect, useRef } from 'react';
import TaskGrid from './TaskGrid';

const TIMER_PRESETS = [
  { label: "Pomodoro", work: 25, brk: 5 },
  { label: "Long Focus", work: 50, brk: 10 },
  { label: "Sprint", work: 15, brk: 3 },
  { label: "Custom", work: 25, brk: 5 },
];

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * DeepWork - Focus timer with Pomodoro-style work/break cycles
 */
const DeepWork = ({ challenge, kpis, toggle, onExit, sb, user, onSessionSaved }) => {
  const safeKpis = (challenge && challenge.kpis) ? challenge.kpis : [];
  const doneTasks = safeKpis.filter(k => kpis && kpis[k.key]).length;

  const [preset, setPreset] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [customBrk, setCustomBrk] = useState(5);
  const [phase, setPhase] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [pausedPhase, setPausedPhase] = useState(null);
  const [cycle, setCycle] = useState(0);
  const [totalFocused, setTotalFocused] = useState(0);
  const [sessionTasks, setSessionTasks] = useState(doneTasks);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const timerRef = useRef(null);

  const workSecs = () => preset === 3 ? customWork * 60 : TIMER_PRESETS[preset].work * 60;
  const brkSecs = () => preset === 3 ? customBrk * 60 : TIMER_PRESETS[preset].brk * 60;

  const saveSession = async (duration, cycles, tasks) => {
    if (!sb || !user || sessionSaved) return;
    if (duration < 30) return "min_time";
    try {
      await sb.from("focus_sessions").insert({
        user_id: user.id,
        challenge_id: challenge?.id || null,
        duration_seconds: duration,
        cycles: cycles,
        tasks_completed: tasks,
      });
      setSessionSaved(true);
      if (onSessionSaved) onSessionSaved();
      return "saved";
    } catch (e) {
      console.warn("save session:", e);
      return "error";
    }
  };

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
      resume.then(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.8);
        } catch (e) {}
      }).catch(() => {});
    } catch (e) {}
  };

  const startWork = () => {
    setPhase("work");
    setTimeLeft(workSecs());
  };

  const startBreak = () => {
    setPhase("break");
    setTimeLeft(brkSecs());
    playBeep();
  };

  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setPausedPhase(phase);
    setPhase("paused");
  };

  const resumeTimer = () => {
    setPhase(pausedPhase);
    setPausedPhase(null);
  };

  const endSession = async () => {
    clearInterval(timerRef.current);
    const finalFocused = totalFocused + (phase === "work" ? workSecs() - timeLeft : 0);
    const result = await saveSession(finalFocused, cycle, sessionTasks);
    setSaveStatus(result || null);
    setPhase("idle");
    setShowSummary(true);
  };

  useEffect(() => {
    if (phase !== "work" && phase !== "break") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (phase === "work") {
            setTotalFocused(f => f + workSecs());
            setCycle(c => c + 1);
            startBreak();
          } else {
            startWork();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    setSessionTasks(safeKpis.filter(k => kpis[k.key]).length);
  }, [kpis, safeKpis]);

  const progress = phase === "work"
    ? ((workSecs() - timeLeft) / workSecs()) * 100
    : phase === "break"
    ? ((brkSecs() - timeLeft) / brkSecs()) * 100
    : 0;

  const circumference = 2 * Math.PI * 80;

  if (showSummary) return (
    <div className="dw">
      <div style={{ maxWidth: 480, width: "100%", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".3em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>Session Complete</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, letterSpacing: ".04em", lineHeight: 1, marginBottom: 32 }}>Good Work.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { n: fmt(totalFocused + (phase === "work" ? workSecs() - timeLeft : 0)), l: "Time Focused" },
            { n: cycle, l: "Cycles Done" },
            { n: safeKpis.length > 0 ? `${sessionTasks}/${safeKpis.length}` : "—", l: "Tasks Done" },
          ].map(s => (
            <div key={s.l} style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 10, padding: "16px 12px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "var(--accent)", lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-2)", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {saveStatus === "min_time" && (
          <div style={{ background: "var(--warn)15", border: "1px solid var(--warn)40", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--warn)", letterSpacing: ".06em" }}>
              ⚠ Session not logged — focus for 30 seconds or more to save.
            </div>
          </div>
        )}
        {saveStatus === "saved" && (
          <div style={{ background: "var(--ok)15", border: "1px solid var(--ok)40", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--ok)", letterSpacing: ".06em" }}>
              ✓ Session logged to your focus history.
            </div>
          </div>
        )}
        {saveStatus === "error" && (
          <div style={{ background: "var(--err)15", border: "1px solid var(--err)40", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--err)", letterSpacing: ".06em" }}>
              ✕ Failed to save session. Check your connection.
            </div>
          </div>
        )}

        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--text-2)", letterSpacing: ".1em", marginBottom: 24 }}>
          {sessionTasks === safeKpis.length && safeKpis.length > 0
            ? "✓ All tasks completed. That's a perfect session."
            : sessionTasks > 0
            ? `${safeKpis.length - sessionTasks} task${safeKpis.length - sessionTasks === 1 ? "" : "s"} remaining for today.`
            : "No tasks ticked — but you still showed up."}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-a" onClick={() => { setShowSummary(false); setPhase("idle"); setCycle(0); setTotalFocused(0); setSaveStatus(null); setSessionSaved(false); }}>
            New Session
          </button>
          <button className="btn btn-g" onClick={onExit}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dw" style={{ overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ maxWidth: 520, width: "100%", padding: "40px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button className="btn btn-g" style={{ fontSize: 11 }} onClick={phase !== "idle" ? endSession : onExit}>
            {phase !== "idle" ? "✕ End Session" : "← Exit"}
          </button>
          {challenge && (
            <div className="dw-tag" style={{ margin: 0 }}>deep work · day {challenge.dayNum} of {challenge.totalDays}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32, marginBottom: 32 }}>
          <div style={{ position: "relative", width: 196, height: 196 }}>
            <svg width={196} height={196} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={98} cy={98} r={80} fill="none" stroke="var(--bg-3)" strokeWidth={8} />
              <circle cx={98} cy={98} r={80} fill="none"
                stroke={phase === "break" ? "var(--ok)" : "var(--accent)"}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                style={{ transition: "stroke-dashoffset .9s linear, stroke .3s" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, letterSpacing: ".02em", lineHeight: 1, color: phase === "break" ? "var(--ok)" : "var(--text-0)" }}>
                {phase === "idle" ? fmt(workSecs()) : fmt(timeLeft)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--text-2)", marginTop: 4 }}>
                {phase === "idle" ? "ready" : phase === "work" ? "focus" : phase === "break" ? "break" : ""}
              </div>
            </div>
          </div>

          {cycle > 0 && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".16em", color: "var(--accent)", marginTop: 12, textTransform: "uppercase" }}>
              {cycle} cycle{cycle !== 1 ? "s" : ""} complete · {fmt(totalFocused)} focused
            </div>
          )}
        </div>

        {phase === "idle" && (
          <div style={{ marginBottom: 24 }}>
            <div className="slabel">Timer Preset</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TIMER_PRESETS.map((p, i) => (
                <button key={p.label} className={`btn ${preset === i ? "btn-a" : "btn-g"}`}
                  style={{ fontSize: 12 }} onClick={() => setPreset(i)}>
                  {p.label}{i < 3 ? ` · ${p.work}/${p.brk}` : ""}
                </button>
              ))}
            </div>
            {preset === 3 && (
              <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
                <div>
                  <div className="field-l">Work (min)</div>
                  <input className="field" type="number" min={1} max={120} value={customWork}
                    onChange={e => setCustomWork(Number(e.target.value))} style={{ width: 80 }} />
                </div>
                <div>
                  <div className="field-l">Break (min)</div>
                  <input className="field" type="number" min={1} max={60} value={customBrk}
                    onChange={e => setCustomBrk(Number(e.target.value))} style={{ width: 80 }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          {phase === "idle" && (
            <button className="btn btn-a" style={{ padding: "12px 40px", fontSize: 16 }} onClick={startWork}>
              Start Focus ▶
            </button>
          )}
          {(phase === "work" || phase === "break") && (
            <>
              <button className="btn btn-g" onClick={pauseTimer}>Pause</button>
              <button className="btn btn-a" style={{ background: "var(--ok)", borderColor: "var(--ok)" }} onClick={endSession}>
                End Session
              </button>
            </>
          )}
          {phase === "paused" && (
            <>
              <button className="btn btn-a" onClick={resumeTimer}>▶ Resume</button>
              <button className="btn btn-g" onClick={endSession}>End Session</button>
            </>
          )}
        </div>

        {safeKpis.length > 0 && (
          <>
            <div className="dv-label mt8">Today's Tasks — {doneTasks}/{safeKpis.length}</div>
            <TaskGrid tasks={safeKpis} taskState={kpis} toggle={toggle} />
          </>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button className="btn btn-g" onClick={phase !== "idle" ? endSession : onExit}>
            {phase !== "idle" ? "End Session & Exit" : "← Exit Deep Work"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeepWork;
