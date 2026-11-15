import { useEffect, useRef, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type RemoveStepSheetProps = {
  productName: string;
  period: Period;
  removing: boolean;
  failed: boolean;
  onClose: () => void;
  onRemove: () => void;
};

// The Delete product confirm step; Cancel, the scrim and back stay enabled while it removes.
export function RemoveStepSheet({
  productName,
  period,
  removing,
  failed,
  onClose,
  onRemove,
}: RemoveStepSheetProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const titleRef = useRef<ComponentRef<typeof Text>>(null);

  useEffect(() => {
    if (titleRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
    }
  }, []);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.scrim }]}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: palette.surface, paddingBottom: spacing.screen + insets.bottom },
          ]}
        >
          <Text
            ref={titleRef}
            accessibilityRole="header"
            style={[styles.title, { color: palette.text }]}
          >
            Remove this <Text style={[styles.titleItalic, { color: palette.emphasis }]}>step?</Text>
          </Text>
          <Text style={[styles.message, { color: palette.textMuted }]}>
            <Text style={[styles.name, { color: palette.text }]}>{productName}</Text> comes out of
            your {period} ritual. It stays on your shelf.
          </Text>
          {failed ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[styles.error, { color: palette.warning }]}
            >
              We couldn&apos;t remove this step. Check your connection and try again.
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove step"
              accessibilityState={{ disabled: removing, busy: removing }}
              disabled={removing}
              onPress={onRemove}
              style={({ pressed }) => [
                styles.pillButton,
                { backgroundColor: palette.warning, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {removing ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text style={[styles.removeLabel, { color: palette.onPrimary }]}>Remove step</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.pillButton,
                { backgroundColor: palette.background, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.cancelLabel, { color: palette.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: spacing.screen,
    paddingHorizontal: spacing.screen,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.section,
    lineHeight: fontSizes.section * 1.15,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  message: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: 18.9,
  },
  name: {
    fontFamily: fonts.bodyBold,
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  pillButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    borderRadius: radii.pill,
  },
  removeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  cancelLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
});
