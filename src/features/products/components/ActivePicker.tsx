import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { activeLabels, actives, type Active } from '@/features/products/constants';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type ActivePickerProps = {
  value: Active[];
  onChange: (value: Active[]) => void;
};

// The form's Key actives: any number of the four, kept in this order.
export function ActivePicker({ value, onChange }: ActivePickerProps) {
  const { palette } = useDewyTheme();

  function toggle(active: Active) {
    const picked = value.includes(active);
    onChange(actives.filter((item) => (item === active ? !picked : value.includes(item))));
  }

  return (
    <View style={styles.row}>
      {actives.map((active) => {
        const checked = value.includes(active);
        const textColor = checked ? palette.onAccent : palette.text;
        return (
          <Pressable
            key={active}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => toggle(active)}
            style={[
              styles.chip,
              {
                backgroundColor: checked ? palette.peach : palette.surface,
                borderColor: checked ? palette.rose : palette.border,
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
            <Text style={[styles.label, { color: textColor }]}>{activeLabels[active]}</Text>
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
  chip: {
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
