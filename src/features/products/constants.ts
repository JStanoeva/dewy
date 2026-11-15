import type { BottleShape } from '@/components/BottleIllustration';

export const productStatuses = ['owned', 'wishlist'] as const;

export const categories = [
  'cleanser',
  'exfoliant',
  'toner',
  'mist',
  'serum',
  'moisturizer',
  'spf',
  'mask',
] as const;

export type Category = (typeof categories)[number];

export const paoMonthsOptions = [3, 6, 12, 24] as const;

type CategoryDetails = {
  label: string;
  stepKind: string;
  bottle: BottleShape;
  defaultDurationSeconds: number;
};

export const categoryDetails: Record<Category, CategoryDetails> = {
  cleanser: { label: 'Cleanser', stepKind: 'Cleanse', bottle: 'pump', defaultDurationSeconds: 60 },
  exfoliant: {
    label: 'Exfoliant',
    stepKind: 'Exfoliate',
    bottle: 'tube',
    defaultDurationSeconds: 30,
  },
  toner: { label: 'Toner', stepKind: 'Tone', bottle: 'pump', defaultDurationSeconds: 20 },
  mist: { label: 'Mist', stepKind: 'Refresh', bottle: 'pump', defaultDurationSeconds: 10 },
  serum: { label: 'Serum', stepKind: 'Treat', bottle: 'dropper', defaultDurationSeconds: 60 },
  moisturizer: {
    label: 'Moisturizer',
    stepKind: 'Moisturize',
    bottle: 'jar',
    defaultDurationSeconds: 45,
  },
  spf: { label: 'SPF', stepKind: 'Protect', bottle: 'tube', defaultDurationSeconds: 60 },
  mask: { label: 'Mask', stepKind: 'Mask', bottle: 'jar', defaultDurationSeconds: 600 },
};
