import React, { useState, useEffect, useCallback, useRef } from "react";
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
    "--text-0": "#0E0D0C",
    "--text-1": "#2A2826",
    "--text-2": "#4A4540",
    "--text-3": "#A8A49E",
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
  other: { label: "Other",   color: "var(--text-2)" },
};

const TEMPLATES = [
  {
    id: "75hard", name: "75 HARD", duration: 75, tag: "ENDURANCE",
    kpis: [{ key:"w1",label:"Workout 1 — 45min",cat:"body"},{key:"w2",label:"Workout 2 — 45min",cat:"body"},{key:"diet",label:"Stick to diet",cat:"diet"},{key:"water",label:"1 gallon water",cat:"diet"},{key:"read",label:"Read 10 pages",cat:"mind"},{key:"photo",label:"Progress photo",cat:"other"}],
    blurb: "Two-a-day workouts, strict diet, 1 gallon of water, 10 pages of reading. Every day. No days off.",
    about: "75 Hard is a mental toughness program built by Andy Frisella. The premise is simple: complete five daily tasks for 75 consecutive days with zero compromise. Miss a single day and you restart from day one. There are no substitutions, no scaled versions, no excuses.",
    benefits: ["Builds ironclad daily discipline", "Significant physical transformation", "Proven mental resilience framework", "Develops non-negotiation with yourself"],
    bestFor: "People who need an external framework to force the habit of showing up. Especially effective if you've tried and quit challenges before.",
    difficulty: "Hard",
  },
  {
    id: "30day", name: "30 DAY HARD", duration: 30, tag: "FOUNDATION",
    kpis: [{key:"workout",label:"Workout",cat:"body"},{key:"diet",label:"Clean eating",cat:"diet"},{key:"mindset",label:"Mindset work",cat:"mind"}],
    blurb: "The accessible entry point. 30 days of workouts, clean eating, and mindset work. Build the foundation.",
    about: "A stripped-back version of the 75 Hard structure, designed for people who are building habits from scratch or coming back after a long break. Three tasks daily for 30 days — enough to feel the compound effect without the extreme commitment.",
    benefits: ["Entry-level structure for beginners", "Builds the three pillars: body, diet, mind", "Short enough to commit to fully", "Establishes baseline discipline"],
    bestFor: "First-time challengers, people returning from injury or burnout, or anyone who wants a clear 30-day reset.",
    difficulty: "Moderate",
  },
  {
    id: "10apps", name: "10 APPS / 10 DAYS", duration: 10, tag: "BUILDER",
    kpis: [{key:"shipped",label:"App shipped",cat:"build"},{key:"deployed",label:"Deployed live",cat:"build"},{key:"docs",label:"Documented",cat:"build"}],
    blurb: "Ship one working, deployed app every single day for 10 days. Speed over perfection.",
    about: "A builder's sprint designed to break perfectionism and force rapid shipping. Each day you must design, build, deploy, and document a working app. The constraints are the point — you learn more shipping 10 imperfect things than agonising over one perfect one.",
    benefits: ["Destroys perfectionism fast", "Forces scope discipline", "Builds a portfolio in 10 days", "Rapid skill compression under pressure"],
    bestFor: "Developers who overthink, people learning to build, or anyone who wants to prove to themselves they can actually ship.",
    difficulty: "Intense",
  },
  {
    id: "noai", name: "30 DAYS NO AI", duration: 30, tag: "DISCIPLINE",
    kpis: [{key:"no_ai",label:"Zero AI used",cat:"mind"},{key:"dw",label:"2hr deep work",cat:"build"}],
    blurb: "No AI tools for 30 days. Two hours of uninterrupted deep work daily. Rebuild your raw thinking.",
    about: "A cognitive recalibration challenge. In a world where AI handles first drafts, debugging, and decision support, this forces you to operate without the crutch. Pair it with mandatory deep work sessions and you'll remember what your brain is actually capable of.",
    benefits: ["Rediscovers raw problem-solving ability", "Rebuilds deep focus capacity", "Exposes AI dependency blind spots", "Strengthens independent thinking"],
    bestFor: "Developers, writers, and knowledge workers who've noticed their thinking has gotten shallower or their tolerance for hard problems has dropped.",
    difficulty: "Moderate",
  },
  {
    id: "custom", name: "CUSTOM", duration: 30, tag: "YOUR RULES",
    kpis: [],
    blurb: "Define your own daily tasks, your own duration, your own rules. Built entirely around your goals.",
    about: "No template fits every person. Custom lets you define exactly what you're committing to — whether that's language learning, sobriety, creative output, athletic training, or anything else. You set the tasks, you set the duration, you set the standard.",
    benefits: ["Fully tailored to your specific goal", "No irrelevant tasks diluting your focus", "Can be as hard or as focused as you need", "Grows with you over multiple challenges"],
    bestFor: "Anyone with a clear goal that doesn't fit the pre-built templates. Also good for veterans who've finished other challenges and want to design their next level.",
    difficulty: "You decide",
  },
];

