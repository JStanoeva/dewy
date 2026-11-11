import { z } from 'zod';

import { categories, paoMonthsOptions, productStatuses } from '@/features/products/constants';
import type { Product } from '@/features/products/types';
import { isValidLocalDate, todayLocalDate } from '@/utils/localDate';

export const earliestOpenedOn = '2000-01-01';

const maxIngredients = 20;
const maxIngredientLength = 50;

// Postgres char_length counts code points, so an emoji counts once here too.
function charLength(value: string) {
  return Array.from(value).length;
}

export function parseIngredients(text: string): string[] {
  const seen = new Set<string>();
  const ingredients: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const ingredient = part.trim();
    const key = ingredient.toLocaleLowerCase();
    if (ingredient && !seen.has(key)) {
      seen.add(key);
      ingredients.push(ingredient);
    }
  }
  return ingredients;
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
    openedOn: z.string().nullable(),
    paoMonths: z.literal(paoMonthsOptions).nullable(),
    ingredients: z
      .string()
      .transform(parseIngredients)
      .refine((list) => list.length <= maxIngredients, 'Up to 20 ingredients')
      .refine(
        (list) => list.every((ingredient) => charLength(ingredient) <= maxIngredientLength),
        'Up to 50 characters each',
      ),
    notes: z
      .string()
      .trim()
      .refine((value) => charLength(value) <= 500, 'Up to 500 characters')
      .transform((value) => value || null),
  })
  .superRefine(
    ({ status, openedOn, paoMonths }, ctx) => {
      if (status !== 'owned' || openedOn === null) {
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
  // RHF keeps hidden values, so a wishlist product drops the opened date and PAO here.
  .transform(({ status, openedOn, paoMonths, ...rest }) => ({
    ...rest,
    status,
    openedOn: status === 'owned' ? openedOn : null,
    paoMonths: status === 'owned' ? paoMonths : null,
  }));

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductInput = z.output<typeof productFormSchema>;

// The edit form starts from the stored product; an unopened product stays unopened.
export function toProductFormValues(product: Product): ProductFormValues {
  return {
    status: product.status,
    name: product.name,
    brand: product.brand ?? '',
    category: product.category,
    openedOn: product.openedOn,
    paoMonths: paoMonthsOptions.find((months) => months === product.paoMonths) ?? null,
    ingredients: product.ingredients.join(', '),
    notes: product.notes ?? '',
  };
}
