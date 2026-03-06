import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// THEMES
// ============================================================
const THEMES = {
  forge: {
    "--bg-0": "#080807",
    "--bg-1": "#0F0F0D",
    "--bg-2": "#161613",
    "--bg-3": "#1E1E1A",
    "--bg-4": "#252520",
    "--accent": "#D4922A",
    "--accent-lo": "#D4922A18",
    "--accent-mid": "#D4922A55",
    "--text-0": "#EDEAE3",
    "--text-1": "#9A9690",
    "--text-2": "#56524D",
    "--text-3": "#2E2C28",
    "--border-0": "#1E1E1A",
    "--border-1": "#2A2A25",
    "--border-accent": "#D4922A30",
    "--ok": "#5DBF8A",
    "--warn": "#D4B22A",
    "--err": "#BF5D5D",
  },
  slate: {
    "--bg-0": "#F2F0EC",
    "--bg-1": "#E8E5DF",
    "--bg-2": "#DEDAD3",
    "--bg-3": "#D0CBC2",
    "--bg-4": "#FFFFFF",
    "--accent": "#2A4A38",
    "--accent-lo": "#2A4A3812",
    "--accent-mid": "#2A4A3850",
    "--text-0": "#181714",
    "--text-1": "#5A5650",
    "--text-2": "#9A9690",
    "--text-3": "#C8C4BE",
    "--border-0": "#DDD9D2",
    "--border-1": "#CECAC2",
    "--border-accent": "#2A4A3830",
    "--ok": "#2A6644",
    "--warn": "#7A5C1A",
    "--err": "#7A2A2A",
  },
  iron: {
    "--bg-0": "#060810",
    "--bg-1": "#0A0D18",
    "--bg-2": "#101320",
    "--bg-3": "#161A28",
    "--bg-4": "#1C2030",
    "--accent": "#4A8FD4",
    "--accent-lo": "#4A8FD418",
    "--accent-mid": "#4A8FD455",
    "--text-0": "#E0E8F0",
    "--text-1": "#7A8898",
    "--text-2": "#404858",
    "--text-3": "#242C38",
    "--border-0": "#161A28",
    "--border-1": "#1E2438",
    "--border-accent": "#4A8FD430",
    "--ok": "#4AD48A",
    "--warn": "#D4B24A",
    "--err": "#D44A4A",
  },
};

const LEVELS = [
  { id: "initiate",    label: "INITIATE",    minDays: 0,  color: "#56524D" },
  { id: "committed",   label: "COMMITTED",   minDays: 7,  color: "#D4B22A" },
  { id: "consistent",  label: "CONSISTENT",  minDays: 14, color: "#5DBF8A" },
  { id: "disciplined", label: "DISCIPLINED", minDays: 30, color: "#D4922A" },
  { id: "forged",      label: "FORGED",      minDays: 60, color: "#4A8FD4" },
  { id: "legendary",   label: "LEGENDARY",   minDays: 90, color: "#BF5DBF" },
];

const TASK_CATEGORIES = {
  body:  { label: "Body",    color: "#D4922A" },
  mind:  { label: "Mind",    color: "#4A8FD4" },
  diet:  { label: "Diet",    color: "#5DBF8A" },
  build: { label: "Build",   color: "#BF5DBF" },
  other: { label: "Other",   color: "#9A9690" },
};

const TEMPLATES = [
  { id: "75hard",  name: "75 HARD",          duration: 75, tag: "ENDURANCE",   kpis: [{ key: "w1", label: "Workout 1 — 45min", cat:"body" },{ key: "w2", label: "Workout 2 — 45min", cat:"body" },{ key: "diet", label: "Stick to diet", cat:"diet" },{ key: "water", label: "1 gallon water", cat:"diet" },{ key: "read", label: "Read 10 pages", cat:"mind" },{ key: "photo", label: "Progress photo", cat:"other" }] },
  { id: "30day",   name: "30 DAY HARD",       duration: 30, tag: "FOUNDATION",  kpis: [{ key: "workout", label: "Workout", cat:"body" },{ key: "diet", label: "Clean eating", cat:"diet" },{ key: "mindset", label: "Mindset work", cat:"mind" }] },
  { id: "10apps",  name: "10 APPS / 10 DAYS", duration: 10, tag: "BUILDER",    kpis: [{ key: "shipped", label: "App shipped", cat:"build" },{ key: "deployed", label: "Deployed live", cat:"build" },{ key: "docs", label: "Documented", cat:"build" }] },
  { id: "noai",    name: "30 DAYS NO AI",      duration: 30, tag: "DISCIPLINE", kpis: [{ key: "no_ai", label: "Zero AI used", cat:"mind" },{ key: "dw", label: "2hr deep work", cat:"build" }] },
  { id: "custom",  name: "CUSTOM",             duration: 30, tag: "YOUR RULES", kpis: [] },
];

// ============================================================
// MOCK DATA
// ============================================================
const buildWall = (withMockData = false) => {
  const out = [];
  const now = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const r = Math.random();
    out.push({
      date: d.toISOString().split("T")[0],
      // Only generate fake scores if explicitly requested (never for real users)
      score: withMockData && i > 2 ? (r > 0.15 ? Math.floor(r * 40 + 60) : 0) : null,
      day: 42 - i,
      isToday: i === 0,
    });
  }
  return out;
};

const MOCK_CHALLENGES = { // kept for reference only — not used as initial state
  main: { id:"c1", name:"75 Hard", tag:"ENDURANCE", dayNum:28, totalDays:75, streak:12, consistency:87, color:"#D4922A", kpis: TEMPLATES[0].kpis, wall: null },
  secondary: [
    { id:"c2", name:"10 Apps / 10 Days", tag:"BUILDER",    dayNum:4,  totalDays:10, streak:4,  consistency:100, color:"#5DBF8A", kpis: TEMPLATES[2].kpis },
    { id:"c3", name:"30 Days No AI",      tag:"DISCIPLINE", dayNum:4,  totalDays:30, streak:4,  consistency:92,  color:"#4A8FD4", kpis: TEMPLATES[3].kpis },
  ],
};

const CHALLENGE = { ...MOCK_CHALLENGES.main, wall: buildWall() }; // legacy reference
const EMPTY_CHALLENGES = { main: null, secondary: [] };
const EMPTY_KPIS = {};
const INIT_KPIS = Object.fromEntries(TEMPLATES[0].kpis.map(k => [k.key, false]));

