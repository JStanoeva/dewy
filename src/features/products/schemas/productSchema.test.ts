import {
  labelReadingSchema,
  productFormSchema,
  sizeMlError,
  toProductFormValues,
  toSizeMl,
  type ProductFormValues,
} from '@/features/products/schemas/productSchema';
import type { Product } from '@/features/products/types';
import { toLocalDate, todayLocalDate } from '@/utils/localDate';

const valid: ProductFormValues = {
  status: 'owned',
  name: 'Hydrating Toner',
  brand: 'Dewy Lab',
  category: 'toner',
  packaging: null,
  openedOn: '2026-11-03',
  paoMonths: 12,
  sizeMl: '',
  startFraction: 1,
  actives: [],
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
        sizeMl: ' 100 ',
        startFraction: 0.5,
        actives: ['retinoid', 'acids'],
        notes: '  Use after cleansing \n',
      }),
    ).toEqual({
      status: 'owned',
      name: 'Hydrating Toner',
      brand: null,
      category: 'toner',
      packaging: 'pump',
      openedOn: '2026-11-03',
      paoMonths: 12,
      sizeMl: 100,
      startFraction: 0.5,
      actives: ['retinoid', 'acids'],
      notes: 'Use after cleansing',
    });
  });

  describe('packaging', () => {
    // Written out, not read from categoryDetails, so it also pins the mapping 008's trigger repeats.
    it.each([
      ['cleanser', 'pump'],
      ['exfoliant', 'tube'],
      ['toner', 'pump'],
      ['mist', 'spray'],
      ['serum', 'dropper'],
      ['moisturizer', 'jar'],
      ['spf', 'tube'],
      ['mask', 'jar'],
    ] as const)('takes a %s’s usual %s until a tile is picked', (category, bottle) => {
      expect(productFormSchema.parse({ ...valid, category }).packaging).toBe(bottle);
    });

    it('keeps a picked tile, whatever the type', () => {
      expect(productFormSchema.parse({ ...valid, packaging: 'tube' }).packaging).toBe('tube');
    });

    it('asks only for the type while neither a type nor a tile is picked', () => {
      expect(errorsFor({ category: undefined, packaging: null })).toEqual({
        category: 'Pick a type',
      });
    });

    it('rejects a packaging the tiles do not offer', () => {
      expect(productFormSchema.safeParse({ ...valid, packaging: 'bottle' }).success).toBe(false);
    });
  });

  it('sends empty brand, notes, size and actives as null, null, null and []', () => {
    const result = productFormSchema.parse(valid);
    expect(result.notes).toBeNull();
    expect(result.sizeMl).toBeNull();
    expect(result.actives).toEqual([]);
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

  it('accepts the exfoliant and mist categories', () => {
    expect(errorsFor({ category: 'exfoliant' }).category).toBeUndefined();
    expect(errorsFor({ category: 'mist' }).category).toBeUndefined();
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

  describe('size', () => {
    it('is optional', () => {
      expect(errorsFor({ sizeMl: '' })).toEqual({});
      expect(errorsFor({ sizeMl: '   ' })).toEqual({});
    });

    it('takes whole numbers from 1 to 1000', () => {
      expect(errorsFor({ sizeMl: '1' }).sizeMl).toBeUndefined();
      expect(errorsFor({ sizeMl: '1000' }).sizeMl).toBeUndefined();
      expect(errorsFor({ sizeMl: '0' }).sizeMl).toBe('From 1 to 1000 ml');
      expect(errorsFor({ sizeMl: '1001' }).sizeMl).toBe('From 1 to 1000 ml');
      expect(errorsFor({ sizeMl: '99999999999999999999' }).sizeMl).toBe('From 1 to 1000 ml');
    });

    it.each(['12.5', 'abc', '-5', '1e3', '3 0', '٣٠'])(
      'rejects %s as not a whole number',
      (sizeMl) => {
        expect(errorsFor({ sizeMl }).sizeMl).toBe('Whole numbers only');
      },
    );

    it('reports the size together with other field errors', () => {
      const errors = errorsFor({ sizeMl: '0', name: '', paoMonths: null });
      expect(Object.keys(errors).sort()).toEqual(['name', 'paoMonths', 'sizeMl']);
    });

    it('is checked on an unopened product too', () => {
      expect(errorsFor({ openedOn: null, paoMonths: null, sizeMl: '0' })).toEqual({
        sizeMl: 'From 1 to 1000 ml',
      });
    });

    it('ignores whatever was typed for a wishlist product, which saves no size and Full', () => {
      const result = productFormSchema.safeParse({
        ...valid,
        status: 'wishlist',
        sizeMl: 'abc',
        startFraction: 0.25,
      });
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ sizeMl: null, startFraction: 1 });
    });
  });

  describe('fullness', () => {
    it('keeps an unpicked fullness as null, so an edit leaves the count alone', () => {
      expect(
        productFormSchema.parse({ ...valid, sizeMl: '30', startFraction: null }),
      ).toMatchObject({ sizeMl: 30, startFraction: null });
    });

    it('rejects a fullness the tiles do not offer', () => {
      expect(productFormSchema.safeParse({ ...valid, startFraction: 0.33 }).success).toBe(false);
    });
  });

  describe('actives', () => {
    it('keeps the picked actives, for a wishlist product too', () => {
      expect(productFormSchema.parse({ ...valid, actives: ['vitc', 'bpo'] }).actives).toEqual([
        'vitc',
        'bpo',
      ]);
      expect(
        productFormSchema.parse({ ...valid, status: 'wishlist', actives: ['retinoid'] }).actives,
      ).toEqual(['retinoid']);
    });

    it('rejects an active the chips do not offer', () => {
      expect(productFormSchema.safeParse({ ...valid, actives: ['niacinamide'] }).success).toBe(
        false,
      );
    });
  });

  it('caps notes at 500 code points', () => {
    expect(errorsFor({ notes: 'n'.repeat(500) }).notes).toBeUndefined();
    expect(errorsFor({ notes: 'n'.repeat(501) }).notes).toBe('Up to 500 characters');
  });
});

