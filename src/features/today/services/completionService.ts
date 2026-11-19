import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import type { LocalDate } from '@/utils/localDate';

const completionRowSchema = z.object({ routine_step_id: z.string() });

// The ids of the steps ticked on that ritual day; a tick whose step was removed only counts its product's use.
export async function listCompletedStepIds(localDate: LocalDate): Promise<string[]> {
  const { data, error } = await supabase
    .from('routine_completions')
    .select('routine_step_id')
    .eq('local_date', localDate)
    .not('routine_step_id', 'is', null);
  if (error) {
    throw error;
  }
  return z
    .array(completionRowSchema)
    .parse(data)
    .map((row) => row.routine_step_id);
}

// A tick that already exists (sent from another phone) is ignored instead of failing on the unique key.
export async function completeStep(stepId: string, localDate: LocalDate): Promise<void> {
  const { error } = await supabase
    .from('routine_completions')
    .upsert(
      { routine_step_id: stepId, local_date: localDate },
      { onConflict: 'user_id,local_date,routine_step_id', ignoreDuplicates: true },
    );
  if (error) {
    throw error;
  }
}

export async function uncompleteStep(stepId: string, localDate: LocalDate): Promise<void> {
  const { error } = await supabase
    .from('routine_completions')
    .delete()
    .eq('routine_step_id', stepId)
    .eq('local_date', localDate);
  if (error) {
    throw error;
  }
}

// A tick refused because its step was removed (on another phone) in the meantime.
export function isStepGoneError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23503';
}

// A tick refused by the database because its day is more than a day from today's date, e.g. a wrong phone clock.
export function isOutsideDayError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '42501';
}
