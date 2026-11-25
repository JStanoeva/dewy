import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import {
  fixedWidthMaxFontScale,
  fonts,
  fontSizes,
  minTouchTarget,
  radii,
  spacing,
} from '@/theme/tokens';

type NudgeOptionsProps<T extends string | number> = {
  // What TalkBack calls the group, like "Morning reminder time".
  label: string;
  options: readonly T[];
  value: T;
  optionLabel: (option: T) => string;
  disabled: boolean;
  onPick: (option: T) => void;
  style?: StyleProp<ViewStyle>;
};

// A nudge's four choices in a row, the picked one in peach; step 3 and Settings share it.
export function NudgeOptions<T extends string | number>({
  label,
  options,
  value,
  optionLabel,
  disabled,
  onPick,
  style,
}: NudgeOptionsProps<T>) {
  const { palette } = useDewyTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.options, style]}>
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
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: spacing.snug,
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
