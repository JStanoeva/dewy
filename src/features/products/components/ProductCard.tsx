import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { BottleIllustration } from '@/components/BottleIllustration';
import { ShelfLifeBar } from '@/features/products/components/ShelfLifeCard';
import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { getShelfLife, savedLabel } from '@/features/products/utils/shelfLife';
import { bottleColorsFor } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import type { LocalDate } from '@/utils/localDate';

type ProductCardProps = {
  product: Product;
  width: number;
  today: LocalDate;
  onPress: () => void;
};

export function ProductCard({ product, width, today, onPress }: ProductCardProps) {
  const { palette } = useDewyTheme();
  const colors = bottleColorsFor(product.id);
  const isWish = product.status === 'wishlist';
  const shelfLife = isWish ? null : getShelfLife(product.openedOn, product.paoMonths, today);
  const status = isWish ? savedLabel(product.createdAt, today) : (shelfLife?.label ?? 'Unopened');
  const accessibilityLabel = [
    product.name,
    product.brand,
    isWish ? 'on your wishlist' : null,
    status,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: palette.surface,
          boxShadow: palette.productCardShadow,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.tile }]}>
        <BottleIllustration
          shape={categoryDetails[product.category].bottle}
          colors={colors}
          size="card"
        />
        <Svg width={60} height={6} style={styles.ground}>
          <Ellipse cx={30} cy={3} rx={30} ry={3} fill={palette.tileGroundShadow} />
        </Svg>
        {isWish ? (
          <View style={[styles.tag, { backgroundColor: palette.tileTag }]}>
            <Feather name="heart" size={11} color={palette.onAccent} />
            <Text style={[styles.tagLabel, { color: palette.onAccent }]}>Wish</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.brand, { color: palette.textMuted }]}>
          {product.brand}
        </Text>
        <Text numberOfLines={2} style={[styles.name, { color: palette.text }]}>
          {product.name}
        </Text>
        {shelfLife ? (
          <View style={styles.bar}>
            <ShelfLifeBar
              progress={shelfLife.progress}
              isExpiringSoon={shelfLife.isExpiringSoon}
              height={5}
            />
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={[
            styles.status,
            { color: shelfLife?.isExpiringSoon ? palette.warning : palette.textMuted },
          ]}
        >
          {status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.productCard,
  },
  tile: {
    height: 128,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radii.productCard,
    borderTopRightRadius: radii.productCard,
  },
  tag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: 9,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  tagLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    lineHeight: 14,
  },
  ground: {
    marginTop: 3,
  },
  body: {
    gap: 3,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  brand: {
    minHeight: 14,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    lineHeight: 14,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  name: {
    minHeight: 38,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
    lineHeight: 18.75,
  },
  bar: {
    marginTop: spacing.xxs,
  },
  status: {
    marginTop: 3,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
    lineHeight: 16,
  },
});
