import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type Credentials = {
  email: string;
  password: string;
};

export async function signUp({ name, email, password }: Credentials & { name: string }) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) {
    throw error;
  }
}

export async function signIn({ email, password }: Credentials) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

type AuthErrorFeedback = {
  field: 'email' | 'password' | 'root';
  message: string;
};

export function getAuthErrorFeedback(error: unknown): AuthErrorFeedback {
  if (isAuthRetryableFetchError(error)) {
    return {
      field: 'root',
      message: "We couldn't reach Dewy. Check your connection and try again.",
    };
  }
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return { field: 'root', message: "That email and password don't match. Try again." };
      case 'user_already_exists':
      case 'email_exists':
        return { field: 'email', message: 'This email already has an account. Log in instead.' };
      case 'email_address_invalid':
        return { field: 'email', message: 'Enter a valid email address' };
      case 'weak_password':
        return { field: 'password', message: 'That password is too easy to guess. Try another.' };
      case 'over_request_rate_limit':
        return { field: 'root', message: 'Too many tries. Wait a minute, then try again.' };
    }
  }
  return { field: 'root', message: 'Something went wrong. Please try again.' };
}
