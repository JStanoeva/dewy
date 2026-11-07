import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Fraunces_500Medium_Italic } from '@expo-google-fonts/fraunces/500Medium_Italic';

export const fonts = {
  display: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export const fontAssets = {
  [fonts.display]: Fraunces_500Medium,
  [fonts.displayItalic]: Fraunces_500Medium_Italic,
  [fonts.body]: DMSans_400Regular,
  [fonts.bodyMedium]: DMSans_500Medium,
  [fonts.bodySemiBold]: DMSans_600SemiBold,
  [fonts.bodyBold]: DMSans_700Bold,
};

export const fontSizes = {
  wordmark: 52,
  titleLarge: 34,
  title: 32,
  formTitle: 30,
  authTitle: 26,
  section: 22,
  subSection: 20,
  button: 16,
  bodyLarge: 16,
  body: 15,
  secondary: 14,
  meta: 13,
  kicker: 12,
  label: 11,
} as const;

export const letterSpacings = {
  wordmark: -1.04,
  kicker: 1.4,
  label: 0.9,
} as const;

export const radii = {
  pill: 999,
  sheet: 32,
  tabBar: 28,
  productCard: 24,
  card: 22,
  input: 16,
  tile: 14,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  screen: 24,
} as const;

export const minTouchTarget = 44;
