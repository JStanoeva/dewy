import type { Product } from '@/features/products/types';
import { findWishlistTwin, wishlistCopyOf } from '@/features/products/utils/wishlistCopy';
import type { LocalDate } from '@/utils/localDate';

const foam: Product = {
  id: 'owned-foam',
  status: 'owned',
  name: 'Rose Clean & Hydrate Face Foam',
  brand: 'Cocosolis',
  category: 'cleanser',
  packaging: 'pump',
  photoPath: 'user/photo.jpg',
  openedOn: '2026-11-15',
  paoMonths: 24,
  actives: ['acids'],
  sizeMl: 150,
  startFraction: 0.5,
  trackedFrom: '2026-11-15' as LocalDate,
  notes: 'Second pump only',
  isFavorite: true,
  lowNotifiedAt: null,
  createdAt: '2026-11-15T10:00:00Z',
  updatedAt: '2026-11-20T10:00:00Z',
};

function onWishlist(overrides: Partial<Product>): Product {
  return { ...foam, id: 'wish', status: 'wishlist', ...overrides };
}

describe('wishlistCopyOf', () => {
  it('keeps what names the product and starts the next bottle fresh', () => {
    expect(wishlistCopyOf(foam)).toEqual({
      status: 'wishlist',
      name: 'Rose Clean & Hydrate Face Foam',
      brand: 'Cocosolis',
      category: 'cleanser',
      packaging: 'pump',
      openedOn: null,
      paoMonths: null,
      sizeMl: null,
      startFraction: 1,
      actives: ['acids'],
      notes: null,
    });
  });

  it('keeps a missing brand missing', () => {
    expect(wishlistCopyOf({ ...foam, brand: null }).brand).toBeNull();
  });
});

describe('findWishlistTwin', () => {
  it('finds the same name and brand on the wishlist', () => {
    const twin = onWishlist({});
    expect(findWishlistTwin([twin], foam)).toBe(twin);
  });

  it('ignores letter case and extra spaces', () => {
    const twin = onWishlist({ name: '  rose clean &  hydrate FACE foam ', brand: 'COCOSOLIS ' });
    expect(findWishlistTwin([twin], foam)).toBe(twin);
  });

  it('matches no brand only with no brand', () => {
    const noBrand = { ...foam, brand: null };
    expect(findWishlistTwin([onWishlist({ brand: '' })], noBrand)).toBeDefined();
    expect(findWishlistTwin([onWishlist({})], noBrand)).toBeUndefined();
    expect(findWishlistTwin([onWishlist({ brand: null })], foam)).toBeUndefined();
  });

  it('needs both the name and the brand to match', () => {
    expect(findWishlistTwin([onWishlist({ name: 'Rose Face Foam' })], foam)).toBeUndefined();
    expect(findWishlistTwin([onWishlist({ brand: 'Melt' })], foam)).toBeUndefined();
  });

  it('skips owned products and the product itself', () => {
    expect(findWishlistTwin([{ ...foam, id: 'other-owned' }], foam)).toBeUndefined();
    expect(findWishlistTwin([{ ...foam, status: 'wishlist' }], foam)).toBeUndefined();
  });
});
