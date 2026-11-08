export type RootStackParamList = {
  Auth: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- global typing needs an interface to merge into
    interface RootParamList extends RootStackParamList {}
  }
}
