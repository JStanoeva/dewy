import { z } from 'zod';

import { categories, categoryDetails, type Category } from '@/features/products/constants';
import type { RoutineStep } from '@/features/routines/types';
import { supabase } from '@/lib/supabase';
import type { Period } from '@/theme/period';

const stepColumns =
  'id, product_id, period, position, weekdays, duration_seconds, wait_minutes, note, created_at, product:products(name, brand, category, photo_path)';

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
  created_at: z.string(),
  product: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    category: z.enum(categories),
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
    createdAt: row.created_at,
    product: {
      name: row.product.name,
      brand: row.product.brand,
      category: row.product.category,
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

// One insert for every period, so either all the steps are saved or none; the database puts each one last.
export async function addProductToRoutines(
  productId: string,
  category: Category,
  periods: readonly Period[],
): Promise<void> {
  const { error } = await supabase.from('routine_steps').insert(
    periods.map((period) => ({
      product_id: productId,
      period,
      duration_seconds: categoryDetails[category].defaultDurationSeconds,
    })),
  );
  if (error) {
    throw error;
  }
}
