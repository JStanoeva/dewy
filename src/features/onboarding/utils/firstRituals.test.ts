import {
  firstRitualSteps,
  ritualSummary,
  sortForRituals,
  splitRituals,
} from '@/features/onboarding/utils/firstRituals';
import type { Category } from '@/features/products/constants';

function product(id: string, category: Category, name = id) {
  return { id, category, name };
}

describe('sortForRituals', () => {
  it('orders by category, then by name', () => {
    const sorted = sortForRituals([
      product('a', 'spf', 'Sun shield'),
      product('b', 'moisturizer', 'Cream'),
      product('c', 'cleanser', 'Gel wash'),
      product('d', 'mask', 'Clay'),
      product('e', 'cleanser', 'Balm'),
      product('f', 'exfoliant', 'Peel'),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['e', 'c', 'f', 'b', 'a', 'd']);
  });

  it('leaves the input list as it was', () => {
    const products = [product('a', 'spf'), product('b', 'cleanser')];
    sortForRituals(products);
    expect(products.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('ritualSummary', () => {
  it('rounds the default times up to whole minutes', () => {
    // 60 + 30 + 20 + 10 + 45 = 165 s.
    const fiveSteps = [
      product('a', 'cleanser'),
      product('b', 'exfoliant'),
      product('c', 'toner'),
      product('d', 'mist'),
      product('e', 'moisturizer'),
    ];
    expect(ritualSummary(fiveSteps)).toBe('5 steps · about 3 min');
    // 60 + 60 + 10 = 130 s.
    expect(
      ritualSummary([product('a', 'cleanser'), product('b', 'serum'), product('c', 'mist')]),
    ).toBe('3 steps · about 3 min');
    expect(ritualSummary([product('a', 'mist')])).toBe('1 step · about 1 min');
  });

  it('says so when a ritual is empty', () => {
    expect(ritualSummary([])).toBe('nothing yet');
  });
});

describe('splitRituals and firstRitualSteps', () => {
  const rows = [
    { product: product('a', 'cleanser'), placement: { am: true, pm: true } },
    { product: product('b', 'exfoliant'), placement: { am: false, pm: true } },
    { product: product('c', 'serum'), placement: { am: false, pm: false } },
    { product: product('d', 'spf'), placement: { am: true, pm: false } },
  ];

  it('puts each product in the rituals it is on, in the order of the rows', () => {
    const rituals = splitRituals(rows);
    expect(rituals.morning.map((item) => item.id)).toEqual(['a', 'd']);
    expect(rituals.evening.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('saves the morning first, each step with its category default time', () => {
    expect(firstRitualSteps(splitRituals(rows))).toEqual([
      { productId: 'a', period: 'morning', durationSeconds: 60 },
      { productId: 'd', period: 'morning', durationSeconds: 60 },
      { productId: 'a', period: 'evening', durationSeconds: 60 },
      { productId: 'b', period: 'evening', durationSeconds: 30 },
    ]);
  });
});
