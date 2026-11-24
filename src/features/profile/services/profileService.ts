import type { Profile } from '@/features/profile/types';
import { supabase } from '@/lib/supabase';

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, created_at, onboarding_completed_at')
    .single();
  if (error) {
    throw error;
  }
  return {
    id: data.id,
    displayName: data.display_name,
    createdAt: data.created_at,
    onboardingCompletedAt: data.onboarding_completed_at,
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
