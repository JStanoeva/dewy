import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type SkinPillPickerProps<T extends string> = {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange: (value: T[]) => void;
  // Concerns pick peach with a rose ring, goals lilac with a mauve ring.
  pickedBackground: string;
  pickedBorder: string;
};

// Skin details' Concerns and Goals: any number, kept in the options' order.
export function SkinPillPicker<T extends string>({
  options,
  labels,
  value,
  onChange,
  pickedBackground,
  pickedBorder,
}: SkinPillPickerProps<T>) {
  const { palette } = useDewyTheme();

  function toggle(option: T) {
    const picked = value.includes(option);
    onChange(options.filter((item) => (item === option ? !picked : value.includes(item))));
  }

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const checked = value.includes(option);
        const textColor = checked ? palette.onAccent : palette.text;
        return (
          <Pressable
            key={option}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => toggle(option)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: checked ? pickedBackground : palette.surface,
                borderColor: checked ? pickedBorder : palette.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {checked ? (
              <Svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke={textColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M5 12.5l4.5 4.5L19 7.5" />
              </Svg>
            ) : null}
            <Text style={[styles.label, { color: textColor }]}>{labels[option]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.snug,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
