import { z } from 'zod';

import { skinConcerns, skinGoals, skinTypes } from '@/features/profile/constants';

function noRepeats(values: readonly string[]) {
  return new Set(values).size === values.length;
}

// Everything is optional: no type and empty lists are a valid save.
export const skinDetailsSchema = z.object({
  skinType: z.enum(skinTypes).nullable(),
  concerns: z.array(z.enum(skinConcerns)).refine(noRepeats, 'Pick each concern once'),
  skinGoals: z.array(z.enum(skinGoals)).refine(noRepeats, 'Pick each goal once'),
});

export type SkinDetails = z.infer<typeof skinDetailsSchema>;
