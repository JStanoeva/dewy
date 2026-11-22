import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useDewyTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  edges?: readonly Edge[];
  // Overrides the palette's style where something other than the background sits under the status bar.
  statusBarStyle?: 'light' | 'dark';
  // Fades in a strip of background under the status bar, so a scrolled list doesn't show behind the clock.
  statusBarBackdrop?: boolean;
};

export function Screen({ children, edges, statusBarStyle, statusBarBackdrop }: ScreenProps) {
  const { palette, paletteName } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const [backdropOpacity] = useState(() => new Animated.Value(statusBarBackdrop ? 1 : 0));

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: statusBarBackdrop ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [statusBarBackdrop, backdropOpacity]);

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={statusBarStyle ?? (paletteName === 'morning' ? 'dark' : 'light')} />
      <NavigationBar style={paletteName === 'morning' ? 'dark' : 'light'} />
      {children}
      {statusBarBackdrop === undefined ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.statusBarBackdrop,
            { height: insets.top, backgroundColor: palette.background, opacity: backdropOpacity },
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
