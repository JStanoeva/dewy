import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { NotificationSettings } from '@/features/settings/components/NotificationSettings';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, minTouchTarget, radii, spacing } from '@/theme/tokens';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { palette, paletteName } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  // The root navigator only shows the tabs once the profile has loaded, so it is cached here.
  const profile = useProfile();
  const version = Constants.expoConfig?.version;
  // The corner circle runs up under the status bar, so its backdrop waits until the page scrolls.
  const [scrolled, setScrolled] = useState(false);

  return (
    <Screen edges={['left', 'right']} statusBarBackdrop={scrolled}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 0)}
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.circle,
            { backgroundColor: paletteName === 'morning' ? palette.peach : palette.surfaceAlt },
          ]}
        />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
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
          <Text accessibilityRole="header" style={[styles.title, { color: palette.emphasis }]}>
            Settings
          </Text>
        </View>

        <View>
          <Text
            accessibilityRole="header"
            style={[styles.sectionLabel, { color: palette.textMuted }]}
          >
            Account
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, boxShadow: palette.cardShadow },
            ]}
          >
            <SettingsRow label="Name" value={profile.data?.displayName ?? ''} divider />
            <SettingsRow label="Email" value={session?.user.email ?? ''} />
          </View>
        </View>

        {profile.data ? (
          <View>
            <Text
              accessibilityRole="header"
              style={[styles.sectionLabel, { color: palette.textMuted }]}
            >
              Notifications
            </Text>
            <NotificationSettings profile={profile.data} />
          </View>
        ) : null}

        {version ? (
          <Text style={[styles.version, { color: palette.textMuted }]}>Dewy {version}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
  divider?: boolean;
};

function SettingsRow({ label, value, divider = false }: SettingsRowProps) {
  const { palette } = useDewyTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      style={[styles.row, divider && [styles.divider, { borderBottomColor: palette.divider }]]}
    >
      <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: palette.textMuted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xxl,
    paddingTop: 48,
    paddingHorizontal: spacing.screen,
  },
  circle: {
    position: 'absolute',
    top: -170,
    right: -130,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
  },
  header: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  title: {
    overflow: 'visible',
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.titleLarge,
    lineHeight: fontSizes.titleLarge * 1.1,
    letterSpacing: letterSpacings.title,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.sectionLabel,
    textTransform: 'uppercase',
  },
  card: {
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
  },
  divider: {
    borderBottomWidth: 1,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.body,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
  },
  version: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
});
