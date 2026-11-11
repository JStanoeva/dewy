import {
  parseIngredients,
  productFormSchema,
  toProductFormValues,
  type ProductFormValues,
} from '@/features/products/schemas/productSchema';
import type { Product } from '@/features/products/types';
import { toLocalDate, todayLocalDate } from '@/utils/localDate';

const valid: ProductFormValues = {
  status: 'owned',
  name: 'Hydrating Toner',
  brand: 'Dewy Lab',
  category: 'toner',
  openedOn: '2026-11-03',
  paoMonths: 12,
  ingredients: '',
  notes: '',
};

function errorsFor(values: Partial<ProductFormValues>) {
  const result = productFormSchema.safeParse({ ...valid, ...values });
  if (result.success) {
    return {};
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('productFormSchema', () => {
  it('maps a valid owned product to the insert shape', () => {
    expect(
      productFormSchema.parse({
        ...valid,
        name: '  Hydrating Toner ',
        brand: '  ',
        ingredients: 'Niacinamide, , Ceramides ,niacinamide',
        notes: '  Use after cleansing \n',
      }),
    ).toEqual({
      status: 'owned',
      name: 'Hydrating Toner',
      brand: null,
      category: 'toner',
      openedOn: '2026-11-03',
      paoMonths: 12,
      ingredients: ['Niacinamide', 'Ceramides'],
      notes: 'Use after cleansing',
    });
  });

  it('sends empty brand, notes and ingredients as null, null and []', () => {
    const result = productFormSchema.parse(valid);
    expect(result.notes).toBeNull();
    expect(result.ingredients).toEqual([]);
    expect(productFormSchema.parse({ ...valid, brand: '' }).brand).toBeNull();
  });

  describe('name', () => {
    it('is required', () => {
      expect(errorsFor({ name: '   ' }).name).toBe('Add a name');
    });

    it('needs at least 2 characters after trimming', () => {
      expect(errorsFor({ name: ' a ' }).name).toBe('At least 2 characters');
      expect(errorsFor({ name: 'ab' }).name).toBeUndefined();
    });

    it('allows at most 80 characters, counted in code points', () => {
      expect(errorsFor({ name: 'a'.repeat(80) }).name).toBeUndefined();
      expect(errorsFor({ name: 'a'.repeat(81) }).name).toBe('Up to 80 characters');
      expect(errorsFor({ name: '💖'.repeat(80) }).name).toBeUndefined();
      expect(errorsFor({ name: '💖'.repeat(2) }).name).toBeUndefined();
    });
  });

  it('caps brand at 60 code points', () => {
    expect(errorsFor({ brand: 'b'.repeat(60) }).brand).toBeUndefined();
    expect(errorsFor({ brand: 'b'.repeat(61) }).brand).toBe('Up to 60 characters');
  });

  it('requires a category', () => {
    expect(errorsFor({ category: undefined }).category).toBe('Pick a type');
  });

  describe('opened date and PAO', () => {
    it('requires PAO when an owned product is opened', () => {
      expect(errorsFor({ paoMonths: null }).paoMonths).toBe('Pick how long it lasts once opened');
    });

    it('reports PAO together with other field errors', () => {
      const errors = errorsFor({ paoMonths: null, category: undefined, name: '' });
      expect(Object.keys(errors).sort()).toEqual(['category', 'name', 'paoMonths']);
    });

    it('allows an unopened owned product with or without PAO', () => {
      expect(errorsFor({ openedOn: null, paoMonths: null })).toEqual({});
      expect(productFormSchema.parse({ ...valid, openedOn: null }).paoMonths).toBe(12);
    });

    it('accepts today and rejects tomorrow (local dates)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(errorsFor({ openedOn: todayLocalDate() }).openedOn).toBeUndefined();
      expect(errorsFor({ openedOn: toLocalDate(tomorrow) }).openedOn).toBe(
        "That date hasn't happened yet",
      );
    });

    it('rejects dates before 2000 and invalid dates', () => {
      expect(errorsFor({ openedOn: '2000-01-01' }).openedOn).toBeUndefined();
      expect(errorsFor({ openedOn: '1999-12-31' }).openedOn).toBe('Pick a date from 2000 on');
      expect(errorsFor({ openedOn: '2026-02-30' }).openedOn).toBe('Pick a date from 2000 on');
    });

    it('drops the hidden opened date and PAO for a wishlist product', () => {
      const result = productFormSchema.parse({
        ...valid,
        status: 'wishlist',
        openedOn: '1999-01-01',
        paoMonths: null,
      });
      expect(result.openedOn).toBeNull();
      expect(result.paoMonths).toBeNull();
    });
  });

  describe('ingredients', () => {
    it('allows 20 entries and rejects 21', () => {
      const list = (count: number) => Array.from({ length: count }, (_, i) => `i${i}`).join(',');
      expect(errorsFor({ ingredients: list(20) }).ingredients).toBeUndefined();
      expect(errorsFor({ ingredients: list(21) }).ingredients).toBe('Up to 20 ingredients');
    });

    it('caps each entry at 50 characters, which keeps the total within 1000', () => {
      expect(errorsFor({ ingredients: 'x'.repeat(50) }).ingredients).toBeUndefined();
      expect(errorsFor({ ingredients: 'x'.repeat(51) }).ingredients).toBe(
        'Up to 50 characters each',
      );
    });
  });

  it('caps notes at 500 code points', () => {
    expect(errorsFor({ notes: 'n'.repeat(500) }).notes).toBeUndefined();
    expect(errorsFor({ notes: 'n'.repeat(501) }).notes).toBe('Up to 500 characters');
  });
});

describe('parseIngredients', () => {
  it('splits on commas and new lines, trims, and drops blanks and repeats', () => {
    expect(parseIngredients(' Retinal ,\nSqualane,, retinal ')).toEqual(['Retinal', 'Squalane']);
    expect(parseIngredients('')).toEqual([]);
  });
});

describe('toProductFormValues', () => {
  const stored: Product = {
    id: 'cc12e8d4-19a2-413a-9fd2-fc0797c0df95',
    status: 'owned',
    name: 'Retinal 0.1% Serum',
    brand: 'Nightjar',
    category: 'serum',
    barcode: null,
    photoPath: null,
    openedOn: '2026-05-25',
    paoMonths: 6,
    ingredients: ['Retinal', 'Squalane'],
    notes: 'Evenings only\nFollow with SPF',
    isFavorite: true,
    createdAt: '2026-11-07T09:00:00Z',
    updatedAt: '2026-11-07T09:00:00Z',
  };

  function roundTrip(product: Product) {
    return productFormSchema.parse(toProductFormValues(product));
  }

  it('gives back every stored field of an opened product', () => {
    expect(roundTrip(stored)).toEqual({
      status: 'owned',
      name: 'Retinal 0.1% Serum',
      brand: 'Nightjar',
      category: 'serum',
      openedOn: '2026-05-25',
      paoMonths: 6,
      ingredients: ['Retinal', 'Squalane'],
      notes: 'Evenings only\nFollow with SPF',
    });
  });

  it('keeps an unopened product unopened instead of using today', () => {
    const unopened = { ...stored, openedOn: null, paoMonths: null };
    expect(toProductFormValues(unopened).openedOn).toBeNull();
    expect(roundTrip(unopened)).toMatchObject({ openedOn: null, paoMonths: null });
  });

  it('keeps a wishlist product without dates', () => {
    expect(
      roundTrip({ ...stored, status: 'wishlist', openedOn: null, paoMonths: null }),
    ).toMatchObject({ status: 'wishlist', openedOn: null, paoMonths: null });
  });

  it('turns a missing brand and notes into empty fields and back into null', () => {
    const plain = { ...stored, brand: null, notes: null };
    expect(toProductFormValues(plain)).toMatchObject({ brand: '', notes: '' });
    expect(roundTrip(plain)).toMatchObject({ brand: null, notes: null });
  });

  it('keeps 20 ingredients in order', () => {
    const ingredients = Array.from({ length: 20 }, (_, i) => `Ingredient ${i + 1}`);
    expect(roundTrip({ ...stored, ingredients }).ingredients).toEqual(ingredients);
  });

  it('drops a use-within value the form does not offer', () => {
    expect(toProductFormValues({ ...stored, paoMonths: 9 }).paoMonths).toBeNull();
  });
});