// ============================================================
// MOCK DATA
// ============================================================

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
    width:60px; min-height:100vh;
    background:var(--bg-1);
    border-right:1px solid var(--border-0);
    display:flex; flex-direction:column; align-items:center;
    padding:18px 0;
    position:fixed; top:0; left:0; z-index:100;
    animation:leftin .4s ease both;
  }

  .rail-logo {
    width:26px; height:26px;
    padding-bottom:18px;
    border-bottom:1px solid var(--border-0);
    margin-bottom:14px;
    cursor:pointer;
    transition:opacity .2s;
    flex-shrink:0;
  }
  .rail-logo img { width:26px; height:26px; object-fit:contain; display:block; }
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
    font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.06em;
    color:var(--text-0); white-space:nowrap;
    opacity:0; pointer-events:none; transition:opacity .15s;
  }
  .rail-btn:hover .rtip { opacity:1; }

  .rail-foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .rail-streak-n { font-family:'Bebas Neue',sans-serif; font-size:20px; color:var(--warn); line-height:1; }
  .rail-streak-l { font-family:'IBM Plex Mono',monospace; font-size:7.5px; color:var(--text-2); letter-spacing:.1em; text-transform:uppercase; }

  /* MAIN AREA */
  .main { margin-left:60px; flex:1; display:flex; flex-direction:column; min-width:0; overflow-x:hidden; }

  /* TOPBAR */
  .topbar {
    height:50px; border-bottom:1px solid var(--border-0);
    display:flex; align-items:center; justify-content:space-between;
    padding:0 28px; background:var(--bg-0);
    position:sticky; top:0; z-index:50;
  }
  .topbar-date { font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--text-2); letter-spacing:.06em; }
  .topbar-r { display:flex; align-items:center; gap:10px; }

  .lvl-chip {
    display:flex; align-items:center; gap:6px;
    padding:4px 11px; border-radius:4px;
    border:1px solid var(--border-1);
    font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.14em;
    cursor:pointer; transition:border-color .18s;
  }
  .lvl-chip:hover { border-color:var(--border-accent); }
  .lvl-dot { width:5px; height:5px; border-radius:50%; }

  /* PAGE */
  .page { padding:36px 32px 100px; width:100%; max-width:900px; box-sizing:border-box; }
  .page.partners-page { padding:0; max-width:100%; height:100%; }

  /* PAGE HEADER */
  .pg-tag   { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); margin-bottom:5px; }
  .pg-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(40px,6vw,60px); letter-spacing:.02em; line-height:0.95; }
  .pg-sub   { font-size:15px; color:var(--text-1); margin-top:8px; }

  /* SECTION LABEL */
  .slabel {
    font-family:'IBM Plex Mono',monospace; font-size:10px;
    letter-spacing:.18em; text-transform:uppercase; color:var(--text-2);
    margin-bottom:12px;
  }

  /* DIVIDER WITH LABEL */
  .dv-label {
    display:flex; align-items:center; gap:12px;
    font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.18em;
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
    font-size:8.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
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
    font-size:8.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:8.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.12em; text-transform:uppercase;
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
  .oc-meta { font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:var(--text-2); letter-spacing:.08em; margin-bottom:8px; }
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
    font-family:'IBM Plex Mono',monospace; font-size:9.5px;
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
  .ai-timestamp { font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:var(--text-2); letter-spacing:.06em; }

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
    font-family:'IBM Plex Mono',monospace; font-size:9.5px;
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
    font-size:9.5px; letter-spacing:.28em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.22em; text-transform:uppercase;
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
    font-size:10.5px; color:var(--text-1); letter-spacing:.08em;
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
    font-size:8.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
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
    font-size:7.5px; letter-spacing:.18em; text-transform:uppercase;
    margin-bottom:6px;
  }
  .arena-sec-name {
    font-family:'Bebas Neue',sans-serif;
    font-size:18px; letter-spacing:.02em; line-height:1;
    margin-bottom:10px;
  }
  .arena-sec-meta {
    font-family:'IBM Plex Mono',monospace;
    font-size:8.5px; color:var(--text-2); letter-spacing:.06em;
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
    font-size:8.5px; letter-spacing:.16em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--text-2); margin-right:4px; flex-shrink:0;
  }
  .cin-btn {
    display:flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:5px;
    font-family:'IBM Plex Mono',monospace; font-size:9.5px;
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
    font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.2em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
    margin-bottom:4px;
  }
  .recovery-path-desc { font-size:14px; color:var(--text-1); line-height:1.5; }
  .recovery-used-note {
    font-family:'IBM Plex Mono',monospace;
    font-size:9.5px; color:var(--text-2); letter-spacing:.08em;
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
    cursor:pointer; transition:border-color .18s; overflow:hidden;
    position:relative;
  }
  .tpl:hover { border-color:var(--accent-mid); }
  .tpl.active { border-color:var(--accent); }
  .tpl-tag  { font-family:'IBM Plex Mono',monospace; font-size:8.5px; letter-spacing:.2em; color:var(--accent); margin-bottom:8px; text-transform:uppercase; }
  .tpl-name { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:.04em; line-height:1; margin-bottom:6px; }
  .tpl-desc { font-size:14px; color:var(--text-1); line-height:1.55; }

  /* HOVER TOOLTIP */
  .tpl-tooltip {
    position:absolute; bottom:calc(100% + 8px); left:0;
    width:260px; z-index:40;
    background:var(--bg-3); border:1px solid var(--border-accent);
    border-radius:9px; padding:14px 16px;
    pointer-events:none;
    opacity:0; transform:translateY(4px);
    transition:opacity .15s, transform .15s;
    box-shadow:0 8px 32px rgba(0,0,0,.5);
  }
  .tpl:hover .tpl-tooltip {
    opacity:1; transform:translateY(0);
  }
  .tpl-tooltip-text {
    font-size:13px; color:var(--text-1); line-height:1.6;
  }
  .tpl-tooltip-diff {
    font-family:'IBM Plex Mono',monospace; font-size:8px;
    letter-spacing:.14em; text-transform:uppercase;
    color:var(--accent); margin-bottom:8px;
  }

  /* DETAIL PANEL */
  .lib-detail {
    position:sticky; top:24px;
    background:var(--bg-1); border:1px solid var(--border-accent);
    border-radius:12px; padding:28px;
    animation:fadein .2s ease;
  }
  .lib-detail-tag {
    font-family:'IBM Plex Mono',monospace; font-size:8.5px;
    letter-spacing:.22em; text-transform:uppercase;
    color:var(--accent); margin-bottom:10px;
  }
  .lib-detail-name {
    font-family:'Bebas Neue',sans-serif; font-size:44px;
    letter-spacing:.04em; line-height:1; margin-bottom:12px;
  }
  .lib-detail-about {
    font-size:14px; color:var(--text-1); line-height:1.7;
    margin-bottom:20px;
  }
  .lib-detail-section {
    font-family:'IBM Plex Mono',monospace; font-size:8.5px;
    letter-spacing:.2em; text-transform:uppercase;
    color:var(--text-2); margin-bottom:8px; margin-top:18px;
  }
  .lib-detail-benefit {
    display:flex; align-items:flex-start; gap:10px;
    font-size:13.5px; color:var(--text-0); line-height:1.5;
    padding:6px 0; border-bottom:1px solid var(--border-0);
  }
  .lib-detail-benefit:last-child { border-bottom:none; }
  .lib-detail-best {
    font-size:13.5px; color:var(--text-1); line-height:1.65;
    background:var(--bg-2); border-radius:8px; padding:12px 14px;
    margin-top:4px;
  }

  /* PARTNERS */
  .partners-layout { display:flex; height:100%; overflow:hidden; }
  .p-sidebar { width:264px; flex-shrink:0; background:var(--bg-1); border-right:1px solid var(--border-0); display:flex; flex-direction:column; overflow:hidden; }
  .p-sidebar-head { padding:16px 14px 12px; border-bottom:1px solid var(--border-0); flex-shrink:0; }
  .p-sidebar-tag { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.3em; text-transform:uppercase; color:var(--text-2); margin-bottom:3px; }
  .p-sidebar-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:.04em; line-height:1; margin-bottom:10px; }
  .p-sidebar-actions { display:flex; gap:6px; }
  .p-section { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.26em; text-transform:uppercase; color:var(--text-3); padding:10px 8px 4px; }
  .p-list { flex:1; overflow-y:auto; padding:4px; display:flex; flex-direction:column; }
  /* Discord-style DM rows */
  .p-row { display:flex; align-items:center; gap:10px; padding:5px 8px; border-radius:6px; cursor:pointer; transition:background .12s; position:relative; }
  .p-row:hover { background:var(--bg-2); }
  .p-row.active { background:var(--bg-3); }
  .p-avatar { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:13px; letter-spacing:.04em; color:#080807; position:relative; }
  .p-avatar-dot { position:absolute; bottom:0; right:0; width:9px; height:9px; border-radius:50%; border:2px solid var(--bg-1); }
  .p-dot-online { background:var(--ok); }
  .p-dot-away { background:var(--accent); }
  .p-dot-offline { background:var(--text-3); }
  .p-row-info { flex:1; min-width:0; }
  .p-row-name { font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:.04em; line-height:1; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .p-row-sub { font-family:'IBM Plex Mono',monospace; font-size:8.5px; color:var(--text-2); letter-spacing:.06em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .p-row-right { display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0; }
  .p-unread { background:var(--accent); color:#080807; font-family:'IBM Plex Mono',monospace; font-size:8px; font-weight:600; min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center; justify-content:center; padding:0 4px; }
  .p-ts { font-family:'IBM Plex Mono',monospace; font-size:8px; color:var(--text-2); }
  .p-nudge-btn { position:absolute; right:8px; font-size:13px; background:none; border:none; cursor:pointer; opacity:0; transition:opacity .12s; padding:2px 4px; }
  .p-row:hover .p-nudge-btn { opacity:1; }
  /* Thread */
  .p-thread { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .p-thread-head { padding:12px 18px; border-bottom:1px solid var(--border-0); display:flex; align-items:center; gap:12px; flex-shrink:0; }
  .p-thread-avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:13px; color:#080807; }
  .p-thread-name { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:.04em; line-height:1; }
  .p-thread-meta { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin-top:2px; }
  .p-thread-bar { height:2px; background:var(--bg-3); flex-shrink:0; }
  .p-thread-bar-fill { height:100%; background:var(--accent); transition:width .4s; }
  .p-streak-pill { background:var(--bg-3); border:1px solid var(--border-1); border-radius:20px; padding:3px 10px; font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.08em; color:var(--text-1); display:flex; align-items:center; gap:5px; }
  .p-streak-pill .n { font-family:'Bebas Neue',sans-serif; font-size:15px; color:var(--accent); letter-spacing:.04em; line-height:1; }
  /* Feed — Discord grouped messages */
  .p-feed { flex:1; overflow-y:auto; padding:12px 0 8px; display:flex; flex-direction:column; }
  .p-date-div { align-self:stretch; display:flex; align-items:center; margin:6px 18px; }
  .p-date-div::before,.p-date-div::after { content:''; flex:1; height:1px; background:var(--border-0); }
  .p-date-div span { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-3); padding:0 10px; white-space:nowrap; }
  .p-group { display:flex; gap:10px; padding:2px 18px; transition:background .1s; }
  .p-group:hover { background:rgba(255,255,255,.012); }
  .p-group.me { flex-direction:row-reverse; }
  .p-group-avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:12px; color:#080807; }
  .p-group-avatar.ghost { visibility:hidden; }
  .p-group-body { display:flex; flex-direction:column; gap:2px; max-width:65%; }
  .p-group-header { display:flex; align-items:baseline; gap:8px; margin-bottom:3px; }
  .p-group.me .p-group-header { flex-direction:row-reverse; }
  .p-group-name { font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:500; color:var(--text-0); }
  .p-group-name.me { color:var(--accent); }
  .p-group-ts { font-family:'IBM Plex Mono',monospace; font-size:8.5px; color:var(--text-2); }
  .p-group.me .p-group-body { align-items:flex-end; }
  .p-bubble { display:inline-block; padding:7px 12px; font-size:13px; line-height:1.45; color:var(--text-0); border-radius:4px; word-break:break-word; }
  .p-group.them .p-bubble { background:var(--bg-2); border-radius:4px 14px 14px 14px; }
  .p-group.me .p-bubble { background:var(--accent-lo); border:1px solid var(--border-accent); border-radius:14px 4px 14px 14px; }
  .p-empty-thread { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  /* Composer */
  .p-composer { border-top:1px solid var(--border-0); padding:10px 16px 12px; flex-shrink:0; }
  .p-rxn-row { display:flex; gap:5px; margin-bottom:8px; align-items:center; }
  .p-rxn-btn { background:var(--bg-2); border:1px solid var(--border-1); border-radius:6px; padding:4px 8px; font-size:16px; cursor:pointer; transition:all .12s; line-height:1; }
  .p-rxn-btn:hover,.p-rxn-btn.sent { border-color:var(--accent); background:var(--accent-lo); }
  .p-composer-row { display:flex; gap:8px; }
  .p-input { flex:1; background:var(--bg-2); border:1px solid var(--border-1); border-radius:8px; padding:9px 14px; font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-0); outline:none; transition:border-color .15s; }
  .p-input:focus { border-color:var(--accent); }
  .p-input::placeholder { color:var(--text-2); }
  .p-no-partners { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:0; }
  .p-invite-box { background:var(--bg-2); border:1px solid var(--border-accent); border-radius:10px; padding:20px 28px; text-align:center; margin-bottom:24px; width:100%; max-width:360px; }
  .p-invite-code { font-family:'Bebas Neue',sans-serif; font-size:44px; letter-spacing:.22em; color:var(--accent); }

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
  .field-l { font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--text-2); margin-bottom:5px; }

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
  .modal-tag   { font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent); margin-bottom:4px; }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:34px; letter-spacing:.04em; margin-bottom:4px; }
  .modal-desc  { font-size:14px; color:var(--text-1); margin-bottom:22px; line-height:1.55; }

  /* DEEP WORK */
  .dw {
    position:fixed; inset:0; background:var(--bg-0);
    z-index:200; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    animation:fadein .4s ease;
  }
  .dw-tag { font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.28em; text-transform:uppercase; color:var(--text-2); margin-bottom:36px; }
  .dw-timer { font-family:'Bebas Neue',sans-serif; font-size:clamp(88px,14vw,148px); color:var(--accent); letter-spacing:.04em; line-height:1; }

  /* ENTRY */
  .entry {
    position:fixed; inset:0; background:var(--bg-0);
    z-index:999; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    animation:fadein .3s ease;
  }
  .entry-mark { font-family:'Bebas Neue',sans-serif; font-size:80px; color:var(--accent); letter-spacing:.1em; animation:up .6s ease both; }
  .entry-tag  { font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.35em; text-transform:uppercase; color:var(--text-2); animation:up .6s .1s ease both; margin-top:2px; }
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
    font-size:8.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-2);
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
  .sb-trophy-meta { font-family:'IBM Plex Mono',monospace; font-size:8.5px; color:var(--text-2); letter-spacing:.06em; }

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
    font-size:8.5px; letter-spacing:.22em; text-transform:uppercase;
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
    font-size:9.5px; color:var(--text-1); letter-spacing:.08em;
    margin-bottom:16px; position:relative; z-index:1;
  }
  .cdm-stats { display:flex; gap:20px; position:relative; z-index:1; }
  .cdm-stat-v {
    font-family:'Bebas Neue',sans-serif;
    font-size:28px; letter-spacing:.02em; line-height:1;
  }
  .cdm-stat-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:7.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2);
  }
  .cdm-body { padding:24px 28px; }
  .cdm-section { margin-bottom:24px; }
  .cdm-section-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:8.5px; letter-spacing:.2em; text-transform:uppercase;
    color:var(--text-2); margin-bottom:12px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .cdm-edit-btn {
    font-family:'IBM Plex Mono',monospace;
    font-size:8.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:8.5px; letter-spacing:.12em; text-transform:uppercase;
    padding:2px 7px; border-radius:3px; border:1px solid; flex-shrink:0;
  }
  .cdm-nn-badge {
    font-family:'IBM Plex Mono',monospace;
    font-size:7.5px; letter-spacing:.12em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.22em; text-transform:uppercase;
    color:var(--text-2);
  }
  .auth-left-logo {
    position:absolute; top:36px; left:40px;
  }
  .auth-left-logo img { height:96px; width:auto; display:block; }
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
    font-size:8.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.28em; text-transform:uppercase;
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
    font-size:10.5px; letter-spacing:.14em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.18em; text-transform:uppercase;
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
    z-index:5;
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
    z-index:20;
    pointer-events:all;
  }
  /* Scroll hint arrow */
  .ob-scroll-hint {
    font-family:"IBM Plex Mono",monospace;
    font-size:9.5px; letter-spacing:.2em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.32em; text-transform:uppercase;
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
    font-size:8.5px; letter-spacing:.2em; text-transform:uppercase;
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
    font-size:8.5px; letter-spacing:.24em; text-transform:uppercase;
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
    font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
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
// ENTRY SCREEN — three modes:
//   "landing"  → full welding-sparks sequence (first ever visit)
//   "login"    → "ENTERING THE FORGE" minimalist, ~1.5s
//   "inapp"    → bar only, ~700ms
// ============================================================

// ── Welding-sparks canvas (landing only) ──────────────────
const WeldCanvas = ({ onDone }) => {
  const canvasRef  = useRef(null);
  const particles  = useRef([]);
  const rafRef     = useRef(null);
  const intervalsRef = useRef([]);

  const SPEED = 0.75; // 25% faster than original

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    // ── particle helpers ──
    function spawnStream(x, y, count, intensity) {
      intensity = intensity || 1;
      for (let i = 0; i < count; i++) {
        const fanW  = 0.65 + intensity * 0.25;
        const angle = -Math.PI/2 + (Math.random()-0.5)*fanW*2;
        const heavy = Math.random() < 0.28;
        const speed = heavy ? 1.5+Math.random()*3 : 5+Math.random()*12*intensity;
        const life  = heavy ? 0.6+Math.random()*0.7 : 0.22+Math.random()*0.6;
        const temp  = Math.random();
        const color = temp>0.7?"#FFFDE0":temp>0.4?"#FFD060":temp>0.2?"#FF9020":"#FF5500";
        particles.current.push({
          x,y,px:x,py:y,
          vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
          life, maxLife:life, color,
          width: heavy?1.3:0.5+Math.random()*0.7,
          trailLen: heavy?2+Math.random()*5:7+Math.random()*20,
          gravity: heavy?0.32:0.21, drag: heavy?0.968:0.991,
          floor: y+40+Math.random()*90,
          bounced:false, fadePow: heavy?1.3:0.65,
        });
      }
    }

    function streamSparks(getPos, totalMs, pps) {
      pps = pps || 60;
      const interval = 1000/pps;
      const end = performance.now()+totalMs;
      const id = setInterval(() => {
        if (performance.now()>=end) { clearInterval(id); return; }
        const pos = getPos();
        spawnStream(pos.x, pos.y, 1+Math.floor(Math.random()*3), 1);
      }, interval);
      intervalsRef.current.push(id);
      return id;
    }

    function drawFrame() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const arr = particles.current;
      for (let i=arr.length-1;i>=0;i--) {
        const p=arr[i];
        p.px=p.x; p.py=p.y;
        p.x+=p.vx; p.y+=p.vy;
        p.vy+=p.gravity; p.vx*=p.drag;
        if (!p.bounced && p.y>p.floor && p.vy>0) {
          p.bounced=true;
          if (Math.random()>0.5) {
            for (let j=0;j<2;j++) {
              const a=-Math.PI/2+(Math.random()-0.5)*Math.PI*0.8;
              const s=0.8+Math.random()*2;
              arr.push({x:p.x,y:p.y,px:p.x,py:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.5,
                life:0.12+Math.random()*0.18,maxLife:0.3,color:"#FF6A00",width:0.4,
                trailLen:3,gravity:0.25,drag:0.98,floor:p.floor+999,bounced:true,fadePow:1});
            }
          }
          p.life=0;
        }
        p.life-=0.015;
        if (p.life<=0){arr.splice(i,1);continue;}
        const a=Math.pow(Math.max(0,p.life/p.maxLife),p.fadePow);
        ctx.globalAlpha=a;
        const dx=p.x-p.px,dy=p.y-p.py;
        const mag=Math.sqrt(dx*dx+dy*dy)||1;
        ctx.beginPath();
        ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.lineCap="round";
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x-(dx/mag)*p.trailLen,p.y-(dy/mag)*p.trailLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle=a>0.5?"#FFFFFF":p.color;
        ctx.arc(p.x,p.y,p.width*0.85,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;
      rafRef.current=requestAnimationFrame(drawFrame);
    }
    rafRef.current=requestAnimationFrame(drawFrame);

    // ── letter stamp sequence ──
    // Letters are rendered in a hidden div; we measure their positions
    const letterEls = Array.from(document.querySelectorAll(".forge-stamp-letter"));

    function getBase(idx) {
      const el=letterEls[idx];
      if (!el) return {x:window.innerWidth/2,y:window.innerHeight/2};
      const r=el.getBoundingClientRect();
      return {x:r.left+r.width/2, y:r.top+r.height*0.78};
    }

    function forgeLetter(idx, startDelay) {
      return new Promise(resolve => {
        setTimeout(() => {
          const el=letterEls[idx];
          if (!el) { resolve(); return; }
          el.style.transition="none";
          el.style.opacity="1";
          el.style.color="#1A1916";
          const workDuration=(700+Math.random()*250)*SPEED;
          const sid=streamSparks(()=>getBase(idx),workDuration,60);
          setTimeout(()=>{ el.style.transition="color .35s ease"; el.style.color="#7A4A10"; }, workDuration*0.4);
          setTimeout(()=>{
            clearInterval(sid);
            const pos=getBase(idx);
            spawnStream(pos.x,pos.y,55,1.5);
            el.style.transition="none"; el.style.color="#FFF8DC";
            setTimeout(()=>{ el.style.transition="color .8s ease,text-shadow .9s ease"; el.style.color="#D4922A"; el.style.textShadow="0 0 12px #D4922A20"; },90);
            setTimeout(()=>{ el.style.textShadow="none"; resolve(); },900);
          },workDuration);
        },startDelay);
      });
    }

    // bar fill
    const barEl = document.getElementById("forge-landing-bar");
    function fillBar(duration) {
      if (!barEl) return;
      barEl.style.width="0%";
      const start=performance.now();
      function tick(now) {
        const t=Math.min((now-start)/duration,1);
        barEl.style.width=(Math.pow(t,0.55)*100)+"%";
        if(t<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    async function run() {
      await new Promise(r=>setTimeout(r,500*SPEED));
      const STAGGER=580*SPEED;
      const promises=letterEls.map((_,i)=>forgeLetter(i,i*STAGGER));
      const totalForgeTime=letterEls.length*STAGGER+900*SPEED;
      setTimeout(()=>fillBar(2600*SPEED), totalForgeTime*0.55);
      await Promise.all(promises);

      // residual cooling sparks
      let rc=0;
      const rid=setInterval(()=>{
        const idx=Math.floor(Math.random()*letterEls.length);
        const pos=getBase(idx);
        spawnStream(pos.x+(Math.random()-0.5)*10,pos.y,3+Math.floor(Math.random()*5),0.55);
        rc++;if(rc>22)clearInterval(rid);
      },180);
      intervalsRef.current.push(rid);

      // subtitle
      const subEl=document.getElementById("forge-landing-sub");
      if(subEl){ subEl.style.transition="color 1.2s ease"; subEl.style.color="#56524D"; }

      // signal done after cooling sparks settle
      setTimeout(onDone, 2200);
    }

    run();

    return () => {
      cancelAnimationFrame(rafRef.current);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}} />;
};

// ── Landing loader (sparks) ───────────────────────────────
const LandingLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const MIN_MS = Math.round((500 + 5*580 + 900 + 2200) * 0.75); // ~total sequence at 0.75×

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <WeldCanvas onDone={()=>{}} />
      <div style={{position:"relative",zIndex:2,display:"flex",gap:2}}>
        {["F","O","R","G","E"].map((l,i)=>(
          <span key={i} id={`fsl${i}`} className="forge-stamp-letter" style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:100, color:"#080807",
            letterSpacing:".06em", display:"inline-block", opacity:0,
            willChange:"transform,color,opacity",
          }}>{l}</span>
        ))}
      </div>
      <div id="forge-landing-sub" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".38em",textTransform:"uppercase",color:"transparent",marginTop:10,position:"relative",zIndex:2}}>
        your discipline engine
      </div>
      <div style={{width:220,height:1,background:"#161614",marginTop:56,overflow:"hidden",position:"relative",zIndex:2}}>
        <div id="forge-landing-bar" style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

