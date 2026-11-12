import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type BarcodeCardProps = {
  barcode: string | null;
  error?: string;
  disabled: boolean;
  onScan: () => void;
  onRemove: () => void;
};

// The same 44 target as the form's "Not opened yet" link: 8 above and 18 below stay inside the gaps.
const removeSlop = { top: spacing.xs, bottom: 18, left: spacing.lg, right: spacing.lg };

export function BarcodeCard({ barcode, error, disabled, onScan, onRemove }: BarcodeCardProps) {
  const { palette } = useDewyTheme();
  const cardRef = useRef<ComponentRef<typeof Pressable>>(null);
  const removedRef = useRef(false);

  // The Remove link disappears when pressed, so TalkBack focus moves to the card instead of getting lost.
  useEffect(() => {
    if (barcode === null && removedRef.current && cardRef.current) {
      removedRef.current = false;
      AccessibilityInfo.sendAccessibilityEvent(cardRef.current, 'focus');
    }
  }, [barcode]);

  const title = barcode ? 'Scan again' : 'Scan the barcode';
  const subtitle = barcode ? `Barcode ${barcode}` : 'Adds the code to this product';
  // Spaced digits make TalkBack read the code one digit at a time instead of as a huge number.
  const spokenSubtitle = barcode ? `Barcode ${barcode.split('').join(' ')}` : subtitle;

  function remove() {
    removedRef.current = true;
    onRemove();
  }

  return (
    <View>
      <Pressable
        ref={cardRef}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${spokenSubtitle}`}
        accessibilityHint="Opens the camera"
        disabled={disabled}
        onPress={onScan}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: palette.peach, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: palette.cream }]}>
          <ScanIcon color={palette.onAccent} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: palette.onAccent }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: palette.onAccentSoft }]}>{subtitle}</Text>
        </View>
      </Pressable>

      {barcode ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={removeSlop}
          onPress={remove}
          style={styles.remove}
        >
          <Text style={[styles.removeLabel, { color: palette.emphasis }]}>Remove barcode</Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.warning }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function ScanIcon({ color }: { color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 8v8M11 8v8M14 8v8M17 8v8" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // A minimum height, so larger font sizes grow the card instead of clipping its text.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    minHeight: 84,
    paddingHorizontal: 18,
    paddingVertical: spacing.md,
    borderRadius: radii.productCard,
  },
  iconCircle: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.cardTitle,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  remove: {
    alignSelf: 'flex-start',
    minHeight: 18,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  removeLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  error: {
    marginTop: spacing.snug,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
