import { StyleSheet, Text, View } from 'react-native';

import { AppProviders } from '@/app/AppProviders';
import { Screen } from '@/components/Screen';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings } from '@/theme/tokens';

export default function App() {
  return (
    <AppProviders>
      <WordmarkScreen />
    </AppProviders>
  );
}

function WordmarkScreen() {
  const { palette } = useDewyTheme();

  return (
    <Screen>
      <View style={styles.center}>
        <Text accessibilityRole="header" style={[styles.wordmark, { color: palette.text }]}>
          Dewy
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.wordmark,
    letterSpacing: letterSpacings.wordmark,
  },
});
