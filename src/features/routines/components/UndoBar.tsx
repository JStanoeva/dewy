import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FAB_OVERHANG } from '@/navigation/DewyTabBar';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type UndoBarProps = {
  productName: string;
  onUndo: () => void;
};

// Floats above the tab bar while a swiped step can still come back, in the screen's opposite colour.
export function UndoBar({ productName, onUndo }: UndoBarProps) {
  const { palette } = useDewyTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={[styles.bar, { backgroundColor: palette.ink }]}
    >
      <View accessible accessibilityLabel={`${productName} removed`} style={styles.message}>
        <Text numberOfLines={1} style={[styles.name, { color: palette.background }]}>
          {productName}
        </Text>
        <Text style={[styles.text, { color: palette.background }]}>removed</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Undo removing ${productName}`}
        onPress={onUndo}
        style={({ pressed }) => [styles.undo, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.undoLabel, { color: palette.inkAccent }]}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    // Clears the tab bar's raised add button.
    bottom: FAB_OVERHANG + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xxs,
    borderRadius: radii.banner,
  },
  message: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
  },
  undo: {
    minWidth: minTouchTarget,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  undoLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
});
