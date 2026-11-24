import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Product } from '@/features/products/types';
import { StepTile } from '@/features/routines/components/StepTile';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type OnboardingProductRowProps = {
  product: Product;
  meta: string;
  // Step 2's "Stays on your shelf only".
  italicMeta?: boolean;
  // Step 1's × or step 2's toggles, each with its own space to the row's right edge.
  accessory: ReactNode;
};

export function OnboardingProductRow({
  product,
  meta,
  italicMeta = false,
  accessory,
}: OnboardingProductRowProps) {
  const { palette } = useDewyTheme();

  return (
    <View style={[styles.row, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}>
      <StepTile
        productId={product.id}
        photoPath={product.photoPath}
        shape={product.packaging}
        size={44}
      />
      <View accessible style={styles.text}>
        <Text numberOfLines={2} style={[styles.name, { color: palette.text }]}>
          {product.name}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.meta, italicMeta && styles.metaItalic, { color: palette.textMuted }]}
        >
          {meta}
        </Text>
      </View>
      {accessory}
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
  metaItalic: {
    fontFamily: fonts.bodyItalic,
  },
});
