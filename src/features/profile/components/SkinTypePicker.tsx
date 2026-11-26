import { Pressable, StyleSheet, Text, View } from 'react-native';

import { skinTypeDetails, skinTypes, type SkinType } from '@/features/profile/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fixedWidthMaxFontScale, fonts, fontSizes, radii, spacing } from '@/theme/tokens';

const swatchSize = 22;

// The type's two-tone dot, on the form's cards and Profile's skin card.
export function SkinSwatch({ type }: { type: SkinType }) {
  const { palette } = useDewyTheme();
  const [left, right] = skinTypeDetails[type].swatch;
  return (
    <View aria-hidden style={styles.swatch}>
      <View style={[styles.swatchHalf, { backgroundColor: palette[left] }]} />
      <View style={[styles.swatchHalf, { backgroundColor: palette[right] }]} />
    </View>
  );
}

type SkinTypePickerProps = {
  value: SkinType | null;
  onChange: (value: SkinType | null) => void;
};

// A 2 × 2 grid of single-choice cards; tapping the picked card clears it.
export function SkinTypePicker({ value, onChange }: SkinTypePickerProps) {
  const rows = [skinTypes.slice(0, 2), skinTypes.slice(2)];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Skin type" style={styles.grid}>
      {rows.map((row) => (
        <View key={row.join()} style={styles.row}>
          {row.map((type) => (
            <SkinTypeCard
              key={type}
              type={type}
              checked={value === type}
              onPress={() => onChange(value === type ? null : type)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type SkinTypeCardProps = {
  type: SkinType;
  checked: boolean;
  onPress: () => void;
};

function SkinTypeCard({ type, checked, onPress }: SkinTypeCardProps) {
  const { palette } = useDewyTheme();
  const { label, line } = skinTypeDetails[type];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${line}`}
      accessibilityState={{ checked }}
      accessibilityHint={checked ? 'Double tap to clear' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: checked ? palette.surface : 'transparent',
          borderColor: checked ? palette.primary : palette.mauve,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <SkinSwatch type={type} />
      <View style={styles.text}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={fixedWidthMaxFontScale}
          style={[styles.name, { color: palette.text }]}
        >
          {label}
        </Text>
        <Text style={[styles.line, { color: palette.textMuted }]}>{line}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: swatchSize,
    height: swatchSize,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radii.pill,
  },
  swatchHalf: {
    flex: 1,
  },
  grid: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minHeight: 72,
    gap: spacing.snug,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderRadius: radii.input,
  },
  text: {
    gap: spacing.hairline,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  line: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
    lineHeight: fontSizes.kicker * 1.3,
  },
});
