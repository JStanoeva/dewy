import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FieldError } from '@/components/FieldError';
import { ritualOrder } from '@/features/routines/utils/routineMembership';
import { MoonIcon, SunIcon } from '@/navigation/TabIcons';
import { useDewyTheme } from '@/theme/ThemeProvider';
import type { Period } from '@/theme/period';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type RitualTilesProps = {
  ticked: readonly Period[];
  // The rituals the picked product is already in.
  locked: readonly Period[];
  onToggle: (period: Period) => void;
  error?: string;
  disabled?: boolean;
};

// Two tiles this wide (at font scale 1.0) fit on a 360dp screen; with less room they stack.
const tileMinWidth = 150;

// The AddStep artboard's Ritual row: Morning and Evening checkbox tiles; a ritual that has the product is locked.
export function RitualTiles({ ticked, locked, onToggle, error, disabled }: RitualTilesProps) {
  const { palette } = useDewyTheme();
  const { fontScale } = useWindowDimensions();

  return (
    <View>
      <Text style={[styles.label, { color: palette.text }]}>
        Ritual
        <Text style={[styles.labelHint, { color: palette.textMuted }]}> · pick one or both</Text>
      </Text>
      <View style={styles.tiles}>
        {ritualOrder.map((period) => {
          const name = period === 'morning' ? 'Morning' : 'Evening';
          const isLocked = locked.includes(period);
          const checked = !isLocked && ticked.includes(period);
          const fill = period === 'morning' ? palette.peach : palette.rose;
          const background = isLocked ? palette.chipSoft : checked ? fill : palette.surface;
          const foreground = isLocked
            ? palette.textMuted
            : checked
              ? palette.onAccent
              : palette.text;
          const Icon = period === 'morning' ? SunIcon : MoonIcon;
          return (
            <Pressable
              key={period}
              accessibilityRole="checkbox"
              accessibilityLabel={isLocked ? `${name}, already in` : name}
              accessibilityState={{ checked, disabled: disabled || isLocked }}
              disabled={disabled || isLocked}
              onPress={() => onToggle(period)}
              style={[
                styles.tile,
                {
                  minWidth: tileMinWidth * fontScale,
                  backgroundColor: background,
                  borderColor: isLocked ? palette.chipSoft : checked ? fill : palette.mauve,
                },
              ]}
            >
              <Icon color={foreground} size={20} />
              {/* A half-width tile on a 360dp screen leaves about 58dp, so "Morning" shrinks a hair to fit. */}
              <View style={styles.names}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.name, { color: foreground }]}
                >
                  {name}
                </Text>
                {isLocked ? (
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.lockedLabel, { color: foreground }]}
                  >
                    Already in
                  </Text>
                ) : null}
              </View>
              {isLocked ? null : (
                <View
                  style={[
                    styles.box,
                    checked
                      ? { backgroundColor: palette.plum, borderColor: palette.plum }
                      : { borderColor: palette.mauve },
                  ]}
                >
                  {checked ? (
                    <Svg
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={palette.lilac}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M5 12.5l4.5 4.5L19 7.5" />
                    </Svg>
                  ) : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {error ? <FieldError style={styles.error}>{error}</FieldError> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  labelHint: {
    fontFamily: fonts.bodyMedium,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderRadius: radii.input,
  },
  names: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  lockedLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.kicker,
  },
  box: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: spacing.snug,
  },
  error: {
    marginTop: spacing.snug,
  },
});
