import type { Profile } from '@/features/profile/types';
import { supabase } from '@/lib/supabase';

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .single();
  if (error) {
    throw error;
  }
  return { id: data.id, displayName: data.display_name, createdAt: data.created_at };
}
