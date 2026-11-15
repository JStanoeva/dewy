import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';

// The 22 tick circle of the Add product artboard's "Add to routine" rows.
export function TickCircle({ checked }: { checked: boolean }) {
  const { palette } = useDewyTheme();
  const ring = checked ? palette.primary : palette.mauve;
  return (
    <View
      style={[
        styles.circle,
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
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radii.pill,
  },
});
