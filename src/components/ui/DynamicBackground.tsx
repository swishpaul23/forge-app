import { useEffect, useRef } from "react";
import { contours } from "d3-contour";
import { createNoise3D, type NoiseFunction3D } from "simplex-noise";

type BgType = "node_grid" | "topography" | "particle_void";

// Real theme IDs from src/constants/themes.js (THEME_ORDER). The original spec
// used descriptive names (plasma_orange, monochrome, orbit_navy,
// elevated_neutrals, future_dusk, mars_red) that don't exist as IDs here — they
// are translated to the actual IDs below, otherwise those themes would fall
// through to the default renderer. `pastel` was missing from the spec's map and
// is assigned topography (it's a soft light theme).
const THEME_BG_MAP: Record<string, BgType> = {
  forge:          "particle_void",
  plasma:         "particle_void", // spec: plasma_orange
  mono:           "particle_void", // spec: monochrome
  dusk:           "particle_void", // spec: future_dusk
  mars:           "particle_void", // spec: mars_red
  orbit:          "node_grid",     // spec: orbit_navy
  iron:           "node_grid",
  slate:          "node_grid",
  tensor_violet:  "node_grid",
  neutrals:       "topography",    // spec: elevated_neutrals
  digital:        "topography",
  pastel:         "topography",    // not in spec — assigned here
  alpha_green:    "topography",
  glacial_silver: "topography",
};

// Themes with a light --bg-0. mono is intentionally NOT here despite the spec
// listing "monochrome": mono is a dark theme (--bg-0 #080808). Only topography
// reads isLight, and mono maps to particle_void anyway, so including it would be
// both incorrect and inert.
const LIGHT_THEMES = new Set(["slate", "neutrals", "pastel", "glacial_silver"]);

type Mouse = { x: number; y: number };
type Rgb = [number, number, number];
type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: Rgb };

