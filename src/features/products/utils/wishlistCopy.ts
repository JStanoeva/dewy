import type { ProductInput } from '@/features/products/schemas/productSchema';
import type { Product } from '@/features/products/types';

// The next bottle: unopened, with no notes, size or heart of its own yet.
export function wishlistCopyOf(product: Product): ProductInput {
  return {
    status: 'wishlist',
    name: product.name,
    brand: product.brand,
    category: product.category,
    packaging: product.packaging,
    openedOn: null,
    paoMonths: null,
    sizeMl: null,
    startFraction: 1,
    actives: product.actives,
    notes: null,
  };
}

function matchKey(text: string | null): string {
  return (text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// The same product already on the wishlist: same name and brand, ignoring letter case and extra spaces.
export function findWishlistTwin(wishlist: Product[], product: Product): Product | undefined {
  return wishlist.find(
    (item) =>
      item.status === 'wishlist' &&
      item.id !== product.id &&
      matchKey(item.name) === matchKey(product.name) &&
      matchKey(item.brand) === matchKey(product.brand),
  );
}
