import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
};

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  const { palette } = useDewyTheme();

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: retrying, busy: retrying }}
        disabled={retrying}
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.primary, opacity: retrying || pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.buttonLabel, { color: palette.onPrimary }]}>
          {retrying ? 'Trying again…' : 'Try again'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.screen,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.displayItalicRegular,
    fontSize: fontSizes.section,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    textAlign: 'center',
  },
  button: {
    height: minTouchTarget,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  buttonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
