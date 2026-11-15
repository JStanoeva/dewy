import { StyleSheet, View } from 'react-native';

import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { bottleColorsFor } from '@/theme/bottleColors';

type StepTileProps = {
  productId: string;
  photoPath: string | null;
};

// The product's photo, or the small two-part bottle the Builder artboard draws in routine rows.
export function StepTile({ productId, photoPath }: StepTileProps) {
  const colors = bottleColorsFor(productId);
  const bottle = (
    <View style={[styles.tile, { backgroundColor: colors.tile }]}>
      <View style={[styles.cap, { backgroundColor: colors.cap }]} />
      <View style={[styles.body, { backgroundColor: colors.body }]} />
    </View>
  );

  if (!photoPath) {
    return bottle;
  }
  return (
    <ProductPhoto
      path={photoPath}
      style={styles.tile}
      placeholderColor={colors.tile}
      fallback={bottle}
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  cap: {
    width: 7,
    height: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  body: {
    width: 14,
    height: 20,
    borderRadius: 4,
  },
});
