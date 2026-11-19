import { categoryDetails, type Category, type Fullness } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import type { RoutineStep } from '@/features/routines/types';

// Until 6.1 lets people choose it.
const runningLowUses = 5;

// Uses in the bottle when the count starts: size × fullness ÷ the type's typical dose, rounded.
export function getStartingUses(sizeMl: number, startFraction: Fullness, category: Category) {
  return Math.round((sizeMl * startFraction) / categoryDetails[category].doseMl);
}

// A save restarts the count from today only with a size and a picked fullness.
export function restartsCount({
  sizeMl,
  startFraction,
}: {
  sizeMl: number | null;
  startFraction: Fullness | null;
}) {
  return sizeMl !== null && startFraction !== null;
}

// Null without a size, because Dewy isn't tracking the amount then.
export function getUsesLeft(
  product: Pick<Product, 'sizeMl' | 'startFraction' | 'category'>,
  uses: number,
): number | null {
  if (product.sizeMl === null) {
    return null;
  }
  return Math.max(
    0,
    getStartingUses(product.sizeMl, product.startFraction, product.category) - uses,
  );
}

// How full the bottle is against a full one; empty when a full bottle holds no whole use.
export function getAmountProgress(sizeMl: number, category: Category, usesLeft: number) {
  const fullUses = getStartingUses(sizeMl, 1, category);
  return fullUses === 0 ? 0 : Math.min(1, usesLeft / fullUses);
}

// Each step's days added up: one daily ritual is 7 a week, both rituals 14.
export function usesPerWeek(steps: readonly Pick<RoutineStep, 'weekdays'>[]) {
  return steps.reduce((sum, step) => sum + new Set(step.weekdays).size, 0);
}

function rateLabel(perWeek: number) {
  if (perWeek === 7) {
    return '1 use a day';
  }
  if (perWeek === 14) {
    return '2 uses a day';
  }
  return `${perWeek} ${perWeek === 1 ? 'use' : 'uses'} a week`;
}

function timeLabel(days: number) {
  if (days < 14) {
    return `about ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (days < 91) {
    return `about ${Math.round(days / 7)} weeks`;
  }
  return `about ${Math.round(days / 30.44)} months`;
}

// "30 ml · about 6 weeks at 1 use a day", or just the size when it's in no ritual or nothing is left.
export function amountFooter(sizeMl: number, usesLeft: number, perWeek: number) {
  if (perWeek === 0 || usesLeft === 0) {
    return `${sizeMl} ml`;
  }
  const days = Math.round((usesLeft * 7) / perWeek);
  return `${sizeMl} ml · ${timeLabel(days)} at ${rateLabel(perWeek)}`;
}

export function isRunningLow(usesLeft: number) {
  return usesLeft <= runningLowUses;
}
