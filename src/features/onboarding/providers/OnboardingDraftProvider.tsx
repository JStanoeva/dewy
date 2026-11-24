import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { draftPlacement, type Placement } from '@/features/onboarding/utils/draftPlacement';
import type { Product } from '@/features/products/types';
import type { NudgeSettings } from '@/features/profile/types';
import { defaultNudges } from '@/features/reminders/constants';
import type { Period } from '@/theme/period';

type DraftProduct = Pick<Product, 'id' | 'category' | 'actives'>;

type OnboardingDraftValue = {
  placementFor: (product: DraftProduct) => Placement;
  toggle: (product: DraftProduct, period: Period) => void;
  nudges: NudgeSettings;
  updateNudges: (changes: Partial<NudgeSettings>) => void;
  // True once notifications were refused on step 3, so its note stays after Back and forward.
  nudgesRefused: boolean;
  refuseNudges: () => void;
};

const allNudgesOff: Partial<NudgeSettings> = {
  morningReminderEnabled: false,
  eveningReminderEnabled: false,
  expiryAlertsEnabled: false,
  lowAlertsEnabled: false,
};

const OnboardingDraftContext = createContext<OnboardingDraftValue | null>(null);

// It sits above the stack, so step 2's flips and step 3's nudges survive going back and returning.
export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const userId = useAuth().session?.user.id ?? null;
  const [owner, setOwner] = useState(userId);
  // Only the products the user flipped, by id; every other product follows Dewy's draft.
  const [flips, setFlips] = useState<Record<string, Placement>>({});
  const [nudges, setNudges] = useState(defaultNudges);
  const [nudgesRefused, setNudgesRefused] = useState(false);

  // The provider outlives a logout, so the next account starts from Dewy's defaults again.
  if (owner !== userId) {
    setOwner(userId);
    setFlips({});
    setNudges(defaultNudges);
    setNudgesRefused(false);
  }

  const value = useMemo<OnboardingDraftValue>(
    () => ({
      placementFor: (product) => flips[product.id] ?? draftPlacement(product),
      toggle: (product, period) =>
        setFlips((current) => {
          const placement = current[product.id] ?? draftPlacement(product);
          const key = period === 'morning' ? 'am' : 'pm';
          return { ...current, [product.id]: { ...placement, [key]: !placement[key] } };
        }),
      nudges,
      updateNudges: (changes) => setNudges((current) => ({ ...current, ...changes })),
      nudgesRefused,
      refuseNudges: () => {
        setNudges((current) => ({ ...current, ...allNudgesOff }));
        setNudgesRefused(true);
      },
    }),
    [flips, nudges, nudgesRefused],
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
