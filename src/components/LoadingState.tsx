import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useDewyTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function LoadingState() {
  const { palette } = useDewyTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator accessibilityLabel="Loading" color={palette.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.screen,
  },
});
