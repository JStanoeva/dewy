import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingProductRow } from '@/features/onboarding/components/OnboardingProductRow';
import { RitualSummaryCard } from '@/features/onboarding/components/RitualSummaryCard';
import { RitualToggle } from '@/features/onboarding/components/RitualToggle';
import { useOnboardingDraft } from '@/features/onboarding/providers/OnboardingDraftProvider';
import {
  firstRitualSteps,
  onboardingProducts,
  sortForRituals,
  splitRituals,
} from '@/features/onboarding/utils/firstRituals';
import { categoryDetails } from '@/features/products/constants';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCompleteOnboarding } from '@/features/profile/hooks/useCompleteOnboarding';
import { useFinishOnboarding } from '@/features/profile/hooks/useFinishOnboarding';
import type { RootStackParamList } from '@/navigation/types';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, radii, spacing } from '@/theme/tokens';

type RitualsStepScreenProps = NativeStackScreenProps<RootStackParamList, 'RitualsStep'>;

const MIN_BOTTOM_SPACE = 28;

export function RitualsStepScreen({ navigation }: RitualsStepScreenProps) {
  const { palette } = useDewyTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const products = useProducts();
  const { placementFor, toggle } = useOnboardingDraft();
  const completeOnboarding = useCompleteOnboarding();
  const finishOnboarding = useFinishOnboarding();
  const [finishingFrom, setFinishingFrom] = useState<'skip' | 'button' | null>(null);
  const [failedFrom, setFailedFrom] = useState<'skip' | 'button' | null>(null);
  const finishing = useRef(false);

  const rows = sortForRituals(onboardingProducts(products.data ?? [])).map((product) => ({
    product,
    placement: placementFor(product),
  }));
  const rituals = splitRituals(rows);
  const busy = finishingFrom !== null;

  // Continue saves the rituals and finishes; Skip finishes with no ritual steps.
  async function finish(from: 'skip' | 'button') {
    if (finishing.current || !session) {
      return;
    }
    finishing.current = true;
    setFinishingFrom(from);
    setFailedFrom(null);
    try {
      if (from === 'skip') {
        await completeOnboarding.mutateAsync(session.user.id);
      } else {
        await finishOnboarding.mutateAsync(firstRitualSteps(rituals));
      }
    } catch {
      setFinishingFrom(null);
      setFailedFrom(from);
    } finally {
      finishing.current = false;
    }
  }

  return (
    <Screen edges={['left', 'right']}>
      <View
        pointerEvents="none"
        style={[styles.circle, { backgroundColor: palette.onboardingRitualsCircle }]}
      />
      <OnboardingHeader
        step={2}
        onBack={() => navigation.goBack()}
        onSkip={() => finish('skip')}
        skipping={finishingFrom === 'skip'}
        disabled={busy}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: palette.textMuted }]}>
          Step 2 of 3 · Your rituals
        </Text>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
          Your first <Text style={[styles.titleItalic, { color: palette.emphasis }]}>rituals</Text>
        </Text>
        <Text style={[styles.subline, { color: palette.textMuted }]}>
          Dewy placed each product for you. Flip anything that&apos;s off, and fine-tune days and
          order later.
        </Text>

        {products.data ? (
          <>
            <View accessibilityLabel="Your products" style={styles.list}>
              {rows.map(({ product, placement }) => {
                const shelfOnly = !placement.am && !placement.pm;
                const meta = shelfOnly
                  ? 'Stays on your shelf only'
                  : [categoryDetails[product.category].label, product.brand]
                      .filter(Boolean)
                      .join(' · ');
                return (
                  <OnboardingProductRow
                    key={product.id}
                    product={product}
                    meta={meta}
                    italicMeta={shelfOnly}
                    accessory={
                      <View style={styles.toggles}>
                        <RitualToggle
                          period="morning"
                          productName={product.name}
                          on={placement.am}
                          disabled={busy}
                          onToggle={() => toggle(product, 'morning')}
                        />
                        <RitualToggle
                          period="evening"
                          productName={product.name}
                          on={placement.pm}
                          disabled={busy}
                          onToggle={() => toggle(product, 'evening')}
                        />
                      </View>
                    }
                  />
                );
              })}
            </View>
            <RitualSummaryCard rituals={rituals} />
          </>
        ) : products.isPending ? (
          <LoadingState />
        ) : (
          <ErrorState
            message="We couldn't load your products. Check your connection and try again."
            onRetry={() => products.refetch()}
            retrying={products.isFetching}
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, MIN_BOTTOM_SPACE) },
        ]}
      >
        {failedFrom && !busy ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.error, { color: palette.warning }]}
          >
            {failedFrom === 'button'
              ? "We couldn't save your rituals. Check your connection and try again."
              : "Couldn't reach Dewy. Check your connection and try again."}
          </Text>
        ) : null}
        <AppButton
          pinned
          arrow
          title="Continue"
          loading={finishingFrom === 'button'}
          disabled={finishingFrom === 'skip' || !products.data}
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
  list: {
    marginTop: 18,
    gap: spacing.xs,
  },
  toggles: {
    flexDirection: 'row',
    gap: spacing.snug,
    marginRight: spacing.sm,
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
