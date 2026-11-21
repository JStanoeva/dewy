import type { RoutineStep } from '@/features/routines/types';
import { getRitualTips } from '@/features/routines/utils/ritualTips';
import type { Period } from '@/theme/period';

// Every tip of the ritual, whatever its days; Hide stores these.
export function ritualTipIds(steps: readonly RoutineStep[], period: Period): string[] {
  return getRitualTips(steps, { period }).map((tip) => tip.id);
}

// Null opens the banners; the same list back means nothing changed.
export function nextHiddenTips(
  stored: string[],
  all: readonly string[],
  shownToday: readonly string[],
): string[] | null {
  // A single banner never folds, so only a day with 2 or more can bring a new tip into view.
  if (shownToday.length >= 2 && shownToday.some((id) => !stored.includes(id))) {
    return null;
  }
  const kept = stored.filter((id) => all.includes(id));
  if (kept.length === 0) {
    return null;
  }
  return kept.length === stored.length ? stored : kept;
}

export function isFolded(stored: readonly string[] | null, shownToday: readonly string[]): boolean {
  return stored !== null && shownToday.every((id) => stored.includes(id));
}

export type FoldChange = { period: Period; stored: string[]; next: string[] | null };

// Both rituals are checked on the ritual day's weekday, whichever one Today shows.
export function foldChanges(
  hidden: Record<Period, string[] | null>,
  steps: readonly RoutineStep[],
  weekday: number,
): FoldChange[] {
  return (['morning', 'evening'] as const).flatMap((period) => {
    const stored = hidden[period];
    if (!stored) {
      return [];
    }
    const shownToday = getRitualTips(steps, { period, weekday }).map((tip) => tip.id);
    const next = nextHiddenTips(stored, ritualTipIds(steps, period), shownToday);
    return next === stored ? [] : [{ period, stored, next }];
  });
}
