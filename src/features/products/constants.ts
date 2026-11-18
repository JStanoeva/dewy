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

// The Packaging tiles in form order; the database checks the same five values.
export const packagings = [
  'dropper',
  'pump',
  'jar',
  'tube',
  'spray',
] as const satisfies readonly BottleShape[];

export const packagingLabels: Record<BottleShape, string> = {
  dropper: 'Dropper',
  pump: 'Pump',
  jar: 'Jar',
  tube: 'Tube',
  spray: 'Spray',
};

// The Key actives chips in form order; the database checks the same four values.
export const actives = ['retinoid', 'vitc', 'acids', 'bpo'] as const;

export type Active = (typeof actives)[number];

export const activeLabels: Record<Active, string> = {
  retinoid: 'Retinoid',
  vitc: 'Vitamin C',
  acids: 'AHA / BHA',
  bpo: 'Benzoyl peroxide',
};

// How full the bottle was when the count started; the database checks the same four values.
export const fullnessValues = [1, 0.75, 0.5, 0.25] as const;

export type Fullness = (typeof fullnessValues)[number];

export const fullnessLabels: Record<Fullness, { label: string; accessibilityLabel: string }> = {
  1: { label: 'Full', accessibilityLabel: 'Full' },
  0.75: { label: '¾', accessibilityLabel: 'Three quarters full' },
  0.5: { label: '½', accessibilityLabel: 'Half full' },
  0.25: { label: '¼', accessibilityLabel: 'A quarter full' },
};

type CategoryDetails = {
  label: string;
  stepKind: string;
  bottle: BottleShape;
  defaultDurationSeconds: number;
  // A typical single use, in ml, for the uses-left estimate.
  doseMl: number;
};

// `bottle` is a new product's default packaging; 008's trigger repeats this mapping for older app versions.
export const categoryDetails: Record<Category, CategoryDetails> = {
  cleanser: {
    label: 'Cleanser',
    stepKind: 'Cleanse',
    bottle: 'pump',
    defaultDurationSeconds: 60,
    doseMl: 1,
  },
  exfoliant: {
    label: 'Exfoliant',
    stepKind: 'Exfoliate',
    bottle: 'tube',
    defaultDurationSeconds: 30,
    doseMl: 1,
  },
  toner: {
    label: 'Toner',
    stepKind: 'Tone',
    bottle: 'pump',
    defaultDurationSeconds: 20,
    doseMl: 1,
  },
  mist: {
    label: 'Mist',
    stepKind: 'Refresh',
    bottle: 'spray',
    defaultDurationSeconds: 10,
    doseMl: 0.5,
  },
  serum: {
    label: 'Serum',
    stepKind: 'Treat',
    bottle: 'dropper',
    defaultDurationSeconds: 60,
    doseMl: 0.3,
  },
  moisturizer: {
    label: 'Moisturizer',
    stepKind: 'Moisturize',
    bottle: 'jar',
    defaultDurationSeconds: 45,
    doseMl: 0.5,
  },
  spf: {
    label: 'SPF',
    stepKind: 'Protect',
    bottle: 'tube',
    defaultDurationSeconds: 60,
    doseMl: 1.2,
  },
  mask: { label: 'Mask', stepKind: 'Mask', bottle: 'jar', defaultDurationSeconds: 600, doseMl: 3 },
};
