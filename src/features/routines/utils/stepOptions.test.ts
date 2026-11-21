import { categoryDetails } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import {
  countedPeriods,
  durationStops,
  formatDuration,
  moveStepIds,
  nearestDurationStop,
  pickableProducts,
  productPeriods,
  waitChoices,
} from '@/features/routines/utils/stepOptions';

function product(overrides: Partial<Product>): Product {
  return {
    id: 'p',
    status: 'owned',
    name: 'Product',
    brand: null,
    category: 'serum',
    packaging: 'dropper',
    photoPath: null,
    openedOn: null,
    paoMonths: null,
    actives: [],
    sizeMl: null,
    startFraction: 1,
    trackedFrom: '2026-11-01',
    notes: null,
    isFavorite: false,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

describe('durationStops', () => {
  it('has 20 stops from 10 seconds to 10 minutes', () => {
    expect(durationStops).toHaveLength(20);
    expect(durationStops[0]).toBe(10);
    expect(durationStops[durationStops.length - 1]).toBe(600);
  });

  it('includes every category default, so a new step starts on a stop', () => {
    for (const details of Object.values(categoryDetails)) {
      expect(durationStops).toContain(details.defaultDurationSeconds);
    }
  });

  it('formats every stop exactly', () => {
    expect(durationStops.map(formatDuration)).toEqual([
      '10 sec',
      '15 sec',
      '20 sec',
      '25 sec',
      '30 sec',
      '35 sec',
      '40 sec',
      '45 sec',
      '50 sec',
      '55 sec',
      '1 min',
      '2 min',
      '3 min',
      '4 min',
      '5 min',
      '6 min',
      '7 min',
      '8 min',
      '9 min',
      '10 min',
    ]);
  });
});

describe('nearestDurationStop', () => {
  it('finds a stop exactly', () => {
    expect(nearestDurationStop(10)).toBe(0);
    expect(nearestDurationStop(45)).toBe(7);
    expect(nearestDurationStop(60)).toBe(10);
    expect(nearestDurationStop(600)).toBe(19);
  });

  it('snaps a stored time between stops to the closest one', () => {
    expect(nearestDurationStop(12)).toBe(0);
    expect(nearestDurationStop(100)).toBe(11);
    expect(nearestDurationStop(900)).toBe(19);
    expect(nearestDurationStop(1800)).toBe(19);
  });
});

describe('formatDuration', () => {
  it('rounds to whole minutes from a minute on', () => {
    expect(formatDuration(59)).toBe('59 sec');
    expect(formatDuration(90)).toBe('2 min');
    expect(formatDuration(900)).toBe('15 min');
  });
});

describe('waitChoices', () => {
  it('offers the four waits', () => {
    expect(waitChoices(null)).toEqual([1, 5, 10, 20]);
    expect(waitChoices(10)).toEqual([1, 5, 10, 20]);
  });

  it('adds a stored wait that is not offered, in order', () => {
    expect(waitChoices(3)).toEqual([1, 3, 5, 10, 20]);
    expect(waitChoices(60)).toEqual([1, 5, 10, 20, 60]);
  });
});

describe('pickableProducts', () => {
  const cleanser = product({ id: 'c', name: 'Oat Cleanser', category: 'cleanser' });
  const serumB = product({ id: 'sb', name: 'B Serum', category: 'serum' });
  const serumA = product({ id: 'sa', name: 'a Serum', category: 'serum' });
  const mask = product({ id: 'm', name: 'Clay Mask', category: 'mask' });
  const wish = product({
    id: 'w',
    name: 'Dream Cream',
    category: 'moisturizer',
    status: 'wishlist',
  });
  const products = [mask, serumB, wish, cleanser, serumA];

  function ids(items: { product: Product }[]) {
    return items.map((item) => item.product.id);
  }

  it('lists owned products in routine order, then by name', () => {
    expect(ids(pickableProducts(products, []))).toEqual(['c', 'sa', 'sb', 'm']);
  });

  it('keeps a product in one ritual, with that ritual, and leaves out one in both', () => {
    const steps = [
      { period: 'evening' as const, productId: 'c' },
      { period: 'morning' as const, productId: 'c' },
      { period: 'evening' as const, productId: 'm' },
    ];
    expect(
      pickableProducts(products, steps).map((item) => [item.product.id, item.periods]),
    ).toEqual([
      ['sa', []],
      ['sb', []],
      ['m', ['evening']],
    ]);
  });

  it('keeps the selected product after it joins both rituals', () => {
    const steps = [
      { period: 'morning' as const, productId: 'sa' },
      { period: 'evening' as const, productId: 'sa' },
    ];
    expect(ids(pickableProducts(products, steps, 'sa'))).toEqual(['c', 'sa', 'sb', 'm']);
  });
});

describe('productPeriods', () => {
  it('lists the rituals a product is in, morning first', () => {
    const steps = [
      { period: 'evening' as const, productId: 'a' },
      { period: 'morning' as const, productId: 'a' },
      { period: 'morning' as const, productId: 'b' },
    ];
    expect(productPeriods(steps, 'a')).toEqual(['morning', 'evening']);
    expect(productPeriods(steps, 'b')).toEqual(['morning']);
    expect(productPeriods(steps, 'c')).toEqual([]);
  });
});

describe('countedPeriods', () => {
  it('keeps the ticked rituals the product is not in, morning first', () => {
    expect(countedPeriods(['evening', 'morning'], [])).toEqual(['morning', 'evening']);
    expect(countedPeriods(['morning', 'evening'], ['morning'])).toEqual(['evening']);
    expect(countedPeriods(['morning'], ['morning'])).toEqual([]);
    expect(countedPeriods([], [])).toEqual([]);
  });
});

describe('moveStepIds', () => {
  const ids = ['a', 'b', 'c'];

  it('swaps a step with its neighbour', () => {
    expect(moveStepIds(ids, 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(moveStepIds(ids, 'b', 'down')).toEqual(['a', 'c', 'b']);
  });

  it('leaves the order alone at either end or for an unknown id', () => {
    expect(moveStepIds(ids, 'a', 'up')).toEqual(ids);
    expect(moveStepIds(ids, 'c', 'down')).toEqual(ids);
    expect(moveStepIds(ids, 'x', 'up')).toEqual(ids);
  });
});
