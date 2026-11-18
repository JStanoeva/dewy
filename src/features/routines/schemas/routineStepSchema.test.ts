import {
  routineStepFormSchema,
  toRoutineStepFormValues,
  type RoutineStepFormValues,
} from '@/features/routines/schemas/routineStepSchema';
import type { RoutineStep } from '@/features/routines/types';

const valid: RoutineStepFormValues = {
  productId: 'product-1',
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  durationSeconds: 60,
  waitMinutes: null,
  note: '',
  noteImportant: false,
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
  it('maps a valid step to the insert shape', () => {
    expect(
      routineStepFormSchema.parse({ ...valid, waitMinutes: 10, note: '  Skip acids tonight ' }),
    ).toEqual({
      productId: 'product-1',
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      durationSeconds: 60,
      waitMinutes: 10,
      note: 'Skip acids tonight',
      noteImportant: false,
    });
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

  it('sends a blank note as null', () => {
    expect(routineStepFormSchema.parse({ ...valid, note: ' \n\t ' }).note).toBeNull();
  });

  it('keeps a note important only while the note has text', () => {
    expect(
      routineStepFormSchema.parse({ ...valid, note: 'Skip acids', noteImportant: true }),
    ).toMatchObject({
      note: 'Skip acids',
      noteImportant: true,
    });
    expect(routineStepFormSchema.parse({ ...valid, note: '', noteImportant: true })).toMatchObject({
      note: null,
      noteImportant: false,
    });
    expect(
      routineStepFormSchema.parse({ ...valid, note: ' \n\t ', noteImportant: true }),
    ).toMatchObject({ note: null, noteImportant: false });
  });

  it('counts the note in code points, like Postgres', () => {
    expect(errorsFor({ note: '🌙'.repeat(80) })).toEqual({});
    expect(errorsFor({ note: '🌙'.repeat(81) })).toEqual({ note: 'Up to 80 characters' });
    expect(errorsFor({ note: 'a'.repeat(81) })).toEqual({ note: 'Up to 80 characters' });
  });

  it('reports every error together', () => {
    expect(errorsFor({ productId: undefined, weekdays: [], note: 'a'.repeat(81) })).toEqual({
      productId: 'Pick a product',
      weekdays: 'Pick at least one day',
      note: 'Up to 80 characters',
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
    note: 'Skip acids tonight',
    noteImportant: true,
    createdAt: '2026-11-15T10:00:00Z',
    product: {
      name: 'Retinal Serum',
      brand: null,
      category: 'serum',
      packaging: 'dropper',
      photoPath: null,
    },
  };

  it('prefills the stored values, even ones the controls cannot show', () => {
    expect(toRoutineStepFormValues(step)).toEqual({
      productId: 'product-1',
      weekdays: [1, 3, 5],
      durationSeconds: 900,
      waitMinutes: 3,
      note: 'Skip acids tonight',
      noteImportant: true,
    });
  });

  it('saves an untouched step unchanged', () => {
    expect(routineStepFormSchema.parse(toRoutineStepFormValues(step))).toEqual({
      productId: 'product-1',
      weekdays: [1, 3, 5],
      durationSeconds: 900,
      waitMinutes: 3,
      note: 'Skip acids tonight',
      noteImportant: true,
    });
  });

  it('starts a step without a note with an empty, unimportant note', () => {
    const plain = toRoutineStepFormValues({ ...step, note: null, noteImportant: false });
    expect(plain).toMatchObject({ note: '', noteImportant: false });
    expect(routineStepFormSchema.parse(plain)).toMatchObject({ note: null, noteImportant: false });
  });
});
