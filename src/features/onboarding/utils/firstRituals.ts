import type { Placement } from '@/features/onboarding/utils/draftPlacement';
import { categories, categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { routineMeta } from '@/features/routines/utils/weekSchedule';
import type { Period } from '@/theme/period';

export type FirstRitualStep = { productId: string; period: Period; durationSeconds: number };

type RitualProduct = Pick<Product, 'id' | 'category' | 'name'>;

// Both onboarding steps list the account's owned products.
export function onboardingProducts(products: readonly Product[]): Product[] {
  return products.filter((product) => product.status === 'owned');
}

// Cleanser → exfoliant → toner → mist → serum → moisturizer → SPF → mask, then by name.
export function sortForRituals<T extends RitualProduct>(products: readonly T[]): T[] {
  return [...products].sort(
    (a, b) =>
      categories.indexOf(a.category) - categories.indexOf(b.category) ||
      a.name.localeCompare(b.name),
  );
}

// Each ritual's products, in the order of the rows.
export function splitRituals<T extends RitualProduct>(
  rows: readonly { product: T; placement: Placement }[],
): Record<Period, T[]> {
  return {
    morning: rows.filter((row) => row.placement.am).map((row) => row.product),
    evening: rows.filter((row) => row.placement.pm).map((row) => row.product),
  };
}

// "3 steps · about 3 min", counted like Routines' total, or "nothing yet".
export function ritualSummary(products: readonly Pick<Product, 'category'>[]): string {
  if (products.length === 0) {
    return 'nothing yet';
  }
  return routineMeta(
    products.map((product) => ({
      durationSeconds: categoryDetails[product.category].defaultDurationSeconds,
      waitMinutes: null,
    })),
  );
}

// What Continue saves: the morning's steps in order, then the evening's.
export function firstRitualSteps(
  rituals: Record<Period, readonly RitualProduct[]>,
): FirstRitualStep[] {
  return (['morning', 'evening'] as const).flatMap((period) =>
    rituals[period].map((product) => ({
      productId: product.id,
      period,
      durationSeconds: categoryDetails[product.category].defaultDurationSeconds,
    })),
  );
}
