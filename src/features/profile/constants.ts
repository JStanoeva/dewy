import type { Palette } from '@/theme/palettes';

// Skin details in form order; the database checks the same values.
export const skinTypes = ['dry', 'normal', 'oily', 'combination'] as const;
export const skinConcerns = [
  'sensitivity',
  'redness',
  'breakouts',
  'dark_spots',
  'fine_lines',
  'dry_patches',
] as const;
export const skinGoals = ['hydration', 'glow', 'even_tone', 'calm', 'clear', 'smooth'] as const;

export type SkinType = (typeof skinTypes)[number];
export type SkinConcern = (typeof skinConcerns)[number];
export type SkinGoal = (typeof skinGoals)[number];

type SkinTypeDetails = {
  label: string;
  line: string;
  // The two halves of the swatch, as palette colours.
  swatch: readonly [keyof Palette, keyof Palette];
};

export const skinTypeDetails: Record<SkinType, SkinTypeDetails> = {
  dry: { label: 'Dry', line: 'Feels tight or flaky', swatch: ['peach', 'peach'] },
  normal: { label: 'Normal', line: 'Mostly calm and comfy', swatch: ['rose', 'rose'] },
  oily: { label: 'Oily', line: 'Shiny by midday', swatch: ['mauve', 'mauve'] },
  combination: {
    label: 'Combination',
    line: 'Oily T-zone, drier cheeks',
    swatch: ['salmon', 'mauve'],
  },
};

export const skinConcernLabels: Record<SkinConcern, string> = {
  sensitivity: 'Sensitivity',
  redness: 'Redness',
  breakouts: 'Breakouts',
  dark_spots: 'Dark spots',
  fine_lines: 'Fine lines',
  dry_patches: 'Dry patches',
};

export const skinGoalLabels: Record<SkinGoal, string> = {
  hydration: 'Hydration',
  glow: 'Glow',
  even_tone: 'Even tone',
  calm: 'Calm skin',
  clear: 'Clearer skin',
  smooth: 'Smooth texture',
};
