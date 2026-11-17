import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';

// Every step of the ritual whose note is important, whatever its days.
export function importantNoteIds(steps: readonly RoutineStep[], period: Period): string[] {
  return steps
    .filter((step) => step.period === period && step.note && step.noteImportant)
    .map((step) => step.id);
}

// Folded banners open for any important note they haven't seen, and forget notes no longer important.
export function nextHiddenNotes(stored: string[], current: readonly string[]): string[] | null {
  if (current.length === 0 || current.some((id) => !stored.includes(id))) {
    return null;
  }
  return stored.length === current.length ? stored : [...current];
}

export function isFolded(stored: readonly string[] | null, current: readonly string[]): boolean {
  return stored !== null && current.every((id) => stored.includes(id));
}

export type FoldChange = { period: Period; stored: string[]; next: string[] | null };

// Both rituals are checked whenever the steps change, whichever one Today shows.
export function foldChanges(
  hidden: Record<Period, string[] | null>,
  steps: readonly RoutineStep[],
): FoldChange[] {
  return (['morning', 'evening'] as const).flatMap((period) => {
    const stored = hidden[period];
    if (!stored) {
      return [];
    }
    const next = nextHiddenNotes(stored, importantNoteIds(steps, period));
    return next === stored ? [] : [{ period, stored, next }];
  });
}
