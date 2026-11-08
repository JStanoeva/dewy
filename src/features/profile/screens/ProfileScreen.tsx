import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { signOut } from '@/features/auth/services/authService';
import { useProfile } from '@/features/profile/hooks/useProfile';
import type { Profile } from '@/features/profile/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

export function ProfileScreen() {
  const { palette, paletteName } = useDewyTheme();
  const profile = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogOut() {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setIsSigningOut(false);
      Alert.alert("Couldn't log out", 'Please try again.');
    }
  }

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.circle,
            { backgroundColor: paletteName === 'morning' ? palette.peach : palette.surfaceAlt },
          ]}
        />

        {profile.data ? (
          <ProfileHeader profile={profile.data} />
        ) : profile.isError ? (
          <ErrorState
            message="We couldn't load your profile. Check your connection and try again."
            onRetry={() => profile.refetch()}
            retrying={profile.isFetching}
          />
        ) : (
          <LoadingState />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={handleLogOut}
          style={({ pressed }) => [styles.logOut, { opacity: isSigningOut || pressed ? 0.6 : 1 }]}
        >
          <Feather name="log-out" size={18} color={palette.warning} style={styles.logOutIcon} />
          <Text style={[styles.logOutLabel, { color: palette.warning }]}>Log out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function ProfileHeader({ profile }: { profile: Profile }) {
  const { palette } = useDewyTheme();
  const initial = Array.from(profile.displayName.trim())[0]?.toUpperCase() ?? '';
  const since = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.header}>
      <View
        aria-hidden
        style={[
          styles.avatar,
          {
            backgroundColor: palette.salmon,
            borderColor: palette.surface,
            boxShadow: palette.avatarShadow,
          },
        ]}
      >
        <Text style={[styles.avatarInitial, { color: palette.onAccent }]}>{initial}</Text>
      </View>
      <View style={styles.headerText}>
        <Text accessibilityRole="header" style={[styles.name, { color: palette.text }]}>
          {profile.displayName}
        </Text>
        <Text style={[styles.since, { color: palette.textMuted }]}>
          Glowing with Dewy since {since}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  circle: {
    position: 'absolute',
    top: -170,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: radii.pill,
  },
  avatarInitial: {
    overflow: 'visible',
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.avatarInitial,
  },
  headerText: {
    flex: 1,
    gap: spacing.hairline,
  },
  name: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.profileName,
    lineHeight: fontSizes.profileName * 1.1,
  },
  since: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  logOut: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logOutIcon: {
    transform: [{ scaleX: -1 }],
  },
  logOutLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
