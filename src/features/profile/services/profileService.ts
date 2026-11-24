import type { FirstRitualStep } from '@/features/onboarding/utils/firstRituals';
import type { Profile } from '@/features/profile/types';
import { supabase } from '@/lib/supabase';

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, display_name, created_at, onboarding_completed_at, morning_reminder_enabled, morning_reminder_time, evening_reminder_enabled, evening_reminder_time, expiry_alerts_enabled, expiry_lead_days, low_alerts_enabled, low_uses_threshold',
    )
    .single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    displayName: data.display_name,
    createdAt: data.created_at,
    onboardingCompletedAt: data.onboarding_completed_at,
    morningReminderEnabled: data.morning_reminder_enabled,
    morningReminderTime: data.morning_reminder_time,
    eveningReminderEnabled: data.evening_reminder_enabled,
    eveningReminderTime: data.evening_reminder_time,
    expiryAlertsEnabled: data.expiry_alerts_enabled,
    expiryLeadDays: data.expiry_lead_days,
    lowAlertsEnabled: data.low_alerts_enabled,
    lowUsesThreshold: data.low_uses_threshold,
  };
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

// One transaction: the first rituals' steps in order, then the onboarding timestamp it returns.
export async function finishOnboarding(steps: readonly FirstRitualStep[]): Promise<string> {
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
