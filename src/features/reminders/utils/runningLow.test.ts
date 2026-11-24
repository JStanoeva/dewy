import { runningLowNotice } from '@/features/reminders/utils/runningLow';

// A full 30 ml cleanser holds 30 uses (1 ml a use).
const cleanser = {
  id: 'oat',
  name: 'Gentle Oat Cleanser',
  status: 'owned' as const,
  sizeMl: 30,
  startFraction: 1 as const,
  category: 'cleanser' as const,
  lowNotifiedAt: null,
};

describe('runningLowNotice', () => {
  it('fires at the threshold', () => {
    expect(runningLowNotice(cleanser, 25, 5)).toEqual({
      title: 'Gentle Oat Cleanser is running low',
      body: 'About 5 uses left. Time to restock?',
      data: { productId: 'oat' },
    });
  });

  it('stays quiet above the threshold', () => {
    expect(runningLowNotice(cleanser, 24, 5)).toBeNull();
    expect(runningLowNotice(cleanser, 24, 10)?.body).toBe('About 6 uses left. Time to restock?');
  });

  it('says one use, and about empty at none', () => {
    expect(runningLowNotice(cleanser, 29, 5)?.body).toBe('About 1 use left. Time to restock?');
    expect(runningLowNotice(cleanser, 34, 5)?.body).toBe("It's about empty. Time to restock?");
  });

  it('fires once per bottle', () => {
    expect(
      runningLowNotice({ ...cleanser, lowNotifiedAt: '2026-11-24T08:00:00Z' }, 28, 5),
    ).toBeNull();
  });

  it('needs an owned product with a size', () => {
    expect(runningLowNotice({ ...cleanser, sizeMl: null }, 28, 5)).toBeNull();
    expect(runningLowNotice({ ...cleanser, status: 'wishlist' }, 28, 5)).toBeNull();
  });
});
