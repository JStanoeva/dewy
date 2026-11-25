import type { Product } from '@/features/products/types';
import { getShelfLife } from '@/features/products/utils/shelfLife';
import { getUsesLeft, isRunningLow } from '@/features/products/utils/usesLeft';
import type { LocalDate } from '@/utils/localDate';

type AttentionProduct = Pick<
  Product,
  'id' | 'status' | 'openedOn' | 'paoMonths' | 'sizeMl' | 'startFraction' | 'category'
>;

// Owned products expiring soon or running low, each once; without use counts, only expiring.
export function countNeedAttention(
  products: readonly AttentionProduct[],
  uses: Record<string, number> | undefined,
  threshold: number,
  today: LocalDate,
) {
  return products.filter((product) => {
    if (product.status !== 'owned') {
      return false;
    }
    if (getShelfLife(product.openedOn, product.paoMonths, today)?.isExpiringSoon) {
      return true;
    }
    if (!uses) {
      return false;
    }
    const usesLeft = getUsesLeft(product, uses[product.id] ?? 0);
    return usesLeft !== null && isRunningLow(usesLeft, threshold);
  }).length;
}
