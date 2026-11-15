import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FieldError } from '@/components/FieldError';
import { everyDay } from '@/features/routines/utils/stepOptions';
import { dayLetters, dayNames } from '@/features/routines/utils/weekSchedule';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type WeekdaySelectorProps = {
  // ISO weekdays, Monday = 1 … Sunday = 7.
  value: readonly number[];
  onToggleDay: (day: number) => void;
  onEveryDay: () => void;
  // Ticked days take the ritual's colour, as the Routines week strip does.
  period: Period;
  error?: string;
  disabled?: boolean;
};

// Half the 6dp gap on each side keeps the tiles 44 wide on a 360dp phone without overlapping.
const tileSlop = { left: spacing.snug / 2, right: spacing.snug / 2 };
// The slop stays inside the 18 gap above and the 8 gap below, so it never takes a day tile's taps.
const everyDaySlop = { top: 18, bottom: spacing.xs, left: spacing.lg, right: spacing.lg };

export function WeekdaySelector({
  value,
  onToggleDay,
  onEveryDay,
  period,
  error,
  disabled,
}: WeekdaySelectorProps) {
  const { palette } = useDewyTheme();
  const tickedColor = period === 'morning' ? palette.peach : palette.rose;
  const isEveryDay = everyDay.every((day) => value.includes(day));

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: palette.text }]}>Days</Text>
        {isEveryDay ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={everyDaySlop}
            onPress={onEveryDay}
            style={styles.everyDay}
          >
            <Text style={[styles.label, { color: palette.emphasis }]}>Every day</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.tiles}>
        {dayLetters.map((letter, index) => {
          const day = index + 1;
          const checked = value.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityLabel={dayNames[index]}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              hitSlop={tileSlop}
              onPress={() => onToggleDay(day)}
              style={[
                styles.tile,
                checked
                  ? { backgroundColor: tickedColor, borderColor: tickedColor }
                  : { backgroundColor: palette.surface, borderColor: palette.mauve },
              ]}
            >
              <Text style={[styles.letter, { color: checked ? palette.onAccent : palette.text }]}>
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <FieldError style={styles.error}>{error}</FieldError> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Keeps its height when the link hides, so the tiles never jump.
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  everyDay: {
    minHeight: 18,
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.snug,
    marginTop: spacing.xs,
  },
  tile: {
    flex: 1,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radii.tile,
  },
  letter: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
  },
  error: {
    marginTop: spacing.snug,
  },
});
