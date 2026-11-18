import { StyleSheet, Text, View } from 'react-native';

import { activeLabels, actives, type Active } from '@/features/products/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type ActiveChipsProps = {
  values: Active[];
};

// Product details' Key actives, always in the form's order.
export function ActiveChips({ values }: ActiveChipsProps) {
  const { palette } = useDewyTheme();

  return (
    <View style={styles.row}>
      {actives
        .filter((active) => values.includes(active))
        .map((active) => (
          <View key={active} style={[styles.chip, { backgroundColor: palette.peach }]}>
            <Text numberOfLines={1} style={[styles.label, { color: palette.onAccent }]}>
              {activeLabels[active]}
            </Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    maxWidth: '100%',
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
});
