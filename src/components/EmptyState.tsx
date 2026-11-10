import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type EmptyStateProps = {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  const { palette } = useDewyTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: palette.onPrimary }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.screen * 2,
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
