import { useState, useEffect, useCallback } from 'react';
import { applyThemeVars, ALL_THEMES, THEME_ORDER } from '../constants/themes';

/**
 * Hook for managing theme state
 * Persists to localStorage and applies CSS variables
 */
export function useTheme(defaultTheme = 'forge') {
  const [theme, setThemeState] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('forge_theme');
    return saved && ALL_THEMES[saved] ? saved : defaultTheme;
  });

  // Apply theme vars on mount and when theme changes
  useEffect(() => {
    applyThemeVars(theme);
    localStorage.setItem('forge_theme', theme);
  }, [theme]);

  // Setter that also applies vars
  const setTheme = useCallback((id) => {
    if (ALL_THEMES[id]) {
      setThemeState(id);
    }
  }, []);

  // Get current theme config
  const themeConfig = ALL_THEMES[theme];

  return {
    theme,
    setTheme,
    themeConfig,
    allThemes: ALL_THEMES,
    themeOrder: THEME_ORDER,
  };
}
