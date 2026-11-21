import {
  routineStepFormSchema,
  toRoutineStepFormValues,
  type RoutineStepFormValues,
} from '@/features/routines/schemas/routineStepSchema';
import type { RoutineStep } from '@/features/routines/types';

const valid: RoutineStepFormValues = {
  productId: 'product-1',
  periods: ['morning'],
  lockedPeriods: [],
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  durationSeconds: 60,
  waitMinutes: null,
};

function errorsFor(values: Partial<RoutineStepFormValues>) {
  const result = routineStepFormSchema.safeParse({ ...valid, ...values });
  if (result.success) {
    return {};
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('routineStepFormSchema', () => {
  it('maps a valid step to the save shape, with no note fields', () => {
    expect(routineStepFormSchema.parse({ ...valid, waitMinutes: 10 })).toEqual({
      productId: 'product-1',
      periods: ['morning'],
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      durationSeconds: 60,
      waitMinutes: 10,
    });
  });

  it('sends both rituals in ritual order', () => {
    expect(
      routineStepFormSchema.parse({ ...valid, periods: ['evening', 'morning'] }).periods,
    ).toEqual(['morning', 'evening']);
  });

  it('asks where the step goes when nothing is ticked', () => {
    expect(errorsFor({ periods: [] })).toEqual({ periods: 'Pick where this step goes.' });
  });

  it('drops a ritual the product is already in, and asks when none is left', () => {
    const both = routineStepFormSchema.parse({
      ...valid,
      periods: ['morning', 'evening'],
      lockedPeriods: ['morning'],
    });
    expect(both.periods).toEqual(['evening']);
    expect(errorsFor({ periods: ['morning'], lockedPeriods: ['morning'] })).toEqual({
      periods: 'Pick where this step goes.',
    });
  });

  it('ignores a locked ritual that is not ticked', () => {
    expect(
      routineStepFormSchema.parse({ ...valid, periods: ['morning'], lockedPeriods: ['evening'] })
        .periods,
    ).toEqual(['morning']);
  });

  it('asks for a product when none is picked', () => {
    expect(errorsFor({ productId: undefined })).toEqual({ productId: 'Pick a product' });
    expect(errorsFor({ productId: '' })).toEqual({ productId: 'Pick a product' });
  });

  it('needs at least one day', () => {
    expect(errorsFor({ weekdays: [] })).toEqual({ weekdays: 'Pick at least one day' });
  });

  it('sends the days sorted and without repeats', () => {
    expect(routineStepFormSchema.parse({ ...valid, weekdays: [5, 1, 3, 1] }).weekdays).toEqual([
      1, 3, 5,
    ]);
  });

  it('rejects days outside Monday to Sunday', () => {
    expect(errorsFor({ weekdays: [0] })).toHaveProperty(['weekdays.0']);
    expect(errorsFor({ weekdays: [8] })).toHaveProperty(['weekdays.0']);
    expect(errorsFor({ weekdays: [2.5] })).toHaveProperty(['weekdays.0']);
  });

  it('keeps the database range for the time, so stored values save unchanged', () => {
    expect(errorsFor({ durationSeconds: 10 })).toEqual({});
    expect(errorsFor({ durationSeconds: 900 })).toEqual({});
    expect(errorsFor({ durationSeconds: 1800 })).toEqual({});
    expect(errorsFor({ durationSeconds: 9 })).toHaveProperty('durationSeconds');
    expect(errorsFor({ durationSeconds: 1801 })).toHaveProperty('durationSeconds');
  });

  it('allows no wait or a wait of 1 to 60 minutes', () => {
    expect(errorsFor({ waitMinutes: null })).toEqual({});
    expect(errorsFor({ waitMinutes: 3 })).toEqual({});
    expect(errorsFor({ waitMinutes: 60 })).toEqual({});
    expect(errorsFor({ waitMinutes: 0 })).toHaveProperty('waitMinutes');
    expect(errorsFor({ waitMinutes: 61 })).toHaveProperty('waitMinutes');
  });

  it('reports every error together', () => {
    expect(errorsFor({ productId: '', periods: [], weekdays: [] })).toEqual({
      productId: 'Pick a product',
      periods: 'Pick where this step goes.',
      weekdays: 'Pick at least one day',
    });
  });
});

describe('toRoutineStepFormValues', () => {
  const step: RoutineStep = {
    id: 'step-1',
    productId: 'product-1',
    period: 'evening',
    position: 2,
    weekdays: [1, 3, 5],
    durationSeconds: 900,
    waitMinutes: 3,
    createdAt: '2026-11-15T10:00:00Z',
    product: {
      name: 'Retinal Serum',
      brand: null,
      category: 'serum',
      packaging: 'dropper',
      photoPath: null,
      actives: ['retinoid'],
    },
  };

  it('prefills the stored values, even ones the controls cannot show', () => {
    expect(toRoutineStepFormValues(step)).toEqual({
      productId: 'product-1',
      periods: ['evening'],
      lockedPeriods: [],
      weekdays: [1, 3, 5],
      durationSeconds: 900,
      waitMinutes: 3,
    });
  });

  it('saves an untouched step unchanged', () => {
    expect(routineStepFormSchema.parse(toRoutineStepFormValues(step))).toEqual({
      productId: 'product-1',
      periods: ['evening'],
      weekdays: [1, 3, 5],
      durationSeconds: 900,
      waitMinutes: 3,
    });
  });
});
