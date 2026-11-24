import { StyleSheet, Text, View } from 'react-native';

import { BottleIllustration } from '@/components/BottleIllustration';
import { ritualSummary } from '@/features/onboarding/utils/firstRituals';
import type { Product } from '@/features/products/types';
import { MoonIcon, SunIcon } from '@/navigation/TabIcons';
import { bottleColorsFor } from '@/theme/bottleColors';
import type { Period } from '@/theme/period';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type RitualSummaryCardProps = {
  rituals: Record<Period, Pick<Product, 'id' | 'category' | 'packaging'>[]>;
};

const periods = [
  { period: 'morning', label: 'Morning' },
  { period: 'evening', label: 'Evening' },
] as const;

// The plum card under step 2's list; it follows the toggles as they flip.
export function RitualSummaryCard({ rituals }: RitualSummaryCardProps) {
  const { palette } = useDewyTheme();

  return (
    <View
      accessibilityLabel="Your rituals"
      style={[styles.card, { backgroundColor: palette.plum }]}
    >
      {periods.map(({ period, label }) => (
        <View key={period} style={styles.ritual}>
          <View accessible style={styles.line}>
            {period === 'morning' ? (
              <SunIcon color={palette.peach} size={18} />
            ) : (
              <MoonIcon color={palette.rose} size={18} />
            )}
            <Text style={[styles.lineText, { color: palette.onPlum }]}>
              <Text style={styles.label}>{label}</Text>
              <Text style={{ color: palette.lilac }}> · {ritualSummary(rituals[period])}</Text>
            </Text>
          </View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.tiles}
          >
            {rituals[period].map((product) => (
              <View
                key={product.id}
                style={[styles.tile, { backgroundColor: palette.ritualSummaryTile }]}
              >
                <BottleIllustration
                  shape={product.packaging}
                  colors={bottleColorsFor(product.id)}
                  size="mini"
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.card,
  },
  ritual: {
    gap: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lineText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
  },
  label: {
    fontFamily: fonts.bodyBold,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.snug,
    minHeight: 32,
  },
  tile: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
