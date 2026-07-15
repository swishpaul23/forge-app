import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient, type User, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// IMPORTS FROM EXTRACTED MODULES
// ============================================================
import { LEVELS, getLevel } from "./constants/levels";
import { TEMPLATES, TASK_CATEGORIES } from "./constants/templates";
import { ALL_THEMES, THEME_ORDER, applyThemeVars } from "./constants/themes";
import {
  NAV,
} from "./constants/navigation";
import {
  getChallengeDate,
  fmtDate,
  fmtFullDate,
} from "./utils/dates";
import { 
  pct, 
  getCellLevel, 
  urlBase64ToUint8Array, 
  buildWall 
} from "./utils/helpers";
import DashboardV2 from "./components/pages/DashboardV2";
import ProfilePage from "./components/pages/ProfilePage";
import ProfilePanel from "./components/shared/ProfilePanel";
import LibraryDesktop from "./components/pages/LibraryDesktop";
import LibraryMobile from "./components/pages/LibraryMobile";
import SchedulePage from "./components/pages/SchedulePage";
import ScheduleMobile from "./components/pages/ScheduleMobile";
import Avatar from "./components/ui/Avatar";
import DynamicBackground from "./components/ui/DynamicBackground";
import { useIsMobile } from "./hooks/useIsMobile";
import { useGoogleSync } from "./hooks/useGoogleSync";

// ============================================================
// APP-SPECIFIC CONSTANTS (not extracted - used only here)
// ============================================================
const EMPTY_CHALLENGES = { main: null, secondary: [] };
const EMPTY_KPIS = {};
const _INIT_KPIS = Object.fromEntries(TEMPLATES[0].kpis.map(k => [k.key, false]));

// TODO: type this — App.tsx is an ~8,500-line monolith being migrated to TS
// incrementally. The domain shapes below capture the fields actually used,
// with an index signature for the dynamic long-tail, so the file type-checks
// now and can be tightened field-by-field later. State containers, component
// props, and handler params are otherwise precisely typed.
type KpiMap = Record<string, boolean>;
type ScoreMap = Record<string, number>;

interface Kpi {
  key: string;
  label: string;
  cat?: string;
  nonNeg?: boolean;
  [extra: string]: any;
}

interface Challenge {
  id: string | null;
  name: string;
  kpis: Kpi[];
  [extra: string]: any;
}

interface ChallengesState {
  main: Challenge | null;
  secondary: Challenge[];
}

interface Regimen {
  days?: Record<string, any[]>;
  temp_items?: any[];
  [extra: string]: any;
}

type ModalState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = SupabaseClient<any> | null;

