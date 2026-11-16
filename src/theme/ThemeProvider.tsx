import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { palettes, type Palette, type PaletteName } from './palettes';
import { getClockPeriod, getClockSlot, type Period } from './period';

type ThemeValue = {
  palette: Palette;
  paletteName: PaletteName;
  // The ritual Today shows; the palette follows it.
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(() => {
    const now = new Date();
    return { period: getClockPeriod(now), slot: getClockSlot(now) };
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date();
        const slot = getClockSlot(now);
        setActive((current) =>
          current.slot === slot ? current : { period: getClockPeriod(now), slot },
        );
      }
    });
    return () => subscription.remove();
  }, []);

  const setActivePeriod = useCallback((next: Period) => {
    setActive({ period: next, slot: getClockSlot() });
  }, []);

  const value = useMemo(
    () => ({
      palette: palettes[active.period],
      paletteName: active.period,
      activePeriod: active.period,
      setActivePeriod,
    }),
    [active.period, setActivePeriod],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

// Auth and Onboarding have no ritual switch, so their setter does nothing.
const morningTheme: ThemeValue = {
  palette: palettes.morning,
  paletteName: 'morning',
  activePeriod: 'morning',
  setActivePeriod: () => {},
};

// Auth and Onboarding are designed only in Morning colours, whatever the active period.
export function MorningTheme({ children }: { children: ReactNode }) {
  return <ThemeContext value={morningTheme}>{children}</ThemeContext>;
}

export function useDewyTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useDewyTheme must be used inside ThemeProvider');
  }
  return value;
}
