import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  listProductUses,
  markRunningLowNotified,
} from '@/features/products/services/productService';
import type { Product } from '@/features/products/types';
import type { Profile } from '@/features/profile/types';
import {
  hasNotificationPermission,
  showReminderNow,
} from '@/features/reminders/services/notificationService';
import { runningLowNotice } from '@/features/reminders/utils/runningLow';

// After a saved tick: Running low, once per bottle, when it has reached the account's number.
export function useRunningLowCheck() {
  const queryClient = useQueryClient();

  return useCallback(
    async (productId: string) => {
      const profile = queryClient.getQueryData<Profile>(['profile']);
      const product = queryClient
        .getQueryData<Product[]>(['products'])
        ?.find((item) => item.id === productId);
      if (!profile?.lowAlertsEnabled || !product || product.lowNotifiedAt !== null) {
        return;
      }
      try {
        if (!(await hasNotificationPermission())) {
          return;
        }
        // Straight from the server, so the tick that was just saved is counted.
        const uses = await listProductUses();
        const notice = runningLowNotice(product, uses[productId] ?? 0, profile.lowUsesThreshold);
        if (!notice || !(await markRunningLowNotified(productId))) {
          return;
        }
        // A logout meanwhile clears the cache; its account's bottle then stays quiet.
        if (queryClient.getQueryData<Profile>(['profile'])?.id !== profile.id) {
          return;
        }
        await showReminderNow(notice);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch {
        // Best effort: the tick itself was saved, so there is nothing to tell the user.
      }
    },
    [queryClient],
  );
}
