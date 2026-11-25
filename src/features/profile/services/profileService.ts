import type { FirstRitualStep } from '@/features/onboarding/utils/firstRituals';
import type { NudgeSettings, Profile } from '@/features/profile/types';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';

const profileColumns =
  'id, display_name, created_at, onboarding_completed_at, morning_reminder_enabled, morning_reminder_time, evening_reminder_enabled, evening_reminder_time, expiry_alerts_enabled, expiry_lead_days, low_alerts_enabled, low_uses_threshold';

type ProfileRow = Pick<
  Tables<'profiles'>,
  | 'id'
  | 'display_name'
  | 'created_at'
  | 'onboarding_completed_at'
  | 'morning_reminder_enabled'
  | 'morning_reminder_time'
  | 'evening_reminder_enabled'
  | 'evening_reminder_time'
  | 'expiry_alerts_enabled'
  | 'expiry_lead_days'
  | 'low_alerts_enabled'
  | 'low_uses_threshold'
>;

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    onboardingCompletedAt: row.onboarding_completed_at,
    morningReminderEnabled: row.morning_reminder_enabled,
    morningReminderTime: row.morning_reminder_time,
    eveningReminderEnabled: row.evening_reminder_enabled,
    eveningReminderTime: row.evening_reminder_time,
    expiryAlertsEnabled: row.expiry_alerts_enabled,
    expiryLeadDays: row.expiry_lead_days,
    lowAlertsEnabled: row.low_alerts_enabled,
    lowUsesThreshold: row.low_uses_threshold,
  };
}

// A field left out stays undefined, which the request drops, so only the given columns change.
function toNudgeColumns(nudges: Partial<NudgeSettings>): TablesUpdate<'profiles'> {
  return {
    morning_reminder_enabled: nudges.morningReminderEnabled,
    morning_reminder_time: nudges.morningReminderTime,
    evening_reminder_enabled: nudges.eveningReminderEnabled,
    evening_reminder_time: nudges.eveningReminderTime,
    expiry_alerts_enabled: nudges.expiryAlertsEnabled,
    expiry_lead_days: nudges.expiryLeadDays,
    low_alerts_enabled: nudges.lowAlertsEnabled,
    low_uses_threshold: nudges.lowUsesThreshold,
  };
}

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select(profileColumns).single();
  if (error) {
    throw error;
  }
  return toProfile(data);
}

// Returns the whole saved profile, so the cache and the scheduled nudges follow without a refetch.
export async function updateNudges(
  userId: string,
  nudges: Partial<NudgeSettings>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(toNudgeColumns(nudges))
    .eq('id', userId)
    .select(profileColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProfile(data);
}

// Returns the saved timestamp, so the caller can switch the app to the tabs without a refetch.
export async function completeOnboarding(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)
    .select('onboarding_completed_at')
    .single();
  if (error) {
    throw error;
  }
  if (data.onboarding_completed_at === null) {
    throw new Error('Onboarding was not saved');
  }
  return data.onboarding_completed_at;
}

// The nudges first, then one transaction for the rituals and the timestamp; a retry saves both again and adds no step twice.
export async function finishOnboarding({
  userId,
  steps,
  nudges,
}: {
  userId: string;
  steps: readonly FirstRitualStep[];
  nudges: NudgeSettings;
}): Promise<string> {
  const saved = await supabase
    .from('profiles')
    .update(toNudgeColumns(nudges))
    .eq('id', userId)
    .select('id')
    .single();
  if (saved.error) {
    throw saved.error;
  }
  const { data, error } = await supabase.rpc('finish_onboarding', {
    p_steps: steps.map((step) => ({
      product_id: step.productId,
      period: step.period,
      duration_seconds: step.durationSeconds,
    })),
  });
  if (error) {
    throw error;
  }
  return data;
}
