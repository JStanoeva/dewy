import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

const options = [
  { period: 'morning', label: 'Morning' },
  { period: 'evening', label: 'Evening' },
] as const;

type AddToRoutineFieldProps = {
  value: readonly Period[];
  onChange: (periods: Period[]) => void;
  disabled?: boolean;
};

export function AddToRoutineField({ value, onChange, disabled }: AddToRoutineFieldProps) {
  const { palette } = useDewyTheme();

  function toggle(period: Period) {
    onChange(value.includes(period) ? value.filter((item) => item !== period) : [...value, period]);
  }

  return (
    <View>
      <Text style={[styles.label, { color: palette.text }]}>Add to routine</Text>
      <View style={styles.rows}>
        {options.map(({ period, label }) => {
          const checked = value.includes(period);
          const ring = checked ? palette.primary : palette.mauve;
          return (
            <Pressable
              key={period}
              accessibilityRole="checkbox"
              accessibilityLabel={`Add to ${period} routine`}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => toggle(period)}
              style={[
                styles.row,
                { borderColor: ring, backgroundColor: checked ? palette.surface : 'transparent' },
              ]}
            >
              <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
              <View
                style={[
                  styles.check,
                  { borderColor: ring, backgroundColor: checked ? palette.primary : 'transparent' },
                ]}
              >
                {checked ? (
                  <Svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={palette.onPrimary}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M5 12.5l4.5 4.5L19 7.5" />
                  </Svg>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  rows: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderRadius: radii.input,
  },
  rowLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  check: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radii.pill,
  },
});
