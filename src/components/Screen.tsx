import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useDewyTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  edges?: readonly Edge[];
  // Overrides the palette's style where something other than the background sits under the status bar.
  statusBarStyle?: 'light' | 'dark';
};

export function Screen({ children, edges, statusBarStyle }: ScreenProps) {
  const { palette, paletteName } = useDewyTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={statusBarStyle ?? (paletteName === 'morning' ? 'dark' : 'light')} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
