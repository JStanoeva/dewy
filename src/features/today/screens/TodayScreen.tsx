import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

function formatToday() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayMonth = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${weekday} · ${dayMonth}`;
}

export function TodayScreen() {
  const { palette, paletteName } = useDewyTheme();
  const navigation = useNavigation();
  const profile = useProfile();
  const isMorning = paletteName === 'morning';
  const name = profile.data?.displayName;
  const [dateLabel, setDateLabel] = useState(formatToday);

  // The app can resume on a later day, so re-read the date whenever it comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setDateLabel(formatToday());
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.circle,
            { backgroundColor: isMorning ? palette.peach : palette.surfaceAlt },
          ]}
        />
        {isMorning ? null : (
          <>
            <View style={[styles.starLarge, { backgroundColor: palette.peach }]} />
            <View style={[styles.starRight, { backgroundColor: palette.salmon }]} />
            <View style={[styles.starTop, { backgroundColor: palette.rose }]} />
          </>
        )}

        <Text style={[styles.kicker, { color: palette.textMuted }]}>{dateLabel}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          {isMorning ? 'Good morning' : 'Good evening'}
          {name ? (
            <>
              {', '}
              <Text style={[styles.titleName, { color: palette.emphasis }]}>{name}</Text>
            </>
          ) : null}
        </Text>

        {profile.isError && !profile.data ? (
          <ErrorState
            message="We couldn't load your profile. Check your connection and try again."
            onRetry={() => profile.refetch()}
            retrying={profile.isFetching}
          />
        ) : (
          <EmptyState
            title="Add your first product"
            message="Your ritual is built from the products on your shelf."
            action={{ label: 'Add a product', onPress: () => navigation.navigate('ProductForm') }}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  circle: {
    position: 'absolute',
    top: -130,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
  },
  starLarge: {
    position: 'absolute',
    top: 70,
    right: 86,
    width: 4,
    height: 4,
    borderRadius: radii.pill,
  },
  starRight: {
    position: 'absolute',
    top: 118,
    right: 35,
    width: 3,
    height: 3,
    borderRadius: radii.pill,
  },
  starTop: {
    position: 'absolute',
    top: 40,
    right: 139,
    width: 3,
    height: 3,
    borderRadius: radii.pill,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.snug,
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.15,
    letterSpacing: letterSpacings.title,
  },
  titleName: {
    fontFamily: fonts.displayItalic,
  },
});
