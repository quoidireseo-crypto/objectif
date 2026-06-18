import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'skopos_theme';

const isEveningHours = () => {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
};

const computeEffective = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'auto') return isEveningHours() ? 'dark' : 'light';
  return mode;
};

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
  });

  const [effective, setEffective] = useState<'light' | 'dark'>(() => computeEffective(mode));

  useEffect(() => {
    setEffective(computeEffective(mode));
    if (mode !== 'auto') return;

    const interval = setInterval(() => setEffective(computeEffective(mode)), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effective === 'dark');
  }, [effective]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, newMode);
    setMode(newMode);
  }, []);

  return { mode, effective, setThemeMode };
}
