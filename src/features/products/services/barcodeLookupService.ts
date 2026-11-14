import { z } from 'zod';

import type { Category } from '@/features/products/constants';

const lookupUrl = 'https://world.openbeautyfacts.org/api/v2/product';
const lookupFields = 'product_name,brands,categories_tags';
// Open Beauty Facts asks every app to identify itself as AppName/Version (ContactEmail).
const userAgent = 'Dewy/1.0 (smol.miminals@gmail.com)';
const lookupTimeoutMs = 8000;
const maxNameLength = 80;
const maxBrandLength = 60;

// One odd field only drops that field, so a known product never reads as a failed lookup.
const optionalText = z.string().nullish().catch(null);
const responseSchema = z.object({
  status: z.number(),
  product: z
    .object({
      product_name: optionalText,
      brands: optionalText,
      categories_tags: z.array(z.string()).nullish().catch(null),
    })
    .nullish()
    .catch(null),
});

export type BarcodeLookupResult = {
  name: string | null;
  brand: string | null;
  category: Category | null;
};

// Checked in this order, so a sunscreen that is also tagged as a cream stays SPF.
const categoryKeywords: [Category, string[]][] = [
  ['spf', ['sun', 'spf']],
  ['mask', ['mask']],
  ['serum', ['serum']],
  ['cleanser', ['cleans']],
  ['toner', ['toner']],
  ['moisturizer', ['cream', 'moistur']],
];

// Products Dewy has no type for, whose tags would otherwise match a skincare keyword.
const skippedKeywords = [
  'hair',
  'shampoo',
  'tooth',
  'deodorant',
  'perspirant',
  'makeup',
  'make-up',
  'make up',
  'after-sun',
  'aftersun',
];

function guessCategory(tags: string[]): Category | null {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const hasKeyword = (keywords: string[]) =>
    lowerTags.some((tag) => keywords.some((keyword) => tag.includes(keyword)));
  if (hasKeyword(skippedKeywords)) {
    return null;
  }
  return categoryKeywords.find(([, keywords]) => hasKeyword(keywords))?.[0] ?? null;
}

// Drops zero-width characters and NUL (which Postgres can't store), then extra spaces.
function cleanText(value: string) {
  return value
    .normalize('NFC')
    .replace(/[\u0000\u200B\u2060\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Postgres char_length counts code points, so the limits do too.
function charLength(value: string) {
  return Array.from(value).length;
}

// Junk names ("0", the barcode itself) and names too long for the form are left for the user.
function toName(productName: string | null | undefined) {
  const name = cleanText(productName ?? '');
  const length = charLength(name);
  return length >= 2 && length <= maxNameLength && !/^\d+$/.test(name) ? name : null;
}

// OBF lists brands comma-separated; the first one is usually the brand on the bottle.
function toBrand(brands: string | null | undefined) {
  const brand = (brands ?? '').split(',').map(cleanText).find(Boolean) ?? '';
  return brand && charLength(brand) <= maxBrandLength ? brand : null;
}

// null means Open Beauty Facts doesn't know the code; a thrown error means the lookup itself failed.
export async function lookupBarcode(code: string): Promise<BarcodeLookupResult | null> {
  const controller = new AbortController();
  // Dewy's fetch resolves once the headers arrive, so the timer also covers reading the body.
  const timer = setTimeout(() => controller.abort(), lookupTimeoutMs);
  try {
    const response = await fetch(`${lookupUrl}/${code}.json?fields=${lookupFields}`, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      credentials: 'omit',
      signal: controller.signal,
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Open Beauty Facts answered ${response.status}`);
    }
    const body = responseSchema.parse(await response.json());
    if (body.status !== 1 || !body.product) {
      return null;
    }
    const result = {
      name: toName(body.product.product_name),
      brand: toBrand(body.product.brands),
      category: guessCategory(body.product.categories_tags ?? []),
    };
    // A record with nothing usable reads as not found, never as "Found" with nothing to offer.
    return result.name || result.brand || result.category ? result : null;
  } finally {
    clearTimeout(timer);
  }
}
