import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { palettes, type Palette, type PaletteName } from './palettes';
import { getClockPeriod, type Period } from './period';

type ThemeValue = {
  palette: Palette;
  paletteName: PaletteName;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => getClockPeriod());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPeriod(getClockPeriod());
      }
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo(() => ({ palette: palettes[period], paletteName: period }), [period]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useDewyTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useDewyTheme must be used inside ThemeProvider');
  }
  return value;
}
