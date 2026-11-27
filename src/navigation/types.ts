import type { NavigatorScreenParams } from '@react-navigation/native';

import type { FirstRitualStep } from '@/features/onboarding/utils/firstRituals';
import type { Category } from '@/features/products/constants';
import type { ProductStatus } from '@/features/products/types';
import type { Period } from '@/theme/period';

export type RootStackParamList = {
  Auth: undefined;
  ProfileGate: undefined;
  ShelfStep: undefined;
  RitualsStep: undefined;
  // Step 2's rituals, saved with the nudges on Start my ritual; empty when step 2 was skipped.
  NudgesStep: { steps: FirstRitualStep[] };
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetails: { productId: string };
  // lockStatus hides the I own it / Wishlist control, as onboarding adds owned products only.
  ProductForm:
    | { productId?: string; status?: ProductStatus; category?: Category; lockStatus?: boolean }
    | undefined;
  RoutineStepForm: { period: Period; stepId?: string };
  Settings: undefined;
  SkinDetails: undefined;
};

export type MainTabParamList = {
  // Set by a ritual nudge's tap; Today applies it once and clears it.
  TodayTab: { period?: Period } | undefined;
  ShelfTab: NavigatorScreenParams<ShelfStackParamList> | undefined;
  RoutinesTab: NavigatorScreenParams<RoutinesStackParamList> | undefined;
  MeTab: NavigatorScreenParams<MeStackParamList> | undefined;
};

export type ShelfStackParamList = {
  Shelf: { initialTab?: ProductStatus } | undefined;
};

export type RoutinesStackParamList = {
  Routines: { period?: Period } | undefined;
};

export type MeStackParamList = {
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- global typing needs an interface to merge into
    interface RootParamList extends RootStackParamList {}
  }
}
