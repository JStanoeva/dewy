import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { BottleIllustration } from '@/components/BottleIllustration';
import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import type { Product } from '@/features/products/types';
import { nameHyphenation } from '@/features/products/utils/productLabels';
import { bottleColorsFor } from '@/theme/bottleColors';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

// Room inside the scroll view for the tile shadow, which Android would otherwise clip.
const shadowTop = 14;

type FavouritesSectionProps = {
  products: readonly Product[];
  onOpen: (productId: string) => void;
};

export function FavouritesSection({ products, onOpen }: FavouritesSectionProps) {
  const { palette } = useDewyTheme();

  return (
    <View>
      <Text accessibilityRole="header" style={[styles.heading, { color: palette.textMuted }]}>
        Favourites
      </Text>
      {/* Remounts when the count changes, as Android keeps an offset a shorter row no longer has. */}
      <ScrollView
        key={products.length}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {products.map((product) => (
          <FavouriteTile key={product.id} product={product} onPress={() => onOpen(product.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function FavouriteTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const { palette } = useDewyTheme();
  const colors = bottleColorsFor(product.id);
  const isWish = product.status === 'wishlist';
  const bottle = (
    <>
      <BottleIllustration shape={product.packaging} colors={colors} size="favourite" />
      <Svg width={48} height={5} style={styles.ground}>
        <Ellipse cx={24} cy={2.5} rx={24} ry={2.5} fill={palette.tileGroundShadow} />
      </Svg>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[product.name, product.brand, isWish ? 'on your wishlist' : null]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.favourite, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View
        style={[
          styles.tileShadow,
          { backgroundColor: colors.tile, boxShadow: palette.productCardShadow },
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
              {/* Fixed size, so the pill never grows onto a pump; TalkBack reads "on your wishlist". */}
              <Text allowFontScaling={false} style={[styles.tagLabel, { color: palette.onAccent }]}>
                Wish
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text
        numberOfLines={2}
        android_hyphenationFrequency={nameHyphenation(product.name)}
        style={[styles.name, { color: palette.text }]}
      >
        {product.name}
      </Text>
      {product.brand ? (
        <Text numberOfLines={1} style={[styles.brand, { color: palette.textMuted }]}>
          {product.brand}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.sectionLabel,
    textTransform: 'uppercase',
  },
  scroll: {
    marginTop: -shadowTop,
    marginHorizontal: -spacing.screen,
  },
  row: {
    gap: spacing.md,
    paddingTop: shadowTop,
    paddingHorizontal: spacing.screen,
  },
  favourite: {
    width: 108,
  },
  tileShadow: {
    borderRadius: radii.option,
  },
  tile: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    borderRadius: radii.option,
    // Clips a full-tile photo to the rounded corners.
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
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
  name: {
    marginTop: spacing.xs,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
    lineHeight: 17,
  },
  brand: {
    marginTop: spacing.hairline,
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
});
