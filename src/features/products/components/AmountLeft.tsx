import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewInstance,
} from 'react-native';

import { FieldError } from '@/components/FieldError';
import { FullnessTiles } from '@/features/products/components/FullnessTiles';
import { ShelfLifeBar } from '@/features/products/components/ShelfLifeCard';
import type { Fullness } from '@/features/products/constants';
import { useAdjustAmount } from '@/features/products/hooks/useProductMutations';
import { useProductUses } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types';
import {
  amountFooter,
  getAmountProgress,
  getUsesLeft,
  isRunningLow,
} from '@/features/products/utils/usesLeft';
import { getRitualDate } from '@/theme/period';
import { useDewyTheme } from '@/theme/ThemeProvider';
import { fonts, fontSizes, letterSpacings, spacing } from '@/theme/tokens';

type AmountLeftProps = {
  product: Product;
  // The product's steps' days added up; 0 in no ritual.
  perWeek: number;
  // Hidden while the product is being deleted.
  canAdjust: boolean;
};

const linkSlop = { top: 13, bottom: 13, left: spacing.xs, right: spacing.xs };

// The Shelf life card's lower half: uses left, the bar, and "Feels off? Adjust".
export function AmountLeft({ product, perWeek, canAdjust }: AmountLeftProps) {
  const { palette } = useDewyTheme();
  const productUses = useProductUses();
  const adjust = useAdjustAmount();
  const [adjusting, setAdjusting] = useState(false);
  const linkRef = useRef<ViewInstance>(null);
  // A second tap in the same frame still sees isPending as false, so the ref blocks it.
  const saving = useRef(false);

  if (product.sizeMl === null || (!productUses.data && !productUses.isError)) {
    return null;
  }

  const divider = <View style={[styles.divider, { backgroundColor: palette.divider }]} />;

  if (!productUses.data) {
    return (
      <>
        {divider}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.textMuted }]}>
            {"Couldn't count the uses."}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={productUses.isFetching}
            hitSlop={linkSlop}
            onPress={() => productUses.refetch()}
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.linkText, { color: palette.text }]}>Try again</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const usesLeft = getUsesLeft(product, productUses.data[product.id] ?? 0);
  if (usesLeft === null) {
    return null;
  }
  const uses = `${usesLeft} ${usesLeft === 1 ? 'use' : 'uses'}`;
  const footer = amountFooter(product.sizeMl, usesLeft, perWeek);

  function openOrCancel() {
    if (!adjusting && !adjust.isPending) {
      adjust.reset();
    }
    setAdjusting(!adjusting);
  }

  function pick(fullness: Fullness) {
    if (saving.current) {
      return;
    }
    saving.current = true;
    adjust.mutate(
      { id: product.id, startFraction: fullness, trackedFrom: getRitualDate() },
      {
        onSuccess: () => {
          setAdjusting(false);
          if (linkRef.current) {
            AccessibilityInfo.sendAccessibilityEvent(linkRef.current, 'focus');
          }
        },
        onSettled: () => {
          saving.current = false;
        },
      },
    );
  }

  return (
    <>
      {divider}
      <View
        accessible
        accessibilityLabel={`Amount left, About ${uses}. ${footer.replace(' · ', ', ')}`}
        style={styles.details}
      >
        <View style={styles.header}>
          <Text style={[styles.label, { color: palette.textMuted }]}>Amount left</Text>
          <Text
            style={[
              styles.value,
              { color: isRunningLow(usesLeft) ? palette.warning : palette.text },
            ]}
          >
            ≈ {uses}
          </Text>
        </View>
        <ShelfLifeBar
          progress={getAmountProgress(product.sizeMl, product.category, usesLeft)}
          highlight
          height={8}
        />
      </View>
      <View style={styles.footer}>
        <Text
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={[styles.footerText, { color: palette.textMuted }]}
        >
          {footer}
        </Text>
        {canAdjust ? (
          <Pressable
            ref={linkRef}
            accessibilityRole="button"
            accessibilityState={{ expanded: adjusting }}
            hitSlop={linkSlop}
            onPress={openOrCancel}
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.linkText, { color: palette.text }]}>
              {adjusting ? 'Cancel' : 'Feels off? Adjust'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {adjusting && canAdjust ? (
        <View style={styles.adjust}>
          <Text style={[styles.adjustLabel, { color: palette.text }]}>How full is it now?</Text>
          <FullnessTiles
            value={null}
            onChange={pick}
            unselectedColor={palette.background}
            disabled={adjust.isPending}
          />
          {adjust.isError ? (
            <FieldError>
              {"Couldn't save the amount. Check your connection and try again."}
            </FieldError>
          ) : null}
          <Text style={[styles.caption, { color: palette.textMuted }]}>
            Dewy restarts the count from here.
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: spacing.xxs,
  },
  details: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.meta,
    letterSpacing: letterSpacings.section,
    textTransform: 'uppercase',
  },
  value: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: fontSizes.subSection,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
  // 18 tall plus the slop makes a 44 target.
  link: {
    flexShrink: 0,
    minHeight: 18,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.meta,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  adjust: {
    gap: spacing.snug,
  },
  adjustLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.meta,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: fontSizes.kicker,
  },
});
