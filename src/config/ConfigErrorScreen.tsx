import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, spacing } from '@/theme/tokens';

export function ConfigErrorScreen({ problems }: { problems: string[] }) {
  const { palette } = useDewyTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>Setup needed</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          {"Dewy isn't "}
          <Text style={[styles.titleItalic, { color: palette.emphasis }]}>connected</Text> yet
        </Text>
        <Text style={[styles.body, { color: palette.textSoft }]}>
          Copy .env.example to .env, add your Supabase project URL and publishable key, then restart
          Expo. For an APK build, set the same variables in the EAS environment.
        </Text>
        {problems.map((problem) => (
          <Text key={problem} style={[styles.problem, { color: palette.warning }]}>
            • {problem}
          </Text>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.md,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.body,
    lineHeight: 21,
  },
  problem: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.secondary,
  },
});
