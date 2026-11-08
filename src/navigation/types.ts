import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
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
