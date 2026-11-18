import { z } from 'zod';

import { categories, packagings } from '@/features/products/constants';
import type { RoutineStepInput } from '@/features/routines/schemas/routineStepSchema';
import type { RoutineStep } from '@/features/routines/types';
import { supabase } from '@/lib/supabase';
import type { Period } from '@/theme/period';

const stepColumns =
  'id, product_id, period, position, weekdays, duration_seconds, wait_minutes, note, note_important, created_at, product:products(name, brand, category, packaging, photo_path)';

// Generated types only say "string" and "number[]", so rows are parsed before use.
const stepRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  period: z.enum(['morning', 'evening']),
  position: z.number(),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  duration_seconds: z.number(),
  wait_minutes: z.number().nullable(),
  note: z.string().nullable(),
  note_important: z.boolean(),
  created_at: z.string(),
  product: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    category: z.enum(categories),
    packaging: z.enum(packagings),
    photo_path: z.string().nullable(),
  }),
});

function toRoutineStep(row: z.infer<typeof stepRowSchema>): RoutineStep {
  return {
    id: row.id,
    productId: row.product_id,
    period: row.period,
    position: row.position,
    weekdays: row.weekdays,
    durationSeconds: row.duration_seconds,
    waitMinutes: row.wait_minutes,
    note: row.note,
    noteImportant: row.note_important,
    createdAt: row.created_at,
    product: {
      name: row.product.name,
      brand: row.product.brand,
      category: row.product.category,
      packaging: row.product.packaging,
      photoPath: row.product.photo_path,
    },
  };
}

// Both periods at once, in routine order; ties (two steps saved at once) keep a stable order.
export async function listRoutineSteps(): Promise<RoutineStep[]> {
  const { data, error } = await supabase
    .from('routine_steps')
    .select(stepColumns)
    .order('position')
    .order('created_at')
    .order('id');
  if (error) {
    throw error;
  }
  return z.array(stepRowSchema).parse(data).map(toRoutineStep);
}

// Null when the step is gone (removed elsewhere) or isn't the caller's.
export async function getRoutineStep(id: string): Promise<RoutineStep | null> {
  const { data, error } = await supabase
    .from('routine_steps')
    .select(stepColumns)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? toRoutineStep(stepRowSchema.parse(data)) : null;
}

// The database puts the new step at the end of its period.
export async function createRoutineStep(period: Period, input: RoutineStepInput): Promise<void> {
  const { error } = await supabase.from('routine_steps').insert({
    product_id: input.productId,
    period,
    weekdays: input.weekdays,
    duration_seconds: input.durationSeconds,
    wait_minutes: input.waitMinutes,
    note: input.note,
    note_important: input.noteImportant,
  });
  if (error) {
    throw error;
  }
}

// Why an insert was refused: the product is already in that period, or it has been deleted.
export function createStepConflict(error: unknown): 'duplicate' | 'productGone' | null {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  if (code === '23505') {
    return 'duplicate';
  }
  return code === '23503' ? 'productGone' : null;
}

// The product and period never change here; null when the step is gone.
export async function updateRoutineStep(
  id: string,
  input: RoutineStepInput,
): Promise<RoutineStep | null> {
  const { data, error } = await supabase
    .from('routine_steps')
    .update({
      weekdays: input.weekdays,
      duration_seconds: input.durationSeconds,
      wait_minutes: input.waitMinutes,
      note: input.note,
      note_important: input.noteImportant,
    })
    .eq('id', id)
    .select(stepColumns)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? toRoutineStep(stepRowSchema.parse(data)) : null;
}

export async function deleteRoutineStep(id: string): Promise<void> {
  const { error } = await supabase.from('routine_steps').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

// stepIds must list every one of the period's steps once, in the new order.
export async function reorderRoutineSteps(period: Period, stepIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_routine_steps', {
    p_period: period,
    p_step_ids: stepIds,
  });
  if (error) {
    throw error;
  }
}
