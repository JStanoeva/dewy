import { Pressable, StyleSheet } from 'react-native';

import { MoonIcon, SunIcon } from '@/navigation/TabIcons';
import type { Period } from '@/theme/period';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { minTouchTarget, radii } from '@/theme/tokens';

type RitualToggleProps = {
  period: Period;
  // TalkBack doesn't read a row's group label, so each toggle names its product.
  productName: string;
  on: boolean;
  onToggle: () => void;
  disabled: boolean;
};

export function RitualToggle({ period, productName, on, onToggle, disabled }: RitualToggleProps) {
  const { palette } = useDewyTheme();
  const onColor = period === 'morning' ? palette.peach : palette.rose;
  const iconColor = on ? palette.onAccent : palette.ritualToggleOffIcon;

  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityLabel={`${productName}, ${period} ritual`}
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: on ? onColor : palette.surface,
          borderColor: on ? onColor : palette.ritualToggleOffRing,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {period === 'morning' ? (
        <SunIcon color={iconColor} size={20} />
      ) : (
        <MoonIcon color={iconColor} size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radii.tile,
  },
});
