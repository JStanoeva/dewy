import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottleIllustration, type BottleShape } from '@/components/BottleIllustration';
import { packagingLabels, packagings } from '@/features/products/constants';
import { packagingTileBottles } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fixedWidthMaxFontScale, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type PackagingPickerProps = {
  // The lit tile: the one tapped, or the Type's bottle; null while neither is known.
  value: BottleShape | null;
  onChange: (value: BottleShape) => void;
};

export function PackagingPicker({ value, onChange }: PackagingPickerProps) {
  const { palette, paletteName } = useDewyTheme();
  const unselectedBottle =
    paletteName === 'evening'
      ? packagingTileBottles.unselectedEvening
      : packagingTileBottles.unselected;

  return (
    <View style={styles.row}>
      {packagings.map((packaging) => {
        const selected = packaging === value;
        return (
          <Pressable
            key={packaging}
            accessibilityRole="button"
            accessibilityLabel={`${packagingLabels[packaging]} packaging`}
            accessibilityState={{ selected }}
            onPress={() => onChange(packaging)}
            style={[
              styles.tile,
              {
                backgroundColor: selected ? palette.peach : palette.surface,
                borderColor: selected ? palette.rose : palette.border,
              },
            ]}
          >
            <BottleIllustration
              shape={packaging}
              colors={selected ? packagingTileBottles.selected : unselectedBottle}
              size="option"
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={fixedWidthMaxFontScale}
              style={[styles.label, { color: selected ? palette.onAccent : palette.text }]}
            >
              {packagingLabels[packaging]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tile: {
    flex: 1,
    height: 92,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.snug,
    paddingBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.option,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
});
