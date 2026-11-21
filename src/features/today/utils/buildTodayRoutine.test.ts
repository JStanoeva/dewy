import type { Active } from '@/features/products/constants';
import type { RoutineStep } from '@/features/routines/types';
import {
  buildTodayRoutine,
  finishedRituals,
  todayState,
  type TodayRoutine,
} from '@/features/today/utils/buildTodayRoutine';

const daily = [1, 2, 3, 4, 5, 6, 7];
// 2026-11-17 is a Tuesday (ISO weekday 2).
const tuesday = '2026-11-17';

function step(id: string, overrides: Partial<RoutineStep> = {}): RoutineStep {
  return {
    id,
    productId: `product-${id}`,
    period: 'morning',
    position: 0,
    weekdays: daily,
    durationSeconds: 60,
    waitMinutes: null,
    createdAt: '2026-11-15T08:00:00Z',
    product: {
      name: `Product ${id}`,
      brand: null,
      category: 'cleanser',
      packaging: 'pump',
      photoPath: null,
      actives: [],
    },
    ...overrides,
  };
}

function withActives(id: string, actives: Active[], overrides: Partial<RoutineStep> = {}) {
  const base = step(id, overrides);
  return { ...base, product: { ...base.product, actives } };
}

describe('buildTodayRoutine', () => {
  it('keeps the period and the weekday, in list order, numbered without gaps', () => {
    const steps = [
      step('a'),
      step('b', { weekdays: [1, 3, 5] }),
      step('c', { period: 'evening' }),
      step('d', { weekdays: [2] }),
      step('e'),
    ];
    const routine = buildTodayRoutine(steps, [], 'morning', tuesday);
    expect(routine.steps.map((item) => [item.step.id, item.number])).toEqual([
      ['a', 1],
      ['d', 2],
      ['e', 3],
    ]);
    expect(routine.total).toBe(3);
    expect(routine.ritualStepCount).toBe(4);
  });

  it('marks ticked steps and counts only the listed ones', () => {
    const steps = [step('a'), step('b'), step('off', { weekdays: [1] })];
    const routine = buildTodayRoutine(steps, ['b', 'off', 'gone'], 'morning', tuesday);
    expect(routine.steps.map((item) => item.done)).toEqual([false, true]);
    expect(routine.done).toBe(1);
    expect(routine.total).toBe(2);
    expect(routine.isComplete).toBe(false);
  });

  it('counts the minutes of undone steps only, rounded up, never under one', () => {
    const steps = [
      step('a', { durationSeconds: 60, waitMinutes: 10 }),
      step('b', { durationSeconds: 20 }),
      step('c', { durationSeconds: 120 }),
    ];
    expect(buildTodayRoutine(steps, [], 'morning', tuesday).minutesLeft).toBe(4);
    expect(buildTodayRoutine(steps, ['c'], 'morning', tuesday).minutesLeft).toBe(2);
    expect(buildTodayRoutine(steps, ['a', 'c'], 'morning', tuesday).minutesLeft).toBe(1);
  });

  it('is complete when every listed step is ticked', () => {
    const steps = [step('a'), step('b')];
    const routine = buildTodayRoutine(steps, ['a', 'b'], 'morning', tuesday);
    expect(routine.isComplete).toBe(true);
    expect(routine.done).toBe(2);
  });

  it('is never complete without steps', () => {
    const routine = buildTodayRoutine([], [], 'evening', tuesday);
    expect(routine.total).toBe(0);
    expect(routine.isComplete).toBe(false);
  });

  it('follows the weekday of the given date', () => {
    const steps = [step('weekend', { weekdays: [6, 7] })];
    expect(buildTodayRoutine(steps, [], 'morning', tuesday).total).toBe(0);
    expect(buildTodayRoutine(steps, [], 'morning', '2026-11-22').total).toBe(1);
  });

  it("lists the tips of today's steps only, in step order", () => {
    const steps = [
      withActives('retinol', ['retinoid'], { period: 'evening', weekdays: [2, 6] }),
      withActives('peel', ['acids'], { period: 'evening', weekdays: [5] }),
      withActives('acid-toner', ['acids'], { period: 'evening' }),
      withActives('vitc', ['vitc']),
    ];
    const routine = buildTodayRoutine(steps, [], 'evening', tuesday);
    expect(routine.tips.map((tip) => tip.id)).toEqual([
      'retinoid-acids:product-retinol',
      'night-spf:product-retinol',
      'night-spf:product-acid-toner',
    ]);
    // The morning vitamin C clashes with the evening ritual's products, whatever their days.
    expect(buildTodayRoutine(steps, [], 'morning', tuesday).tips.map((tip) => tip.text)).toEqual([
      'Keep it for mornings and your retinoid for nights',
      'Both are acidic, so alternate days if your skin feels tingly',
    ]);
  });

  it('has no tips for products without actives', () => {
    expect(buildTodayRoutine([step('plain')], [], 'morning', tuesday).tips).toEqual([]);
  });

  it('keeps a tip after its step is ticked', () => {
    const steps = [withActives('retinol', ['retinoid'], { period: 'evening' })];
    expect(buildTodayRoutine(steps, ['retinol'], 'evening', tuesday).tips).toHaveLength(2);
  });
});

