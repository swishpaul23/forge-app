import { useEffect, useRef } from "react";

type BgType = "aurora" | "metal" | "ember" | "space";

// Actual theme IDs from src/constants/themes.js (THEME_ORDER) — not the
// elevated_neutrals/digital_trust/etc. names from the original spec, which
// don't exist in this codebase.
const THEME_BG_MAP: Record<string, BgType> = {
  forge:    "ember",
  slate:    "metal",
  iron:     "metal",
  neutrals: "aurora",
  digital:  "aurora",
  dusk:     "aurora",
  pastel:   "ember",
  mono:     "metal",
  orbit:    "space",
  mars:     "ember",
  plasma:   "aurora",
};

// Only these three themes actually have a light --bg-0 (verified against
// constants/themes.js) — "mono" (Monochrome+) is a dark theme with a
// near-white accent, not a light theme.
const LIGHT_THEMES = new Set(["slate", "neutrals", "pastel"]);

type Mouse = { x: number; y: number };
type Star = { x: number; y: number; size: number; brightness: number; twinklePhase: number; depth: number };

const rgba = (rgb: [number, number, number], a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

// ── Aurora — 3 drifting radial blobs, no base fill of its own (the themed
// page background already shows through beneath it) ──────────────────────
function renderAurora(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: [number, number, number], isLight: boolean, tRef: { current: number }
) {
  tRef.current += 0.007;
  const t = tRef.current;
  ctx.clearRect(0, 0, W, H);

  const maxOpacity = isLight ? 0.09 : 0.18;
  const maxDim = Math.max(W, H);
  const bases: [number, number][] = [[0.3, 0.3], [0.7, 0.5], [0.5, 0.75]];

  bases.forEach(([baseX, baseY], i) => {
    const phase = i * 2.1;
    const px = (baseX + Math.sin(t * 0.7 + phase) * 0.12 + (mouse.x - 0.5) * 0.18) * W;
    const py = (baseY + Math.cos(t * 0.5 + phase) * 0.10 + (mouse.y - 0.5) * 0.14) * H;
    const r = 0.55 * maxDim;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, rgba(accent, maxOpacity));
    grad.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });
}

