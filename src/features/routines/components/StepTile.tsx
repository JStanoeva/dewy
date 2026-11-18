import { StyleSheet, View } from 'react-native';

import { BottleIllustration, type BottleShape } from '@/components/BottleIllustration';
import { ProductPhoto } from '@/features/products/components/ProductPhoto';
import { bottleColorsFor } from '@/theme/bottleColors';

type StepTileProps = {
  productId: string;
  photoPath: string | null;
  // 40 in routine rows and the step picker, 44 in Today's rows (Main and Evening artboards).
  size?: 40 | 44;
  // Today and the step picker draw the product's packaging; Routines rows keep the two-part bottle.
  shape?: BottleShape;
};

// The product's photo, or a small bottle when there is none.
export function StepTile({ productId, photoPath, size = 40, shape }: StepTileProps) {
  const colors = bottleColorsFor(productId);
  const sized = size === 44 ? large : small;
  const bottle = (
    <View style={[sized.tile, { backgroundColor: colors.tile }]}>
      {shape ? (
        <BottleIllustration shape={shape} colors={colors} size="tile" />
      ) : (
        <>
          <View style={[sized.cap, { backgroundColor: colors.cap }]} />
          <View style={[sized.body, { backgroundColor: colors.body }]} />
        </>
      )}
    </View>
  );

  if (!photoPath) {
    return bottle;
  }
  return (
    <ProductPhoto
      path={photoPath}
      style={sized.tile}
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