// ── Login loader ("ENTERING THE FORGE") ──────────────────
const MIN_LOGIN_MS = 1400;

const LoginLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible,    setVisible]    = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    // Fade in text
    const t1 = setTimeout(() => setVisible(true), 100);
    // Fill bar
    const t2 = setTimeout(() => {
      if (!barRef.current) return;
      const start = performance.now();
      const dur = 1000;
      function tick(now) {
        const prog = Math.min((now-start)/dur,1);
        const e = 1-Math.pow(1-prog,2.2);
        if (barRef.current) barRef.current.style.width=(e*100)+"%";
        if (prog<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 150);
    // Min time gate
    const t3 = setTimeout(() => setMinElapsed(true), MIN_LOGIN_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{
        fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5,
        letterSpacing:".42em", textTransform:"uppercase",
        opacity: visible ? 1 : 0,
        transition:"opacity .45s ease",
        marginBottom:36,
      }}>
        <span style={{color:"#56524D"}}>ENTERING THE </span>
        <span style={{color:"#D4922A"}}>FORGE</span>
      </div>
      <div style={{width:160,height:1,background:"#161614",overflow:"hidden"}}>
        <div ref={barRef} style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

// ── In-app loader (bar only) ──────────────────────────────
const MIN_INAPP_MS = 700;

const InAppLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now-start)/MIN_INAPP_MS,1);
      const e = 1-Math.pow(1-t,2);
      if (barRef.current) barRef.current.style.width=(e*100)+"%";
      if (t<1) requestAnimationFrame(tick);
      else setMinElapsed(true);
    }
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <div style={{width:120,height:1,background:"#161614",overflow:"hidden"}}>
        <div ref={barRef} style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,letterSpacing:".3em",textTransform:"uppercase",color:"#3A3835"}}>
        loading
      </div>
    </div>
  );
};

