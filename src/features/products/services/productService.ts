import { z } from 'zod';

import {
  actives,
  categories,
  fullnessValues,
  type Fullness,
  packagings,
  productStatuses,
} from '@/features/products/constants';
import type { ProductInput } from '@/features/products/schemas/productSchema';
import {
  copyProductPhoto,
  removeProductPhoto,
} from '@/features/products/services/productPhotoService';
import type { Product } from '@/features/products/types';
import { findWishlistTwin, wishlistCopyOf } from '@/features/products/utils/wishlistCopy';
import { supabase } from '@/lib/supabase';
import { isValidLocalDate, type LocalDate } from '@/utils/localDate';

const productColumns =
  'id, status, name, brand, category, packaging, photo_path, opened_on, pao_months, actives, size_ml, start_fraction, tracked_from, notes, is_favorite, created_at, updated_at';

// The generated types only say "string" for status and category, so rows are parsed before use.
const productRowSchema = z.object({
  id: z.string(),
  status: z.enum(productStatuses),
  name: z.string(),
  brand: z.string().nullable(),
  category: z.enum(categories),
  packaging: z.enum(packagings),
  photo_path: z.string().nullable(),
  // Checked here so a malformed date becomes the screen's error state, not a crash while drawing.
  opened_on: z.string().refine(isValidLocalDate).nullable(),
  pao_months: z.number().nullable(),
  actives: z.array(z.enum(actives)),
  size_ml: z.number().nullable(),
  start_fraction: z.literal(fullnessValues),
  tracked_from: z.string().refine(isValidLocalDate),
  notes: z.string().nullable(),
  is_favorite: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toProduct(row: z.infer<typeof productRowSchema>): Product {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    brand: row.brand,
    category: row.category,
    packaging: row.packaging,
    photoPath: row.photo_path,
    openedOn: row.opened_on,
    paoMonths: row.pao_months,
    actives: row.actives,
    sizeMl: row.size_ml,
    startFraction: row.start_fraction,
    trackedFrom: row.tracked_from,
    notes: row.notes,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// The form picks the id once, so a retry after a save whose answer was lost returns that saved row.
export async function createProduct(
  id: string,
  input: ProductInput,
  photoPath: string | null,
  trackedFrom: LocalDate,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      id,
      status: input.status,
      name: input.name,
      brand: input.brand,
      category: input.category,
      packaging: input.packaging,
      photo_path: photoPath,
      opened_on: input.openedOn,
      pao_months: input.paoMonths,
      actives: input.actives,
      size_ml: input.sizeMl,
      start_fraction: input.startFraction ?? 1,
      tracked_from: trackedFrom,
      notes: input.notes,
    })
    .select(productColumns)
    .single();
  if (error) {
    // 23505 on the id: the first try was saved, so that row is the result.
    const saved = error.code === '23505' ? await getProduct(id) : null;
    if (saved) {
      return saved;
    }
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

// Status and favourite never change here; fullness and the count's start change only on a restart (trackedFrom).
export async function updateProduct(
  id: string,
  input: ProductInput,
  photoPath: string | null,
  trackedFrom: LocalDate | null,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      brand: input.brand,
      category: input.category,
      packaging: input.packaging,
      photo_path: photoPath,
      actives: input.actives,
      notes: input.notes,
      ...(input.status === 'owned'
        ? { opened_on: input.openedOn, pao_months: input.paoMonths, size_ml: input.sizeMl }
        : {}),
      ...(trackedFrom && input.startFraction !== null
        ? { start_fraction: input.startFraction, tracked_from: trackedFrom }
        : {}),
    })
    .eq('id', id)
    .select(productColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

// "Feels off? Adjust": how full it is now, counted from the ritual day it was picked.
export async function adjustAmount(
  id: string,
  startFraction: Fullness,
  trackedFrom: LocalDate,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ start_fraction: startFraction, tracked_from: trackedFrom })
    .eq('id', id)
    .select(productColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

const productUsesSchema = z.array(z.object({ product_id: z.string(), uses: z.number() }));

// Each product's ticks since its tracked_from; a product with none is left out, so it reads as 0.
export async function listProductUses(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('product_uses');
  if (error) {
    throw error;
  }
  return Object.fromEntries(productUsesSchema.parse(data).map((row) => [row.product_id, row.uses]));
}

// An update or a single-row select that found no row: the product was deleted elsewhere.
export function isProductGoneError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'PGRST116'
  );
}

// Products only ever move wishlist → owned, and arrive unopened.
export async function moveProductToShelf(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'owned' })
    .eq('id', id)
    .select(productColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

export type WishlistCopyResult = { added: boolean; product: Product };

// Read from the server each time, so the twin check works even when the Shelf hasn't loaded.
async function listWishlist(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(productColumns)
    .eq('status', 'wishlist');
  if (error) {
    throw error;
  }
  return z.array(productRowSchema).parse(data).map(toProduct);
}

// A new wishlist copy of an owned product, or the one already there (added: false).
export async function addToWishlist(
  id: string,
  product: Product,
  trackedFrom: LocalDate,
): Promise<WishlistCopyResult> {
  const twin = findWishlistTwin(await listWishlist(), product);
  if (twin) {
    // A retry after a lost answer finds its own copy, which this tap did add.
    return { added: twin.id === id, product: twin };
  }
  // A failed insert leaves the copied file unused rather than removed: its row may have saved anyway.
  const photoPath = product.photoPath ? await copyProductPhoto(product.photoPath) : null;
  return {
    added: true,
    product: await createProduct(id, wishlistCopyOf(product), photoPath, trackedFrom),
  };
}

export async function setProductFavorite(id: string, isFavorite: boolean): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select(productColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

// A product that is already gone counts as deleted; the photo path comes from the deleted row itself.
export async function deleteProduct(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('photo_path');
  if (error) {
    throw error;
  }
  for (const row of data) {
    if (row.photo_path) {
      removeProductPhoto(row.photo_path);
    }
  }
}

// Null when the product is gone or belongs to someone else (RLS hides it), so the screen can say so.
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(productColumns)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? toProduct(productRowSchema.parse(data)) : null;
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(productColumns)
    .order('created_at', { ascending: false })
    .order('id');
  if (error) {
    throw error;
  }
  return z.array(productRowSchema).parse(data).map(toProduct);
}
