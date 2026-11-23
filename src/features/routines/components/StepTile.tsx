import { StyleSheet, View } from 'react-native';

import { BottleIllustration, type BottleShape } from '@/components/BottleIllustration';
import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { bottleColorsFor } from '@/theme/bottleColors';

type StepTileProps = {
  productId: string;
  photoPath: string | null;
  // 44 on the step cards (Today and Routines), 40 in the step picker.
  size?: 40 | 44;
  shape: BottleShape;
};

// The product's photo, or its packaging when there is none.
export function StepTile({ productId, photoPath, size = 40, shape }: StepTileProps) {
  const colors = bottleColorsFor(productId);
  const tileStyle = size === 44 ? styles.large : styles.small;
  const bottle = (
    <View style={[tileStyle, { backgroundColor: colors.tile }]}>
      <BottleIllustration shape={shape} colors={colors} size="tile" />
    </View>
  );

  if (!photoPath) {
    return bottle;
  }
  return (
    <ProductPhoto
      path={photoPath}
      style={tileStyle}
      placeholderColor={colors.tile}
      fallback={bottle}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  large: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});
