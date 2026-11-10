import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  // A button pinned to the bottom of the screen casts the artboards' stronger shadow.
  pinned?: boolean;
};

export function AppButton({ title, onPress, loading = false, pinned = false }: AppButtonProps) {
  const { palette } = useDewyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.primary,
          boxShadow: pinned ? palette.pinnedCtaShadow : palette.ctaShadow,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.onPrimary} />
      ) : (
        <Text style={[styles.title, { color: palette.onPrimary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    borderRadius: radii.pill,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.button,
  },
});