// ============================================================
// STYLES
// ============================================================
const makeCSS = () => `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-0:#080807; --bg-1:#0F0F0D; --bg-2:#161613; --bg-3:#1E1E1A; --bg-4:#252520;
    --accent:#D4922A; --accent-lo:#D4922A18; --accent-mid:#D4922A55;
    --text-0:#EDEAE3; --text-1:#B8B4AE; --text-2:#8A857E; --text-3:#2E2C28;
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
    font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.06em;
    color:var(--text-0); white-space:nowrap;
    opacity:0; pointer-events:none; transition:opacity .15s;
  }
  .rail-btn:hover .rtip { opacity:1; }

  .rail-foot { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .rail-streak-n { font-family:'Bebas Neue',sans-serif; font-size:20px; color:var(--warn); line-height:1; }
  .rail-streak-l { font-family:'IBM Plex Mono',monospace; font-size:7.5px; color:var(--text-2); letter-spacing:.1em; text-transform:uppercase; }

  /* MAIN AREA */
  .main { margin-left:58px; flex:1; display:flex; flex-direction:column; align-items:center; min-width:0; overflow-x:hidden; }

  /* TOPBAR */
  .topbar {
    height:50px; border-bottom:1px solid var(--border-0);
    display:flex; align-items:center; justify-content:space-between;
    padding:0 28px; background:var(--bg-0);
    position:sticky; top:0; z-index:50;
    width:100%; align-self:stretch;
  }
  .topbar-date { font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--text-2); letter-spacing:.06em; }
  .topbar-r { display:flex; align-items:center; gap:10px; }

  .lvl-chip-wrap { position:relative; }
  .lvl-chip {
    display:flex; align-items:center; gap:6px;
    padding:4px 11px; border-radius:4px;
    border:1px solid var(--border-1);
    font-family:'IBM Plex Mono',monospace; font-size:9.5px; letter-spacing:.14em;
    cursor:pointer; transition:border-color .18s;
  }
  .lvl-chip:hover { border-color:var(--border-accent); }
  .lvl-dot { width:5px; height:5px; border-radius:50%; }
  
  .lvl-tooltip {
    position:absolute; top:calc(100% + 8px); right:0; z-index:100;
    background:var(--bg-1); border:1px solid var(--border-0); border-radius:10px;
    padding:14px 16px; min-width:200px;
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity .18s, transform .18s, visibility .18s;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
  }
  .lvl-chip-wrap:hover .lvl-tooltip { opacity:1; visibility:visible; transform:translateY(0); }
  .lvl-tooltip-header { display:flex; flex-direction:column; gap:2px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-0); }
  .lvl-tooltip-list { display:flex; flex-direction:column; gap:6px; }
  .lvl-tooltip-row { display:flex; align-items:center; gap:8px; font-size:11px; padding:4px 0; }
  .lvl-tooltip-row.active { background:var(--bg-2); margin:0 -8px; padding:4px 8px; border-radius:4px; }
  .lvl-tooltip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .lvl-tooltip-footer { margin-top:12px; padding-top:10px; border-top:1px solid var(--border-0); text-align:center; }

  /* PAGE */
  .page { padding:36px 32px 100px; width:100%; max-width:900px; box-sizing:border-box; margin:0 auto; }
  .dashboard-page { padding:36px 32px 100px; width:100%; max-width:900px; box-sizing:border-box; margin:0 auto; }

  .home-page { padding:36px 32px 100px; width:100%; max-width:1400px; box-sizing:border-box; }
  .home-layout { display:flex; gap:28px; align-items:flex-start; width:100%; }
  .home-left  { flex:0 0 calc(50% - 14px); min-width:0; }
  .home-right { flex:1; min-width:320px; padding-top:0; }
  @media (max-width:960px) {
    .home-layout { flex-direction:column; }
    .home-left, .home-right { flex:none; width:100%; }
  }

  /* ── MOBILE (≤768px) ─────────────────────────────────── */
  @media (max-width:768px) {

    /* Rail → bottom tab bar */
    .rail {
      width:100% !important;
      min-height:unset !important;
      height:58px;
      flex-direction:row;
      top:unset; left:0; bottom:0;
      border-right:none;
      border-top:1px solid var(--border-0);
      padding:0 8px;
      justify-content:space-between;
      align-items:center;
    }
    .rail-logo { writing-mode:horizontal-tb; transform:none; padding-bottom:0; border-bottom:none; margin-bottom:0; border-right:1px solid var(--border-0); padding-right:10px; margin-right:4px; }
    .rail-logo img { width:30px !important; height:30px !important; }
    .rail-nav { flex-direction:row; width:auto; flex:1; justify-content:center; gap:0; }
    .rail-btn { width:44px; height:44px; }
    .rtip { display:none !important; }
    .rail-foot { flex-direction:row; gap:4px; align-items:center; border-top:none; padding:0; padding-left:10px; border-left:1px solid var(--border-0); }
    .rail-streak-n { font-size:14px; }
    .rail-streak-l { font-size:7px; }

    /* Main area */
    .main { margin-left:0 !important; padding-bottom:58px; }
    .topbar { padding:0 16px; }

    /* Pages */
    .page { padding:20px 16px 80px; }
    .home-page { padding:20px 16px 80px; }
    .home-left, .home-right { min-width:0; }

    /* Task grid — single column */
    .tasks-grid { grid-template-columns:1fr !important; }

    /* Arena — stack on mobile */
    .arena { grid-template-columns:1fr !important; }
    .arena-main { grid-column:1; grid-row:1; }
    .arena-side { grid-column:1; grid-row:2; flex-direction:column; }
    .arena-sec { min-width:unset; width:100%; }

    /* Stats — 3 col stays but smaller padding */
    .stats { gap:8px; }
    .stat { padding:14px 12px; }
    .stat-n { font-size:38px; }

    /* Scoreboard — 2x2 on mobile */
    .scoreboard { grid-template-columns:repeat(2,1fr) !important; }

    /* Library — hide detail panel, full-width cards */
    .lib-grid { grid-template-columns:repeat(2,1fr) !important; }
    .lib-detail { display:none !important; }

    /* Onboarding grids */
    .ob-truth-grid { grid-template-columns:1fr !important; }
    .ob-for-grid   { grid-template-columns:1fr 1fr !important; }

    /* Modals — full width */
    .modal { width:calc(100vw - 24px) !important; max-width:unset !important; margin:12px; max-height:90vh; overflow-y:auto; }
    .cdm   { width:calc(100vw - 24px) !important; }
    .recovery-modal { width:calc(100vw - 24px) !important; }

    /* Banner */
    .banner { padding:18px 16px; }
    .ghost-num { display:none; }

    /* Buttons — minimum touch target */
    .btn { min-height:44px; }

    /* Log day bar — full width above tab bar */
    .logbar { left:0 !important; right:0 !important; bottom:58px !important; border-radius:0 !important; padding:10px 16px !important; }

    /* Deep work */
    .dw { padding:16px; }

    /* Wizard — full width */
    .modal[style*="540"] { width:calc(100vw - 24px) !important; }

    /* Challenge wizard steps — hide labels, show numbers only */
    .wstep span { display:none !important; }
    .wstep-line { min-width:8px; }

    /* OnboardChallenge two-col → stack */
    .ob-challenge-layout { flex-direction:column !important; }
    .ob-challenge-left   { width:100% !important; max-height:220px; overflow-y:auto; border-right:none !important; border-bottom:1px solid var(--border-0); }
    .ob-challenge-right  { padding:20px 16px !important; }

    /* Partners Overwatch */
    .ow-layout  { flex-direction:column; }
    .ow-sidebar { width:100% !important; border-right:none; border-bottom:1px solid var(--border-0); max-height:320px; flex-shrink:0; }
    .ow-detail  { flex:1; min-height:0; }
    .you-card   { margin:6px 6px 0; }

    /* Settings two-col → single col */
    .settings-grid { grid-template-columns:1fr !important; }

    /* Topbar right — hide Deep Work button label */
    .topbar-r .btn span { display:none; }

    /* Prevent horizontal scroll */
    .shell { overflow-x:hidden; }
    * { max-width:100vw; }

    /* Partners — hide sidebar when detail open, show back button */
    .ow-layout.detail-open .ow-sidebar { display:none !important; }
    .ow-layout.detail-open .ow-detail  { flex:1; }
    .ow-detail-back { display:flex !important; }

    /* TALOS — stack columns */
    .talos-layout { flex-direction:column !important; }
    .talos-chat   { border-right:none !important; border-bottom:1px solid var(--border-0); min-height:60vh; }
    .talos-context { width:100% !important; max-height:200px; overflow-y:auto; }
  }
  .page.partners-page { padding:0; max-width:100%; height:100%; width:100%; align-self:stretch; }
  .page.talos-page    { padding:0; max-width:100%; height:100%; width:100%; align-self:stretch; }

  /* PAGE HEADER */
  .pg-tag   { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); margin-bottom:5px; }
  .pg-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(40px,6vw,60px); letter-spacing:.02em; line-height:0.95; }
  .pg-sub   { font-size:15px; color:var(--text-1); margin-top:8px; }

  /* SECTION LABEL */
  .slabel {
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.18em; text-transform:uppercase; color:var(--text-1);
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
    font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-1);
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

  /* WALL - GitHub style */
  .wall-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }

  .cell {
    aspect-ratio:1;
    min-height:16px;
    max-height:32px;
    border-radius:3px;
    cursor:pointer; position:relative;
    transition:transform .15s, box-shadow .15s;
    border:1px solid transparent;
    overflow:visible;
  }
  .cell:hover { 
    transform:scale(1.15); 
    z-index:10; 
    box-shadow:0 0 8px rgba(0,0,0,0.3);
  }
  .cell.today { 
    border-color:var(--accent) !important; 
    box-shadow:0 0 0 2px var(--accent-lo);
  }

  /* GitHub-style color levels */
  .cell.level-0 { background:var(--bg-3); }
  .cell.level-1 { background:color-mix(in srgb, var(--accent) 25%, var(--bg-2)); }
  .cell.level-2 { background:color-mix(in srgb, var(--accent) 50%, var(--bg-2)); }
  .cell.level-3 { background:color-mix(in srgb, var(--accent) 75%, var(--bg-2)); }
  .cell.level-4 { background:var(--accent); }
  .cell.future { background:var(--bg-2); border:1px dashed var(--border-1); opacity:0.5; }

  .ctip {
    display:none; position:absolute;
    bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
    background:var(--bg-4); border:1px solid var(--border-1);
    border-radius:6px; padding:8px 12px;
    font-size:12px; white-space:nowrap;
    z-index:50; font-family:'IBM Plex Mono',monospace;
    color:var(--text-0); pointer-events:none;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
  }
  .ctip-date { color:var(--text-0); font-weight:500; }
  .ctip-score { color:var(--accent); margin-left:8px; }
  .ctip-missed { color:var(--err); }
  .cell:hover .ctip { display:block; }

  /* MONTH LABEL */
  .month-label {
    font-family:'Bebas Neue',sans-serif;
    font-size:14px; letter-spacing:.1em;
    color:var(--text-1); margin-bottom:8px; margin-top:20px;
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
    font-family:'IBM Plex Mono',monospace; font-size:12px;
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
    font-size:13px; color:var(--text-1); font-family:'IBM Plex Mono',monospace;
    letter-spacing:.04em;
  }
  .ai-footer {
    display:flex; align-items:center; justify-content:space-between;
    margin-top:14px; padding-top:12px;
    border-top:1px solid var(--border-0);
  }
  .ai-timestamp { font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-1); letter-spacing:.06em; }

  /* Refresh button - shadcn outline style */
  .ai-refresh-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:6px;
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.08em; text-transform:uppercase;
    cursor:pointer; transition:all .18s;
    border:1px solid var(--border-1);
    background:transparent; color:var(--text-1);
  }
  .ai-refresh-btn:hover {
    color:var(--accent);
    border-color:var(--accent);
    background:var(--accent-lo);
    box-shadow:0 0 12px var(--accent-lo);
  }
  .ai-refresh-btn:disabled {
    opacity:.5; cursor:not-allowed;
  }

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
    font-size:12px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--text-1); margin-right:4px; flex-shrink:0;
  }
  .cin-btn {
    display:flex; align-items:center; gap:5px;
    padding:8px 14px; border-radius:6px;
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.1em; text-transform:uppercase;
    cursor:pointer; transition:all .18s; 
    border:1px solid var(--border-1);
    background:transparent; color:var(--text-1);
    box-shadow:none;
  }
  .cin-btn:hover { 
    color:var(--text-0); 
    background:var(--bg-2); 
    border-color:var(--accent-mid);
    box-shadow:0 0 12px var(--accent-lo);
  }
  .cin-btn.active-full { 
    background:var(--accent-lo); 
    color:var(--accent); 
    border-color:var(--accent);
    box-shadow:0 0 16px var(--accent-lo), inset 0 0 8px var(--accent-lo);
  }
  .cin-btn.active-scaled { 
    background:#D4B22A18; 
    color:#D4B22A; 
    border-color:#D4B22A;
    box-shadow:0 0 16px #D4B22A20, inset 0 0 8px #D4B22A10;
  }
  .cin-btn.active-recovery { 
    background:#4A8FD418; 
    color:#4A8FD4; 
    border-color:#4A8FD4;
    box-shadow:0 0 16px #4A8FD420, inset 0 0 8px #4A8FD410;
  }
  .cin-btn.btn-disabled { opacity:.35; cursor:not-allowed; pointer-events:none; }
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
    font-family:'IBM Plex Mono',monospace; font-size:10.5px;
    letter-spacing:.22em; text-transform:uppercase;
    color:var(--accent); margin-bottom:10px;
  }
  .lib-detail-name {
    font-family:'Bebas Neue',sans-serif; font-size:44px;
    letter-spacing:.04em; line-height:1; margin-bottom:12px;
  }
  .lib-detail-about {
    font-size:16px; color:var(--text-1); line-height:1.7;
    margin-bottom:20px;
  }
  .lib-detail-section {
    font-family:'IBM Plex Mono',monospace; font-size:10.5px;
    letter-spacing:.2em; text-transform:uppercase;
    color:var(--text-2); margin-bottom:8px; margin-top:18px;
  }
  .lib-detail-benefit {
    display:flex; align-items:flex-start; gap:10px;
    font-size:15.5px; color:var(--text-0); line-height:1.5;
    padding:6px 0; border-bottom:1px solid var(--border-0);
  }
  .lib-detail-benefit:last-child { border-bottom:none; }
  .lib-detail-best {
    font-size:15.5px; color:var(--text-1); line-height:1.65;
    background:var(--bg-2); border-radius:8px; padding:12px 14px;
    margin-top:4px;
  }

  /* PARTNERS — SPOTTER PROTOCOL */
  .ow-layout { display:flex; height:100%; overflow:hidden; }

  /* Overwatch sidebar */
  .ow-sidebar { width:340px; flex-shrink:0; background:var(--bg-1); border-right:1px solid var(--border-0); display:flex; flex-direction:column; overflow:hidden; }
  .ow-head { padding:18px 16px 14px; border-bottom:1px solid var(--border-0); flex-shrink:0; }
  .ow-tag { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.3em; text-transform:uppercase; color:var(--accent); margin-bottom:5px; display:flex; align-items:center; gap:7px; }
  .ow-tag::before { content:'◆'; font-size:7px; }
  .ow-title { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:.04em; line-height:1; display:flex; align-items:center; justify-content:space-between; }
  .ow-add { width:26px; height:26px; border-radius:6px; background:var(--accent-lo); border:1px solid var(--border-accent); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; color:var(--accent); transition:all .15s; }
  .ow-add:hover { background:var(--accent-mid); }

  /* You card */
  .you-card { margin:8px 8px 0; padding:12px 14px; background:var(--bg-0); border:1px solid var(--border-accent); border-radius:10px; position:relative; overflow:hidden; flex-shrink:0; }
  .you-card::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 100% 0%, var(--accent-lo), transparent); pointer-events:none; }
  .you-card-top { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .you-ring { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:14px; flex-shrink:0; position:relative; z-index:1; }
  .you-info { flex:1; min-width:0; }
  .you-label { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.22em; text-transform:uppercase; color:var(--accent); margin-bottom:1px; }
  .you-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:.04em; line-height:1; }
  .you-challenge { font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-1); letter-spacing:.06em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .you-stats { display:flex; gap:14px; }
  .you-stat-n { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:.02em; line-height:1; }
  .you-stat-l { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-1); margin-top:1px; }
  .you-bar { margin-top:8px; height:2px; background:var(--bg-3); border-radius:1px; overflow:hidden; }
  .you-bar-fill { height:100%; border-radius:1px; background:var(--accent); transition:width .6s; }

  /* Status legend */
  .ow-legend { display:flex; gap:12px; padding:7px 16px; border-bottom:1px solid var(--border-0); flex-shrink:0; }
  .ow-leg { display:flex; align-items:center; gap:5px; font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-2); }
  .ow-leg-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

  /* Partner rows */
  .ow-list { flex:1; overflow-y:auto; padding:6px; }
  .ow-row { display:flex; align-items:center; gap:10px; padding:10px 10px; border-radius:8px; cursor:pointer; transition:background .12s; border:1px solid transparent; margin-bottom:3px; }
  .ow-row:hover { background:var(--bg-2); }
  .ow-row.active { background:var(--bg-3); border-color:var(--border-0); }

  /* Status dots */
  .s-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; transition:box-shadow .3s; }
  .s-dot.cold { background:#2E2C28; border:1px solid var(--border-0); }
  .s-dot.ember { background:var(--accent); box-shadow:0 0 7px var(--accent); animation:sdpulse 2.5s ease infinite; }
  .s-dot.gold { background:#F5C842; box-shadow:0 0 9px #F5C842; }
  @keyframes sdpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }

  .ow-row-info { flex:1; min-width:0; }
  .ow-row-name { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:.04em; line-height:1; margin-bottom:2px; }
  .ow-row-sub { font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-1); letter-spacing:.06em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ow-row-right { display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0; }
  .ow-streak { font-family:'Bebas Neue',sans-serif; font-size:21px; letter-spacing:.02em; line-height:1; }
  .proto-badge { font-family:'IBM Plex Mono',monospace; font-size:7px; letter-spacing:.1em; text-transform:uppercase; padding:1px 6px; border-radius:3px; }
  .proto-badge.spotter { color:var(--accent); background:var(--accent-lo); border:1px solid var(--border-accent); }
  .proto-badge.ally { color:#4A8FD4; background:#4A8FD414; border:1px solid #4A8FD430; }

  /* Detail panel */
  .ow-detail { flex:1; display:flex; flex-direction:column; overflow:hidden; background:var(--bg-0); }
  .ow-detail-back { display:none; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid var(--border-0); background:var(--bg-1); font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2); cursor:pointer; border-top:none; border-left:none; border-right:none; width:100%; text-align:left; flex-shrink:0; }
  .ow-detail-head { padding:18px 22px 16px; border-bottom:1px solid var(--border-0); flex-shrink:0; position:relative; overflow:hidden; }
  .ow-detail-head-bg { position:absolute; inset:0; pointer-events:none; }
  .ow-detail-top { display:flex; align-items:flex-start; gap:14px; margin-bottom:12px; }
  .ow-avatar { width:48px; height:48px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:17px; }
  .ow-detail-name { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:.04em; line-height:1; margin-bottom:3px; }
  .ow-detail-challenge { font-family:'IBM Plex Mono',monospace; font-size:8.5px; letter-spacing:.1em; color:var(--text-2); margin-bottom:6px; }
  .ow-proto-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:4px; font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.14em; text-transform:uppercase; }
  .ow-proto-pill.spotter { background:var(--accent-lo); border:1px solid var(--border-accent); color:var(--accent); }
  .ow-proto-pill.ally { background:#4A8FD414; border:1px solid #4A8FD430; color:#4A8FD4; }

  /* Status banner */
  .ow-status-banner { display:flex; align-items:center; gap:10px; padding:9px 13px; border-radius:7px; border:1px solid; }
  .ow-sb-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .ow-sb-label { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase; font-weight:500; }
  .ow-sb-since { margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:8px; color:var(--text-2); }

  /* Detail tabs */
  .ow-tabs { display:flex; border-bottom:1px solid var(--border-0); flex-shrink:0; }
  .ow-tab { flex:1; padding:10px 0; text-align:center; font-family:'IBM Plex Mono',monospace; font-size:8.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2); cursor:pointer; transition:all .15s; border-bottom:2px solid transparent; margin-bottom:-1px; background:none; border-top:none; border-left:none; border-right:none; }
  .ow-tab:hover { color:var(--text-1); }
  .ow-tab.on { color:var(--accent); border-bottom-color:var(--accent); }

  /* Detail body */
  .ow-body { flex:1; overflow-y:auto; padding:18px 22px; display:flex; flex-direction:column; gap:12px; }

  /* Stat cards */
  .ow-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
  .ow-stat { background:var(--bg-1); border:1px solid var(--border-0); border-radius:9px; padding:13px 15px; }
  .ow-stat-n { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:.02em; line-height:1; }
  .ow-stat-l { font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2); margin-top:3px; }

  /* Countdown */
  .ow-countdown { background:var(--bg-1); border:1px solid var(--border-0); border-radius:9px; padding:14px 16px; display:flex; align-items:center; gap:14px; }
  .ow-cd-time { font-family:'Bebas Neue',sans-serif; font-size:40px; letter-spacing:.04em; line-height:1; font-variant-numeric:tabular-nums; transition:color .3s; }
  .ow-cd-time.urgent { color:var(--err); }
  .ow-cd-label { font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--text-2); margin-bottom:3px; }
  .ow-cd-sub { font-size:12px; color:var(--text-1); line-height:1.5; }

  /* Sync */
  .ow-sync { background:var(--bg-1); border:1px solid var(--border-0); border-radius:9px; padding:14px 16px; }
  .ow-sync-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .ow-sync-title { font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); }
  .ow-sync-pct { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:.02em; line-height:1; }
  .ow-sync-bar { height:4px; background:var(--bg-3); border-radius:2px; overflow:hidden; display:flex; margin-bottom:7px; }
  .ow-sync-bar-t { height:100%; background:#F5C842; transition:width .8s cubic-bezier(.4,0,.2,1); }
  .ow-sync-bar-b { height:100%; background:var(--accent); transition:width .8s cubic-bezier(.4,0,.2,1); }
  .ow-sync-legs { display:flex; gap:10px; flex-wrap:wrap; }
  .ow-sync-leg { display:flex; align-items:center; gap:4px; font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.06em; color:var(--text-2); }
  .ow-sync-dot { width:6px; height:6px; border-radius:50%; }

  /* Ally note */
  .ow-ally-note { background:var(--bg-1); border:1px solid #4A8FD430; border-radius:9px; padding:14px 16px; }
  .ow-ally-note-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .ow-ally-note-label { font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:#4A8FD4; }
  .ow-ally-note-timer { font-family:'IBM Plex Mono',monospace; font-size:7.5px; color:var(--text-2); letter-spacing:.06em; }
  .ow-ally-note-text { font-size:13px; color:var(--text-1); line-height:1.6; font-style:italic; margin-bottom:10px; }
  .ow-rxns { display:flex; gap:5px; }
  .ow-rxn { padding:4px 10px; border-radius:6px; background:var(--bg-2); border:1px solid var(--border-0); font-size:14px; cursor:pointer; transition:all .12s; }
  .ow-rxn:hover,.ow-rxn.sent { background:#4A8FD418; border-color:#4A8FD440; }

  /* Your note */
  .ow-your-note { background:var(--bg-1); border:1px solid var(--border-0); border-radius:9px; padding:14px 16px; }
  .ow-your-note-label { font-family:'IBM Plex Mono',monospace; font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); margin-bottom:7px; }
  .ow-note-input { width:100%; background:var(--bg-2); border:1px solid var(--border-0); border-radius:6px; padding:9px 11px; color:var(--text-0); font-family:'DM Sans',sans-serif; font-size:13px; outline:none; resize:none; line-height:1.5; transition:border-color .15s; }
  .ow-note-input:focus { border-color:#4A8FD450; }
  .ow-note-input::placeholder { color:var(--text-2); font-style:italic; }
  .ow-note-footer { display:flex; align-items:center; justify-content:space-between; margin-top:7px; }
  .ow-note-count { font-family:'IBM Plex Mono',monospace; font-size:8px; color:var(--text-2); }
  .ow-note-send { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.12em; text-transform:uppercase; background:#4A8FD4; color:#080807; border:none; border-radius:5px; padding:5px 12px; cursor:pointer; transition:opacity .15s; }
  .ow-note-send:hover { opacity:.85; }

  /* Flare button */
  .ow-action { padding:14px 22px 18px; border-top:1px solid var(--border-0); flex-shrink:0; }
  .flare-btn { width:100%; padding:13px; border-radius:7px; font-family:'Bebas Neue',sans-serif; font-size:19px; letter-spacing:.14em; border:none; cursor:pointer; transition:all .2s; }
  .flare-btn.armed { background:var(--err); color:#fff; box-shadow:0 4px 0 rgba(0,0,0,.5),0 0 24px rgba(191,93,93,.3); animation:flarepulse 3s ease infinite; }
  .flare-btn.armed:hover { transform:translateY(-2px); box-shadow:0 6px 0 rgba(0,0,0,.5),0 0 40px rgba(191,93,93,.5); }
  .flare-btn.armed:active { transform:translateY(2px); }
  .flare-btn.off { background:var(--bg-3); color:var(--text-2); cursor:not-allowed; border:1px solid var(--border-0); }
  @keyframes flarepulse { 0%,100%{box-shadow:0 4px 0 rgba(0,0,0,.5),0 0 24px rgba(191,93,93,.3)} 50%{box-shadow:0 4px 0 rgba(0,0,0,.5),0 0 40px rgba(191,93,93,.45)} }
  .flare-meta { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-2); text-align:center; margin-top:6px; }
  .flare-meta.hot { color:var(--err); opacity:.7; }

  /* History grid */
  .ow-h-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
  .ow-h-cell { height:26px; border-radius:3px; cursor:default; transition:transform .1s; }
  .ow-h-cell:hover { transform:scaleY(1.12); }

  /* Empty right */
  .ow-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; opacity:.3; }
  .ow-empty-icon { font-size:28px; }
  .ow-empty-text { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-2); }

  /* Protocol overlay */
  .proto-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.82); display:flex; align-items:center; justify-content:center; animation:fadein .2s ease; }
  .proto-inner { background:var(--bg-1); border:1px solid var(--border-0); border-radius:14px; padding:32px 28px; max-width:460px; width:calc(100% - 40px); animation:scalein .3s cubic-bezier(.16,1,.3,1); }
  .proto-tag { font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.28em; text-transform:uppercase; color:var(--text-2); margin-bottom:6px; }
  .proto-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:.04em; margin-bottom:4px; }
  .proto-sub { font-size:13px; color:var(--text-1); line-height:1.55; margin-bottom:16px; }
  .proto-rec { background:var(--accent-lo); border:1px solid var(--border-accent); border-radius:7px; padding:9px 13px; margin-bottom:14px; font-family:'IBM Plex Mono',monospace; font-size:8.5px; letter-spacing:.1em; color:var(--accent); display:flex; align-items:center; gap:7px; }
  .proto-rec::before { content:'◆'; font-size:7px; }
  .proto-opts { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
  .proto-opt { padding:14px 16px; border-radius:9px; border:1px solid var(--border-0); cursor:pointer; transition:all .15s; background:var(--bg-2); }
  .proto-opt:hover { border-color:var(--border-accent); }
  .proto-opt.sel { background:var(--accent-lo); border-color:var(--accent); }
  .proto-opt.sel.ally-sel { background:#4A8FD414; border-color:#4A8FD4; }
  .proto-opt-head { display:flex; align-items:center; gap:9px; margin-bottom:5px; }
  .proto-opt-name { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:.06em; }
  .proto-opt-desc { font-size:12px; color:var(--text-1); line-height:1.55; }
  .proto-confirm { width:100%; padding:12px; border-radius:7px; font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:.1em; background:var(--accent); color:#080807; border:none; cursor:pointer; transition:all .18s; box-shadow:0 4px 0 rgba(0,0,0,.4); }
  .proto-confirm:hover { opacity:.9; transform:translateY(-2px); }

  /* Flare overlay */
  .flare-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.85); display:flex; align-items:center; justify-content:center; animation:fadein .2s ease; }
  .flare-overlay-inner { background:var(--bg-1); border:1px solid rgba(191,93,93,.35); border-radius:14px; padding:36px 32px; max-width:390px; width:calc(100% - 40px); text-align:center; animation:scalein .3s cubic-bezier(.16,1,.3,1); }
  .flare-icon { font-size:40px; display:block; margin-bottom:12px; animation:shake .4s ease; }
  @keyframes shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
  .flare-title { font-family:'Bebas Neue',sans-serif; font-size:34px; letter-spacing:.04em; color:var(--err); margin-bottom:7px; }
  .flare-msg { font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:var(--text-1); line-height:1.7; margin-bottom:16px; letter-spacing:.04em; }
  .flare-sms { background:var(--bg-2); border:1px solid var(--border-0); border-left:3px solid var(--err); border-radius:7px; padding:11px 13px; text-align:left; margin-bottom:16px; font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--text-0); line-height:1.6; }
  .flare-dismiss { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase; background:transparent; border:1px solid var(--border-0); color:var(--text-2); padding:8px 20px; border-radius:6px; cursor:pointer; transition:all .15s; }
  .flare-dismiss:hover { border-color:var(--text-1); color:var(--text-0); }

  /* No partners */
  .ow-no-partners { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:0; }
  .ow-invite-box { background:var(--bg-2); border:1px solid var(--border-accent); border-radius:10px; padding:20px 28px; text-align:center; margin-bottom:24px; width:100%; max-width:360px; }
  .ow-invite-code { font-family:'Bebas Neue',sans-serif; font-size:44px; letter-spacing:.22em; color:var(--accent); }

  /* Mobile partners */
  @media(max-width:768px) {
    .ow-sidebar { width:100% !important; border-right:none; border-bottom:1px solid var(--border-0); max-height:280px; }
    .ow-layout { flex-direction:column; }
  }

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

  /* WALL GRID - Responsive */
  .wall-grid-container { width:100%; }
  .wall-grid-months { display:flex; margin-bottom:6px; position:relative; height:14px; }
  .wall-grid-month { position:absolute; }
  .wall-grid-weeks { display:flex; gap:3px; }
  .wall-grid-week { display:flex; flex-direction:column; gap:3px; flex:1; }
  .wall-grid-cell { width:100%; aspect-ratio:1; }
  .wall-grid-cell-empty { width:100%; aspect-ratio:1; }
  @media (max-width:600px) {
    .wall-grid-weeks { gap:2px; }
    .wall-grid-week { gap:2px; flex:none; }
    .wall-grid-cell { width:10px; height:10px; aspect-ratio:auto; }
    .wall-grid-cell-empty { width:10px; height:10px; aspect-ratio:auto; }
    .wall-grid-month { left:auto !important; position:relative; margin-right:16px; }
    .wall-grid-months { position:static; height:auto; flex-wrap:wrap; gap:4px; }
  }

  /* SCOREBOARD */
  .scoreboard {
    display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
  }
  .wall-top-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:16px;
  }
  @media (max-width:600px) {
    .wall-top-grid { grid-template-columns:1fr; }
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
    font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--text-1);
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
    display:flex; align-items:center; justify-content:center;
    animation:fadein .4s ease both;
    overflow-y:auto;
    padding:40px 24px;
  }
  .auth-right {
    width:100%; max-width:420px;
    display:flex; flex-direction:column;
    align-items:center;
  }
  .auth-form {
    width:100%; max-width:420px;
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
  .auth-tab.on { background:var(--accent); color:#080807; font-weight:700; }
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

  /* FOCUS SESSIONS CARD */
  .focus-card {
    background:var(--bg-1); border:1px solid var(--border-0);
    border-radius:12px; padding:20px 24px; margin-top:24px;
  }
  .focus-card-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:16px;
  }
  .focus-card-title {
    font-family:'IBM Plex Mono',monospace;
    font-size:12px; letter-spacing:.2em; text-transform:uppercase;
    color:var(--accent); display:flex; align-items:center; gap:8px;
  }
  .focus-card-title::before { content:'⚡'; font-size:12px; }
  .focus-stats {
    display:grid; grid-template-columns:repeat(3,1fr); gap:12px;
    margin-bottom:20px;
  }
  .focus-stat {
    background:var(--bg-2); border:1px solid var(--border-0);
    border-radius:8px; padding:14px 16px; text-align:center;
  }
  .focus-stat-n {
    font-family:'Bebas Neue',sans-serif;
    font-size:32px; line-height:1; color:var(--accent);
  }
  .focus-stat-l {
    font-family:'IBM Plex Mono',monospace;
    font-size:12px; letter-spacing:.12em; text-transform:uppercase;
    color:var(--text-1); margin-top:4px;
  }
  .focus-graph-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:12px;
  }
  .focus-graph-title {
    font-family:'IBM Plex Mono',monospace;
    font-size:12px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--text-1);
  }
  .focus-range-btns {
    display:flex; gap:4px;
  }
  .focus-range-btn {
    padding:4px 10px; border-radius:4px;
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.1em; text-transform:uppercase;
    cursor:pointer; transition:all .15s;
    border:1px solid var(--border-1);
    background:transparent; color:var(--text-1);
  }
  .focus-range-btn:hover { border-color:var(--accent-mid); color:var(--text-0); }
  .focus-range-btn.active { 
    background:var(--accent-lo); color:var(--accent); 
    border-color:var(--accent); 
  }
  .focus-sessions-list {
    margin-top:16px; max-height:200px; overflow-y:auto;
  }
  .focus-session-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 12px; border-radius:6px;
    background:var(--bg-2); border:1px solid var(--border-0);
    margin-bottom:6px; transition:border-color .15s;
  }
  .focus-session-row:hover { border-color:var(--border-1); }
  .focus-session-date {
    font-family:'IBM Plex Mono',monospace;
    font-size:12px; color:var(--text-1); letter-spacing:.06em;
  }
  .focus-session-dur {
    font-family:'Bebas Neue',sans-serif;
    font-size:18px; color:var(--accent);
  }
  .focus-view-all {
    display:flex; align-items:center; justify-content:center;
    padding:10px; margin-top:8px;
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--text-1); cursor:pointer;
    border:1px dashed var(--border-1); border-radius:6px;
    transition:all .15s; background:transparent;
    width:100%;
  }
  .focus-view-all:hover { border-color:var(--accent-mid); color:var(--accent); }

  /* Partners refresh button */
  .partners-refresh-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 12px; border-radius:6px;
    font-family:'IBM Plex Mono',monospace; font-size:12px;
    letter-spacing:.08em; text-transform:uppercase;
    cursor:pointer; transition:all .18s;
    border:1px solid var(--border-1);
    background:transparent; color:var(--text-1);
  }
  .partners-refresh-btn:hover {
    color:var(--accent);
    border-color:var(--accent);
    background:var(--accent-lo);
    box-shadow:0 0 12px var(--accent-lo);
  }
  .partners-refresh-btn.auto-on {
    border-color:var(--ok);
    color:var(--ok);
    background:#5DBF8A18;
  }
  .partners-auto-label {
    font-family:'IBM Plex Mono',monospace;
    font-size:12px; color:var(--text-1); margin-left:8px;
  }

  @media (max-width:768px) {
    .focus-stats { grid-template-columns:1fr; }
    .focus-graph { height:80px; }
    .focus-stat-n { font-size:28px; }
  }

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
const SparkCanvas = ({ trigger }: { trigger: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<any[]>([]);
  const frameRef = useRef<number | null>(null);
  const prevTrigger = useRef(false);

  const burst = (canvas: any) => {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");

    class Spark {
      x: number; y: number; vx: number; vy: number; gravity: number;
      isStreak: boolean; size: number; life: number; maxLife: number;
      px: number; py: number; color: string;
      constructor(x: any, y: any, fromSide: any) {
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
      draw(ctx: any) {
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

    const add = (x: any, y: any, side: any, count: any) => {
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
const WeldCanvas = ({ onDone }: { onDone: () => void }) => {
  const canvasRef  = useRef<HTMLCanvasElement | null>(null);
  const particles  = useRef<any[]>([]);
  const rafRef     = useRef<number | null>(null);
  const intervalsRef = useRef<any[]>([]);

  const SPEED = 0.75; // 25% faster than original

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;

    // ── particle helpers ──
    function spawnStream(x: any, y: any, count: any, intensity: any) {
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

    function streamSparks(getPos: any, totalMs: any, pps: any) {
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
      ctx.clearRect(0,0,canvas!.width,canvas!.height);
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

    function getBase(idx: any) {
      const el=letterEls[idx];
      if (!el) return {x:window.innerWidth/2,y:window.innerHeight/2};
      const r=el.getBoundingClientRect();
      return {x:r.left+r.width/2, y:r.top+r.height*0.78};
    }

    function forgeLetter(idx: any, startDelay: any) {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          const el=letterEls[idx] as HTMLElement;
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
    function fillBar(duration: any) {
      if (!barEl) return;
      barEl.style.width="0%";
      const start=performance.now();
      function tick(now: any) {
        const t=Math.min((now-start)/duration,1);
        barEl!.style.width=(Math.pow(t,0.55)*100)+"%";
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
      cancelAnimationFrame(rafRef.current as any);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}} />;
};

// ── Landing loader (sparks) ───────────────────────────────
const LandingLoader = ({ onDone, authReady }: { onDone: () => void; authReady: boolean }) => {
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
      <div id="forge-landing-sub" style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".38em",textTransform:"uppercase",color:"transparent",marginTop:10,position:"relative",zIndex:2}}>
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

const LoginLoader = ({ onDone, authReady }: { onDone: () => void; authReady: boolean }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible,    setVisible]    = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fade in text
    const t1 = setTimeout(() => setVisible(true), 100);
    // Fill bar
    const t2 = setTimeout(() => {
      if (!barRef.current) return;
      const start = performance.now();
      const dur = 1000;
      function tick(now: any) {
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
        fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:11.5,
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

// ── In-app loader (full FORGE sparks — same as landing) ──
const InAppLoader = ({ onDone, authReady }: { onDone: () => void; authReady: boolean }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const MIN_MS = Math.round((500 + 5*580 + 900 + 2200) * 0.75);

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
            fontFamily:"'Bebas Neue',sans-serif", fontSize:110, color:"#080807",
            letterSpacing:".06em", display:"inline-block", opacity:0,
            willChange:"transform,color,opacity",
          }}>{l}</span>
        ))}
      </div>
      <div id="forge-landing-sub" style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:14,letterSpacing:".38em",textTransform:"uppercase",color:"transparent",marginTop:10,position:"relative",zIndex:2}}>
        your discipline engine
      </div>
      <div style={{width:220,height:1,background:"#161614",marginTop:56,overflow:"hidden",position:"relative",zIndex:2}}>
        <div id="forge-landing-bar" style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

// ── Entry: routes to correct loader based on mode ─────────
const Entry = ({ onDone, authReady, mode }: { onDone: () => void; authReady: boolean; mode: string }) => {
  if (mode === "login")  return <LoginLoader  onDone={onDone} authReady={authReady} />;
  if (mode === "inapp")  return <InAppLoader  onDone={onDone} authReady={authReady} />;
  return <LandingLoader onDone={onDone} authReady={authReady} />;
};

// ============================================================

// ============================================================
// ONBOARDING — Screen 1: Why You're Here
// ============================================================
const OnboardWhy = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => (
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
const OnboardWho = ({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) => (
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
const OnboardInduct = ({ onDone, userName }: { onDone: () => void; userName: string }) => (
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
const DIFF_COLOR: Record<string, string> = { Hard:"#BF5D5D", Intense:"#D4B22A", Moderate:"#5DBF8A", "You decide":"#4A8FD4" };

const OnboardChallenge = ({ onStart, onSkip }: { onStart: (tpl: any, customTasks?: any, nonNegs?: any) => void; onSkip: () => void }) => {
  const [selected,   setSelected]   = useState<any>(null);
  const [editTasks,  setEditTasks]  = useState(false);
  const [tasks,      setTasks]      = useState<any[]>([]);
  const [nonNegs,    setNonNegs]    = useState<string[]>([]); // task ids that are non-negotiable
  const templates = TEMPLATES.filter(t => t.id !== "custom");
  const t = selected || templates[0];

  // Sync tasks when selection changes
  const selectTemplate = (tmpl: any) => {
    setSelected(tmpl);
    setTasks(tmpl.kpis.map((k: any,i: any) => ({ id:i, label:k.label, cat:k.cat })));
    setNonNegs([]); // reset non-negs on template change
    setEditTasks(false);
  };

  // Init tasks on mount
  useEffect(() => {
    if (tasks.length === 0) setTasks(templates[0].kpis.map((k,i) => ({ id:i, label:k.label, cat:k.cat })));
  }, []);

  const addTask    = () => setTasks(ts => [...ts, { id:Date.now(), label:"", cat:"other" }]);
  const removeTask = (id: any) => { setTasks(ts => ts.filter(x => x.id !== id)); setNonNegs(ns => ns.filter(n => n !== id)); };
  const updateTask = (id: any, val: any) => setTasks(ts => ts.map(x => x.id===id ? {...x, label:val} : x));
  const toggleNonNeg = (id: any) => setNonNegs(ns => ns.includes(id) ? ns.filter(n => n !== id) : [...ns, id]);
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".35em",textTransform:"uppercase",color:"var(--accent)",marginBottom:8}}>
            Final step — choose your challenge
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:".04em",lineHeight:1}}>
            What are you committing to?
          </div>
        </div>
        <button 
          className="btn btn-g"
          onClick={onSkip} 
          style={{fontSize:11,padding:"8px 16px",letterSpacing:".08em"}}
        >
          Skip for now →
        </button>
      </div>

      {/* Body — two columns */}
      <div className="ob-challenge-layout" style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Left — card list */}
        <div className="ob-challenge-left" style={{
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".28em",textTransform:"uppercase",color:"var(--accent)",marginBottom:5}}>
                {tmpl.tag} · {tmpl.duration}d
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".04em",color:"var(--text-0)",marginBottom:5}}>
                {tmpl.name}
              </div>
              <div style={{
                display:"inline-block",
                fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".16em",
                textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
                color: DIFF_COLOR[tmpl.difficulty]||"var(--text-2)",
                background: (DIFF_COLOR[tmpl.difficulty]||"#888")+"18",
                border:`1px solid ${(DIFF_COLOR[tmpl.difficulty]||"#888")}30`,
              }}>{tmpl.difficulty}</div>
            </div>
          ))}
        </div>

        {/* Right — detail panel */}
        <div className="ob-challenge-right" style={{flex:1, overflowY:"auto", padding:"28px 36px"}}>
          {/* Title + badge */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--accent)"}}>
              {t.tag}
            </div>
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".16em",
              textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
              color: DIFF_COLOR[t.difficulty]||"var(--text-2)",
              background:(DIFF_COLOR[t.difficulty]||"#888")+"18",
              border:`1px solid ${(DIFF_COLOR[t.difficulty]||"#888")}30`,
            }}>{t.difficulty}</div>
          </div>

          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,letterSpacing:".04em",lineHeight:1,marginBottom:16,color:"var(--text-0)"}}>
            {t.name}
          </div>

          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--text-1)",lineHeight:1.7,marginBottom:24}}>
            {t.about}
          </div>

          {/* Daily tasks */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)"}}>
                Daily tasks
              </div>
              <button 
                className="btn btn-g"
                onClick={()=>setEditTasks(e=>!e)} 
                style={{fontSize:10,padding:"5px 12px",letterSpacing:".08em"}}
              >
                {editTasks ? "Done" : "Edit Tasks"}
              </button>
            </div>
            {!editTasks ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {/* Non-neg hint */}
                {nonNegs.length > 0 && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, color:"var(--warn)", marginBottom:4 }}>
                    ◆ {nonNegs.length} non-negotiable{nonNegs.length > 1 ? "s" : ""} — click to toggle
                  </div>
                )}
                {nonNegs.length === 0 && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, color:"var(--text-2)", marginBottom:4 }}>
                    Click tasks to mark as non-negotiable
                  </div>
                )}
                {tasks.map((k,i)=>{
                  const isNonNeg = nonNegs.includes(k.id);
                  return (
                    <div key={k.id||i} 
                      onClick={() => toggleNonNeg(k.id)}
                      style={{
                        display:"flex",alignItems:"center",gap:10,
                        background: isNonNeg ? "var(--warn)10" : "var(--bg-2)",
                        border: `1px solid ${isNonNeg ? "var(--warn)40" : "var(--border-1)"}`,
                        borderRadius:6,padding:"10px 14px",
                        cursor:"pointer",
                        transition:"all 0.15s",
                      }}>
                      <div style={{
                        width:6,height:6,borderRadius:"50%",flexShrink:0,
                        background: isNonNeg ? "var(--warn)" : k.cat==="body"?"#D4922A":k.cat==="diet"?"#5DBF8A":k.cat==="mind"?"#4A8FD4":k.cat==="build"?"#BF5DBF":"var(--text-2)",
                      }} />
                      <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color: isNonNeg ? "var(--warn)" : "var(--text-0)",letterSpacing:".06em",flex:1}}>
                        {k.label}
                      </div>
                      {isNonNeg && (
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".1em", color:"var(--warn)" }}>
                          NON-NEG
                        </span>
                      )}
                    </div>
                  );
                })}
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
                        fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,outline:"none",
                      }}
                    />
                    {tasks.length > 1 && (
                      <div onClick={()=>removeTask(tk.id||i)} style={{color:"var(--text-2)",cursor:"pointer",fontSize:12,padding:"4px 6px"}}>✕</div>
                    )}
                  </div>
                ))}
                <button 
                  className="btn btn-g"
                  onClick={addTask} 
                  style={{width:"100%",justifyContent:"center",fontSize:10,padding:"10px",letterSpacing:".1em",borderStyle:"dashed"}}
                >
                  + Add Task
                </button>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:12}}>
              What you'll build
            </div>
            {t.benefits.map((b: any) =>(
              <div key={b} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,marginTop:1}}>◆</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>{b}</span>
              </div>
            ))}
          </div>

          {/* Best for */}
          <div style={{
            background:"var(--bg-2)",border:"1px solid var(--border-1)",
            borderRadius:8,padding:"16px 20px",marginBottom:32,
          }}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>
              Best for
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>
              {t.bestFor}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={()=>onStart(t, validTasks, nonNegs)}
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
class DeepWorkBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { crashed: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("[DeepWork crash]", error, info); }
  render() {
    if (this.state.crashed) return (
      <div style={{position:"fixed",inset:0,background:"#080807",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:24}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,letterSpacing:".2em",textTransform:"uppercase",color:"#56524D"}}>Something went wrong</div>
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

const fmt = (s: any) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const DeepWork = ({ challenge, kpis, toggle, onExit, sb, user, onSessionSaved }: { challenge: Challenge; kpis: KpiMap; toggle: (key: string) => void; onExit: () => void; sb: Sb; user: User | null | undefined; onSessionSaved: () => void }) => {
  const safeKpis = (challenge && challenge.kpis) ? challenge.kpis : [];
  const doneTasks = safeKpis.filter(k => kpis && kpis[k.key]).length;

  // Timer state
  const [preset,      setPreset]      = useState(0);
  const [customWork,  setCustomWork]  = useState(25);
  const [customBrk,   setCustomBrk]  = useState(5);
  const [phase,       setPhase]       = useState("idle");   // idle | work | break | paused | summary
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [pausedPhase, setPausedPhase] = useState<string | null>(null);  // remembers work|break when paused
  const [cycle,       setCycle]       = useState(0);
  const [totalFocused,setTotalFocused]= useState(0);
  const [sessionTasks,setSessionTasks]= useState(doneTasks);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const _sessionStartRef = useRef<number | null>(null);

  const workSecs = () => preset === 3 ? customWork * 60 : TIMER_PRESETS[preset].work * 60;
  const brkSecs  = () => preset === 3 ? customBrk  * 60 : TIMER_PRESETS[preset].brk  * 60;

  const saveSession = async (duration: any, cycles: any, tasks: any) => {
    if (!sb || !user || sessionSaved) return;
    if (duration < 30) {
      // Don't save, but let user know why
      return "min_time";
    }
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
    } catch(e) { console.warn("save session:", e); return "error"; }
  };

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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

  const pauseTimer = () => {
    clearInterval(timerRef.current as any);
    setPausedPhase(phase);
    setPhase("paused");
  };

  const resumeTimer = () => {
    setPhase(pausedPhase as string);  // restores work|break — useEffect picks it up with current timeLeft
    setPausedPhase(null);
  };

  const [saveStatus, setSaveStatus] = useState<string | null>(null); // null | "saved" | "min_time" | "error"

  const endSession = async () => {
    clearInterval(timerRef.current as any);
    // Calculate final focused time including current work phase if active
    const finalFocused = totalFocused + (phase === "work" ? workSecs() - timeLeft : 0);
    // Save session to Supabase
    const result = await saveSession(finalFocused, cycle, sessionTasks);
    setSaveStatus(result || null);
    setPhase("idle");
    setShowSummary(true);
  };

  useEffect(() => {
    if (phase !== "work" && phase !== "break") return;
    // Don't reset timeLeft here — startWork/startBreak/resumeTimer already set it
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current as any);
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
    return () => clearInterval(timerRef.current as any);
  }, [phase]);

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
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".3em",color:"var(--accent)",textTransform:"uppercase",marginBottom:8}}>Session Complete</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,letterSpacing:".04em",lineHeight:1,marginBottom:32}}>Good Work.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:32}}>
          {[
            { n: fmt(totalFocused + (phase==="work" ? workSecs()-timeLeft : 0)), l:"Time Focused" },
            { n: cycle,                  l:"Cycles Done" },
            { n: safeKpis.length > 0 ? `${sessionTasks}/${safeKpis.length}` : "—", l:"Tasks Done" },
          ].map(s => (
            <div key={s.l} style={{background:"var(--bg-2)",border:"1px solid var(--border-1)",borderRadius:10,padding:"16px 12px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"var(--accent)",lineHeight:1}}>{s.n}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".12em",textTransform:"uppercase",color:"var(--text-2)",marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
        
        {/* Save status message */}
        {saveStatus === "min_time" && (
          <div style={{background:"var(--warn)15",border:"1px solid var(--warn)40",borderRadius:8,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--warn)",letterSpacing:".06em"}}>
              ⚠ Session not logged — focus for 30 seconds or more to save.
            </div>
          </div>
        )}
        {saveStatus === "saved" && (
          <div style={{background:"var(--ok)15",border:"1px solid var(--ok)40",borderRadius:8,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--ok)",letterSpacing:".06em"}}>
              ✓ Session logged to your focus history.
            </div>
          </div>
        )}
        {saveStatus === "error" && (
          <div style={{background:"var(--err)15",border:"1px solid var(--err)40",borderRadius:8,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--err)",letterSpacing:".06em"}}>
              ✕ Failed to save session. Check your connection.
            </div>
          </div>
        )}
        
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)",letterSpacing:".1em",marginBottom:24}}>
          {sessionTasks === safeKpis.length && safeKpis.length > 0
            ? "✓ All tasks completed. That's a perfect session."
            : sessionTasks > 0
            ? `${safeKpis.length - sessionTasks} task${safeKpis.length-sessionTasks===1?"":"s"} remaining for today.`
            : "No tasks ticked — but you still showed up."}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-a" onClick={()=>{setShowSummary(false);setPhase("idle");setCycle(0);setTotalFocused(0);setSaveStatus(null);setSessionSaved(false);}}>
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-2)",marginTop:4}}>
                {phase==="idle"?"ready":phase==="work"?"focus":phase==="break"?"break":""}
              </div>
            </div>
          </div>

          {/* Cycle count */}
          {cycle > 0 && (
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".16em",color:"var(--accent)",marginTop:12,textTransform:"uppercase"}}>
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
              <button className="btn btn-g" onClick={pauseTimer}>
                Pause
              </button>
              <button className="btn btn-a" style={{background:"var(--ok)",borderColor:"var(--ok)"}} onClick={endSession}>
                End Session
              </button>
            </>
          )}
          {phase === "paused" && (
            <>
              <button className="btn btn-a" onClick={resumeTimer}>
                ▶ Resume
              </button>
              <button className="btn btn-g" onClick={endSession}>
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
const CompletionRing = ({ done, total, isScaled }: { done: number; total: number; isScaled?: boolean }) => {
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

const TaskGrid = ({ tasks, taskState, toggle, isScaled }: { tasks: Kpi[]; taskState: KpiMap; toggle: (key: string) => void; isScaled?: boolean }) => {
  const done  = tasks.filter(t => taskState[t.key]).length;
  const total = tasks.length;

  // Scaled completion: hit 100% when all non-negs are done
  const nonNegTasks   = tasks.filter(t => t.nonNeg);
  const nonNegDone    = nonNegTasks.filter(t => taskState[t.key]).length;
  const hasNonNegs    = nonNegTasks.length > 0;
  const allNonNegDone = hasNonNegs && nonNegDone === nonNegTasks.length;
  const scaledDone    = isScaled ? (hasNonNegs ? nonNegDone : done) : done;
  const scaledTotal   = isScaled ? (hasNonNegs ? nonNegTasks.length : total) : total;
  const displayPct    = scaledTotal > 0 ? Math.round((scaledDone / scaledTotal) * 100) : 0;
  const ringDone      = isScaled ? scaledDone : done;
  const ringTotal     = isScaled ? scaledTotal : total;

  // Sub-message logic
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
    tasks.reduce((acc: Record<string, { done: number; total: number }>, t) => {
      const cat = t.cat || "other";
      if (!acc[cat]) acc[cat] = { done:0, total:0 };
      acc[cat].total++;
      if (taskState[t.key]) acc[cat].done++;
      return acc;
    }, {} as Record<string, { done: number; total: number }>)
  );

  return (
    <div>
      {/* Ring header */}
      <div className="ring-wrap" style={ isScaled ? { borderColor:"#D4B22A30", background:"#D4B22A06" } : {}}>
        <CompletionRing done={ringDone} total={ringTotal} isScaled={isScaled} />
        <div className="ring-info">
          <div className="ring-pct" style={{ color: isScaled ? (allNonNegDone ? "var(--ok)" : "#D4B22A") : done===total && total>0 ? "var(--ok)" : done>0 ? "var(--accent)" : "var(--text-2)" }}>
            {displayPct}%
            {isScaled && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, marginLeft:8, color:"#D4B22A", letterSpacing:".1em" }}>SCALED</span>}
          </div>
          <div className="ring-sub">
            {getSubMessage()}
          </div>
          <div className="ring-cats">
            {catSummary.map(([cat, s]: [any, any]) => {
              const info = TASK_CATEGORIES[cat as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.other;
              return (
                <div key={cat} style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".1em",
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
          const cat       = TASK_CATEGORIES[(t.cat || "other") as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.other;
          const cardColor = isScaled ? "#D4B22A" : cat.color;
          const label     = isScaled ? ((SCALED_LABELS as Record<string, string>)[t.key] || t.label + " (scaled)") : t.label;

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
                  {t.nonNeg && (
                    <div style={{
                      fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:7, letterSpacing:".14em",
                      color:"var(--warn)", marginTop:3, display:"flex", alignItems:"center", gap:4,
                    }}>
                      ◆ NON-NEG
                    </div>
                  )}
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
const RecoveryModal = ({ onClose, onOwnIt, onInvoke, recoveryUsed }: { onClose: () => void; onOwnIt: () => void; onInvoke: () => void; recoveryUsed: boolean }) => (
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
const CheckInBar = ({ mode, setMode, recoveryUsed: _recoveryUsed, onRecoveryClick, scaledDaysThisWeek }: { mode: string; setMode: (m: string) => void; recoveryUsed: boolean; onRecoveryClick: () => void; scaledDaysThisWeek: number }) => {
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
const ChallengeArena = ({ challenges, onAddSecondary, onViewChallenge }: { challenges: ChallengesState; onAddSecondary: () => void; onViewChallenge: (c: Challenge | null, type: string) => void }) => {
  const { main, secondary } = challenges;
  const mainPct   = pct(main?.dayNum, main?.totalDays);
  const remaining = 3 - secondary.length;

  return (
    <div>
      <div className="arena">

        {/* MAIN CHALLENGE — left column */}
        <div className="arena-main" onClick={() => onViewChallenge(main, "main")}>
          <div style={{ position:"absolute", top:8, right:12, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".14em", color:"var(--accent)", zIndex:2, opacity:.7 }}>TAP TO VIEW ↗</div>
          <div className="arena-main-crown">Main Challenge</div>
          <div className="arena-main-name">{main?.name}</div>
          <div className="arena-main-meta">
            {main?.dayNum < 1
              ? <>STARTS {main?.created_at ? new Date(main?.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }).toUpperCase() : "SOON"}</>
              : <>DAY {main?.dayNum} OF {main?.totalDays} &nbsp;·&nbsp; {main?.totalDays - main?.dayNum} DAYS REMAINING{main?.created_at && <>&nbsp;·&nbsp; STARTED {new Date(main?.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }).toUpperCase()}</>}</>
            }
          </div>

          <div className="arena-main-stats">
            <div className="arena-ms">
              <div className="arena-ms-val" style={{ color:"var(--accent)" }}>{mainPct}%</div>
              <div className="arena-ms-label">Complete</div>
            </div>
          </div>

          <div className="track" style={{ height:3 }}>
            <div className="fill" style={{ width:`${mainPct}%` }} />
          </div>
          <div className="flex between mt8 f-mono c-2" style={{ fontSize:9, letterSpacing:".06em" }}>
            <span>DAY 1</span><span>{mainPct}%</span><span>DAY {main?.totalDays}</span>
          </div>

          <div style={{
            position:"absolute", right:24, top:-10,
            fontFamily:"'Bebas Neue',sans-serif",
            fontSize:"clamp(80px,10vw,130px)",
            color:"var(--text-3)", letterSpacing:".02em", lineHeight:.85,
            pointerEvents:"none", userSelect:"none", opacity:.5,
          }}>{main?.dayNum}</div>
        </div>

        {/* SECONDARY + SLOTS — right column */}
        <div className="arena-side">
          {secondary.map(c => {
            const sp = pct(c.dayNum, c.totalDays);
            return (
              <div key={c.id} className="arena-sec" onClick={() => onViewChallenge(c, "secondary")}>
                <div style={{ position:"absolute", top:6, right:10, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:7, letterSpacing:".12em", color:c.color, opacity:.7 }}>↗</div>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c.color, borderRadius:"10px 10px 0 0" }} />
                <div className="arena-sec-tag" style={{ color:c.color }}>SECONDARY</div>
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
              <div className="arena-slot-hint">Must end within {main?.totalDays} days</div>
            </div>
          ))}
        </div>

      </div>

      {secondary.length > 0 && (
        <div className="f-mono c-2 mt8" style={{ fontSize:12, letterSpacing:".08em", textAlign:"right" }}>
          {secondary.length}/3 secondary · all must end within main challenge timeframe
        </div>
      )}
    </div>
  );
};

// ============================================================
// AI INSIGHT BLOCK
// ============================================================
const _MOCK_INSIGHTS = {
  Stoic:           "Day 28. Workout 1 completion is at 94% — hold the standard. Diet compliance drops every Thursday; identify the variable and eliminate it. 61% on reading is the weak link. Either commit or remove it from the list.",
  Coach:           "You're building something real here — 12 days straight is no accident. I'm noticing a Thursday pattern where your energy dips. Let's front-load your hardest tasks before midweek. Your reading habit is the one to protect right now — it compounds quietly.",
  "Drill Sergeant": "28 days in and reading is sitting at 61%. That's not a habit, that's a suggestion. Thursday is where discipline goes to die for you — not anymore. Tighten up or admit you didn't actually want this.",
};

const AIInsight = ({ tone, mission, challenge, kpis, checkins }: { tone: string; mission: string; challenge: Challenge; kpis: KpiMap; checkins: ScoreMap }) => {
  const [loading,    setLoading]    = useState(false);
  const [insight,    setInsight]    = useState("");
  const [lastUpdate, setLastUpdate] = useState<any>(null);

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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insight`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tone: ctx.tone,
          prompt: `User data:
- Challenge: ${ctx.challengeName}
- Day ${ctx.dayNum} of ${ctx.totalDays}
- Streak: ${ctx.streak} days
- Consistency: ${ctx.consistency}%
- Mission: "${ctx.mission || "Not set"}"
- Today: ${ctx.todayDone}/${ctx.todayTotal} tasks done
- Today's tasks: ${ctx.todayTasks.map(t => `${t.done ? "✓" : "✗"} ${t.label}`).join(", ")}
- Last 7 days scores: ${ctx.last7Days.length > 0 ? ctx.last7Days.map(d => `${d.date}: ${d.score}%`).join(", ") : "No data yet"}
- Avg score last 7 days: ${ctx.avgScoreLast7 !== null ? ctx.avgScoreLast7 + "%" : "No history yet"}
- Total days logged: ${ctx.daysLogged}`,
        }),
      });
      const data = await res.json();
      const text = data.text || data.error || "No insight generated.";
      const time = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
      setInsight(text);
      setLastUpdate(time);
      // Only cache real insights, not quota errors
      const isError = text.includes("quota") || text.includes("⚠") || text.includes("exceeded") || text.includes("error");
      if (challenge?.id && !isError) {
        try {
          localStorage.setItem(`forge_insight_${challenge.id}`, JSON.stringify({ text, time, ts: Date.now() }));
        } catch(e) {}
      }
    } catch(e) {
      setInsight("Could not reach TALOS Insights. Check your connection.");
    }
    setLoading(false);
  };

  // Load cached insight on mount, generate only if stale (>1hr) or missing
  useEffect(() => {
    if (!challenge) return;
    const cacheKey = `forge_insight_${challenge.id}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      const ageMs = Date.now() - (cached.ts || 0);
      if (cached.text && ageMs < 2 * 60 * 60 * 1000) {
        setInsight(cached.text);
        setLastUpdate(cached.time || "");
        return; // fresh cache — don't call API
      }
    } catch(e) {}
    generate();
  }, [challenge?.id]);

  useEffect(() => {
    // Regenerate when tone changes only if we already have a cached insight
    if (challenge && insight) generate();
  }, [tone]);

  return (
    <div className="ai-block">
      <div className="ai-block-header">
        <div className="ai-block-label">
          <div className="ai-dot" />
          TALOS Insights · {tone} Mode
        </div>
        <button className="ai-refresh-btn" onClick={generate} disabled={loading}>
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
          <div className="f-mono" style={{ fontSize:12, letterSpacing:".06em", color:"var(--text-1)" }}>
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
const _Home = ({ challenge, challenges, kpis, toggle, onDW: _onDW, tone, mission, onAddSecondary, userName, onViewChallenge, onLogDay, loggedToday, checkins = {} }: { challenge: Challenge; challenges: ChallengesState; kpis: KpiMap; toggle: (key: string) => void; onDW: () => void; tone: string; mission: string; onAddSecondary: () => void; userName: string; onViewChallenge: (c: Challenge | null, type: string) => void; onLogDay: (done: number, total: number) => void; loggedToday: boolean; checkins?: ScoreMap }) => {
  const safekpis = challenge.kpis || [];
  const done  = safekpis.filter(k => kpis[k.key]).length;
  const total = safekpis.length;
  const _p    = pct(challenge.dayNum, challenge.totalDays);

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
  const _JARVIS_MESSAGES = {
    morning:   `Day ${challenge.dayNum} is live. ${challenge.totalDays - challenge.dayNum} days remain on your main challenge. Your streak is at ${challenge.streak} — don't let it end here.`,
    afternoon: mission || `Day ${challenge.dayNum} of ${challenge.totalDays}. Stay locked in.`,
    evening:   `Evening check-in. ${done === total ? "All tasks done — strong close." : `${total - done} task${total-done===1?"":"s"} still open. Finish strong.`}`,
    night:     `Late session. Day ${challenge.dayNum} of ${challenge.totalDays}. ${done === total ? "Logged and done." : "Wrap it up."}`,
  };

  return (
    <div className="home-page">
      <div className="home-layout">

        {/* ── LEFT COLUMN: header, AI, challenges, stats ── */}
        <div className="home-left">

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
          <div className="f-mono c-2" style={{ fontSize:10, letterSpacing:".08em" }}>
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

        </div>{/* end home-left */}

        {/* ── RIGHT COLUMN: tasks ── */}
        <div className="home-right">
      <div className="a4" style={{marginTop:"clamp(0px, 5vw, 82px)"}}>
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

        {/* Secondary challenge task sections */}
        {(challenges?.secondary || []).filter(c => c.kpis?.length > 0).map(c => {
          const secDone  = c.kpis.filter(k => kpis[k.key]).length;
          const secTotal = c.kpis.length;
          const secPct   = secTotal > 0 ? Math.round((secDone / secTotal) * 100) : 0;
          return (
          <div key={c.id} style={{ marginTop:24 }}>
            {/* Section header with inline progress */}
            <div style={{ marginBottom:12, paddingBottom:10, borderBottom:"1px solid var(--border-0)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:"var(--text-1)", display:"flex", alignItems:"center", gap:8, fontWeight:500 }}>
                  <span style={{ color:"var(--accent)", opacity:.7 }}>◈</span> {c.name}
                </div>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, color: secDone === secTotal && secTotal > 0 ? "var(--ok)" : "var(--text-2)", letterSpacing:".08em" }}>
                  {secDone}/{secTotal}
                </span>
              </div>
              <div style={{ height:3, background:"var(--bg-3)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:2, background: secDone === secTotal && secTotal > 0 ? "var(--ok)" : "var(--accent)", transition:"width .4s ease", width:`${secPct}%` }} />
              </div>
            </div>
            {c.kpis.map(t => (
              <div key={t.key} className="task-row" onClick={() => toggle(t.key)} style={{
                background: kpis[t.key] ? "var(--ok)12" : undefined,
                borderColor: kpis[t.key] ? "var(--ok)40" : undefined,
                cursor:"pointer",
              }}>
                <div style={{ width:14, height:14, borderRadius:"50%", border:`1.5px solid ${kpis[t.key] ? "var(--ok)" : "var(--border-1)"}`, background: kpis[t.key] ? "var(--ok)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:8, color:"#080807", transition:"all .2s" }}>
                  {kpis[t.key] ? "✓" : ""}
                </div>
                <span style={{ fontSize:13, color: kpis[t.key] ? "var(--ok)" : "var(--text-1)", flex:1, transition:"color .2s" }}>{t.label}</span>
              </div>
            ))}
          </div>
          );
        })}
      </div>
        </div>{/* end home-right */}

      </div>{/* end home-layout */}

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
const LogDayBar = ({ done, total, logged, onLog }: { done: number; total: number; logged: boolean; onLog: () => void }) => {
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--warn)",marginBottom:8}}>⚠ Incomplete Day</div>
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
      <div className="logbar" style={{
        position:"fixed", bottom:0, left:58, right:0,
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".14em",textTransform:"uppercase",
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,letterSpacing:".14em",
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
// FOCUS SESSIONS COMPONENT
// ============================================================
const FocusSessions = ({ sessions = [], loading = false }: { sessions?: any[]; loading?: boolean }) => {
  const [range, setRange] = useState("1W"); // 1D, 1W, 1M
  const [showAll, setShowAll] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<any>(null);

  // Format duration
  const fmtDur = (secs: any) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}`;
    return `${m} min`;
  };

  // Format date for session list
  const fmtSessionDate = (dateStr: any) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  };

  // Format date for chart tooltip
  const fmtChartDate = (dateStr: any) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  };

  // Calculate stats (no cycles)
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60);
  const _avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  // Build graph data based on range
  const buildGraphData = () => {
    const now = new Date();
    let days = 7;
    if (range === "1D") days = 1;
    if (range === "1M") days = 30;

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const daySessions = sessions.filter(s => s.created_at?.startsWith(dateStr));
      const mins = Math.round(daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60);
      data.push({
        date: dateStr,
        dayNum: d.getDate(),
        minutes: mins,
      });
    }
    return data;
  };

  const graphData = buildGraphData();
  const maxMins = Math.max(...graphData.map(d => d.minutes), 10); // Min 10 for scale

  // Calculate Y-axis ticks (auto-scale)
  const getYTicks = (max: any) => {
    if (max <= 15) return [0, 5, 10, 15];
    if (max <= 30) return [0, 10, 20, 30];
    if (max <= 60) return [0, 15, 30, 45, 60];
    if (max <= 120) return [0, 30, 60, 90, 120];
    if (max <= 180) return [0, 60, 120, 180];
    const step = Math.ceil(max / 4 / 30) * 30;
    return [0, step, step*2, step*3, Math.ceil(max / step) * step];
  };
  
  const yTicks = getYTicks(maxMins);
  const yMax = yTicks[yTicks.length - 1];

  // Recent sessions (last 5 or 20)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, showAll ? 20 : 5);

  if (loading) {
    return (
      <div className="focus-card">
        <div className="focus-card-header">
          <div className="focus-card-title">Focus Sessions</div>
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:12, color:"var(--text-1)", padding:"20px 0", textAlign:"center" }}>
          Loading sessions...
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="focus-card">
        <div className="focus-card-header">
          <div className="focus-card-title">Focus Sessions</div>
        </div>
        <div style={{ textAlign:"center", padding:"32px 16px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"var(--text-3)", marginBottom:8 }}>No Sessions Yet</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:12, color:"var(--text-1)", letterSpacing:".08em" }}>
            Use Deep Work mode to start tracking focus time
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-card">
      <div className="focus-card-header">
        <div className="focus-card-title">Focus Sessions</div>
      </div>

      {/* Stats - 2 columns now, no cycles */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        <div className="focus-stat">
          <div className="focus-stat-n">{totalSessions}</div>
          <div className="focus-stat-l">Sessions</div>
        </div>
        <div className="focus-stat">
          <div className="focus-stat-n">
            {totalMinutes < 60 
              ? `${totalMinutes} min` 
              : `${Math.floor(totalMinutes/60)}:${String(totalMinutes%60).padStart(2,"0")}`}
          </div>
          <div className="focus-stat-l">Total Time</div>
        </div>
      </div>

      {/* Graph Header */}
      <div className="focus-graph-header">
        <div className="focus-graph-title">Focus Minutes</div>
        <div className="focus-range-btns">
          {["1D", "1W", "1M"].map(r => (
            <button
              key={r}
              className={`focus-range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart with axes */}
      <div style={{ display:"flex", gap:8 }}>
        {/* Y-axis */}
        <div style={{ 
          display:"flex", flexDirection:"column", justifyContent:"space-between", 
          height:140, paddingBottom:24, width:32, flexShrink:0 
        }}>
          {[...yTicks].reverse().map((tick, i) => (
            <div key={i} style={{ 
              fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, 
              color:"var(--text-2)", textAlign:"right", lineHeight:1 
            }}>
              {tick}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex:1, position:"relative" }}>
          {/* Grid lines */}
          <div style={{ position:"absolute", inset:0, bottom:24, display:"flex", flexDirection:"column", justifyContent:"space-between", pointerEvents:"none" }}>
            {yTicks.map((_, i) => (
              <div key={i} style={{ borderBottom:"1px dashed var(--border-1)", width:"100%" }} />
            ))}
          </div>

          {/* Bars */}
          <div style={{ 
            display:"flex", alignItems:"flex-end", gap:2, 
            height:140, paddingBottom:24, position:"relative" 
          }}>
            {graphData.map((d, i) => {
              const barHeight = yMax > 0 ? (d.minutes / yMax) * 116 : 0; // 116 = 140 - 24 padding
              return (
                <div 
                  key={i} 
                  style={{ 
                    flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    position:"relative"
                  }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Bar */}
                  <div style={{
                    width: range === "1M" ? 6 : range === "1W" ? 16 : 40,
                    height: d.minutes > 0 ? Math.max(barHeight, 4) : 2,
                    background: d.minutes > 0 ? "var(--accent)" : "var(--bg-3)",
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.3s ease, opacity 0.15s",
                    opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5,
                    cursor: "pointer",
                  }} />

                  {/* Tooltip */}
                  {hoveredBar === i && d.minutes > 0 && (
                    <div style={{
                      position:"absolute", bottom:"calc(100% + 8px)",
                      background:"var(--bg-4)", border:"1px solid var(--border-1)",
                      borderRadius:6, padding:"6px 10px",
                      fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:11,
                      color:"var(--text-0)", whiteSpace:"nowrap", zIndex:20,
                      boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
                    }}>
                      <span style={{ color:"var(--text-1)" }}>{fmtChartDate(d.date)}:</span>{" "}
                      <span style={{ color:"var(--accent)", fontWeight:500 }}>{d.minutes}m</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div style={{ 
            display:"flex", justifyContent:"space-between", 
            position:"absolute", bottom:0, left:0, right:0, height:20 
          }}>
            {graphData.map((d, i) => {
              // Show every 5th label for 1M, every label for 1W, single for 1D
              const showLabel = range === "1D" || range === "1W" || (i % 5 === 0) || i === graphData.length - 1;
              return (
                <div key={i} style={{ 
                  flex:1, textAlign:"center",
                  fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, 
                  color:"var(--text-2)", 
                  opacity: showLabel ? 1 : 0,
                }}>
                  {d.dayNum}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Sessions - no cycles column */}
      <div style={{ marginTop:24 }}>
        <div className="focus-graph-title" style={{ marginBottom:12 }}>Recent Sessions</div>
        <div className="focus-sessions-list">
          {recentSessions.map((s, i) => (
            <div key={s.id || i} className="focus-session-row">
              <div className="focus-session-date">{fmtSessionDate(s.created_at)}</div>
              <div className="focus-session-dur">{fmtDur(s.duration_seconds)}</div>
            </div>
          ))}
        </div>
        {sessions.length > 5 && (
          <button className="focus-view-all" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : `View All (${sessions.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// WALL
// ============================================================
const _groupByMonth = (wall: any) => {
  const months: Record<string, any> = {};
  wall.forEach((d: any) => {
    const key = d.date.slice(0, 7);
    const label = new Date(d.date + "T00:00:00").toLocaleString("en-US", { month: "long", year: "numeric" });
    if (!months[key]) months[key] = { label, days: [] };
    months[key].days.push(d);
  });
  return Object.values(months);
};

const Wall = ({ challenge, challenges, checkins = {}, allCheckins = {}, challengeHistory = [], focusSessions = [], focusLoading = false }: { challenge: Challenge; challenges: ChallengesState; checkins?: ScoreMap; allCheckins?: Record<string, ScoreMap>; challengeHistory?: any[]; focusSessions?: any[]; focusLoading?: boolean }) => {
  // Selected challenge state - default to active main challenge or most recent
  const defaultChallenge = challenges.main 
    ? { ...challenges.main, id: challenges.main.id } 
    : challengeHistory[0] || null;
  const [selectedId, setSelectedId] = useState(defaultChallenge?.id || null);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Find selected challenge from history or active challenges
  const selectedChallenge = React.useMemo(() => {
    if (!selectedId) return null;
    // Check active challenges first
    if (challenges.main?.id === selectedId) return challenges.main;
    const sec = challenges.secondary?.find(c => c.id === selectedId);
    if (sec) return sec;
    // Check history
    return challengeHistory.find(c => c.id === selectedId) || null;
  }, [selectedId, challenges, challengeHistory]);
  
  // Get checkins for selected challenge
  const selectedCheckins = React.useMemo(() => {
    if (!selectedId) return {};
    // For active main, use the live checkins prop
    if (challenges.main?.id === selectedId) return checkins;
    // Otherwise use allCheckins
    return allCheckins[selectedId] || {};
  }, [selectedId, checkins, allCheckins, challenges.main?.id]);

  // Update selected when challenges load
  React.useEffect(() => {
    if (!selectedId && (challenges.main || challengeHistory.length > 0)) {
      setSelectedId(challenges.main?.id || challengeHistory[0]?.id);
    }
  }, [challenges.main, challengeHistory, selectedId]);

  // Format date range
  const fmtDateRange = (startDate: any, totalDays: any) => {
    if (!startDate) return "";
    const start = new Date(startDate + "T12:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + totalDays - 1);
    const fmt = (d: any) => d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  // Get challenge status
  const getStatus = (ch: any) => {
    if (!ch.archived) return { label:"Active", color:"var(--ok)" };
    if (ch.completedAt) return { label:"Completed", color:"var(--accent)" };
    return { label:"Quit", color:"var(--text-2)" };
  };

  // Build unique challenge list (active + history, deduped)
  const allChallengesList = React.useMemo(() => {
    const seen = new Set();
    const list: any[] = [];
    // Active challenges first
    [challenges.main, ...(challenges.secondary || [])].filter(Boolean).forEach(c => {
      if (!seen.has(c?.id)) {
        seen.add(c?.id);
        list.push({ ...c, startDate: c?.start_date, archived: false });
      }
    });
    // Then history
    challengeHistory.forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    });
    return list;
  }, [challenges, challengeHistory]);

  // No challenges at all
  if (allChallengesList.length === 0) return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Proof of Work</div>
        <div className="pg-title">The Wall</div>
      </div>
      <div style={{marginTop:64,textAlign:"center",padding:"48px 0"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"var(--text-3)",letterSpacing:".04em",marginBottom:12}}>Nothing Here Yet</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:12,color:"var(--text-1)",letterSpacing:".12em",textTransform:"uppercase"}}>Come back when you've started a challenge</div>
      </div>
    </div>
  );

  // Build wall days based on selected challenge
  const challengeToday = getChallengeDate();
  const challengeStart = selectedChallenge?.startDate || selectedChallenge?.start_date || challengeToday;
  const totalDays = selectedChallenge?.totalDays || 30;

  const wallDays = (() => {
    const days = [];
    const today = new Date(challengeToday + "T12:00:00");
    const challengeStartDate = new Date(challengeStart + "T12:00:00");
    
    // Start 6 months ago from today, on a Sunday
    const gridStart = new Date(today);
    gridStart.setMonth(gridStart.getMonth() - 6);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    
    // End on Saturday after today
    const gridEnd = new Date(today);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const challengeEndDate = new Date(challengeStartDate);
    challengeEndDate.setDate(challengeEndDate.getDate() + totalDays - 1);
    
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const isInChallenge = d >= challengeStartDate && d <= challengeEndDate;
      const dayNum = isInChallenge ? Math.floor((d.getTime() - challengeStartDate.getTime()) / msPerDay) + 1 : null;
      const isToday = dateStr === challengeToday;
      const isFuture = d > today;
      const isBeforeChallenge = d < challengeStartDate;
      const isAfterChallenge = d > challengeEndDate;
      
      days.push({
        date: dateStr,
        score: isInChallenge && !isFuture ? (selectedCheckins[dateStr] !== undefined ? selectedCheckins[dateStr] : null) : null,
        isToday,
        isFuture: isInChallenge && isFuture,
        isOutside: isBeforeChallenge || isAfterChallenge,
        day: dayNum,
      });
    }
    return days;
  })();

  // Stats for selected challenge
  const strong = wallDays.filter(d => d.score !== null && d.score >= 75).length;
  const missed = wallDays.filter(d => d.score === 0).length;
  const daysLogged = Object.values(selectedCheckins).filter(score => score > 0).length;

  // All-time stats
  const completedChallenges = challengeHistory.filter(c => c.completedAt);
  const totalCompleted = completedChallenges.length;
  const bestConsistency = Math.min(100, Math.max(...challengeHistory.map(c => c.consistency || 0), 0));
  const totalDaysForged = challengeHistory.reduce((s, c) => s + (c.checkinCount || 0), 0);

  return (
    <div className="page">
      <div className="a0">
        <div className="pg-tag">Proof of Work</div>
        <div className="pg-title">The Wall</div>
        <div className="pg-sub">Every cell is a day. Every shade is effort.</div>
      </div>

      {/* TOP SECTION — 2 columns on desktop, stack on mobile */}
      <div className="a1 mt24">
        <div className="wall-top-grid">
          {/* Left: First 2 scoreboard cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="slabel">All-Time Scoreboard</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { n:totalCompleted,   l:"Challenges Completed", c:"c-ok"  },
                { n:totalDaysForged,  l:"Total Days Forged",    c:"c-acc" },
              ].map(s => (
                <div key={s.l} className="sb-card">
                  <div className={`sb-card-n ${s.c}`}>{s.n}</div>
                  <div className="sb-card-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Challenge History (collapsible) */}
          <div style={{ 
            background:"var(--bg-1)", 
            borderRadius:12, 
            border:"1px solid var(--border-0)",
            overflow:"hidden",
          }}>
            <div 
              onClick={() => setHistoryOpen(!historyOpen)}
              style={{ 
                padding:"12px 16px", 
                cursor:"pointer",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                borderBottom: historyOpen ? "1px solid var(--border-0)" : "none",
              }}
            >
              <div className="f-mono" style={{ fontSize:10, letterSpacing:".15em", textTransform:"uppercase", color:"var(--text-2)" }}>
                Challenge History ({allChallengesList.length})
              </div>
              <div style={{ color:"var(--text-2)", fontSize:12, transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>
                ▼
              </div>
            </div>
            {historyOpen && (
              <div style={{ padding:12, maxHeight:200, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {allChallengesList.map(c => {
                  const isSelected = c.id === selectedId;
                  const status = getStatus(c);
                  return (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      style={{
                        padding:"8px 10px",
                        borderRadius:6,
                        background: isSelected ? "var(--accent)15" : "var(--bg-2)",
                        border: `1px solid ${isSelected ? "var(--accent)" : "var(--border-0)"}`,
                        cursor:"pointer",
                        transition:"all 0.15s",
                      }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ 
                          fontFamily:"'Bebas Neue',sans-serif", 
                          fontSize:14, 
                          letterSpacing:".03em",
                          color: isSelected ? "var(--accent)" : "var(--text-0)",
                        }}>
                          {c.name}
                        </div>
                        <span className="f-mono" style={{ fontSize:9, color:status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                        <span className="f-mono" style={{ fontSize:8, color:"var(--text-1)" }}>
                          {fmtDateRange(c.startDate || c.start_date, c.totalDays)}
                        </span>
                        <span className="f-mono" style={{ fontSize:8, color:"var(--text-1)" }}>
                          {c.consistency || 0}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Second row: Best Consistency + Current Streak */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
          {[
            { n:`${bestConsistency}%`,       l:"Best Consistency",     c:"c-warn" },
            { n:challenge?.streak || 0,      l:"Current Streak 🔥",   c:"c-warn" },
          ].map(s => (
            <div key={s.l} className="sb-card">
              <div className={`sb-card-n ${s.c}`}>{s.n}</div>
              <div className="sb-card-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SELECTED CHALLENGE INFO */}
      {selectedChallenge && (
          <div className="a2 mt24">
            <div className="slabel">Selected Challenge</div>
            <div className="oc-card">
              <div className="oc-bar-wrap">
                <div className="oc-name">{selectedChallenge.name}</div>
                <div className="oc-meta">
                  {selectedChallenge.archived 
                    ? `${daysLogged} DAYS LOGGED · ${selectedChallenge.consistency || 0}% CONSISTENCY`
                    : `DAY ${selectedChallenge.dayNum} OF ${selectedChallenge.totalDays} · ${selectedChallenge.streak || 0} DAY STREAK · ${selectedChallenge.consistency || 0}% CONSISTENCY`
                  }
                </div>
                <div className="oc-track">
                  <div className="oc-fill" style={{ 
                    width:`${selectedChallenge.archived ? (selectedChallenge.consistency || 0) : pct(selectedChallenge.dayNum || 0, selectedChallenge.totalDays)}%`, 
                    background:selectedChallenge.color || "var(--accent)" 
                  }} />
                </div>
              </div>
              <div className="oc-pct" style={{ color:selectedChallenge.color || "var(--accent)" }}>
                {selectedChallenge.archived 
                  ? `${selectedChallenge.consistency || 0}%`
                  : `${pct(selectedChallenge.dayNum || 0, selectedChallenge.totalDays)}%`
                }
              </div>
            </div>
          </div>
        )}

        {/* WALL GRID — GitHub style */}
        <div className="a2 mt32">
          <div className="flex between center mb12" style={{ flexWrap:"wrap", gap:8 }}>
            <div className="slabel" style={{ marginBottom:0 }}>Consistency Grid</div>
            <div className="flex g8 center f-mono" style={{ fontSize:11, letterSpacing:".06em", color:"var(--text-2)" }}>
              <span>Less</span>
              <div className="cell level-0" style={{ width:10, height:10 }} />
              <div className="cell level-1" style={{ width:10, height:10 }} />
              <div className="cell level-2" style={{ width:10, height:10 }} />
              <div className="cell level-3" style={{ width:10, height:10 }} />
              <div className="cell level-4" style={{ width:10, height:10 }} />
              <span>More</span>
            </div>
          </div>

          <div className="card" style={{ padding:"16px 12px", overflowX:"auto" }}>
            {(() => {
              const weeks = [];
              let currentWeek: any[] = [];
              
              wallDays.forEach((d, _i) => {
                const dayOfWeek = new Date(d.date + "T12:00:00").getDay();
                currentWeek.push(d);
                if (dayOfWeek === 6) {
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
              });
              if (currentWeek.length > 0) weeks.push(currentWeek);
              
              const monthLabels: any[] = [];
              let lastMonth: any = null;
              weeks.forEach((week, wi) => {
                const firstDay = week.find(d => d);
                if (firstDay) {
                  const m = new Date(firstDay.date + "T12:00:00").toLocaleString("en-US", { month:"short" });
                  if (m !== lastMonth) {
                    monthLabels.push({ label: m, weekIndex: wi });
                    lastMonth = m;
                  }
                }
              });
              
              const gap = 2;
              const cellSize = 10;
              const numWeeks = weeks.length;
              const gridWidth = numWeeks * (cellSize + gap);
              
              return (
                <div className="wall-grid-container" style={{ minWidth: gridWidth }}>
                  <div className="wall-grid-months">
                    {monthLabels.map((m, i) => (
                      <div 
                        key={i} 
                        className="f-mono wall-grid-month" 
                        style={{ 
                          fontSize:10, 
                          color:"var(--text-1)", 
                          letterSpacing:".03em",
                          left: `${(m.weekIndex / numWeeks) * 100}%`,
                        }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  
                  <div className="wall-grid-weeks">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="wall-grid-week">
                        {[0,1,2,3,4,5,6].map(dayIndex => {
                          const d = week.find(day => new Date(day.date + "T12:00:00").getDay() === dayIndex);
                          
                          if (!d) {
                            return <div key={dayIndex} className="wall-grid-cell-empty" />;
                          }
                          
                          if (d.isOutside) {
                            return (
                              <div
                                key={dayIndex}
                                className="cell level-0 wall-grid-cell"
                                style={{ opacity:0.4 }}
                              >
                                <div className="ctip">
                                  <span className="ctip-date">{fmtFullDate(d.date)}</span>
                                  <br />
                                  <span style={{color:"var(--text-2)"}}>Outside challenge</span>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`cell wall-grid-cell ${d.isFuture ? "future" : getCellLevel(d.score)}${d.isToday ? " today" : ""}`}
                            >
                              <div className="ctip">
                                <span className="ctip-date">Day {d.day} · {fmtFullDate(d.date)}</span>
                                {d.isToday && <span style={{color:"var(--accent)", marginLeft:6}}>TODAY</span>}
                                <br />
                                {d.isFuture ? (
                                  <span style={{color:"var(--text-2)"}}>Upcoming</span>
                                ) : d.score !== null ? (
                                  <span className={d.score === 0 ? "ctip-missed" : "ctip-score"}>
                                    {d.score === 0 ? "Missed" : `${d.score}%`}
                                  </span>
                                ) : (
                                  <span style={{color:"var(--text-2)"}}>Not logged</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Stats for selected challenge */}
        <div className="stats a3 mt24">
          {[
            { n:strong,     l:"Strong Days (75%+)",  c:"c-ok"   },
            { n:missed,     l:"Missed Days",         c:"c-err"  },
            { n:daysLogged, l:"Days Logged",         c:"c-warn" },
          ].map((s,i) => (
            <div key={i} className="stat">
              <div className={`stat-n ${s.c}`}>{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Focus Sessions */}
        <div className="a4 mt24">
          <FocusSessions sessions={focusSessions} loading={focusLoading} />
        </div>
    </div>
  );
};

// ============================================================
// CHALLENGE DETAIL MODAL
// ============================================================
const ChallengeDetailModal = ({ challenge, mission, onClose, onEdit }: { challenge: Challenge; mission?: string | null; onClose: () => void; onEdit: (c: Challenge) => void }) => {
  const [editingTasks, setEditingTasks] = useState(false);
  const [tasks, setTasks] = useState((challenge.kpis || []).map(k => ({ ...k })));

  const addTask    = () => setTasks(t => [...t, { key:`task_${Date.now()}`, label:"", cat:"other" }]);
  const removeTask = (key: any) => setTasks(t => t.filter(x => x.key !== key));
  const updateTask = (key: any, val: any) => setTasks(t => t.map(x => x.key === key ? { ...x, label:val } : x));

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
                  const cat = TASK_CATEGORIES[(t.cat || "other") as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.other;
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
const Library = ({ onPick, isSecondaryMode, onClose: _onClose, hasMain }: { onPick: (tpl: any, isSecondary?: boolean, nonNegs?: any) => void; isSecondaryMode?: boolean; onClose?: () => void; hasMain?: boolean }) => {
  const [mode,   setMode]   = useState(isSecondaryMode || hasMain ? "secondary" : "main");
  const [active, setActive] = useState<string | null>(null); // selected template for detail panel
  const [selectedNonNegs, setSelectedNonNegs] = useState<string[]>([]); // non-negotiable task keys
  const [editingTasks, setEditingTasks] = useState(false);

  const selected = TEMPLATES.find(t => t.id === active);
  const isSecMode = mode === "secondary" || isSecondaryMode;

  // Reset non-negs when template changes
  const handleSelectTemplate = (id: any) => {
    if (active !== id) setSelectedNonNegs([]);
    setActive(prev => prev === id ? null : id);
  };

  const toggleNonNeg = (key: any) => {
    setSelectedNonNegs(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const DIFF_COLOUR: Record<string, string> = { "Hard":"var(--err)", "Intense":"var(--warn)", "Moderate":"var(--ok)", "You decide":"var(--text-2)" };

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
          <button
            className={`lib-mode-btn ${mode==="main"?"on":""}`}
            onClick={() => !hasMain && setMode("main")}
            style={{ opacity: hasMain ? .35 : 1, cursor: hasMain ? "not-allowed" : "pointer", position:"relative" }}
            title={hasMain ? "You already have an active main challenge. Complete or abandon it first." : ""}
          >
            Set as Main {hasMain && <span style={{ fontSize:8, letterSpacing:".08em", marginLeft:4, color:"var(--warn)" }}>LOCKED</span>}
          </button>
          <button className={`lib-mode-btn ${mode==="secondary"?"on":""}`} onClick={() => setMode("secondary")}>Add as Secondary</button>
        </div>
      )}
      {!isSecondaryMode && hasMain && mode === "main" && (
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".1em", color:"var(--warn)", marginTop:10 }}>
          ⚠ You have an active main challenge. Abandon it first to start a new one.
        </div>
      )}

      {/* Two-column layout: cards left fixed width, detail fills right */}
      <div style={{ display:"grid", gridTemplateColumns: isSecondaryMode ? "1fr" : "380px 1fr", gap:24, marginTop: isSecondaryMode ? 0 : 20, alignItems:"stretch" }}>

        {/* Cards grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {TEMPLATES.map((t,i) => {
            const isCustom = t.id === "custom";
            return (
              <div key={t.id}
                className={`tpl a${Math.min(i+1,5)} ${active===t.id?"active":""}`}
                style={isCustom ? { 
                  background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)",
                  borderStyle: "dashed",
                  borderColor: active===t.id ? "var(--accent)" : "var(--border-1)",
                } : undefined}
                onClick={() => isSecondaryMode ? onPick(t) : handleSelectTemplate(t.id)}>

                {/* Hover tooltip — only in full library */}
                {!isSecondaryMode && (
                  <div className="tpl-tooltip">
                    <div className="tpl-tooltip-diff" style={{ color: DIFF_COLOUR[t.difficulty] || "var(--accent)" }}>
                      {t.difficulty} · {t.duration} days
                    </div>
                    <div className="tpl-tooltip-text">{t.blurb}</div>
                  </div>
                )}

                <div className="tpl-tag">{t.tag} · {isCustom ? "∞" : t.duration}D</div>
                <div className="tpl-name" style={isCustom ? { display:"flex", alignItems:"center", gap:8 } : undefined}>
                  {isCustom && <span style={{ fontSize:16 }}>+</span>}
                  {t.name}
                </div>
                <div className="tpl-desc">{t.kpis.length > 0 ? `${t.kpis.length} daily tasks` : "Define your own tasks"}</div>
                {isSecondaryMode ? (
                  <div style={{ marginTop:8, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9.5, color:"var(--text-2)", lineHeight:1.55 }}>
                    {t.blurb}
                  </div>
                ) : (
                  <div style={{ marginTop:10, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8.5, letterSpacing:".14em", textTransform:"uppercase", color: active===t.id ? "var(--text-0)" : "var(--accent)", opacity:.9, display:"flex", alignItems:"center", gap:6 }}>
                    {active === t.id ? "↑ Close" : isCustom ? "→ Create yours" : "→ Learn more"}
                  </div>
                )}
              </div>
            );
          })}
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
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".22em",
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
                fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8.5, letterSpacing:".14em",
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
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20 }}>
                    <div className="lib-detail-section" style={{ margin:0 }}>Daily Tasks</div>
                    <button 
                      className="btn btn-g" 
                      style={{ fontSize:10, padding:"5px 12px", letterSpacing:".08em" }}
                      onClick={() => setEditingTasks(!editingTasks)}
                    >
                      {editingTasks ? "Done" : "Edit Tasks"}
                    </button>
                  </div>
                  
                  {/* Non-neg hint */}
                  {!editingTasks && selectedNonNegs.length > 0 && (
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:12, color:"var(--warn)", marginTop:8, marginBottom:4 }}>
                      ◆ {selectedNonNegs.length} non-negotiable{selectedNonNegs.length > 1 ? "s" : ""} selected
                    </div>
                  )}
                  {editingTasks && (
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:12, color:"var(--text-2)", marginTop:8, marginBottom:8 }}>
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
                          fontSize:15, 
                          color: isNonNeg ? "var(--warn)" : "var(--text-1)", 
                          padding:"10px 12px",
                          marginTop:4,
                          borderRadius:8,
                          background: isNonNeg ? "var(--warn)10" : "var(--bg-2)",
                          border: `1px solid ${isNonNeg ? "var(--warn)40" : "var(--border-0)"}`,
                          display:"flex", 
                          alignItems:"center",
                          gap:10,
                          cursor: editingTasks ? "pointer" : "default",
                          transition:"all 0.15s",
                        }}
                      >
                        <span style={{ color: isNonNeg ? "var(--warn)" : "var(--accent)", fontSize:10 }}>
                          {isNonNeg ? "◆" : "●"}
                        </span>
                        <span style={{ flex:1 }}>{k.label}</span>
                        {isNonNeg && (
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".1em", color:"var(--warn)" }}>
                            NON-NEG
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Second CTA at bottom */}
              <button className="btn btn-a w100"
                style={{ justifyContent:"center", marginTop:22, fontSize:15, padding:"12px 0" }}
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

// ============================================================
// SETTINGS
// ============================================================
const _Settings = ({ theme, setTheme, tone, setTone, userName, setUserName }: { theme: string; setTheme: (t: string) => void; tone: string; setTone: (t: string) => void; userName: string; setUserName: (n: string) => void }) => {
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
          <div className="srow-title">TALOS Tone</div>
          <div className="srow-desc">How TALOS Insights speaks in your daily debrief and weekly synthesis.</div>
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
const ChallengeWizard = ({ tpl, onClose, onStart, isSecondary, maxDays }: { tpl: any; onClose: () => void; onStart: (...args: any[]) => void; isSecondary?: boolean; maxDays?: number }) => {
  const [step,      setStep]      = useState(1);
  const [name,      setName]      = useState(tpl?.id === "custom" ? "" : tpl?.name || "");
  const [days,      setDays]      = useState(tpl?.duration || 30);
  const [mission,   setMission]   = useState("");
  const [tasks,     setTasks]     = useState(
    tpl?.kpis?.length > 0
      ? tpl.kpis.map((k: any,i: any) => ({ id: i, label: k.label }))
      : [{ id: 0, label: "" }]
  );
  const [nonNeg,    setNonNeg]    = useState<string[]>([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const addTask      = () => setTasks((t: any) => [...t, { id: Date.now(), label: "" }]);
  const removeTask   = (id: any) => setTasks((t: any) => t.filter((x: any) => x.id !== id));
  const updateTask   = (id: any, val: any) => setTasks((t: any) => t.map((x: any) => x.id === id ? { ...x, label: val } : x));
  const toggleNonNeg = (id: any) => setNonNeg(n => n.includes(id) ? n.filter(x => x !== id) : [...n, id]);

  const STEPS = isSecondary
    ? ["Setup", "Tasks", "Start Date", "Confirm"]
    : ["Setup", "Mission", "Tasks", "Non-Negotiables", "Start Date", "Confirm"];
  const totalSteps = STEPS.length;

  const canNext = () => {
    if (step === 1) return name.trim().length > 0 && (!maxDays || parseInt(days) <= maxDays);
    if (!isSecondary && step === 2) return mission.trim().length > 0;
    const taskStep = isSecondary ? 2 : 3;
    if (step === taskStep) return tasks.some((t: any) => t.label.trim().length > 0);
    return true;
  };

  const validTasks = tasks.filter((t: any) => t.label.trim());

  const handleStart = () => {
    onStart({ name, days, mission, nonNeg, tasks: validTasks, isSecondary, startDate });
  };

  // Map logical step to STEPS label
  const _stepLabel = STEPS[step - 1];

  // Which step index is "Start Date"
  const startDateStep = STEPS.indexOf("Start Date") + 1;

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
              {tasks.map((t: any, i: any) => (
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
              {validTasks.map((t: any) => {
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

        {/* START DATE step */}
        {step === startDateStep && (
          <div className="flex col g16">
            <div>
              <div className="modal-title" style={{ fontSize:26 }}>When do you start?</div>
              <div className="modal-desc">Set your start date. Useful if you're planning ahead or it's late in the day.</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:8 }}>
              {/* Today / Tomorrow quick picks */}
              {[
                { label:"Today",    value: new Date().toISOString().split("T")[0] },
                { label:"Tomorrow", value: (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; })() },
              ].map(opt => (
                <div key={opt.label} onClick={() => setStartDate(opt.value)}
                  style={{
                    display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                    background: startDate === opt.value ? "var(--accent-lo)" : "var(--bg-2)",
                    border:`1px solid ${startDate === opt.value ? "var(--accent)" : "var(--border-1)"}`,
                    borderRadius:10, cursor:"pointer", transition:"all .15s",
                  }}>
                  <div style={{
                    width:18, height:18, borderRadius:"50%", flexShrink:0,
                    border:`2px solid ${startDate === opt.value ? "var(--accent)" : "var(--border-1)"}`,
                    background: startDate === opt.value ? "var(--accent)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {startDate === opt.value && <div style={{width:6,height:6,borderRadius:"50%",background:"#080807"}} />}
                  </div>
                  <div>
                    <div style={{fontSize:14, fontWeight:500, color:"var(--text-0)"}}>{opt.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, color:"var(--text-2)", marginTop:2}}>{opt.value}</div>
                  </div>
                </div>
              ))}
              {/* Custom date picker */}
              <div style={{ marginTop:4 }}>
                <div className="field-l">Or pick a custom date</div>
                <input type="date" className="field"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setStartDate(e.target.value)}
                  style={{width:"100%", cursor:"pointer"}}
                />
              </div>
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
              {[
                { l:"Challenge", v: name },
                { l:"Duration",  v: `${days} days` },
                { l:"Start Date", v: startDate === new Date().toISOString().split("T")[0] ? `${startDate} (Today)` : startDate },
              ].map(r => (
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
                {validTasks.map((t: any) => (
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
const Partners = ({ user, profile, challenges, sb }: { user: User | null | undefined; profile: any; challenges: ChallengesState; sb: Sb }) => {
  const [partners,        setPartners]     = useState<any[]>([]);
  const [activePartner,   setActivePartner]= useState<any>(null);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [copied,          setCopied]       = useState(false);
  const [joinCode,        setJoinCode]     = useState("");
  const [joinError,       setJoinError]    = useState("");
  const [joinLoading,     setJoinLoading]  = useState(false);
  const [showAdd,         setShowAdd]      = useState(false);
  const [activeTab,       setActiveTab]    = useState("overview");
  const [showProto,       setShowProto]    = useState(false);
  const [selectedProto,   setSelectedProto]= useState("spotter");
  const [showFlare,       setShowFlare]    = useState(false);
  const [flareUsedMap,    setFlareUsedMap] = useState<Record<string, any>>({});
  const [rxnSent,         setRxnSent]      = useState<Record<string, any>>({});
  const [noteText,        setNoteText]     = useState("");
  const [postedNote,      setPostedNote]   = useState<any>(null); // { text, timestamp }
  const [editingNote,     setEditingNote]  = useState(false);
  const [showModeSwitch,  setShowModeSwitch] = useState(false);
  const [switchCode,      setSwitchCode]   = useState("");
  const [switchError,     setSwitchError]  = useState("");
  const [autoRefresh,     setAutoRefresh]  = useState(false);
  const [lastRefresh,     setLastRefresh]  = useState<any>(null);
  const [showTutorial,    setShowTutorial] = useState(false);
  const [tutorialStep,    setTutorialStep] = useState(0);
  const cdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cdStr,           setCdStr]        = useState("--:--:--");
  const [cdUrgent,        setCdUrgent]     = useState(false);

  const myCode = profile?.invite_code || "";

  // Helpers
  const avatarColor = (name: any) => {
    const colors = ["#D4922A","#5DBF8A","#4A8FD4","#8B5CF6","#BF5D5D","#0DBEAA","#E07B4A","#D4B22A"];
    return name ? colors[name.charCodeAt(0) % colors.length] : colors[0];
  };
  const initials = (name: any) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0]+parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        loadPartners();
        setLastRefresh(new Date());
      }, 30000); // 30 seconds
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh]);

  // Countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date(), mid = new Date(now);
      mid.setHours(24,0,0,0);
      const d = mid.getTime() - now.getTime();
      const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
      setCdStr(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      setCdUrgent(h < 3);
    };
    tick();
    cdIntervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(cdIntervalRef.current as any);
  }, []);

  // Load partners
  const loadPartners = async () => {
    if (!sb || !user) return;
    try {
      const { data: asUser    } = await sb.from("partnerships").select("*").eq("user_id",    user.id).eq("status","active");
      const { data: asPartner } = await sb.from("partnerships").select("*").eq("partner_id", user.id).eq("status","active");
      const rows = [...(asUser||[]), ...(asPartner||[])];
      if (!rows.length) { setPartners([]); setPartnersLoading(false); return; }
      const otherIds = [...new Set(rows.map(r => r.user_id === user.id ? r.partner_id : r.user_id))];
      const { data: profileRows } = await sb.from("profiles").select("id,full_name,invite_code").in("id", otherIds);
      const profileMap = Object.fromEntries((profileRows||[]).map(p => [p.id, p]));
      const { data: chalRows } = await sb.from("challenges").select("id,user_id,name,tag,day_num,total_days,streak,consistency,archived").in("user_id", otherIds).eq("is_main",true).eq("archived",false);
      const chalMap = Object.fromEntries((chalRows||[]).map(c => [c.user_id, c]));
      
      // Build last 30 days date array
      const last30Dates: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Dates.push(d.toISOString().split("T")[0]);
      }
      
      // Get my main challenge ID
      const myMainChallengeId = challenges?.main?.id;
      
      // Fetch MY checkins for last 30 days
      let myCheckinsMap: Record<string, any> = {};
      if (myMainChallengeId) {
        const { data: myCheckins } = await sb
          .from("checkins")
          .select("date,score")
          .eq("challenge_id", myMainChallengeId)
          .in("date", last30Dates);
        (myCheckins || []).forEach(c => { myCheckinsMap[c.date] = c.score; });
      }
      
      // Fetch ALL partner checkins for last 30 days (for all partner challenges)
      const partnerChallengeIds = (chalRows || []).map(c => c.id);
      let partnerCheckinsMap: Record<string, any> = {}; // { visibleId: { date: score } }
      if (partnerChallengeIds.length > 0) {
        const { data: partnerCheckins } = await sb
          .from("checkins")
          .select("challenge_id,date,score")
          .in("challenge_id", partnerChallengeIds)
          .in("date", last30Dates);
        (partnerCheckins || []).forEach(c => {
          if (!partnerCheckinsMap[c.challenge_id]) partnerCheckinsMap[c.challenge_id] = {};
          partnerCheckinsMap[c.challenge_id][c.date] = c.score;
        });
      }
      
      // Load today's checkins for status
      const today = new Date().toISOString().split("T")[0];
      
      const all = rows.map(r => {
        const otherId = r.user_id === user.id ? r.partner_id : r.user_id;
        const ch = chalMap[otherId] || null;
        const partnerChalId = ch?.id;
        
        // Today's status
        const theirTodayScore = partnerChalId ? (partnerCheckinsMap[partnerChalId]?.[today] ?? null) : null;
        const status = theirTodayScore === null ? "cold" : theirTodayScore >= 75 ? "gold" : theirTodayScore > 0 ? "ember" : "cold";
        
        // Build sync history for last 30 days
        const syncHistory = last30Dates.map(date => {
          const myScore = myCheckinsMap[date] ?? null;
          const theirScore = partnerChalId ? (partnerCheckinsMap[partnerChalId]?.[date] ?? null) : null;
          
          // Both hit target (75%+)
          if (myScore !== null && myScore >= 75 && theirScore !== null && theirScore >= 75) return "gold";
          
          // Both executed (>0)
          if (myScore !== null && myScore > 0 && theirScore !== null && theirScore > 0) return "ember";
          
          // Only one executed
          if ((myScore !== null && myScore > 0) !== (theirScore !== null && theirScore > 0)) return "desync";
          
          // Neither executed
          return "miss";
        });
        
        // Calculate actual sync rate from history
        const syncDays = syncHistory.filter(s => s === "gold" || s === "ember").length;
        const actualSyncRate = Math.round((syncDays / 30) * 100);
        
        return {
          ...r,
          partnerProfile: profileMap[otherId] || { id: otherId, full_name: "Partner" },
          challenge: ch,
          status,
          protocol: r.protocol || "spotter",
          syncRate: actualSyncRate,
          syncHistory,
        };
      });
      setPartners(all);
      setPartnersLoading(false);
    } catch(e) { console.warn("loadPartners:", e); setPartnersLoading(false); }
  };

  useEffect(() => { loadPartners(); }, [user, profile]);

  // Join partner
  const joinPartner = async () => {
    setJoinError(""); setJoinLoading(true);
    try {
      if (!joinCode.trim()) throw new Error("Enter an invite code.");
      if (joinCode.trim().toUpperCase() === myCode) throw new Error("That's your own code.");
      const { data: tp, error: pErr } = await sb!.from("profiles").select("id,full_name").eq("invite_code", joinCode.trim().toUpperCase()).maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!tp) throw new Error("No user found with that code.");
      const { data: ex } = await sb!.from("partnerships").select("id,status").or(`and(user_id.eq.${user?.id},partner_id.eq.${tp.id}),and(user_id.eq.${tp.id},partner_id.eq.${user?.id})`).maybeSingle();
      if (ex) throw new Error(ex.status === "active" ? "Already partners." : "Request already sent.");
      const { error: iErr } = await sb!.from("partnerships").insert({ user_id:user?.id, partner_id:tp.id, invite_code:`${user?.id.slice(0,8)}${tp.id.slice(0,8)}`.toUpperCase(), status:"active", protocol:selectedProto });
      if (iErr) throw new Error(iErr.message);
      const shouldShowTutorial = !profile?.partner_tutorial_seen;
      setJoinCode(""); setShowAdd(false); setShowProto(false);
      await loadPartners();
      // Show tutorial if user hasn't seen it
      if (shouldShowTutorial) {
        setTutorialStep(0);
        setShowTutorial(true);
      }
    } catch(e: any) { setJoinError(e.message); }
    finally { setJoinLoading(false); }
  };

  const removePartner = async (id: any) => {
    if (!window.confirm("Remove this partner?")) return;
    await sb?.from("partnerships").delete().eq("id", id);
    setActivePartner(null); await loadPartners();
  };

  const copyCode = () => { navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  // My challenge data
  const myChallenge = challenges?.main;
  const _myStatus = "gold"; // placeholder — real impl reads kpis from parent

  // Get partner status dot color
  const statusColor = (s: any) => s==="gold" ? "#F5C842" : s==="ember" ? "var(--accent)" : "#2E2C28";
  const statusLabel = (s: any) => s==="gold" ? "Target Met" : s==="ember" ? "Baseline Met" : "Awaiting Execution";
  const statusSince = (s: any) => s==="gold" ? "Logged 45m ago" : s==="ember" ? "Logged 2h ago" : "Not logged yet today";
  const statusBorder = (s: any) => s==="gold" ? "#F5C84230" : s==="ember" ? "var(--border-accent)" : "var(--border-0)";
  const statusBg = (s: any) => s==="gold" ? "#F5C84210" : s==="ember" ? "var(--accent-lo)" : "var(--bg-2)";

  const ap = activePartner;
  const pName = ap?.partnerProfile?.full_name || "Partner";
  const pInitials = initials(pName);
  const pColor = avatarColor(pName);
  const pChal = ap?.challenge;
  const pStatus = ap?.status || "cold";
  const isSpotter = ap?.protocol === "spotter";
  const canFlare = isSpotter && pStatus === "cold" && !flareUsedMap[ap?.id];
  // Flare window: 8pm–11pm
  const h = new Date().getHours();
  const inFlareWindow = h >= 20 && h < 23;
  const flareArmed = canFlare && inFlareWindow;

  const syncT = Math.round((ap?.syncRate || 0) * 0.57 / 10);
  const syncB = Math.round((ap?.syncRate || 0) * 0.14 / 10);
  const syncD = Math.max(0, 14 - syncT - syncB);
  const syncTotal = syncT + syncB + syncD;
  const tPct = syncTotal > 0 ? Math.round((syncT/syncTotal)*100) : 0;
  const bPct = syncTotal > 0 ? Math.round((syncB/syncTotal)*100) : 0;

  if (partnersLoading) return (
    <div className="page partners-page" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-3)"}}>Loading…</div>
    </div>
  );

  if (!partners.length && !showAdd) return (
    <div className="page partners-page" style={{display:"flex",flexDirection:"column"}}>
      <div className="ow-no-partners">
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--accent)",marginBottom:10}}>Spotter Protocol</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:".04em",marginBottom:8}}>Find Your Spotter.</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--text-2)",lineHeight:1.65,textAlign:"center",maxWidth:340,marginBottom:32}}>
          Share your invite code. Choose your protocol. Hold each other accountable.
        </div>
        <div className="ow-invite-box">
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>Your invite code</div>
          <div className="ow-invite-code">{myCode||"Loading…"}</div>
          <button className="btn btn-g" style={{marginTop:10,width:"100%",justifyContent:"center"}} onClick={copyCode}>{copied?"✓ Copied":"Copy Code"}</button>
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".22em",textTransform:"uppercase",color:"var(--text-3)",marginBottom:14}}>— or enter their code —</div>
        <div style={{display:"flex",gap:8,width:"100%",maxWidth:360}}>
          <input className="field" style={{textTransform:"uppercase",letterSpacing:".12em",textAlign:"center"}}
            value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code…" maxLength={8} onKeyDown={e=>e.key==="Enter"&&setShowProto(true)} />
          <button className="btn btn-a" onClick={()=>setShowProto(true)} disabled={!joinCode.trim()}>Connect →</button>
        </div>
        {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,marginTop:10}}>{joinError}</div>}
      </div>
      {showProto && renderProtoOverlay()}
    </div>
  );

  // Build history grid cells - now uses real data from ap.syncHistory
  const hColors: Record<string, string> = { gold:"#F5C842", ember:"var(--accent)", desync:"#D4922A22", miss:"var(--bg-3)" };
  const hOpacity: Record<string, number> = { gold:.9, ember:.75, desync:1, miss:1 };

  function renderProtoOverlay() {
    return (
      <div className="proto-overlay" onClick={()=>{setShowProto(false);}}>
        <div className="proto-inner" onClick={e=>e.stopPropagation()}>
          <div className="proto-tag">New Partnership</div>
          <div className="proto-title">Choose Your Protocol</div>
          <div className="proto-sub">How do you want to hold each other accountable? Both partners see this choice.</div>
          <div className="proto-rec">Recommended: Spotter Mode — execution-heavy challenge detected</div>
          <div className="proto-opts">
            <div className={`proto-opt ${selectedProto==="spotter"?"sel":""}`} onClick={()=>setSelectedProto("spotter")}>
              <div className="proto-opt-head">
                <span style={{fontSize:14}}>◆</span>
                <span className="proto-opt-name" style={{color:"var(--accent)"}}>Spotter Mode</span>
              </div>
              <div className="proto-opt-desc">Binary status visible. Flare available 8–11PM if partner hasn't logged. Pressure is the mechanism.</div>
            </div>
            <div className={`proto-opt ally-sel ${selectedProto==="ally"?"sel":""}`} onClick={()=>setSelectedProto("ally")}>
              <div className="proto-opt-head">
                <span style={{fontSize:14}}>◈</span>
                <span className="proto-opt-name" style={{color:"#4A8FD4"}}>Ally Mode</span>
              </div>
              <div className="proto-opt-desc">Daily 140-char check-in note. Reactions only. No public status pressure. Warmth is the mechanism.</div>
            </div>
          </div>
          <button className="proto-confirm" 
          onClick={joinCode.trim() ? joinPartner : () => setJoinError("Enter an invite code first.")} 
          disabled={joinLoading}>
          </button>
          {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,marginTop:10,textAlign:"center"}}>{joinError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="page partners-page" style={{display:"flex",flexDirection:"column"}}>
      <div className={`ow-layout${ap ? " detail-open" : ""}`} style={{flex:1,overflow:"hidden"}}>

        {/* ── OVERWATCH SIDEBAR ── */}
        <div className="ow-sidebar">

          {/* Head */}
          <div className="ow-head">
            <div className="ow-tag">Spotter Protocol</div>
            <div className="ow-title">
              Overwatch
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button 
                  className={`partners-refresh-btn ${autoRefresh ? "auto-on" : ""}`}
                  onClick={() => { loadPartners(); setLastRefresh(new Date()); }}
                  title="Refresh partners"
                >
                  ↻
                </button>
                <button
                  className={`partners-refresh-btn ${autoRefresh ? "auto-on" : ""}`}
                  onClick={() => setAutoRefresh(v => !v)}
                  title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh (30s)"}
                  style={{fontSize:10}}
                >
                  {autoRefresh ? "AUTO ●" : "AUTO"}
                </button>
                <div className="ow-add" onClick={()=>{setShowAdd(v=>!v); setJoinError("");}} title="Add partner">+</div>
              </div>
            </div>
            {lastRefresh && (
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-1)",marginTop:4,letterSpacing:".06em"}}>
                Last updated: {lastRefresh.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
              </div>
            )}
            {showAdd && (
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                {/* Your code — shown first */}
                <div style={{background:"var(--bg-0)",border:"1px solid var(--border-accent)",borderRadius:7,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".24em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:4}}>Your Code</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".22em",color:"var(--accent)",lineHeight:1}}>{myCode||"…"}</div>
                  <button className="btn btn-g" style={{width:"100%",justifyContent:"center",marginTop:8,fontSize:10,padding:"5px 0"}} onClick={copyCode}>
                    {copied?"✓ Copied":"Copy Code"}
                  </button>
                </div>
                {/* Divider */}
                <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".2em",textTransform:"uppercase",color:"var(--text-3)",textAlign:"center"}}>— or enter theirs —</div>
                <input className="field" style={{textTransform:"uppercase",letterSpacing:".1em",textAlign:"center",fontSize:11}}
                  value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Their invite code…" maxLength={8} onKeyDown={e=>e.key==="Enter"&&joinCode.trim()&&setShowProto(true)} />
                <button className="btn btn-a" style={{width:"100%",justifyContent:"center"}}
                  onClick={()=>joinCode.trim()&&setShowProto(true)} disabled={!joinCode.trim()}>Connect →</button>
                {joinError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,marginTop:2}}>{joinError}</div>}
              </div>
            )}
          </div>

          {/* You card */}
          <div className="you-card">
            <div className="you-card-top">
              <div className="you-ring" style={{background:"#F5C84222",border:"2px solid #F5C842",color:"#F5C842"}}>
                {initials(profile?.full_name || "Me")}
              </div>
              <div className="you-info">
                <div className="you-label">You · Today</div>
                <div className="you-name">{(profile?.full_name||"You").split(" ")[0]}</div>
                <div className="you-challenge">{myChallenge ? `${myChallenge.name} · Day ${myChallenge.dayNum}/${myChallenge.totalDays}` : "No active challenge"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:".06em",color:"#F5C842"}}>★ TARGET</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,color:"var(--text-2)",marginTop:1,letterSpacing:".08em"}}>MET</div>
              </div>
            </div>
            {myChallenge && (
              <div className="you-stats">
                <div><div className="you-stat-n" style={{color:"var(--accent)"}}>{myChallenge.streak}</div><div className="you-stat-l">Streak</div></div>
                <div><div className="you-stat-n" style={{color:"var(--ok)"}}>{myChallenge.consistency}%</div><div className="you-stat-l">Consist.</div></div>
                <div><div className="you-stat-n" style={{color:"var(--text-1)"}}>{myChallenge.totalDays - myChallenge.dayNum}</div><div className="you-stat-l">Days Left</div></div>
              </div>
            )}
            {myChallenge && (
              <div className="you-bar">
                <div className="you-bar-fill" style={{width:`${Math.round((myChallenge.dayNum/myChallenge.totalDays)*100)}%`}} />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="ow-legend">
            <div className="ow-leg"><div className="ow-leg-dot s-dot cold" style={{width:6,height:6}}></div>Awaiting</div>
            <div className="ow-leg"><div className="ow-leg-dot" style={{width:6,height:6,borderRadius:"50%",background:"var(--accent)",boxShadow:"0 0 5px var(--accent)"}}></div>Baseline</div>
            <div className="ow-leg"><div className="ow-leg-dot" style={{width:6,height:6,borderRadius:"50%",background:"#F5C842",boxShadow:"0 0 5px #F5C842"}}></div>Target</div>
          </div>

          {/* Partner list */}
          <div className="ow-list">
            {partners.map(p => {
              const pn = p.partnerProfile?.full_name || "Partner";
              return (
                <div key={p.id} className={`ow-row ${ap?.id===p.id?"active":""}`} onClick={()=>{setActivePartner(p);setActiveTab("overview");}}>
                  <div className={`s-dot ${p.status}`} />
                  <div className="ow-row-info">
                    <div className="ow-row-name">{pn.split(" ")[0]}</div>
                    <div className="ow-row-sub">{p.challenge ? `${p.challenge.name} · Day ${p.challenge.day_num}/${p.challenge.total_days}` : "No challenge"}</div>
                  </div>
                  <div className="ow-row-right">
                    <div className="ow-streak" style={{color: p.status==="gold"?"#F5C842":p.status==="ember"?"var(--accent)":"var(--text-2)"}}>{p.challenge?.streak||0}</div>
                    <div className={`proto-badge ${p.protocol}`}>{p.protocol==="spotter"?"◆ Spotter":"◈ Ally"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DETAIL PANEL ── */}
        <div className="ow-detail">
          {!ap ? (
            <div className="ow-empty">
              <div className="ow-empty-icon">◆</div>
              <div className="ow-empty-text">Select a partner</div>
            </div>
          ) : (
            <>
              {/* Back button — mobile only */}
              <button className="ow-detail-back" onClick={()=>setActivePartner(null)}>
                ← Overwatch
              </button>
              {/* Header */}
              <div className="ow-detail-head">
                <div className="ow-detail-head-bg" style={{background:`radial-gradient(ellipse 70% 100% at 90% 50%, ${pColor}0C, transparent 60%)`}} />
                <div className="ow-detail-top">
                  <div className="ow-avatar" style={{background:`${pColor}18`,color:pColor,border:`1px solid ${pColor}44`}}>{pInitials}</div>
                  <div>
                    <div className="ow-detail-name">{pName.split(" ")[0]}</div>
                    <div className="ow-detail-challenge">{pChal ? `${pChal.name} · Day ${pChal.day_num} of ${pChal.total_days}` : "No active challenge"}</div>
                    <div className={`ow-proto-pill ${ap.protocol}`}>{ap.protocol==="spotter"?"◆ Spotter Mode":"◈ Ally Mode"}</div>
                  </div>
                  <button onClick={()=>removePartner(ap.id)} className="btn btn-g" style={{marginLeft:"auto",fontSize:10,padding:"4px 10px",borderColor:"var(--err)30",color:"var(--text-2)"}}>Remove</button>
                </div>
                <div className="ow-status-banner" style={{background:statusBg(pStatus),borderColor:statusBorder(pStatus)}}>
                  <div className="ow-sb-dot" style={{background:statusColor(pStatus),boxShadow:pStatus!=="cold"?`0 0 8px ${statusColor(pStatus)}`:"none"}} />
                  <div className="ow-sb-label" style={{color:pStatus==="gold"?"#F5C842":pStatus==="ember"?"var(--accent)":"var(--text-1)"}}>{statusLabel(pStatus)}</div>
                  <div className="ow-sb-since">{statusSince(pStatus)}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="ow-tabs">
                <button className={`ow-tab ${activeTab==="overview"?"on":""}`} onClick={()=>setActiveTab("overview")}>Overview</button>
                <button className={`ow-tab ${activeTab==="history"?"on":""}`} onClick={()=>setActiveTab("history")}>History</button>
              </div>

              {/* OVERVIEW */}
              {activeTab==="overview" && (
                <>
                <div className="ow-body">
                  {/* Stats */}
                  <div className="ow-stats">
                    <div className="ow-stat">
                      <div className="ow-stat-n" style={{color:"var(--accent)"}}>{pChal?.streak||0}</div>
                      <div className="ow-stat-l">Day Streak</div>
                    </div>
                    <div className="ow-stat">
                      <div className="ow-stat-n" style={{color:(pChal?.consistency||0)>=80?"var(--ok)":(pChal?.consistency||0)>=60?"var(--accent)":"var(--err)"}}>
                        {pChal?.consistency||0}%
                      </div>
                      <div className="ow-stat-l">Consistency</div>
                    </div>
                    <div className="ow-stat">
                      <div className="ow-stat-n" style={{color:"var(--text-1)"}}>{pChal ? pChal.total_days - pChal.day_num : 0}</div>
                      <div className="ow-stat-l">Days Left</div>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="ow-countdown">
                    <div>
                      <div className="ow-cd-label">Until Tether Breaks</div>
                      <div className={`ow-cd-time${cdUrgent?" urgent":""}`}>{cdStr}</div>
                    </div>
                    <div className="ow-cd-info">
                      <div className="ow-cd-sub">Log before midnight or the streak ends.</div>
                    </div>
                  </div>

                  {/* Sync */}
                  <div className="ow-sync">
                    <div className="ow-sync-top">
                      <div className="ow-sync-title">Execution Sync · Last 14 Days</div>
                      <div className="ow-sync-pct" style={{color:(ap?.syncRate||0)>=80?"var(--ok)":(ap?.syncRate||0)>=60?"var(--accent)":"var(--err)"}}>{ap?.syncRate||0}%</div>
                    </div>
                    <div className="ow-sync-bar">
                      <div className="ow-sync-bar-t" style={{width:`${tPct}%`}} />
                      <div className="ow-sync-bar-b" style={{width:`${bPct}%`}} />
                    </div>
                    <div className="ow-sync-legs">
                      <div className="ow-sync-leg"><div className="ow-sync-dot" style={{background:"#F5C842"}}></div>Both target ({syncT}d)</div>
                      <div className="ow-sync-leg"><div className="ow-sync-dot" style={{background:"var(--accent)"}}></div>Baseline ({syncB}d)</div>
                      <div className="ow-sync-leg"><div className="ow-sync-dot" style={{background:"#2E2C28"}}></div>Desync ({syncD}d)</div>
                    </div>
                  </div>

                  {/* Ally extras */}
                  {!isSpotter && (
                    <>
                      <div className="ow-ally-note">
                        <div className="ow-ally-note-head">
                          <div className="ow-ally-note-label">◈ {pName.split(" ")[0]}'s Note</div>
                          <div className="ow-ally-note-timer">Expires in 14h</div>
                        </div>
                        <div className="ow-ally-note-text">"Rough day but got it done."</div>
                        <div className="ow-rxns">
                          {["🔥","💪","◆"].map(e => (
                            <div key={e} className={`ow-rxn ${rxnSent[ap.id]===e?"sent":""}`}
                              onClick={()=>setRxnSent(r=>({...r,[ap.id]:e}))}>{e}</div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Your posted note or input */}
                      <div className="ow-your-note">
                        <div className="ow-your-note-label">Your Note · Today</div>
                        {postedNote && !editingNote ? (
                          <div style={{background:"var(--accent-lo)",border:"1px solid var(--border-accent)",borderRadius:8,padding:"12px 14px"}}>
                            <div style={{fontSize:14,color:"var(--text-0)",fontStyle:"italic",marginBottom:8}}>"{postedNote.text}"</div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)"}}>{postedNote.timestamp}</div>
                              <button className="btn btn-g" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setEditingNote(true);setNoteText(postedNote.text);}}>Edit</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <textarea className="ow-note-input" rows={2} maxLength={140}
                              value={noteText} onChange={e=>setNoteText(e.target.value)}
                              placeholder="Optional · 140 chars · gone after 24hrs" />
                            <div className="ow-note-footer">
                              <div className="ow-note-count">{noteText.length} / 140</div>
                              <div style={{display:"flex",gap:6}}>
                                {editingNote && <button className="btn btn-g" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setEditingNote(false);setNoteText("");}}>Cancel</button>}
                                <button className="ow-note-send" onClick={()=>{
                                  if(noteText.trim()) {
                                    setPostedNote({text:noteText.trim(),timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});
                                    setNoteText("");
                                    setEditingNote(false);
                                  }
                                }}>{editingNote ? "Update →" : "Post →"}</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Mode Switch Button */}
                  <div style={{background:"var(--bg-2)",border:"1px solid var(--border-0)",borderRadius:8,padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:12,letterSpacing:".14em",textTransform:"uppercase",color:"var(--text-1)"}}>Current Mode</div>
                      <div className={`proto-badge ${ap.protocol}`} style={{fontSize:10,padding:"3px 10px"}}>{ap.protocol==="spotter"?"◆ Spotter":"◈ Ally"}</div>
                    </div>
                    <div style={{fontSize:13,color:"var(--text-2)",marginBottom:12,lineHeight:1.5}}>
                      {isSpotter ? "Spotter mode: Minimal communication, flare system for accountability." : "Ally mode: Daily notes, reactions, deeper connection."}
                    </div>
                    <button className="btn btn-g" style={{width:"100%",justifyContent:"center",fontSize:12}} onClick={()=>setShowModeSwitch(true)}>
                      Switch to {isSpotter ? "Ally" : "Spotter"} Mode →
                    </button>
                  </div>
                </div>

                {/* Action */}
                <div className="ow-action">
                  {isSpotter ? (
                    <>
                      <button className={`flare-btn ${flareArmed?"armed":"off"}`}
                        disabled={!flareArmed}
                        onClick={()=>{ setFlareUsedMap(m=>({...m,[ap.id]:true})); setShowFlare(true); }}>
                        ⚡ DEPLOY FLARE
                      </button>
                      <div className={`flare-meta${flareArmed?" hot":""}`}>
                        {flareArmed
                          ? "Flare window active · Partner has not executed"
                          : flareUsedMap[ap.id]
                          ? "Flare deployed today — one per day"
                          : pStatus !== "cold"
                          ? "Partner is executing — no flare needed"
                          : "Flare window: 8:00 PM – 11:00 PM only"}
                      </div>
                    </>
                  ) : (
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".14em",textTransform:"uppercase",color:"#4A8FD4",textAlign:"center",padding:"4px 0"}}>
                      ◈ Ally Mode · Use the note above to check in
                    </div>
                  )}
                </div>
                </>
              )}

              {/* HISTORY */}
              {activeTab==="history" && (
                <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:8,letterSpacing:".22em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:12}}>
                    Shared Execution — Last 30 Days
                  </div>
                  <div className="ow-h-grid">
                    {(ap.syncHistory || []).map((c: any,i: any)=>{
                      // Calculate date for this cell (30 days ago + i)
                      const cellDate = new Date();
                      cellDate.setDate(cellDate.getDate() - 29 + i);
                      const dateStr = cellDate.toLocaleDateString("en-US", { month:"short", day:"numeric" });
                      const statusLabel = c === "gold" ? "Both hit target" : c === "ember" ? "Both executed" : c === "desync" ? "Only one executed" : "Neither executed";
                      return (
                        <div 
                          key={i} 
                          className="ow-h-cell" 
                          style={{background:hColors[c],opacity:hOpacity[c],position:"relative",cursor:"pointer"}} 
                          title={`${dateStr}: ${statusLabel}`}
                        />
                      );
                    })}
                  </div>
                  {(!ap.syncHistory || ap.syncHistory.length === 0) && (
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--text-2)",textAlign:"center",padding:"20px 0"}}>
                      No shared history yet
                    </div>
                  )}
                  <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      {color:"#F5C842",op:.9,label:"Both hit target (75%+)"},
                      {color:"var(--accent)",op:.75,label:"Both executed (>0%)"},
                      {color:"#D4922A22",op:1,label:"Only one executed"},
                      {color:"var(--bg-3)",op:1,label:"Neither executed"},
                    ].map(l=>(
                      <div key={l.label} style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,color:"var(--text-1)"}}>
                        <div style={{width:16,height:16,borderRadius:3,background:l.color,opacity:l.op,flexShrink:0}}></div>
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Protocol overlay */}
      {showProto && renderProtoOverlay()}

      {/* Flare overlay */}
      {showFlare && (
        <div className="flare-overlay" onClick={()=>setShowFlare(false)}>
          <div className="flare-overlay-inner" onClick={e=>e.stopPropagation()}>
            <span className="flare-icon">⚡</span>
            <div className="flare-title">Flare Deployed</div>
            <div className="flare-msg">SMS app opening with pre-filled message.<br/>The rest is on them.</div>
            <div className="flare-sms">"System shows non-compliance. 3 hours until tether breaks. Execute your Baseline."</div>
            <button className="flare-dismiss" onClick={()=>setShowFlare(false)}>Acknowledged →</button>
          </div>
        </div>
      )}

      {/* Mode Switch Modal */}
      {showModeSwitch && ap && (
        <div className="overlay" onClick={()=>{setShowModeSwitch(false);setSwitchCode("");setSwitchError("");}}>
          <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div className="modal-tag">Protocol Change</div>
            <div className="modal-title">Switch to {isSpotter ? "Ally" : "Spotter"} Mode</div>
            <div className="modal-desc">
              {isSpotter 
                ? "Ally mode enables daily notes, reactions, and deeper accountability connection." 
                : "Spotter mode uses minimal communication with the flare system for urgent accountability."}
            </div>
            
            <div style={{background:"var(--bg-2)",border:"1px solid var(--border-0)",borderRadius:8,padding:"16px",marginBottom:20}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,letterSpacing:".14em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>
                Enter {pName.split(" ")[0]}'s Invite Code to Confirm
              </div>
              <input 
                className="field" 
                style={{textTransform:"uppercase",letterSpacing:".12em",textAlign:"center",fontSize:18,fontFamily:"'Bebas Neue',sans-serif"}}
                value={switchCode} 
                onChange={e=>setSwitchCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX" 
                maxLength={8} 
              />
              {switchError && <div style={{color:"var(--err)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,marginTop:8}}>{switchError}</div>}
            </div>
            
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-g" style={{flex:1}} onClick={()=>{setShowModeSwitch(false);setSwitchCode("");setSwitchError("");}}>
                Cancel
              </button>
              <button 
                className="btn btn-a" 
                style={{flex:1}}
                disabled={switchCode.length < 6}
                onClick={async () => {
                  // Verify the code matches partner's invite code
                  const partnerCode = ap.partnerProfile?.invite_code;
                  if (!partnerCode) {
                    setSwitchError("Could not verify partner code.");
                    return;
                  }
                  if (switchCode.toUpperCase() !== partnerCode.toUpperCase()) {
                    setSwitchError("Incorrect code. Ask your partner for their invite code.");
                    return;
                  }
                  // Update protocol in DB
                  const newProto = isSpotter ? "ally" : "spotter";
                  try {
                    await sb?.from("partnerships").update({ protocol: newProto }).eq("id", ap.id);
                    await loadPartners();
                    setShowModeSwitch(false);
                    setSwitchCode("");
                    setSwitchError("");
                  } catch(e) {
                    setSwitchError("Failed to update. Try again.");
                  }
                }}
              >
                Confirm Switch →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Tutorial Modal */}
      {showTutorial && (
        <div className="overlay" onClick={() => setShowTutorial(false)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-tag">Partner Guide</div>
            
            {tutorialStep === 0 && (
              <>
                <div className="modal-title" style={{ fontSize:26 }}>Welcome to Partners</div>
                <div className="modal-desc">You've connected with your first accountability partner. Here's how the system works.</div>
                <div style={{ display:"flex", flexDirection:"column", gap:16, margin:"20px 0" }}>
                  <div style={{ background:"var(--bg-2)", border:"1px solid var(--border-0)", borderRadius:10, padding:"16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>⚡</span>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".06em" }}>Deploy Flare</span>
                    </div>
                    <div style={{ fontSize:13, color:"var(--text-1)", lineHeight:1.6 }}>
                      In <strong>Spotter Mode</strong>, if your partner hasn't logged by 8PM, you can deploy a flare — an SMS nudge reminding them to execute. Use it sparingly. It's the nuclear option.
                    </div>
                  </div>
                  <div style={{ background:"var(--bg-2)", border:"1px solid var(--border-0)", borderRadius:10, padding:"16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>◈</span>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".06em" }}>Daily Notes</span>
                    </div>
                    <div style={{ fontSize:13, color:"var(--text-1)", lineHeight:1.6 }}>
                      In <strong>Ally Mode</strong>, you and your partner share short daily notes (140 chars). A quick check-in about how the day went. React with 🔥 💪 or ◆ to acknowledge.
                    </div>
                  </div>
                  <div style={{ background:"var(--bg-2)", border:"1px solid var(--border-0)", borderRadius:10, padding:"16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>◆</span>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".06em" }}>Overwatch</span>
                    </div>
                    <div style={{ fontSize:13, color:"var(--text-1)", lineHeight:1.6 }}>
                      See your partner's execution status in real-time. Track sync rate — how often you both hit your targets together. The History tab shows your shared 30-day execution grid.
                    </div>
                  </div>
                </div>
              </>
            )}

            {tutorialStep === 1 && (
              <>
                <div className="modal-title" style={{ fontSize:26 }}>Modes Explained</div>
                <div className="modal-desc">Choose based on what kind of accountability works for you.</div>
                <div style={{ display:"flex", flexDirection:"column", gap:16, margin:"20px 0" }}>
                  <div style={{ background:"var(--accent-lo)", border:"1px solid var(--accent)", borderRadius:10, padding:"16px" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".06em", color:"var(--accent)", marginBottom:8 }}>◆ Spotter Mode</div>
                    <div style={{ fontSize:13, color:"var(--text-1)", lineHeight:1.6 }}>
                      <strong>Pressure is the mechanism.</strong> Binary status visible. Flare available 8–11PM if partner hasn't logged. Best for people who respond to external pressure.
                    </div>
                  </div>
                  <div style={{ background:"#4A8FD415", border:"1px solid #4A8FD4", borderRadius:10, padding:"16px" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".06em", color:"#4A8FD4", marginBottom:8 }}>◈ Ally Mode</div>
                    <div style={{ fontSize:13, color:"var(--text-1)", lineHeight:1.6 }}>
                      <strong>Warmth is the mechanism.</strong> Daily notes and reactions. No public status pressure. Best for people who need encouragement over pressure.
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:11, color:"var(--text-2)", textAlign:"center", marginTop:8 }}>
                  You can switch modes anytime from the partner detail view.
                </div>
              </>
            )}

            {/* Navigation */}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              {tutorialStep > 0 && (
                <button className="btn btn-g" style={{ flex:1 }} onClick={() => setTutorialStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              {tutorialStep < 1 ? (
                <button className="btn btn-a" style={{ flex:1 }} onClick={() => setTutorialStep(1)}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-a" style={{ flex:1 }} onClick={async () => {
                  // Mark tutorial as seen
                  if (sb && user) {
                    await sb.from("profiles").update({ partner_tutorial_seen: true }).eq("id", user.id);
                  }
                  setShowTutorial(false);
                }}>
                  Got It →
                </button>
              )}
            </div>
            
            {/* Progress dots */}
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  width:8, height:8, borderRadius:"50%",
                  background: tutorialStep === i ? "var(--accent)" : "var(--bg-3)",
                  transition:"background 0.2s"
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

const Tutorial = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<any>(null);
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
  const spotStyle: React.CSSProperties | null = targetRect ? {
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
  const tooltipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
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
      // If it would overflow, flip to left of the target instead
      const fitsRight = idealLeft + (base.width as number) + 16 <= W;
      const left = fitsRight ? idealLeft : targetRect.left - (base.width as number) - PAD - 16;
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
      {/* Dim overlay for welcome step (no spotlight) */}
      {!targetRect && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:9998 }} onClick={next} />
      )}
      {/* Spotlight cutout */}
      {spotStyle && <div style={spotStyle} />}
      {/* Tooltip */}
      <div style={tooltipStyle()}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9.2, letterSpacing:".3em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
        </div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:25.3, letterSpacing:".04em", lineHeight:1, marginBottom:8 }}>
          {current.title}
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:12.65, color:"var(--text-1)", lineHeight:1.6, marginBottom:16 }}>
          {current.body}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button
            onClick={next}
            style={{ background:"var(--accent)", border:"none", borderRadius:7, padding:"8px 18px", fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"#080807", cursor:"pointer" }}>
            {isLast ? "Got it →" : "Next →"}
          </button>
          <button
            onClick={onDone}
            style={{ background:"none", border:"none", fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--text-2)", cursor:"pointer" }}>
            Skip
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// TALOS — Autonomous Task Agent
// ============================================================
// TALOS tone prompts — used by Edge Function but defined here for reference

const _TALOS_TONE_PROMPTS = {
  "Stoic":          "You are TALOS — calm, minimal, precise. No hype. Acknowledge what was done, note what remains. Short sentences.",
  "Coach":          "You are TALOS — warm, encouraging, direct. Celebrate wins, push for more. Sound like a great coach who believes in the user.",
  "Drill Sergeant": "You are TALOS — intense, demanding, no excuses. Acknowledge completions quickly then immediately push for the next task. High energy.",
};

const Talos = ({ challenge, kpis, onTickTasks, onLogDay, loggedToday, tone, sb: _sb, user: _user, challenges }: { challenge: Challenge; kpis: KpiMap; onTickTasks: (keys: string[]) => void; onLogDay: (...args: any[]) => void; loggedToday: boolean; tone: string; sb: Sb; user: User | null | undefined; challenges: ChallengesState }) => {
  const [messages,    setMessages]    = useState([
    { role:"talos", text: tone === "Drill Sergeant"
        ? "TALOS online. What did you get done? Talk to me."
        : tone === "Coach"
        ? "Hey! TALOS here. Tell me what you've crushed today and I'll tick it off for you."
        : "TALOS online. Tell me what you've done today — I'll match it to your tasks and tick them off." }
  ]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [pending,     setPending]     = useState<any>(null);  // { tasks:[{key,label}], raw:string }
  const [listening,   setListening]   = useState(false);
  const feedRef  = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recogRef = useRef<any>(null);

  const tasks        = challenge?.kpis || [];
  const secChallenges = (challenges?.secondary || []).filter(c => c.kpis?.length > 0);
  const allTasks     = [
    ...tasks.map(t => ({ ...t, source: "main" })),
    ...secChallenges.flatMap(c => c.kpis.map(t => ({ ...t, source: c.id, sourceLabel: c.name }))),
  ];
  const doneTasks  = tasks.filter(t => kpis[t.key]);
  const totalTasks = tasks.length;

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, pending]);

  const addMsg = (role: any, text: any) => setMessages(m => [...m, { role, text }]);

  const callGemini = async (userText: any) => {
    if (!tasks.length) {
      addMsg("talos", "No tasks found for your active challenge. Set up a challenge first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/talos`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userText,
            tasks: allTasks.map(t => ({ key: t.key, label: t.label })),
            kpis,
            tone,
          }),
        }
      );
      const data = await res.json();
      const matchedKeys  = data.matched || [];
      const matchedTasks = tasks.filter(t => matchedKeys.includes(t.key) && !kpis[t.key]);
      const reply        = data.reply || "Done.";
      addMsg("talos", reply);
      if (matchedTasks.length > 0) setPending({ tasks: matchedTasks, raw: userText });
    } catch(e) {
      addMsg("talos", "Couldn't reach TALOS server. Check your connection.");
      console.warn("TALOS error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMsg("user", text);
    await callGemini(text);
  };

  const handleConfirm = () => {
    if (!pending) return;
    const keys = pending.tasks.map((t: any) => t.key);
    onTickTasks(keys);
    addMsg("talos", `✓ Ticked ${pending.tasks.length} task${pending.tasks.length > 1 ? "s" : ""}. ${doneTasks.length + pending.tasks.length >= totalTasks ? "All done — logging your day." : `${totalTasks - doneTasks.length - pending.tasks.length} remaining.`}`);
    // Auto-log if all tasks now done
    if (doneTasks.length + pending.tasks.length >= totalTasks && !loggedToday) {
      onLogDay();
    }
    setPending(null);
  };

  const handleDeny = () => {
    addMsg("talos", "Cancelled. Tell me more specifically what you've completed.");
    setPending(null);
  };

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMsg("talos", "Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg-0)" }}>

      {/* Header */}
      <div style={{
        padding:"20px 28px 18px", borderBottom:"1px solid var(--border-0)",
        display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexShrink:0,
      }}>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".28em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>
            Autonomous Agent
          </div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, letterSpacing:".06em", color:"var(--text-0)", lineHeight:1 }}>
            TALOS
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9.5, color:"var(--text-2)", marginTop:5, letterSpacing:".06em" }}>
            {challenge?.name ? `${challenge.name} · Day ${challenge.dayNum}` : "No active challenge"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".12em", color:"var(--ok)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--ok)", animation:"pulse 2.5s ease infinite" }} />
          ONLINE
        </div>
      </div>

      {/* Body — chat + context panel */}
      <div className="talos-layout" style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Chat column */}
        <div className="talos-chat" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid var(--border-0)" }}>

          {/* Messages */}
          <div ref={feedRef} style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", gap:12, flexDirection: m.role==="user" ? "row-reverse" : "row", alignItems:"flex-start" }}>
                {m.role === "talos" && (
                  <div style={{
                    width:32, height:32, borderRadius:"50%", flexShrink:0,
                    background:"var(--accent-lo)", border:"1px solid var(--border-accent)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:"var(--accent)",
                  }}>T</div>
                )}
                <div style={{
                  maxWidth:480, padding:"11px 16px", lineHeight:1.6, fontSize:13.5,
                  borderRadius: m.role==="user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                  background: m.role==="user" ? "var(--accent-lo)" : "var(--bg-2)",
                  border: m.role==="user" ? "1px solid var(--accent-mid)" : "1px solid var(--border-1)",
                  color: m.role==="user" ? "var(--text-0)" : "var(--text-1)",
                  marginLeft: m.role==="user" ? "auto" : 0,
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--accent-lo)", border:"1px solid var(--border-accent)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:"var(--accent)", flexShrink:0 }}>T</div>
                <div style={{ padding:"14px 18px", background:"var(--bg-2)", border:"1px solid var(--border-1)", borderRadius:"4px 12px 12px 12px", display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", opacity:.4, animation:`pulse 1.2s ${i*.2}s ease infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm bar */}
          {pending && (
            <div style={{ margin:"0 20px 16px", padding:"14px 18px", background:"var(--ok)12", border:"1px solid var(--ok)40", borderRadius:12, flexShrink:0 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".18em", textTransform:"uppercase", color:"var(--ok)", marginBottom:12 }}>
                ⚡ TALOS identified — confirm to apply
              </div>
              {pending.tasks.map((t: any) => (
                <div key={t.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", fontSize:13, color:"var(--text-0)", borderBottom:"1px solid var(--border-0)" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"var(--ok)20", border:"1.5px solid var(--ok)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"var(--ok)", flexShrink:0 }}>✓</div>
                  {t.label}
                  {t.nonNeg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:7, color:"var(--warn)", letterSpacing:".1em" }}>◆ NON-NEG</span>}
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:14 }}>
                <button onClick={handleConfirm} style={{ flex:1, background:"var(--ok)", color:"#080807", border:"none", borderRadius:7, padding:"10px", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:".14em", cursor:"pointer", fontWeight:600 }}>
                  ✓ Confirm & Tick
                </button>
                <button onClick={handleDeny} style={{ padding:"10px 18px", background:"transparent", color:"var(--text-2)", border:"1px solid var(--border-1)", borderRadius:7, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border-0)", display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            <button onClick={toggleVoice} style={{
              width:40, height:40, borderRadius:10, border:`1px solid ${listening ? "var(--err)" : "var(--border-1)"}`,
              background: listening ? "var(--err)20" : "var(--bg-2)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, flexShrink:0, transition:"all .15s",
            }}>
              {listening ? "⏹" : "🎙"}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={listening ? "Listening…" : "Tell TALOS what you've done today…"}
              style={{
                flex:1, background:"var(--bg-2)", border:"1px solid var(--border-1)",
                borderRadius:10, padding:"11px 16px", fontSize:14,
                color:"var(--text-0)", outline:"none", fontFamily:"'DM Sans',sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border-1)"}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading} style={{
              width:40, height:40, borderRadius:10, background: input.trim() && !loading ? "var(--accent)" : "var(--bg-3)",
              border:"none", cursor: input.trim() && !loading ? "pointer" : "default",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color: input.trim() && !loading ? "#080807" : "var(--text-3)",
              transition:"all .15s", flexShrink:0,
            }}>↑</button>
          </div>
        </div>

        {/* Context panel — live task state */}
        <div className="talos-context" style={{ width:260, padding:"20px 18px", overflowY:"auto", flexShrink:0, borderLeft:"1px solid var(--border-0)" }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".2em", textTransform:"uppercase", color:"var(--text-2)", marginBottom:14 }}>
            Today's Tasks
          </div>
          {allTasks.length === 0 && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:10, color:"var(--text-3)", letterSpacing:".08em" }}>No active challenge</div>
          )}

          {/* Main challenge tasks */}
          {tasks.length > 0 && tasks.map(t => (
            <div key={t.key} style={{
              display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
              borderRadius:8, marginBottom:6, transition:"all .2s",
              background: kpis[t.key] ? "var(--ok)12" : "var(--bg-2)",
              border:`1px solid ${kpis[t.key] ? "var(--ok)40" : "var(--border-1)"}`,
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, transition:"all .2s", background: kpis[t.key] ? "var(--ok)" : "var(--border-1)" }} />
              <span style={{ fontSize:12, color: kpis[t.key] ? "var(--ok)" : "var(--text-1)", flex:1 }}>{t.label}</span>
              {t.nonNeg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:6.5, color:"var(--warn)", letterSpacing:".08em" }}>◆</span>}
            </div>
          ))}

          {/* Secondary challenge task sections */}
          {secChallenges.map(c => (
            <div key={c.id} style={{ marginTop:16 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:7.5, letterSpacing:".18em", textTransform:"uppercase", color:"var(--text-3)", marginBottom:8, paddingBottom:6, borderBottom:"1px solid var(--border-0)" }}>
                ◈ {c.name}
              </div>
              {c.kpis.map(t => (
                <div key={t.key} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  borderRadius:8, marginBottom:6, transition:"all .2s",
                  background: kpis[t.key] ? "var(--ok)12" : "var(--bg-2)",
                  border:`1px solid ${kpis[t.key] ? "var(--ok)40" : "var(--border-1)"}`,
                }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, transition:"all .2s", background: kpis[t.key] ? "var(--ok)" : "var(--border-1)" }} />
                  <span style={{ fontSize:12, color: kpis[t.key] ? "var(--ok)" : "var(--text-1)", flex:1 }}>{t.label}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:8, letterSpacing:".2em", textTransform:"uppercase", color:"var(--text-2)", marginBottom:10 }}>
                Completion
              </div>
              <div style={{ height:4, background:"var(--bg-3)", borderRadius:2 }}>
                <div style={{ height:"100%", borderRadius:2, background:"var(--ok)", transition:"width .4s ease", width:`${tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%` }} />
              </div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, color:"var(--text-2)", marginTop:6 }}>
                {doneTasks.length} / {tasks.length} tasks
              </div>
            </div>
          )}

          {/* Log day shortcut */}
          {doneTasks.length > 0 && !loggedToday && (
            <button onClick={onLogDay} style={{
              width:"100%", marginTop:20, padding:"10px", borderRadius:8,
              background:"var(--accent-lo)", border:"1px solid var(--border-accent)",
              fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".12em",
              textTransform:"uppercase", color:"var(--accent)", cursor:"pointer",
              transition:"all .15s",
            }}
            onMouseOver={e => (e.target as any).style.background = "var(--accent)"}
            onMouseOut={e => (e.target as any).style.background = "var(--accent-lo)"}
            >
              Log Day →
            </button>
          )}
          {loggedToday && (
            <div style={{ marginTop:20, padding:"10px 12px", background:"var(--ok)12", border:"1px solid var(--ok)40", borderRadius:8, fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)', fontSize:9, letterSpacing:".12em", color:"var(--ok)" }}>
              ✓ Day logged
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
// AUTH SCREEN (Supabase-wired: Google + Email/Password)
// ============================================================

const AuthScreen = ({ onAuthed }: { onAuthed: (name?: string) => void }) => {
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
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
    } catch(e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      if (!sb) throw new Error("Supabase not configured.");
      await sb.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: `${window.location.origin}/app`} });    } catch(e: any) { setErr(e.message); setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-right">
        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <img src="/forge_wordmark_dark.png" style={{height:120,objectFit:"contain"}} />
        </div>
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
const SettingsScreen = ({ theme, setTheme, tone, setTone, userName, setUserName, onSaveProfile, profile, challenges, onDeleteChallenge, onDeleteAccount, sb, googleSync }: { theme: string; setTheme: (t: string) => void; tone: string; setTone: (t: string) => void; userName: string; setUserName: (n: string) => void; onSaveProfile: (updates: any) => void; profile: any; challenges: ChallengesState; onDeleteChallenge: (id: string) => void; onDeleteAccount: () => void; sb: Sb; googleSync: ReturnType<typeof useGoogleSync> }) => {
  const tones = ["Stoic","Coach","Drill Sergeant"];
  const [nameVal,     setNameVal]     = useState(userName);
  const [emailVal,    setEmailVal]    = useState("");
  const [pwNew,       setPwNew]       = useState("");
  const [pwConfirm,   setPwConfirm]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null); // { type:"challenge"|"account", id, name }
  // Feedback
  const [fbType,      setFbType]      = useState("suggestion");
  const [fbText,      setFbText]      = useState("");
  const [fbSending,   setFbSending]   = useState(false);
  const [fbDone,      setFbDone]      = useState(false);

  // Notifications
  const [notifEnabled,  setNotifEnabled]  = useState(false);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const [notifPerm,     setNotifPerm]     = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [timingMode,    setTimingMode]    = useState("smart");   // "smart" | "manual"
  const [manualHour,    setManualHour]    = useState(20);
  const [manualMinute,  setManualMinute]  = useState(0);
  const [smartHourEst,  setSmartHourEst]  = useState<number | null>(null);     // estimated smart hour shown to user
  const [notifSaved,    setNotifSaved]    = useState(false);

  // Load existing notif prefs on mount
  useEffect(() => {
    if (!sb || !profile?.id) return;
    sb.from("notification_prefs").select("*").eq("user_id", profile.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setNotifEnabled(data.enabled || false);
        setTimingMode(data.timing_mode || "smart");
        setManualHour(data.manual_hour ?? 20);
        setManualMinute(data.manual_minute ?? 0);
        // Compute smart hour estimate from checkin_hours
        const hours = data.checkin_hours || [];
        if (hours.length >= 3) {
          const avg = Math.round(hours.slice(-14).reduce((a: any,b: any) => a+b, 0) / Math.min(hours.length, 14));
          setSmartHourEst(avg);
        }
      });
  }, [profile?.id]);

  const fmtHour = (h: any, m=0) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 === 0 ? 12 : h % 12;
    const mm   = String(m).padStart(2,"0");
    return `${h12}:${mm} ${ampm}`;
  };

  const subscribeAndSave = async () => {
    if (!sb || !profile?.id) return;
    setNotifLoading(true);
    try {
      // 1. Request browser permission
      const perm = await Notification.requestPermission();
      setNotifPerm(perm);
      if (perm !== "granted") { setNotifLoading(false); return; }

      // 2. Register service worker + get push subscription
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ""
        ) as any,
      });

      const keys = sub.toJSON().keys || {};

      // 3. Save subscription to DB
      await sb.from("push_subscriptions").upsert({
        user_id:  profile.id,
        endpoint: sub.endpoint,
        p256dh:   keys.p256dh || "",
        auth_key: keys.auth   || "",
        platform: "web",
      }, { onConflict: "user_id,endpoint" });

      // 4. Upsert notification prefs
      await sb.from("notification_prefs").upsert({
        user_id:         profile.id,
        enabled:         true,
        timing_mode:     timingMode,
        manual_hour:     manualHour,
        manual_minute:   manualMinute,
        daily_reminder:  true,
        milestone_alerts:true,
        nudge_alerts:    true,
      }, { onConflict: "user_id" });

      setNotifEnabled(true);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch(e: any) { flash("err", e.message); }
    finally { setNotifLoading(false); }
  };

  const disableNotifs = async () => {
    if (!sb || !profile?.id) return;
    await sb.from("notification_prefs").upsert({ user_id: profile.id, enabled: false }, { onConflict: "user_id" });
    // Unsubscribe from push
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await sub.unsubscribe(); await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); }
    } catch(e) {}
    setNotifEnabled(false);
  };

  const saveTimingPrefs = async () => {
    if (!sb || !profile?.id) return;
    await sb.from("notification_prefs").upsert({
      user_id: profile.id, timing_mode: timingMode,
      manual_hour: manualHour, manual_minute: manualMinute,
    }, { onConflict: "user_id" });
    setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2500);
  };

  const flash = (type: any,text: any) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try {
      if (sb) await sb.auth.updateUser({ data: { full_name: nameVal.trim() } });
      setUserName(nameVal.trim());
      onSaveProfile({ full_name: nameVal.trim() });
      flash("ok","Name updated.");
    } catch(e: any) { flash("err",e.message); }
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
    } catch(e: any) { flash("err",e.message); }
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
    } catch(e: any) { flash("err",e.message); }
    finally { setSaving(false); }
  };

  const handleTheme = (id: any) => {
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
      <div className="settings-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:24,alignItems:"start"}}>

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
            <div className="srow-desc">Eleven environments. Pick your headspace.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
              {THEME_ORDER.map(id => {
                const t = ALL_THEMES[id as keyof typeof ALL_THEMES]; const on = theme===id;
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
                      {on && <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:7,letterSpacing:".08em",color:"var(--accent)"}}>✓ ACTIVE</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tone */}
          <div className="srow a5">
            <div className="srow-title">TALOS Tone</div>
            <div className="srow-desc">How TALOS speaks to you — in daily debriefs and as your agent.</div>
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

        {/* Notifications */}
        <div className="srow a5">
          <div className="srow-title">Notifications</div>
          <div className="srow-desc">Daily reminders, partner nudges, and milestone alerts — sent to this browser.</div>

          {notifPerm === "denied" && (
            <div style={{marginTop:12,padding:"10px 14px",background:"var(--err)18",border:"1px solid var(--err)44",borderRadius:8,fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:11,color:"var(--err)"}}>
              ✕ Notifications blocked in browser settings. Enable them in your browser's site permissions, then return here.
            </div>
          )}

          {/* Enable/disable toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,padding:"12px 16px",background:"var(--bg-2)",borderRadius:10,border:"1px solid var(--border-1)"}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--text-0)"}}>Push Notifications</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".1em",color:"var(--text-2)",marginTop:2}}>
                {notifEnabled ? "ACTIVE — browser subscribed" : "INACTIVE"}
              </div>
            </div>
            <button
              className={`btn ${notifEnabled ? "btn-g" : "btn-a"}`}
              style={{padding:"8px 18px",fontSize:12}}
              onClick={notifEnabled ? disableNotifs : subscribeAndSave}
              disabled={notifLoading || notifPerm === "denied"}
            >
              {notifLoading ? "…" : notifEnabled ? "Disable" : "Enable"}
            </button>
          </div>

          {/* Timing options — only show when enabled */}
          {notifEnabled && (
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".18em",textTransform:"uppercase",color:"var(--text-2)"}}>
                Reminder Timing
              </div>

              {/* Smart option */}
              <div
                onClick={() => setTimingMode("smart")}
                style={{
                  display:"flex",alignItems:"flex-start",gap:14,padding:"14px 16px",
                  background: timingMode==="smart" ? "var(--accent-lo)" : "var(--bg-2)",
                  border:`1px solid ${timingMode==="smart" ? "var(--accent)" : "var(--border-1)"}`,
                  borderRadius:10, cursor:"pointer", transition:"all .15s",
                }}
              >
                <div style={{
                  width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:2,
                  border:`2px solid ${timingMode==="smart" ? "var(--accent)" : "var(--border-1)"}`,
                  background: timingMode==="smart" ? "var(--accent)" : "transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {timingMode==="smart" && <div style={{width:6,height:6,borderRadius:"50%",background:"#080807"}} />}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--text-0)"}}>Smart Timing</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)",marginTop:3,lineHeight:1.5}}>
                    Learns when you usually check in and sends the reminder then.
                    {smartHourEst !== null
                      ? <span style={{color:"var(--accent)"}}> Estimated: {fmtHour(smartHourEst)}.</span>
                      : <span style={{color:"var(--text-3)"}}> Needs 3+ check-ins to calibrate — falls back to 8:00 PM until then.</span>
                    }
                  </div>
                </div>
              </div>

              {/* Manual option */}
              <div
                onClick={() => setTimingMode("manual")}
                style={{
                  display:"flex",alignItems:"flex-start",gap:14,padding:"14px 16px",
                  background: timingMode==="manual" ? "var(--accent-lo)" : "var(--bg-2)",
                  border:`1px solid ${timingMode==="manual" ? "var(--accent)" : "var(--border-1)"}`,
                  borderRadius:10, cursor:"pointer", transition:"all .15s",
                }}
              >
                <div style={{
                  width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:2,
                  border:`2px solid ${timingMode==="manual" ? "var(--accent)" : "var(--border-1)"}`,
                  background: timingMode==="manual" ? "var(--accent)" : "transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {timingMode==="manual" && <div style={{width:6,height:6,borderRadius:"50%",background:"#080807"}} />}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--text-0)"}}>Set a Time</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)",marginTop:3}}>
                    Pick exactly when you want the reminder each day.
                  </div>
                  {timingMode==="manual" && (
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:12,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                      <select className="field" value={manualHour % 12 === 0 ? 12 : manualHour % 12}
                        onChange={e => {
                          const h12 = Number(e.target.value);
                          const ispm = manualHour >= 12;
                          setManualHour(ispm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12));
                        }}
                        style={{width:68,cursor:"pointer"}}>
                        {Array.from({length:12},(_,i)=>i+1).map(h=>(
                          <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
                        ))}
                      </select>
                      <select className="field" value={manualHour >= 12 ? "PM" : "AM"}
                        onChange={e => {
                          const isPM = e.target.value === "PM";
                          const h12  = manualHour % 12 === 0 ? 12 : manualHour % 12;
                          setManualHour(isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12));
                        }}
                        style={{width:72,cursor:"pointer"}}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)"}}>daily</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="btn btn-a" style={{alignSelf:"flex-start",marginTop:4}}
                onClick={saveTimingPrefs}>
                {notifSaved ? "✓ Saved" : "Save Timing"}
              </button>
            </div>
          )}
        </div>

        {/* Integrations */}
        <div className="srow a5">
          <div className="srow-title">Integrations</div>
          <div className="srow-desc">Sync your daily schedule and challenge tasks with Google Calendar and Google Tasks.</div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,padding:"12px 16px",background:"var(--bg-2)",borderRadius:10,border:"1px solid var(--border-1)"}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--text-0)"}}>Google Calendar & Tasks</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".1em",color:"var(--text-2)",marginTop:2}}>
                {googleSync.isConnected ? `CONNECTED — ${googleSync.email || "unknown account"}` : "NOT CONNECTED"}
              </div>
              {googleSync.isConnected && googleSync.lastSyncedAt && (
                <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,color:"var(--text-3)",marginTop:2}}>
                  Last synced {new Date(googleSync.lastSyncedAt).toLocaleString()}
                </div>
              )}
            </div>
            <button
              className={`btn ${googleSync.isConnected ? "btn-g" : "btn-a"}`}
              style={{padding:"8px 18px",fontSize:12}}
              onClick={googleSync.isConnected ? googleSync.disconnect : googleSync.connect}
            >
              {googleSync.isConnected ? "Disconnect" : "Connect Google Calendar & Tasks"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div className="srow a5">
          <div className="srow-title">Feedback</div>
          <div className="srow-desc">Suggest an improvement or report a bug. We read everything.</div>
          {fbDone ? (
            <div style={{marginTop:12,padding:"12px 16px",background:"var(--ok)15",border:"1px solid var(--ok)44",borderRadius:8}}>
              <div style={{color:"var(--ok)",fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:12}}>✓ Sent. Thank you.</div>
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
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,color:"var(--text-2)",letterSpacing:".1em"}}>Day {ch.dayNum} of {ch.totalDays}</div>
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--err)",marginBottom:12}}>
            {confirmDelete.type === "challenge" ? "Quit Challenge" : "Delete Account"}
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:".04em",marginBottom:12,lineHeight:1.2}}>
            {confirmDelete.type === "challenge"
              ? `Are you sure you want to quit "${confirmDelete.name}"?`
              : "Are you sure you want to delete your account?"}
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:'var(--mono-weight)',fontSize:10,color:"var(--text-2)",lineHeight:1.6,marginBottom:28}}>
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
// ACCENT COLOUR — parsed from the CSS var the current theme sets, for
// DynamicBackground's canvas gradients (which need raw RGB, not a CSS string)
// ============================================================
const getAccentRGB = (): [number, number, number] => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ] as [number, number, number];
  }
  const m = raw.match(/(\d+),\s*(\d+),\s*(\d+)/);
  return (m ? [+m[1], +m[2], +m[3]] : [212, 146, 42]) as [number, number, number];
};

