import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { NudgeSwitch } from '@/features/reminders/components/NudgeSwitch';
import { MoonIcon, SunIcon } from '@/navigation/TabIcons';
import { useDewyTheme } from '@/theme/ThemeProvider';
import {
  fixedWidthMaxFontScale,
  fonts,
  fontSizes,
  minTouchTarget,
  radii,
  spacing,
} from '@/theme/tokens';

type NudgeKind = 'morning' | 'evening' | 'expiry' | 'low';

const nudgeLabels: Record<NudgeKind, { label: string; optionsLabel: string }> = {
  morning: { label: 'Morning ritual', optionsLabel: 'Morning reminder time' },
  evening: { label: 'Evening ritual', optionsLabel: 'Evening reminder time' },
  expiry: { label: 'Expiring soon', optionsLabel: 'How early to warn about expiry' },
  low: { label: 'Running low', optionsLabel: 'When to warn about running low' },
};

type NudgeCardProps<T extends string | number> = {
  kind: NudgeKind;
  on: boolean;
  // What the card says while it is on, like "Every day at 8:00"; off, it says "Off".
  summary: string;
  options: readonly T[];
  value: T;
  optionLabel: (option: T) => string;
  disabled: boolean;
  onToggle: () => void;
  onPick: (option: T) => void;
};

// One nudge: its icon, label, summary and switch, and its four options while it is on.
export function NudgeCard<T extends string | number>({
  kind,
  on,
  summary,
  options,
  value,
  optionLabel,
  disabled,
  onToggle,
  onPick,
}: NudgeCardProps<T>) {
  const { palette } = useDewyTheme();
  const { label, optionsLabel } = nudgeLabels[kind];

  return (
    <View
      style={[styles.card, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      <View style={styles.row}>
        <NudgeIcon kind={kind} />
        <View style={styles.text}>
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
          <Text style={[styles.summary, { color: palette.textMuted }]}>{on ? summary : 'Off'}</Text>
        </View>
        <NudgeSwitch label={label} on={on} disabled={disabled} onToggle={onToggle} />
      </View>
      {on ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={optionsLabel}
          style={styles.options}
        >
          {options.map((option) => {
            const picked = option === value;
            return (
              <Pressable
                key={option}
                accessibilityRole="togglebutton"
                accessibilityState={{ checked: picked, disabled }}
                disabled={disabled}
                onPress={() => onPick(option)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: picked ? palette.peach : palette.background,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  maxFontSizeMultiplier={fixedWidthMaxFontScale}
                  style={[styles.optionText, { color: picked ? palette.onAccent : palette.text }]}
                >
                  {optionLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function NudgeIcon({ kind }: { kind: NudgeKind }) {
  const { palette } = useDewyTheme();
  const circle = {
    morning: palette.peach,
    evening: palette.lilac,
    expiry: palette.warningSoft,
    low: palette.nudgeLowCircle,
  }[kind];

  return (
    <View style={[styles.icon, { backgroundColor: circle }]}>
      {kind === 'morning' ? <SunIcon color={palette.onAccent} size={18} /> : null}
      {kind === 'evening' ? <MoonIcon color={palette.onAccent} size={18} /> : null}
      {kind === 'expiry' || kind === 'low' ? (
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={palette.onAccent}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {kind === 'expiry' ? (
            <>
              <Path d="M6 3h12M6 21h12" />
              <Path d="M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3" />
            </>
          ) : (
            <>
              <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
              <Path d="M8.5 15.5h7" />
            </>
          )}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: spacing.sm,
    paddingRight: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.xl,
    borderRadius: radii.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.snug,
    marginTop: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.tile,
  },
  optionText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.secondary,
    textAlign: 'center',
  },
});