// ============================================================
// UTILS
// ============================================================
const getLevel  = (days) => [...LEVELS].reverse().find(l => days >= l.minDays) || LEVELS[0];
const pct       = (a, b) => Math.round((a / b) * 100);
const fmtDate   = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const greeting  = () => { const h = new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":h<21?"Good evening":"Still at it"; };
const wallColor = (score) => { if (score===null) return "var(--bg-3)"; if (score===0) return "var(--bg-2)"; if (score<50) return "var(--accent-lo)"; if (score<75) return "var(--accent-mid)"; return "var(--accent)"; };
const fmtCellDate = (dateStr) => { const d = new Date(dateStr + "T00:00:00"); return `${d.toLocaleString("en-US",{month:"short"}).toUpperCase()}/${String(d.getDate()).padStart(2,"0")}`; };

// ============================================================
// STYLES
// ============================================================
const makeCSS = () => `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-0:#080807; --bg-1:#0F0F0D; --bg-2:#161613; --bg-3:#1E1E1A; --bg-4:#252520;
    --accent:#D4922A; --accent-lo:#D4922A18; --accent-mid:#D4922A55;
    --text-0:#EDEAE3; --text-1:#9A9690; --text-2:#56524D; --text-3:#2E2C28;
    --border-0:#1E1E1A; --border-1:#2A2A25; --border-accent:#D4922A30;
    --ok:#5DBF8A; --warn:#D4B22A; --err:#BF5D5D;
  }

  html, body { height:100%; background:var(--bg-0); color:var(--text-0); overflow-x:hidden; }
  body { font-family:'DM Sans',sans-serif; font-weight:400; line-height:1.5; font-size:17px; }

  /* Film grain overlay */
  body::after {
    content:'';
    position:fixed; inset:0;
    pointer-events:none; z-index:9999;
    opacity:0.032;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat:repeat; background-size:256px;
  }

  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:var(--bg-0); }
  ::-webkit-scrollbar-thumb { background:var(--border-1); border-radius:2px; }

  /* TYPEFACES */
  .f-display { font-family:'Bebas Neue',sans-serif; letter-spacing:0.04em; line-height:0.92; }
  .f-mono    { font-family:'IBM Plex Mono',monospace; }
  .f-body    { font-family:'DM Sans',sans-serif; }

  /* ANIMATIONS */
  @keyframes up     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadein { from{opacity:0} to{opacity:1} }
  @keyframes grow   { from{width:0%} to{width:100%} }
  @keyframes scalein{ from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes leftin { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }

  .a0{animation:up .55s cubic-bezier(.16,1,.3,1) both}
  .a1{animation:up .55s .08s cubic-bezier(.16,1,.3,1) both}
  .a2{animation:up .55s .16s cubic-bezier(.16,1,.3,1) both}
  .a3{animation:up .55s .24s cubic-bezier(.16,1,.3,1) both}
  .a4{animation:up .55s .32s cubic-bezier(.16,1,.3,1) both}
  .a5{animation:up .55s .40s cubic-bezier(.16,1,.3,1) both}
  .aslide{animation:leftin .4s cubic-bezier(.16,1,.3,1) both}
  .ascale{animation:scalein .35s cubic-bezier(.16,1,.3,1) both}

  /* LAYOUT */
  .shell { display:flex; min-height:100vh; background:var(--bg-0); width:100%; }

  /* ICON RAIL */
  .rail {
    width:58px; min-height:100vh;
    background:var(--bg-1);
    border-right:1px solid var(--border-0);
    display:flex; flex-direction:column; align-items:center;
    padding:18px 0;
    position:fixed; top:0; left:0; z-index:100;
    animation:leftin .4s ease both;
  }

  .rail-logo {
    font-family:'Bebas Neue',sans-serif;
    font-size:19px; color:var(--accent);
    letter-spacing:.12em;
    writing-mode:vertical-rl;
    transform:rotate(180deg);
    padding-bottom:18px;
    border-bottom:1px solid var(--border-0);
    margin-bottom:14px;
    cursor:pointer;
    transition:opacity .2s;
  }
  .rail-logo:hover { opacity:.7; }

  .rail-nav { display:flex; flex-direction:column; gap:2px; width:100%; align-items:center; }

  .rail-btn {
    width:38px; height:38px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:15px;
    color:var(--text-2);
    transition:all .15s;
    position:relative;
    border:1px solid transparent;
  }
  .rail-btn:hover { color:var(--text-0); background:var(--bg-2); }
  .rail-btn.on { color:var(--accent); background:var(--accent-lo); border-color:var(--border-accent); }

  .rtip {
    position:absolute; left:calc(100% + 10px); top:50%; transform:translateY(-50%);
    background:var(--bg-3); border:1px solid var(--border-1);
    border-radius:5px; padding:4px 10px;
    font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.06em;
    color:var(--text-0); white-space:nowrap;
    opacity:0; pointer-events:none; transition:opacity .15s;
  }
  .rail-btn:hover .rtip { opacity:1; }

  .rail-foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .rail-streak-n { font-family:'Bebas Neue',sans-serif; font-size:20px; color:var(--warn); line-height:1; }
  .rail-streak-l { font-family:'IBM Plex Mono',monospace; font-size:7px; color:var(--text-2); letter-spacing:.1em; text-transform:uppercase; }

  /* MAIN AREA */
  .main { margin-left:58px; flex:1; display:flex; flex-direction:column; min-width:0; overflow-x:hidden; }

  /* TOPBAR */
  .topbar {
    height:50px; border-bottom:1px solid var(--border-0);
    display:flex; align-items:center; justify-content:space-between;
    padding:0 28px; background:var(--bg-0);
    position:sticky; top:0; z-index:50;
  }
  .topbar-date { font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-2); letter-spacing:.06em; }
  .topbar-r { display:flex; align-items:center; gap:10px; }

  .lvl-chip {
    display:flex; align-items:center; gap:6px;
    padding:4px 11px; border-radius:4px;
    border:1px solid var(--border-1);
    font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.14em;
    cursor:pointer; transition:border-color .18s;
  }
  .lvl-chip:hover { border-color:var(--border-accent); }
  .lvl-dot { width:5px; height:5px; border-radius:50%; }

  /* PAGE */
  .page { padding:36px 32px; width:100%; max-width:900px; box-sizing:border-box; }

  /* PAGE HEADER */
  .pg-tag   { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); margin-bottom:5px; }
  .pg-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(40px,6vw,60px); letter-spacing:.02em; line-height:0.95; }
  .pg-sub   { font-size:15px; color:var(--text-1); margin-top:8px; }

  /* SECTION LABEL */
  .slabel {
    font-family:'IBM Plex Mono',monospace; font-size:9px;
    letter-spacing:.18em; text-transform:uppercase; color:var(--text-2);
    margin-bottom:12px;
  }

  /* DIVIDER WITH LABEL */
  .dv-label {
    display:flex; align-items:center; gap:12px;
    font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.18em;
    text-transform:uppercase; color:var(--text-2);
    margin:26px 0 14px;
  }
  .dv-label::before,.dv-label::after { content:''; flex:1; height:1px; background:var(--border-0); }

  /* BANNER — challenge hero */
  .banner {
    background:var(--bg-1); border:1px solid var(--border-accent);
    border-radius:12px; padding:26px 30px;
    position:relative; overflow:hidden;
  }
  .banner::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at top right,var(--accent-lo) 0%,transparent 60%);
    pointer-events:none;
  }

  /* The big ghost number — architectural background element */
  .ghost-num {
    position:absolute; right:16px; top:-8px;
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(100px,16vw,200px);
    color:var(--text-3); letter-spacing:.02em; line-height:0.85;
    pointer-events:none; user-select:none;
    opacity:0.6;
  }

  /* PROGRESS */
  .track { height:2px; background:var(--bg-3); border-radius:1px; overflow:hidden; }
  .fill  { height:100%; background:var(--accent); transition:width 1s cubic-bezier(.4,0,.2,1); }

  /* STATS ROW */
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .stat {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:18px 20px;
  }
  .stat-n {
    font-family:'Bebas Neue',sans-serif;
    font-size:52px; line-height:1; letter-spacing:.02em;
  }
  .stat-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
    margin-top:3px;
  }

  /* TASK CARDS */
  .tasks-grid {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:10px;
  }

  .task-card {
    background:var(--bg-2);
    border:1px solid var(--border-0);
    border-radius:10px;
    padding:14px 16px;
    cursor:pointer;
    transition:all .2s cubic-bezier(.16,1,.3,1);
    user-select:none;
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    gap:10px;
    min-height:80px;
  }
  .task-card::before {
    content:'';
    position:absolute; inset:0;
    opacity:0;
    transition:opacity .2s;
    pointer-events:none;
  }
  .task-card:hover { border-color:var(--border-1); transform:translateY(-1px); }
  .task-card.done  {
    border-color:transparent;
    background:var(--bg-3);
  }
  .task-card.done::after {
    content:'';
    position:absolute; inset:0;
    border-radius:10px;
    border:1px solid;
    opacity:.35;
    pointer-events:none;
  }

  .task-card-top {
    display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
  }
  .task-cat-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.14em; text-transform:uppercase;
    padding:3px 8px; border-radius:3px;
    font-weight:500; flex-shrink:0;
    border:1px solid;
  }
  .task-card-label {
    font-size:15px; font-weight:500; line-height:1.4;
    transition:all .2s;
  }
  .task-card.done .task-card-label {
    color:var(--text-2);
    text-decoration:line-through;
    text-decoration-color:var(--text-2);
  }
  .task-card-bottom {
    display:flex; align-items:center; justify-content:space-between;
    margin-top:auto;
  }
  .task-check {
    width:18px; height:18px; border-radius:50%;
    border:1.5px solid var(--border-1);
    display:flex; align-items:center; justify-content:center;
    font-size:9px; font-weight:700;
    transition:all .2s; color:transparent;
    flex-shrink:0;
  }
  .task-card.done .task-check {
    color:white;
    border-color:transparent;
  }
  .task-done-stamp {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.14em; text-transform:uppercase;
    opacity:0; transform:translateX(6px);
    transition:all .2s;
  }
  .task-card.done .task-done-stamp { opacity:1; transform:translateX(0); }

  /* COMPLETION RING */
  .ring-wrap {
    display:flex; align-items:center; gap:16px;
    padding:16px 20px;
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; margin-bottom:14px;
  }
  .ring-svg { flex-shrink:0; }
  .ring-info { flex:1; }
  .ring-pct  {
    font-family:'Bebas Neue',sans-serif;
    font-size:32px; letter-spacing:.02em; line-height:1;
  }
  .ring-sub  {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.12em; text-transform:uppercase;
    color:var(--text-2); margin-top:2px;
  }
  .ring-cats { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }

  /* WALL */
  .wall-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }

  .cell {
    height:38px;
    border-radius:4px;
    cursor:pointer; position:relative;
    transition:transform .12s, filter .12s, border-color .12s;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    border:1px solid transparent;
    overflow:visible;
  }
  .cell:hover { transform:scale(1.06); filter:brightness(1.25); z-index:10; border-color:rgba(255,255,255,0.08); }
  .cell.today { border-color:var(--accent) !important; }

  .cell-date {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; line-height:1;
    color:rgba(255,255,255,0.5);
    letter-spacing:.02em;
    pointer-events:none;
    user-select:none;
    text-align:center;
    padding:0 2px;
  }
  .cell-score {
    font-family:'IBM Plex Mono',monospace;
    font-size:7px; line-height:1; margin-top:2px;
    color:rgba(255,255,255,0.35);
    pointer-events:none; user-select:none;
  }

  .ctip {
    display:none; position:absolute;
    bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
    background:var(--bg-4); border:1px solid var(--border-1);
    border-radius:5px; padding:5px 9px;
    font-size:10px; white-space:nowrap;
    z-index:20; font-family:'IBM Plex Mono',monospace;
    color:var(--text-1); pointer-events:none;
  }
  .cell:hover .ctip { display:block; }

  /* MONTH LABEL */
  .month-label {
    font-family:'Bebas Neue',sans-serif;
    font-size:13px; letter-spacing:.1em;
    color:var(--text-2); margin-bottom:6px; margin-top:18px;
  }
  .month-label:first-child { margin-top:0; }

  /* ONGOING CHALLENGE CARD */
  .oc-card {
    background:var(--bg-2); border:1px solid var(--border-1);
    border-radius:8px; padding:14px 16px;
    display:flex; align-items:center; gap:14px;
    transition:border-color .15s;
  }
  .oc-card:hover { border-color:var(--border-accent); }
  .oc-bar-wrap { flex:1; }
  .oc-name { font-size:15px; font-weight:500; margin-bottom:5px; }
  .oc-meta { font-family:'IBM Plex Mono',monospace; font-size:9px; color:var(--text-2); letter-spacing:.08em; margin-bottom:8px; }
  .oc-track { height:2px; background:var(--bg-3); border-radius:1px; overflow:hidden; }
  .oc-fill  { height:100%; border-radius:1px; transition:width .8s cubic-bezier(.4,0,.2,1); }
  .oc-pct   { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:.02em; line-height:1; flex-shrink:0; }

  /* AI INSIGHT BLOCK */
  .ai-block {
    background:var(--bg-1);
    border:1px solid var(--border-accent);
    border-radius:12px;
    padding:20px 24px;
    position:relative;
    overflow:hidden;
  }
  .ai-block::before {
    content:'';
    position:absolute; inset:0;
    background:radial-gradient(ellipse at top left, var(--accent-lo) 0%, transparent 55%);
    pointer-events:none;
  }
  .ai-block-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:14px;
  }
  .ai-block-label {
    display:flex; align-items:center; gap:8px;
    font-family:'IBM Plex Mono',monospace; font-size:9px;
    letter-spacing:.2em; text-transform:uppercase; color:var(--accent);
  }
  .ai-dot {
    width:6px; height:6px; border-radius:50%; background:var(--accent);
    animation:pulse 2s ease infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(0.8)} }

  .ai-text {
    font-size:16px; line-height:1.7; color:var(--text-0);
    font-style:italic; position:relative; z-index:1;
  }
  .ai-text-loading {
    font-size:13px; color:var(--text-2); font-family:'IBM Plex Mono',monospace;
    letter-spacing:.04em;
  }
  .ai-footer {
    display:flex; align-items:center; justify-content:space-between;
    margin-top:14px; padding-top:12px;
    border-top:1px solid var(--border-0);
  }
  .ai-timestamp { font-family:'IBM Plex Mono',monospace; font-size:9px; color:var(--text-2); letter-spacing:.06em; }

  /* MISSION ANCHOR (shown on checklist) */
  .mission-anchor {
    background:var(--accent-lo);
    border:1px solid var(--border-accent);
    border-radius:8px; padding:12px 16px;
    font-size:15px; color:var(--text-1);
    font-style:italic; line-height:1.6;
    position:relative;
  }
  .mission-anchor::before {
    content:'"';
    font-family:'Bebas Neue',sans-serif; font-size:32px;
    color:var(--accent-mid); line-height:1;
    position:absolute; top:6px; left:12px;
  }
  .mission-anchor-text { padding-left:18px; }

  /* STEP WIZARD */
  .wizard-steps {
    display:flex; align-items:center; gap:0;
    margin-bottom:28px;
  }
  .wstep {
    display:flex; align-items:center; gap:8px;
    font-family:'IBM Plex Mono',monospace; font-size:9px;
    letter-spacing:.12em; text-transform:uppercase;
    color:var(--text-2); padding:6px 0;
  }
  .wstep.active { color:var(--accent); }
  .wstep.done   { color:var(--ok); }
  .wstep-num {
    width:20px; height:20px; border-radius:50%;
    border:1.5px solid currentColor;
    display:flex; align-items:center; justify-content:center;
    font-size:9px; flex-shrink:0;
  }
  .wstep-line { flex:1; height:1px; background:var(--border-0); margin:0 8px; min-width:16px; }

  /* TASK BUILDER */
  .task-row {
    display:flex; align-items:center; gap:8px;
    padding:10px 12px;
    background:var(--bg-2); border:1px solid var(--border-0);
    border-radius:7px; transition:border-color .15s;
  }
  .task-row:hover { border-color:var(--border-1); }
  .task-drag { color:var(--text-2); cursor:grab; font-size:14px; flex-shrink:0; }
  .task-input {
    flex:1; background:transparent; border:none; outline:none;
    color:var(--text-0); font-family:'DM Sans',sans-serif; font-size:15px;
  }
  .task-input::placeholder { color:var(--text-2); }
  .task-remove {
    width:20px; height:20px; border-radius:4px;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:var(--text-2); font-size:13px;
    transition:all .15s; flex-shrink:0;
  }
  .task-remove:hover { background:var(--err); color:white; }

  .add-task-btn {
    display:flex; align-items:center; gap:8px;
    padding:10px 12px;
    border:1px dashed var(--border-1); border-radius:7px;
    color:var(--text-2); font-size:15px; cursor:pointer;
    transition:all .15s; background:transparent; width:100%;
    font-family:'DM Sans',sans-serif;
  }
  .add-task-btn:hover { border-color:var(--accent-mid); color:var(--accent); }

  /* TEXTAREA */
  .textarea {
    background:var(--bg-2); border:1px solid var(--border-1);
    border-radius:6px; padding:12px 14px;
    color:var(--text-0); font-family:'DM Sans',sans-serif; font-size:15px;
    width:100%; outline:none; transition:border-color .15s;
    resize:none; line-height:1.6;
  }
  .textarea:focus { border-color:var(--accent-mid); }
  .textarea::placeholder { color:var(--text-2); font-style:italic; }

  /* JARVIS HEADER */
  .jarvis-header {
    margin-bottom:0;
  }
  .jarvis-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.28em; text-transform:uppercase;
    color:var(--text-2); margin-bottom:6px;
  }
  .jarvis-greeting {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(36px,5vw,52px);
    letter-spacing:.02em; line-height:1;
    color:var(--text-0);
  }
  .jarvis-name { color:var(--accent); }
  .jarvis-message {
    font-size:17px; color:var(--text-1);
    margin-top:6px; line-height:1.5;
    max-width:560px;
  }
  .jarvis-status {
    display:flex; align-items:center; gap:10px;
    margin-top:10px;
  }
  .jarvis-status-dot {
    width:6px; height:6px; border-radius:50%;
    background:var(--ok); flex-shrink:0;
    animation:pulse 2.5s ease infinite;
  }
  .jarvis-status-text {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--text-2);
  }

  /* CHALLENGE ARENA */
  .arena {
    display:grid;
    grid-template-columns:1fr 280px;
    gap:10px;
    align-items:start;
  }
  .arena-main {
    grid-row: 1;
    grid-column: 1;
  }
  .arena-side {
    grid-row: 1;
    grid-column: 2;
    display:flex;
    flex-direction:column;
    gap:10px;
  }

  /* MAIN CHALLENGE CARD */
  .arena-main {
    background:var(--bg-1);
    border:1px solid var(--border-accent);
    border-radius:14px;
    padding:28px 32px 24px;
    position:relative;
    overflow:hidden;
    cursor:pointer;
    transition:border-color .2s, box-shadow .2s;
    box-shadow: 0 0 0 0 var(--accent-lo);
  }
  .arena-main::before {
    content:'';
    position:absolute; inset:0;
    background:radial-gradient(ellipse at top right, var(--accent-mid) 0%, transparent 55%);
    opacity:.18;
    pointer-events:none;
  }
  .arena-main::after {
    content:'';
    position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg, var(--accent) 0%, transparent 80%);
    border-radius:14px 14px 0 0;
  }
  .arena-main:hover { border-color:var(--accent); box-shadow: 0 8px 32px var(--accent-lo); }

  .arena-main-crown {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.22em; text-transform:uppercase;
    color:var(--accent); margin-bottom:12px;
    display:flex; align-items:center; gap:7px;
  }
  .arena-main-crown::before { content:'★'; font-size:10px; }

  .arena-main-name {
    font-family:'Bebas Neue',sans-serif;
    font-size:44px; letter-spacing:.02em; line-height:1;
    margin-bottom:6px;
  }
  .arena-main-meta {
    font-family:'IBM Plex Mono',monospace;
    font-size:10px; color:var(--text-1); letter-spacing:.08em;
    margin-bottom:20px;
  }
  .arena-main-stats {
    display:flex; gap:28px; margin-bottom:18px; align-items:flex-end;
  }
  .arena-ms { display:flex; flex-direction:column; gap:3px; }
  .arena-ms-val {
    font-family:'Bebas Neue',sans-serif;
    font-size:38px; letter-spacing:.02em; line-height:1;
  }
  .arena-ms-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
  }
  .arena-ms-divider {
    width:1px; height:48px; background:var(--border-1); flex-shrink:0;
  }

  /* SECONDARY CHALLENGE CARD */
  .arena-sec {
    background:var(--bg-2);
    border:1px solid var(--border-0);
    border-radius:10px;
    padding:16px 18px;
    cursor:pointer;
    transition:all .18s;
    position:relative;
    overflow:hidden;
  }
  .arena-sec:hover { border-color:var(--border-1); transform:translateY(-1px); }
  .arena-sec-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:7px; letter-spacing:.18em; text-transform:uppercase;
    margin-bottom:6px;
  }
  .arena-sec-name {
    font-family:'Bebas Neue',sans-serif;
    font-size:18px; letter-spacing:.02em; line-height:1;
    margin-bottom:10px;
  }
  .arena-sec-meta {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; color:var(--text-2); letter-spacing:.06em;
    margin-bottom:8px;
  }
  .arena-sec-bar { height:2px; background:var(--bg-3); border-radius:1px; overflow:hidden; }
  .arena-sec-fill { height:100%; border-radius:1px; transition:width .8s cubic-bezier(.4,0,.2,1); }

  /* ADD SLOT */
  .arena-slot {
    background:transparent;
    border:1px dashed var(--border-1);
    border-radius:10px;
    padding:16px 18px;
    cursor:pointer;
    transition:all .18s;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:6px;
    min-height:110px;
  }
  .arena-slot:hover { border-color:var(--accent-mid); background:var(--accent-lo); }
  .arena-slot-icon { font-size:18px; color:var(--text-2); transition:color .18s; }
  .arena-slot:hover .arena-slot-icon { color:var(--accent); }
  .arena-slot-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--text-2); transition:color .18s;
  }
  .arena-slot:hover .arena-slot-label { color:var(--accent); }
  .arena-slot-hint {
    font-size:11px; color:var(--text-2); text-align:center; line-height:1.4;
  }

  /* CHECK-IN MODE BAR */
  .cin-bar {
    display:flex; gap:6px; margin-bottom:14px;
    padding:10px 14px;
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; align-items:center; flex-wrap:wrap;
  }
  .cin-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--text-2); margin-right:4px; flex-shrink:0;
  }
  .cin-btn {
    display:flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:5px;
    font-family:'IBM Plex Mono',monospace; font-size:9px;
    letter-spacing:.1em; text-transform:uppercase;
    cursor:pointer; transition:all .15s; border:1px solid transparent;
    background:transparent; color:var(--text-2);
  }
  .cin-btn:hover { color:var(--text-0); background:var(--bg-2); }
  .cin-btn.active-full     { background:var(--accent-lo);  color:var(--accent); border-color:var(--border-accent); }
  .cin-btn.active-scaled   { background:#D4B22A18; color:#D4B22A; border-color:#D4B22A30; }
  .cin-btn.active-recovery { background:#4A8FD418; color:#4A8FD4; border-color:#4A8FD430; }
  .cin-btn.btn-disabled    { opacity:.35; cursor:not-allowed; pointer-events:none; }
  .cin-sep { width:1px; height:18px; background:var(--border-0); margin:0 4px; flex-shrink:0; }

  /* SCALED DAY BANNER */
  .scaled-banner {
    background:#D4B22A10; border:1px solid #D4B22A30;
    border-radius:8px; padding:10px 14px; margin-bottom:12px;
    display:flex; align-items:flex-start; gap:10px;
  }
  .scaled-icon { font-size:15px; flex-shrink:0; margin-top:2px; }
  .scaled-title {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.14em; text-transform:uppercase;
    color:#D4B22A; margin-bottom:3px;
  }
  .scaled-desc { font-size:14px; color:var(--text-1); line-height:1.5; }

  /* RECOVERY BANNER */
  .recovery-banner {
    background:#4A8FD410; border:1px solid #4A8FD430;
    border-radius:8px; padding:10px 14px; margin-bottom:12px;
    display:flex; align-items:flex-start; gap:10px;
  }
  .recovery-title {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.14em; text-transform:uppercase;
    color:#4A8FD4; margin-bottom:3px;
  }

  /* RECOVERY MODAL */
  .recovery-modal {
    background:var(--bg-1); border:1px solid #4A8FD430;
    border-radius:14px; padding:32px; width:460px;
    max-height:85vh; overflow-y:auto;
    animation:scalein .3s ease;
  }
  .recovery-modal-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.2em; text-transform:uppercase;
    color:#4A8FD4; margin-bottom:8px;
  }
  .recovery-modal-title {
    font-family:'Bebas Neue',sans-serif;
    font-size:34px; letter-spacing:.02em; line-height:1; margin-bottom:8px;
  }
  .recovery-modal-desc {
    font-size:15px; color:var(--text-1); line-height:1.65; margin-bottom:24px;
  }
  .recovery-path {
    background:var(--bg-2); border:1px solid var(--border-1);
    border-radius:8px; padding:16px; cursor:pointer;
    transition:all .15s; margin-bottom:8px;
    display:flex; align-items:flex-start; gap:12px;
  }
  .recovery-path:hover { border-color:var(--border-accent); transform:translateY(-1px); }
  .recovery-path-icon { font-size:20px; flex-shrink:0; }
  .recovery-path-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.16em; text-transform:uppercase;
    margin-bottom:4px;
  }
  .recovery-path-desc { font-size:14px; color:var(--text-1); line-height:1.5; }
  .recovery-used-note {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; color:var(--text-2); letter-spacing:.08em;
    text-align:center; margin-top:14px;
  }

  /* CARDS */
  .card {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:20px;
    transition:border-color .18s;
  }
  .card:hover { border-color:var(--border-1); }

  /* BUTTONS */
  .btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:8px 17px; border-radius:6px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
    letter-spacing:.02em; cursor:pointer; transition:all .15s; border:none;
  }
  .btn-a { background:var(--accent); color:#080807; font-weight:600; }
  .btn-a:hover { opacity:.85; transform:translateY(-1px); }
  .btn-g { background:transparent; color:var(--text-1); border:1px solid var(--border-1); }
  .btn-g:hover { color:var(--text-0); border-color:var(--accent-mid); }

  /* TEMPLATE CARDS */
  .tpl {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:18px;
    cursor:pointer; transition:all .18s; overflow:hidden;
  }
  .tpl:hover { border-color:var(--accent-mid); transform:translateY(-2px); }
  .tpl-tag  { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.2em; color:var(--accent); margin-bottom:8px; text-transform:uppercase; }
  .tpl-name { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:.04em; line-height:1; margin-bottom:6px; }
  .tpl-desc { font-size:14px; color:var(--text-1); line-height:1.55; }

  /* SETTINGS */
  .srow { background:var(--bg-1); border:1px solid var(--border-0); border-radius:10px; padding:22px; }
  .srow-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:.04em; margin-bottom:4px; }
  .srow-desc  { font-size:14px; color:var(--text-1); margin-bottom:18px; line-height:1.55; }

  /* THEME SWATCH */
  .swatch { width:22px; height:22px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:all .18s; }
  .swatch.on { border-color:var(--text-0); transform:scale(1.18); }

  /* INPUT */
  .field {
    background:var(--bg-2); border:1px solid var(--border-1);
    border-radius:6px; padding:9px 13px;
    color:var(--text-0); font-family:'DM Sans',sans-serif; font-size:15px;
    width:100%; outline:none; transition:border-color .15s;
  }
  .field:focus { border-color:var(--accent-mid); }
  .field-l { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--text-2); margin-bottom:5px; }

  /* MODAL */
  .overlay {
    position:fixed; inset:0;
    background:rgba(0,0,0,.78); backdrop-filter:blur(6px);
    z-index:300; display:flex; align-items:center; justify-content:center;
    animation:fadein .2s ease;
  }
  .modal {
    background:var(--bg-1); border:1px solid var(--border-accent);
    border-radius:14px; padding:30px; width:490px;
    max-height:82vh; overflow-y:auto;
    animation:scalein .3s ease;
  }
  .modal-tag   { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent); margin-bottom:4px; }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:34px; letter-spacing:.04em; margin-bottom:4px; }
  .modal-desc  { font-size:14px; color:var(--text-1); margin-bottom:22px; line-height:1.55; }

  /* DEEP WORK */
  .dw {
    position:fixed; inset:0; background:var(--bg-0);
    z-index:200; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    animation:fadein .4s ease;
  }
  .dw-tag { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.28em; text-transform:uppercase; color:var(--text-2); margin-bottom:36px; }
  .dw-timer { font-family:'Bebas Neue',sans-serif; font-size:clamp(88px,14vw,148px); color:var(--accent); letter-spacing:.04em; line-height:1; }

  /* ENTRY */
  .entry {
    position:fixed; inset:0; background:var(--bg-0);
    z-index:999; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    animation:fadein .3s ease;
  }
  .entry-mark { font-family:'Bebas Neue',sans-serif; font-size:80px; color:var(--accent); letter-spacing:.1em; animation:up .6s ease both; }
  .entry-tag  { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.35em; text-transform:uppercase; color:var(--text-2); animation:up .6s .1s ease both; margin-top:2px; }
  .entry-line { width:150px; height:1px; background:var(--bg-3); margin-top:48px; animation:up .6s .2s ease both; overflow:hidden; }
  .entry-fill { height:1px; background:var(--accent); animation:grow 2s ease forwards; }

  /* UTILS */
  .flex    { display:flex; }
  .col     { flex-direction:column; }
  .center  { align-items:center; }
  .between { justify-content:space-between; }
  .wrap    { flex-wrap:wrap; }
  .g4      { gap:4px; }
  .g8      { gap:8px; }
  .g12     { gap:12px; }
  .g16     { gap:16px; }
  .g24     { gap:24px; }
  .mt8     { margin-top:8px; }
  .mt12    { margin-top:12px; }
  .mt16    { margin-top:16px; }
  .mt20    { margin-top:20px; }
  .mt24    { margin-top:24px; }
  .mt32    { margin-top:32px; }
  .mt40    { margin-top:40px; }
  .mb8     { margin-bottom:8px; }
  .mb12    { margin-bottom:12px; }
  .mb16    { margin-bottom:16px; }
  .mb20    { margin-bottom:20px; }
  .w100    { width:100%; }
  .rel     { position:relative; }
  .clamp   { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  /* SCOREBOARD */
  .scoreboard {
    display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
  }
  .sb-card {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:16px 18px;
    display:flex; flex-direction:column; gap:4px;
    transition:border-color .18s;
  }
  .sb-card:hover { border-color:var(--border-accent); }
  .sb-card-n {
    font-family:'Bebas Neue',sans-serif;
    font-size:44px; line-height:1; letter-spacing:.02em;
  }
  .sb-card-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
  }
  .sb-trophy-row {
    display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;
  }
  .sb-trophy {
    display:flex; align-items:center; gap:6px;
    background:var(--bg-2); border:1px solid var(--border-1);
    border-radius:8px; padding:8px 12px;
    font-size:14px; color:var(--text-1);
    transition:border-color .15s;
  }
  .sb-trophy:hover { border-color:var(--border-accent); }
  .sb-trophy-icon { font-size:16px; }
  .sb-trophy-name { font-size:13px; color:var(--text-0); font-weight:500; }
  .sb-trophy-meta { font-family:'IBM Plex Mono',monospace; font-size:8px; color:var(--text-2); letter-spacing:.06em; }

  /* CHALLENGE DETAIL MODAL */
  .cdm {
    background:var(--bg-1); border:1px solid var(--border-accent);
    border-radius:14px; padding:0; width:560px;
    max-height:85vh; overflow-y:auto;
    animation:scalein .3s ease;
  }
  .cdm-hero {
    padding:28px 28px 20px;
    background:var(--bg-2);
    border-bottom:1px solid var(--border-0);
    position:relative; overflow:hidden;
    border-radius:14px 14px 0 0;
  }
  .cdm-hero::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at top right, var(--accent-lo) 0%, transparent 60%);
    pointer-events:none;
  }
  .cdm-hero::after {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg, var(--accent) 0%, transparent 80%);
    border-radius:14px 14px 0 0;
  }
  .cdm-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.22em; text-transform:uppercase;
    color:var(--accent); margin-bottom:8px;
    position:relative; z-index:1;
  }
  .cdm-name {
    font-family:'Bebas Neue',sans-serif;
    font-size:38px; letter-spacing:.02em; line-height:1;
    margin-bottom:4px; position:relative; z-index:1;
  }
  .cdm-meta {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; color:var(--text-1); letter-spacing:.08em;
    margin-bottom:16px; position:relative; z-index:1;
  }
  .cdm-stats { display:flex; gap:20px; position:relative; z-index:1; }
  .cdm-stat-v {
    font-family:'Bebas Neue',sans-serif;
    font-size:28px; letter-spacing:.02em; line-height:1;
  }
  .cdm-stat-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:7px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2);
  }
  .cdm-body { padding:24px 28px; }
  .cdm-section { margin-bottom:24px; }
  .cdm-section-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.2em; text-transform:uppercase;
    color:var(--text-2); margin-bottom:12px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .cdm-edit-btn {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--accent); cursor:pointer; transition:opacity .15s;
    background:none; border:none; padding:0;
  }
  .cdm-edit-btn:hover { opacity:.7; }
  .cdm-mission {
    background:var(--accent-lo); border:1px solid var(--border-accent);
    border-radius:8px; padding:14px 16px;
    font-size:15px; color:var(--text-1);
    font-style:italic; line-height:1.6; position:relative;
  }
  .cdm-mission::before {
    content:'"'; font-family:'Bebas Neue',sans-serif; font-size:28px;
    color:var(--accent-mid); line-height:1;
    position:absolute; top:4px; left:10px;
  }
  .cdm-mission-text { padding-left:16px; }
  .cdm-task-list { display:flex; flex-direction:column; gap:6px; }
  .cdm-task-row {
    display:flex; align-items:center; gap:10px;
    padding:10px 12px; border-radius:7px;
    background:var(--bg-2); border:1px solid var(--border-0);
    transition:border-color .15s;
  }
  .cdm-task-row:hover { border-color:var(--border-1); }
  .cdm-task-label { flex:1; font-size:15px; }
  .cdm-task-cat {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.12em; text-transform:uppercase;
    padding:2px 7px; border-radius:3px; border:1px solid; flex-shrink:0;
  }
  .cdm-nn-badge {
    font-family:'IBM Plex Mono',monospace;
    font-size:7px; letter-spacing:.12em; text-transform:uppercase;
    color:var(--warn); border:1px solid var(--warn); border-radius:3px; padding:2px 5px;
  }

  /* LIBRARY MODE SELECTOR */
  .lib-mode-row {
    display:flex; gap:0;
    border:1px solid var(--border-1); border-radius:8px;
    overflow:hidden; margin-bottom:24px; width:fit-content;
  }
  .lib-mode-btn {
    padding:9px 20px;
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.14em; text-transform:uppercase;
    cursor:pointer; transition:all .18s;
    color:var(--text-2); background:transparent; border:none;
  }
  .lib-mode-btn:hover:not(.on) { color:var(--text-1); background:var(--bg-2); }
  .lib-mode-btn.on { background:var(--accent); color:#080807; font-weight:700; }

  /* UTILS */
  .c-ok   { color:var(--ok); }
  .c-warn { color:var(--warn); }
  .c-err  { color:var(--err); }
  .c-acc  { color:var(--accent); }
  .c-1    { color:var(--text-1); }
  .c-2    { color:var(--text-2); }

  /* ============================================================
     AUTH SCREEN
  ============================================================ */
  .auth-screen {
    position:fixed; inset:0;
    background:var(--bg-0);
    display:flex; align-items:stretch;
    animation:fadein .4s ease both;
    overflow:hidden;
  }
  .auth-left {
    width:52%; position:relative;
    background:var(--bg-1);
    border-right:1px solid var(--border-0);
    display:flex; flex-direction:column;
    justify-content:center; align-items:center;
    padding:60px 64px;
    overflow:hidden;
  }
  .auth-left-bg {
    position:absolute; inset:0;
    background:radial-gradient(ellipse at 30% 40%, var(--accent-lo) 0%, transparent 60%);
    pointer-events:none;
  }
  .auth-left-quote {
    position:relative; z-index:1;
    max-width:400px;
  }
  .auth-quote-mark {
    font-family:'Bebas Neue',sans-serif;
    font-size:120px; line-height:.7;
    color:var(--accent-mid);
    pointer-events:none; user-select:none;
    margin-bottom:-8px;
  }
  .auth-quote-text {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(28px,3.5vw,42px);
    letter-spacing:.02em; line-height:1.05;
    color:var(--text-0);
    margin-bottom:20px;
  }
  .auth-quote-attr {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.22em; text-transform:uppercase;
    color:var(--text-2);
  }
  .auth-left-logo {
    position:absolute; top:36px; left:40px;
    font-family:'Bebas Neue',sans-serif;
    font-size:22px; letter-spacing:.14em;
    color:var(--accent);
  }
  .auth-left-stats {
    position:absolute; bottom:40px; left:40px; right:40px;
    display:flex; gap:28px;
  }
  .auth-stat-item {}
  .auth-stat-n {
    font-family:'Bebas Neue',sans-serif;
    font-size:32px; color:var(--text-0); letter-spacing:.02em; line-height:1;
  }
  .auth-stat-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--text-2); margin-top:2px;
  }

  .auth-right {
    flex:1; display:flex; flex-direction:column;
    justify-content:center; align-items:center;
    padding:60px 56px;
    overflow-y:auto;
  }
  .auth-form {
    width:100%; max-width:360px;
  }
  .auth-form-tag {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.28em; text-transform:uppercase;
    color:var(--accent); margin-bottom:8px;
  }
  .auth-form-title {
    font-family:'Bebas Neue',sans-serif;
    font-size:44px; letter-spacing:.02em; line-height:1;
    margin-bottom:6px;
  }
  .auth-form-sub {
    font-size:15px; color:var(--text-1); margin-bottom:32px; line-height:1.5;
  }
  .auth-field-wrap { margin-bottom:14px; }
  .auth-tab-row {
    display:flex; gap:0;
    border:1px solid var(--border-1); border-radius:8px;
    overflow:hidden; margin-bottom:28px;
  }
  .auth-tab {
    flex:1; padding:11px 0; text-align:center;
    font-family:'IBM Plex Mono',monospace;
    font-size:10px; letter-spacing:.14em; text-transform:uppercase;
    cursor:pointer; transition:all .18s;
    color:var(--text-2); background:transparent; border:none;
  }
  .auth-tab:hover:not(.on) { color:var(--text-1); background:var(--bg-2); }
  .auth-tab.on {
    background:var(--accent); color:#080807; font-weight:700;
  }
  .auth-divider {
    text-align:center; margin:20px 0;
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.18em; text-transform:uppercase;
    color:var(--text-2); position:relative;
  }
  .auth-divider::before, .auth-divider::after {
    content:''; position:absolute; top:50%;
    width:calc(50% - 22px); height:1px; background:var(--border-1);
  }
  .auth-divider::before { left:0; }
  .auth-divider::after  { right:0; }
  .auth-error {
    font-size:13px; color:var(--err);
    background:#BF5D5D14; border:1px solid #BF5D5D30;
    border-radius:6px; padding:10px 14px;
    margin-bottom:14px;
    font-family:'IBM Plex Mono',monospace; letter-spacing:.04em;
  }
  .auth-switch {
    text-align:center; margin-top:20px;
    font-size:14px; color:var(--text-2);
  }
  .auth-switch span {
    color:var(--accent); cursor:pointer; text-decoration:underline;
    text-underline-offset:3px;
  }

  /* ============================================================
     ONBOARDING SCREENS
  ============================================================ */
  .ob-screen {
    position:fixed; inset:0;
    background:var(--bg-0);
    display:flex; flex-direction:column;
    align-items:center; justify-content:flex-start;
    padding:48px 24px 120px;
    overflow-y:auto;
    animation:fadein .5s ease both;
  }
  .ob-inner {
    max-width:680px; width:100%;
    text-align:center;
    padding-bottom:24px;
  }
  /* Fixed bottom bar — always visible */
  .ob-footer {
    position:fixed; bottom:0; left:0; right:0;
    background:linear-gradient(to top, var(--bg-0) 70%, transparent);
    padding:24px 24px 32px;
    display:flex; flex-direction:column; align-items:center; gap:12px;
    z-index:10;
  }
  /* Scroll hint arrow */
  .ob-scroll-hint {
    font-family:"IBM Plex Mono",monospace;
    font-size:9px; letter-spacing:.2em; text-transform:uppercase;
    color:var(--text-2);
    display:flex; flex-direction:column; align-items:center; gap:4px;
    animation:bounce 1.8s ease-in-out infinite;
  }
  @keyframes bounce {
    0%,100% { transform:translateY(0); opacity:.6; }
    50%      { transform:translateY(5px); opacity:1; }
  }
  .ob-progress {
    display:flex; gap:6px; justify-content:center;
    margin-bottom:48px;
  }
  .ob-dot {
    width:24px; height:3px; border-radius:2px;
    background:var(--border-1); transition:all .4s;
  }
  .ob-dot.on { background:var(--accent); width:40px; }

  /* SCREEN 1 — Why You're Here */
  .ob-eyebrow {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.32em; text-transform:uppercase;
    color:var(--accent); margin-bottom:16px;
    animation:up .5s ease both;
  }
  .ob-headline {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(44px,7vw,84px);
    letter-spacing:.02em; line-height:.96;
    color:var(--text-0);
    margin-bottom:24px;
    animation:up .5s .07s ease both;
  }
  .ob-headline span { color:var(--accent); }
  .ob-body {
    font-size:17px; color:var(--text-1);
    line-height:1.7; max-width:520px;
    margin:0 auto 40px;
    animation:up .5s .14s ease both;
  }
  .ob-truth-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:10px; margin-bottom:40px; text-align:left;
    animation:up .5s .2s ease both;
  }
  .ob-truth {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:16px 18px;
    display:flex; gap:12px; align-items:flex-start;
    cursor:default;
    transition:border-color .2s, transform .2s, background .2s;
  }
  .ob-truth:hover {
    border-color:var(--border-accent);
    background:var(--bg-2);
    transform:translateY(-2px);
  }
  .ob-truth-icon {
    font-size:18px; flex-shrink:0; margin-top:1px;
  }
  .ob-truth-text {
    font-size:15px; color:var(--text-1); line-height:1.5;
  }
  .ob-truth-text strong { color:var(--text-0); display:block; margin-bottom:3px; font-size:16px; }

  /* SCREEN 2 — Who it's for */
  .ob-for-grid {
    display:grid; grid-template-columns:1fr 1fr 1fr;
    gap:10px; margin-bottom:40px; text-align:left;
    animation:up .5s .14s ease both;
  }
  .ob-for-card {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:18px;
    transition:border-color .2s, transform .2s, box-shadow .2s;
    cursor:default;
  }
  .ob-for-card:hover {
    border-color:var(--border-accent);
    transform:translateY(-3px);
    box-shadow:0 8px 24px rgba(0,0,0,.3);
  }
  .ob-for-card:hover .ob-for-icon { transform:scale(1.18); }
  .ob-for-icon {
    font-size:24px; margin-bottom:10px;
    display:block; transition:transform .2s;
  }
  .ob-for-title {
    font-family:'Bebas Neue',sans-serif;
    font-size:20px; letter-spacing:.04em; margin-bottom:6px;
    color:var(--text-0);
  }
  .ob-for-desc {
    font-size:14px; color:var(--text-1); line-height:1.5;
  }
  .ob-not-for {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:10px; padding:16px 20px;
    margin-bottom:40px; text-align:left;
    animation:up .5s .2s ease both;
  }
  .ob-not-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.2em; text-transform:uppercase;
    color:var(--err); margin-bottom:10px;
  }
  .ob-not-list {
    display:flex; flex-wrap:wrap; gap:8px;
  }
  .ob-not-item {
    font-size:13px; color:var(--text-2);
    padding:4px 10px; border-radius:4px;
    border:1px solid var(--border-1);
    text-decoration:line-through; text-decoration-color:var(--err);
    font-family:'IBM Plex Mono',monospace; letter-spacing:.04em;
  }

  /* SCREEN 3 — Induction */
  .ob-induction-bg {
    position:absolute; inset:0;
    background:radial-gradient(ellipse at 50% 30%, var(--accent-lo) 0%, transparent 65%);
    pointer-events:none;
  }
  .ob-oath {
    background:var(--bg-1); border:1px solid var(--border-accent);
    border-radius:14px; padding:28px 32px;
    text-align:left; margin-bottom:32px;
    animation:up .5s .14s ease both;
    position:relative;
  }
  .ob-oath::before {
    content:''; position:absolute;
    top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg, var(--accent), transparent);
    border-radius:14px 14px 0 0;
  }
  .ob-oath-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8px; letter-spacing:.24em; text-transform:uppercase;
    color:var(--accent); margin-bottom:16px;
    display:flex; align-items:center; gap:8px;
  }
  .ob-oath-label::before { content:'◆'; font-size:7px; }
  .ob-oath-line {
    font-size:16px; color:var(--text-0); line-height:1.7;
    padding:10px 8px; border-bottom:1px solid var(--border-0);
    border-radius:6px;
    transition:background .15s, color .15s, padding-left .15s;
    cursor:default;
  }
  .ob-oath-line:last-child { border-bottom:none; }
  .ob-oath-line:hover {
    background:var(--accent-lo);
    padding-left:14px;
    color:var(--text-0);
  }
  .ob-oath-line::before {
    content:'— '; color:var(--accent); font-weight:700;
    transition:content .15s;
  }
  .ob-cta-btn {
    width:100%; max-width:360px;
    padding:18px 0; border-radius:8px;
    background:var(--accent); color:#080807;
    font-family:'Bebas Neue',sans-serif;
    font-size:22px; letter-spacing:.12em;
    cursor:pointer; border:none;
    transition:all .18s; margin:0 auto; display:block;
    animation:up .5s .28s ease both;
    box-shadow: 0 4px 0 rgba(0,0,0,.4);
  }
  .ob-cta-btn:hover { opacity:.92; transform:translateY(-3px); box-shadow:0 8px 28px var(--accent-mid), 0 5px 0 rgba(0,0,0,.4); }
  .ob-cta-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,.4); }
  .ob-nav-row {
    display:flex; align-items:center; justify-content:center;
    gap:16px;
  }
  .ob-next-btn {
    padding:14px 40px; border-radius:8px;
    background:var(--accent); color:#080807;
    font-family:'Bebas Neue',sans-serif;
    font-size:18px; letter-spacing:.1em;
    cursor:pointer; border:none; transition:all .18s;
    box-shadow: 0 4px 0 rgba(0,0,0,.4);
  }
  .ob-next-btn:hover { opacity:.92; transform:translateY(-2px); box-shadow:0 6px 20px var(--accent-mid), 0 5px 0 rgba(0,0,0,.4); }
  .ob-next-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,.4); }
  .ob-skip {
    font-family:'IBM Plex Mono',monospace;
    font-size:9px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--text-2); cursor:pointer; transition:color .15s;
  }
  .ob-skip:hover { color:var(--text-1); }

  /* STREAK IGNITION */
  @keyframes streakIgnite {
    0%   { color:var(--warn); text-shadow:none; transform:scale(1); }
    20%  { color:#FFDD88; text-shadow:0 0 12px #D4922A, 0 0 28px #D4922Aaa; transform:scale(1.7); }
    50%  { color:#FFB830; text-shadow:0 0 20px #D4922A, 0 0 44px #D4922A88; transform:scale(1.45); }
    100% { color:var(--warn); text-shadow:none; transform:scale(1); }
  }
  .streak-ignite { animation:streakIgnite 1.6s ease forwards; }

  /* SPARK CANVAS */
  #forge-sparks { position:fixed; inset:0; pointer-events:none; z-index:9999; }
`;


// ============================================================
// SPARK CELEBRATION (completion animation)
// ============================================================
const SparkCanvas = ({ trigger }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const prevTrigger = useRef(false);

  const burst = (canvas) => {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");

    class Spark {
      constructor(x, y, fromSide) {
        this.x = x; this.y = y;
        // From sides: angle toward center-up; from bottom: spread upward
        let angle, speed;
        if (fromSide === "left") {
          angle = -Math.PI * (0.15 + Math.random() * 0.55); // up-right
          speed = 6 + Math.random() * 13;
        } else if (fromSide === "right") {
          angle = -Math.PI * (0.45 + Math.random() * 0.55); // up-left
          speed = 6 + Math.random() * 13;
        } else {
          angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
          speed = 5 + Math.random() * 14;
        }
        this.vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.9);
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.22 + Math.random() * 0.14;
        this.isStreak = Math.random() > 0.35;
        this.size = this.isStreak ? (0.8 + Math.random() * 1.8) : (1.5 + Math.random() * 3);
        this.life = 0;
        this.maxLife = 40 + Math.random() * 65;
        this.px = x; this.py = y;
        const palette = ["#D4922A","#FFB830","#FFDD88","#FF6A00","#FF9500","#FFCC44","#FF4500","#FFA040","#FFFFFF","#FF7020"];
        this.color = palette[Math.floor(Math.random() * palette.length)];
      }
      update() {
        this.px = this.x; this.py = this.y;
        this.vx *= 0.982; this.vy += this.gravity;
        this.x += this.vx; this.y += this.vy;
        this.life++;
      }
      draw(ctx) {
        const t = this.life / this.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85);
        ctx.globalAlpha = Math.max(0, alpha * 0.95);
        ctx.strokeStyle = this.color; ctx.fillStyle = this.color;
        if (this.isStreak) {
          const dx = this.x - this.px, dy = this.y - this.py;
          if (Math.sqrt(dx*dx+dy*dy) > 0.5) {
            ctx.beginPath(); ctx.lineWidth = this.size; ctx.lineCap = "round";
            ctx.moveTo(this.px, this.py); ctx.lineTo(this.x, this.y); ctx.stroke();
          }
        } else {
          ctx.beginPath(); ctx.arc(this.x, this.y, this.size*(1-t*0.4), 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      get dead() { return this.life >= this.maxLife || this.y > H + 30; }
    }

    const add = (x, y, side, count) => {
      for (let i = 0; i < count; i++) particlesRef.current.push(new Spark(x, y, side));
    };

    // Bottom wave — full width
    for (let i = 0; i < 160; i++) add(W*0.05 + Math.random()*W*0.9, H+5, "bottom", 1);
    // Left side bursts — 3 spawn points up the left edge
    setTimeout(() => {
      add(0, H*0.85, "left", 40);
      add(0, H*0.65, "left", 30);
      add(0, H*0.45, "left", 20);
    }, 60);
    // Right side bursts
    setTimeout(() => {
      add(W, H*0.85, "right", 40);
      add(W, H*0.65, "right", 30);
      add(W, H*0.45, "right", 20);
    }, 120);
    // Second bottom wave — more concentrated center
    setTimeout(() => {
      for (let i = 0; i < 80; i++) add(W*0.2+Math.random()*W*0.6, H+5, "bottom", 1);
    }, 90);
    // Ember trickle
    setTimeout(() => {
      for (let i = 0; i < 50; i++) add(W*0.1+Math.random()*W*0.8, H+5, "bottom", 1);
      add(0, H*0.5, "left", 15);
      add(W, H*0.5, "right", 15);
    }, 220);

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      particlesRef.current = particlesRef.current.filter(p => !p.dead);
      particlesRef.current.forEach(p => { p.update(); p.draw(ctx); });
      if (particlesRef.current.length > 0) frameRef.current = requestAnimationFrame(loop);
      else { frameRef.current = null; ctx.clearRect(0, 0, W, H); }
    };
    if (!frameRef.current) loop();
  };

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = [];
      burst(canvas);
    }
    prevTrigger.current = trigger;
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [trigger]);

  return <canvas ref={canvasRef} id="forge-sparks" />;
};

