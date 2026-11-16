import type { RoutineStep } from '@/features/routines/types';
import {
  buildTodayRoutine,
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
    note: null,
    createdAt: '2026-11-15T08:00:00Z',
    product: { name: `Product ${id}`, brand: null, category: 'cleanser', photoPath: null },
    ...overrides,
  };
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

  it('lists the notes of today steps that fall on some days only, in order', () => {
    const steps = [
      step('daily', { note: 'Every day note' }),
      step('plain', { weekdays: [2, 4] }),
      step('tue', { weekdays: [2, 4], note: 'Skip acids tonight' }),
      step('mon', { weekdays: [1], note: 'Not today' }),
      step('evening', { period: 'evening', weekdays: [2], note: 'Other ritual' }),
      step('weekdays', { weekdays: [1, 2, 3, 4, 5], note: 'Mask after' }),
    ];
    const routine = buildTodayRoutine(steps, [], 'morning', tuesday);
    expect(routine.notes).toEqual([
      { stepId: 'tue', productName: 'Product tue', note: 'Skip acids tonight' },
      { stepId: 'weekdays', productName: 'Product weekdays', note: 'Mask after' },
    ]);
  });

  it('keeps a note after its step is ticked', () => {
    const steps = [step('tue', { weekdays: [2], note: 'Skip acids tonight' })];
    expect(buildTodayRoutine(steps, ['tue'], 'morning', tuesday).notes).toHaveLength(1);
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
