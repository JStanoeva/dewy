import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '@/config/env';
import type { Database } from '@/types/database.types';

import { secureSessionStorage } from './secureSessionStorage';

// The fallbacks only keep this import from throwing when env is invalid; App then shows ConfigErrorScreen.
export const supabase = createClient<Database>(
  env?.supabaseUrl ?? 'https://invalid.localhost',
  env?.supabaseKey ?? 'invalid',
  {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
