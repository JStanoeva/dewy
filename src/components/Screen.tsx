import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useDewyTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  edges?: readonly Edge[];
};

export function Screen({ children, edges }: ScreenProps) {
  const { palette, paletteName } = useDewyTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: palette.background }]}>
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
