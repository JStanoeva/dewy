import {
  describeRoutines,
  routineMemberships,
  routineTag,
} from '@/features/routines/utils/routineMembership';

// The list order the service returns: position within each period, both periods mixed.
const steps = [
  { period: 'evening', productId: 'oat' },
  { period: 'morning', productId: 'oat' },
  { period: 'morning', productId: 'mask' },
  { period: 'evening', productId: 'retinal' },
  { period: 'morning', productId: 'spf' },
  { period: 'evening', productId: 'cream' },
] as const;

describe('routineMemberships', () => {
  it('numbers a step by its place within its own period', () => {
    expect(routineMemberships(steps, 'spf')).toEqual([{ period: 'morning', stepNumber: 3 }]);
    expect(routineMemberships(steps, 'cream')).toEqual([{ period: 'evening', stepNumber: 3 }]);
    expect(routineMemberships(steps, 'retinal')).toEqual([{ period: 'evening', stepNumber: 2 }]);
  });

  it('lists Morning before Evening, whatever the list order', () => {
    expect(routineMemberships(steps, 'oat')).toEqual([
      { period: 'morning', stepNumber: 1 },
      { period: 'evening', stepNumber: 1 },
    ]);
  });

  it('is empty for a product in no routine, or with no steps at all', () => {
    expect(routineMemberships(steps, 'toner')).toEqual([]);
    expect(routineMemberships([], 'oat')).toEqual([]);
  });

  it('closes up the numbers once an earlier step is gone', () => {
    const withoutMask = steps.filter((step) => step.productId !== 'mask');
    expect(routineMemberships(withoutMask, 'spf')).toEqual([{ period: 'morning', stepNumber: 2 }]);
  });
});

describe('routineTag', () => {
  it('reads AM, PM or AM · PM', () => {
    expect(routineTag(['morning'])).toBe('AM');
    expect(routineTag(['evening'])).toBe('PM');
    expect(routineTag(['morning', 'evening'])).toBe('AM · PM');
  });

  it('always puts AM first', () => {
    expect(routineTag(['evening', 'morning'])).toBe('AM · PM');
  });

  it('is null for a product in no routine', () => {
    expect(routineTag([])).toBeNull();
  });
});

describe('describeRoutines', () => {
  it('names one or both routines for TalkBack', () => {
    expect(describeRoutines(['morning'])).toBe('in your morning routine');
    expect(describeRoutines(['evening'])).toBe('in your evening routine');
    expect(describeRoutines(['evening', 'morning'])).toBe('in your morning and evening routines');
  });

  it('is null for a product in no routine', () => {
    expect(describeRoutines([])).toBeNull();
  });
});
