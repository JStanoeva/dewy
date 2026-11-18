import { getStartingUses, restartsCount } from '@/features/products/utils/usesLeft';

describe('getStartingUses', () => {
  it('divides the ml in the bottle by the type’s typical dose', () => {
    expect(getStartingUses(100, 1, 'toner')).toBe(100);
    expect(getStartingUses(100, 0.5, 'toner')).toBe(50);
    expect(getStartingUses(30, 1, 'serum')).toBe(100);
    expect(getStartingUses(50, 0.75, 'spf')).toBe(31);
    expect(getStartingUses(150, 0.25, 'mist')).toBe(75);
  });

  it('rounds to the nearest whole use, down to 0 for a tiny bottle', () => {
    expect(getStartingUses(3, 1, 'mask')).toBe(1);
    expect(getStartingUses(1, 1, 'mask')).toBe(0);
    expect(getStartingUses(1000, 1, 'serum')).toBe(3333);
  });
});

describe('restartsCount', () => {
  it('restarts only with a size and a picked fullness', () => {
    expect(restartsCount({ sizeMl: 30, startFraction: 0.5 })).toBe(true);
    expect(restartsCount({ sizeMl: 30, startFraction: null })).toBe(false);
    expect(restartsCount({ sizeMl: null, startFraction: 1 })).toBe(false);
    expect(restartsCount({ sizeMl: null, startFraction: null })).toBe(false);
  });
});
