import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
import { OnboardingDraftProvider } from '@/features/onboarding/providers/OnboardingDraftProvider';
import { NudgesStepScreen } from '@/features/onboarding/screens/NudgesStepScreen';
import { RitualsStepScreen } from '@/features/onboarding/screens/RitualsStepScreen';
import { ShelfStepScreen } from '@/features/onboarding/screens/ShelfStepScreen';
import { ProductDetailsScreen } from '@/features/products/screens/ProductDetailsScreen';
import { ProductFormScreen } from '@/features/products/screens/ProductFormScreen';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { ProfileGateScreen } from '@/features/profile/screens/ProfileGateScreen';
import { RoutineStepFormScreen } from '@/features/routines/screens/RoutineStepFormScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { MainTabs } from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Like the session restore's cap: a slow profile load ends the splash and shows the loader instead.
const profileSplashCapMs = 5000;

export function RootNavigator() {
  const { session, isRestoring } = useAuth();
  const { palette, paletteName } = useDewyTheme();
  const profile = useProfile(session !== null);
  const [navigationReady, setNavigationReady] = useState(false);
  const [splashCapped, setSplashCapped] = useState(false);

  // Only before the first screen: later loads (after a sign-in) show the gate's loader.
  const holdSplash = !navigationReady && !splashCapped && session !== null && profile.isPending;

  useEffect(() => {
    if (!holdSplash) {
      return;
    }
    const timer = setTimeout(() => setSplashCapped(true), profileSplashCapMs);
    return () => clearTimeout(timer);
  }, [holdSplash]);

  if (isRestoring || holdSplash) {
    return null;
  }

  const navigationTheme = {
    ...DefaultTheme,
    dark: paletteName === 'evening',
    colors: { ...DefaultTheme.colors, background: palette.background },
  };

  function handleReady() {
    setNavigationReady(true);
    SplashScreen.hideAsync();
  }

  return (
    <NavigationContainer theme={navigationTheme} onReady={handleReady}>
      <OnboardingDraftProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
          ) : !profile.data ? (
            <Stack.Screen name="ProfileGate" component={ProfileGateScreen} />
          ) : profile.data.onboardingCompletedAt === null ? (
            <Stack.Group navigationKey={session.user.id}>
              <Stack.Screen name="ShelfStep" component={ShelfStepScreen} />
              <Stack.Screen name="RitualsStep" component={RitualsStepScreen} />
              <Stack.Screen name="NudgesStep" component={NudgesStepScreen} />
              <Stack.Screen
                name="ProductForm"
                component={ProductFormScreen}
                options={{ presentation: 'modal' }}
              />
            </Stack.Group>
          ) : (
            <Stack.Group navigationKey={session.user.id}>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen
                name="ProductForm"
                component={ProductFormScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="RoutineStepForm"
                component={RoutineStepFormScreen}
                options={{ presentation: 'modal' }}
              />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </OnboardingDraftProvider>
    </NavigationContainer>
  );
}
