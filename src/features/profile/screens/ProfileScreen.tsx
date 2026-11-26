import Feather from '@expo/vector-icons/Feather';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { signOut } from '@/features/auth/services/authService';
import { useProducts, useProductUses } from '@/features/products/hooks/useProducts';
import type { ProductStatus } from '@/features/products/types';
import { defaultLowUsesThreshold } from '@/features/products/utils/usesLeft';
import { FavouritesSection } from '@/features/profile/components/FavouritesSection';
import { SkinProfileCard } from '@/features/profile/components/SkinProfileCard';
import { StatTiles } from '@/features/profile/components/StatTiles';
import { useProfile } from '@/features/profile/hooks/useProfile';
import type { Profile } from '@/features/profile/types';
import { countNeedAttention } from '@/features/profile/utils/needAttention';
import { useLocalToday } from '@/hooks/useLocalToday';
import type { MainTabParamList, MeStackParamList, RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, minTouchTarget, radii, spacing } from '@/theme/tokens';

type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MeStackParamList, 'Profile'>,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'MeTab'>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { palette, paletteName } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const products = useProducts();
  // Only feeds Need attention's running low, so a failed count never blocks the screen.
  const productUses = useProductUses();
  const today = useLocalToday();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // The header circle runs up under the status bar, so its backdrop waits until the page scrolls.
  const [scrolled, setScrolled] = useState(false);

  const allProducts = products.data ?? [];
  const ownedCount = allProducts.filter((product) => product.status === 'owned').length;
  const attentionCount = countNeedAttention(
    allProducts,
    productUses.data,
    profile.data?.lowUsesThreshold ?? defaultLowUsesThreshold,
    today,
  );
  const favourites = allProducts.filter((product) => product.isFavorite);
  const loadFailed = (!profile.data && profile.isError) || (!products.data && products.isError);

  function retry() {
    if (profile.isError) {
      profile.refetch();
    }
    if (products.isError) {
      products.refetch();
    }
  }

  // Local state, so the spinner only shows for a pull and not for background refetches.
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([profile.refetch(), products.refetch(), productUses.refetch()]);
    setRefreshing(false);
  }

  function openShelf(initialTab: ProductStatus) {
    navigation.navigate('ShelfTab', { screen: 'Shelf', params: { initialTab } });
  }

  async function handleLogOut() {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setIsSigningOut(false);
      Alert.alert("Couldn't log out", 'Please try again.');
    }
  }

  return (
    <Screen edges={['left', 'right']} statusBarBackdrop={scrolled}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 0)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && profile.data !== undefined && products.data !== undefined}
            onRefresh={handleRefresh}
            colors={[palette.primary]}
            progressBackgroundColor={palette.surface}
            progressViewOffset={insets.top}
            tintColor={palette.primary}
          />
        }
      >
        <View
          style={[
            styles.circle,
            { backgroundColor: paletteName === 'morning' ? palette.peach : palette.surfaceAlt },
          ]}
        />

        {profile.data ? (
          <ProfileHeader
            profile={profile.data}
            onOpenSettings={() => navigation.navigate('Settings')}
          />
        ) : null}
        {profile.data && products.data ? (
          <>
            <StatTiles
              ownedCount={ownedCount}
              attentionCount={attentionCount}
              wishlistCount={allProducts.length - ownedCount}
              onOpenShelf={openShelf}
            />
            {favourites.length > 0 ? (
              <FavouritesSection
                products={favourites}
                onOpen={(productId) => navigation.navigate('ProductDetails', { productId })}
              />
            ) : null}
            <SkinProfileCard
              profile={profile.data}
              onOpen={() => navigation.navigate('SkinDetails')}
            />
          </>
        ) : loadFailed ? (
          <ErrorState
            message="We couldn't load your profile. Check your connection and try again."
            onRetry={retry}
            retrying={profile.isFetching || products.isFetching}
          />
        ) : (
          <LoadingState />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={handleLogOut}
          style={({ pressed }) => [styles.logOut, { opacity: isSigningOut || pressed ? 0.6 : 1 }]}
        >
          <Feather name="log-out" size={18} color={palette.warning} style={styles.logOutIcon} />
          <Text style={[styles.logOutLabel, { color: palette.warning }]}>Log out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

type ProfileHeaderProps = {
  profile: Profile;
  onOpenSettings: () => void;
};

function ProfileHeader({ profile, onOpenSettings }: ProfileHeaderProps) {
  const { palette } = useDewyTheme();
  const initial = Array.from(profile.displayName.trim())[0]?.toUpperCase() ?? '';
  const since = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.header}>
      <View
        aria-hidden
        style={[
          styles.avatar,
          {
            backgroundColor: palette.salmon,
            borderColor: palette.surface,
            boxShadow: palette.avatarShadow,
          },
        ]}
      >
        <Text style={[styles.avatarInitial, { color: palette.onAccent }]}>{initial}</Text>
      </View>
      <View style={styles.headerText}>
        <Text accessibilityRole="header" style={[styles.name, { color: palette.text }]}>
          {profile.displayName}
        </Text>
        <Text style={[styles.since, { color: palette.textMuted }]}>
          Glowing with Dewy since {since}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.settings,
          {
            backgroundColor: palette.surface,
            boxShadow: palette.iconButtonShadow,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={palette.text}
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <Circle cx={16} cy={7} r={2} />
          <Circle cx={10} cy={17} r={2} />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: 56,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  circle: {
    position: 'absolute',
    top: -170,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: radii.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: radii.pill,
  },
  avatarInitial: {
    overflow: 'visible',
    fontFamily: fonts.displayItalic,
    fontSize: fontSizes.avatarInitial,
  },
  headerText: {
    flex: 1,
    gap: spacing.hairline,
  },
  name: {
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.profileName,
    lineHeight: fontSizes.profileName * 1.1,
  },
  since: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  settings: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  logOut: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logOutIcon: {
    transform: [{ scaleX: -1 }],
  },
  logOutLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.secondary,
  },
});
