import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

// The header row sits at the artboard's y 48 and is 44 high, so a form under it scrolls from y 92.
const headerTop = 48;
const headerHeight = 44;
export const formHeaderBottom = headerTop + headerHeight;

type FormHeaderProps = {
  title: string;
  onClose: () => void;
};

// The form modals' header: a round close button, a centred title and a spacer that balances it.
export function FormHeader({ title, onClose }: FormHeaderProps) {
  const { palette } = useDewyTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: palette.surface,
            boxShadow: palette.iconButtonShadow,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <CloseIcon color={palette.text} />
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <View style={styles.iconButton} />
    </View>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <Path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: headerTop,
    height: headerHeight,
    paddingHorizontal: spacing.xxl,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.body,
  },
});