// ── Entry: routes to correct loader based on mode ─────────
const Entry = ({ onDone, authReady, mode }) => {
  if (mode === "login")  return <LoginLoader  onDone={onDone} authReady={authReady} />;
  if (mode === "inapp")  return <InAppLoader  onDone={onDone} authReady={authReady} />;
  return <LandingLoader onDone={onDone} authReady={authReady} />;
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
          {/* Logo */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
            <img src="/forge_wordmark_dark.png" alt="Forge" style={{height:144,width:"auto"}} />
          </div>
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
// ONBOARDING — Screen 4: Pick Your Challenge
// ============================================================
const DIFF_COLOR = { Hard:"#BF5D5D", Intense:"#D4B22A", Moderate:"#5DBF8A", "You decide":"#4A8FD4" };

const OnboardChallenge = ({ onStart, onSkip }) => {
  const [selected,   setSelected]   = useState(null);
  const [editTasks,  setEditTasks]  = useState(false);
  const [tasks,      setTasks]      = useState([]);
  const templates = TEMPLATES.filter(t => t.id !== "custom");
  const t = selected || templates[0];

  // Sync tasks when selection changes
  const selectTemplate = (tmpl) => {
    setSelected(tmpl);
    setTasks(tmpl.kpis.map((k,i) => ({ id:i, label:k.label, cat:k.cat })));
    setEditTasks(false);
  };

  // Init tasks on mount
  useEffect(() => {
    if (tasks.length === 0) setTasks(templates[0].kpis.map((k,i) => ({ id:i, label:k.label, cat:k.cat })));
  }, []);

  const addTask    = () => setTasks(ts => [...ts, { id:Date.now(), label:"", cat:"other" }]);
  const removeTask = (id) => setTasks(ts => ts.filter(x => x.id !== id));
  const updateTask = (id, val) => setTasks(ts => ts.map(x => x.id===id ? {...x, label:val} : x));
  const validTasks = tasks.filter(t => t.label.trim());

  return (
    <div style={{
      position:"fixed", inset:0, background:"var(--bg-0)", zIndex:999,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        padding:"28px 32px 20px", borderBottom:"1px solid var(--border-0)",
        display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexShrink:0,
      }}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".35em",textTransform:"uppercase",color:"var(--accent)",marginBottom:8}}>
            Final step — choose your challenge
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:".04em",lineHeight:1}}>
            What are you committing to?
          </div>
        </div>
        <button onClick={onSkip} style={{background:"none",border:"none",fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-2)",cursor:"pointer",paddingBottom:4}}>
          Skip for now →
        </button>
      </div>

      {/* Body — two columns */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Left — card list */}
        <div style={{
          width:300, flexShrink:0, overflowY:"auto",
          borderRight:"1px solid var(--border-0)", padding:"16px 12px",
          display:"flex", flexDirection:"column", gap:8,
        }}>
          {templates.map(tmpl => (
            <div key={tmpl.id}
              onClick={()=>selectTemplate(tmpl)}
              style={{
                background: selected?.id===tmpl.id ? "var(--accent-lo)" : "var(--bg-2)",
                border: `1px solid ${selected?.id===tmpl.id ? "var(--accent)" : "var(--border-1)"}`,
                borderRadius:8, padding:"14px 16px", cursor:"pointer",
                transition:"border-color .15s, background .15s",
              }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".28em",textTransform:"uppercase",color:"var(--accent)",marginBottom:5}}>
                {tmpl.tag} · {tmpl.duration}d
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".04em",color:"var(--text-0)",marginBottom:5}}>
                {tmpl.name}
              </div>
              <div style={{
                display:"inline-block",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".16em",
                textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
                color: DIFF_COLOR[tmpl.difficulty]||"var(--text-2)",
                background: (DIFF_COLOR[tmpl.difficulty]||"#888")+"18",
                border:`1px solid ${(DIFF_COLOR[tmpl.difficulty]||"#888")}30`,
              }}>{tmpl.difficulty}</div>
            </div>
          ))}
        </div>

        {/* Right — detail panel */}
        <div style={{flex:1, overflowY:"auto", padding:"28px 36px"}}>
          {/* Title + badge */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--accent)"}}>
              {t.tag}
            </div>
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".16em",
              textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
              color: DIFF_COLOR[t.difficulty]||"var(--text-2)",
              background:(DIFF_COLOR[t.difficulty]||"#888")+"18",
              border:`1px solid ${(DIFF_COLOR[t.difficulty]||"#888")}30`,
            }}>{t.difficulty}</div>
          </div>

          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,letterSpacing:".04em",lineHeight:1,marginBottom:16,color:"var(--text-0)"}}>
            {t.name}
          </div>

          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.7,marginBottom:24}}>
            {t.about}
          </div>

          {/* Daily tasks */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)"}}>
                Daily tasks
              </div>
              <button onClick={()=>setEditTasks(e=>!e)} style={{background:"none",border:"1px solid var(--border-1)",borderRadius:4,padding:"3px 10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".16em",textTransform:"uppercase",color:"var(--text-2)",cursor:"pointer"}}>
                {editTasks ? "Done editing" : "Edit tasks"}
              </button>
            </div>
            {!editTasks ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {tasks.map((k,i)=>(
                  <div key={k.id||i} style={{
                    display:"flex",alignItems:"center",gap:10,
                    background:"var(--bg-2)",border:"1px solid var(--border-1)",
                    borderRadius:6,padding:"10px 14px",
                  }}>
                    <div style={{
                      width:6,height:6,borderRadius:"50%",flexShrink:0,
                      background: k.cat==="body"?"#D4922A":k.cat==="diet"?"#5DBF8A":k.cat==="mind"?"#4A8FD4":k.cat==="build"?"#BF5DBF":"var(--text-2)",
                    }} />
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-0)",letterSpacing:".06em"}}>
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {tasks.map((tk,i)=>(
                  <div key={tk.id||i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input
                      value={tk.label}
                      onChange={e=>updateTask(tk.id||i, e.target.value)}
                      placeholder={`Task ${i+1}`}
                      style={{
                        flex:1,background:"var(--bg-3)",border:"1px solid var(--border-1)",
                        borderRadius:6,padding:"9px 12px",color:"var(--text-0)",
                        fontFamily:"'IBM Plex Mono',monospace",fontSize:11,outline:"none",
                      }}
                    />
                    {tasks.length > 1 && (
                      <div onClick={()=>removeTask(tk.id||i)} style={{color:"var(--text-2)",cursor:"pointer",fontSize:12,padding:"4px 6px"}}>✕</div>
                    )}
                  </div>
                ))}
                <button onClick={addTask} style={{background:"none",border:"1px dashed var(--border-1)",borderRadius:6,padding:"9px",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:".14em",color:"var(--text-2)",cursor:"pointer",textAlign:"center"}}>
                  + Add task
                </button>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:12}}>
              What you'll build
            </div>
            {t.benefits.map(b=>(
              <div key={b} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,marginTop:1}}>◆</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>{b}</span>
              </div>
            ))}
          </div>

          {/* Best for */}
          <div style={{
            background:"var(--bg-2)",border:"1px solid var(--border-1)",
            borderRadius:8,padding:"16px 20px",marginBottom:32,
          }}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>
              Best for
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>
              {t.bestFor}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={()=>onStart(t, validTasks)}
            style={{
              width:"100%", padding:"16px", borderRadius:8,
              background:"var(--accent)", color:"#080807",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".1em",
              border:"none", cursor:"pointer",
              boxShadow:"0 4px 0 rgba(0,0,0,.4)",
              transition:"transform .1s, box-shadow .1s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 0 rgba(0,0,0,.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 0 rgba(0,0,0,.4)";}}
          >
            Start {t.name} — Day 1 Begins Now →
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// DEEP WORK ERROR BOUNDARY
// ============================================================
class DeepWorkBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  componentDidCatch(error, info) { console.error("[DeepWork crash]", error, info); }
  render() {
    if (this.state.crashed) return (
      <div style={{position:"fixed",inset:0,background:"#080807",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:24}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:".2em",textTransform:"uppercase",color:"#56524D"}}>Something went wrong</div>
        <button className="btn btn-g" onClick={this.props.onExit}>← Exit Deep Work</button>
      </div>
    );
    return this.props.children;
  }
}

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
  const safeKpis = (challenge && challenge.kpis) ? challenge.kpis : [];
  const doneTasks = safeKpis.filter(k => kpis && kpis[k.key]).length;

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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Resume context — required by autoplay policy in production
      const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
      resume.then(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
        } catch(e) {}
      }).catch(()=>{});
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
            { n: safeKpis.length > 0 ? `${sessionTasks}/${safeKpis.length}` : "—", l:"Tasks Done" },
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
        {/* Always-visible exit button at top */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button className="btn btn-g" style={{fontSize:11}} onClick={phase!=="idle"?endSession:onExit}>
            {phase!=="idle"?"✕ End Session":"← Exit"}
          </button>
          {challenge && (
            <div className="dw-tag" style={{margin:0}}>deep work · day {challenge.dayNum} of {challenge.totalDays}</div>
          )}
        </div>

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

        {/* Tasks — only show if there are tasks */}
        {safeKpis.length > 0 && (
          <>
            <div className="dv-label mt8">Today's Tasks — {doneTasks}/{safeKpis.length}</div>
            <TaskGrid tasks={safeKpis} taskState={kpis} toggle={toggle} />
          </>
        )}

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
                <div style={{flex:1,minWidth:0}}>
                  <div className="task-card-label" style={ isScaled && !isDone ? { color:"var(--text-1)", fontSize:12 } : {}}>
                    {label}
                  </div>
                </div>
                <div className="task-cat-tag" style={{
                  color: cardColor,
                  borderColor:`${cardColor}44`,
                  background:`${cardColor}12`,
                  flexShrink:0,
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

const AIInsight = ({ tone, mission, challenge, kpis, checkins }) => {
  const [loading,    setLoading]    = useState(false);
  const [insight,    setInsight]    = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  // Build a data snapshot from real state
  const buildContext = () => {
    if (!challenge) return null;
    const tasks    = challenge.kpis || [];
    const done     = tasks.filter(t => kpis?.[t.key]).length;
    const total    = tasks.length;
    const checkinDates = Object.keys(checkins || {}).sort();
    const last7    = checkinDates.slice(-7).map(d => ({ date: d, score: checkins[d] }));
    const avgScore = last7.length > 0
      ? Math.round(last7.reduce((s,c) => s + (c.score||0), 0) / last7.length)
      : null;

    return {
      challengeName: challenge.name,
      dayNum:        challenge.dayNum,
      totalDays:     challenge.totalDays,
      streak:        challenge.streak,
      consistency:   challenge.consistency,
      mission,
      tone,
      todayDone:     done,
      todayTotal:    total,
      todayTasks:    tasks.map(t => ({ label: t.label, done: !!kpis?.[t.key] })),
      last7Days:     last7,
      avgScoreLast7: avgScore,
      daysLogged:    checkinDates.length,
    };
  };

  const generate = async () => {
    const ctx = buildContext();
    if (!ctx) return;
    setLoading(true);
    try {
      const toneVoices = {
        "Stoic":          "Speak like Marcus Aurelius. Blunt, philosophical, no flattery. Identify the gap between what they say they want and what the data shows.",
        "Coach":          "Speak like a sharp personal coach. Warm but direct. Identify patterns and give one clear tactical suggestion.",
        "Drill Sergeant": "Speak like a no-nonsense sergeant. No softening. Call out exactly what's weak and demand better.",
      };
      const voice = toneVoices[ctx.tone] || toneVoices["Coach"];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 120,
          messages: [{
            role: "user",
            content: `You are Forge Intelligence. ${voice}

User data:
- Challenge: ${ctx.challengeName}
- Day ${ctx.dayNum} of ${ctx.totalDays}
- Streak: ${ctx.streak} days
- Consistency: ${ctx.consistency}%
- Mission: "${ctx.mission || "Not set"}"
- Today: ${ctx.todayDone}/${ctx.todayTotal} tasks done
- Today's tasks: ${ctx.todayTasks.map(t => `${t.done ? "✓" : "✗"} ${t.label}`).join(", ")}
- Last 7 days scores: ${ctx.last7Days.length > 0 ? ctx.last7Days.map(d => `${d.date}: ${d.score}%`).join(", ") : "No data yet"}
- Avg score last 7 days: ${ctx.avgScoreLast7 !== null ? ctx.avgScoreLast7 + "%" : "No history yet"}
- Total days logged: ${ctx.daysLogged}

Write ONE insight. 2-3 sentences max. No preamble. No "Here is your insight:". Speak directly to the user. Reference their actual data — don't be generic.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "No insight generated.";
      setInsight(text);
      setLastUpdate(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) {
      setInsight("Could not reach Forge Intelligence. Check your connection.");
    }
    setLoading(false);
  };

  // Auto-generate on first load if we have data
  useEffect(() => {
    if (challenge && !insight && !loading) generate();
  }, [challenge?.id]);

  useEffect(() => {
    // Regenerate when tone changes if we already have data
    if (challenge && insight) generate();
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
        <div className="ai-text">{insight || "Waiting for data…"}</div>
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
const Home = ({ challenge, challenges, kpis, toggle, onDW, tone, mission, onAddSecondary, userName, onViewChallenge, onLogDay, loggedToday, checkins = {} }) => {
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
        <AIInsight tone={tone} mission={mission} challenge={challenge} kpis={kpis} checkins={checkins} />
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

      {/* ── Fixed Log Day Bar ── */}
      <LogDayBar
        done={done} total={total} logged={loggedToday}
        onLog={() => onLogDay && onLogDay(done, total)}
      />
    </div>
  );
};

// ============================================================
// LOG DAY BAR
// ============================================================
const LogDayBar = ({ done, total, logged, onLog }) => {
  const [showCaution, setShowCaution] = useState(false);
  const allDone   = total > 0 && done === total;
  const noneDone  = done === 0;
  const partDone  = done > 0 && done < total;

  const handleClick = () => {
    if (logged || noneDone) return;
    if (allDone) { onLog(); return; }
    if (partDone) setShowCaution(true);
  };

  return (
    <>
      {/* Caution popup */}
      {showCaution && (
        <div className="overlay" onClick={()=>setShowCaution(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420,padding:32}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--warn)",marginBottom:8}}>⚠ Incomplete Day</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".02em",marginBottom:12}}>Not All Tasks Done</div>
            <div style={{fontSize:14,color:"var(--text-1)",lineHeight:1.6,marginBottom:24}}>
              You've completed <strong style={{color:"var(--text-0)"}}>{done} of {total} tasks</strong>. Logging now will record this as a partial day on your wall.
              <br/><br/>
              Are you sure you want to log today as-is?
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-a" style={{background:"var(--warn)",borderColor:"var(--warn)",color:"#080807"}}
                onClick={()=>{ setShowCaution(false); onLog(); }}>
                Log Anyway
              </button>
              <button className="btn btn-g" onClick={()=>setShowCaution(false)}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The bar */}
      <div style={{
        position:"fixed", bottom:0, left:60, right:0,
        background:"var(--bg-1)", borderTop:"1px solid var(--border-0)",
        padding:"12px 28px", display:"flex", alignItems:"center",
        justifyContent:"space-between", zIndex:80,
        backdropFilter:"blur(8px)",
      }}>
        {/* Progress summary */}
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:28, lineHeight:1,
            color: allDone ? "var(--ok)" : partDone ? "var(--accent)" : "var(--text-3)",
          }}>
            {done}/{total}
          </div>
          <div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".14em",textTransform:"uppercase",
              color: allDone ? "var(--ok)" : partDone ? "var(--accent)" : "var(--text-2)"}}>
              {logged ? "Day Logged ✓" : allDone ? "All tasks done" : noneDone ? "No tasks done yet" : `${total-done} remaining`}
            </div>
            <div style={{width:120,height:2,background:"var(--bg-3)",borderRadius:1,marginTop:4,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:1,transition:"width .4s ease",
                width: total > 0 ? `${(done/total)*100}%` : "0%",
                background: allDone ? "var(--ok)" : "var(--accent)",
              }} />
            </div>
          </div>
        </div>

        {/* Button */}
        {logged ? (
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:".14em",
            textTransform:"uppercase",color:"var(--ok)",display:"flex",alignItems:"center",gap:6}}>
            ✓ Logged Today
          </div>
        ) : (
          <button
            disabled={noneDone}
            onClick={handleClick}
            className="btn btn-a"
            style={{
              padding:"10px 28px", fontSize:14, letterSpacing:".06em",
              opacity: noneDone ? 0.35 : 1,
              cursor: noneDone ? "not-allowed" : "pointer",
              boxShadow: allDone ? "0 0 16px var(--accent-mid)" : "none",
              transition:"all .2s",
            }}>
            {allDone ? "✓ Log Perfect Day" : "Log Day →"}
          </button>
        )}
      </div>
    </>
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

const Wall = ({ challenge, challenges, checkins = {} }) => {
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

  // Build wall from real checkin data
  const today = new Date().toISOString().split("T")[0];
  const startDate = challenges.main?.created_at
    ? new Date(challenges.main.created_at).toISOString().split("T")[0]
    : today;

  const wallDays = (() => {
    const days = [];
    const start = new Date(startDate + "T00:00:00");
    const end   = new Date(today + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        score: checkins[dateStr] !== undefined ? checkins[dateStr] : null,
        isToday: dateStr === today,
        day: Math.floor((d - start) / 86400000) + 1,
      });
    }
    return days;
  })();

  const strong  = wallDays.filter(d => d.score !== null && d.score >= 75).length;
  const missed  = wallDays.filter(d => d.score === 0).length;
  const grouped = groupByMonth(wallDays);
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
                    style={{ background: wallColor(d.score), opacity: d.score === null && !d.isToday ? 0.4 : 1 }}
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
          { n:strong,                l:"Strong Days (75%+)",  c:"c-ok"   },
          { n:missed,                l:"Missed Days",         c:"c-err"  },
          { n:Object.keys(checkins).length, l:"Days Logged",  c:"c-warn" },
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
  const [mode,   setMode]   = useState(isSecondaryMode ? "secondary" : "main");
  const [active, setActive] = useState(null); // selected template for detail panel

  const selected = TEMPLATES.find(t => t.id === active);
  const isSecMode = mode === "secondary" || isSecondaryMode;

  const DIFF_COLOUR = { "Hard":"var(--err)", "Intense":"var(--warn)", "Moderate":"var(--ok)", "You decide":"var(--text-2)" };

  return (
    <div className={isSecondaryMode ? "" : "page"} style={isSecondaryMode ? { padding:"28px" } : { maxWidth:"100%" }}>
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

      {/* Two-column layout: cards left fixed width, detail fills right */}
      <div style={{ display:"grid", gridTemplateColumns: isSecondaryMode ? "1fr" : "380px 1fr", gap:24, marginTop: isSecondaryMode ? 0 : 20, alignItems:"stretch" }}>

        {/* Cards grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {TEMPLATES.map((t,i) => (
            <div key={t.id}
              className={`tpl a${Math.min(i+1,5)} ${active===t.id?"active":""}`}
              onClick={() => isSecondaryMode ? onPick(t) : setActive(prev => prev === t.id ? null : t.id)}>

              {/* Hover tooltip — only in full library */}
              {!isSecondaryMode && (
                <div className="tpl-tooltip">
                  <div className="tpl-tooltip-diff" style={{ color: DIFF_COLOUR[t.difficulty] || "var(--accent)" }}>
                    {t.difficulty} · {t.duration} days
                  </div>
                  <div className="tpl-tooltip-text">{t.blurb}</div>
                </div>
              )}

              <div className="tpl-tag">{t.tag} · {t.duration}D</div>
              <div className="tpl-name">{t.name}</div>
              <div className="tpl-desc">{t.kpis.length > 0 ? `${t.kpis.length} daily tasks` : "Define your own tasks"}</div>
              {isSecondaryMode ? (
                <div style={{ marginTop:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:9.5, color:"var(--text-2)", lineHeight:1.55 }}>
                  {t.blurb}
                </div>
              ) : (
                <div style={{ marginTop:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:8.5, letterSpacing:".14em", textTransform:"uppercase", color: active===t.id ? "var(--text-0)" : "var(--accent)", opacity:.9, display:"flex", alignItems:"center", gap:6 }}>
                  {active === t.id ? "↑ Close" : "→ Learn more"}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column — hidden in secondary mode */}
        <div style={{ display: isSecondaryMode ? "none" : "flex", flexDirection:"column" }}>
          {!selected ? (
            <div style={{
              height:"100%", minHeight:520, flex:1,
              border:"1px dashed var(--border-1)", borderRadius:12,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:10,
            }}>
              <div style={{ fontSize:28, color:"var(--text-3)", opacity:.4 }}>◆</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".22em",
                textTransform:"uppercase", color:"var(--text-3)", opacity:.5 }}>
                Select a challenge to preview
              </div>
            </div>
          ) : (
            <div className="lib-detail">
              <div className="lib-detail-tag">{selected.tag} · {selected.duration} days</div>
              <div className="lib-detail-name">{selected.name}</div>

              {/* Difficulty badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:16,
                fontFamily:"'IBM Plex Mono',monospace", fontSize:8.5, letterSpacing:".14em",
                textTransform:"uppercase", background:"var(--bg-2)", border:"1px solid var(--border-1)",
                borderRadius:6, padding:"4px 10px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background: DIFF_COLOUR[selected.difficulty] || "var(--accent)", flexShrink:0 }} />
                <span style={{ color: DIFF_COLOUR[selected.difficulty] || "var(--accent)" }}>{selected.difficulty}</span>
              </div>

              <div className="lib-detail-about">{selected.about}</div>

              <div className="lib-detail-section">Benefits</div>
              {selected.benefits.map((b,i) => (
                <div key={i} className="lib-detail-benefit">
                  <span style={{ color:"var(--accent)", marginTop:2, flexShrink:0 }}>◆</span>
                  <span>{b}</span>
                </div>
              ))}

              <div className="lib-detail-section">Best For</div>
              <div className="lib-detail-best">{selected.bestFor}</div>

              {selected.kpis.length > 0 && (
                <>
                  <div className="lib-detail-section">Daily Tasks</div>
                  {selected.kpis.map(k => (
                    <div key={k.key} style={{ fontSize:13, color:"var(--text-1)", padding:"5px 0",
                      borderBottom:"1px solid var(--border-0)", display:"flex", gap:8 }}>
                      <span style={{ color:"var(--text-3)" }}>—</span>{k.label}
                    </div>
                  ))}
                </>
              )}

              {/* Second CTA at bottom */}
              <button className="btn btn-a w100"
                style={{ justifyContent:"center", marginTop:22, fontSize:15, padding:"12px 0" }}
                onClick={() => { onPick(selected, isSecMode); setActive(null); }}>
                {isSecMode ? `+ Start as Secondary` : `→ Start Challenge`}
              </button>
            </div>
          )}
        </div>
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
  const [nonNeg,      setNonNeg]      = useState([]);

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
                  <div key={t.id} style={{ fontSize:14, color:"var(--text-1)", padding:"4px 0", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
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
  const [partners,        setPartners]        = useState([]);
  const [activePartner,   setActivePartner]   = useState(null);
  const [msgText,         setMsgText]         = useState("");
  const [sending,         setSending]         = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [joinCode,        setJoinCode]        = useState("");
  const [joinError,       setJoinError]       = useState("");
  const [joinLoading,     setJoinLoading]     = useState(false);
  const [showAdd,         setShowAdd]         = useState(false);
  const [unreadMap,       setUnreadMap]       = useState({});
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [sentReaction,    setSentReaction]    = useState(null);
  const [clearPref,       setClearPref]       = useState("never");
  const [showClearMenu,   setShowClearMenu]   = useState(false);
  // Per-partner message cache — keyed by partner ID, never wiped on switch
  const msgCache = useRef({});
  const [msgTick, setMsgTick] = useState(0); // increment to force re-render from cache
  const feedRef = useRef(null);
  const activePartnerRef = useRef(null);

  // Derive messages for active partner from cache
  const messages = activePartner ? (msgCache.current[activePartner.partnerProfile.id] || []) : [];
  const setMessages = (pid, updater) => {
    msgCache.current[pid] = typeof updater === "function" ? updater(msgCache.current[pid] || []) : updater;
    setMsgTick(t => t + 1);
  };

  const CLEAR_OPTIONS = [
    { value:"never",   label:"Never clear" },
    { value:"session", label:"Clear on close" },
    { value:"7d",      label:"After 7 days" },
    { value:"30d",     label:"After 30 days" },
  ];

  const myCode = profile?.invite_code || "";

  // Deterministic avatar colour from name
  const avatarColor = (name) => {
    const colors = ['#D4922A','#5DBF8A','#4A8FD4','#8B5CF6','#BF5D5D','#0DBEAA','#E07B4A','#D4B22A'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };
  const initials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0]+parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
  };

  const loadPartners = async () => {
    if (!sb || !user) return;
    try {
      const { data: asUser }    = await sb.from("partnerships").select("*").eq("user_id",    user.id).eq("status","active");
      const { data: asPartner } = await sb.from("partnerships").select("*").eq("partner_id", user.id).eq("status","active");
      const rows = [...(asUser||[]), ...(asPartner||[])];
      if (!rows.length) { setPartners([]); setPartnersLoading(false); return; }
      const otherIds = [...new Set(rows.map(r => r.user_id === user.id ? r.partner_id : r.user_id))];
      const { data: profileRows } = await sb.from("profiles").select("id,full_name,invite_code").in("id", otherIds);
      const profileMap = Object.fromEntries((profileRows||[]).map(p => [p.id, p]));
      const { data: chalRows } = await sb.from("challenges")
        .select("user_id,name,tag,day_num,total_days,streak,archived")
        .in("user_id", otherIds).eq("is_main", true).eq("archived", false);
      const chalMap = Object.fromEntries((chalRows||[]).map(c => [c.user_id, c]));
      const { data: unreadRows } = await sb.from("partner_messages")
        .select("from_user_id").eq("to_user_id", user.id).eq("read", false);
      const counts = {};
      (unreadRows||[]).forEach(r => { counts[r.from_user_id] = (counts[r.from_user_id]||0) + 1; });
      setUnreadMap(counts);
      const all = rows.map(r => {
        const otherId = r.user_id === user.id ? r.partner_id : r.user_id;
        return { ...r, partnerProfile: profileMap[otherId] || { id:otherId, full_name:"Partner" }, challenge: chalMap[otherId] || null };
      });
      setPartners(all);
      setPartnersLoading(false);
    } catch(e) { console.warn("loadPartners:", e); setPartnersLoading(false); }
  };

  const loadMessages = async (partnerId) => {
    if (!sb || !user) return;
    try {
      // 30 day window
      const since = new Date(Date.now() - 30*24*3600*1000).toISOString();
      const { data } = await sb.from("partner_messages")
        .select("*")
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`)
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(200);
      const confirmed = data || [];
      // Drop optimistic messages that have been confirmed in DB
      // Match by body + sender + within 30s window
      setMessages(partnerId, prev => {
        const optimistics = (prev||[]).filter(m => String(m.id).startsWith("opt-"));
        const stillPending = optimistics.filter(opt => {
          const optTime = new Date(opt.created_at).getTime();
          return !confirmed.some(c =>
            c.from_user_id === opt.from_user_id &&
            c.body === opt.body &&
            Math.abs(new Date(c.created_at).getTime() - optTime) < 30000
          );
        });
        return [...confirmed, ...stillPending];
      });
      await sb.from("partner_messages").update({ read: true })
        .eq("to_user_id", user.id).eq("from_user_id", partnerId);
      setUnreadMap(m => ({ ...m, [partnerId]: 0 }));
    } catch(e) { console.warn("loadMessages:", e); }
  };

  useEffect(() => { loadPartners(); }, [user, profile]);
  useEffect(() => {
    if (!activePartner) return;
    const pid = activePartner.partnerProfile.id;
    activePartnerRef.current = pid;
    // Load prefs
    const savedPref = localStorage.getItem(`forge_clearpref_${pid}`) || "never";
    setClearPref(savedPref);
    // Only fetch if not already cached
    if (!msgCache.current[pid]) {
      loadMessages(pid);
    }
  }, [activePartner]);
  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages]);

  // Poll for incoming messages every 10s
  useEffect(() => {
    if (!activePartner) return;
    const pid = activePartner.partnerProfile.id;
    const interval = setInterval(() => loadMessages(pid), 10000);
    return () => clearInterval(interval);
  }, [activePartner]);

  const copyCode = () => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const joinPartner = async () => {
    setJoinError(""); setJoinLoading(true);
    try {
      if (!joinCode.trim()) throw new Error("Enter an invite code.");
      if (joinCode.trim().toUpperCase() === myCode) throw new Error("That's your own code.");
      const { data: tp, error: pErr } = await sb.from("profiles").select("id,full_name")
        .eq("invite_code", joinCode.trim().toUpperCase()).maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!tp) throw new Error("No user found with that code.");
      const { data: ex } = await sb.from("partnerships").select("id,status")
        .or(`and(user_id.eq.${user.id},partner_id.eq.${tp.id}),and(user_id.eq.${tp.id},partner_id.eq.${user.id})`).maybeSingle();
      if (ex) throw new Error(ex.status === "active" ? "Already partners." : "Already sent.");
      const { error: iErr } = await sb.from("partnerships").insert({
        user_id: user.id, partner_id: tp.id,
        invite_code: `${user.id.slice(0,8)}${tp.id.slice(0,8)}`.toUpperCase(), status: "active",
      });
      if (iErr) throw new Error(iErr.message);
      setJoinCode(""); setShowAdd(false);
      await loadPartners();
    } catch(e) { setJoinError(e.message); }
    finally { setJoinLoading(false); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activePartner || !sb) return;
    const pid = activePartner.partnerProfile.id;
    const body = msgText.trim();
    const optimistic = { id:`opt-${Date.now()}`, from_user_id:user.id, to_user_id:pid, body, type:"text", read:false, created_at:new Date().toISOString() };
    setMessages(pid, m => [...m, optimistic]);
    setMsgText("");
    setSending(true);
    try {
      await sb.from("partner_messages").insert({ from_user_id:user.id, to_user_id:pid, body, type:"text", read:false });
    } catch(e) {
      // Roll back optimistic message on failure
      setMessages(pid, m => m.filter(x => x.id !== optimistic.id));
      console.warn("sendMessage:", e);
    }
    finally { setSending(false); }
  };

  const sendReaction = async (emoji) => {
    if (!activePartner || !sb) return;
    const pid = activePartner.partnerProfile.id;
    setSentReaction(emoji); setTimeout(()=>setSentReaction(null),1500);
    const optimistic = { id:`opt-${Date.now()}`, from_user_id:user.id, to_user_id:pid, body:emoji, type:"text", read:false, created_at:new Date().toISOString() };
    setMessages(pid, m => [...m, optimistic]);
    try {
      await sb.from("partner_messages").insert({ from_user_id:user.id, to_user_id:pid, body:emoji, type:"text", read:false });
    } catch(e) { console.warn("sendReaction:", e); }
  };

  const nudge = async (partnerId, e) => {
    e.stopPropagation();
    if (!sb) return;
    try {
      await sb.from("partner_messages").insert({
        from_user_id: user.id, to_user_id: partnerId,
        body: "🔥", type: "text", read: false,
      });
    } catch(e) {}
  };

  const removePartner = async (id) => {
    if (!window.confirm("Remove this accountability partner?")) return;
    await sb.from("partnerships").delete().eq("id", id);
    setActivePartner(null); await loadPartners();
  };

  const clearMessagesForPartner = async (partnerId) => {
    if (!sb || !user) return;
    try {
      await sb.from("partner_messages").delete()
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`);
      setMessages(partnerId, () => []);
    } catch(e) { console.warn("clearMessages:", e); }
  };

  const saveClearPref = (pref) => {
    const pid = activePartner?.partnerProfile?.id;
    if (!pid) return;
    setClearPref(pref);
    localStorage.setItem(`forge_clearpref_${pid}`, pref);
    if (pref === "session") localStorage.setItem(`forge_lastclear_${pid}`, Date.now().toString());
    setShowClearMenu(false);
  };

  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const fmtMsgDate = ts => {
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const y = new Date(now); y.setDate(now.getDate()-1);
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month:"short", day:"numeric" });
  };
  const lastActive = ts => {
    if (!ts) return "";
    const h = Math.floor((Date.now()-new Date(ts).getTime())/3600000);
    if (h < 1) return "now"; if (h < 24) return `${h}h`; return `${Math.floor(h/24)}d`;
  };

  // Group consecutive messages by sender + date
  const buildGroups = (msgs) => {
    const groups = [];
    msgs.forEach(m => {
      const date = fmtMsgDate(m.created_at);
      const isMe = m.from_user_id === user.id;
      const last = groups[groups.length-1];
      if (last && last.date === date && last.isMe === isMe) {
        last.msgs.push(m);
      } else {
        groups.push({ date, isMe, msgs:[m] });
      }
    });
    return groups;
  };

  // Inject date dividers between groups
  const buildFeed = (msgs) => {
    const groups = buildGroups(msgs);
    const feed = [];
    let lastDate = null;
    groups.forEach((g,i) => {
      if (g.date !== lastDate) { feed.push({ type:"date", date:g.date, key:`date-${i}` }); lastDate = g.date; }
      feed.push({ type:"group", ...g, key:`group-${i}` });
    });
    return feed;
  };

  const ap = activePartner;
  const pName = ap?.partnerProfile?.full_name?.split(" ")[0] || "Partner";
  const pFullName = ap?.partnerProfile?.full_name || "Partner";
  const chal = ap?.challenge;
  const pct = chal ? Math.round((chal.day_num/chal.total_days)*100) : 0;
  const feed = buildFeed(messages);

  // ── No partners empty state ──
  if (partnersLoading) return <div className="page partners-page" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-3)"}}>Loading…</div></div>;
  if (!partners.length && !showAdd) return (
    <div className="page partners-page" style={{display:"flex",flexDirection:"column"}}>
      <div className="p-no-partners">
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--accent)",marginBottom:10}}>Accountability</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:".04em",marginBottom:8}}>Find Your People.</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-2)",lineHeight:1.65,textAlign:"center",maxWidth:340,marginBottom:32}}>
          Share your invite code with someone grinding alongside you.
        </div>
        <div className="p-invite-box">
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>Your invite code</div>
          <div className="p-invite-code">{myCode||"Loading…"}</div>
          <button className="btn btn-g" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={copyCode}>{copied?"✓ Copied":"Copy Code"}</button>
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".22em",textTransform:"uppercase",color:"var(--text-3)",marginBottom:14}}>— or enter their code —</div>
        <div style={{display:"flex",gap:8,width:"100%",maxWidth:360}}>
          <input className="p-input" style={{textTransform:"uppercase",letterSpacing:".12em",textAlign:"center"}}
            value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code…" maxLength={8} onKeyDown={e=>e.key==="Enter"&&joinPartner()} />
          <button className="btn btn-a" onClick={joinPartner} disabled={joinLoading}>{joinLoading?"…":"Connect →"}</button>
        </div>
        {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,marginTop:10}}>{joinError}</div>}
      </div>
    </div>
  );

  return (
    <div className="page partners-page" style={{display:"flex",flexDirection:"column"}}>
      <div className="partners-layout" style={{flex:1,overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <div className="p-sidebar">
          <div className="p-sidebar-head">
            <div className="p-sidebar-tag">Accountability</div>
            <div className="p-sidebar-title">Partners</div>
            <div className="p-sidebar-actions">
              <button className="btn btn-a" style={{fontSize:9,padding:"4px 10px",letterSpacing:".12em"}}
                onClick={()=>setShowAdd(v=>!v)}>{showAdd?"✕ Close":"+ Add"}</button>
              <button className="btn btn-g" style={{fontSize:9,padding:"4px 10px",letterSpacing:".1em"}}
                onClick={copyCode}>{copied?"✓ Copied":`Code: ${myCode}`}</button>
            </div>
            {showAdd && (
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
                <input className="p-input" style={{textTransform:"uppercase",letterSpacing:".1em",textAlign:"center",fontSize:11}}
                  value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Invite code…" maxLength={8} onKeyDown={e=>e.key==="Enter"&&joinPartner()} />
                <button className="btn btn-a" style={{width:"100%",justifyContent:"center"}}
                  onClick={joinPartner} disabled={joinLoading}>{joinLoading?"Connecting…":"Connect →"}</button>
                {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace",fontSize:9,marginTop:2}}>{joinError}</div>}
              </div>
            )}
          </div>

          <div className="p-list">
            <div className="p-section">Direct Messages</div>
            {partners.map(p => {
              const pId = p.partnerProfile.id;
              const name = p.partnerProfile.full_name || "Partner";
              const ch = p.challenge;
              const unread = unreadMap[pId] || 0;
              const isActive = ap?.id === p.id;
              return (
                <div key={p.id} className={`p-row ${isActive?"active":""}`} onClick={()=>setActivePartner(p)}>
                  <div className="p-avatar" style={{background:avatarColor(name)}}>
                    {initials(name)}
                    <div className="p-avatar-dot p-dot-offline" />
                  </div>
                  <div className="p-row-info">
                    <div className="p-row-name">{name.split(" ")[0]}</div>
                    <div className="p-row-sub">{ch ? `${ch.name} · Day ${ch.day_num}` : "No active challenge"}</div>
                  </div>
                  <div className="p-row-right">
                    {unread > 0 && <div className="p-unread">{unread}</div>}
                    <div className="p-ts">{lastActive(p.updated_at)}</div>
                  </div>
                  <button className="p-nudge-btn" onClick={e=>nudge(pId,e)} title="Nudge 🔥">🔥</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className="p-thread">
          {!ap ? (
            <div className="p-empty-thread">
              <div style={{fontSize:28,opacity:.15}}>◆</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".22em",textTransform:"uppercase",color:"var(--text-3)",opacity:.5}}>Select a partner</div>
            </div>
          ) : (<>
            {/* Header */}
            <div className="p-thread-head">
              <div className="p-thread-avatar" style={{background:avatarColor(pFullName)}}>{initials(pFullName)}</div>
              <div>
                <div className="p-thread-name">{pName}</div>
                <div className="p-thread-meta">{chal ? `${chal.name} · Day ${chal.day_num} of ${chal.total_days}` : "No active challenge"}</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                {chal && <div className="p-streak-pill"><span className="n">{chal.streak}</span> day streak</div>}
                {/* Clear chat menu */}
                <div style={{position:"relative"}}>
                  <button className="btn btn-g" style={{fontSize:9,padding:"4px 10px",letterSpacing:".12em"}}
                    onClick={()=>setShowClearMenu(v=>!v)}>
                    ⚙ Chat
                  </button>
                  {showClearMenu && (
                    <div style={{
                      position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:100,
                      background:"var(--bg-2)",border:"1px solid var(--border-1)",
                      borderRadius:8,padding:6,minWidth:160,
                      boxShadow:"0 8px 24px rgba(0,0,0,.4)",
                    }} onClick={e=>e.stopPropagation()}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".22em",textTransform:"uppercase",color:"var(--text-2)",padding:"4px 8px 6px"}}>
                        Auto-clear history
                      </div>
                      {CLEAR_OPTIONS.map(o=>(
                        <div key={o.value}
                          onClick={()=>saveClearPref(o.value)}
                          style={{
                            display:"flex",alignItems:"center",gap:8,
                            padding:"6px 8px",borderRadius:5,cursor:"pointer",
                            background:clearPref===o.value?"var(--accent-lo)":"none",
                            fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                            color:clearPref===o.value?"var(--accent)":"var(--text-1)",
                            letterSpacing:".06em",transition:"background .12s",
                          }}>
                          <span style={{width:6,height:6,borderRadius:"50%",background:clearPref===o.value?"var(--accent)":"var(--border-1)",flexShrink:0,display:"inline-block"}} />
                          {o.label}
                        </div>
                      ))}
                      <div style={{borderTop:"1px solid var(--border-0)",marginTop:4,paddingTop:4}}>
                        <div onClick={()=>{ if(window.confirm("Clear all messages with "+pName+"?")){ clearMessagesForPartner(ap.partnerProfile.id); setShowClearMenu(false); }}}
                          style={{padding:"6px 8px",borderRadius:5,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--err)",letterSpacing:".06em"}}>
                          Clear now
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button className="btn btn-g" style={{borderColor:"var(--err)30",color:"var(--err)",fontSize:10,padding:"4px 10px"}}
                  onClick={()=>removePartner(ap.id)}>Remove</button>
              </div>
            </div>
            {chal && <div className="p-thread-bar"><div className="p-thread-bar-fill" style={{width:`${pct}%`}} /></div>}

            {/* Close clear menu on feed click */}
            {/* Feed */}
            <div className="p-feed" ref={feedRef} onClick={()=>setShowClearMenu(false)}>
              {messages.length === 0 && (
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",letterSpacing:".1em"}}>No messages yet.</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--text-3)",letterSpacing:".06em"}}>Say something.</div>
                </div>
              )}
              {feed.map(item => {
                if (item.type === "date") return (
                  <div key={item.key} className="p-date-div"><span>{item.date}</span></div>
                );
                const { isMe, msgs, key } = item;
                const name = isMe ? "You" : pName;
                const color = isMe ? "#4A8FD4" : avatarColor(pFullName);
                const ini = isMe ? initials(profile?.full_name||"Me") : initials(pFullName);
                return (
                  <div key={key} className={`p-group ${isMe?"me":"them"}`}>
                    <div className="p-group-avatar" style={{background:color}}>{ini}</div>
                    <div className="p-group-body">
                      <div className="p-group-header">
                        <span className={`p-group-name ${isMe?"me":""}`}>{name}</span>
                        <span className="p-group-ts">{fmtTime(msgs[0].created_at)}</span>
                      </div>
                      {msgs.map(m => (
                        <div key={m.id} className="p-bubble">{m.body}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="p-composer">
              <div className="p-rxn-row">
                {REACTIONS.map(e => (
                  <button key={e} className={`p-rxn-btn ${sentReaction===e?"sent":""}`}
                    onClick={()=>sendReaction(e)}>{e}</button>
                ))}
                <span style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--text-2)",letterSpacing:".1em"}}>Quick reactions</span>
              </div>
              <div className="p-composer-row">
                <input className="p-input" value={msgText}
                  onChange={e=>setMsgText(e.target.value)}
                  placeholder={`Message ${pName}…`}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} />
                <button className="btn btn-a" onClick={sendMessage}
                  disabled={sending||!msgText.trim()}
                  style={{padding:"9px 18px",letterSpacing:".1em"}}>Send →</button>
              </div>
            </div>
          </>)}
        </div>

      </div>
    </div>
  );
};

const NavIcon = ({ d, d2, size=20, strokeW=1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

// Dashboard — large panel left, two stacked right (classic dashboard layout)
const IconDashboard = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="10" height="18" rx="1.5" />
    <rect x="15" y="3" width="6" height="8" rx="1.5" />
    <rect x="15" y="13" width="6" height="8" rx="1.5" />
  </svg>
);

// Wall / Tracking — bar chart going up
const IconTracking = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" />
    <rect x="4" y="13" width="4" height="8" rx="0.5" />
    <rect x="10" y="8" width="4" height="13" rx="0.5" />
    <rect x="16" y="4" width="4" height="17" rx="0.5" />
  </svg>
);

// Library — open book
const IconLibrary = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c0-1.1.9-2 2-2h5c1.1 0 2 .5 3 1.5C13 4.5 14 4 15 4h5c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2h-5c-1 0-2 .4-3 1-1-.6-2-1-3-1H4c-1.1 0-2-.9-2-2V6z" />
    <line x1="12" y1="5.5" x2="12" y2="20.5" />
  </svg>
);

// Partners — two people
const IconPartners = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="7" r="3" />
    <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="7" r="3" />
    <path d="M16 14c1-.4 2-.6 3-.4 2.5.5 4 2.7 4 5.4" />
  </svg>
);

// Settings — gear with 8 teeth (classic cog)
const IconSettings = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);


// ============================================================
// TUTORIAL OVERLAY
// ============================================================
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    target: null, // centre modal, no spotlight
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
  }, [step]);

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

  // Tooltip position relative to spotlight
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
    if (current.position === "right") {
      return { ...base, top: targetRect.top - PAD, left: targetRect.left + targetRect.width + PAD + 16 };
    }
    if (current.position === "bottom") {
      return { ...base, top: targetRect.top + targetRect.height + PAD + 16, left: targetRect.left - PAD, width: 322 };
    }
    return base;
  };

  return (
    <>
      {/* Dim overlay for welcome step (no spotlight) */}
      {!targetRect && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:9998 }} onClick={next} />
      )}
      {/* Spotlight cutout */}
      {spotStyle && <div style={spotStyle} />}
      {/* Tooltip */}
      <div style={tooltipStyle()}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9.2, letterSpacing:".3em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
        </div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:25.3, letterSpacing:".04em", lineHeight:1, marginBottom:8 }}>
          {current.title}
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12.65, color:"var(--text-1)", lineHeight:1.6, marginBottom:16 }}>
          {current.body}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button
            onClick={next}
            style={{ background:"var(--accent)", border:"none", borderRadius:7, padding:"8px 18px", fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"#080807", cursor:"pointer" }}>
            {isLast ? "Got it →" : "Next →"}
          </button>
          <button
            onClick={onDone}
            style={{ background:"none", border:"none", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--text-2)", cursor:"pointer" }}>
            Skip
          </button>
        </div>
      </div>
    </>
  );
};

const NAV = [
  { id:"home",     icon:<IconDashboard />, tip:"Dashboard"  },
  { id:"wall",     icon:<IconTracking />,  tip:"The Wall"    },
  { id:"library",  icon:<IconLibrary />,   tip:"Library"     },
  { id:"partners", icon:<IconPartners />,  tip:"Partners"    },
  { id:"settings", icon:<IconSettings />,  tip:"Settings"    },
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
    "--text-0":"#1A1816","--text-1":"#605A52","--text-2":"#706A62","--text-3":"#C8C2BA",
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
    "--text-0":"#2A1A10","--text-1":"#7A5040","--text-2":"#7A5848","--text-3":"#D8C0B0",
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
          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
            <img src="/forge_wordmark_dark.png" alt="Forge" style={{height:144,width:"auto"}} />
          </div>
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
const SettingsScreen = ({ theme, setTheme, tone, setTone, userName, setUserName, onSaveProfile, profile, challenges, onDeleteChallenge, onDeleteAccount, sb }) => {
  const tones = ["Stoic","Coach","Drill Sergeant"];
  const [nameVal,     setNameVal]     = useState(userName);
  const [emailVal,    setEmailVal]    = useState("");
  const [pwNew,       setPwNew]       = useState("");
  const [pwConfirm,   setPwConfirm]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type:"challenge"|"account", id, name }
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
    <>
    <div className="page">
      <div className="a0"><div className="pg-tag">Preferences</div><div className="pg-title">Settings</div></div>

      {msg && (
        <div className="a0 mt16" style={{background:msg.type==="ok"?"var(--ok)18":"var(--err)18",border:`1px solid ${msg.type==="ok"?"var(--ok)":"var(--err)"}44`,padding:"12px 18px",borderRadius:8}}>
          <span style={{color:msg.type==="ok"?"var(--ok)":"var(--err)",fontSize:14}}>{msg.type==="ok"?"✓ ":"✕ "}{msg.text}</span>
        </div>
      )}

      {/* ── Two-column top section ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:24,alignItems:"start"}}>

        {/* LEFT — Account */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Name */}
          <div className="srow a1">
            <div className="srow-title">Your Name</div>
            <div className="srow-desc">Shown in your dashboard greeting.</div>
            <div className="flex g8" style={{marginTop:8}}>
              <input className="field" value={nameVal} onChange={e=>setNameVal(e.target.value)} placeholder="First name" style={{flex:1}} />
              <button className="btn btn-a" onClick={saveName} disabled={saving}>Save</button>
            </div>
          </div>

          {/* Email */}
          <div className="srow a2">
            <div className="srow-title">Change Email</div>
            <div className="srow-desc">A confirmation link will be sent to the new address.</div>
            <div className="flex g8" style={{marginTop:8}}>
              <input className="field" type="email" value={emailVal} onChange={e=>setEmailVal(e.target.value)} placeholder="new@email.com" style={{flex:1}} />
              <button className="btn btn-a" onClick={saveEmail} disabled={saving}>Send</button>
            </div>
          </div>

          {/* Password */}
          <div className="srow a3">
            <div className="srow-title">Change Password</div>
            <div className="srow-desc">Minimum 8 characters.</div>
            <div className="flex col g8" style={{marginTop:8}}>
              <input className="field" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="New password" />
              <input className="field" type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="Confirm new password" />
              <button className="btn btn-a" onClick={savePw} disabled={saving} style={{alignSelf:"flex-start"}}>Update Password</button>
            </div>
          </div>

        </div>

        {/* RIGHT — Theme + Tone */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Themes */}
          <div className="srow a4">
            <div className="srow-title">Theme</div>
            <div className="srow-desc">Eight environments. Pick your headspace.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
              {THEME_ORDER.map(id => {
                const t = ALL_THEMES[id]; const on = theme===id;
                return (
                  <div key={id} onClick={()=>handleTheme(id)} style={{
                    background:on?"var(--accent-lo)":"var(--bg-2)",
                    border:`1px solid ${on?"var(--accent)":"var(--border-1)"}`,
                    borderRadius:10,padding:"10px 12px",cursor:"pointer",transition:"all .18s",
                    display:"flex",alignItems:"center",gap:10,
                  }}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:t.swatch,border:on?"2px solid var(--text-0)":"2px solid transparent",flexShrink:0,transition:"all .18s",transform:on?"scale(1.12)":"scale(1)"}} />
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:".04em",color:on?"var(--text-0)":"var(--text-1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.label}</div>
                      {on && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7,letterSpacing:".08em",color:"var(--accent)"}}>✓ ACTIVE</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tone */}
          <div className="srow a5">
            <div className="srow-title">AI Tone</div>
            <div className="srow-desc">How Forge speaks in your daily debrief.</div>
            <div className="flex col g8" style={{marginTop:10}}>
              {tones.map(t=>(
                <button key={t} className={`btn ${tone===t?"btn-a":"btn-g"}`}
                  style={{justifyContent:"flex-start",padding:"10px 16px"}}
                  onClick={()=>{setTone(t);onSaveProfile({tone:t});}}>
                  {tone===t && <span style={{marginRight:8}}>✓</span>}{t}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Full-width bottom section ── */}
      <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:16}}>
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
                  placeholder={fbType==="bug"?"e.g. When I click X, Y happens instead of Z...":"e.g. It would be great if..."} />
              </div>
              <button className="btn btn-a" style={{alignSelf:"flex-start"}}
                disabled={!fbText.trim() || fbSending}
                onClick={async()=>{
                  setFbSending(true);
                  try {
                    if (sb) {
                      await sb.from("feedback").insert({
                        user_id: (await sb.auth.getUser()).data.user?.id,
                        type: fbType, body: fbText.trim(),
                      });
                    }
                    setFbDone(true); setFbText("");
                  } catch(e) { setFbDone(true); }
                  finally { setFbSending(false); }
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

        {/* Delete a Challenge */}
        {(challenges?.main || (challenges?.secondary||[]).length > 0) && (
          <div className="srow a5" style={{borderColor:"var(--err)30"}}>
            <div className="srow-title" style={{color:"var(--err)"}}>Quit a Challenge</div>
            <div className="srow-desc">Permanently delete a challenge and all its check-in data.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
              {[...(challenges?.main ? [challenges.main] : []), ...(challenges?.secondary||[])].map(ch=>(
                <div key={ch.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg-2)",border:"1px solid var(--border-1)",borderRadius:7,padding:"10px 14px"}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:".04em",color:"var(--text-0)"}}>{ch.name}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--text-2)",letterSpacing:".1em"}}>Day {ch.dayNum} of {ch.totalDays}</div>
                  </div>
                  <button className="btn btn-g" style={{borderColor:"var(--err)44",color:"var(--err)",fontSize:11}}
                    onClick={()=>setConfirmDelete({type:"challenge",id:ch.id,name:ch.name})}>
                    Quit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Account */}
        <div className="srow a5" style={{borderColor:"var(--err)50",background:"var(--err)08"}}>
          <div className="srow-title" style={{color:"var(--err)"}}>Delete Account</div>
          <div className="srow-desc">Permanently delete your account and all data. This cannot be undone.</div>
          <button className="btn btn-g" style={{borderColor:"var(--err)60",color:"var(--err)",background:"var(--err)12"}}
            onClick={()=>setConfirmDelete({type:"account",name:"your account"})}>
            Delete Account
          </button>
        </div>

      </div>
    </div>

    {/* Confirm modal */}
    {confirmDelete && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}
        onClick={()=>setConfirmDelete(null)}>
        <div style={{background:"var(--bg-1)",border:"1px solid var(--err)44",borderRadius:12,padding:"32px 28px",maxWidth:400,width:"100%",textAlign:"center"}}
          onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--err)",marginBottom:12}}>
            {confirmDelete.type === "challenge" ? "Quit Challenge" : "Delete Account"}
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".04em",marginBottom:12,lineHeight:1.2}}>
            {confirmDelete.type === "challenge"
              ? `Are you sure you want to quit "${confirmDelete.name}"?`
              : "Are you sure you want to delete your account?"}
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-2)",lineHeight:1.6,marginBottom:28}}>
            {confirmDelete.type === "challenge"
              ? "All check-in data and progress for this challenge will be permanently deleted. This cannot be undone."
              : "Your account, all challenges, and all data will be permanently deleted. This cannot be undone."}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button className="btn btn-g" onClick={()=>setConfirmDelete(null)} style={{flex:1}}>
              Cancel
            </button>
            <button className="btn btn-g" style={{flex:1,borderColor:"var(--err)60",color:"var(--err)",background:"var(--err)12"}}
              onClick={async()=>{
                if (confirmDelete.type === "challenge") {
                  await onDeleteChallenge(confirmDelete.id);
                } else {
                  await onDeleteAccount();
                }
                setConfirmDelete(null);
              }}>
              {confirmDelete.type === "challenge" ? "Yes, Quit" : "Yes, Delete Everything"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// ============================================================
// ROOT APP — Supabase auth + all state
// ============================================================
export default function App() {
  // ── Supabase session state ────────────────────────────────
  const [user,    setUser]    = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);

  // Generate a random 8-char uppercase invite code
  const genInviteCode = () => Math.random().toString(36).substring(2,10).toUpperCase();

  // Load profile from DB — auto-generate invite_code if missing
  const loadProfile = useCallback(async (uid) => {
    if (!uid || !sb) return;
    try {
      const { data } = await sb.from("profiles").select("*").eq("id", uid).single();
      if (data) {
        if (!data.invite_code) {
          const code = genInviteCode();
          await sb.from("profiles").update({ invite_code: code }).eq("id", uid);
          data.invite_code = code;
        }
        setProfile(data);
      }
    } catch(e) { console.warn("profile load:", e); }
  }, []);

  // Load challenges + today's kpi state from Supabase
  const loadChallenges = useCallback(async (uid) => {
    if (!uid || !sb) return;
    try {
      // Load challenges
      const { data: chs } = await sb
        .from("challenges")
        .select("*, challenge_tasks(*)")
        .eq("user_id", uid)
        .eq("archived", false)
        .order("created_at", { ascending: true });

      if (!chs || chs.length === 0) return;

      const today = new Date().toISOString().split("T")[0];

      const shaped = chs.map(ch => {
        const startDate = new Date(ch.created_at);
        startDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        const dayNum = Math.floor((todayDate - startDate) / 86400000) + 1;

        return {
          id:         ch.id,
          name:       ch.name,
          tag:        ch.tag || "CUSTOM",
          dayNum:     Math.min(dayNum, ch.total_days),
          totalDays:  ch.total_days,
          streak:     ch.streak || 0,
          consistency:ch.consistency || 0,
          color:      ch.color || "#D4922A",
          mission:    ch.mission || "",
          is_main:    ch.is_main,
          created_at: ch.created_at,
          kpis: (ch.challenge_tasks || [])
            .sort((a,b) => a.sort_order - b.sort_order)
            .map(t => ({
              key:    t.key,
              label:  t.label,
              cat:    t.cat || "other",
              nonNeg: t.non_neg || false,
            })),
        };
      });

      const main = shaped.find(c => c.is_main) || null;
      const secondary = shaped.filter(c => !c.is_main).slice(0, 3);

      if (main) {
        setChallenges({ main: { ...main, wall: buildWall() }, secondary });

        // Load today's kpi state from checkins
        const { data: todayCheckin } = await sb
          .from("checkins")
          .select("completed_keys, score")
          .eq("challenge_id", main.id)
          .eq("date", today)
          .maybeSingle();

        if (todayCheckin?.completed_keys) {
          const kpiState = {};
          main.kpis.forEach(k => { kpiState[k.key] = todayCheckin.completed_keys.includes(k.key); });
          setKpis(kpiState);
          setLoggedToday(true);
        } else {
          setKpis(Object.fromEntries(main.kpis.map(k => [k.key, false])));
        }

        // Load mission from main challenge
        if (main.mission) setMission(main.mission);
      }
    } catch(e) { console.warn("loadChallenges:", e); }
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
      if (session?.user) { loadProfile(session.user.id); loadChallenges(session.user.id); }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) { loadProfile(session.user.id); loadChallenges(session.user.id); }
      else { setProfile(null); setChallenges(EMPTY_CHALLENGES); setKpis(EMPTY_KPIS); }
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── App state ─────────────────────────────────────────────
  const [stage,       setStage]       = useState("loader");
  const [loaderMode,  setLoaderMode]  = useState("landing");
  const [page,        setPage]        = useState("home");
  const [dw,          setDW]          = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(false);
  const [loggedToday,  setLoggedToday]  = useState(false);
  const [checkins,     setCheckins]     = useState({}); // { "YYYY-MM-DD": score }
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
    if (profile.onboarded && !profile.tutorial_done) setShowTutorial(true);
  }, [profile]);

  const handleTutorialDone = async () => {
    setShowTutorial(false);
    await saveProfile({ tutorial_done: true });
  };

  // Route based on auth state
  // stage is intentionally excluded from deps — prevents overwriting manual
  // stage transitions like onboarding steps advancing
  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      setStage(s => s === "loader" ? s : "auth");
      return;
    }
    // Only auto-route from loader or auth — never interrupt onboarding screens
    setStage(s => {
      if (s === "loader" || s === "auth") {
        if (profile && !profile.onboarded) return "ob_why";
        if (profile && profile.onboarded)  return "app";
      }
      return s;
    });
  }, [user, profile]);

  const toggle = (key) => {
    setKpis(p => {
      const next = { ...p, [key]: !p[key] };
      // Persist in-progress kpi state to checkins as completed_keys
      if (sb && user && challenges.main) {
        const today = new Date().toISOString().split("T")[0];
        const completed = Object.entries(next).filter(([,v])=>v).map(([k])=>k);
        const total = (challenges.main.kpis || []).length;
        const score = total > 0 ? Math.round((completed.length / total) * 100) : 0;
        sb.from("checkins").upsert({
          challenge_id:   challenges.main.id,
          date:           today,
          score,
          completed_keys: completed,
          updated_at:     new Date().toISOString(),
        }, { onConflict: "challenge_id,date" }).then(() => {});
      }
      return next;
    });
  };

  const handleAuthed = (name) => {
    if (name) setUserName(name);
    setLoaderMode("login");
    setStage("loader");
  };

  const handleStartChallenge = async ({ name, days, mission: m, nonNeg, tasks, isSecondary, tag }) => {
    if (!user?.id || !sb) return;
    try {
      // Archive existing main if replacing
      if (!isSecondary && challenges.main) {
        await sb.from("challenges").update({ archived: true }).eq("id", challenges.main.id);
      }

      // Insert challenge row
      const { data: chRow, error: chErr } = await sb.from("challenges").insert({
        user_id:    user.id,
        name,
        tag:        tag || "CUSTOM",
        total_days: parseInt(days),
        streak:     0,
        consistency:100,
        color:      isSecondary ? "#5DBF8A" : "#D4922A",
        mission:    m || null,
        is_main:    !isSecondary,
        archived:   false,
      }).select().single();

      if (chErr || !chRow) throw chErr;

      // Insert tasks — nonNeg may be array or false
      const nonNegArr = Array.isArray(nonNeg) ? nonNeg : [];
      const kpis = tasks.map((t, i) => ({
        challenge_id: chRow.id,
        key:          `task_${chRow.id}_${i}`,
        label:        t.label,
        cat:          t.cat || "other",
        non_neg:      nonNegArr.includes(t.id),
        sort_order:   i,
      }));
      if (kpis.length > 0) await sb.from("challenge_tasks").insert(kpis);

      // Reload everything fresh from DB
      await loadChallenges(user.id);
      if (m && !isSecondary) setMission(m);

    } catch(e) { console.warn("handleStartChallenge:", e); }
    setModal(null); setLibModal(false);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!sb || !user) return;
    try {
      await sb.from("challenge_tasks").delete().eq("challenge_id", challengeId);
      await sb.from("checkins").delete().eq("challenge_id", challengeId);
      await sb.from("challenges").delete().eq("id", challengeId);
      await loadChallenges(user.id);
    } catch(e) { console.warn("delete challenge:", e); }
  };

  const handleDeleteAccount = async () => {
    if (!sb || !user) return;
    try {
      // Delete all user data
      const cids = [...(challenges.main ? [challenges.main.id] : []), ...(challenges.secondary||[]).map(c=>c.id)];
      for (const cid of cids) {
        await sb.from("challenge_tasks").delete().eq("challenge_id", cid);
        await sb.from("checkins").delete().eq("challenge_id", cid);
        await sb.from("challenges").delete().eq("id", cid);
      }
      await sb.from("partnerships").delete().or(`user_id.eq.${user.id},partner_id.eq.${user.id}`);
      await sb.from("profiles").delete().eq("id", user.id);
      await sb.auth.signOut();
    } catch(e) { console.warn("delete account:", e); }
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
  // ── Today helpers ────────────────────────────────────────
  const todayStr = () => new Date().toISOString().split("T")[0];

  // Load checkins from Supabase on mount
  useEffect(() => {
    if (!sb || !user || !challenges.main) return;
    const load = async () => {
      try {
        const { data } = await sb.from("checkins")
          .select("date,score").eq("challenge_id", challenges.main.id);
        if (data) {
          const map = {};
          data.forEach(c => { map[c.date] = c.score; });
          setCheckins(map);
          setLoggedToday(todayStr() in map);
        }
      } catch(e) { console.warn("load checkins:", e); }
    };
    load();
  }, [user, challenges.main?.id]);


  // ── Log a day ─────────────────────────────────────────────
  const handleLogDay = async (done, total) => {
    if (loggedToday || !challenges.main) return;
    const score = total > 0 ? Math.round((done / total) * 100) : 0;
    const today = todayStr();
    const completedKeys = Object.entries(kpis)
      .filter(([,v]) => v).map(([k]) => k);

    // Optimistic update
    setLoggedToday(true);
    setCheckins(prev => ({ ...prev, [today]: score }));

    // Fire sparks if perfect day
    if (done === total && total > 0) {
      setSparkTrigger(t => !t);
      const el = document.getElementById("forge-streak-n");
      if (el) { el.classList.remove("streak-ignite"); void el.offsetWidth; el.classList.add("streak-ignite"); }
    }

    // Save to Supabase
    if (sb) {
      try {
        await sb.from("checkins").upsert({
          challenge_id: challenges.main.id,
          date: today,
          score,
          completed_keys: completedKeys,
          updated_at: new Date().toISOString(),
        }, { onConflict: "challenge_id,date" });
      } catch(e) { console.warn("save checkin:", e); }
    }
  };

  // ── Midnight: advance day + reset today's kpis ──────────────
  useEffect(() => {
    if (!challenges.main) return;
    const scheduleRefresh = () => {
      const now  = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0); // next calendar midnight
      const ms = next - now;
      return setTimeout(async () => {
        // Reload challenges fresh — dayNum recomputes from created_at
        if (user?.id) await loadChallenges(user.id);
        // Reset today's kpi ticks for the new day
        setKpis(Object.fromEntries((challenges.main?.kpis || []).map(k => [k.key, false])));
        setLoggedToday(false);
        scheduleRefresh(); // reschedule for next midnight
      }, ms);
    };
    const t = scheduleRefresh();
    return () => clearTimeout(t);
  }, [challenges.main?.id, user?.id]);

  // ── Midnight auto-log ─────────────────────────────────────
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight - now;
    };
    const t = setTimeout(() => {
      // Auto-log if at least 1 task done and not already logged
      const safeKpis = challenges.main?.kpis || [];
      const done = safeKpis.filter(k => kpis[k.key]).length;
      if (done > 0 && !loggedToday) handleLogDay(done, safeKpis.length);
    }, msUntilMidnight());
    return () => clearTimeout(t);
  }, [kpis, loggedToday, challenges.main]);

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
      return <Home challenge={activeChallenge} challenges={challenges} kpis={kpis} toggle={toggle} onDW={()=>setDW(true)} tone={tone} mission={mission} onAddSecondary={addSecondary} userName={userName} onViewChallenge={handleViewChallenge} onLogDay={handleLogDay} loggedToday={loggedToday} checkins={checkins} />;
    }
    if (page==="wall")     return <Wall challenge={activeChallenge} challenges={challenges} checkins={checkins} />;
    if (page==="library")  return <Library onPick={(t,isSec)=>handleLibPick(t,isSec)} />;
    if (page==="partners") return <Partners user={user} profile={profile} challenges={challenges} sb={sb} />;
    if (page==="settings") return <SettingsScreen theme={theme} setTheme={setTheme} tone={tone} setTone={setTone} userName={userName} setUserName={setUserName} onSaveProfile={saveProfile} profile={profile} challenges={challenges} onDeleteChallenge={handleDeleteChallenge} onDeleteAccount={handleDeleteAccount} sb={sb} />;
  };

  // ── Stage routing ─────────────────────────────────────────
  // authReady = Supabase has resolved the session (user is no longer undefined)
  if (stage==="loader")    return <Entry authReady={user !== undefined} mode={loaderMode} onDone={()=>{ if(!user) setStage("auth"); else if(profile&&!profile.onboarded) setStage("ob_why"); else setStage("app"); }} />;
  if (stage==="auth")      return <AuthScreen onAuthed={handleAuthed} />;
  if (stage==="ob_why")    return <OnboardWhy   onNext={()=>setStage("ob_who")}      onSkip={handleOnboardDone} />;
  if (stage==="ob_who")    return <OnboardWho   onNext={()=>setStage("ob_induct")}   onSkip={handleOnboardDone} />;
  if (stage==="ob_induct") return <OnboardInduct onDone={()=>setStage("ob_challenge")} userName={userName} />;
  if (stage==="ob_challenge") return <OnboardChallenge onStart={(t, customTasks)=>{ handleStartChallenge({ name:t.name, days:t.duration, mission:"", nonNeg:[], tasks:customTasks||t.kpis, isSecondary:false, tag:t.tag }); handleOnboardDone(); }} onSkip={handleOnboardDone} />;
  if (dw && stage==="app") return <DeepWorkBoundary onExit={()=>setDW(false)}><DeepWork challenge={activeChallenge} kpis={kpis} toggle={toggle} onExit={()=>setDW(false)} /></DeepWorkBoundary>;

  return (
    <div className="shell">
      <nav className="rail">
        <div className="rail-logo" onClick={()=>setPage("home")}>
          <img src="/forge_icon_dark.png" alt="Forge" />
        </div>
        <div className="rail-nav">
          {NAV.map(n=>(
            <div key={n.id} id={`tut-${n.id}`} className={`rail-btn ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
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
            <button id="tut-deepwork" className="btn btn-g" style={{padding:"5px 13px",fontSize:12}} onClick={()=>setDW(true)}>⚡ Deep Work</button>
            {user && <button className="btn btn-g" style={{padding:"5px 13px",fontSize:12,borderColor:"var(--err)30",color:"var(--text-2)"}} onClick={()=>sb&&sb.auth.signOut()}>↩</button>}
          </div>
        </div>
        {renderPage()}
      </div>
      {modal && <ChallengeWizard tpl={modal} isSecondary={modal._mode==="secondary"} maxDays={modal.maxDays} onClose={()=>setModal(null)} onStart={handleStartChallenge} />}
      {showTutorial && <Tutorial onDone={handleTutorialDone} />}
      {libModal && (
        <div className="overlay" onClick={()=>setLibModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{width:720,maxHeight:"85vh",overflowY:"auto"}}>
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
