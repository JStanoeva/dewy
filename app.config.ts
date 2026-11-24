import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Dewy',
  slug: 'dewy',
  owner: 'torablaze',
  scheme: 'dewy',
  version: '1.1.0',
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
    // Added by the template and expo-secure-store, but Dewy never draws overlays or asks for biometrics.
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ],
  },
  plugins: [
    ['expo-splash-screen', { backgroundColor: '#FFF5EF' }],
    ['expo-navigation-bar', { enforceContrast: false, style: 'dark' }],
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
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#6d6875' }],
  ],
  extra: {
    eas: {
      projectId: '6cf056be-4766-4258-83d2-a6fc19cc359d',
    },
  },
};

export default config;
