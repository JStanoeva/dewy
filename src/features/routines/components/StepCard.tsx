import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { categoryDetails } from '@/features/products/constants';
import { nameHyphenation } from '@/features/products/utils/productLabels';
import { StepTile } from '@/features/routines/components/StepTile';
import type { RoutineStep } from '@/features/routines/types';
import { formatDuration } from '@/features/routines/utils/stepOptions';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type StepCardProps = {
  step: RoutineStep;
  number: number;
  // Today strikes through the name of a ticked step.
  done?: boolean;
  // Today's tick circle or Routines' days pill.
  accessory: ReactNode;
  // A wide days pill moves under the time instead of squeezing the label onto two lines.
  accessoryMayWrap?: boolean;
};

const tileSize = 44;
// Routines draws its wait line down from the middle of the tile.
export const stepTileCenter = spacing.sm + tileSize / 2;
// About the width of "STEP 7 · MOISTURIZE" at font scale 1.0; never more than half the screen, so huge fonts can't overflow.
const kickerWidth = 140;

// The step card Today and Routines share, so the two can't drift apart.
export function StepCard({
  step,
  number,
  done = false,
  accessory,
  accessoryMayWrap = false,
}: StepCardProps) {
  const { palette } = useDewyTheme();
  const { fontScale, width } = useWindowDimensions();
  const kind = categoryDetails[step.product.category].stepKind;

  return (
    <View
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <StepTile
        productId={step.productId}
        photoPath={step.product.photoPath}
        size={tileSize}
        shape={step.product.packaging}
      />
      <View style={styles.details}>
        <View
          style={[
            styles.text,
            accessoryMayWrap && { minWidth: Math.min(kickerWidth * fontScale, width / 2) },
          ]}
        >
          <Text style={[styles.kind, { color: palette.stepLabel }]}>
            Step {number} · {kind}
          </Text>
          {/* Android draws the line-through only when the text mounts with it, so a tick remounts the name. */}
          <Text
            key={done ? 'done' : 'pending'}
            numberOfLines={2}
            android_hyphenationFrequency={nameHyphenation(step.product.name)}
            style={[
              styles.name,
              { color: palette.text },
              done && {
                textDecorationLine: 'line-through',
                textDecorationColor: palette.uncheckedRing,
              },
            ]}
          >
            {step.product.name}
          </Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {formatDuration(step.durationSeconds)}
          </Text>
        </View>
        {accessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: radii.detailCard,
  },
  details: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.lg,
    rowGap: spacing.snug,
  },
  text: {
    flex: 1,
    gap: spacing.hairline,
  },
  kind: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.label,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
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
