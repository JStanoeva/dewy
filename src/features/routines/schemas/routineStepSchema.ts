import { z } from 'zod';

import type { RoutineStep } from '@/features/routines/types';

// The database's default time for a step, used until a product is picked.
export const defaultDurationSeconds = 60;

// Matches migrations 005 and 007; ranges are the database's, so stored values the form can't show still save.
export const routineStepFormSchema = z
  .object({
    productId: z.string({ error: 'Pick a product' }).min(1, 'Pick a product'),
    // ISO weekdays, Monday = 1 … Sunday = 7; the database accepts repeats, so they are dropped here.
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Pick at least one day')
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
    durationSeconds: z.number().int().min(10).max(1800),
    waitMinutes: z.number().int().min(1).max(60).nullable(),
    note: z
      .string()
      .trim()
      // Postgres char_length counts code points, so an emoji counts once here too.
      .refine((value) => Array.from(value).length <= 80, 'Up to 80 characters')
      .transform((value) => value || null),
    noteImportant: z.boolean(),
  })
  // The switch keeps its place while the note is empty, but a step without a note is never important.
  .transform((values) => ({
    ...values,
    noteImportant: values.noteImportant && values.note !== null,
  }));

export type RoutineStepFormValues = z.input<typeof routineStepFormSchema>;
export type RoutineStepInput = z.output<typeof routineStepFormSchema>;

export function toRoutineStepFormValues(step: RoutineStep): RoutineStepFormValues {
  return {
    productId: step.productId,
    weekdays: step.weekdays,
    durationSeconds: step.durationSeconds,
    waitMinutes: step.waitMinutes,
    note: step.note ?? '',
    noteImportant: step.noteImportant,
  };
}
