import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { StepTile } from '@/features/routines/components/StepTile';
import { TickCircle } from '@/features/routines/components/TickCircle';
import type { PickableProduct } from '@/features/routines/utils/stepOptions';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type ProductPickerProps = {
  products: readonly PickableProduct[];
  value: string;
  onChange: (product: Product) => void;
  disabled?: boolean;
};

// One row per product, like the Routines rows, with a tick circle and the ritual it is already in.
export function ProductPicker({ products, value, onChange, disabled }: ProductPickerProps) {
  const { palette } = useDewyTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {products.map(({ product, periods }) => {
        const checked = product.id === value;
        const meta = [categoryDetails[product.category].stepKind, product.brand]
          .filter(Boolean)
          .join(' · ');
        const inOne = periods.length === 1 ? periods[0] : null;
        return (
          <Pressable
            key={product.id}
            accessibilityRole="radio"
            accessibilityLabel={
              inOne
                ? `${product.name}, ${meta}, already in your ${inOne} ritual`
                : `${product.name}, ${meta}`
            }
            accessibilityState={{ checked, disabled }}
            disabled={disabled}
            onPress={() => onChange(product)}
            style={[
              styles.row,
              {
                borderColor: checked ? palette.primary : palette.mauve,
                backgroundColor: checked ? palette.surface : 'transparent',
              },
            ]}
          >
            <StepTile
              productId={product.id}
              photoPath={product.photoPath}
              shape={product.packaging}
            />
            <View style={styles.text}>
              <Text numberOfLines={2} style={[styles.name, { color: palette.text }]}>
                {product.name}
              </Text>
              <Text numberOfLines={1} style={[styles.meta, { color: palette.textMuted }]}>
                {meta}
              </Text>
            </View>
            {inOne ? (
              <Text
                style={[
                  styles.tag,
                  { backgroundColor: palette.chipSoft, color: palette.textMuted },
                ]}
              >
                {inOne === 'morning' ? 'In AM' : 'In PM'}
              </Text>
            ) : null}
            <TickCircle checked={checked} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderRadius: radii.input,
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
  tag: {
    overflow: 'hidden',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    letterSpacing: letterSpacings.tag,
  },
});
