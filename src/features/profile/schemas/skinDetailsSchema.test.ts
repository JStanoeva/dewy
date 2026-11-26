import { skinDetailsSchema } from '@/features/profile/schemas/skinDetailsSchema';

describe('skinDetailsSchema', () => {
  it('accepts an empty form', () => {
    const empty = { skinType: null, concerns: [], skinGoals: [] };
    expect(skinDetailsSchema.parse(empty)).toEqual(empty);
  });

  it('accepts a type with any concerns and goals', () => {
    const filled = {
      skinType: 'combination',
      concerns: ['sensitivity', 'dark_spots'],
      skinGoals: ['glow', 'even_tone', 'smooth'],
    };
    expect(skinDetailsSchema.parse(filled)).toEqual(filled);
  });

  it.each([
    ['an old skin type', { skinType: 'balanced' }],
    ['an old concern', { concerns: ['pores'] }],
    ['a goal written as its label', { skinGoals: ['Calm skin'] }],
    ['a concern picked twice', { concerns: ['redness', 'redness'] }],
    ['a goal picked twice', { skinGoals: ['glow', 'glow'] }],
  ])('rejects %s', (_case, values) => {
    const result = skinDetailsSchema.safeParse({
      skinType: null,
      concerns: [],
      skinGoals: [],
      ...values,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing list', () => {
    expect(skinDetailsSchema.safeParse({ skinType: null, concerns: [] }).success).toBe(false);
  });
});
