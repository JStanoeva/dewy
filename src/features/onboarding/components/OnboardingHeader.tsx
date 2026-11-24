import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

// The header row sits at the artboard's y 48 and is 44 high, like the form modals' header.
const headerTop = 48;
const headerHeight = 44;
const stepCount = 3;

type OnboardingHeaderProps = {
  step: 1 | 2 | 3;
  // Step 1 has none (the user has just signed up), so a spacer keeps the pills centred.
  onBack?: () => void;
  onSkip: () => void;
  // Skip shows a spinner while its own request runs, and stays inert while any request does.
  skipping: boolean;
  disabled: boolean;
};

export function OnboardingHeader({
  step,
  onBack,
  onSkip,
  skipping,
  disabled,
}: OnboardingHeaderProps) {
  const { palette } = useDewyTheme();
  const steps = Array.from({ length: stepCount }, (_, index) => index + 1);

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onBack}
          style={({ pressed }) => [
            styles.side,
            styles.back,
            {
              backgroundColor: palette.surface,
              boxShadow: palette.iconButtonShadow,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={palette.text}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Step ${step} of ${stepCount}`}
        style={styles.pills}
      >
        {steps.map((number) => (
          <View
            key={number}
            style={[
              styles.pill,
              { backgroundColor: number <= step ? palette.primary : palette.track },
            ]}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip"
        accessibilityState={{ disabled, busy: skipping }}
        disabled={disabled}
        onPress={onSkip}
        style={({ pressed }) => [styles.side, { opacity: pressed ? 0.6 : 1 }]}
      >
        {skipping ? (
          <ActivityIndicator color={palette.ink} />
        ) : (
          <Text style={[styles.skip, { color: palette.ink }]}>Skip</Text>
        )}
      </Pressable>
    </View>
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
  side: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.pill,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.snug,
  },
  pill: {
    width: 40,
    height: 6,
    borderRadius: radii.pill,
  },
  skip: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
