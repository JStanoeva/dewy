import { StyleSheet, Text, View } from 'react-native';

import type { RoutineStep } from '@/features/routines/types';
import { buildWeekStrip } from '@/features/routines/utils/weekSchedule';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type WeekStripProps = {
  period: Period;
  steps: readonly RoutineStep[];
  todayWeekday: number;
};

export function WeekStrip({ period, steps, todayWeekday }: WeekStripProps) {
  const { palette } = useDewyTheme();
  const strip = buildWeekStrip(steps, todayWeekday, period);
  const fill = period === 'morning' ? palette.peach : palette.rose;
  const today = strip.days.find((day) => day.isToday);
  const extraDays = strip.days.filter((day) => day.filled).map((day) => day.name);
  const accessibilityLabel =
    strip.legend.basic === null
      ? `This week: same steps every ${period}. Today is ${today?.name}.`
      : `This week: extra steps on ${extraDays.join(', ')}. Today is ${today?.name}.`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <View style={styles.days}>
        {strip.days.map((day) => (
          <View key={day.weekday} style={styles.day}>
            <Text
              style={[
                styles.letter,
                day.isToday && styles.letterToday,
                { color: day.isToday ? palette.text : palette.textMuted },
              ]}
            >
              {day.letter}
            </Text>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: day.filled ? fill : palette.surface,
                  borderColor: day.filled ? fill : palette.mauve,
                  boxShadow: day.isToday ? palette.todayRing : undefined,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: fill }]} />
          <Text style={[styles.legendText, { color: palette.textMuted }]}>
            {strip.legend.filled}
          </Text>
        </View>
        {strip.legend.basic === null ? null : (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendRing, { borderColor: palette.mauve }]} />
            <Text style={[styles.legendText, { color: palette.textMuted }]}>
              {strip.legend.basic}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.detailCard,
  },
  days: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.snug,
  },
  letter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
  // The artboard's 800 isn't loaded, so today uses the heaviest loaded weight.
  letterToday: {
    fontFamily: fonts.bodyBold,
  },
  circle: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: radii.pill,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.xl,
    rowGap: spacing.xxs,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  legendRing: {
    borderWidth: 2,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
});
