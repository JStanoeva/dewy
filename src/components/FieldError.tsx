import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes } from '@/theme/tokens';

type FieldErrorProps = {
  children: string | undefined;
  style?: StyleProp<TextStyle>;
};

// The error line under a form control that isn't a text field (chips, tiles, pickers).
export function FieldError({ children, style }: FieldErrorProps) {
  const { palette } = useDewyTheme();
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.error, { color: palette.warning }, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