// ── Liquid Metal — chrome ripples from the cursor + a diagonal shine sweep ─
function renderMetal(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: [number, number, number], isLight: boolean, tRef: { current: number }
) {
  tRef.current += 0.010;
  const t = tRef.current;

  ctx.fillStyle = isLight ? "#F6F5F1" : "#060708";
  ctx.fillRect(0, 0, W, H);

  const maxOpacity = isLight ? 0.04 : 0.08;
  const cx = mouse.x * W, cy = mouse.y * H;
  for (let i = 0; i < 3; i++) {
    const radius = 35 + i * 35 + Math.sin(t * 0.7 + i * 0.6) * 12;
    const grad = ctx.createRadialGradient(cx, cy, Math.max(radius - 10, 0), cx, cy, radius);
    grad.addColorStop(0, rgba(accent, maxOpacity * 1.4));
    grad.addColorStop(0.6, rgba(accent, maxOpacity));
    grad.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Diagonal chrome sweep — cycles across a 2W range so it fully exits the
  // screen before looping, rather than bouncing back and forth visibly.
  const sweepX = ((t * 0.25 + mouse.x * 0.4) % 2) * W;
  const shine = isLight ? "rgba(80,80,100,0.04)" : "rgba(220,228,240,0.07)";
  const shineTransparent = isLight ? "rgba(80,80,100,0)" : "rgba(220,228,240,0)";
  const bandWidth = W * 0.35;
  const grad = ctx.createLinearGradient(sweepX - bandWidth, 0, sweepX + bandWidth, H);
  grad.addColorStop(0, shineTransparent);
  grad.addColorStop(0.5, shine);
  grad.addColorStop(1, shineTransparent);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ── Ember — warm cursor-following glow + a slow secondary drift, no particles ─
function renderEmber(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: [number, number, number], isLight: boolean, tRef: { current: number }
) {
  tRef.current += 0.010;
  const t = tRef.current;

  ctx.fillStyle = isLight ? "#F7F4F0" : "#060504";
  ctx.fillRect(0, 0, W, H);

  const mainOpacity = isLight ? 0.07 : 0.14;
  const mx = mouse.x * W, my = mouse.y * H;
  const mainR = 0.65 * W;
  const mainGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mainR);
  mainGrad.addColorStop(0, rgba(accent, mainOpacity));
  mainGrad.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = mainGrad;
  ctx.fillRect(0, 0, W, H);

  const secOpacity = isLight ? 0.04 : 0.07;
  const px = (0.5 + Math.sin(t * 0.6) * 0.2) * W;
  const py = (0.35 + Math.cos(t * 0.4) * 0.12) * H;
  const secR = 0.35 * W;
  const secGrad = ctx.createRadialGradient(px, py, 0, px, py, secR);
  secGrad.addColorStop(0, rgba(accent, secOpacity));
  secGrad.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = secGrad;
  ctx.fillRect(0, 0, W, H);
}

// ── Deep Space — parallax star field + accent nebula. No light variant. ──
function renderSpace(
  ctx: CanvasRenderingContext2D, W: number, H: number, mouse: Mouse,
  accent: [number, number, number], tRef: { current: number }, starsRef: { current: Star[] | null }
) {
  tRef.current += 0.006;
  const t = tRef.current;

  if (!starsRef.current) {
    starsRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.2 + Math.random() * 1.2,
      brightness: Math.random(),
      twinklePhase: Math.random() * Math.PI * 2,
      depth: 0.2 + Math.random() * 0.8,
    }));
  }

  ctx.fillStyle = "#02030A";
  ctx.fillRect(0, 0, W, H);

  for (const star of starsRef.current) {
    const sx = (((star.x + (mouse.x - 0.5) * 0.06 * star.depth) % 1) + 1) % 1;
    const sy = (((star.y + (mouse.y - 0.5) * 0.04 * star.depth) % 1) + 1) % 1;
    const px = sx * W, py = sy * H;
    const alpha = (0.3 + star.brightness * 0.5) * (0.7 + 0.3 * Math.sin(t * 2 + star.twinklePhase));

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, star.size, 0, Math.PI * 2);
    ctx.fill();

    if (star.brightness > 0.85) {
      const flareLen = star.size * 5;
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px - flareLen, py); ctx.lineTo(px + flareLen, py);
      ctx.moveTo(px, py - flareLen); ctx.lineTo(px, py + flareLen);
      ctx.stroke();
    }
  }

  const nx = 0.4 * W, ny = 0.4 * H, nr = 0.55 * W;
  const nebula = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
  nebula.addColorStop(0, rgba(accent, 0.09));
  nebula.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);
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
  const starsRef = useRef<Star[] | null>(null);

  // Mouse tracking — ref only, never state, so mousemove never re-renders.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Canvas pixel size tracks the viewport (no devicePixelRatio scaling —
  // matches the plain W/H pixel math used by every renderer above).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Restarts the render loop on theme (or resolved accent colour) change:
  // cancels the current frame, clears the canvas, and resets the local
  // time accumulator so the new background type starts from a clean slate.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tRef.current = 0;

    const isLight = LIGHT_THEMES.has(theme);
    let bgType = THEME_BG_MAP[theme] ?? "ember";
    if (bgType === "space" && isLight) bgType = "metal"; // space has no light variant

    const loop = () => {
      if (!document.hidden) {
        smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.07;
        smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.07;
        const W = canvas.width, H = canvas.height;

        switch (bgType) {
          case "aurora": renderAurora(ctx, W, H, smoothRef.current, accentRGB, isLight, tRef); break;
          case "metal":  renderMetal(ctx, W, H, smoothRef.current, accentRGB, isLight, tRef); break;
          case "ember":  renderEmber(ctx, W, H, smoothRef.current, accentRGB, isLight, tRef); break;
          case "space":  renderSpace(ctx, W, H, smoothRef.current, accentRGB, tRef, starsRef); break;
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
    // with the same values (rather than the same reference) doesn't restart
    // the loop unnecessarily.
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
