import type { RoutineStep } from '@/features/routines/types';
import {
  foldChanges,
  importantNoteIds,
  isFolded,
  nextHiddenNotes,
} from '@/features/today/utils/noteFold';

function step(id: string, overrides: Partial<RoutineStep> = {}): RoutineStep {
  return {
    id,
    productId: `product-${id}`,
    period: 'morning',
    position: 0,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    durationSeconds: 60,
    waitMinutes: null,
    note: null,
    noteImportant: false,
    createdAt: '2026-11-15T08:00:00Z',
    product: {
      name: `Product ${id}`,
      brand: null,
      category: 'cleanser',
      packaging: 'pump',
      photoPath: null,
    },
    ...overrides,
  };
}

describe('importantNoteIds', () => {
  it("lists the ritual's important notes on every weekday, in list order", () => {
    const steps = [
      step('daily', { note: 'Every day', noteImportant: true }),
      step('friday', { weekdays: [5], note: 'Fridays', noteImportant: true }),
      step('quiet', { note: 'Not important' }),
      step('plain'),
      step('evening', { period: 'evening', note: 'Other ritual', noteImportant: true }),
    ];
    expect(importantNoteIds(steps, 'morning')).toEqual(['daily', 'friday']);
    expect(importantNoteIds(steps, 'evening')).toEqual(['evening']);
  });
});

describe('nextHiddenNotes', () => {
  const stored = ['a', 'b', 'c'];

  it('keeps the same fold while nothing changed', () => {
    expect(nextHiddenNotes(stored, ['c', 'a', 'b'])).toBe(stored);
  });

  it('opens the banners for a new important note', () => {
    expect(nextHiddenNotes(stored, ['a', 'b', 'c', 'd'])).toBeNull();
  });

  it('opens them for a swap, even when the count stays the same', () => {
    expect(nextHiddenNotes(stored, ['a', 'b', 'd'])).toBeNull();
  });

  it('forgets a note switched off, so it counts as new when it comes back', () => {
    const lowered = nextHiddenNotes(stored, ['c']);
    expect(lowered).toEqual(['c']);
    expect(nextHiddenNotes(lowered ?? [], ['a', 'b', 'c'])).toBeNull();
  });

  it('forgets the fold once the ritual has no important notes', () => {
    expect(nextHiddenNotes(stored, [])).toBeNull();
  });
});

describe('foldChanges', () => {
  const steps = [
    step('am1', { note: 'Morning one', noteImportant: true }),
    step('am2', { note: 'Morning two', noteImportant: true }),
    step('pm1', { period: 'evening', note: 'Evening one', noteImportant: true }),
    step('pm2', { period: 'evening', note: 'Evening two', noteImportant: true }),
  ];

  it('changes nothing while both folds match their rituals', () => {
    expect(foldChanges({ morning: ['am1', 'am2'], evening: null }, steps)).toEqual([]);
  });

  it('reopens the ritual that is not on Today when it gets a new important note', () => {
    const hidden = { morning: ['am1', 'am2'], evening: ['pm1'] };
    const changes = foldChanges(hidden, steps);
    expect(changes).toEqual([{ period: 'evening', stored: ['pm1'], next: null }]);
    // The screen compares this reference to leave a newer Hide or Show alone.
    expect(changes[0].stored).toBe(hidden.evening);
  });

  it('drops notes no longer important from either ritual', () => {
    const hidden = { morning: ['am1', 'am2', 'gone'], evening: ['pm1', 'pm2'] };
    expect(foldChanges(hidden, steps)).toEqual([
      { period: 'morning', stored: ['am1', 'am2', 'gone'], next: ['am1', 'am2'] },
    ]);
  });
});

describe('isFolded', () => {
  it('is folded only while every important note was there when folding', () => {
    expect(isFolded(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isFolded(['a', 'b'], ['a'])).toBe(true);
    expect(isFolded(['a', 'b'], ['a', 'c'])).toBe(false);
    expect(isFolded(null, ['a', 'b'])).toBe(false);
  });
});
