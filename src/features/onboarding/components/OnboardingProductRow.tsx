import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { StepTile } from '@/features/routines/components/StepTile';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type OnboardingProductRowProps = {
  product: Product;
  onRemove: () => void;
};

export function OnboardingProductRow({ product, onRemove }: OnboardingProductRowProps) {
  const { palette } = useDewyTheme();
  const meta = [product.brand, categoryDetails[product.category].label].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}>
      <StepTile
        productId={product.id}
        photoPath={product.photoPath}
        shape={product.packaging}
        size={44}
      />
      <View accessible style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, { color: palette.text }]}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: palette.textMuted }]}>
          {meta}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${product.name}`}
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke={palette.textMuted}
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.snug,
    borderRadius: radii.detailCard,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  remove: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
