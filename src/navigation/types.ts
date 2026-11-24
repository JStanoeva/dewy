import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Category } from '@/features/products/constants';
import type { ProductStatus } from '@/features/products/types';
import type { Period } from '@/theme/period';

export type RootStackParamList = {
  Auth: undefined;
  ProfileGate: undefined;
  ShelfStep: undefined;
  RitualsStep: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetails: { productId: string };
  // lockStatus hides the I own it / Wishlist control, as onboarding adds owned products only.
  ProductForm:
    | { productId?: string; status?: ProductStatus; category?: Category; lockStatus?: boolean }
    | undefined;
  RoutineStepForm: { period: Period; stepId?: string };
};

export type MainTabParamList = {
  TodayTab: undefined;
  ShelfTab: NavigatorScreenParams<ShelfStackParamList> | undefined;
  RoutinesTab: NavigatorScreenParams<RoutinesStackParamList> | undefined;
  MeTab: NavigatorScreenParams<MeStackParamList> | undefined;
};

export type ShelfStackParamList = {
  Shelf: undefined;
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
