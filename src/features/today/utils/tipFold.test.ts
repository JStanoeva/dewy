import type { Active } from '@/features/products/constants';
import type { RoutineStep } from '@/features/routines/types';
import {
  foldChanges,
  isFolded,
  nextHiddenTips,
  ritualTipIds,
} from '@/features/today/utils/tipFold';
import type { Period } from '@/theme/period';

function step(
  productId: string,
  period: Period,
  actives: Active[],
  weekdays = [1, 2, 3, 4, 5, 6, 7],
): RoutineStep {
  return {
    id: `${productId}-${period}`,
    productId,
    period,
    position: 0,
    weekdays,
    durationSeconds: 60,
    waitMinutes: null,
    createdAt: '2026-11-21T08:00:00Z',
    product: {
      name: productId,
      brand: null,
      category: 'serum',
      packaging: 'dropper',
      photoPath: null,
      actives,
    },
  };
}

// Saturday's retinol (two tips) and Tuesday's peel (one tip), as on Tora's evenings.
const evening = [
  step('peel', 'evening', ['acids'], [2, 5]),
  step('retinol', 'evening', ['retinoid'], [3, 6]),
];
const saturday = 6;

describe('ritualTipIds', () => {
  it("lists the ritual's tips on every weekday", () => {
    expect(ritualTipIds(evening, 'evening')).toEqual([
      'night-spf:peel',
      'retinoid-acids:retinol',
      'night-spf:retinol',
    ]);
    expect(ritualTipIds(evening, 'morning')).toEqual([]);
  });
});

describe('nextHiddenTips', () => {
  const stored = ['a', 'b', 'c'];

  it('keeps the same fold while nothing changed', () => {
    expect(nextHiddenTips(stored, ['c', 'a', 'b'], ['a', 'b'])).toBe(stored);
  });

  it('opens the banners when a day with 2 or more tips shows a new one', () => {
    expect(nextHiddenTips(stored, ['a', 'b', 'c', 'd'], ['a', 'd'])).toBeNull();
  });

  it('keeps the fold for a new tip that shows on another day', () => {
    expect(nextHiddenTips(stored, ['a', 'b', 'c', 'd'], ['a', 'b'])).toBe(stored);
  });

  it('keeps the fold for a new tip that shows alone today', () => {
    expect(nextHiddenTips(stored, ['a', 'b', 'c', 'd'], ['d'])).toBe(stored);
  });

  it('forgets tips no longer made, so they count as new when they come back', () => {
    const fewer = nextHiddenTips(stored, ['a', 'b'], ['a', 'b']);
    expect(fewer).toEqual(['a', 'b']);
    expect(nextHiddenTips(fewer ?? [], ['a', 'b', 'c'], ['b', 'c'])).toBeNull();
  });

  it('clears the fold once none of its tips is left', () => {
    expect(nextHiddenTips(stored, [], [])).toBeNull();
    expect(nextHiddenTips(stored, ['x'], ['x'])).toBeNull();
  });
});

describe('isFolded', () => {
  it('is folded only while every tip shown today was stored', () => {
    expect(isFolded(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isFolded(['a', 'b', 'c'], ['a', 'b'])).toBe(true);
    expect(isFolded(['a', 'b'], ['a', 'c'])).toBe(false);
    expect(isFolded(null, ['a', 'b'])).toBe(false);
  });
});

describe('foldChanges', () => {
  const hidden = ['night-spf:peel', 'retinoid-acids:retinol', 'night-spf:retinol'];

  it('changes nothing while the fold matches the ritual', () => {
    expect(foldChanges({ morning: null, evening: hidden }, evening, saturday)).toEqual([]);
  });

  it('keeps the fold when a new single tip shows only on Sundays', () => {
    const withToner = [...evening, step('toner', 'evening', ['acids'], [7])];
    expect(foldChanges({ morning: null, evening: hidden }, withToner, saturday)).toEqual([]);
    expect(foldChanges({ morning: null, evening: hidden }, withToner, 7)).toEqual([]);
  });

  it("reopens a ritual when today's 2 or more tips include a new one", () => {
    const withToner = [...evening, step('toner', 'evening', ['acids'], [6])];
    const state = { morning: null, evening: hidden };
    const changes = foldChanges(state, withToner, saturday);
    expect(changes).toEqual([{ period: 'evening', stored: hidden, next: null }]);
    // The screen compares this reference to leave a newer Hide or Show alone.
    expect(changes[0].stored).toBe(state.evening);
  });

  it('checks the ritual that is not on Today too, and drops tips no longer made', () => {
    const withoutPeel = evening.slice(1);
    expect(
      foldChanges({ morning: ['gone:x', 'gone:y'], evening: hidden }, withoutPeel, saturday),
    ).toEqual([
      { period: 'morning', stored: ['gone:x', 'gone:y'], next: null },
      { period: 'evening', stored: hidden, next: ['retinoid-acids:retinol', 'night-spf:retinol'] },
    ]);
  });

  it('clears a fold of step ids from the notes Dewy used to show', () => {
    expect(
      foldChanges({ morning: null, evening: ['step-1', 'step-2'] }, evening, saturday),
    ).toEqual([{ period: 'evening', stored: ['step-1', 'step-2'], next: null }]);
  });
});
