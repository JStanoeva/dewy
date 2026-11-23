import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { categoryDetails } from '@/features/products/constants';
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
  // Today's tick circle, beside the text.
  accessory?: ReactNode;
  // Routines' days pill, at the end of the time row.
  timeAccessory?: ReactNode;
  // Routines' drag handle, drawn right before the tile and dragHandleWidth wide.
  handle?: ReactNode;
};

const tileSize = 44;
export const dragHandleWidth = 36;

// Routines draws its wait line down from the middle of the tile.
export function stepTileCenter(withHandle: boolean) {
  return (withHandle ? spacing.hairline + dragHandleWidth : spacing.sm) + tileSize / 2;
}

// The step card Today and Routines share; one-line texts keep every card the same height.
export function StepCard({
  step,
  number,
  done = false,
  accessory,
  timeAccessory,
  handle,
}: StepCardProps) {
  const { palette } = useDewyTheme();
  const kind = categoryDetails[step.product.category].stepKind;

  return (
    <View
      style={[
        styles.card,
        handle ? styles.cardWithHandle : null,
        { backgroundColor: palette.surface, boxShadow: palette.cardShadow },
      ]}
    >
      <View style={styles.lead}>
        {handle}
        <StepTile
          productId={step.productId}
          photoPath={step.product.photoPath}
          size={tileSize}
          shape={step.product.packaging}
        />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.kind, { color: palette.stepLabel }]}>
          Step {number} · {kind}
        </Text>
        {/* Android draws the line-through only when the text mounts with it, so a tick remounts the name. */}
        <Text
          key={done ? 'done' : 'pending'}
          numberOfLines={1}
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
        <View style={styles.timeRow}>
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {formatDuration(step.durationSeconds)}
          </Text>
          {timeAccessory}
        </View>
      </View>
      {accessory}
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
  cardWithHandle: {
    paddingLeft: spacing.hairline,
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
});
