import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Dewy',
  slug: 'dewy',
  scheme: 'dewy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.jstanoeva.dewy',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [['expo-splash-screen', { backgroundColor: '#FFF5EF' }]],
};

export default config;
