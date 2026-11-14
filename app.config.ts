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
      backgroundColor: '#ffcdb2',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    ['expo-splash-screen', { backgroundColor: '#FFF5EF' }],
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        cameraPermission: 'Dewy uses your camera to take photos of your products.',
        photosPermission: 'Dewy lets you choose product photos from your library.',
        // Photos only; false also blocks RECORD_AUDIO in the Android manifest.
        microphonePermission: false,
      },
    ],
  ],
};

export default config;
