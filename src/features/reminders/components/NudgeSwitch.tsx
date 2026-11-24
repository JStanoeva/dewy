import { Pressable, StyleSheet, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { minTouchTarget, radii } from '@/theme/tokens';

type NudgeSwitchProps = {
  // The card's label, which TalkBack reads with the switch's state.
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
};

// The artboard's drawn switch, in place of React Native's Material one; a switch to TalkBack.
export function NudgeSwitch({ label, on, disabled, onToggle }: NudgeSwitchProps) {
  const { palette } = useDewyTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: on ? palette.primary : palette.switchOff,
            justifyContent: on ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            { backgroundColor: palette.switchThumb, boxShadow: palette.switchThumbShadow },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    width: 48,
    height: 28,
    padding: 3,
    borderRadius: radii.pill,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
  },
});
