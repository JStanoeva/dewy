import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Category } from '@/features/products/constants';
import type { ProductStatus } from '@/features/products/types';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetails: { productId: string };
  ProductForm:
    | { productId?: string; status?: ProductStatus; category?: Category; barcode?: string }
    | undefined;
  BarcodeScanner: undefined;
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
  Routines: undefined;
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
