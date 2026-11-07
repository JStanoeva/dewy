import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDewyTheme } from '@/theme/ThemeProvider';

export function Screen({ children }: { children: ReactNode }) {
  const { palette, paletteName } = useDewyTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={paletteName === 'morning' ? 'dark' : 'light'} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
