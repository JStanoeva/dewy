import {
  amountFooter,
  getAmountProgress,
  getStartingUses,
  getUsesLeft,
  isRunningLow,
  restartsCount,
  usesPerWeek,
} from '@/features/products/utils/usesLeft';

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

describe('getUsesLeft', () => {
  const serum = { sizeMl: 30, startFraction: 1, category: 'serum' } as const;

  it('takes the counted uses from the starting uses', () => {
    expect(getUsesLeft(serum, 0)).toBe(100);
    expect(getUsesLeft(serum, 40)).toBe(60);
    expect(getUsesLeft({ ...serum, startFraction: 0.5 }, 1)).toBe(49);
  });

  it('keeps the count when only the size or the type changes', () => {
    expect(getUsesLeft({ ...serum, sizeMl: 35 }, 40)).toBe(77);
    expect(getUsesLeft({ ...serum, category: 'moisturizer' }, 40)).toBe(20);
  });

  it('never goes below 0', () => {
    expect(getUsesLeft(serum, 100)).toBe(0);
    expect(getUsesLeft(serum, 250)).toBe(0);
  });

  it('is null without a size', () => {
    expect(getUsesLeft({ ...serum, sizeMl: null }, 0)).toBeNull();
  });
});

describe('getAmountProgress', () => {
  it('measures against a full bottle, so an Adjust to ½ shows half', () => {
    expect(getAmountProgress(30, 'serum', 100)).toBe(1);
    expect(getAmountProgress(30, 'serum', 50)).toBe(0.5);
    expect(getAmountProgress(50, 'moisturizer', 5)).toBe(0.05);
    expect(getAmountProgress(30, 'serum', 0)).toBe(0);
  });

  it('is empty when a full bottle holds no whole use', () => {
    expect(getAmountProgress(1, 'mask', 0)).toBe(0);
  });
});

describe('usesPerWeek', () => {
  const everyDay = [1, 2, 3, 4, 5, 6, 7];

  it('adds up the days of each of the product’s steps', () => {
    expect(usesPerWeek([{ weekdays: everyDay }])).toBe(7);
    expect(usesPerWeek([{ weekdays: everyDay }, { weekdays: everyDay }])).toBe(14);
    expect(usesPerWeek([{ weekdays: [1, 4] }])).toBe(2);
    expect(usesPerWeek([{ weekdays: [1, 4] }, { weekdays: [6] }])).toBe(3);
  });

  it('is 0 in no ritual and counts a repeated day once', () => {
    expect(usesPerWeek([])).toBe(0);
    expect(usesPerWeek([{ weekdays: [1, 1, 4] }])).toBe(2);
  });
});

describe('amountFooter', () => {
  it('reads one ritual every day as 1 use a day, both as 2', () => {
    expect(amountFooter(30, 42, 7)).toBe('30 ml · about 6 weeks at 1 use a day');
    expect(amountFooter(30, 42, 14)).toBe('30 ml · about 3 weeks at 2 uses a day');
  });

  it('counts uses a week on the days it is really used', () => {
    expect(amountFooter(100, 25, 2)).toBe('100 ml · about 13 weeks at 2 uses a week');
    expect(amountFooter(50, 3, 1)).toBe('50 ml · about 3 weeks at 1 use a week');
  });

  it('switches from days to weeks at 14 days and to months at 91', () => {
    expect(amountFooter(30, 1, 14)).toBe('30 ml · about 1 day at 2 uses a day');
    expect(amountFooter(30, 13, 7)).toBe('30 ml · about 13 days at 1 use a day');
    expect(amountFooter(30, 14, 7)).toBe('30 ml · about 2 weeks at 1 use a day');
    expect(amountFooter(30, 90, 7)).toBe('30 ml · about 13 weeks at 1 use a day');
    expect(amountFooter(30, 91, 7)).toBe('30 ml · about 3 months at 1 use a day');
    expect(amountFooter(200, 200, 2)).toBe('200 ml · about 23 months at 2 uses a week');
  });

  it('shows just the size in no ritual or when nothing is left', () => {
    expect(amountFooter(30, 42, 0)).toBe('30 ml');
    expect(amountFooter(30, 0, 7)).toBe('30 ml');
  });
});

describe('isRunningLow', () => {
  it('means 5 uses or fewer', () => {
    expect(isRunningLow(5)).toBe(true);
    expect(isRunningLow(0)).toBe(true);
    expect(isRunningLow(6)).toBe(false);
  });
});
