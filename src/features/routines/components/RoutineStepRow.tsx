import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { categoryDetails } from '@/features/products/constants';
import { nameHyphenation } from '@/features/products/utils/productLabels';
import { StepTile } from '@/features/routines/components/StepTile';
import type { RoutineStep } from '@/features/routines/types';
import { describeWeekdays, formatWeekdays, isDaily } from '@/features/routines/utils/weekSchedule';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type RoutineStepRowProps = {
  step: RoutineStep;
  number: number;
  // The wait line only shows between two steps, never after the last one.
  showWait: boolean;
  onPress: () => void;
};

const tileLeft = spacing.md;
const tileSize = 40;
const waitLineWidth = 2;
// Above font scale 1.0, a name column narrower than this times the scale can't fit "7 · MOISTURIZE", so the days pill moves under the name.
const nameMinWidth = 95;

export function RoutineStepRow({ step, number, showWait, onPress }: RoutineStepRowProps) {
  const { palette } = useDewyTheme();
  const { fontScale } = useWindowDimensions();
  const kind = categoryDetails[step.product.category].stepKind;
  const daily = isDaily(step.weekdays);
  const waitMinutes = showWait ? step.waitMinutes : null;
  const accessibilityLabel = [
    `Step ${number}, ${kind}`,
    step.product.name,
    describeWeekdays(step.weekdays),
    waitMinutes ? `then wait ${waitMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Edit this step"
      onPress={onPress}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View
        style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
      >
        <StepTile productId={step.productId} photoPath={step.product.photoPath} />
        <View style={styles.details}>
          <View style={[styles.text, fontScale > 1 && { minWidth: nameMinWidth * fontScale }]}>
            <Text style={[styles.kind, { color: palette.stepLabel }]}>
              {number} · {kind}
            </Text>
            <Text
              numberOfLines={2}
              android_hyphenationFrequency={nameHyphenation(step.product.name)}
              style={[styles.name, { color: palette.text }]}
            >
              {step.product.name}
            </Text>
          </View>
          <View
            style={[styles.daysChip, { backgroundColor: daily ? palette.chipSoft : palette.peach }]}
          >
            <Text style={[styles.daysLabel, { color: daily ? palette.text : palette.onAccent }]}>
              {formatWeekdays(step.weekdays)}
            </Text>
          </View>
        </View>
      </View>
      {waitMinutes ? (
        <View style={styles.wait}>
          <Svg width={waitLineWidth} height={22}>
            <Line
              x1={waitLineWidth / 2}
              y1={0}
              x2={waitLineWidth / 2}
              y2={22}
              stroke={palette.rose}
              strokeWidth={waitLineWidth}
              strokeDasharray="4 4"
            />
          </Svg>
          <View style={styles.waitLabel}>
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke={palette.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
            >
              <Circle cx={12} cy={12} r={8} />
              <Path d="M12 8v4l2.5 2.5" />
            </Svg>
            <Text style={[styles.waitText, { color: palette.textMuted }]}>
              Wait {waitMinutes} min before the next step
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: tileLeft,
    borderRadius: radii.detailCard,
  },
  details: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
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
  daysChip: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  daysLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
  },
  // The dashed line runs down from the middle of the tile above it.
  wait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: tileLeft + tileSize / 2 - waitLineWidth / 2,
  },
  waitLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
  },
  waitText: {
    flexShrink: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
});
