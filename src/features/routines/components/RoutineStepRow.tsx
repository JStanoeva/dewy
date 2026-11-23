import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { categoryDetails } from '@/features/products/constants';
import { StepCard, stepTileCenter } from '@/features/routines/components/StepCard';
import type { RoutineStep } from '@/features/routines/types';
import { formatDuration } from '@/features/routines/utils/stepOptions';
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

const waitLineWidth = 2;

export function RoutineStepRow({ step, number, showWait, onPress }: RoutineStepRowProps) {
  const { palette } = useDewyTheme();
  const daily = isDaily(step.weekdays);
  const waitMinutes = showWait ? step.waitMinutes : null;
  const accessibilityLabel = [
    `Step ${number}`,
    categoryDetails[step.product.category].stepKind,
    step.product.name,
    formatDuration(step.durationSeconds),
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
      <StepCard
        step={step}
        number={number}
        accessoryMayWrap
        accessory={
          <View
            style={[styles.daysChip, { backgroundColor: daily ? palette.chipSoft : palette.peach }]}
          >
            <Text style={[styles.daysLabel, { color: daily ? palette.text : palette.onAccent }]}>
              {formatWeekdays(step.weekdays)}
            </Text>
          </View>
        }
      />
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
    paddingLeft: stepTileCenter - waitLineWidth / 2,
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
