import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { AuthScreen } from '@/features/auth/screens/AuthScreen';
import { BarcodeScannerScreen } from '@/features/products/screens/BarcodeScannerScreen';
import { ProductDetailsScreen } from '@/features/products/screens/ProductDetailsScreen';
import { ProductFormScreen } from '@/features/products/screens/ProductFormScreen';
import { MainTabs } from '@/navigation/MainTabs';
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
          <Stack.Group navigationKey={session.user.id}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="BarcodeScanner"
              component={BarcodeScannerScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
          </Stack.Group>
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
