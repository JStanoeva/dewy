import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .url({
      protocol: /^https?$/,
      error: 'must be your Supabase project URL, like https://abcd1234.supabase.co',
    })
    .refine((url) => !url.includes('your-project-ref'), {
      error: 'still has the placeholder from .env.example',
    }),
  EXPO_PUBLIC_SUPABASE_KEY: z
    .string({ error: "must be your project's publishable key (sb_publishable_…)" })
    .trim()
    .startsWith('sb_publishable_', {
      error: "must be your project's publishable key (sb_publishable_…), never a secret key",
    }),
});

const result = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
});

export const env = result.success
  ? {
      supabaseUrl: result.data.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: result.data.EXPO_PUBLIC_SUPABASE_KEY,
    }
  : null;

export const envProblems = result.success
  ? []
  : result.error.issues.map((issue) => `${String(issue.path[0])} ${issue.message}`);