const rgba = (rgb: Rgb, a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

// ── Colour helpers (for particle hue variation) ──────────────────────────
function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ── Renderer 1 — Reactive Node Grid ──────────────────────────────────────
// A 60px dot grid. Dots near the cursor brighten and connect hair-thin lines
// to their 2 nearest activated neighbours. Base opacity 0.12 + subtle pulse.
// Dot count is inherently ~ (W*H)/3600 at 60px spacing (the spec's cap).
function renderNodeGrid(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: Rgb, isLight: boolean, tRef: { current: number }
) {
  tRef.current += 0.005;
  const t = tRef.current;
  ctx.clearRect(0, 0, W, H);

  // On light themes the accent is too pale over a light surface — use dark nodes.
  const nodeColor: Rgb = isLight ? [30, 30, 30] : accent;
  const spacing = 60;
  const R = 120; // cursor influence radius
  const mx = mouse.x * W, my = mouse.y * H;
  const cols = Math.floor(W / spacing) + 1;
  const rows = Math.floor(H / spacing) + 1;

  // Activated dots — only iterate the grid cells inside the cursor's bounding box.
  const activated: { x: number; y: number }[] = [];
  const ci0 = Math.max(0, Math.floor((mx - R) / spacing));
  const ci1 = Math.min(cols, Math.ceil((mx + R) / spacing));
  const rj0 = Math.max(0, Math.floor((my - R) / spacing));
  const rj1 = Math.min(rows, Math.ceil((my + R) / spacing));
  for (let i = ci0; i <= ci1; i++) {
    for (let j = rj0; j <= rj1; j++) {
      const x = i * spacing, y = j * spacing;
      if (Math.hypot(x - mx, y - my) < R) activated.push({ x, y });
    }
  }

  // Connect each activated dot to its 2 nearest activated neighbours.
  const lineFactor = isLight ? 0.28 : 0.15;
  ctx.lineWidth = isLight ? 0.8 : 0.5;
  for (let a = 0; a < activated.length; a++) {
    const A = activated[a];
    let n1 = -1, n2 = -1, d1 = Infinity, d2 = Infinity;
    for (let b = 0; b < activated.length; b++) {
      if (b === a) continue;
      const dd = Math.hypot(A.x - activated[b].x, A.y - activated[b].y);
      if (dd < d1)      { d2 = d1; n2 = n1; d1 = dd; n1 = b; }
      else if (dd < d2) { d2 = dd; n2 = b; }
    }
    ([[n1, d1], [n2, d2]] as [number, number][]).forEach(([n, dd]) => {
      if (n < 0) return;
      const lineO = (1 - dd / R) * lineFactor;
      if (lineO <= 0) return;
      ctx.strokeStyle = rgba(nodeColor, lineO);
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(activated[n].x, activated[n].y);
      ctx.stroke();
    });
  }

  // Draw the full grid of base dots with a subtle per-dot pulse; brighten those
  // within the cursor radius. Light themes get a stronger base/radius — the
  // now-solid card surfaces (--bg-card-solid) leave much less visible canvas
  // area in the gaps, so the same dark-on-light dot needs more presence there
  // to still read at a glance.
  const baseO = isLight ? 0.22 : 0.12;
  const reactO = isLight ? 0.45 : 0.35;
  const radius = isLight ? 1.6 : 1.2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * spacing, y = j * spacing;
      const dist = Math.hypot(x - mx, y - my);
      let o = baseO;
      if (dist < R) o = baseO + (1 - dist / R) * reactO;
      o *= 0.92 + 0.08 * Math.sin(t + i * rows + j);
      ctx.fillStyle = rgba(nodeColor, o);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Renderer 2 — Ambient Topography ──────────────────────────────────────
// True contour lines: a simplex-noise field sampled over an 80×60 grid, panned
// by animating the noise z-offset, run through d3-contour's marching squares at
// 9 threshold levels. Each contour is drawn as a Path2D scaled from grid space
// to canvas space. No cursor interaction — pure ambient animation.
const TOPO_GW = 80;
const TOPO_GH = 60;
const TOPO_LEVELS = 9;
// Thresholds spread across the simplex range (~-1..1), interior levels only.
const TOPO_THRESHOLDS = Array.from(
  { length: TOPO_LEVELS },
  (_, i) => -1 + (2 * (i + 1)) / (TOPO_LEVELS + 1)
);
const topoContourGen = contours().size([TOPO_GW, TOPO_GH]).thresholds(TOPO_THRESHOLDS);

function renderTopography(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  accent: Rgb, isLight: boolean, tRef: { current: number },
  noiseRef: { current: NoiseFunction3D | null }
) {
  tRef.current += 0.0012;
  const t = tRef.current;
  ctx.clearRect(0, 0, W, H);

  if (!noiseRef.current) noiseRef.current = createNoise3D();
  const noise3D = noiseRef.current;

  // Sample the animated noise field. z = t pans the field slowly over time.
  const values: number[] = new Array(TOPO_GW * TOPO_GH);
  for (let y = 0; y < TOPO_GH; y++) {
    for (let x = 0; x < TOPO_GW; x++) {
      values[y * TOPO_GW + x] = noise3D(x * 0.08, y * 0.08, t);
    }
  }

  const polygons = topoContourGen(values);
  const scaleX = W / TOPO_GW;
  const scaleY = H / TOPO_GH;

  ctx.lineWidth = isLight ? 0.8 : 1.0;
  ctx.strokeStyle = rgba(accent, isLight ? 0.12 : 0.25);

  for (const contour of polygons) {
    const path = new Path2D();
    for (const polygon of contour.coordinates) {
      for (const ring of polygon) {
        for (let i = 0; i < ring.length; i++) {
          const X = ring[i][0] * scaleX;
          const Y = ring[i][1] * scaleY;
          if (i === 0) path.moveTo(X, Y);
          else path.lineTo(X, Y);
        }
      }
    }
    ctx.stroke(path);
  }
}

// ── Renderer 3 — Particle Void ───────────────────────────────────────────
// 80 particles drifting upward, each hue-shifted ±15° from the accent. The
// cursor repels particles within 80px. Velocity clamped to ±1.5.
function seedParticles(W: number, H: number, accent: Rgb, isLight: boolean): Particle[] {
  const [h, s, l] = rgbToHsl(accent);
  return Array.from({ length: 80 }, () => {
    const hue = (h + (Math.random() * 30 - 15) + 360) % 360;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.random() * 0.16 - 0.08,   // -0.08 .. +0.08
      vy: -(0.04 + Math.random() * 0.11), // -0.15 .. -0.04 (upward)
      size: 0.8 + Math.random() * 1.4,    // 0.8 .. 2.2
      opacity: 0.1 + Math.random() * 0.3, // 0.1 .. 0.4
      // Dark particles on light themes so they're visible over a light surface.
      color: isLight ? ([20, 20, 20] as Rgb) : hslToRgb(hue, s, l),
    };
  });
}

function renderParticleVoid(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: Rgb, isLight: boolean, tRef: { current: number },
  particlesRef: { current: Particle[] | null }
) {
  tRef.current += 0.012;
  ctx.clearRect(0, 0, W, H);
  if (!particlesRef.current) particlesRef.current = seedParticles(W, H, accent, isLight);
  const ps = particlesRef.current;
  const mx = mouse.x * W, my = mouse.y * H;

  for (const p of ps) {
    p.x += p.vx;
    p.y += p.vy;

    // Reset above the top edge back to the bottom.
    if (p.y < 0) { p.y = H; p.x = Math.random() * W; }
    // Wrap horizontally so repelled particles don't vanish off the sides.
    if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;

    // Cursor repulsion.
    const dx = p.x - mx, dy = p.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 80 && dist > 0) {
      const f = 1 - dist / 80;
      p.vx += (dx / dist) * f * 0.4;
      p.vy += (dy / dist) * f * 0.4;
    }

    // Clamp velocity.
    p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
    p.vy = Math.max(-1.5, Math.min(1.5, p.vy));

    ctx.fillStyle = rgba(p.color, p.opacity);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface DynamicBackgroundProps {
  theme: string;
  accentRGB: [number, number, number];
}

export default function DynamicBackground({ theme, accentRGB }: DynamicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const mouseRef = useRef<Mouse>({ x: 0.5, y: 0.5 });
  const smoothRef = useRef<Mouse>({ x: 0.5, y: 0.5 });
  const tRef = useRef(0);
  const noiseRef = useRef<NoiseFunction3D | null>(null);
  const particlesRef = useRef<Particle[] | null>(null);

  // Mouse tracking — ref only, never state, so mousemove never re-renders.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Canvas pixel size tracks the viewport.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-seed particles for the new dimensions.
      particlesRef.current = null;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Restarts the render loop on theme (or resolved accent) change: cancels the
  // current frame, clears the canvas, resets the time accumulator and the
  // renderer-specific state so the new background type starts clean.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tRef.current = 0;
    noiseRef.current = null;
    particlesRef.current = null;

    const isLight = LIGHT_THEMES.has(theme);
    const bgType: BgType = THEME_BG_MAP[theme] ?? "particle_void";

    const loop = () => {
      if (!document.hidden) {
        // Cursor influence: smooth lerp at 0.06 per frame.
        smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.06;
        smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.06;
        const W = canvas.width, H = canvas.height;

        switch (bgType) {
          case "node_grid":     renderNodeGrid(ctx, W, H, smoothRef.current, accentRGB, isLight, tRef); break;
          case "topography":    renderTopography(ctx, W, H, accentRGB, isLight, tRef, noiseRef); break;
          case "particle_void": renderParticleVoid(ctx, W, H, smoothRef.current, accentRGB, isLight, tRef, particlesRef); break;
        }
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    loop();

    const onVisibilityChange = () => {
      if (document.hidden && frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      } else if (!document.hidden && frameRef.current === null) {
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // accentRGB is destructured to primitives so an upstream array recreated
    // with the same values doesn't restart the loop unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, accentRGB[0], accentRGB[1], accentRGB[2]]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
