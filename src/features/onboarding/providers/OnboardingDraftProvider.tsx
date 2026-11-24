import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { draftPlacement, type Placement } from '@/features/onboarding/utils/draftPlacement';
import type { Product } from '@/features/products/types';
import type { Period } from '@/theme/period';

type DraftProduct = Pick<Product, 'id' | 'category' | 'actives'>;

type OnboardingDraftValue = {
  placementFor: (product: DraftProduct) => Placement;
  toggle: (product: DraftProduct, period: Period) => void;
};

const OnboardingDraftContext = createContext<OnboardingDraftValue | null>(null);

// It sits above the stack, so step 2's flips survive going back to step 1 and returning.
export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  // Only the products the user flipped, by id; every other product follows Dewy's draft.
  const [flips, setFlips] = useState<Record<string, Placement>>({});

  const value = useMemo<OnboardingDraftValue>(
    () => ({
      placementFor: (product) => flips[product.id] ?? draftPlacement(product),
      toggle: (product, period) =>
        setFlips((current) => {
          const placement = current[product.id] ?? draftPlacement(product);
          const key = period === 'morning' ? 'am' : 'pm';
          return { ...current, [product.id]: { ...placement, [key]: !placement[key] } };
        }),
    }),
    [flips],
  );

  return <OnboardingDraftContext value={value}>{children}</OnboardingDraftContext>;
}

export function useOnboardingDraft(): OnboardingDraftValue {
  const value = useContext(OnboardingDraftContext);
  if (!value) {
    throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  }
  return value;
}
