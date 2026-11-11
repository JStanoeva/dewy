import { StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/features/products/types';
import { getShelfLife } from '@/features/products/utils/shelfLife';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';
import { formatLocalDate, toLocalDate, type LocalDate } from '@/utils/localDate';

type ShelfLifeBarProps = {
  progress: number;
  isExpiringSoon: boolean;
  height: number;
};

// Decorative: the status text next to it says the same thing, so screen readers skip it.
export function ShelfLifeBar({ progress, isExpiringSoon, height }: ShelfLifeBarProps) {
  const { palette } = useDewyTheme();

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.track, { height, backgroundColor: palette.divider }]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${progress * 100}%`,
            backgroundColor: isExpiringSoon ? palette.rose : palette.mauve,
          },
        ]}
      />
    </View>
  );
}

type ShelfLifeCardProps = {
  product: Product;
  today: LocalDate;
};

export function ShelfLifeCard({ product, today }: ShelfLifeCardProps) {
  const { palette } = useDewyTheme();
  const shelfLife = getShelfLife(product.openedOn, product.paoMonths, today);

  let label = 'Shelf life';
  let value = 'Unopened';
  let footer: string[] = [];
  if (product.status === 'wishlist') {
    label = 'Saved';
    value = formatLocalDate(toLocalDate(new Date(product.createdAt)));
  } else if (shelfLife && product.openedOn) {
    value = shelfLife.label;
    footer = [
      `Opened ${formatLocalDate(product.openedOn)}`,
      `Use within ${product.paoMonths} months`,
    ];
  } else if (product.paoMonths) {
    footer = [`Use within ${product.paoMonths} months of opening`];
  }

  return (
    <View
      accessible
      accessibilityLabel={[`${label}, ${value}`, ...footer].join('. ')}
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
        <Text
          style={[
            styles.value,
            { color: shelfLife?.isExpiringSoon ? palette.warning : palette.text },
          ]}
        >
          {value}
        </Text>
      </View>
      {shelfLife ? (
        <ShelfLifeBar
          progress={shelfLife.progress}
          isExpiringSoon={shelfLife.isExpiringSoon}
          height={8}
        />
      ) : null}
      {footer.length > 0 ? (
        <View style={styles.footer}>
          {footer.map((line, index) => (
            <Text
              key={line}
              style={[
                styles.footerText,
                index > 0 && styles.footerTextEnd,
                { color: palette.textMuted },
              ]}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radii.pill,
  },
  fill: {
    borderRadius: radii.pill,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.detailCard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.meta,
    letterSpacing: letterSpacings.section,
    textTransform: 'uppercase',
  },
  value: {
    flexShrink: 1,
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.subSection,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerText: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
  footerTextEnd: {
    textAlign: 'right',
  },
});
