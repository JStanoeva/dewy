import type { Category } from '@/features/products/constants';
import type { Product } from '@/features/products/types';

export type Placement = { am: boolean; pm: boolean };

const byCategory: Record<Category, Placement> = {
  cleanser: { am: true, pm: true },
  exfoliant: { am: false, pm: true },
  toner: { am: true, pm: true },
  mist: { am: true, pm: false },
  serum: { am: true, pm: true },
  moisturizer: { am: true, pm: true },
  spf: { am: true, pm: false },
  mask: { am: false, pm: true },
};

// Actives win over the category; with both kinds, the evening is the gentler bet for the sun.
export function draftPlacement(product: Pick<Product, 'category' | 'actives'>): Placement {
  if (product.actives.includes('retinoid') || product.actives.includes('acids')) {
    return { am: false, pm: true };
  }
  if (product.actives.includes('vitc')) {
    return { am: true, pm: false };
  }
  return byCategory[product.category];
}