// ============================================================
// ENTRY SCREEN (Forge loader)
// ============================================================
const Entry = ({ onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"#080807", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:80, color:"#D4922A", letterSpacing:".1em" }}>FORGE</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".35em", textTransform:"uppercase", color:"#56524D", marginTop:4 }}>your discipline engine</div>
      <div style={{ width:150, height:1, background:"#1E1E1A", marginTop:48, overflow:"hidden" }}>
        <div style={{ height:1, background:"#D4922A", animation:"grow 2s ease forwards" }} />
      </div>
    </div>
  );
};

// ============================================================
// AUTH SCREEN (Login / Create Account)
// ============================================================
const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", attr: "Aristotle" },
  { text: "The successful warrior is the average man, with laser-like focus.", attr: "Bruce Lee" },
  { text: "It's not about having time. It's about making time.", attr: "— " },
  { text: "Suffer the pain of discipline, or suffer the pain of regret.", attr: "Jim Rohn" },
];

const Auth = ({ onLogin, onSignup }) => {
  const [mode,     setMode]     = useState("login"); // "login" | "signup"
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const quote = QUOTES[1];

  const validate = () => {
    if (mode === "signup" && !name.trim())        return "Name is required.";
    if (!email.includes("@"))                     return "Enter a valid email.";
    if (password.length < 6)                      return "Password must be 6+ characters.";
    return "";
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (mode === "login") onLogin(email, name || email.split("@")[0]);
    else                  onSignup(name.trim(), email);
  };

  return (
    <div className="auth-screen">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <div className="auth-left-logo">FORGE</div>

        <div className="auth-left-quote">
          <div className="auth-quote-mark">"</div>
          <div className="auth-quote-text">{quote.text}</div>
          <div className="auth-quote-attr">— {quote.attr}</div>
        </div>

        <div className="auth-left-stats">
          {[
            { n:"75", l:"Day hard reset" },
            { n:"0",  l:"Excuses allowed" },
            { n:"1",  l:"Standard: yours" },
          ].map(s => (
            <div key={s.l} className="auth-stat-item">
              <div className="auth-stat-n">{s.n}</div>
              <div className="auth-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form">
          {/* Tab toggle */}
          <div className="auth-tab-row">
            <button className={`auth-tab ${mode==="login"?"on":""}`}  onClick={() => { setMode("login");  setError(""); }}>Log In</button>
            <button className={`auth-tab ${mode==="signup"?"on":""}`} onClick={() => { setMode("signup"); setError(""); }}>Create Account</button>
          </div>

          <div className="auth-form-tag">Forge · Discipline Tracker</div>
          <div className="auth-form-title">{mode === "login" ? "Welcome Back." : "Begin Here."}</div>
          <div className="auth-form-sub">
            {mode === "login"
              ? "Your streak is waiting. Pick up where you left off."
              : "One account. One standard. No compromises."}
          </div>

          {error && <div className="auth-error">{error}</div>}

          {mode === "signup" && (
            <div className="auth-field-wrap">
              <div className="field-l">Your Name</div>
              <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
            </div>
          )}
          <div className="auth-field-wrap">
            <div className="field-l">Email</div>
            <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="auth-field-wrap">
            <div className="field-l">Password</div>
            <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          <button
            className="btn btn-a w100 mt16"
            style={{
              justifyContent:"center", padding:"14px", fontSize:15,
              letterSpacing:".04em", borderRadius:8,
              boxShadow:"0 4px 0 rgba(0,0,0,.4)",
              transition:"all .18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px var(--accent-mid), 0 5px 0 rgba(0,0,0,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 0 rgba(0,0,0,.4)"; }}
            onMouseDown={e  => { e.currentTarget.style.transform="translateY(2px)"; e.currentTarget.style.boxShadow="0 1px 0 rgba(0,0,0,.4)"; }}
            onMouseUp={e    => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px var(--accent-mid), 0 5px 0 rgba(0,0,0,.4)"; }}
            onClick={handleSubmit}
          >
            {mode === "login" ? "Enter the Forge →" : "Create My Account →"}
          </button>

          <div className="auth-switch">
            {mode === "login"
              ? <>No account? <span onClick={() => { setMode("signup"); setError(""); }}>Create one</span></>
              : <>Already have one? <span onClick={() => { setMode("login"); setError(""); }}>Log in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ONBOARDING — Screen 1: Why You're Here
// ============================================================
const OnboardWhy = ({ onNext, onSkip }) => (
  <>
  <div className="ob-screen">
    <div className="ob-inner">
      <div className="ob-progress">
        <div className="ob-dot on" /><div className="ob-dot" /><div className="ob-dot" />
      </div>
      <div className="ob-eyebrow">Why you're here</div>
      <div className="ob-headline">
        You're tired of<br /><span>almost.</span>
      </div>
      <div className="ob-body">
        Almost working out. Almost finishing the project. Almost becoming who you said you'd be. You've tried apps, systems, routines — and something always breaks down. Not this time.
      </div>
      <div className="ob-truth-grid">
        {[
          { icon:"🔁", title:"The cycle is real", body:"Start strong, fade out, reset. You know this pattern better than anyone." },
          { icon:"📵", title:"Distractions win daily", body:"Your phone, your comfort zone, your own negotiating mind — they're relentless." },
          { icon:"🧠", title:"Motivation isn't enough", body:"Motivation is a feeling. Feelings are unreliable. Systems outlast them." },
          { icon:"🪞", title:"You know what's possible", body:"The gap between who you are and who you could be — that gap is why you're here." },
        ].map(t => (
          <div key={t.title} className="ob-truth">
            <div className="ob-truth-icon">{t.icon}</div>
            <div className="ob-truth-text"><strong>{t.title}</strong>{t.body}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
  <div className="ob-footer">
    <div className="ob-scroll-hint">
      <span>scroll down</span>
      <span>↓</span>
    </div>
    <div className="ob-nav-row">
      <button className="ob-next-btn" onClick={onNext}>That's me. Keep going →</button>
      <div className="ob-skip" onClick={onSkip}>Skip intro</div>
    </div>
  </div>
  </>
);

// ============================================================
// ONBOARDING — Screen 2: Who Forge Is For
// ============================================================
const OnboardWho = ({ onNext, onSkip }) => (
  <>
  <div className="ob-screen">
    <div className="ob-inner">
      <div className="ob-progress">
        <div className="ob-dot" /><div className="ob-dot on" /><div className="ob-dot" />
      </div>
      <div className="ob-eyebrow">Who Forge is for</div>
      <div className="ob-headline">
        Built for<br /><span>builders.</span>
      </div>
      <div className="ob-body">
        Not everyone is ready for this. Forge is for the ones who've decided — really decided — that the old version of themselves isn't good enough.
      </div>
      <div className="ob-for-grid">
        {[
          { icon:"🏗️", title:"The Builder", desc:"Shipping projects, building habits, stacking skills. You need accountability, not inspiration." },
          { icon:"🔩", title:"The Grinder", desc:"Early mornings, late nights, no shortcuts. You're not looking for easy — you're looking for better." },
          { icon:"🎯", title:"The Focused", desc:"Done with scattered energy. You want one direction, relentless execution, measurable proof." },
          { icon:"🔄", title:"The Rebounder", desc:"You fell off before. You know what went wrong. You're back and this time it's different." },
          { icon:"⚡", title:"The High-Performer", desc:"You're already good. You want a system that keeps you accountable to your own standard." },
          { icon:"🌱", title:"The Starter", desc:"Day one. No history, no excuses. Just the decision to begin and the discipline to continue." },
        ].map(c => (
          <div key={c.title} className="ob-for-card">
            <div className="ob-for-icon">{c.icon}</div>
            <div className="ob-for-title">{c.title}</div>
            <div className="ob-for-desc">{c.desc}</div>
          </div>
        ))}
      </div>
      <div className="ob-not-for">
        <div className="ob-not-label">✕ Forge is not for</div>
        <div className="ob-not-list">
          {["People looking for easy wins","Excuse-makers","Passive trackers","Motivation-chasers"].map(x => (
            <div key={x} className="ob-not-item">{x}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
  <div className="ob-footer">
    <div className="ob-scroll-hint">
      <span>scroll down</span>
      <span>↓</span>
    </div>
    <div className="ob-nav-row">
      <button className="ob-next-btn" onClick={onNext}>I'm in →</button>
      <div className="ob-skip" onClick={onSkip}>Skip intro</div>
    </div>
  </div>
  </>
);

// ============================================================
// ONBOARDING — Screen 3: Induction
// ============================================================
const OnboardInduct = ({ onDone, userName }) => (
  <div className="ob-screen">
    <div className="ob-induction-bg" />
    <div className="ob-inner" style={{ position:"relative", zIndex:1 }}>
      <div className="ob-progress">
        <div className="ob-dot" /><div className="ob-dot" /><div className="ob-dot on" />
      </div>
      <div className="ob-eyebrow">Your induction</div>
      <div className="ob-headline" style={{ marginBottom:12 }}>
        Welcome to<br /><span>The Forge.</span>
      </div>
      <div className="ob-body" style={{ marginBottom:28 }}>
        {userName}, this is not an app. It's an environment. An environment built on one principle: <strong style={{ color:"var(--text-0)" }}>show up every single day.</strong>
      </div>
      <div className="ob-oath">
        <div className="ob-oath-label">The Forge Standard</div>
        {[
          "I do not negotiate with my past self.",
          "I show up on hard days. Especially on hard days.",
          "I track honestly. No vanity metrics. No lies.",
          "I accept that discomfort is the price of growth.",
          "I am not competing with others. I am competing with who I was yesterday.",
        ].map(line => (
          <div key={line} className="ob-oath-line">{line}</div>
        ))}
      </div>
      <button className="ob-cta-btn" onClick={onDone}>
        I ACCEPT. ENTER THE FORGE.
      </button>
      <div className="f-mono c-2 mt16" style={{ fontSize:9, letterSpacing:".14em", textAlign:"center" }}>
        YOUR STREAK STARTS TODAY. DON'T BREAK IT.
      </div>
    </div>
  </div>
);


// ============================================================
// DEEP WORK MODE
// ============================================================
const TIMER_PRESETS = [
  { label:"Pomodoro",   work:25, brk:5  },
  { label:"Long Focus", work:50, brk:10 },
  { label:"Sprint",     work:15, brk:3  },
  { label:"Custom",     work:25, brk:5  },
];

const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const DeepWork = ({ challenge, kpis, toggle, onExit }) => {
  const safeKpis = challenge.kpis || [];
  const doneTasks = safeKpis.filter(k => kpis[k.key]).length;

  // Timer state
  const [preset,      setPreset]      = useState(0);
  const [customWork,  setCustomWork]  = useState(25);
  const [customBrk,   setCustomBrk]  = useState(5);
  const [phase,       setPhase]       = useState("idle");   // idle | work | break | summary
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [cycle,       setCycle]       = useState(0);
  const [totalFocused,setTotalFocused]= useState(0);
  const [sessionTasks,setSessionTasks]= useState(doneTasks);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef(null);

  const workSecs = () => preset === 3 ? customWork * 60 : TIMER_PRESETS[preset].work * 60;
  const brkSecs  = () => preset === 3 ? customBrk  * 60 : TIMER_PRESETS[preset].brk  * 60;

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch(e) {}
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

  const endSession = () => {
    clearInterval(timerRef.current);
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
  }, [phase, preset, customWork, customBrk]);

  // Track task completions during session
  useEffect(() => {
    setSessionTasks(safeKpis.filter(k => kpis[k.key]).length);
  }, [kpis]);

  const progress = phase === "work"
    ? ((workSecs() - timeLeft) / workSecs()) * 100
    : phase === "break"
    ? ((brkSecs() - timeLeft) / brkSecs()) * 100
    : 0;

  const circumference = 2 * Math.PI * 80;

  if (showSummary) return (
    <div className="dw">
      <div style={{maxWidth:480,width:"100%",padding:"40px 24px",textAlign:"center"}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",color:"var(--accent)",textTransform:"uppercase",marginBottom:8}}>Session Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,letterSpacing:".04em",lineHeight:1,marginBottom:32}}>Good Work.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:32}}>
          {[
            { n: fmt(totalFocused + (phase==="work" ? workSecs()-timeLeft : 0)), l:"Time Focused" },
            { n: cycle,                  l:"Cycles Done" },
            { n: `${sessionTasks}/${safeKpis.length}`, l:"Tasks Done" },
          ].map(s => (
            <div key={s.l} style={{background:"var(--bg-2)",border:"1px solid var(--border-1)",borderRadius:10,padding:"16px 12px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"var(--accent)",lineHeight:1}}>{s.n}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".12em",textTransform:"uppercase",color:"var(--text-2)",marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",letterSpacing:".1em",marginBottom:24}}>
          {sessionTasks === safeKpis.length && safeKpis.length > 0
            ? "✓ All tasks completed. That's a perfect session."
            : sessionTasks > 0
            ? `${safeKpis.length - sessionTasks} task${safeKpis.length-sessionTasks===1?"":"s"} remaining for today.`
            : "No tasks ticked — but you still showed up."}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-a" onClick={()=>{setShowSummary(false);setPhase("idle");setCycle(0);setTotalFocused(0);}}>
            New Session
          </button>
          <button className="btn btn-g" onClick={onExit}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dw" style={{overflowY:"auto",paddingBottom:40}}>
      <div style={{maxWidth:520,width:"100%",padding:"40px 24px 0"}}>
        <div className="dw-tag">deep work · day {challenge.dayNum} of {challenge.totalDays}</div>

        {/* Timer Ring */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:32,marginBottom:32}}>
          <div style={{position:"relative",width:196,height:196}}>
            <svg width={196} height={196} style={{transform:"rotate(-90deg)"}}>
              <circle cx={98} cy={98} r={80} fill="none" stroke="var(--bg-3)" strokeWidth={8} />
              <circle cx={98} cy={98} r={80} fill="none"
                stroke={phase==="break"?"var(--ok)":"var(--accent)"}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress/100)}
                style={{transition:"stroke-dashoffset .9s linear, stroke .3s"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,letterSpacing:".02em",lineHeight:1,color:phase==="break"?"var(--ok)":"var(--text-0)"}}>
                {phase==="idle" ? fmt(workSecs()) : fmt(timeLeft)}
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-2)",marginTop:4}}>
                {phase==="idle"?"ready":phase==="work"?"focus":phase==="break"?"break":""}
              </div>
            </div>
          </div>

          {/* Cycle count */}
          {cycle > 0 && (
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".16em",color:"var(--accent)",marginTop:12,textTransform:"uppercase"}}>
              {cycle} cycle{cycle!==1?"s":""} complete · {fmt(totalFocused)} focused
            </div>
          )}
        </div>

        {/* Preset selector — only when idle */}
        {phase === "idle" && (
          <div style={{marginBottom:24}}>
            <div className="slabel">Timer Preset</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {TIMER_PRESETS.map((p,i) => (
                <button key={p.label} className={`btn ${preset===i?"btn-a":"btn-g"}`}
                  style={{fontSize:12}} onClick={()=>setPreset(i)}>
                  {p.label}{i<3?` · ${p.work}/${p.brk}`:""}
                </button>
              ))}
            </div>
            {preset === 3 && (
              <div style={{display:"flex",gap:12,marginTop:12,alignItems:"center"}}>
                <div>
                  <div className="field-l">Work (min)</div>
                  <input className="field" type="number" min={1} max={120} value={customWork}
                    onChange={e=>setCustomWork(Number(e.target.value))} style={{width:80}} />
                </div>
                <div>
                  <div className="field-l">Break (min)</div>
                  <input className="field" type="number" min={1} max={60} value={customBrk}
                    onChange={e=>setCustomBrk(Number(e.target.value))} style={{width:80}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:32}}>
          {phase === "idle" && (
            <button className="btn btn-a" style={{padding:"12px 40px",fontSize:16}} onClick={startWork}>
              Start Focus ▶
            </button>
          )}
          {(phase === "work" || phase === "break") && (
            <>
              <button className="btn btn-g" onClick={()=>{clearInterval(timerRef.current);setPhase("idle");setTimeLeft(0);}}>
                Pause
              </button>
              <button className="btn btn-a" style={{background:"var(--ok)",borderColor:"var(--ok)"}} onClick={endSession}>
                End Session
              </button>
            </>
          )}
        </div>

        {/* Tasks */}
        <div className="dv-label mt8">Today's Tasks — {doneTasks}/{safeKpis.length}</div>
        <TaskGrid tasks={safeKpis} taskState={kpis} toggle={toggle} />

        <div style={{display:"flex",justifyContent:"center",marginTop:32}}>
          <button className="btn btn-g" onClick={phase!=="idle"?endSession:onExit}>
            {phase!=="idle"?"End Session & Exit":"← Exit Deep Work"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TASK GRID COMPONENT
// ============================================================
const CompletionRing = ({ done, total, isScaled }) => {
  const r      = 28;
  const circ   = 2 * Math.PI * r;
  const pctVal = total > 0 ? done / total : 0;
  const offset = circ * (1 - pctVal);
  const color  = isScaled ? "#D4B22A"
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
  w1:      "Move for 15 min (scaled)",
  w2:      "Stretch or walk (scaled)",
  diet:    "Eat intentionally (scaled)",
  water:   "Drink intentionally (scaled)",
  read:    "Read 1 page (scaled)",
  photo:   "Note your state (scaled)",
  workout: "Move for 15 min (scaled)",
  mindset: "1 min reflection (scaled)",
  shipped: "Make progress on app (scaled)",
  deployed:"Push any commit (scaled)",
  docs:    "Write one paragraph (scaled)",
  no_ai:   "Limit AI use (scaled)",
  dw:      "30 min focused work (scaled)",
};

const TaskGrid = ({ tasks, taskState, toggle, isScaled }) => {
  const done  = tasks.filter(t => taskState[t.key]).length;
  const total = tasks.length;

  const catSummary = Object.entries(
    tasks.reduce((acc, t) => {
      const cat = t.cat || "other";
      if (!acc[cat]) acc[cat] = { done:0, total:0 };
      acc[cat].total++;
      if (taskState[t.key]) acc[cat].done++;
      return acc;
    }, {})
  );

  return (
    <div>
      {/* Ring header */}
      <div className="ring-wrap" style={ isScaled ? { borderColor:"#D4B22A30", background:"#D4B22A06" } : {}}>
        <CompletionRing done={done} total={total} isScaled={isScaled} />
        <div className="ring-info">
          <div className="ring-pct" style={{ color: isScaled ? "#D4B22A" : done===total && total>0 ? "var(--ok)" : done>0 ? "var(--accent)" : "var(--text-2)" }}>
            {total > 0 ? Math.round((done/total)*100) : 0}%
            {isScaled && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, marginLeft:8, color:"#D4B22A", letterSpacing:".1em" }}>SCALED</span>}
          </div>
          <div className="ring-sub">
            {isScaled
              ? "Scaled day — minimum viable tasks active"
              : done === total && total > 0 ? "All tasks done — excellent." : `${total - done} task${total-done===1?"":"s"} remaining`}
          </div>
          <div className="ring-cats">
            {catSummary.map(([cat, s]) => {
              const info = TASK_CATEGORIES[cat] || TASK_CATEGORIES.other;
              return (
                <div key={cat} style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:".1em",
                  padding:"2px 7px", borderRadius:3,
                  border:`1px solid ${info.color}44`,
                  color: s.done === s.total ? info.color : "var(--text-2)",
                  background: s.done === s.total ? `${info.color}15` : "transparent",
                  transition:"all .2s",
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
          const isDone    = taskState[t.key];
          const cat       = TASK_CATEGORIES[t.cat || "other"] || TASK_CATEGORIES.other;
          const cardColor = isScaled ? "#D4B22A" : cat.color;
          const label     = isScaled ? (SCALED_LABELS[t.key] || t.label + " (scaled)") : t.label;

          return (
            <div
              key={t.key}
              className={`task-card ${isDone ? "done" : ""}`}
              onClick={() => toggle(t.key)}
            >
              {isDone && (
                <div style={{
                  position:"absolute", inset:0, borderRadius:10,
                  background:`${cardColor}0C`,
                  border:`1px solid ${cardColor}30`,
                  pointerEvents:"none",
                }} />
              )}
              {isScaled && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:2,
                  background:"#D4B22A40", borderRadius:"10px 10px 0 0",
                  pointerEvents:"none",
                }} />
              )}
              <div className="task-card-top">
                <div className="task-card-label" style={ isScaled && !isDone ? { color:"var(--text-1)", fontSize:12 } : {}}>
                  {label}
                </div>
                <div className="task-cat-tag" style={{
                  color: cardColor,
                  borderColor:`${cardColor}44`,
                  background:`${cardColor}12`,
                }}>
                  {isScaled ? "MVT" : cat.label}
                </div>
              </div>
              <div className="task-card-bottom">
                <div className="task-done-stamp" style={{ color:cardColor }}>
                  ✓ Done
                </div>
                <div className="task-check" style={isDone ? {
                  background:cardColor, borderColor:cardColor,
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

// ============================================================
// RECOVERY MODAL
// ============================================================
const RecoveryModal = ({ onClose, onOwnIt, onInvoke, recoveryUsed }) => (
  <div className="overlay" onClick={onClose}>
    <div className="recovery-modal" onClick={e => e.stopPropagation()}>
      <div className="recovery-modal-tag">◈ Missed Day Detected</div>
      <div className="recovery-modal-title">You Missed Yesterday.</div>
      <div className="recovery-modal-desc">
        It's on the record. The Wall shows it. Now choose how to respond — this decision shapes your streak, not the miss itself.
      </div>

      <div className="recovery-path" onClick={onOwnIt}>
        <div className="recovery-path-icon">◼</div>
        <div>
          <div className="recovery-path-label" style={{ color:"var(--text-0)" }}>Own It</div>
          <div className="recovery-path-desc">
            Streak resets. The Wall shows an honest miss. You keep going with nothing hidden. The hard path — and the clean one.
          </div>
        </div>
      </div>

      <div
        className={`recovery-path ${recoveryUsed ? "btn-disabled" : ""}`}
        style={ recoveryUsed ? { opacity:.4, cursor:"not-allowed" } : {}}
        onClick={!recoveryUsed ? onInvoke : undefined}
      >
        <div className="recovery-path-icon">◈</div>
        <div>
          <div className="recovery-path-label" style={{ color: recoveryUsed ? "var(--text-2)" : "#4A8FD4" }}>
            Invoke Recovery {recoveryUsed ? "— Used" : ""}
          </div>
          <div className="recovery-path-desc">
            {recoveryUsed
              ? "You already used your one recovery this challenge. Own it or restart."
              : "One-time use per challenge. Streak pauses, not resets. The miss is marked ◈ on your Wall — visible, not erased. Use it wisely."}
          </div>
        </div>
      </div>

      {!recoveryUsed && (
        <div className="recovery-used-note">1 recovery remaining this challenge · cannot be used on consecutive days</div>
      )}
    </div>
  </div>
);

// ============================================================
// CHECK-IN MODE BAR
// ============================================================
const CheckInBar = ({ mode, setMode, recoveryUsed, onRecoveryClick, scaledDaysThisWeek }) => {
  const scaledLocked = scaledDaysThisWeek >= 2;

  return (
    <div className="cin-bar">
      <div className="cin-label">Today:</div>

      <div
        className={`cin-btn ${mode === "full" ? "active-full" : ""}`}
        onClick={() => setMode("full")}
      >
        ● Full Day
      </div>

      <div className="cin-sep" />

      <div
        className={`cin-btn ${mode === "scaled" ? "active-scaled" : ""} ${scaledLocked ? "btn-disabled" : ""}`}
        onClick={() => !scaledLocked && setMode("scaled")}
        title={scaledLocked ? "Max 2 scaled days per week reached" : "Reduced tasks — keeps identity alive"}
      >
        ◐ Scaled
        {scaledLocked && <span style={{ fontSize:8, marginLeft:4 }}>({scaledDaysThisWeek}/2)</span>}
      </div>

      <div className="cin-sep" />

      <div
        className={`cin-btn ${mode === "recovery" ? "active-recovery" : ""}`}
        onClick={onRecoveryClick}
        title="Missed yesterday? Choose your path."
      >
        ◈ Recovery
      </div>
    </div>
  );
};

// ============================================================
// CHALLENGE ARENA
// ============================================================
const ChallengeArena = ({ challenges, onAddSecondary, onViewChallenge }) => {
  const { main, secondary } = challenges;
  const mainPct   = pct(main.dayNum, main.totalDays);
  const remaining = 3 - secondary.length;

  return (
    <div>
      <div className="arena">

        {/* MAIN CHALLENGE — left column */}
        <div className="arena-main" onClick={() => onViewChallenge(main, "main")}>
          <div style={{ position:"absolute", top:8, right:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:".14em", color:"var(--accent)", zIndex:2, opacity:.7 }}>TAP TO VIEW ↗</div>
          <div className="arena-main-crown">Main Challenge</div>
          <div className="arena-main-name">{main.name}</div>
          <div className="arena-main-meta">
            DAY {main.dayNum} OF {main.totalDays} &nbsp;·&nbsp; {main.totalDays - main.dayNum} DAYS REMAINING
          </div>

          <div className="arena-main-stats">
            <div className="arena-ms">
              <div className="arena-ms-val" style={{ color:"var(--warn)" }}>{main.streak}</div>
              <div className="arena-ms-label">Streak</div>
            </div>
            <div className="arena-ms-divider" />
            <div className="arena-ms">
              <div className="arena-ms-val" style={{ color:"var(--ok)" }}>{main.consistency}%</div>
              <div className="arena-ms-label">Consistency</div>
            </div>
            <div className="arena-ms-divider" />
            <div className="arena-ms">
              <div className="arena-ms-val" style={{ color:"var(--accent)" }}>{mainPct}%</div>
              <div className="arena-ms-label">Complete</div>
            </div>
          </div>

          <div className="track" style={{ height:3 }}>
            <div className="fill" style={{ width:`${mainPct}%` }} />
          </div>
          <div className="flex between mt8 f-mono c-2" style={{ fontSize:9, letterSpacing:".06em" }}>
            <span>DAY 1</span><span>{mainPct}%</span><span>DAY {main.totalDays}</span>
          </div>

          <div style={{
            position:"absolute", right:24, top:-10,
            fontFamily:"'Bebas Neue',sans-serif",
            fontSize:"clamp(80px,10vw,130px)",
            color:"var(--text-3)", letterSpacing:".02em", lineHeight:.85,
            pointerEvents:"none", userSelect:"none", opacity:.5,
          }}>{main.dayNum}</div>
        </div>

        {/* SECONDARY + SLOTS — right column */}
        <div className="arena-side">
          {secondary.map(c => {
            const sp = pct(c.dayNum, c.totalDays);
            return (
              <div key={c.id} className="arena-sec" onClick={() => onViewChallenge(c, "secondary")}>
                <div style={{ position:"absolute", top:6, right:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:7, letterSpacing:".12em", color:c.color, opacity:.7 }}>↗</div>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c.color, borderRadius:"10px 10px 0 0" }} />
                <div className="arena-sec-tag" style={{ color:c.color }}>{c.tag}</div>
                <div className="arena-sec-name">{c.name}</div>
                <div className="arena-sec-meta">DAY {c.dayNum}/{c.totalDays} &nbsp;·&nbsp; {c.streak}🔥 &nbsp;·&nbsp; {c.consistency}%</div>
                <div className="arena-sec-bar">
                  <div className="arena-sec-fill" style={{ width:`${sp}%`, background:c.color }} />
                </div>
                <div className="flex between mt8 f-mono c-2" style={{ fontSize:8, letterSpacing:".06em" }}>
                  <span>{sp}% done</span><span>{c.totalDays - c.dayNum}d left</span>
                </div>
              </div>
            );
          })}

          {remaining > 0 && Array.from({ length: remaining }).map((_, i) => (
            <div key={`slot-${i}`} className="arena-slot" onClick={onAddSecondary}>
              <div className="arena-slot-icon">+</div>
              <div className="arena-slot-label">Add Secondary</div>
              <div className="arena-slot-hint">Must end within {main.totalDays} days</div>
            </div>
          ))}
        </div>

      </div>

      {secondary.length > 0 && (
        <div className="f-mono c-2 mt8" style={{ fontSize:8, letterSpacing:".08em", textAlign:"right" }}>
          {secondary.length}/3 secondary · all must end within main challenge timeframe
        </div>
      )}
    </div>
  );
};

// ============================================================
// AI INSIGHT BLOCK
// ============================================================
const MOCK_INSIGHTS = {
  Stoic:           "Day 28. Workout 1 completion is at 94% — hold the standard. Diet compliance drops every Thursday; identify the variable and eliminate it. 61% on reading is the weak link. Either commit or remove it from the list.",
  Coach:           "You're building something real here — 12 days straight is no accident. I'm noticing a Thursday pattern where your energy dips. Let's front-load your hardest tasks before midweek. Your reading habit is the one to protect right now — it compounds quietly.",
  "Drill Sergeant": "28 days in and reading is sitting at 61%. That's not a habit, that's a suggestion. Thursday is where discipline goes to die for you — not anymore. Tighten up or admit you didn't actually want this.",
};

const AIInsight = ({ tone, mission }) => {
  const [loading,   setLoading]   = useState(false);
  const [insight,   setInsight]   = useState(MOCK_INSIGHTS[tone] || MOCK_INSIGHTS["Coach"]);
  const [lastUpdate,setLastUpdate] = useState("Today, 8:04 AM");

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setInsight(MOCK_INSIGHTS[tone] || MOCK_INSIGHTS["Coach"]);
    setLastUpdate("Just now");
    setLoading(false);
  };

  useEffect(() => {
    setInsight(MOCK_INSIGHTS[tone] || MOCK_INSIGHTS["Coach"]);
  }, [tone]);

  return (
    <div className="ai-block">
      <div className="ai-block-header">
        <div className="ai-block-label">
          <div className="ai-dot" />
          Forge Intelligence · {tone} Mode
        </div>
        <button className="btn btn-g" style={{ padding:"4px 12px", fontSize:10 }} onClick={generate} disabled={loading}>
          {loading ? "Thinking..." : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="ai-text-loading">Analysing your last 7 days...</div>
      ) : (
        <div className="ai-text">"{insight}"</div>
      )}

      <div className="ai-footer">
        <div className="ai-timestamp">Last updated: {lastUpdate}</div>
        {mission && (
          <div className="f-mono c-2" style={{ fontSize:9, letterSpacing:".06em" }}>
            Mission on file ✓
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// HOME
// ============================================================
const Home = ({ challenge, challenges, kpis, toggle, onDW, tone, mission, onAddSecondary, userName, onViewChallenge }) => {
  const safekpis = challenge.kpis || [];
  const done  = safekpis.filter(k => kpis[k.key]).length;
  const total = safekpis.length;
  const p     = pct(challenge.dayNum, challenge.totalDays);

  const [dayMode,            setDayMode]            = useState("full");
  const [recoveryUsed,       setRecoveryUsed]       = useState(false);
  const [showRecovery,       setShowRecovery]       = useState(false);
  const [scaledDaysThisWeek] = useState(1);

  const handleRecoveryClick    = () => setShowRecovery(true);
  const handleOwnIt            = () => { setDayMode("full"); setShowRecovery(false); };
  const handleInvokeRecovery   = () => { setDayMode("recovery"); setRecoveryUsed(true); setShowRecovery(false); };

  const isScaled   = dayMode === "scaled";
  const isRecovery = dayMode === "recovery";

  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  const JARVIS_MESSAGES = {
    morning:   `Day ${challenge.dayNum} is live. ${challenge.totalDays - challenge.dayNum} days remain on your main challenge. Your streak is at ${challenge.streak} — don't let it end here.`,
    afternoon: mission || `Day ${challenge.dayNum} of ${challenge.totalDays}. Stay locked in.`,
    evening:   `Evening check-in. ${done === total ? "All tasks done — strong close." : `${total - done} task${total-done===1?"":"s"} still open. Finish strong.`}`,
    night:     `Late session. Day ${challenge.dayNum} of ${challenge.totalDays}. ${done === total ? "Logged and done." : "Wrap it up."}`,
  };

  return (
    <div className="page">
      {/* JARVIS HEADER */}
      <div className="jarvis-header a0">
        <div className="jarvis-tag">Forge · {fmtDate()}</div>
        <div className="jarvis-greeting">
          Good {timeOfDay}, <span className="jarvis-name">{userName}</span>.
        </div>
        <div className="jarvis-status" style={{ marginTop:8 }}>
          <div className="jarvis-status-dot" />
          <div className="jarvis-status-text">
            {challenge.name} · Day {challenge.dayNum} · {challenge.streak} day streak
          </div>
        </div>
        {mission && (
          <div className="mission-anchor" style={{ marginTop:16 }}>
            <div className="mission-anchor-text">{mission}</div>
          </div>
        )}
      </div>

      {/* AI INSIGHT */}
      <div className="a1 mt24">
        <AIInsight tone={tone} mission={mission} />
      </div>

      {/* CHALLENGE ARENA */}
      <div className="a2 mt24">
        <div className="flex between center mb12">
          <div className="slabel" style={{ marginBottom:0 }}>Active Challenges</div>
          <div className="f-mono c-2" style={{ fontSize:8, letterSpacing:".08em" }}>
            1 MAIN · UP TO 3 SECONDARY
          </div>
        </div>
        <ChallengeArena challenges={challenges} onAddSecondary={onAddSecondary} onViewChallenge={onViewChallenge} />
      </div>

      {/* Stats */}
      <div className="stats a3 mt20">
        {[
          { n:challenge.streak,            l:"Streak 🔥",     c:"c-warn" },
          { n:`${challenge.consistency}%`, l:"Consistency",   c:"c-ok"   },
          { n:`${done}/${total}`,          l:"Today's Tasks", c:""       },
        ].map((s,i) => (
          <div key={i} className="stat">
            <div className={`stat-n ${s.c}`}>{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="a4 mt24">
        <div className="flex between center mb12">
          <div className="slabel" style={{ marginBottom:0 }}>Today's Tasks</div>
          {isRecovery && (
            <div className="f-mono" style={{ fontSize:8, letterSpacing:".1em", color:"#4A8FD4" }}>◈ RECOVERY ACTIVE</div>
          )}
        </div>

        {/* CHECK-IN MODE BAR */}
        <CheckInBar
          mode={dayMode}
          setMode={setDayMode}
          recoveryUsed={recoveryUsed}
          onRecoveryClick={handleRecoveryClick}
          scaledDaysThisWeek={scaledDaysThisWeek}
        />

        {/* CONTEXTUAL BANNERS */}
        {isScaled && (
          <div className="scaled-banner">
            <div className="scaled-icon">◐</div>
            <div>
              <div className="scaled-title">Scaled Day Active</div>
              <div className="scaled-desc">
                Minimum viable tasks shown. Completions count at 50% toward consistency. Streak stays intact. Max 2 scaled days per week.
              </div>
            </div>
          </div>
        )}

        {isRecovery && (
          <div className="recovery-banner">
            <div className="scaled-icon">◈</div>
            <div>
              <div className="recovery-title">Recovery Protocol Active</div>
              <div className="scaled-desc">
                Streak paused — not reset. Yesterday's miss is marked ◈ on your Wall. Complete today fully to resume. Recovery used: 1/1 this challenge.
              </div>
            </div>
          </div>
        )}

        <TaskGrid
          tasks={safekpis}
          taskState={kpis}
          toggle={toggle}
          isScaled={isScaled}
        />
      </div>

      {/* RECOVERY MODAL */}
      {showRecovery && (
        <RecoveryModal
          onClose={() => setShowRecovery(false)}
          onOwnIt={handleOwnIt}
          onInvoke={handleInvokeRecovery}
          recoveryUsed={recoveryUsed}
        />
      )}
    </div>
  );
};

// ============================================================
// WALL
// ============================================================
const groupByMonth = (wall) => {
  const months = {};
  wall.forEach(d => {
    const key = d.date.slice(0, 7);
    const label = new Date(d.date + "T00:00:00").toLocaleString("en-US", { month: "long", year: "numeric" });
    if (!months[key]) months[key] = { label, days: [] };
    months[key].days.push(d);
  });
  return Object.values(months);
};

const COMPLETED_CHALLENGES = []; // populated from DB in future

const Wall = ({ challenge, challenges }) => {
  // If user has no challenge yet, show empty state
  if (!challenges.main) return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Proof of Work</div>
        <div className="pg-title">The Wall</div>
      </div>
      <div style={{marginTop:64,textAlign:"center",padding:"48px 0"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"var(--text-3)",letterSpacing:".04em",marginBottom:12}}>Nothing Here Yet</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-2)",letterSpacing:".12em",textTransform:"uppercase"}}>Come back when you've started a challenge</div>
      </div>
    </div>
  );

  const strong  = challenge.wall.filter(d => d.score && d.score >= 75).length;
  const missed  = challenge.wall.filter(d => d.score === 0).length;
  const grouped = groupByMonth(challenge.wall);
  const allChallenges = [challenges.main, ...challenges.secondary].filter(Boolean);

  // Scoreboard totals — only real data, zeros for new users
  const totalCompleted   = COMPLETED_CHALLENGES.length;
  const bestConsistency  = totalCompleted > 0
    ? Math.max(...COMPLETED_CHALLENGES.map(c => c.consistency), challenge.consistency)
    : challenge.consistency || 0;
  const totalDaysForged  = COMPLETED_CHALLENGES.reduce((s,c) => s + c.totalDays, 0) + (challenge.dayNum || 0);

  return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Proof of Work</div>
        <div className="pg-title">The Wall</div>
        <div className="pg-sub">Every cell is a day. Every shade is effort.</div>
      </div>

      {/* SCOREBOARD */}
      <div className="a1 mt24">
        <div className="slabel">All-Time Scoreboard</div>
        <div className="scoreboard">
          {[
            { n:totalCompleted,              l:"Challenges Completed", c:"c-ok"   },
            { n:totalDaysForged,             l:"Total Days Forged",    c:"c-acc"  },
            { n:`${bestConsistency}%`,       l:"Best Consistency",     c:"c-warn" },
            { n:challenge.streak,            l:"Current Streak 🔥",   c:"c-warn" },
          ].map(s => (
            <div key={s.l} className="sb-card">
              <div className={`sb-card-n ${s.c}`}>{s.n}</div>
              <div className="sb-card-l">{s.l}</div>
            </div>
          ))}
        </div>

        {totalCompleted > 0 && (
          <div style={{ marginTop:12 }}>
            <div className="slabel" style={{ marginBottom:8 }}>Completed Challenges</div>
            <div className="sb-trophy-row">
              {COMPLETED_CHALLENGES.map(c => (
                <div key={c.id} className="sb-trophy">
                  <div className="sb-trophy-icon">🏆</div>
                  <div>
                    <div className="sb-trophy-name">{c.name}</div>
                    <div className="sb-trophy-meta">{c.totalDays}D · {c.consistency}% CONSISTENCY · {c.completedDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ONGOING CHALLENGES */}
      <div className="a2 mt24">
        <div className="slabel">Ongoing Challenges</div>
        <div className="flex col g8">
          {allChallenges.map(c => (
            <div key={c.id} className="oc-card">
              <div className="oc-bar-wrap">
                <div className="oc-name">{c.name}</div>
                <div className="oc-meta">DAY {c.dayNum} OF {c.totalDays} &nbsp;·&nbsp; {c.streak} DAY STREAK &nbsp;·&nbsp; {c.consistency}% CONSISTENCY</div>
                <div className="oc-track">
                  <div className="oc-fill" style={{ width:`${pct(c.dayNum, c.totalDays)}%`, background:c.color || "var(--accent)" }} />
                </div>
              </div>
              <div className="oc-pct" style={{ color:c.color || "var(--accent)" }}>{pct(c.dayNum, c.totalDays)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* WALL GRID — grouped by month */}
      <div className="a2 mt32">
        {/* Legend */}
        <div className="flex between center mb16">
          <div className="slabel" style={{ marginBottom:0 }}>Consistency Grid</div>
          <div className="flex g8 center f-mono c-2" style={{ fontSize:9, letterSpacing:".06em" }}>
            <span>LESS</span>
            {[1,30,55,80,100].map(v => (
              <div key={v} style={{ width:10, height:10, borderRadius:2, background:wallColor(v) }} />
            ))}
            <span>MORE</span>
          </div>
        </div>

        <div className="card" style={{ padding:"20px 20px 16px" }}>
          {/* Day-of-week header — shown once */}
          <div className="wall-grid mb8">
            {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
              <div key={d} className="f-mono c-2" style={{ fontSize:7, textAlign:"center", letterSpacing:".08em", paddingBottom:4 }}>{d}</div>
            ))}
          </div>

          {grouped.map((month, mi) => (
            <div key={mi}>
              <div className="month-label">{month.label.toUpperCase()}</div>
              <div className="wall-grid" style={{ marginBottom:4 }}>
                {month.days.map((d, i) => (
                  <div
                    key={i}
                    className={`cell${d.isToday?" today":""}`}
                    style={{ background: wallColor(d.score) }}
                  >
                    <div className="cell-date">{fmtCellDate(d.date)}</div>
                    {d.score !== null && d.score > 0 && (
                      <div className="cell-score">{d.score}%</div>
                    )}
                    <div className="ctip">
                      {fmtCellDate(d.date)}{d.isToday?" · TODAY":""} &nbsp;·&nbsp; {d.score !== null ? `${d.score}% complete` : "Not logged"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats a3 mt24">
        {[
          { n:strong,           l:"Strong Days (75%+)",  c:"c-ok"   },
          { n:missed,           l:"Missed Days",         c:"c-err"  },
          { n:challenge.streak, l:"Current Streak 🔥",  c:"c-warn" },
        ].map((s,i) => (
          <div key={i} className="stat">
            <div className={`stat-n ${s.c}`}>{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// CHALLENGE DETAIL MODAL
// ============================================================
const ChallengeDetailModal = ({ challenge, mission, onClose, onEdit }) => {
  const [editingTasks, setEditingTasks] = useState(false);
  const [tasks, setTasks] = useState((challenge.kpis || []).map(k => ({ ...k })));

  const addTask    = () => setTasks(t => [...t, { key:`task_${Date.now()}`, label:"", cat:"other" }]);
  const removeTask = (key) => setTasks(t => t.filter(x => x.key !== key));
  const updateTask = (key, val) => setTasks(t => t.map(x => x.key === key ? { ...x, label:val } : x));

  const saveEdits = () => {
    onEdit({ ...challenge, kpis: tasks.filter(t => t.label.trim()) });
    setEditingTasks(false);
  };

  const p = pct(challenge.dayNum, challenge.totalDays);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="cdm" onClick={e => e.stopPropagation()}>

        {/* HERO */}
        <div className="cdm-hero">
          <div style={{ position:"absolute", right:20, top:-8, fontFamily:"'Bebas Neue',sans-serif", fontSize:100, color:"var(--text-3)", lineHeight:.85, pointerEvents:"none", userSelect:"none", opacity:.45, zIndex:0 }}>{challenge.dayNum}</div>
          <div className="cdm-tag">★ {challenge.tag || "MAIN CHALLENGE"}</div>
          <div className="cdm-name">{challenge.name}</div>
          <div className="cdm-meta">DAY {challenge.dayNum} OF {challenge.totalDays} · {challenge.totalDays - challenge.dayNum} DAYS REMAINING</div>
          <div className="cdm-stats">
            <div><div className="cdm-stat-v" style={{ color:"var(--warn)" }}>{challenge.streak}</div><div className="cdm-stat-l">Streak</div></div>
            <div style={{ width:1, background:"var(--border-1)", alignSelf:"stretch", margin:"0 4px" }} />
            <div><div className="cdm-stat-v" style={{ color:"var(--ok)" }}>{challenge.consistency}%</div><div className="cdm-stat-l">Consistency</div></div>
            <div style={{ width:1, background:"var(--border-1)", alignSelf:"stretch", margin:"0 4px" }} />
            <div><div className="cdm-stat-v" style={{ color:"var(--accent)" }}>{p}%</div><div className="cdm-stat-l">Complete</div></div>
          </div>
          <div style={{ marginTop:14, position:"relative", zIndex:1 }}>
            <div style={{ height:3, background:"var(--bg-3)", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${p}%`, background:"var(--accent)", borderRadius:2, transition:"width 1s" }} />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="cdm-body">

          {/* MISSION */}
          {mission && (
            <div className="cdm-section">
              <div className="cdm-section-label">Your Mission</div>
              <div className="cdm-mission">
                <div className="cdm-mission-text">{mission}</div>
              </div>
            </div>
          )}

          {/* DAILY TASKS */}
          <div className="cdm-section">
            <div className="cdm-section-label">
              Daily Tasks ({tasks.length})
              <button className="cdm-edit-btn" onClick={() => { setEditingTasks(!editingTasks); if(editingTasks) saveEdits(); }}>
                {editingTasks ? "Save Changes" : "✎ Edit Tasks"}
              </button>
            </div>

            {editingTasks ? (
              <div className="flex col g6">
                {tasks.map((t, i) => (
                  <div key={t.key} className="task-row">
                    <span className="task-drag">⠿</span>
                    <input className="task-input" value={t.label}
                      onChange={e => updateTask(t.key, e.target.value)}
                      placeholder={`Task ${i+1}`} />
                    {tasks.length > 1 && <div className="task-remove" onClick={() => removeTask(t.key)}>✕</div>}
                  </div>
                ))}
                <button className="add-task-btn" onClick={addTask}>+ Add task</button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="f-mono c-2" style={{ fontSize:13, padding:"12px 0" }}>No tasks defined yet. Click "Edit Tasks" to add some.</div>
            ) : (
              <div className="cdm-task-list">
                {tasks.map(t => {
                  const cat = TASK_CATEGORIES[t.cat || "other"] || TASK_CATEGORIES.other;
                  return (
                    <div key={t.key} className="cdm-task-row">
                      <div className="cdm-task-label">{t.label}</div>
                      {t.nonNeg && <div className="cdm-nn-badge">◆ NON-NEG</div>}
                      <div className="cdm-task-cat" style={{ color:cat.color, borderColor:`${cat.color}44`, background:`${cat.color}12` }}>
                        {cat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex g8">
            {editingTasks
              ? <button className="btn btn-a" style={{ flex:1, justifyContent:"center" }} onClick={saveEdits}>Save Changes</button>
              : <button className="btn btn-g" style={{ flex:1, justifyContent:"center" }} onClick={onClose}>Close</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// LIBRARY
// ============================================================
const Library = ({ onPick, isSecondaryMode, onClose }) => {
  const [mode, setMode] = useState(isSecondaryMode ? "secondary" : "main");

  return (
    <div className={isSecondaryMode ? "" : "page"} style={isSecondaryMode ? { padding:"28px" } : {}}>
      {!isSecondaryMode && (
        <div className="a0">
          <div className="pg-tag">Challenge Library</div>
          <div className="pg-title">Start a Challenge</div>
          <div className="pg-sub">Pre-built programs. Or define your own rules.</div>
        </div>
      )}
      {isSecondaryMode && (
        <div style={{ marginBottom:20 }}>
          <div className="modal-tag">Add Secondary Challenge</div>
          <div className="modal-title" style={{ fontSize:28 }}>Pick Your Next Front</div>
          <div className="modal-desc" style={{ marginBottom:0 }}>Choose a template to run alongside your main challenge.</div>
        </div>
      )}

      {!isSecondaryMode && (
        <div className="lib-mode-row" style={{ marginTop:24 }}>
          <button className={`lib-mode-btn ${mode==="main"?"on":""}`}      onClick={() => setMode("main")}>Set as Main</button>
          <button className={`lib-mode-btn ${mode==="secondary"?"on":""}`} onClick={() => setMode("secondary")}>Add as Secondary</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginTop: isSecondaryMode ? 0 : 4 }}>
        {TEMPLATES.map((t,i) => (
          <div key={t.id} className={`tpl a${Math.min(i+1,5)}`}
            onClick={() => onPick(t, mode === "secondary" || isSecondaryMode)}>
            <div className="tpl-tag">{t.tag} · {t.duration}D</div>
            <div className="tpl-name">{t.name}</div>
            <div className="tpl-desc">{t.kpis.length > 0 ? `${t.kpis.length} daily tasks` : "Define your own tasks"}</div>
            <div style={{ marginTop:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:".14em", textTransform:"uppercase", color:"var(--accent)", opacity:.8 }}>
              {mode === "secondary" || isSecondaryMode ? "→ Add as Secondary" : "→ Set as Main"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS
// ============================================================
const Settings = ({ theme, setTheme, tone, setTone, userName, setUserName }) => {
  const themes = [
    { id:"forge", c:"#D4922A", l:"Forge" },
    { id:"slate", c:"#2A4A38", l:"Slate" },
    { id:"iron",  c:"#4A8FD4", l:"Iron"  },
  ];
  const tones = ["Stoic","Coach","Drill Sergeant"];

  return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Preferences</div>
        <div className="pg-title">Settings</div>
      </div>

      <div className="flex col g16 mt32">
        <div className="srow a1">
          <div className="srow-title">Your Name</div>
          <div className="srow-desc">Used in the dashboard greeting.</div>
          <input
            className="field"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Your name"
            style={{ maxWidth:260 }}
          />
        </div>

        <div className="srow a2">
          <div className="srow-title">Theme</div>
          <div className="srow-desc">Unlock more themes as you level up.</div>
          <div className="flex g16 center">
            {themes.map(t => (
              <div key={t.id} className="flex col center g8" style={{ cursor:"pointer" }} onClick={() => setTheme(t.id)}>
                <div className={`swatch ${theme===t.id?"on":""}`} style={{ background:t.c }} />
                <span className="f-mono c-2" style={{ fontSize:9, letterSpacing:".1em" }}>{t.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="srow a3">
          <div className="srow-title">AI Tone</div>
          <div className="srow-desc">How Forge Intelligence speaks in your daily debrief and weekly synthesis.</div>
          <div className="flex g8 wrap">
            {tones.map(t => (
              <button key={t} className={`btn ${tone===t?"btn-a":"btn-g"}`} onClick={() => setTone(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="srow a4">
          <div className="srow-title">Discord Webhook</div>
          <div className="srow-desc">One-way push — milestones and streaks post to your server. Private data never leaves the app.</div>
          <div className="field-l">Webhook URL</div>
          <input className="field" placeholder="https://discord.com/api/webhooks/..." />
          <button className="btn btn-g mt12" style={{ fontSize:12 }}>Send Test →</button>
        </div>

        <div className="srow a5">
          <div className="srow-title">Data</div>
          <div className="srow-desc">All data lives locally on your device. Export anytime for backup or future cloud sync.</div>
          <div className="flex g8">
            <button className="btn btn-g">Export JSON</button>
            <button className="btn btn-g">Import JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHALLENGE CREATION WIZARD
// ============================================================
const ChallengeWizard = ({ tpl, onClose, onStart, isSecondary, maxDays }) => {
  const [step,    setStep]    = useState(1);
  const [name,    setName]    = useState(tpl?.id === "custom" ? "" : tpl?.name || "");
  const [days,    setDays]    = useState(tpl?.duration || 30);
  const [mission, setMission] = useState("");
  const [tasks,   setTasks]   = useState(
    tpl?.kpis?.length > 0
      ? tpl.kpis.map((k,i) => ({ id: i, label: k.label }))
      : [{ id: 0, label: "" }]
  );
  const [nonNeg,  setNonNeg]  = useState([]);

  const addTask      = () => setTasks(t => [...t, { id: Date.now(), label: "" }]);
  const removeTask   = (id) => setTasks(t => t.filter(x => x.id !== id));
  const updateTask   = (id, val) => setTasks(t => t.map(x => x.id === id ? { ...x, label: val } : x));
  const toggleNonNeg = (id) => setNonNeg(n => n.includes(id) ? n.filter(x => x !== id) : [...n, id]);

  const STEPS = isSecondary
    ? ["Setup", "Tasks", "Confirm"]
    : ["Setup", "Mission", "Tasks", "Non-Negotiables", "Confirm"];
  const totalSteps = STEPS.length;

  const canNext = () => {
    if (step === 1) return name.trim().length > 0 && (!maxDays || parseInt(days) <= maxDays);
    if (!isSecondary && step === 2) return mission.trim().length > 0;
    const taskStep = isSecondary ? 2 : 3;
    if (step === taskStep) return tasks.some(t => t.label.trim().length > 0);
    return true;
  };

  const validTasks = tasks.filter(t => t.label.trim());

  const handleStart = () => {
    onStart({ name, days, mission, nonNeg, tasks: validTasks, isSecondary });
  };

  // Map logical step to STEPS label
  const stepLabel = STEPS[step - 1];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width:540 }}>

        {/* Step indicator */}
        <div className="wizard-steps">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "active" : "";
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : 0 }}>
                <div className={`wstep ${state}`}>
                  <div className="wstep-num">{n < step ? "✓" : n}</div>
                  <span style={{ display: step === n ? "inline" : "none" }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="wstep-line" />}
              </div>
            );
          })}
        </div>

        {/* STEP 1 — Setup (all flows) */}
        {step === 1 && (
          <div className="flex col g16">
            <div>
              <div className="modal-tag">{isSecondary ? "SECONDARY CHALLENGE" : tpl?.tag}</div>
              <div className="modal-title">{tpl?.id === "custom" ? "Custom Challenge" : tpl?.name}</div>
              <div className="modal-desc">
                {isSecondary
                  ? `Name your secondary challenge. Max duration: ${maxDays} days.`
                  : "Name your challenge and set its duration."}
              </div>
            </div>
            <div>
              <div className="field-l">Challenge Name</div>
              <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="My Challenge" />
            </div>
            <div>
              <div className="field-l">Duration (days){maxDays ? ` — max ${maxDays}` : ""}</div>
              <input
                className="field" type="number" value={days}
                min={1} max={maxDays || 365}
                onChange={e => setDays(e.target.value)}
                style={{ borderColor: maxDays && parseInt(days) > maxDays ? "var(--err)" : undefined }}
              />
              {maxDays && parseInt(days) > maxDays && (
                <div className="f-mono mt8" style={{ fontSize:10, color:"var(--err)", letterSpacing:".08em" }}>
                  Must be ≤ {maxDays} days (main challenge length)
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — Mission (main flow only) */}
        {!isSecondary && step === 2 && (
          <div className="flex col g16">
            <div>
              <div className="modal-title" style={{ fontSize:26 }}>Who are you becoming?</div>
              <div className="modal-desc">This anchors everything. Shown daily on your dashboard and shapes how the AI coaches you.</div>
            </div>
            <div>
              <div className="field-l">Your Mission Statement</div>
              <textarea
                className="textarea" rows={4} value={mission}
                onChange={e => setMission(e.target.value.slice(0, 300))}
                placeholder="I am becoming someone who shows up every day without negotiating with myself..."
              />
              <div className="f-mono c-2 mt8" style={{ fontSize:9, letterSpacing:".06em" }}>
                {mission.length}/300
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 (main) / STEP 2 (secondary) — Daily Tasks */}
        {((isSecondary && step === 2) || (!isSecondary && step === 3)) && (
          <div className="flex col g16">
            <div>
              <div className="modal-title" style={{ fontSize:26 }}>Daily Tasks</div>
              <div className="modal-desc">
                {tpl?.kpis?.length > 0 ? "Pre-filled from the template. Edit or add your own." : "Define what you complete every single day."}
              </div>
            </div>
            <div className="flex col g6">
              {tasks.map((t, i) => (
                <div key={t.id} className="task-row">
                  <span className="task-drag">⠿</span>
                  <input
                    className="task-input" value={t.label}
                    onChange={e => updateTask(t.id, e.target.value)}
                    placeholder={`Task ${i + 1}`}
                  />
                  {tasks.length > 1 && (
                    <div className="task-remove" onClick={() => removeTask(t.id)}>✕</div>
                  )}
                </div>
              ))}
              <button className="add-task-btn" onClick={addTask}>+ Add task</button>
            </div>
          </div>
        )}

        {/* STEP 4 (main only) — Non-Negotiables */}
        {!isSecondary && step === 4 && (
          <div className="flex col g16">
            <div>
              <div className="modal-title" style={{ fontSize:26 }}>Non-Negotiables</div>
              <div className="modal-desc">Which tasks must happen no matter what — even on a Scaled Day? These are your identity floor.</div>
              <div className="f-mono mt8" style={{ fontSize:9, letterSpacing:".1em", color:"var(--warn)" }}>◐ THESE STAY ACTIVE DURING SCALED DAYS</div>
            </div>
            <div className="flex col g6">
              {validTasks.length === 0 && (
                <div className="f-mono c-2" style={{ fontSize:12 }}>No tasks defined — go back and add tasks first.</div>
              )}
              {validTasks.map(t => {
                const isNN = nonNeg.includes(t.id);
                return (
                  <div key={t.id} className="task-row" onClick={() => toggleNonNeg(t.id)}
                    style={{ cursor:"pointer", borderColor: isNN ? "var(--warn)" : undefined, background: isNN ? "#D4B22A0A" : undefined }}>
                    <div style={{
                      width:18, height:18, borderRadius:4, flexShrink:0,
                      border:`1.5px solid ${isNN ? "var(--warn)" : "var(--border-1)"}`,
                      background: isNN ? "var(--warn)" : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, color:"#080807", fontWeight:700, transition:"all .15s",
                    }}>{isNN && "✓"}</div>
                    <span style={{ fontSize:15, flex:1 }}>{t.label}</span>
                    {isNN && <span className="f-mono" style={{ fontSize:8, letterSpacing:".12em", color:"var(--warn)" }}>NON-NEG</span>}
                  </div>
                );
              })}
            </div>
            <div className="f-mono c-2" style={{ fontSize:9, letterSpacing:".06em" }}>
              {nonNeg.length}/{validTasks.length} marked · optional
            </div>
          </div>
        )}

        {/* CONFIRM — last step */}
        {step === totalSteps && (
          <div className="flex col g16">
            <div>
              <div className="modal-title" style={{ fontSize:26 }}>Ready to Forge</div>
              <div className="modal-desc">Review your challenge before it begins.</div>
            </div>
            <div className="flex col g10">
              {[{ l:"Challenge", v: name }, { l:"Duration", v: `${days} days` }].map(r => (
                <div key={r.l} className="flex between" style={{ padding:"10px 14px", background:"var(--bg-2)", borderRadius:7 }}>
                  <span className="f-mono c-2" style={{ fontSize:9, letterSpacing:".12em", textTransform:"uppercase" }}>{r.l}</span>
                  <span style={{ fontSize:15, fontWeight:500 }}>{r.v}</span>
                </div>
              ))}
              {!isSecondary && mission && (
                <div style={{ padding:"12px 14px", background:"var(--bg-2)", borderRadius:7 }}>
                  <div className="f-mono c-2 mb8" style={{ fontSize:9, letterSpacing:".12em", textTransform:"uppercase" }}>Mission</div>
                  <div style={{ fontSize:14, color:"var(--text-1)", fontStyle:"italic", lineHeight:1.6 }}>"{mission}"</div>
                </div>
              )}
              <div style={{ padding:"12px 14px", background:"var(--bg-2)", borderRadius:7 }}>
                <div className="f-mono c-2 mb8" style={{ fontSize:9, letterSpacing:".12em", textTransform:"uppercase" }}>Daily Tasks ({validTasks.length})</div>
                {validTasks.map(t => (
                  <div key={t.id} style={{ fontSize:14, color:"var(--text-1)", padding:"3px 0", display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ color: nonNeg.includes(t.id) ? "var(--warn)" : "var(--text-2)" }}>
                      {nonNeg.includes(t.id) ? "◆" : "—"}
                    </span>
                    {t.label}
                    {nonNeg.includes(t.id) && (
                      <span className="f-mono" style={{ fontSize:8, color:"var(--warn)", letterSpacing:".1em" }}>NON-NEG</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex g8 mt24">
          {step < totalSteps ? (
            <>
              <button className="btn btn-a w100" style={{ justifyContent:"center" }}
                onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}>
                Continue →
              </button>
              {step > 1 && <button className="btn btn-g" onClick={() => setStep(s => s - 1)}>← Back</button>}
              {step === 1 && <button className="btn btn-g" onClick={onClose}>Cancel</button>}
            </>
          ) : (
            <>
              <button className="btn btn-a w100" style={{ justifyContent:"center" }} onClick={handleStart}>
                Start Challenge →
              </button>
              <button className="btn btn-g" onClick={() => setStep(s => s - 1)}>← Back</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// ============================================================
// NAV
// ============================================================

// ============================================================
// PARTNERS PAGE
// ============================================================
const REACTIONS = ["🔥","💪","✓","⚡","👊"];

const Partners = ({ user, profile, challenges, sb }) => {
  const [partners,    setPartners]    = useState([]);
  const [messages,    setMessages]    = useState([]);
  const [reactions,   setReactions]   = useState([]);
  const [inviteCode,  setInviteCode]  = useState(profile?.invite_code || "");
  const [joinCode,    setJoinCode]    = useState("");
  const [joinError,   setJoinError]   = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [activePartner, setActivePartner] = useState(null);
  const [msgText,     setMsgText]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [tab,         setTab]         = useState("partners"); // partners | messages

  const myCode = profile?.invite_code || inviteCode;

  // Load partnerships
  const loadPartners = async () => {
    if (!sb || !user) return;
    try {
      const { data } = await sb.from("partnerships")
        .select("*, profiles!partnerships_partner_id_fkey(id,full_name,invite_code)")
        .eq("user_id", user.id).eq("status","active");
      const { data: asPartner } = await sb.from("partnerships")
        .select("*, profiles!partnerships_user_id_fkey(id,full_name,invite_code)")
        .eq("partner_id", user.id).eq("status","active");
      const all = [
        ...(data||[]).map(p => ({ ...p, partnerProfile: p.profiles })),
        ...(asPartner||[]).map(p => ({ ...p, partnerProfile: p.profiles })),
      ];
      setPartners(all);
    } catch(e) { console.warn("load partners:", e); }
  };

  // Load messages
  const loadMessages = async (partnerId) => {
    if (!sb || !user) return;
    try {
      const { data } = await sb.from("partner_messages")
        .select("*, from:from_user_id(full_name)")
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(50);
      setMessages(data || []);
      // Mark as read
      await sb.from("partner_messages")
        .update({ read: true })
        .eq("to_user_id", user.id)
        .eq("from_user_id", partnerId);
    } catch(e) { console.warn("load messages:", e); }
  };

  // Load reactions
  const loadReactions = async (partnerId) => {
    if (!sb || !user) return;
    try {
      const { data } = await sb.from("partner_reactions")
        .select("*")
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(20);
      setReactions(data || []);
    } catch(e) { console.warn("load reactions:", e); }
  };

  useEffect(() => { loadPartners(); }, [user, profile]);

  useEffect(() => {
    if (!activePartner) return;
    loadMessages(activePartner.partnerProfile.id);
    loadReactions(activePartner.partnerProfile.id);
  }, [activePartner]);

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinPartner = async () => {
    setJoinError(""); setJoinLoading(true);
    try {
      if (!sb) throw new Error("Not connected");
      if (!joinCode.trim()) throw new Error("Enter an invite code.");
      if (joinCode.trim().toUpperCase() === myCode) throw new Error("That's your own code.");
      // Find profile with this code
      const { data: targetProfile, error } = await sb
        .from("profiles").select("id,full_name").eq("invite_code", joinCode.trim().toUpperCase()).single();
      if (error || !targetProfile) throw new Error("No user found with that code.");
      // Check not already partners
      const { data: existing } = await sb.from("partnerships")
        .select("id,status")
        .or(`and(user_id.eq.${user.id},partner_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},partner_id.eq.${user.id})`)
        .single();
      if (existing) throw new Error(existing.status === "active" ? "Already partners." : "Request already sent.");
      // Create partnership
      await sb.from("partnerships").insert({
        user_id: user.id,
        partner_id: targetProfile.id,
        invite_code: `${myCode}-${joinCode.trim().toUpperCase()}`,
        status: "active", // auto-accept for simplicity
      });
      setJoinCode("");
      await loadPartners();
    } catch(e) { setJoinError(e.message); }
    finally { setJoinLoading(false); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activePartner || !sb) return;
    setSending(true);
    try {
      await sb.from("partner_messages").insert({
        from_user_id: user.id,
        to_user_id: activePartner.partnerProfile.id,
        body: msgText.trim(),
      });
      setMsgText("");
      await loadMessages(activePartner.partnerProfile.id);
    } catch(e) { console.warn("send message:", e); }
    finally { setSending(false); }
  };

  const sendReaction = async (emoji) => {
    if (!activePartner || !sb) return;
    try {
      await sb.from("partner_reactions").insert({
        from_user_id: user.id,
        to_user_id: activePartner.partnerProfile.id,
        emoji,
      });
      await loadReactions(activePartner.partnerProfile.id);
    } catch(e) { console.warn("send reaction:", e); }
  };

  const removePartner = async (partnershipId) => {
    if (!window.confirm("Remove this accountability partner?")) return;
    await sb.from("partnerships").delete().eq("id", partnershipId);
    setActivePartner(null);
    await loadPartners();
  };

  // ── Render partner detail view ──
  if (activePartner) {
    const p = activePartner.partnerProfile;
    return (
      <div className="page">
        <div className="a0" style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button className="btn btn-g" style={{padding:"6px 12px"}} onClick={()=>setActivePartner(null)}>← Back</button>
          <div>
            <div className="pg-tag">Accountability Partner</div>
            <div className="pg-title">{p.full_name || "Partner"}</div>
          </div>
        </div>

        {/* Reactions */}
        <div className="a1" style={{marginBottom:20}}>
          <div className="slabel">Send a Reaction</div>
          <div style={{display:"flex",gap:10}}>
            {REACTIONS.map(e => (
              <button key={e} className="btn btn-g"
                style={{fontSize:20,padding:"8px 14px",borderRadius:10}}
                onClick={()=>sendReaction(e)}>
                {e}
              </button>
            ))}
          </div>
          {reactions.length > 0 && (
            <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
              {reactions.slice(0,8).map(r => (
                <div key={r.id} style={{
                  background:"var(--bg-2)",border:"1px solid var(--border-1)",
                  borderRadius:8,padding:"4px 10px",
                  fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",
                  display:"flex",gap:6,alignItems:"center",
                }}>
                  <span style={{fontSize:14}}>{r.emoji}</span>
                  <span>{r.from_user_id === user.id ? "You" : p.full_name?.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="a2">
          <div className="slabel">Messages</div>
          <div style={{
            background:"var(--bg-1)",border:"1px solid var(--border-0)",
            borderRadius:10,padding:16,maxHeight:320,overflowY:"auto",
            display:"flex",flexDirection:"column",gap:8,marginBottom:12,
          }}>
            {messages.length === 0 && (
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",textAlign:"center",padding:"24px 0"}}>
                No messages yet. Say something.
              </div>
            )}
            {messages.map(m => {
              const isMe = m.from_user_id === user.id;
              return (
                <div key={m.id} style={{
                  alignSelf:isMe?"flex-end":"flex-start",
                  maxWidth:"75%",
                  background:isMe?"var(--accent-lo)":"var(--bg-2)",
                  border:`1px solid ${isMe?"var(--border-accent)":"var(--border-1)"}`,
                  borderRadius:isMe?"12px 12px 3px 12px":"12px 12px 12px 3px",
                  padding:"8px 14px",
                }}>
                  <div style={{fontSize:14,color:"var(--text-0)",lineHeight:1.4}}>{m.body}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--text-2)",marginTop:4}}>
                    {isMe?"You":p.full_name?.split(" ")[0]} · {new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input className="field" style={{flex:1}}
              value={msgText} onChange={e=>setMsgText(e.target.value)}
              placeholder="Send a message…"
              onKeyDown={e=>e.key==="Enter"&&sendMessage()} />
            <button className="btn btn-a" onClick={sendMessage} disabled={sending||!msgText.trim()}>
              Send
            </button>
          </div>
        </div>

        <div style={{marginTop:24}}>
          <button className="btn btn-g" style={{borderColor:"var(--err)30",color:"var(--err)"}}
            onClick={()=>removePartner(activePartner.id)}>
            Remove Partner
          </button>
        </div>
      </div>
    );
  }

  // ── Main partners list ──
  return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Accountability</div>
        <div className="pg-title">Partners</div>
        <div className="pg-sub">Share your grind. Stay accountable.</div>
      </div>

      {/* Your invite code */}
      <div className="srow a1 mt24">
        <div className="srow-title">Your Invite Code</div>
        <div className="srow-desc">Share this with someone to become accountability partners.</div>
        <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}>
          <div style={{
            fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".2em",
            color:"var(--accent)",background:"var(--bg-2)",
            border:"1px solid var(--border-accent)",
            borderRadius:8,padding:"10px 20px",
          }}>
            {myCode || "Loading…"}
          </div>
          <button className="btn btn-g" onClick={copyCode}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Join a partner */}
      <div className="srow a2 mt16">
        <div className="srow-title">Add a Partner</div>
        <div className="srow-desc">Enter their invite code to connect.</div>
        {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,margin:"8px 0"}}>{joinError}</div>}
        <div style={{display:"flex",gap:8,marginTop:8,maxWidth:340}}>
          <input className="field" style={{flex:1,textTransform:"uppercase",letterSpacing:".1em"}}
            value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX" maxLength={8} />
          <button className="btn btn-a" onClick={joinPartner} disabled={joinLoading}>
            {joinLoading ? "…" : "Connect"}
          </button>
        </div>
      </div>

      {/* Partner list */}
      <div className="a3 mt24">
        <div className="slabel">Your Partners — {partners.length}</div>
        {partners.length === 0 ? (
          <div style={{
            background:"var(--bg-1)",border:"1px dashed var(--border-1)",
            borderRadius:10,padding:"32px",textAlign:"center",
          }}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"var(--text-3)",letterSpacing:".04em"}}>No Partners Yet</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",marginTop:6,letterSpacing:".1em"}}>Share your code or enter a friend's to get started</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {partners.map(p => (
              <div key={p.id} className="card"
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:"16px 20px"}}
                onClick={()=>setActivePartner(p)}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".04em"}}>
                    {p.partnerProfile?.full_name || "Partner"}
                  </div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--text-2)",letterSpacing:".1em",marginTop:2}}>
                    ACTIVE PARTNER · TAP TO VIEW
                  </div>
                </div>
                <div style={{color:"var(--accent)",fontSize:18}}>→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NAV = [
  { id:"home",     icon:"⬡", tip:"Dashboard"  },
  { id:"wall",     icon:"▦", tip:"The Wall"    },
  { id:"library",  icon:"◈", tip:"Library"     },
  { id:"partners", icon:"⊕", tip:"Partners"    },
  { id:"settings", icon:"◎", tip:"Settings"    },
];

// ============================================================
// SUPABASE CLIENT
// ============================================================
const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[Forge] Supabase URL:", _sbUrl ? "✓ loaded" : "✗ MISSING");
console.log("[Forge] Supabase Key:", _sbKey ? "✓ loaded" : "✗ MISSING");

const sb = (_sbUrl && _sbKey) ? createClient(_sbUrl, _sbKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

// ============================================================
// SUPABASE THEMES (8 total — original 3 + 5 new)
// ============================================================
const ALL_THEMES = {
  forge:    { label:"Forge",              desc:"Dark industrial. The original.",             swatch:"#D4922A", vars: THEMES.forge    },
  slate:    { label:"Slate",              desc:"Clean parchment. Eyes-first.",               swatch:"#2A4A38", vars: THEMES.slate    },
  iron:     { label:"Iron",               desc:"Cold blue steel. Night sessions.",           swatch:"#4A8FD4", vars: THEMES.iron     },
  neutrals: { label:"Elevated Neutrals",  desc:"Calm & Clarity. Warm greys, zero noise.",   swatch:"#8C7355", vars: {
    "--bg-0":"#FAF8F5","--bg-1":"#F0EDE8","--bg-2":"#E6E2DB","--bg-3":"#D8D3CB","--bg-4":"#FFFFFF",
    "--accent":"#8C7355","--accent-lo":"#8C735514","--accent-mid":"#8C735545",
    "--text-0":"#1A1816","--text-1":"#605A52","--text-2":"#9E9890","--text-3":"#C8C2BA",
    "--border-0":"#E0DCD4","--border-1":"#CECAC2","--border-accent":"#8C735530",
    "--ok":"#4A7C59","--warn":"#B8880A","--err":"#A03030",
  }},
  digital:  { label:"Digital Trust",      desc:"Finance & Habit. Blue-green authority.",    swatch:"#0DBEAA", vars: {
    "--bg-0":"#070E12","--bg-1":"#0B1520","--bg-2":"#10202E","--bg-3":"#162A38","--bg-4":"#1C3344",
    "--accent":"#0DBEAA","--accent-lo":"#0DBEAA18","--accent-mid":"#0DBEAA50",
    "--text-0":"#DFF4F0","--text-1":"#6FA8A0","--text-2":"#3A6860","--text-3":"#1E3C38",
    "--border-0":"#162A38","--border-1":"#1E3844","--border-accent":"#0DBEAA30",
    "--ok":"#2DD4AA","--warn":"#F0C040","--err":"#E05050",
  }},
  dusk:     { label:"Future Dusk",         desc:"Focus & Mystery. Deep work sessions.",      swatch:"#8B5CF6", vars: {
    "--bg-0":"#08060F","--bg-1":"#0F0B1C","--bg-2":"#161028","--bg-3":"#1E1636","--bg-4":"#261E42",
    "--accent":"#8B5CF6","--accent-lo":"#8B5CF618","--accent-mid":"#8B5CF650",
    "--text-0":"#EDE8FF","--text-1":"#8A80B0","--text-2":"#4A4268","--text-3":"#2C2648",
    "--border-0":"#1E1636","--border-1":"#2A2048","--border-accent":"#8B5CF630",
    "--ok":"#6EE7B7","--warn":"#FBBF24","--err":"#F87171",
  }},
  pastel:   { label:"Sunwashed Pastels",   desc:"Energy & Joy. Casual planning, students.", swatch:"#E07B4A", vars: {
    "--bg-0":"#FFFBF7","--bg-1":"#FFF3EA","--bg-2":"#FFE8D6","--bg-3":"#FFD9C0","--bg-4":"#FFFFFF",
    "--accent":"#E07B4A","--accent-lo":"#E07B4A14","--accent-mid":"#E07B4A44",
    "--text-0":"#2A1A10","--text-1":"#7A5040","--text-2":"#B89080","--text-3":"#D8C0B0",
    "--border-0":"#F5DDD0","--border-1":"#EAC8B4","--border-accent":"#E07B4A30",
    "--ok":"#3DA870","--warn":"#E0A020","--err":"#D04040",
  }},
  mono:     { label:"Monochrome+",         desc:"Precision & Speed. One colour, max clarity.", swatch:"#E8E8E8", vars: {
    "--bg-0":"#080808","--bg-1":"#111111","--bg-2":"#191919","--bg-3":"#222222","--bg-4":"#2C2C2C",
    "--accent":"#F0F0F0","--accent-lo":"#F0F0F014","--accent-mid":"#F0F0F040",
    "--text-0":"#F8F8F8","--text-1":"#888888","--text-2":"#444444","--text-3":"#282828",
    "--border-0":"#222222","--border-1":"#2E2E2E","--border-accent":"#F0F0F025",
    "--ok":"#70C070","--warn":"#C0A030","--err":"#C04040",
  }},
};
const THEME_ORDER = ["forge","slate","iron","neutrals","digital","dusk","pastel","mono"];

function applyThemeVars(themeId) {
  const t = ALL_THEMES[themeId];
  if (!t) return;
  Object.entries(t.vars).forEach(([k,v]) => {
    document.documentElement.style.setProperty(k,v);
    document.body.style.setProperty(k,v);
  });
}

// ============================================================
// AUTH SCREEN (Supabase-wired: Google + Email/Password)
// ============================================================

const AuthScreen = ({ onAuthed }) => {
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const quote = QUOTES[0];

  const handleEmail = async () => {
    setErr("");
    if (mode === "signup" && !name.trim()) return setErr("Name is required.");
    if (!email.includes("@"))             return setErr("Enter a valid email.");
    if (pw.length < 6)                    return setErr("Password must be 6+ characters.");
    if (!sb)                              return setErr("Supabase not connected. Check your .env file and restart the server.");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
      }
      onAuthed(name || email.split("@")[0]);
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      if (!sb) throw new Error("Supabase not configured.");
      await sb.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } });
    } catch(e) { setErr(e.message); setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="auth-left-bg" />
        <div className="auth-left-logo">FORGE</div>
        <div className="auth-left-quote">
          <div className="auth-quote-mark">"</div>
          <div className="auth-quote-text">{quote.text}</div>
          <div className="auth-quote-attr">— {quote.attr}</div>
        </div>
        <div className="auth-left-stats">
          {[{n:"75",l:"Day hard reset"},{n:"0",l:"Excuses allowed"},{n:"1",l:"Standard: yours"}].map(s=>(
            <div key={s.l} className="auth-stat-item">
              <div className="auth-stat-n">{s.n}</div>
              <div className="auth-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <div className="auth-tab-row">
            <button className={`auth-tab ${mode==="login"?"on":""}`}  onClick={()=>{setMode("login");setErr("");}}>Log In</button>
            <button className={`auth-tab ${mode==="signup"?"on":""}`} onClick={()=>{setMode("signup");setErr("");}}>Create Account</button>
          </div>
          <div className="auth-form-tag">Forge · Discipline Tracker</div>
          <div className="auth-form-title">{mode==="login"?"Welcome Back.":"Begin Here."}</div>
          <div className="auth-form-sub">{mode==="login"?"Your streak is waiting.":"One standard. No compromises."}</div>
          {err && <div className="auth-error">{err}</div>}
          <button className="btn btn-g w100 mb16" style={{justifyContent:"center",gap:10,padding:"11px",marginTop:16}}
            onClick={handleGoogle} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="auth-divider">or</div>
          {mode==="signup" && (
            <div className="auth-field-wrap">
              <div className="field-l">Your Name</div>
              <input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="First name" />
            </div>
          )}
          <div className="auth-field-wrap">
            <div className="field-l">Email</div>
            <input className="field" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="auth-field-wrap">
            <div className="field-l">Password</div>
            <input className="field" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••"
              onKeyDown={e=>e.key==="Enter"&&handleEmail()} />
          </div>
          <button className="btn btn-a w100 mt16" style={{justifyContent:"center",padding:"13px",fontSize:15,boxShadow:"0 4px 0 rgba(0,0,0,.4)",borderRadius:8}}
            onClick={handleEmail} disabled={loading}>
            {loading?"One moment…":mode==="login"?"Enter the Forge →":"Create My Account →"}
          </button>
          <div className="auth-switch">
            {mode==="login"
              ?<>No account? <span onClick={()=>{setMode("signup");setErr("");}}>Create one</span></>
              :<>Already have one? <span onClick={()=>{setMode("login");setErr("");}}>Log in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS SCREEN (Supabase-wired: email, password, themes)
// ============================================================
const SettingsScreen = ({ theme, setTheme, tone, setTone, userName, setUserName, onSaveProfile }) => {
  const tones = ["Stoic","Coach","Drill Sergeant"];
  const [nameVal,     setNameVal]     = useState(userName);
  const [emailVal,    setEmailVal]    = useState("");
  const [pwNew,       setPwNew]       = useState("");
  const [pwConfirm,   setPwConfirm]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);
  // Feedback
  const [fbType,      setFbType]      = useState("suggestion");
  const [fbText,      setFbText]      = useState("");
  const [fbSending,   setFbSending]   = useState(false);
  const [fbDone,      setFbDone]      = useState(false);

  const flash = (type,text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try {
      if (sb) await sb.auth.updateUser({ data: { full_name: nameVal.trim() } });
      setUserName(nameVal.trim());
      onSaveProfile({ full_name: nameVal.trim() });
      flash("ok","Name updated.");
    } catch(e) { flash("err",e.message); }
    finally { setSaving(false); }
  };

  const saveEmail = async () => {
    if (!emailVal.includes("@")) return flash("err","Enter a valid email.");
    setSaving(true);
    try {
      if (!sb) throw new Error("Supabase not configured.");
      await sb.auth.updateUser({ email: emailVal });
      flash("ok","Confirmation sent to new email. Click the link to confirm.");
      setEmailVal("");
    } catch(e) { flash("err",e.message); }
    finally { setSaving(false); }
  };

  const savePw = async () => {
    if (pwNew.length < 8)    return flash("err","Password must be at least 8 characters.");
    if (pwNew !== pwConfirm) return flash("err","Passwords don't match.");
    setSaving(true);
    try {
      if (!sb) throw new Error("Supabase not configured.");
      await sb.auth.updateUser({ password: pwNew });
      flash("ok","Password updated.");
      setPwNew(""); setPwConfirm("");
    } catch(e) { flash("err",e.message); }
    finally { setSaving(false); }
  };

  const handleTheme = (id) => {
    setTheme(id);
    onSaveProfile({ theme: id });
  };

  return (
    <div className="page">
      <div className="a0"><div className="pg-tag">Preferences</div><div className="pg-title">Settings</div></div>

      {msg && (
        <div className="a0 mt16" style={{background:msg.type==="ok"?"var(--ok)18":"var(--err)18",border:`1px solid ${msg.type==="ok"?"var(--ok)":"var(--err)"}44`,padding:"12px 18px",borderRadius:8}}>
          <span style={{color:msg.type==="ok"?"var(--ok)":"var(--err)",fontSize:14}}>{msg.type==="ok"?"✓ ":"✕ "}{msg.text}</span>
        </div>
      )}

      <div className="flex col g16 mt24">

        {/* Name */}
        <div className="srow a1">
          <div className="srow-title">Your Name</div>
          <div className="srow-desc">Shown in your dashboard greeting.</div>
          <div className="flex g8" style={{maxWidth:340}}>
            <input className="field" value={nameVal} onChange={e=>setNameVal(e.target.value)} placeholder="First name" style={{flex:1}} />
            <button className="btn btn-a" onClick={saveName} disabled={saving}>Save</button>
          </div>
        </div>

        {/* Email */}
        <div className="srow a2">
          <div className="srow-title">Change Email</div>
          <div className="srow-desc">A confirmation link will be sent to the new address.</div>
          <div className="flex g8" style={{maxWidth:340}}>
            <input className="field" type="email" value={emailVal} onChange={e=>setEmailVal(e.target.value)} placeholder="new@email.com" style={{flex:1}} />
            <button className="btn btn-a" onClick={saveEmail} disabled={saving}>Send</button>
          </div>
        </div>

        {/* Password */}
        <div className="srow a3">
          <div className="srow-title">Change Password</div>
          <div className="srow-desc">Minimum 8 characters.</div>
          <div className="flex col g8" style={{maxWidth:340}}>
            <input className="field" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="New password" />
            <input className="field" type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="Confirm new password" />
            <button className="btn btn-a" onClick={savePw} disabled={saving} style={{alignSelf:"flex-start"}}>Update Password</button>
          </div>
        </div>

        {/* Themes */}
        <div className="srow a4">
          <div className="srow-title">Theme</div>
          <div className="srow-desc">Eight environments. Pick the one that matches your headspace.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,marginTop:8}}>
            {THEME_ORDER.map(id => {
              const t = ALL_THEMES[id]; const on = theme===id;
              return (
                <div key={id} onClick={()=>handleTheme(id)} style={{
                  background:on?"var(--accent-lo)":"var(--bg-2)",
                  border:`1px solid ${on?"var(--accent)":"var(--border-1)"}`,
                  borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all .18s",
                  display:"flex",alignItems:"center",gap:12,
                }}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:t.swatch,border:on?"2px solid var(--text-0)":"2px solid transparent",flexShrink:0,transition:"all .18s",transform:on?"scale(1.12)":"scale(1)"}} />
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:".04em",color:on?"var(--text-0)":"var(--text-1)"}}>{t.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".1em",color:"var(--text-2)",marginTop:2}}>{t.desc}</div>
                  </div>
                  {on && <div style={{marginLeft:"auto",color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Tone */}
        <div className="srow a5">
          <div className="srow-title">AI Tone</div>
          <div className="srow-desc">How Forge speaks in your daily debrief.</div>
          <div className="flex g8 wrap mt8">
            {tones.map(t=>(
              <button key={t} className={`btn ${tone===t?"btn-a":"btn-g"}`}
                onClick={()=>{setTone(t);onSaveProfile({tone:t});}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="srow a5">
          <div className="srow-title">Feedback</div>
          <div className="srow-desc">Suggest an improvement or report a bug. We read everything.</div>
          {fbDone ? (
            <div style={{marginTop:12,padding:"12px 16px",background:"var(--ok)15",border:"1px solid var(--ok)44",borderRadius:8}}>
              <div style={{color:"var(--ok)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12}}>✓ Sent. Thank you.</div>
            </div>
          ) : (
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10,maxWidth:440}}>
              {/* Type dropdown */}
              <div>
                <div className="field-l">Type</div>
                <select className="field" value={fbType} onChange={e=>setFbType(e.target.value)}
                  style={{width:"100%",cursor:"pointer"}}>
                  <option value="suggestion">💡 Suggestion — I have an idea</option>
                  <option value="bug">🐛 Bug Report — something is broken</option>
                  <option value="ux">✏️ UX Feedback — something feels off</option>
                  <option value="other">💬 Other</option>
                </select>
              </div>
              {/* Message */}
              <div>
                <div className="field-l">
                  {fbType==="suggestion"?"Describe your idea"
                  :fbType==="bug"?"What happened? What did you expect?"
                  :fbType==="ux"?"What felt off and how would you improve it?"
                  :"Your message"}
                </div>
                <textarea className="field" rows={4}
                  style={{width:"100%",resize:"vertical",lineHeight:1.5}}
                  value={fbText} onChange={e=>setFbText(e.target.value)}
                  placeholder={
                    fbType==="bug"
                      ? "e.g. When I click X, Y happens instead of Z..."
                      : "e.g. It would be great if..."
                  } />
              </div>
              <button className="btn btn-a" style={{alignSelf:"flex-start"}}
                disabled={!fbText.trim() || fbSending}
                onClick={async()=>{
                  setFbSending(true);
                  try {
                    if (sb) {
                      await sb.from("feedback").insert({
                        user_id: (await sb.auth.getUser()).data.user?.id,
                        type: fbType,
                        body: fbText.trim(),
                      });
                    }
                    setFbDone(true);
                    setFbText("");
                  } catch(e) {
                    // Even if DB fails, show success to user — don't want to block on this
                    setFbDone(true);
                  } finally { setFbSending(false); }
                }}>
                {fbSending ? "Sending…" : "Send Feedback →"}
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="srow a5" style={{borderColor:"var(--err)30"}}>
          <div className="srow-title" style={{color:"var(--err)"}}>Sign Out</div>
          <div className="srow-desc">You'll be returned to the login screen.</div>
          <button className="btn btn-g" style={{borderColor:"var(--err)44",color:"var(--err)"}}
            onClick={()=>sb&&sb.auth.signOut()}>
            Sign Out
          </button>
        </div>

        {/* Delete Account */}
        <div className="srow a5" style={{borderColor:"var(--err)50",background:"var(--err)08"}}>
          <div className="srow-title" style={{color:"var(--err)"}}>Delete Account</div>
          <div className="srow-desc">Permanently delete your account and all data. This cannot be undone.</div>
          <button className="btn btn-g" style={{borderColor:"var(--err)60",color:"var(--err)",background:"var(--err)12"}}
            onClick={async()=>{
              if (!window.confirm("To delete your account, email us at support@forge.app and we'll remove it within 24 hours.\n\nPress OK to be signed out now, or Cancel to stay.")) return;
              if (sb) await sb.auth.signOut();
            }}>
            Request Account Deletion
          </button>
        </div>

      </div>
    </div>
  );
};

// ============================================================
// ROOT APP — Supabase auth + all state
// ============================================================
export default function App() {
  // ── Supabase session state ────────────────────────────────
  const [user,    setUser]    = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);

  // Load profile from DB
  const loadProfile = useCallback(async (uid) => {
    if (!uid || !sb) return;
    try {
      const { data } = await sb.from("profiles").select("*").eq("id", uid).single();
      if (data) setProfile(data);
    } catch(e) { console.warn("profile load:", e); }
  }, []);

  const saveProfile = useCallback(async (updates) => {
    if (!user?.id || !sb) return;
    try {
      const { data } = await sb.from("profiles")
        .upsert({ id: user.id, updated_at: new Date().toISOString(), ...updates })
        .select().single();
      if (data) setProfile(data);
    } catch(e) { console.warn("profile save:", e); }
  }, [user]);

  // Supabase auth listener
  useEffect(() => {
    if (!sb) { setUser(null); return; }
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── App state ─────────────────────────────────────────────
  const [stage,       setStage]       = useState("loader");
  const [page,        setPage]        = useState("home");
  const [dw,          setDW]          = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(false);
  const [theme,       setThemeState]  = useState("forge");
  const [tone,        setTone]        = useState("Coach");
  const [modal,       setModal]       = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [libModal,    setLibModal]    = useState(false);
  const [mission,     setMission]     = useState("I am becoming someone who shows up every day without negotiating with myself.");
  const [userName,    setUserName]    = useState("You");
  const [kpis,        setKpis]        = useState(EMPTY_KPIS);
  const [challenges,  setChallenges]  = useState(EMPTY_CHALLENGES);

  // Inject CSS on mount
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "forge-css";
    s.textContent = makeCSS();
    document.head.appendChild(s);
    return () => { const el = document.getElementById("forge-css"); if (el) el.remove(); };
  }, []);

  // Apply theme vars whenever theme changes
  const setTheme = (id) => { setThemeState(id); applyThemeVars(id); };
  useEffect(() => { applyThemeVars(theme); }, [theme]);

  // Sync profile into local state
  useEffect(() => {
    if (!profile) return;
    if (profile.full_name) setUserName(profile.full_name);
    if (profile.theme)     setTheme(profile.theme);
    if (profile.tone)      setTone(profile.tone);
  }, [profile]);

  // Route based on auth state
  useEffect(() => {
    if (user === undefined) return; // still loading
    if (!user) { setStage("auth"); return; }
    // Logged in
    if (profile && !profile.onboarded) setStage("ob_why");
    else setStage("app");
  }, [user, profile]);

  const toggle = (key) => setKpis(p => ({ ...p, [key]: !p[key] }));

  const handleAuthed = (name) => {
    if (name) setUserName(name);
    // Auth state change will trigger the useEffect above
  };

  const handleStartChallenge = ({ name, days, mission: m, nonNeg, tasks, isSecondary }) => {
    const newChallenge = {
      id: `c${Date.now()}`, name, tag: "CUSTOM", dayNum: 1,
      totalDays: parseInt(days), streak: 0, consistency: 100, color: "#9A9690",
      kpis: tasks.map(t => ({ key:`task_${t.id}`, label:t.label, cat:"other", nonNeg:nonNeg.includes(t.id) })),
    };
    if (isSecondary) {
      setChallenges(c => ({ ...c, secondary: [...c.secondary, newChallenge].slice(0,3) }));
    } else {
      setChallenges(c => ({ ...c, main: { ...newChallenge, wall: buildWall() } }));
      if (m) setMission(m);
      setKpis(Object.fromEntries(newChallenge.kpis.map(k => [k.key, false])));
    }
    setModal(null); setLibModal(false);
  };

  const handleLibPick = (tpl, isSecondary) => {
    setLibModal(false);
    setModal({ ...tpl, _mode: isSecondary?"secondary":"main", maxDays: isSecondary ? challenges.main.totalDays : undefined });
  };

  const addSecondary = () => { if (challenges.secondary.length >= 3) return; setLibModal(true); };

  const handleViewChallenge = (challenge, type) => {
    setDetailModal({ type, challenge: { ...challenge, kpis: (challenge.kpis||[]).map(k=>({ key:k.key||`task_${Math.random().toString(36).slice(2)}`, label:k.label||"", cat:k.cat||"other", nonNeg:k.nonNeg||false })) } });
  };

  const handleEditChallenge = (updated) => {
    setChallenges(c => {
      if (updated.id === c.main.id) return { ...c, main: { ...c.main, kpis: updated.kpis } };
      return { ...c, secondary: c.secondary.map(s => s.id===updated.id ? {...s, kpis:updated.kpis} : s) };
    });
    if (updated.id === challenges.main.id) setKpis(prev => ({ ...Object.fromEntries(updated.kpis.map(k=>[k.key,false])), ...prev }));
    setDetailModal(null);
  };

  const handleOnboardDone = async () => {
    await saveProfile({ onboarded: true });
    setStage("app");
  };

  const hasChallenge = !!challenges.main;
  // Fire sparks when all tasks done
  const prevDone = useRef(false);
  useEffect(() => {
    if (!challenges.main) return;
    const safeKpis = challenges.main.kpis || [];
    if (safeKpis.length === 0) return;
    const allDone = safeKpis.every(k => kpis[k.key]);
    if (allDone && !prevDone.current) {
      setSparkTrigger(t => !t); // toggle to re-trigger
      // Ignite streak number in rail
      const el = document.getElementById("forge-streak-n");
      if (el) { el.classList.remove("streak-ignite"); void el.offsetWidth; el.classList.add("streak-ignite"); }
    }
    prevDone.current = allDone;
  }, [kpis, challenges.main]);

  const activeChallenge = hasChallenge
    ? { ...challenges.main, kpis: challenges.main.kpis || [], wall: challenges.main.wall || buildWall() }
    : { id:null, name:"No Active Challenge", tag:"", dayNum:0, totalDays:1, streak:0, consistency:0, color:"#9A9690", kpis:[], wall:buildWall() };
  const level = getLevel(activeChallenge.dayNum);
  const fmtDate = () => new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  const renderPage = () => {
    if (page==="home") {
      if (!hasChallenge) return (
        <div className="page">
          <div className="a0" style={{marginBottom:32}}>
            <div className="pg-tag">Welcome to Forge</div>
            <div className="pg-title">Ready to Begin?</div>
            <div className="pg-sub">You have no active challenge. Start one from the Library.</div>
          </div>
          <button className="btn btn-a" style={{padding:"14px 32px",fontSize:16,letterSpacing:".04em"}}
            onClick={()=>setPage("library")}>
            Browse Challenges →
          </button>
        </div>
      );
      return <Home challenge={activeChallenge} challenges={challenges} kpis={kpis} toggle={toggle} onDW={()=>setDW(true)} tone={tone} mission={mission} onAddSecondary={addSecondary} userName={userName} onViewChallenge={handleViewChallenge} />;
    }
    if (page==="wall")     return <Wall challenge={activeChallenge} challenges={challenges} />;
    if (page==="library")  return <Library onPick={(t,isSec)=>handleLibPick(t,isSec)} />;
    if (page==="partners") return <Partners user={user} profile={profile} challenges={challenges} sb={sb} />;
    if (page==="settings") return <SettingsScreen theme={theme} setTheme={setTheme} tone={tone} setTone={setTone} userName={userName} setUserName={setUserName} onSaveProfile={saveProfile} />;
  };

  // ── Stage routing ─────────────────────────────────────────
  if (user === undefined) return (
    <div style={{position:"fixed",inset:0,background:"#080807",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:80,color:"#D4922A",letterSpacing:".1em"}}>FORGE</div>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",color:"#56524D",textTransform:"uppercase"}}>Loading…</div>
    </div>
  );

  if (stage==="loader")    return <Entry onDone={()=>{ if(!user) setStage("auth"); else if(profile&&!profile.onboarded) setStage("ob_why"); else setStage("app"); }} />;
  if (stage==="auth")      return <AuthScreen onAuthed={handleAuthed} />;
  if (stage==="ob_why")    return <OnboardWhy   onNext={()=>setStage("ob_who")}    onSkip={handleOnboardDone} />;
  if (stage==="ob_who")    return <OnboardWho   onNext={()=>setStage("ob_induct")} onSkip={handleOnboardDone} />;
  if (stage==="ob_induct") return <OnboardInduct onDone={handleOnboardDone} userName={userName} />;
  if (dw)                  return <DeepWork challenge={activeChallenge} kpis={kpis} toggle={toggle} onExit={()=>setDW(false)} />;

  return (
    <div className="shell">
      <nav className="rail">
        <div className="rail-logo" onClick={()=>setPage("home")}>FORGE</div>
        <div className="rail-nav">
          {NAV.map(n=>(
            <div key={n.id} className={`rail-btn ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
              {n.icon}<div className="rtip">{n.tip}</div>
            </div>
          ))}
        </div>
        <div className="rail-foot">
          <div className="rail-streak-n" id="forge-streak-n">{activeChallenge.streak}</div>
          <div className="rail-streak-l">streak</div>
        </div>
      </nav>
      <div className="main">
        <div className="topbar">
          <div className="topbar-date f-mono">{fmtDate()}</div>
          <div className="topbar-r">
            <div className="lvl-chip" style={{color:level.color,borderColor:`${level.color}30`}}>
              <div className="lvl-dot" style={{background:level.color}} />{level.label}
            </div>
            <button className="btn btn-g" style={{padding:"5px 13px",fontSize:12}} onClick={()=>setDW(true)}>⚡ Deep Work</button>
            {user && <button className="btn btn-g" style={{padding:"5px 13px",fontSize:12,borderColor:"var(--err)30",color:"var(--text-2)"}} onClick={()=>sb&&sb.auth.signOut()}>↩</button>}
          </div>
        </div>
        {renderPage()}
      </div>
      {modal && <ChallengeWizard tpl={modal} isSecondary={modal._mode==="secondary"} maxDays={modal.maxDays} onClose={()=>setModal(null)} onStart={handleStartChallenge} />}
      {libModal && (
        <div className="overlay" onClick={()=>setLibModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{width:580,maxHeight:"80vh",overflowY:"auto"}}>
            <Library isSecondaryMode={true} onPick={(t)=>handleLibPick(t,true)} onClose={()=>setLibModal(false)} />
            <button className="btn btn-g mt16" style={{width:"100%",justifyContent:"center"}} onClick={()=>setLibModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {detailModal && <ChallengeDetailModal challenge={detailModal.challenge} mission={detailModal.type==="main"?mission:null} onClose={()=>setDetailModal(null)} onEdit={handleEditChallenge} />}
      <SparkCanvas trigger={sparkTrigger} />
    </div>
  );
}
