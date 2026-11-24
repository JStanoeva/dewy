import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, radii, spacing } from '@/theme/tokens';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  // A button pinned to the bottom of the screen casts the artboards' stronger shadow.
  pinned?: boolean;
  disabled?: boolean;
  // An 18 arrow after the title, for buttons that move on to the next step.
  arrow?: boolean;
  // Transparent with muted text and no shadow, for the onboarding step's Skip for now.
  quiet?: boolean;
};

export function AppButton({
  title,
  onPress,
  loading = false,
  pinned = false,
  disabled = false,
  arrow = false,
  quiet = false,
}: AppButtonProps) {
  const { palette } = useDewyTheme();
  const textColor = quiet ? palette.textMuted : palette.onPrimary;
  const shadow = pinned ? palette.pinnedCtaShadow : palette.ctaShadow;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading || disabled, busy: loading }}
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: quiet ? 'transparent' : palette.primary,
          boxShadow: quiet ? 'none' : shadow,
          opacity: disabled && !loading ? 0.4 : pressed ? (quiet ? 0.6 : 0.9) : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {arrow ? <ArrowIcon color={textColor} /> : null}
        </>
      )}
    </Pressable>
  );
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    borderRadius: radii.pill,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.button,
  },
});
