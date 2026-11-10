import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { BottleIllustration } from '@/components/BottleIllustration';
import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { bottleColorsFor } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type ProductCardProps = {
  product: Product;
  width: number;
};

export function ProductCard({ product, width }: ProductCardProps) {
  const { palette } = useDewyTheme();
  const colors = bottleColorsFor(product.id);
  const isWish = product.status === 'wishlist';
  const accessibilityLabel = [product.name, product.brand, isWish ? 'on your wishlist' : null]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        { width, backgroundColor: palette.surface, boxShadow: palette.productCardShadow },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.tile }]}>
        <BottleIllustration
          shape={categoryDetails[product.category].bottle}
          colors={colors}
          scale={0.9}
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
      </View>
    </View>
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
});
