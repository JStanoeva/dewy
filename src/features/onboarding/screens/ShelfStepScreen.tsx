import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppButton } from '@/components/AppButton';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingProductRow } from '@/features/onboarding/components/OnboardingProductRow';
import { useDeleteProduct } from '@/features/products/hooks/useProductMutations';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types';
import { useCompleteOnboarding } from '@/features/profile/hooks/useCompleteOnboarding';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type ShelfStepScreenProps = NativeStackScreenProps<RootStackParamList, 'ShelfStep'>;

const MIN_BOTTOM_SPACE = 28;
// The rows below move up as soon as one goes, so a second tap this soon would remove the next product.
const removalLockMs = 700;

export function ShelfStepScreen({ navigation }: ShelfStepScreenProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const products = useProducts();
  const deleteProduct = useDeleteProduct();
  const completeOnboarding = useCompleteOnboarding();
  const [finishingFrom, setFinishingFrom] = useState<'skip' | 'button' | null>(null);
  const finishing = useRef(false);
  const removalLocked = useRef(false);

  // The account's owned products, oldest first, so each new one joins the bottom of the list.
  const owned = (products.data ?? [])
    .filter((product) => product.status === 'owned')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const hasProducts = owned.length > 0;
  const busy = finishingFrom !== null;

  // Until the rituals step exists, Continue, Skip for now and Skip all finish onboarding.
  async function finish(from: 'skip' | 'button') {
    if (finishing.current || !session) {
      return;
    }
    finishing.current = true;
    setFinishingFrom(from);
    try {
      await completeOnboarding.mutateAsync(session.user.id);
    } catch {
      setFinishingFrom(null);
    } finally {
      finishing.current = false;
    }
  }

  async function remove(product: Product) {
    if (removalLocked.current) {
      return;
    }
    removalLocked.current = true;
    setTimeout(() => {
      removalLocked.current = false;
    }, removalLockMs);
    try {
      await deleteProduct.mutateAsync(product.id);
    } catch {
      Alert.alert(`Couldn't remove ${product.name}`, 'Check your connection and try again.');
    }
  }

  function addProduct() {
    navigation.navigate('ProductForm', { status: 'owned', lockStatus: true });
  }

  return (
    <Screen edges={['left', 'right']}>
      <View
        pointerEvents="none"
        style={[styles.circle, { backgroundColor: palette.onboardingShelfCircle }]}
      />
      <OnboardingHeader
        step={1}
        onSkip={() => finish('skip')}
        skipping={finishingFrom === 'skip'}
        disabled={busy}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>Step 1 of 3 · Your shelf</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          Start your <Text style={[styles.titleItalic, { color: palette.emphasis }]}>shelf</Text>
        </Text>
        <Text style={[styles.subline, { color: palette.textMuted }]}>
          Add the products you use most. Next, Dewy drafts your rituals from them.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasProducts ? 'Add another product' : 'Add a product'}
          accessibilityHint="Snap a photo or pick its packaging"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={addProduct}
          style={({ pressed }) => [
            styles.addCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.mauve,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[styles.addCircle, { backgroundColor: palette.peach }]}>
            <Svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke={palette.onAccent}
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </View>
          <View style={styles.addText}>
            <Text style={[styles.addLabel, { color: palette.text }]}>
              {hasProducts ? 'Add another product' : 'Add a product'}
            </Text>
            <Text style={[styles.addHint, { color: palette.textMuted }]}>
              Snap a photo or pick its packaging
            </Text>
          </View>
        </Pressable>

        {hasProducts ? (
          <View accessibilityLabel="Products added" style={styles.list}>
            {owned.map((product) => (
              <OnboardingProductRow
                key={product.id}
                product={product}
                onRemove={() => remove(product)}
              />
            ))}
          </View>
        ) : products.isPending ? (
          <LoadingState />
        ) : products.isError ? (
          <ErrorState
            message="We couldn't load your products. Check your connection and try again."
            onRetry={() => products.refetch()}
            retrying={products.isFetching}
          />
        ) : (
          <Text style={[styles.empty, { color: palette.textMuted }]}>
            Most rituals start with a{' '}
            <Text style={[styles.emptyStrong, { color: palette.text }]}>cleanser</Text>, a{' '}
            <Text style={[styles.emptyStrong, { color: palette.text }]}>moisturizer</Text> and{' '}
            <Text style={[styles.emptyStrong, { color: palette.text }]}>SPF</Text>. Add those first
            and we&apos;ll take it from there.
          </Text>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {completeOnboarding.isError && !busy ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.error, { color: palette.warning }]}
          >
            Couldn&apos;t reach Dewy. Check your connection and try again.
          </Text>
        ) : null}
        <AppButton
          pinned
          arrow
          quiet={!hasProducts}
          title={hasProducts ? 'Continue' : 'Skip for now'}
          loading={finishingFrom === 'button'}
          disabled={finishingFrom === 'skip'}
          onPress={() => finish('button')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    top: -150,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: radii.pill,
  },
  content: {
    paddingTop: spacing.screen,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.screen,
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.kicker,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.xs,
    overflow: 'visible',
    fontFamily: fonts.display,
    fontSize: fontSizes.formTitle,
    lineHeight: fontSizes.formTitle * 1.12,
    letterSpacing: letterSpacings.title,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
  },
  subline: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: fontSizes.secondary * 1.45,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 72,
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.card,
  },
  addCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  addText: {
    flex: 1,
    gap: spacing.hairline,
  },
  addLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.bodyLarge,
  },
  addHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.meta,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  empty: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSizes.secondary,
    lineHeight: fontSizes.secondary * 1.5,
    textAlign: 'center',
  },
  emptyStrong: {
    fontFamily: fonts.bodyBold,
  },
  footer: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.meta,
  },
});
