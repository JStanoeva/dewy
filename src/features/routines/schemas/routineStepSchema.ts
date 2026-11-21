import { z } from 'zod';

import type { RoutineStep } from '@/features/routines/types';
import { countedPeriods } from '@/features/routines/utils/stepOptions';

// The database's default time for a step, used until a product is picked.
export const defaultDurationSeconds = 60;

const periodSchema = z.enum(['morning', 'evening']);

// Matches migrations 005 and 011; ranges are the database's, so stored values the form can't show still save.
export const routineStepFormSchema = z
  .object({
    productId: z.string({ error: 'Pick a product' }).min(1, 'Pick a product'),
    // The ticked rituals; a tick stays under a lock, so another product can use it again.
    periods: z.array(periodSchema),
    // The rituals the picked product is already in, which can't take it again.
    lockedPeriods: z.array(periodSchema),
    // ISO weekdays, Monday = 1 … Sunday = 7; the database accepts repeats, so they are dropped here.
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Pick at least one day')
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
    durationSeconds: z.number().int().min(10).max(1800),
    waitMinutes: z.number().int().min(1).max(60).nullable(),
  })
  .refine((values) => countedPeriods(values.periods, values.lockedPeriods).length > 0, {
    message: 'Pick where this step goes.',
    path: ['periods'],
  })
  .transform(({ periods, lockedPeriods, ...step }) => ({
    ...step,
    periods: countedPeriods(periods, lockedPeriods),
  }));

export type RoutineStepFormValues = z.input<typeof routineStepFormSchema>;
export type RoutineStepInput = z.output<typeof routineStepFormSchema>;

// Edit changes one ritual's step, so its own ritual is the only tick.
export function toRoutineStepFormValues(step: RoutineStep): RoutineStepFormValues {
  return {
    productId: step.productId,
    periods: [step.period],
    lockedPeriods: [],
    weekdays: step.weekdays,
    durationSeconds: step.durationSeconds,
    waitMinutes: step.waitMinutes,
  };
}
