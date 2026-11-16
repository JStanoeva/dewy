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
import { getClockPeriod, getRitualDate, type Period } from './period';

type ThemeValue = {
  palette: Palette;
  paletteName: PaletteName;
  // The ritual Today shows; the palette still follows the clock.
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

// One half of a ritual day, e.g. "2026-11-16:evening"; a picked period holds until the clock moves into the next one.
function clockSlot(now: Date) {
  return `${getRitualDate(now)}:${getClockPeriod(now)}`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => getClockPeriod());
  const [active, setActive] = useState(() => {
    const now = new Date();
    return { period: getClockPeriod(now), slot: clockSlot(now) };
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date();
        const slot = clockSlot(now);
        setPeriod(getClockPeriod(now));
        setActive((current) =>
          current.slot === slot ? current : { period: getClockPeriod(now), slot },
        );
      }
    });
    return () => subscription.remove();
  }, []);

  const setActivePeriod = useCallback((next: Period) => {
    setActive({ period: next, slot: clockSlot(new Date()) });
  }, []);

  const value = useMemo(
    () => ({
      palette: palettes[period],
      paletteName: period,
      activePeriod: active.period,
      setActivePeriod,
    }),
    [period, active.period, setActivePeriod],
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

// Auth and Onboarding are designed only in Morning colours, whatever the clock says.
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
