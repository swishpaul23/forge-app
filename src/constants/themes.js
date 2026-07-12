// Theme color definitions
// Each theme provides CSS custom properties for the app

// Elevation + typography vars, additive to the per-theme palette below.
// Only two variants exist (dark / light) rather than one per theme, since
// that's what DynamicBackground's card-transparency spec actually defined —
// see LIGHT_THEMES in DynamicBackground.tsx for which theme ids get which.
const ELEVATION_DARK = {
  "--bg-page":       "rgba(5,5,4,0.60)",
  "--bg-card":       "rgba(12,12,10,0.75)",
  "--bg-card-inner": "rgba(17,17,16,0.80)",
  "--text-label":    "#6A6560",
  "--text-sub":      "#8A8580",
  "--text-body":     "#B8B4AE",
  "--text-primary":  "#EDEAE3",
};

const ELEVATION_LIGHT = {
  "--bg-page":       "rgba(245,244,240,0.65)",
  "--bg-card":       "rgba(255,253,248,0.78)",
  "--bg-card-inner": "rgba(248,246,240,0.82)",
  "--text-label":    "#6A6560",
  "--text-sub":      "#4A4744",
  "--text-body":     "#2A2A26",
  "--text-primary":  "#0A0A08",
};

export const THEMES = {
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
    "--text-1": "#B8B4AE",
    "--text-2": "#8A857E",
    "--text-3": "#2E2C28",
    "--border-0": "#1E1E1A",
    "--border-1": "#2A2A25",
    "--border-accent": "#D4922A30",
    "--ok": "#5DBF8A",
    "--warn": "#D4B22A",
    "--err": "#BF5D5D",
    ...ELEVATION_DARK,
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
    "--text-1": "#3A3835",
    "--text-2": "#6A6560",
    "--text-3": "#A8A49E",
    "--border-0": "#DDD9D2",
    "--border-1": "#CECAC2",
    "--border-accent": "#2A4A3830",
    "--ok": "#2A6644",
    "--warn": "#7A5C1A",
    "--err": "#7A2A2A",
    ...ELEVATION_LIGHT,
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
    "--text-1": "#A0A8B8",
    "--text-2": "#6A7488",
    "--text-3": "#242C38",
    "--border-0": "#161A28",
    "--border-1": "#1E2438",
    "--border-accent": "#4A8FD430",
    "--ok": "#4AD48A",
    "--warn": "#D4B24A",
    "--err": "#D44A4A",
    ...ELEVATION_DARK,
  },
};

