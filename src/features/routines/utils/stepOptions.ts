import { categories } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import type { RoutineStep } from '@/features/routines/types';
import { ritualOrder, routineMemberships } from '@/features/routines/utils/routineMembership';
import type { Period } from '@/theme/period';

// 5-second steps up to a minute, then whole minutes up to 10, so every stop reads exactly.
export const durationStops = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600,
] as const;

// ISO weekdays, Monday = 1 … Sunday = 7.
export const everyDay = [1, 2, 3, 4, 5, 6, 7];

export const waitOptions = [1, 5, 10, 20] as const;

// The stop closest to a stored time; a time between stops keeps its value until the slider is dragged.
export function nearestDurationStop(seconds: number): number {
  let nearest = 0;
  durationStops.forEach((stop, index) => {
    if (Math.abs(stop - seconds) < Math.abs(durationStops[nearest] - seconds)) {
      nearest = index;
    }
  });
  return nearest;
}

// "45 sec" under a minute, otherwise whole minutes: "2 min".
export function formatDuration(seconds: number): string {
  return seconds < 60 ? `${seconds} sec` : `${Math.round(seconds / 60)} min`;
}

// The offered waits, plus a stored one that isn't among them, so it still shows as ticked.
export function waitChoices(stored: number | null): number[] {
  const choices: number[] = [...waitOptions];
  if (stored !== null && !choices.includes(stored)) {
    choices.push(stored);
    choices.sort((a, b) => a - b);
  }
  return choices;
}

export type PickableProduct = {
  product: Product;
  // The rituals it is already in, which New step locks for it.
  periods: Period[];
};

// Owned products not yet in both rituals, in routine order; the selected one stays while it saves.
export function pickableProducts(
  products: readonly Product[],
  steps: readonly Pick<RoutineStep, 'period' | 'productId'>[],
  selectedId?: string,
): PickableProduct[] {
  return products
    .filter((product) => product.status === 'owned')
    .map((product) => ({ product, periods: productPeriods(steps, product.id) }))
    .filter(({ product, periods }) => periods.length < 2 || product.id === selectedId)
    .sort(
      (a, b) =>
        categories.indexOf(a.product.category) - categories.indexOf(b.product.category) ||
        a.product.name.localeCompare(b.product.name),
    );
}

export function productPeriods(
  steps: readonly Pick<RoutineStep, 'period' | 'productId'>[],
  productId: string,
): Period[] {
  return routineMemberships(steps, productId).map((membership) => membership.period);
}

// The ticked rituals that can take the product, morning first; a ritual it is already in doesn't count.
export function countedPeriods(ticked: readonly Period[], locked: readonly Period[]): Period[] {
  return ritualOrder.filter((period) => ticked.includes(period) && !locked.includes(period));
}

// The ritual's ids with one step swapped with its neighbour; unchanged at either end.
export function moveStepIds(ids: readonly string[], id: string, direction: 'up' | 'down') {
  const from = ids.indexOf(id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) {
    return [...ids];
  }
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
