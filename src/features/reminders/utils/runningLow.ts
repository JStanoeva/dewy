import type { Product } from '@/features/products/types';
import { getUsesLeft, isRunningLow } from '@/features/products/utils/usesLeft';
import type { ReminderContent } from '@/features/reminders/utils/planReminders';

type RunningLowProduct = Pick<
  Product,
  'id' | 'name' | 'status' | 'sizeMl' | 'startFraction' | 'category' | 'lowNotifiedAt'
>;

// The Running low notification a saved tick should show, or null when this bottle needs none.
export function runningLowNotice(
  product: RunningLowProduct,
  uses: number,
  threshold: number,
): ReminderContent | null {
  if (product.status !== 'owned' || product.lowNotifiedAt !== null) {
    return null;
  }
  const usesLeft = getUsesLeft(product, uses);
  if (usesLeft === null || !isRunningLow(usesLeft, threshold)) {
    return null;
  }
  const body =
    usesLeft === 0
      ? "It's about empty. Time to restock?"
      : `About ${usesLeft} ${usesLeft === 1 ? 'use' : 'uses'} left. Time to restock?`;
  return { title: `${product.name} is running low`, body, data: { productId: product.id } };
}
