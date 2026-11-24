import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { signOut } from '@/features/auth/services/authService';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

// Shown while a signed-in account's profile loads; the root swaps it for onboarding or the tabs.
export function ProfileGateScreen() {
  const { palette } = useDewyTheme();
  const profile = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signingOut = useRef(false);

  async function handleLogOut() {
    if (signingOut.current) {
      return;
    }
    signingOut.current = true;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      signingOut.current = false;
      setIsSigningOut(false);
      Alert.alert("Couldn't log out", 'Please try again.');
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {profile.isError ? (
          <>
            <ErrorState
              message="We couldn't load your profile. Check your connection and try again."
              onRetry={() => profile.refetch()}
              retrying={profile.isFetching}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
              disabled={isSigningOut}
              onPress={handleLogOut}
              style={({ pressed }) => [styles.logOut, { opacity: pressed ? 0.6 : 1 }]}
            >
              {isSigningOut ? (
                <ActivityIndicator color={palette.textMuted} />
              ) : (
                <Text style={[styles.logOutLabel, { color: palette.textMuted }]}>Log out</Text>
              )}
            </Pressable>
          </>
        ) : (
          <LoadingState />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  logOut: {
    minWidth: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  logOutLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
