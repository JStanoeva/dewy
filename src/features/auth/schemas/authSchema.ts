import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email('Enter a valid email address'));

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tell us what to call you')
    .max(40, 'Keep your name to 40 characters or fewer'),
  email,
  password: z
    .string()
    .min(1, 'Choose a password')
    .min(8, 'Use at least 8 characters')
    // Supabase caps passwords at 72 bytes, so any character outside plain ASCII takes more than one.
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      error: 'Use 72 characters or fewer (accents, emoji and non-Latin letters count extra)',
    }),
});

// Log-in keeps the name key so both modes share one form; its value is ignored.
export const logInSchema = z.object({
  name: z.string(),
  email,
  password: z.string().min(1, 'Enter your password'),
});

export type AuthFormValues = z.infer<typeof signUpSchema>;