// ============================================================
// ROOT APP — Supabase auth + all state
// ============================================================
export default function App() {
  // ── Supabase session state ────────────────────────────────
  const [user,    setUser]    = useState<User | null | undefined>(undefined); // undefined = still loading
  const [profile, setProfile] = useState<any>(null); // TODO: type this — profile row shape accessed dynamically

  // Google Calendar / Tasks sync — connection state, OAuth, and all outbound
  // API calls live in this hook. Everything below treats it as a side
  // effect, never the source of truth for challenges/time_blocks.
  const googleSync = useGoogleSync(sb, user);

  // Generate a random 8-char uppercase invite code
  const genInviteCode = () => Math.random().toString(36).substring(2,10).toUpperCase();

  // Load profile from DB — auto-generate invite_code if missing
  const loadProfile = useCallback(async (uid: any) => {
    if (!uid || !sb) return;
    try {
      // .maybeSingle() instead of .single() — a missing row (e.g. the
      // on_auth_user_created trigger hasn't landed yet right after a fresh
      // Google sign-up) must resolve to null, not throw. .single() throwing
      // here was silently caught below and left `profile` stuck at null
      // forever, which stranded the user on the auth screen even though
      // they were already authenticated.
      const { data } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (!data) {
        console.warn(`[auth] No profile row found yet for user ${uid} — profile-dependent stage transitions will stay pending until one appears.`);
        return;
      }
      if (data) {
        if (!data.invite_code) {
          const code = genInviteCode();
          await sb.from("profiles").update({ invite_code: code }).eq("id", uid);
          data.invite_code = code;
        }
        setProfile(data);
        if (data.momentum != null) setMomentum(data.momentum);
        // Load most recent regimen log date
        const { data: lastRegimenLog } = await sb
          .from("regimen_logs")
          .select("date")
          .eq("user_id", uid)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastRegimenLog) setLastRegimenLogDate(lastRegimenLog.date);
      }
    } catch(e) { console.warn("[auth] profile load failed:", e); }
  }, []);

  // Load challenges + today's kpi state from Supabase
  const loadChallenges = useCallback(async (uid: any) => {
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

      // Use challenge date (day changes at 3:01 AM)
      const challengeToday = getChallengeDate();
      
      // For day number calculation
      const todayForCalc = new Date(challengeToday + "T12:00:00"); // Use noon to avoid DST issues

      const shaped = chs.map(ch => {
        // Use start_date if available, otherwise fall back to created_at date portion
        const startStr = ch.start_date || ch.created_at?.split("T")[0];
        const startDate = new Date(startStr + "T12:00:00"); // Use noon to avoid DST issues
        
        // Calculate days elapsed (day 1 = start date, day 2 = next day, etc.)
        const msPerDay = 24 * 60 * 60 * 1000;
        const dayNum = Math.floor((todayForCalc.getTime() - startDate.getTime()) / msPerDay) + 1;

        return {
          id:         ch.id,
          name:       ch.name,
          tag:        ch.tag || "CUSTOM",
          dayNum:     Math.min(Math.max(dayNum, 1), ch.total_days),
          totalDays:  ch.total_days,
          streak:     ch.streak || 0,
          consistency:ch.consistency || 0,
          color:      ch.color || "#D4922A",
          mission:    ch.mission || "",
          is_main:    ch.is_main,
          created_at: ch.created_at,
          start_date: startStr,
          gtask_list_id: ch.gtask_list_id || null,
          kpis: (ch.challenge_tasks || [])
            .sort((a: any,b: any) => a.sort_order - b.sort_order)
            .map((t: any) => ({
              key:    t.key,
              label:  t.label,
              cat:    t.cat || "other",
              nonNeg: t.non_neg || false,
              gtask_id: t.gtask_id || null,
            })),
        };
      });

      const main = shaped.find(c => c.is_main) || null;
      const secondary = shaped.filter(c => !c.is_main).slice(0, 3);

      if (main) {
        setChallenges({ main: { ...main, wall: buildWall() }, secondary });

        // Load TODAY's kpi state from checkins (using challenge date, not calendar date)
        // Important: If no checkin exists for today, all tasks start as false (unchecked)
        const { data: todayCheckin } = await sb
          .from("checkins")
          .select("completed_keys, score")
          .eq("challenge_id", main.id)
          .eq("date", challengeToday)
          .maybeSingle();

        // Build kpi state - start all as false, then apply today's completed keys
        const kpiState: Record<string, boolean> = {};
        main.kpis.forEach((k: any) => { kpiState[k.key] = false; });
        
        if (todayCheckin?.completed_keys) {
          // Only mark as complete if there's a checkin for TODAY with these keys
          todayCheckin.completed_keys.forEach((key: any) => {
            if (kpiState.hasOwnProperty(key)) kpiState[key] = true;
          });
          setLoggedToday(true);
        } else {
          // No checkin for today = not logged, all tasks unchecked
          setLoggedToday(false);
        }

        // Also load today's completed keys for each secondary challenge
        if (secondary.length > 0) {
          const secIds = secondary.map(c => c.id);
          const { data: secCheckins } = await sb
            .from("checkins")
            .select("challenge_id, completed_keys")
            .in("challenge_id", secIds)
            .eq("date", challengeToday);
          (secCheckins || []).forEach(ci => {
            const sec = secondary.find(c => c.id === ci.challenge_id);
            if (sec && ci.completed_keys) {
              sec.kpis.forEach((k: any) => { kpiState[k.key] = ci.completed_keys.includes(k.key); });
            }
          });
        }
        setKpis(kpiState);

        // Load mission from main challenge
        if (main.mission) setMission(main.mission);
      }
    } catch(e) { console.warn("loadChallenges:", e); }
  }, []);

  const saveProfile = useCallback(async (updates: any) => {
    if (!user?.id || !sb) return;
    try {
      const { data } = await sb.from("profiles")
        .upsert({ id: user.id, updated_at: new Date().toISOString(), ...updates })
        .select().single();
      if (data) setProfile(data);
    } catch(e) { console.warn("profile save:", e); }
  }, [user]);
  
  const handleSaveMission = useCallback(async (newMission: any) => {
    setMission(newMission);
    await saveProfile({ mission: newMission });
  }, [saveProfile]);

  // Supabase auth listener
  // Register service worker for push notifications
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(console.warn);
  }, []);

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
  const [stage, setStage] = useState(
    sessionStorage.getItem("forge_skip_loader") === "auth" ? "auth" : "loader"
  );
  const [loaderMode, setLoaderMode] = useState(() => {
    const flag = sessionStorage.getItem("forge_skip_loader");
    sessionStorage.removeItem("forge_skip_loader");
    return flag === "auth" ? "login" : "inapp";
  });
  const [page,        setPage]        = useState("home");

  // If we just returned from the Google OAuth redirect, bounce back to
  // Settings (connect() stashed this flag before leaving the app).
  useEffect(() => {
    const target = sessionStorage.getItem("forge_post_oauth_page");
    if (target) {
      sessionStorage.removeItem("forge_post_oauth_page");
      setPage(target);
    }
  }, []);

  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dw,          setDW]          = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(false);
  const [loggedToday,  setLoggedToday]  = useState(false);
  const [checkins,     setCheckins]     = useState<ScoreMap>({}); // { "YYYY-MM-DD": score }
  const [allCheckins,  setAllCheckins]  = useState<Record<string, ScoreMap>>({}); // { challengeId: { "YYYY-MM-DD": score } }
  const [challengeHistory, setChallengeHistory] = useState<any[]>([]); // All challenges (active + archived with >1 day)
  const [totalDaysForged, setTotalDaysForged] = useState(0); // Cumulative days with score > 0
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [focusLoading,  setFocusLoading]  = useState(true);
  const [theme,       setThemeState]  = useState("forge");
  const [tone,        setTone]        = useState("Coach");
  const [modal,       setModal]       = useState<ModalState>(null);
  const [detailModal, setDetailModal] = useState<ModalState>(null);
  const [libModal,    setLibModal]    = useState(false);
  const [mission,     setMission]     = useState("I am becoming someone who shows up every day without negotiating with myself.");
  const [userName,    setUserName]    = useState("You");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(() => localStorage.getItem('forge_profile_image') || null);
  const [kpis,        setKpis]        = useState<KpiMap>(EMPTY_KPIS);
  const [secondaryKpis, setSecondaryKpis] = useState<Record<string, KpiMap>>({}); // { challengeId: { taskKey: boolean } }
  const [challenges,  setChallenges]  = useState<ChallengesState>(EMPTY_CHALLENGES);

  const handleProfileImageUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfileImageUrl(dataUrl);
      localStorage.setItem('forge_profile_image', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const toggleSecondary = (challengeId: any, taskKey: any) => {
    setSecondaryKpis(prev => ({
      ...prev,
      [challengeId]: {
        ...(prev[challengeId] || {}),
        [taskKey]: !(prev[challengeId]?.[taskKey]),
      },
    }));
  };

  // ============================================================
  // REGIMEN STATE (new)
  // ============================================================
  const [regimen, setRegimen] = useState<Regimen>(() => {
    const saved = localStorage.getItem('forge_regimen');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      days: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
      temp_items: [],
    };
  });
  const [regimenChecked, setRegimenChecked] = useState<KpiMap>({});
  const [momentum, setMomentum] = useState(0);
  const [lastRegimenLogDate, setLastRegimenLogDate] = useState<string | null>(null);
  const [tempChecked, setTempChecked] = useState<KpiMap>({});
  const [dayType, setDayType] = useState('full'); // 'full' | 'scaled' | 'recovery'

  const toggleRegimen = (id: any) => {
    setRegimenChecked(p => {
      const updated = { ...p, [id]: !p[id] };
      if (sb && user) {
        const n = new Date();
        const todayLocal = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
        const completedIds = Object.entries(updated).filter(([,v]) => v).map(([k]) => k);
        sb.from("regimen_logs").upsert(
          { user_id: user.id, date: todayLocal, completed_ids: completedIds },
          { onConflict: "user_id,date" }
        ).then(() => {});
        setLastRegimenLogDate(todayLocal);
      }
      return updated;
    });
  };
  const toggleTemp = (id: any) => setTempChecked(p => ({ ...p, [id]: !p[id] }));

  // Reset regimen checks at midnight
  const getTodayKey = () => new Date().toISOString().split('T')[0];
  const [lastRegimenDate, setLastRegimenDate] = useState(() => {
    return localStorage.getItem('forge_regimen_date') || getTodayKey();
  });
  
  useEffect(() => {
    const today = getTodayKey();
    if (today !== lastRegimenDate) {
      setRegimenChecked({});
      setTempChecked({});
      setLastRegimenDate(today);
      localStorage.setItem('forge_regimen_date', today);
    }
  }, [lastRegimenDate]);

  // Persist regimen to localStorage
  useEffect(() => {
    localStorage.setItem('forge_regimen', JSON.stringify(regimen));
  }, [regimen]);

  // ============================================================

  // Inject CSS on mount
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "forge-css";
    s.textContent = makeCSS();
    document.head.appendChild(s);
    return () => { const el = document.getElementById("forge-css"); if (el) el.remove(); };
  }, []);

  // Apply theme vars whenever theme changes
  const setTheme = (id: any) => { setThemeState(id); applyThemeVars(id); };
  useEffect(() => { applyThemeVars(theme); }, [theme]);

  // Re-parse --accent into RGB for DynamicBackground's canvas gradients.
  // Declared after the applyThemeVars effect above so it always reads the
  // CSS custom properties after they've been updated for the new theme.
  const [accentRGB, setAccentRGB] = useState(getAccentRGB);
  useEffect(() => { setAccentRGB(getAccentRGB()); }, [theme]);

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
    // Already logged in — show inapp loader first, then route to app
    setStage(s => {
      if (s === "loader") {
        setLoaderMode("inapp");
        return "loader";
      }
      if (s === "auth") {
        if (profile && !profile.onboarded) return "ob_why";
        if (profile && profile.onboarded)  return "app";
      }
      return s;
    });
  }, [user, profile]);

  const toggle = (key: any) => {
    setKpis(p => {
      const next: Record<string, boolean> = { ...p, [key]: !p[key] };
      if (sb && user) {
        const today = new Date().toISOString().split("T")[0];

        // Check if key belongs to a secondary challenge
        const secChallenge = (challenges.secondary || []).find(c =>
          c.kpis?.some(k => k.key === key)
        );

        if (secChallenge) {
          // Persist secondary task ticks to that challenge's checkin
          const secCompleted = (secChallenge.kpis || []).filter(k => next[k.key]).map(k => k.key);
          const secTotal = secChallenge.kpis.length;
          const secScore = secTotal > 0 ? Math.round((secCompleted.length / secTotal) * 100) : 0;
          sb.from("checkins").upsert({
            challenge_id:   secChallenge.id,
            date:           today,
            score:          secScore,
            completed_keys: secCompleted,
            updated_at:     new Date().toISOString(),
          }, { onConflict: "challenge_id,date" }).then(() => {});

          // Google Tasks sync — fire-and-forget, only on newly-completed tasks
          if (next[key] && googleSync.isConnected && secChallenge.gtask_list_id) {
            const task = (secChallenge.kpis || []).find(k => k.key === key);
            // TODO: structural type mismatch - needs design review (App.tsx's local
            // Kpi vs useGoogleSync.ts's ChallengeTask — align across files)
            if (task) void googleSync.pushTaskCompletion(task as any, secChallenge.gtask_list_id);
          }
        } else if (challenges.main) {
          // Persist main challenge ticks
          const completed = (challenges.main.kpis || []).filter(k => next[k.key]).map(k => k.key);
          const total = (challenges.main.kpis || []).length;
          const score = total > 0 ? Math.round((completed.length / total) * 100) : 0;
          sb.from("checkins").upsert({
            challenge_id:   challenges.main.id,
            date:           today,
            score,
            completed_keys: completed,
            updated_at:     new Date().toISOString(),
          }, { onConflict: "challenge_id,date" }).then(() => {});

          // Google Tasks sync — fire-and-forget, only on newly-completed tasks
          if (next[key] && googleSync.isConnected && challenges.main.gtask_list_id) {
            const task = (challenges.main.kpis || []).find(k => k.key === key);
            // TODO: structural type mismatch - needs design review (App.tsx's local
            // Kpi vs useGoogleSync.ts's ChallengeTask — align across files)
            if (task) void googleSync.pushTaskCompletion(task as any, challenges.main.gtask_list_id);
          }
        }
      }
      return next;
    });
  };

  // ── Phase 2: poll Google Tasks completion once on load ──────
  // Only fires once per session (guarded by the ref, not the effect's own
  // dependency array, since challenges/kpis change on every checkin) and
  // only once a Google connection + the main challenge's task list are
  // actually available.
  const googleTasksPolledRef = useRef(false);
  useEffect(() => {
    if (googleTasksPolledRef.current) return;
    if (!googleSync.isConnected || !challenges.main?.gtask_list_id) return;
    googleTasksPolledRef.current = true;

    // TODO: structural type mismatch - needs design review (App.tsx's local
    // ChallengesState vs useGoogleSync.ts's Challenges — align across files)
    googleSync.pollTaskCompletions(challenges as any, kpis).then(updates => {
      // toggle() re-pushes completion back to Google — a harmless no-op
      // PATCH for tasks that got us here in the first place, but it keeps
      // toggle() as the single source of truth for "mark this done" rather
      // than duplicating its checkin-persist logic here.
      Object.keys(updates).forEach(key => {
        if (updates[key]) toggle(key);
      });
    });
  }, [googleSync.isConnected, challenges, kpis]);

  const handleAuthed = (name: any) => {
    if (name) setUserName(name);
    setLoaderMode("inapp");
    setStage("loader");
  };

  const handleStartChallenge = async ({ name, days, mission: m, nonNeg, tasks, isSecondary, tag, startDate }: any) => {
    if (!user?.id || !sb) return;
    try {
      // Archive existing main if replacing
      if (!isSecondary && challenges.main) {
        await sb.from("challenges").update({ archived: true }).eq("id", challenges.main.id);
      }

      // Use startDate if provided, otherwise today
      // Format as YYYY-MM-DD for consistent day calculation
      const startDateStr = startDate || new Date().toISOString().split("T")[0];

      // Insert challenge row
      const { data: chRow, error: chErr } = await sb.from("challenges").insert({
        user_id:    user.id,
        name,
        tag:        tag || "CUSTOM",
        total_days: parseInt(days),
        streak:     0,
        consistency:0,
        color:      isSecondary ? "#5DBF8A" : "#D4922A",
        mission:    m || null,
        is_main:    !isSecondary,
        archived:   false,
        start_date: startDateStr,
      }).select().single();

      if (chErr || !chRow) throw chErr;

      // Insert tasks — nonNeg may be array or false
      const nonNegArr = Array.isArray(nonNeg) ? nonNeg : [];
      const kpis = tasks.map((t: any, i: any) => ({
        challenge_id: chRow.id,
        key:          `task_${chRow.id}_${i}`,
        label:        t.label,
        cat:          t.cat || "other",
        non_neg:      nonNegArr.includes(t.id),
        sort_order:   i,
      }));
      if (kpis.length > 0) await sb.from("challenge_tasks").insert(kpis);

      // Google Tasks sync — fire-and-forget, never blocks challenge creation.
      // Runs after the Supabase writes above so Forge's own state is never
      // waiting on a string of sequential Google API round-trips (one per
      // task). gtask_list_id/gtask_id show up on the *next* loadChallenges,
      // not this one.
      if (googleSync.isConnected && kpis.length > 0) {
        void (async () => {
          const listId = await googleSync.createTaskList(name);
          if (!listId) return;
          await sb.from("challenges").update({ gtask_list_id: listId }).eq("id", chRow.id);
          for (const kpi of kpis) {
            const taskId = await googleSync.createTask(listId, kpi.label);
            if (taskId) {
              await sb.from("challenge_tasks").update({ gtask_id: taskId })
                .eq("challenge_id", chRow.id).eq("key", kpi.key);
            }
          }
        })();
      }

      // Reload everything fresh from DB
      await loadChallenges(user.id);
      if (m && !isSecondary) setMission(m);

      // Prompt user to add tasks to timetable
      if (!isSecondary) setShowSchedulePrompt(true);

    } catch(e) { console.warn("handleStartChallenge:", e); }
    setModal(null); setLibModal(false);
  };

  const handleDeleteChallenge = async (challengeId: any) => {
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

  const handleLibPick = (tpl: any, isSecondary: any) => {
    setLibModal(false);
    setModal({ ...tpl, _mode: isSecondary?"secondary":"main", maxDays: isSecondary ? challenges.main?.totalDays : undefined });
  };

  const addSecondary = () => { if (challenges.secondary.length >= 3) return; setLibModal(true); };

  const handleViewChallenge = (challenge: any, type: any) => {
    setDetailModal({ type, challenge: { ...challenge, kpis: (challenge.kpis||[]).map((k: any) =>({ key:k.key||`task_${Math.random().toString(36).slice(2)}`, label:k.label||"", cat:k.cat||"other", nonNeg:k.nonNeg||false })) } });
  };

  const handleEditChallenge = (updated: any) => {
    setChallenges(c => {
      if (updated.id === c.main?.id) return { ...c, main: { ...c.main, kpis: updated.kpis } } as ChallengesState;
      return { ...c, secondary: c.secondary.map(s => s.id===updated.id ? {...s, kpis:updated.kpis} : s) } as ChallengesState;
    });
    if (updated.id === challenges.main?.id) setKpis(prev => ({ ...Object.fromEntries(updated.kpis.map((k: any) =>[k.key,false])), ...prev }));
    setDetailModal(null);
  };

  const handleOnboardDone = async () => {
    await saveProfile({ onboarded: true });
    setStage("app");
  };

  const hasChallenge = !!challenges.main;
  // ── Today helpers (day changes at 3:01 AM local time) ─────
  const todayStr = () => getChallengeDate();

  // Load checkins from Supabase on mount
  useEffect(() => {
    if (!sb || !user || !challenges.main) return;
    const load = async () => {
      try {
        const { data } = await sb.from("checkins")
          .select("date,score").eq("challenge_id", challenges.main?.id);
        if (data) {
          const map: Record<string, any> = {};
          data.forEach(c => { map[c.date] = c.score; });
          
          // CLIENT-SIDE AUTO-LOG: Backfill 0% for any missed days
          const today = todayStr();
          const startDate = challenges.main?.start_date || challenges.main?.created_at?.split("T")[0];
          if (startDate) {
            const missedDays = [];
            const start = new Date(startDate + "T12:00:00");
            const todayDate = new Date(today + "T12:00:00");
            const _msPerDay = 24 * 60 * 60 * 1000;
            
            // Check each day from start to yesterday
            for (let d = new Date(start); d < todayDate; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split("T")[0];
              if (!map[dateStr]) {
                missedDays.push(dateStr);
              }
            }
            
            // Backfill missed days with 0%
            if (missedDays.length > 0) {
              const inserts = missedDays.map(date => ({
                challenge_id: challenges.main?.id,
                date,
                score: 0,
                completed_keys: [],
                day_mode: "auto",
              }));
              await sb.from("checkins").upsert(inserts, { onConflict: "challenge_id,date" });
              
              // Add to local map
              missedDays.forEach(date => { map[date] = 0; });
              
              // Reset streak to 0 since we missed days
              await sb.from("challenges").update({ streak: 0 }).eq("id", challenges.main?.id);
              setChallenges(prev => ({
                ...prev,
                main: { ...prev.main, streak: 0 },
              } as ChallengesState));
              
              console.log("Auto-logged missed days:", missedDays);
            }
          }
          
          setCheckins(map);
          setLoggedToday(today in map);
        }
      } catch(e) { console.warn("load checkins:", e); }
    };
    load();
  }, [user, challenges.main?.id]);

  // Load all challenge history + checkins for Wall page
  const loadChallengeHistory = useCallback(async () => {
    if (!sb || !user) return;
    try {
      // Load all challenges (active + archived) that have more than 1 day
      const { data: allChallenges } = await sb
        .from("challenges")
        .select("id, name, tag, total_days, start_date, created_at, streak, consistency, is_main, archived, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (!allChallenges) return;
      
      // Filter: only challenges with >1 day of activity
      const challengeIds = allChallenges.map(c => c.id);
      
      // Load all checkins for these challenges
      const { data: allCheckinRows } = await sb
        .from("checkins")
        .select("challenge_id, date, score")
        .in("challenge_id", challengeIds);
      
      // Group checkins by challenge_id
      const checkinsByChallenge: Record<string, any> = {};
      let totalForgedDays = 0;
      (allCheckinRows || []).forEach(c => {
        if (!checkinsByChallenge[c.challenge_id]) checkinsByChallenge[c.challenge_id] = {};
        checkinsByChallenge[c.challenge_id][c.date] = c.score;
        if (c.score > 0) totalForgedDays++;
      });
      
      // Filter challenges: keep only those with >1 checkin OR currently active
      const validChallenges = allChallenges.filter(c => {
        const checkinCount = Object.keys(checkinsByChallenge[c.id] || {}).length;
        return checkinCount > 1 || !c.archived;
      }).map(c => {
        const scores: any[] = Object.values(checkinsByChallenge[c.id] || {});
        return {
          id: c.id,
          name: c.name,
          tag: c.tag || "CUSTOM",
          totalDays: c.total_days,
          startDate: c.start_date || c.created_at?.split("T")[0],
          streak: c.streak || 0,
          consistency: c.consistency || 0,
          isMain: c.is_main,
          archived: c.archived,
          completedAt: c.completed_at,
          checkinCount: scores.filter(s => s > 0).length,
        };
      });
      
      setChallengeHistory(validChallenges);
      setAllCheckins(checkinsByChallenge);
      setTotalDaysForged(totalForgedDays);
    } catch(e) { console.warn("load challenge history:", e); }
  }, [user]);

  useEffect(() => {
    if (user) loadChallengeHistory();
  }, [user, loadChallengeHistory]);

  // Load focus sessions from Supabase
  const loadFocusSessions = useCallback(async () => {
    if (!sb || !user) return;
    setFocusLoading(true);
    try {
      const { data } = await sb.from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setFocusSessions(data);
    } catch(e) { console.warn("load focus sessions:", e); }
    setFocusLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadFocusSessions();
  }, [user, loadFocusSessions]);


  // ── Momentum decay on app load ────────────────────────────
  useEffect(() => {
    if (!challenges.main || !user || !sb || momentum === 0) return;

    const n = new Date();
    const todayLocal = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;

    const lastChallengeDate = Object.values(allCheckins)
      .flatMap(byDate => Object.keys(byDate))
      .sort()
      .pop();

    const candidates = [lastChallengeDate, lastRegimenLogDate].filter(Boolean).sort();
    const lastLogDate = candidates[candidates.length - 1];

    if (!lastLogDate || lastLogDate >= todayLocal) return;

    const daysMissed = Math.round(
      (new Date(todayLocal).getTime() - new Date(lastLogDate).getTime()) / 86400000
    ) - 1;

    if (daysMissed <= 0) return;

    const decayed = Math.round(momentum * Math.pow(0.90, daysMissed) * 10) / 10;
    if (decayed === momentum) return;

    setMomentum(decayed);
    sb.from("profiles").update({ momentum: decayed }).eq("id", user.id).then(() => {});
  }, [challenges.main?.id, allCheckins, lastRegimenLogDate, user?.id]);

  // ── Momentum formula ──────────────────────────────────────
  const computeMomentum = (prevMomentum: any) => {
    const dow = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayRegimen = dayType === 'scaled'
      ? (regimen.days?.[dow] || []).filter(t => t.nonNeg)
      : (regimen.days?.[dow] || []);

    const sources = [
      ...(challenges.main?.kpis || []).map(t => ({
        weight: t.non_neg ? 3 : 1,
        done: !!kpis[t.key],
      })),
      ...((challenges.secondary || []).flatMap(ch =>
        (ch.kpis || []).map(t => ({
          weight: t.non_neg ? 3 : 1,
          done: !!(secondaryKpis[ch.id || '']?.[t.key]),
        }))
      )),
      ...todayRegimen.map(t => ({
        weight: t.nonNeg ? 3 : 1,
        done: !!regimenChecked[t.id],
      })),
    ];

    if (sources.length === 0) return prevMomentum;
    const targetScore = sources.reduce((s, t) => s + t.weight, 0);
    const dailyScore  = sources.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
    const gain = Math.min(10, (dailyScore / targetScore) * 10);
    return Math.min(100, Math.round(((prevMomentum * 0.90) + gain) * 10) / 10);
  };

  // ── Log a day ─────────────────────────────────────────────
  const handleLogDay = async (done: any, total: any) => {
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

    if (sb) {
      try {
        // 1. Save checkin
        await sb.from("checkins").upsert({
          challenge_id: challenges.main.id,
          date: today,
          score,
          completed_keys: completedKeys,
          updated_at: new Date().toISOString(),
        }, { onConflict: "challenge_id,date" });

        // 2. Compute new streak — check if yesterday had a passing checkin
        // Yesterday in challenge terms (respecting 3:01 AM boundary)
        const todayDate = new Date(today + "T12:00:00");
        todayDate.setDate(todayDate.getDate() - 1);
        const yesterdayStr = todayDate.toISOString().split("T")[0];

        const { data: yCheckin } = await sb
          .from("checkins")
          .select("score")
          .eq("challenge_id", challenges.main.id)
          .eq("date", yesterdayStr)
          .maybeSingle();

        // Streak increments if yesterday was logged (any score > 0), else reset to 1
        const prevStreak = challenges.main.streak || 0;
        const newStreak  = (yCheckin && yCheckin.score > 0) ? prevStreak + 1 : 1;

        // 3. Compute consistency — (days with score > 0) / completed days
        // Completed days = dayNum - 1 (today doesn't count until logged)
        // But if we just logged today, include today in both numerator and denominator
        const { data: allCheckins } = await sb
          .from("checkins")
          .select("score")
          .eq("challenge_id", challenges.main.id);

        const dayNum      = challenges.main.dayNum || 1;
        const passingDays = (allCheckins || []).filter(c => c.score > 0).length;
        // Days passed = number of days we could have logged (including today since we just logged)
        const _daysPassed = passingDays > 0 ? Math.max(passingDays, dayNum - 1 + 1) : dayNum;
        // Simpler: after logging, completed days = dayNum (since today is now complete)
        const completedDays = dayNum;
        const newConsistency = completedDays > 0 ? Math.min(100, Math.round((passingDays / completedDays) * 100)) : 0;

        // 4. Write streak + consistency back to challenges table
        await sb.from("challenges").update({
          streak:      newStreak,
          consistency: newConsistency,
        }).eq("id", challenges.main.id);

        // 5. Update local state so UI reflects immediately
        setChallenges(prev => ({
          ...prev,
          main: { ...prev.main, streak: newStreak, consistency: newConsistency },
        } as ChallengesState));

        // 6. Compute + save momentum
        const newMomentum = computeMomentum(momentum);
        await sb.from("profiles").update({ momentum: newMomentum }).eq("id", user?.id);
        setMomentum(newMomentum);

      } catch(e) { console.warn("save checkin:", e); }
    }
  };

  // ── Midnight: advance day + reset today's kpis ──────────────
  useEffect(() => {
    if (!challenges.main) return;
    const scheduleRefresh = () => {
      const now  = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const ms = next.getTime() - now.getTime();
      const n = now;
      const endingDayStr = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
      return setTimeout(async () => {
        // Check if the day that just ended was ever logged
        if (sb && challenges.main) {
          const { data: endingCheckin } = await sb
            .from("checkins").select("score")
            .eq("challenge_id", challenges.main.id)
            .eq("date", endingDayStr).maybeSingle();
          // Missed day — reset streak to 0 in DB
          if (!endingCheckin || endingCheckin.score === 0) {
            await sb.from("challenges").update({ streak: 0 }).eq("id", challenges.main.id);
          }
        }
        // Reload challenges fresh — dayNum recomputes from created_at, streak from DB
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

  // ── Fire sparks when all tasks done ─────────────────────────
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

  // ── Live momentum update as tasks are ticked ─────────────
  useEffect(() => {
    if (!challenges.main) return;
    const persistedMomentum = profile?.momentum ?? 0;
    setMomentum(computeMomentum(persistedMomentum));
  }, [kpis, secondaryKpis, regimenChecked]);

  const activeChallenge = (hasChallenge
    ? { ...challenges.main, kpis: challenges.main?.kpis || [], wall: challenges.main?.wall || buildWall() }
    : { id:null, name:"No Active Challenge", tag:"", dayNum:0, totalDays:1, streak:0, consistency:0, color:"#9A9690", kpis:[], wall:buildWall() }) as Challenge;
  const level = getLevel(totalDaysForged);
  const nextLevel = LEVELS.find(l => l.minDays > totalDaysForged);
  const daysToNext = nextLevel ? nextLevel.minDays - totalDaysForged : 0;
  const isMobile = useIsMobile();

  const handleAvatarClick = () => {
    if (isMobile) {
      setPage("profile");
    } else {
      setShowProfile(true);
    }
  };

  const renderPage = () => {
    if (page==="profile") {
      return (
        <ProfilePage
          onBack={() => setPage("home")}
          userName={userName}
          memberSince={user?.created_at}
          mission={mission}
          // TODO: structural type mismatch - needs design review (App.tsx's local
          // Challenge vs ProfilePage.tsx's ProfileChallenge — align across files)
          challenge={activeChallenge as any}
          checkins={Object.entries(checkins).map(([date, score]) => ({ date, score }))}
          longestStreak={activeChallenge?.streak || 0}
          consistency={activeChallenge?.consistency || 0}
          daysForged={totalDaysForged}
          badges={[]}
          levels={LEVELS}
        />
      );
    }
    if (page==="home") {
      return (
        <DashboardV2
          // TODO: structural type mismatch - needs design review (App.tsx's local
          // Challenge/ChallengesState vs DashboardV2.tsx's DashChallenge/ChallengesShape —
          // align across files)
          challenge={activeChallenge as any}
          challenges={challenges as any}
          kpis={kpis}
          toggle={toggle}
          checkins={checkins}
          userName={userName}
          onLogDay={handleLogDay}
          loggedToday={loggedToday}
          onAddSecondary={addSecondary}
          onViewChallenge={handleViewChallenge}
          onStartChallenge={() => setPage("library")}
          onUpdateChallengeTasks={(newTasks: any) => {
            if (!challenges.main) return;
            const updated = { ...challenges.main, kpis: newTasks };
            setChallenges(prev => ({ ...prev, main: updated }));
            // Persist to Supabase
            if (sb && user) {
              if (newTasks?.length === 0) return; // safety guard — never wipe all tasks
              const rows = newTasks?.map((t: any, i: any) => ({
                challenge_id: challenges.main?.id,
                key: t.key,
                label: t.label,
                cat: t.cat || 'other',
                non_neg: t.nonNeg || false,
                sort_order: i,
              }));
              sb.from("challenge_tasks")
                .upsert(rows, { onConflict: "challenge_id,key" })
                .then(() => {});
            }
          }}
          regimen={regimen}
          onUpdateRegimen={setRegimen}
          regimenChecked={regimenChecked}
          toggleRegimen={toggleRegimen}
          tempChecked={tempChecked}
          toggleTemp={toggleTemp}
          dayType={dayType}
          onSetDayType={setDayType}
          secondaryKpis={secondaryKpis}
          toggleSecondary={toggleSecondary}
          talosInsight={null}
          onRefreshTalos={() => {}}
          mission={mission}
          onSaveMission={handleSaveMission}
          momentum={momentum}
        />
      );
    }
    if (page==="wall")     return <Wall challenge={activeChallenge} challenges={challenges} checkins={checkins} allCheckins={allCheckins} challengeHistory={challengeHistory} focusSessions={focusSessions} focusLoading={focusLoading} />;
    if (page==="library")  return isMobile
      ? <LibraryMobile onPick={(t,isSec)=>handleLibPick(t,isSec)} hasMain={!!challenges.main} />
      : <LibraryDesktop onPick={(t,isSec)=>handleLibPick(t,isSec)} hasMain={!!challenges.main} />;
    if (page==="schedule") return isMobile
      ? <ScheduleMobile sb={sb} user={user} challenges={challenges} kpis={kpis} toggle={toggle} regimen={regimen} regimenChecked={regimenChecked} toggleRegimen={toggleRegimen} googleSync={googleSync} />
      : <SchedulePage sb={sb} user={user} challenges={challenges} kpis={kpis} toggle={toggle} regimen={regimen} regimenChecked={regimenChecked} toggleRegimen={toggleRegimen} googleSync={googleSync} />;
    if (page==="partners") return <Partners user={user} profile={profile} challenges={challenges} sb={sb} />;
    if (page==="settings") return <SettingsScreen theme={theme} setTheme={setTheme} tone={tone} setTone={setTone} userName={userName} setUserName={setUserName} onSaveProfile={saveProfile} profile={profile} challenges={challenges} onDeleteChallenge={handleDeleteChallenge} onDeleteAccount={handleDeleteAccount} sb={sb} googleSync={googleSync} />;
    if (page==="talos") return (
      <div className="page talos-page">
        <Talos
          challenge={activeChallenge}
          kpis={kpis}
          loggedToday={loggedToday}
          tone={tone}
          sb={sb}
          user={user}
          challenges={challenges}
          onTickTasks={(keys) => {
            setKpis(prev => {
              const updated = { ...prev };
              keys.forEach(k => { updated[k] = true; });
              // Persist to Supabase — same as toggle()
              if (sb && user && challenges.main) {
                const today = new Date().toISOString().split("T")[0];
                const completed = Object.entries(updated).filter(([,v])=>v).map(([k])=>k);
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
              return updated;
            });
          }}
          onLogDay={() => {
            const safeTasks = activeChallenge.kpis || [];
            const done = safeTasks.filter(t => kpis[t.key]).length;
            handleLogDay(done, safeTasks.length);
          }}
        />
      </div>
    );
  };

  // ── Stage routing ─────────────────────────────────────────
  // authReady = Supabase has resolved the session (user is no longer undefined)
  if (stage==="loader")    return <Entry authReady={user !== undefined} mode={loaderMode} onDone={()=>{ if(!user) setStage("auth"); else if(profile&&!profile.onboarded) setStage("ob_why"); else setStage("app"); }} />;
  if (stage === "auth_check") { /* fall through to auth/app */ }
  if (stage==="auth")      return <AuthScreen onAuthed={handleAuthed} />;
  if (stage==="ob_why")    return <OnboardWhy   onNext={()=>setStage("ob_who")}      onSkip={handleOnboardDone} />;
  if (stage==="ob_who")    return <OnboardWho   onNext={()=>setStage("ob_induct")}   onSkip={handleOnboardDone} />;
  if (stage==="ob_induct") return <OnboardInduct onDone={()=>setStage("ob_challenge")} userName={userName} />;
  if (stage==="ob_challenge") return <OnboardChallenge onStart={(t, customTasks)=>{ handleStartChallenge({ name:t.name, days:t.duration, mission:"", nonNeg:[], tasks:customTasks||t.kpis, isSecondary:false, tag:t.tag }); handleOnboardDone(); }} onSkip={handleOnboardDone} />;
  if (dw && stage==="app") return <DeepWorkBoundary onExit={()=>setDW(false)}><DeepWork challenge={activeChallenge} kpis={kpis} toggle={toggle} onExit={()=>setDW(false)} sb={sb} user={user} onSessionSaved={loadFocusSessions} /></DeepWorkBoundary>;

  return (
    <>
      <DynamicBackground theme={theme} accentRGB={accentRGB} />
      <div className="shell" style={{ position: "relative", zIndex: 1 }}>
      <nav className="rail">
        <Avatar name={userName} size={39} onClick={handleAvatarClick} imageUrl={profileImageUrl} />
        <div className="rail-nav">
          {NAV.map(n=>(
            <div key={n.id} id={`tut-${n.id}`} className={`rail-btn ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
              {n.icon}<div className="rtip">{n.tip}</div>
            </div>
          ))}
        </div>
      </nav>
      <div className="main">
        <div className="topbar">
          <div className="topbar-date f-mono">{fmtDate()}</div>
          <div className="topbar-r">
            <div className="lvl-chip-wrap">
              <div className="lvl-chip" style={{color:level.color,borderColor:`${level.color}30`}}>
                <div className="lvl-dot" style={{background:level.color}} />{level.label}
              </div>
              <div className="lvl-tooltip">
                <div className="lvl-tooltip-header">
                  <span className="f-mono" style={{fontSize:10,color:"var(--text-2)",letterSpacing:".1em"}}>TOTAL DAYS FORGED</span>
                  <span style={{fontSize:18,fontWeight:500,color:"var(--text-0)"}}>{totalDaysForged}</span>
                </div>
                <div className="lvl-tooltip-list">
                  {LEVELS.map((l, _i) => {
                    const isActive = l.id === level.id;
                    const isAchieved = totalDaysForged >= l.minDays;
                    return (
                      <div key={l.id} className={`lvl-tooltip-row ${isActive ? "active" : ""}`}>
                        <div className="lvl-tooltip-dot" style={{background: isAchieved ? l.color : "var(--bg-3)"}} />
                        <span style={{color: isAchieved ? l.color : "var(--text-2)", flex:1}}>{l.label}</span>
                        <span className="f-mono" style={{fontSize:10,color:"var(--text-2)"}}>{l.minDays}</span>
                      </div>
                    );
                  })}
                </div>
                {nextLevel && (
                  <div className="lvl-tooltip-footer">
                    <span style={{color:"var(--text-2)",fontSize:12}}>{daysToNext} days to {nextLevel.label}</span>
                  </div>
                )}
              </div>
            </div>
            <button id="tut-deepwork" className="btn btn-g" style={{padding:"5px 13px",fontSize:12}} onClick={()=>setDW(true)}>⚡ Deep Work</button>
            {user && <button className="btn btn-g" style={{padding:"5px 13px",fontSize:12,borderColor:"var(--err)30",color:"var(--text-2)"}} onClick={()=>sb&&sb.auth.signOut()}>↩</button>}
          </div>
        </div>
        {renderPage()}
      </div>
      {modal && <ChallengeWizard tpl={modal} isSecondary={modal._mode==="secondary"} maxDays={modal.maxDays} onClose={()=>setModal(null)} onStart={handleStartChallenge} />}

      {/* Post-setup: add to timetable prompt */}
      {showSchedulePrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-1)", borderRadius: 16, padding: 28, maxWidth: 360, width: "90%", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: ".04em", color: "var(--text-0)", marginBottom: 8 }}>Challenge Started</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-1)", lineHeight: 1.5, marginBottom: 24 }}>
              Would you like to add your tasks to the weekly timetable now?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowSchedulePrompt(false); setPage("schedule"); }}
                style={{ flex: 1, padding: "12px 0", background: "var(--accent)", border: "none", borderRadius: 10, fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: ".06em", color: "#080807", cursor: "pointer" }}>
                Add to Schedule
              </button>
              <button onClick={() => setShowSchedulePrompt(false)}
                style={{ flex: 1, padding: "12px 0", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "var(--text-2)", cursor: "pointer" }}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
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
      <ProfilePanel
        open={showProfile}
        onClose={() => setShowProfile(false)}
        userName={userName}
        memberSince={user?.created_at}
        mission={mission}
        challenge={activeChallenge}
        checkins={Object.entries(checkins).map(([date, score]) => ({ date, score })) as any}
        longestStreak={activeChallenge?.streak || 0}
        consistency={activeChallenge?.consistency || 0}
        daysForged={totalDaysForged}
        badges={[]}
        levels={LEVELS}
        profileImageUrl={profileImageUrl}
        onUploadImage={handleProfileImageUpload}
      />
      <SparkCanvas trigger={sparkTrigger} />
      </div>
    </>
  );
}