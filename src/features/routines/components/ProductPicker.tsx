import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { StepTile } from '@/features/routines/components/StepTile';
import { TickCircle } from '@/features/routines/components/TickCircle';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type ProductPickerProps = {
  products: readonly Product[];
  value: string;
  onChange: (product: Product) => void;
  disabled?: boolean;
};

// One row per product, like the Routines rows, with a tick circle.
export function ProductPicker({ products, value, onChange, disabled }: ProductPickerProps) {
  const { palette } = useDewyTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {products.map((product) => {
        const checked = product.id === value;
        const meta = [categoryDetails[product.category].stepKind, product.brand]
          .filter(Boolean)
          .join(' · ');
        return (
          <Pressable
            key={product.id}
            accessibilityRole="radio"
            accessibilityLabel={`${product.name}, ${meta}`}
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
});
