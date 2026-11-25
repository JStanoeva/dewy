import { countNeedAttention } from '@/features/profile/utils/needAttention';

const today = '2026-11-25';

// A full 30 ml cleanser holds 30 uses (1 ml a use), opened recently with a 12-month PAO.
const cleanser = {
  id: 'oat',
  status: 'owned' as const,
  openedOn: '2026-11-01',
  paoMonths: 12,
  sizeMl: 30,
  startFraction: 1 as const,
  category: 'cleanser' as const,
};

// Opened 25 May 2026 with a 6-month PAO: expires today.
const expiring = { ...cleanser, id: 'retinal', openedOn: '2026-05-25', paoMonths: 6 };

describe('countNeedAttention', () => {
  it('counts nothing for a fresh, full bottle', () => {
    expect(countNeedAttention([cleanser], { oat: 0 }, 5, today)).toBe(0);
  });

  it('counts expiring soon, expired included', () => {
    const expired = { ...expiring, id: 'old', openedOn: '2025-01-10' };
    expect(countNeedAttention([expiring, expired], {}, 5, today)).toBe(2);
  });

  it('counts running low at the threshold', () => {
    expect(countNeedAttention([cleanser], { oat: 25 }, 5, today)).toBe(1);
    expect(countNeedAttention([cleanser], { oat: 24 }, 5, today)).toBe(0);
  });

  it('respects the account threshold', () => {
    expect(countNeedAttention([cleanser], { oat: 20 }, 10, today)).toBe(1);
    expect(countNeedAttention([cleanser], { oat: 20 }, 3, today)).toBe(0);
  });

  it('counts a product that is both expiring and running low once', () => {
    expect(countNeedAttention([expiring], { retinal: 29 }, 5, today)).toBe(1);
  });

  it('ignores the wishlist', () => {
    const wish = { ...expiring, status: 'wishlist' as const };
    expect(countNeedAttention([wish], { retinal: 29 }, 5, today)).toBe(0);
  });

  it('never counts a bottle without a size as running low', () => {
    expect(countNeedAttention([{ ...cleanser, sizeMl: null }], { oat: 100 }, 5, today)).toBe(0);
  });

  it('treats a product missing from loaded counts as unused', () => {
    const tiny = { ...cleanser, id: 'mini', sizeMl: 4 };
    expect(countNeedAttention([tiny], {}, 5, today)).toBe(1);
  });

  it('counts only expiring while the use counts are missing', () => {
    const low = { ...cleanser, sizeMl: 4 };
    expect(countNeedAttention([low, expiring], undefined, 5, today)).toBe(1);
  });
});