export const ALL_THEMES = {
  forge: {
    label: "Forge",
    desc: "Dark industrial. The original.",
    swatch: "#D4922A",
    vars: THEMES.forge,
  },
  slate: {
    label: "Slate",
    desc: "Clean parchment. Eyes-first.",
    swatch: "#2A4A38",
    vars: THEMES.slate,
  },
  iron: {
    label: "Iron",
    desc: "Cold blue steel. Night sessions.",
    swatch: "#4A8FD4",
    vars: THEMES.iron,
  },
  neutrals: {
    label: "Elevated Neutrals",
    desc: "Calm & Clarity. Warm greys, zero noise.",
    swatch: "#8C7355",
    vars: {
      "--bg-0": "#FAF8F5", "--bg-1": "#F0EDE8", "--bg-2": "#E6E2DB", "--bg-3": "#D8D3CB", "--bg-4": "#FFFFFF",
      "--accent": "#8C7355", "--accent-lo": "#8C735514", "--accent-mid": "#8C735545",
      "--text-0": "#1A1816", "--text-1": "#605A52", "--text-2": "#706A62", "--text-3": "#C8C2BA",
      "--border-0": "#E0DCD4", "--border-1": "#CECAC2", "--border-accent": "#8C735530",
      "--ok": "#4A7C59", "--warn": "#B8880A", "--err": "#A03030",
      ...ELEVATION_LIGHT,
    },
  },
  digital: {
    label: "Digital Trust",
    desc: "Finance & Habit. Blue-green authority.",
    swatch: "#0DBEAA",
    vars: {
      "--bg-0": "#070E12", "--bg-1": "#0B1520", "--bg-2": "#10202E", "--bg-3": "#162A38", "--bg-4": "#1C3344",
      "--accent": "#0DBEAA", "--accent-lo": "#0DBEAA18", "--accent-mid": "#0DBEAA50",
      "--text-0": "#DFF4F0", "--text-1": "#6FA8A0", "--text-2": "#3A6860", "--text-3": "#1E3C38",
      "--border-0": "#162A38", "--border-1": "#1E3844", "--border-accent": "#0DBEAA30",
      "--ok": "#2DD4AA", "--warn": "#F0C040", "--err": "#E05050",
      ...ELEVATION_DARK,
    },
  },
  dusk: {
    label: "Future Dusk",
    desc: "Focus & Mystery. Deep work sessions.",
    swatch: "#8B5CF6",
    vars: {
      "--bg-0": "#08060F", "--bg-1": "#0F0B1C", "--bg-2": "#161028", "--bg-3": "#1E1636", "--bg-4": "#261E42",
      "--accent": "#8B5CF6", "--accent-lo": "#8B5CF618", "--accent-mid": "#8B5CF650",
      "--text-0": "#EDE8FF", "--text-1": "#8A80B0", "--text-2": "#4A4268", "--text-3": "#2C2648",
      "--border-0": "#1E1636", "--border-1": "#2A2048", "--border-accent": "#8B5CF630",
      "--ok": "#6EE7B7", "--warn": "#FBBF24", "--err": "#F87171",
      ...ELEVATION_DARK,
    },
  },
  pastel: {
    label: "Sunwashed Pastels",
    desc: "Energy & Joy. Casual planning, students.",
    swatch: "#E07B4A",
    vars: {
      "--bg-0": "#FFFBF7", "--bg-1": "#FFF3EA", "--bg-2": "#FFE8D6", "--bg-3": "#FFD9C0", "--bg-4": "#FFFFFF",
      "--accent": "#E07B4A", "--accent-lo": "#E07B4A14", "--accent-mid": "#E07B4A44",
      "--text-0": "#2A1A10", "--text-1": "#7A5040", "--text-2": "#7A5848", "--text-3": "#D8C0B0",
      "--border-0": "#F5DDD0", "--border-1": "#EAC8B4", "--border-accent": "#E07B4A30",
      "--ok": "#3DA870", "--warn": "#E0A020", "--err": "#D04040",
      ...ELEVATION_LIGHT,
    },
  },
  mono: {
    label: "Monochrome+",
    desc: "Precision & Speed. One colour, max clarity.",
    swatch: "#E8E8E8",
    vars: {
      "--bg-0": "#080808", "--bg-1": "#111111", "--bg-2": "#191919", "--bg-3": "#222222", "--bg-4": "#2C2C2C",
      "--accent": "#F0F0F0", "--accent-lo": "#F0F0F014", "--accent-mid": "#F0F0F040",
      "--text-0": "#F8F8F8", "--text-1": "#888888", "--text-2": "#444444", "--text-3": "#282828",
      "--border-0": "#222222", "--border-1": "#2E2E2E", "--border-accent": "#F0F0F025",
      "--ok": "#70C070", "--warn": "#C0A030", "--err": "#C04040",
      ...ELEVATION_DARK,
    },
  },
  orbit: {
    label: "Orbit Navy",
    desc: "Deep space blue. Electric accent.",
    swatch: "#0066FF",
    vars: {
      "--bg-0": "#0A1024", "--bg-1": "#0D1530", "--bg-2": "#121A38", "--bg-3": "#182040", "--bg-4": "#1E2850",
      "--accent": "#0066FF", "--accent-lo": "#0066FF18", "--accent-mid": "#0066FF50",
      "--text-0": "#E8EEFF", "--text-1": "#7A9ACC", "--text-2": "#3A5A88", "--text-3": "#1A2A50",
      "--border-0": "#182040", "--border-1": "#1E2A50", "--border-accent": "#0066FF35",
      "--ok": "#3DD68C", "--warn": "#F5C542", "--err": "#FF4D4D",
      ...ELEVATION_DARK,
    },
  },
  mars: {
    label: "Mars Red",
    desc: "Dark charcoal. Aggressive red accent.",
    swatch: "#FF3B3B",
    vars: {
      "--bg-0": "#11131A", "--bg-1": "#161820", "--bg-2": "#1C1E28", "--bg-3": "#222530", "--bg-4": "#282C38",
      "--accent": "#FF3B3B", "--accent-lo": "#FF3B3B18", "--accent-mid": "#FF3B3B50",
      "--text-0": "#F0EAE8", "--text-1": "#9A8A88", "--text-2": "#504848", "--text-3": "#2C2828",
      "--border-0": "#1C1E28", "--border-1": "#282A38", "--border-accent": "#FF3B3B35",
      "--ok": "#4AD48A", "--warn": "#F0C040", "--err": "#FF3B3B",
      ...ELEVATION_DARK,
    },
  },
  plasma: {
    label: "Plasma Orange",
    desc: "Core black. High-voltage orange.",
    swatch: "#FF5E00",
    vars: {
      "--bg-0": "#0E0E12", "--bg-1": "#131318", "--bg-2": "#18181F", "--bg-3": "#1E1E26", "--bg-4": "#24242E",
      "--accent": "#FF5E00", "--accent-lo": "#FF5E0018", "--accent-mid": "#FF5E0050",
      "--text-0": "#F2EDE8", "--text-1": "#9A8878", "--text-2": "#504438", "--text-3": "#2C2620",
      "--border-0": "#18181F", "--border-1": "#242026", "--border-accent": "#FF5E0035",
      "--ok": "#4AD48A", "--warn": "#F5C040", "--err": "#FF4444",
      ...ELEVATION_DARK,
    },
  },
};

export const THEME_ORDER = [
  "forge", "slate", "iron", "neutrals", "digital",
  "dusk", "pastel", "mono", "orbit", "mars", "plasma"
];

export function applyThemeVars(themeId) {
  const t = ALL_THEMES[themeId];
  if (!t) return;
  Object.entries(t.vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
    document.body.style.setProperty(k, v);
  });
}
