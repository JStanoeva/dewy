import { z } from 'zod';

import {
  actives,
  categories,
  categoryDetails,
  fullnessValues,
  packagings,
  paoMonthsOptions,
  productStatuses,
} from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { isValidLocalDate, todayLocalDate } from '@/utils/localDate';

export const earliestOpenedOn = '2000-01-01';

// Postgres char_length counts code points, so an emoji counts once here too.
function charLength(value: string) {
  return Array.from(value).length;
}

// The Size box's rules; an empty box means no size. Shared with the estimate card, so both agree.
export function sizeMlError(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'Whole numbers only';
  }
  const sizeMl = Number(trimmed);
  return sizeMl < 1 || sizeMl > 1000 ? 'From 1 to 1000 ml' : undefined;
}

// The typed size in ml, or null when the box is empty or invalid.
export function toSizeMl(text: string): number | null {
  const trimmed = text.trim();
  return trimmed !== '' && sizeMlError(trimmed) === undefined ? Number(trimmed) : null;
}

export const productFormSchema = z
  .object({
    status: z.enum(productStatuses),
    name: z
      .string()
      .trim()
      .min(1, 'Add a name')
      .refine((value) => charLength(value) >= 2, 'At least 2 characters')
      .refine((value) => charLength(value) <= 80, 'Up to 80 characters'),
    brand: z
      .string()
      .trim()
      .refine((value) => charLength(value) <= 60, 'Up to 60 characters')
      .transform((value) => value || null),
    category: z.enum(categories, { error: 'Pick a type' }),
    // Null until a tile is tapped: the product then takes its Type's usual bottle.
    packaging: z.enum(packagings).nullable(),
    openedOn: z.string().nullable(),
    paoMonths: z.literal(paoMonthsOptions).nullable(),
    sizeMl: z.string(),
    // Null in Edit until a tile is picked: the saved fullness and count then stay as they are.
    startFraction: z.literal(fullnessValues).nullable(),
    actives: z.array(z.enum(actives)),
    notes: z
      .string()
      .trim()
      .refine((value) => charLength(value) <= 500, 'Up to 500 characters')
      .transform((value) => value || null),
  })
  .superRefine(
    ({ status, openedOn, paoMonths, sizeMl }, ctx) => {
      if (status !== 'owned') {
        return;
      }
      const sizeError = sizeMlError(sizeMl);
      if (sizeError) {
        ctx.addIssue({ code: 'custom', path: ['sizeMl'], message: sizeError });
      }
      if (openedOn === null) {
        return;
      }
      if (!isValidLocalDate(openedOn) || openedOn < earliestOpenedOn) {
        ctx.addIssue({ code: 'custom', path: ['openedOn'], message: 'Pick a date from 2000 on' });
      } else if (openedOn > todayLocalDate()) {
        ctx.addIssue({
          code: 'custom',
          path: ['openedOn'],
          message: "That date hasn't happened yet",
        });
      }
      if (paoMonths === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['paoMonths'],
          message: 'Pick how long it lasts once opened',
        });
      }
    },
    // Show these with the field errors instead of only after every other field is valid.
    { when: () => true },
  )
  // RHF keeps hidden values, so a wishlist product drops the opened date, PAO, size and fullness here.
  .transform(({ status, packaging, openedOn, paoMonths, sizeMl, startFraction, ...rest }) => {
    const owned = status === 'owned';
    return {
      ...rest,
      status,
      packaging: packaging ?? categoryDetails[rest.category].bottle,
      openedOn: owned ? openedOn : null,
      paoMonths: owned ? paoMonths : null,
      sizeMl: owned ? toSizeMl(sizeMl) : null,
      startFraction: owned ? startFraction : 1,
    };
  });

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductInput = z.output<typeof productFormSchema>;

// What the photo's label suggests; a value the form would reject becomes null instead of an error.
export const labelReadingSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((value) => charLength(value) >= 2 && charLength(value) <= 80)
    .nullable()
    .catch(null),
  brand: z
    .string()
    .trim()
    .refine((value) => charLength(value) >= 1 && charLength(value) <= 60)
    .nullable()
    .catch(null),
  category: z.enum(categories).nullable().catch(null),
  packaging: z.enum(packagings).nullable().catch(null),
  sizeMl: z.number().int().min(1).max(1000).nullable().catch(null),
  // Known actives only, once each, in the chips' order; an older function sends none.
  actives: z
    .array(z.unknown())
    .catch([])
    .transform((values) => actives.filter((active) => values.includes(active))),
});

export type LabelReading = z.output<typeof labelReadingSchema>;

// The edit form starts from the stored product; an unopened product stays unopened.
export function toProductFormValues(product: Product): ProductFormValues {
  return {
    status: product.status,
    name: product.name,
    brand: product.brand ?? '',
    category: product.category,
    packaging: product.packaging,
    openedOn: product.openedOn,
    paoMonths: paoMonthsOptions.find((months) => months === product.paoMonths) ?? null,
    sizeMl: product.sizeMl === null ? '' : String(product.sizeMl),
    // A saved size starts unpicked (its fullness was at the start of the count); no size starts at Full.
    startFraction: product.sizeMl === null ? 1 : null,
    actives: product.actives,
    notes: product.notes ?? '',
  };
}
