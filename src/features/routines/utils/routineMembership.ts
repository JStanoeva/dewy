import type { RoutineStep } from '@/features/routines/types';
import type { Period } from '@/theme/period';

export type RoutineMembership = {
  period: Period;
  stepNumber: number;
};

export const ritualOrder: readonly Period[] = ['morning', 'evening'];

// Steps arrive in ritual order, so a step's number is its place among its period's steps.
export function routineMemberships(
  steps: readonly Pick<RoutineStep, 'period' | 'productId'>[],
  productId: string,
): RoutineMembership[] {
  return ritualOrder.flatMap((period) => {
    const index = steps
      .filter((step) => step.period === period)
      .findIndex((step) => step.productId === productId);
    return index === -1 ? [] : [{ period, stepNumber: index + 1 }];
  });
}

export function routineTag(periods: readonly Period[]): string | null {
  const labels = ritualOrder
    .filter((period) => periods.includes(period))
    .map((period) => (period === 'morning' ? 'AM' : 'PM'));
  return labels.length > 0 ? labels.join(' · ') : null;
}

export function describeRoutines(periods: readonly Period[]): string | null {
  const names = ritualOrder.filter((period) => periods.includes(period));
  if (names.length === 0) {
    return null;
  }
  return `in your ${names.join(' and ')} ${names.length === 1 ? 'routine' : 'routines'}`;
}
