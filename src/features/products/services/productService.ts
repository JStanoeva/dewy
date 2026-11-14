import { z } from 'zod';

import { categories, productStatuses } from '@/features/products/constants';
import type { ProductInput } from '@/features/products/schemas/productSchema';
import { removeProductPhoto } from '@/features/products/services/productPhotoService';
import type { Product } from '@/features/products/types';
import { supabase } from '@/lib/supabase';

const productColumns =
  'id, status, name, brand, category, photo_path, opened_on, pao_months, ingredients, notes, is_favorite, created_at, updated_at';

// The generated types only say "string" for status and category, so rows are parsed before use.
const productRowSchema = z.object({
  id: z.string(),
  status: z.enum(productStatuses),
  name: z.string(),
  brand: z.string().nullable(),
  category: z.enum(categories),
  photo_path: z.string().nullable(),
  opened_on: z.string().nullable(),
  pao_months: z.number().nullable(),
  ingredients: z.array(z.string()),
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
    photoPath: row.photo_path,
    openedOn: row.opened_on,
    paoMonths: row.pao_months,
    ingredients: row.ingredients,
    notes: row.notes,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// The database fills in id, user_id and the timestamps; clients aren't allowed to send them.
export async function createProduct(
  input: ProductInput,
  photoPath: string | null,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      status: input.status,
      name: input.name,
      brand: input.brand,
      category: input.category,
      photo_path: photoPath,
      opened_on: input.openedOn,
      pao_months: input.paoMonths,
      ingredients: input.ingredients,
      notes: input.notes,
    })
    .select(productColumns)
    .single();
  if (error) {
    throw error;
  }
  return toProduct(productRowSchema.parse(data));
}

// Status and favourite never change here; a wishlist edit leaves the opened date alone.
export async function updateProduct(
  id: string,
  input: ProductInput,
  photoPath: string | null,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      brand: input.brand,
      category: input.category,
      photo_path: photoPath,
      ingredients: input.ingredients,
      notes: input.notes,
      ...(input.status === 'owned'
        ? { opened_on: input.openedOn, pao_months: input.paoMonths }
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
