import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type SegmentedControlProps<T extends string> = {
  // The icon is drawn in the label's colour, before it.
  options: readonly {
    value: T;
    label: string;
    count?: number;
    icon?: (color: string) => ReactNode;
  }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { palette } = useDewyTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: palette.surface, boxShadow: palette.cardShadow }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const labelColor = selected ? palette.onPrimary : palette.textMuted;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={spacing.xxs}
            onPress={() => onChange(option.value)}
            style={[styles.item, selected && { backgroundColor: palette.primary }]}
          >
            {option.icon?.(labelColor)}
            <Text style={[styles.label, { color: labelColor }]}>{option.label}</Text>
            {option.count === undefined ? null : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: selected ? palette.badgeActive : palette.chipSoft },
                ]}
              >
                <Text style={[styles.badgeLabel, { color: palette.text }]}>{option.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xxs,
    padding: spacing.xxs,
    borderRadius: radii.pill,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
  badge: {
    minWidth: 22,
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  badgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    lineHeight: 16,
  },
});
