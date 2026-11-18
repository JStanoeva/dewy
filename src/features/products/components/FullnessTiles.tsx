import { Pressable, StyleSheet, Text, View, type Insets } from 'react-native';

import { fullnessLabels, fullnessValues, type Fullness } from '@/features/products/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type FullnessTilesProps = {
  // Null while no tile is picked (Edit with a saved size).
  value: Fullness | null;
  onChange: (value: Fullness) => void;
  hitSlop?: Insets;
};

// "How full is it?": Full, ¾, ½ and ¼.
export function FullnessTiles({ value, onChange, hitSlop }: FullnessTilesProps) {
  const { palette } = useDewyTheme();

  return (
    <View style={styles.grid}>
      {fullnessValues.map((fullness) => {
        const selected = fullness === value;
        return (
          <Pressable
            key={fullness}
            accessibilityRole="button"
            accessibilityLabel={fullnessLabels[fullness].accessibilityLabel}
            accessibilityState={{ selected }}
            hitSlop={hitSlop}
            onPress={() => onChange(fullness)}
            style={[styles.tile, { backgroundColor: selected ? palette.rose : palette.surface }]}
          >
            <Text style={[styles.label, { color: selected ? palette.onAccent : palette.text }]}>
              {fullnessLabels[fullness].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.snug,
  },
  tile: {
    flex: 1,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.tile,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
});
