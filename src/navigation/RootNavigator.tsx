import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import type { RootStackParamList } from '@/navigation/types';
import { MorningTheme, useDewyTheme } from '@/theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, isRestoring } = useAuth();
  const { palette, paletteName } = useDewyTheme();

  if (isRestoring) {
    return null;
  }

  const navigationTheme = {
    ...DefaultTheme,
    dark: paletteName === 'evening',
    colors: { ...DefaultTheme.colors, background: palette.background },
  };

  return (
    <NavigationContainer theme={navigationTheme} onReady={() => SplashScreen.hideAsync()}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Profile" navigationKey={session.user.id} component={ProfileScreen} />
        ) : (
          <Stack.Group screenLayout={MorningTheme}>
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
