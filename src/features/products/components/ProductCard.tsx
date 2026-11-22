import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { BottleIllustration } from '@/components/BottleIllustration';
import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { ShelfLifeBar } from '@/features/products/components/ShelfLifeCard';
import type { Product } from '@/features/products/types';
import { nameHyphenation } from '@/features/products/utils/productLabels';
import { getShelfLife, savedLabel } from '@/features/products/utils/shelfLife';
import { getAmountProgress, isRunningLow } from '@/features/products/utils/usesLeft';
import { describeRoutines, routineTag } from '@/features/routines/utils/routineMembership';
import { bottleColorsFor } from '@/theme/bottleColors';
import type { Period } from '@/theme/period';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import type { LocalDate } from '@/utils/localDate';

type ProductCardProps = {
  product: Product;
  routinePeriods: readonly Period[];
  // Null without a size, on the wishlist, or while the use counts aren't loaded.
  usesLeft: number | null;
  width: number;
  today: LocalDate;
  onPress: () => void;
};

export function ProductCard({
  product,
  routinePeriods,
  usesLeft,
  width,
  today,
  onPress,
}: ProductCardProps) {
  const { palette } = useDewyTheme();
  const colors = bottleColorsFor(product.id);
  const isWish = product.status === 'wishlist';
  const shelfLife = isWish ? null : getShelfLife(product.openedOn, product.paoMonths, today);
  const isExpired = shelfLife !== null && shelfLife.daysLeft < 0;
  // Expired outranks running low, which outranks the other shelf-life statuses.
  const lowUsesLeft = !isExpired && usesLeft !== null && isRunningLow(usesLeft) ? usesLeft : null;
  const lowLabel =
    lowUsesLeft === null ? null : `${lowUsesLeft} ${lowUsesLeft === 1 ? 'use' : 'uses'} left`;
  const status = isWish
    ? savedLabel(product.createdAt, today)
    : lowLabel
      ? `≈ ${lowLabel}`
      : (shelfLife?.label ?? 'Unopened');
  const bar =
    lowUsesLeft !== null && product.sizeMl !== null
      ? {
          progress: getAmountProgress(product.sizeMl, product.category, lowUsesLeft),
          highlight: true,
        }
      : shelfLife
        ? { progress: shelfLife.progress, highlight: shelfLife.isExpiringSoon }
        : null;
  const routineTagText = isWish ? null : routineTag(routinePeriods);
  const bottle = (
    <>
      <BottleIllustration shape={product.packaging} colors={colors} size="card" />
      <Svg width={60} height={6} style={styles.ground}>
        <Ellipse cx={30} cy={3} rx={30} ry={3} fill={palette.tileGroundShadow} />
      </Svg>
    </>
  );
  const accessibilityLabel = [
    product.name,
    product.brand,
    isWish ? 'on your wishlist' : describeRoutines(routinePeriods),
    lowLabel ? `About ${lowLabel}` : status,
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
        {product.photoPath ? (
          <ProductPhoto
            path={product.photoPath}
            style={StyleSheet.absoluteFill}
            placeholderColor={colors.tile}
            fallback={bottle}
          />
        ) : (
          bottle
        )}
        {isWish ? (
          <View style={[styles.tag, { backgroundColor: palette.tileTag }]}>
            <Feather name="heart" size={11} color={palette.onAccent} />
            <Text style={[styles.tagLabel, { color: palette.onAccent }]}>Wish</Text>
          </View>
        ) : routineTagText ? (
          <View style={[styles.tag, { backgroundColor: palette.tileTag }]}>
            <Text style={[styles.tagLabel, { color: palette.onAccent }]}>{routineTagText}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.brand, { color: palette.textMuted }]}>
          {product.brand}
        </Text>
        <Text
          numberOfLines={2}
          android_hyphenationFrequency={nameHyphenation(product.name)}
          style={[styles.name, { color: palette.text }]}
        >
          {product.name}
        </Text>
        {bar ? (
          <View style={styles.bar}>
            <ShelfLifeBar progress={bar.progress} highlight={bar.highlight} height={5} />
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.status, { color: bar?.highlight ? palette.warning : palette.textMuted }]}
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
    // Clips a full-tile photo to the card's rounded top.
    overflow: 'hidden',
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
