import { StyleSheet, View } from 'react-native';

import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { bottleColorsFor } from '@/theme/bottleColors';

type StepTileProps = {
  productId: string;
  photoPath: string | null;
  // 40 in routine rows (Builder artboard), 44 in Today's rows (Main and Evening artboards).
  size?: 40 | 44;
};

// The product's photo, or the small two-part bottle the artboards draw in step rows.
export function StepTile({ productId, photoPath, size = 40 }: StepTileProps) {
  const colors = bottleColorsFor(productId);
  const shape = size === 44 ? large : small;
  const bottle = (
    <View style={[shape.tile, { backgroundColor: colors.tile }]}>
      <View style={[shape.cap, { backgroundColor: colors.cap }]} />
      <View style={[shape.body, { backgroundColor: colors.body }]} />
    </View>
  );

  if (!photoPath) {
    return bottle;
  }
  return (
    <ProductPhoto
      path={photoPath}
      style={shape.tile}
      placeholderColor={colors.tile}
      fallback={bottle}
    />
  );
}

const small = StyleSheet.create({
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

const large = StyleSheet.create({
  tile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  cap: {
    width: 8,
    height: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  body: {
    width: 16,
    height: 22,
    borderRadius: 5,
  },
});