describe('todayState', () => {
  const list: TodayRoutine = buildTodayRoutine([step('a')], [], 'morning', tuesday);
  const dayOff: TodayRoutine = buildTodayRoutine(
    [step('a', { weekdays: [1] })],
    [],
    'morning',
    tuesday,
  );
  const empty: TodayRoutine = buildTodayRoutine([], [], 'morning', tuesday);
  const base = { routineFailed: false, hasOwnedProducts: undefined, productsFailed: false };

  it('waits for the steps and the ticks, or shows their error', () => {
    expect(todayState({ ...base, routine: undefined })).toBe('loading');
    expect(todayState({ ...base, routine: undefined, routineFailed: true })).toBe('error');
  });

  it('lists the steps without waiting for the products', () => {
    expect(todayState({ ...base, routine: list, productsFailed: true })).toBe('list');
  });

  it('shows a day off when the ritual has steps on other days only', () => {
    expect(todayState({ ...base, routine: dayOff })).toBe('dayOff');
  });

  it('needs the products to tell an empty ritual from an empty shelf', () => {
    expect(todayState({ ...base, routine: empty })).toBe('loading');
    expect(todayState({ ...base, routine: empty, productsFailed: true })).toBe('error');
    expect(todayState({ ...base, routine: empty, hasOwnedProducts: true })).toBe('emptyRitual');
    expect(todayState({ ...base, routine: empty, hasOwnedProducts: false })).toBe('noProducts');
  });
});

describe('finishedRituals', () => {
  it('lists each ritual whose steps due that day are all ticked', () => {
    const steps = [step('a'), step('b'), step('c', { period: 'evening' })];
    expect(finishedRituals(steps, ['a', 'b', 'c'], tuesday)).toEqual(['morning', 'evening']);
    expect(finishedRituals(steps, ['a', 'c'], tuesday)).toEqual(['evening']);
    expect(finishedRituals(steps, [], tuesday)).toEqual([]);
  });

  it('ignores steps due on other days, so they never block a stamp', () => {
    const steps = [step('a'), step('b', { weekdays: [1, 3] })];
    expect(finishedRituals(steps, ['a'], tuesday)).toEqual(['morning']);
  });

  it('finishes a ritual once its last unticked step is removed', () => {
    expect(finishedRituals([step('a'), step('b')], ['a'], tuesday)).toEqual([]);
    expect(finishedRituals([step('a')], ['a'], tuesday)).toEqual(['morning']);
  });

  it("doesn't finish a ritual with nothing due that day", () => {
    expect(finishedRituals([step('a', { weekdays: [1] })], [], tuesday)).toEqual([]);
    expect(finishedRituals([], [], tuesday)).toEqual([]);
  });
});
