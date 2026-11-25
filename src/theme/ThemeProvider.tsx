import * as SystemUI from 'expo-system-ui';
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
import { followClock, pickRitual, type Period } from './period';

// The colours follow the clock, never Today's switch.
type ThemeValue = {
  palette: Palette;
  paletteName: PaletteName;
};

type RitualValue = {
  ritualPeriod: Period;
  setRitualPeriod: (period: Period) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);
// The ritual Today shows, kept apart so a switch doesn't redraw every screen.
const RitualContext = createContext<RitualValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => followClock(null));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        setState((current) => followClock(current));
      }
    });
    return () => subscription.remove();
  }, []);

  // Android shows the window's own background behind screens while they animate.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palettes[state.clock].background);
  }, [state.clock]);

  const setRitualPeriod = useCallback((next: Period) => {
    setState(pickRitual(next));
  }, []);

  const theme = useMemo(
    () => ({ palette: palettes[state.clock], paletteName: state.clock }),
    [state.clock],
  );
  const ritual = useMemo(
    () => ({ ritualPeriod: state.ritual, setRitualPeriod }),
    [state.ritual, setRitualPeriod],
  );

  return (
    <ThemeContext value={theme}>
      <RitualContext value={ritual}>{children}</RitualContext>
    </ThemeContext>
  );
}

export function useDewyTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useDewyTheme must be used inside ThemeProvider');
  }
  return value;
}

export function useRitualPeriod() {
  const value = useContext(RitualContext);
  if (!value) {
    throw new Error('useRitualPeriod must be used inside ThemeProvider');
  }
  return value;
}