describe('sizeMlError and toSizeMl', () => {
  it('agree on what counts as a size', () => {
    expect(toSizeMl(' 50 ')).toBe(50);
    expect(sizeMlError(' 50 ')).toBeUndefined();
    expect(toSizeMl('')).toBeNull();
    expect(sizeMlError('')).toBeUndefined();
    expect(toSizeMl('0')).toBeNull();
    expect(sizeMlError('0')).toBe('From 1 to 1000 ml');
    expect(toSizeMl('12.5')).toBeNull();
    expect(sizeMlError('12.5')).toBe('Whole numbers only');
  });
});

describe('toProductFormValues', () => {
  const stored: Product = {
    id: 'cc12e8d4-19a2-413a-9fd2-fc0797c0df95',
    status: 'owned',
    name: 'Retinal 0.1% Serum',
    brand: 'Nightjar',
    category: 'serum',
    packaging: 'dropper',
    photoPath: null,
    openedOn: '2026-05-25',
    paoMonths: 6,
    actives: ['retinoid'],
    sizeMl: 30,
    startFraction: 0.75,
    trackedFrom: '2026-11-01',
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
      packaging: 'dropper',
      openedOn: '2026-05-25',
      paoMonths: 6,
      sizeMl: 30,
      startFraction: null,
      actives: ['retinoid'],
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

  it('starts a product with a size with no fullness picked (decision 5)', () => {
    expect(toProductFormValues(stored)).toMatchObject({ sizeMl: '30', startFraction: null });
  });

  it('starts a product without a size at Full, so adding one restarts the count', () => {
    const noSize = { ...stored, sizeMl: null };
    expect(toProductFormValues(noSize)).toMatchObject({ sizeMl: '', startFraction: 1 });
    expect(productFormSchema.parse({ ...toProductFormValues(noSize), sizeMl: '50' })).toMatchObject(
      { sizeMl: 50, startFraction: 1 },
    );
  });

  it('clears a saved size when the box is emptied', () => {
    expect(
      productFormSchema.parse({ ...toProductFormValues(stored), sizeMl: '' }).sizeMl,
    ).toBeNull();
  });

  it('drops a use-within value the form does not offer', () => {
    expect(toProductFormValues({ ...stored, paoMonths: 9 }).paoMonths).toBeNull();
  });

  it('keeps the saved packaging, even when the type changes', () => {
    const pumpSerum = { ...stored, packaging: 'pump' as const };
    expect(toProductFormValues(pumpSerum).packaging).toBe('pump');
    expect(
      productFormSchema.parse({ ...toProductFormValues(pumpSerum), category: 'moisturizer' }),
    ).toMatchObject({ category: 'moisturizer', packaging: 'pump' });
  });
});

describe('labelReadingSchema', () => {
  it('keeps a full reading, trimmed', () => {
    expect(
      labelReadingSchema.parse({
        name: ' Vitamin C 15% Serum ',
        brand: 'Brightside',
        category: 'serum',
      }),
    ).toEqual({ name: 'Vitamin C 15% Serum', brand: 'Brightside', category: 'serum' });
  });

  it('keeps an exfoliant or mist type and drops an unknown one', () => {
    expect(
      labelReadingSchema.parse({ name: 'Rose Face Mist', brand: null, category: 'mist' }).category,
    ).toBe('mist');
    expect(
      labelReadingSchema.parse({ name: 'Gentle Scrub', brand: null, category: 'exfoliant' })
        .category,
    ).toBe('exfoliant');
    expect(
      labelReadingSchema.parse({ name: 'Rosehip Oil', brand: null, category: 'oil' }).category,
    ).toBeNull();
  });

  it('keeps nulls for anything the label did not show', () => {
    expect(
      labelReadingSchema.parse({ name: 'Clay Detox Mask', brand: null, category: null }),
    ).toEqual({ name: 'Clay Detox Mask', brand: null, category: null });
  });

  it('drops names and brands the form would reject instead of cutting them', () => {
    expect(
      labelReadingSchema.parse({ name: 'x'.repeat(81), brand: 'b'.repeat(61), category: null }),
    ).toEqual({ name: null, brand: null, category: null });
    expect(labelReadingSchema.parse({ name: 'x', brand: '   ', category: null })).toMatchObject({
      name: null,
      brand: null,
    });
  });

  it('counts code points, like the form', () => {
    expect(
      labelReadingSchema.parse({ name: '💖'.repeat(80), brand: null, category: null }).name,
    ).toBe('💖'.repeat(80));
  });

  it('turns an unknown type, a wrong type or a missing field into null', () => {
    expect(labelReadingSchema.parse({ name: 7, brand: undefined, category: 'Serum' })).toEqual({
      name: null,
      brand: null,
      category: null,
    });
    expect(labelReadingSchema.parse({})).toEqual({ name: null, brand: null, category: null });
  });

  it('rejects an answer that is not an object', () => {
    expect(labelReadingSchema.safeParse('{"name":"x"}').success).toBe(false);
    expect(labelReadingSchema.safeParse(null).success).toBe(false);
  });
});
