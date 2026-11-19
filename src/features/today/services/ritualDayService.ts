import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import type { Period } from '@/theme/period';
import type { LocalDate } from '@/utils/localDate';

const ritualDayRowSchema = z.object({ period: z.enum(['morning', 'evening']) });

// The rituals already stamped done on that ritual day.
export async function listDonePeriods(localDate: LocalDate): Promise<Period[]> {
  const { data, error } = await supabase
    .from('ritual_days')
    .select('period')
    .eq('local_date', localDate);
  if (error) {
    throw error;
  }
  return z
    .array(ritualDayRowSchema)
    .parse(data)
    .map((row) => row.period);
}

// The day's done stamp for a finished ritual; one already saved (from another phone) is ignored.
export async function markRitualDone(localDate: LocalDate, period: Period): Promise<void> {
  const { error } = await supabase
    .from('ritual_days')
    .upsert(
      { local_date: localDate, period },
      { onConflict: 'user_id,local_date,period', ignoreDuplicates: true },
    );
  if (error) {
    throw error;
  }
}

export async function clearRitualDone(localDate: LocalDate, period: Period): Promise<void> {
  const { error } = await supabase
    .from('ritual_days')
    .delete()
    .eq('local_date', localDate)
    .eq('period', period);
  if (error) {
    throw error;
  }
}
