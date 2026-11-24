import { useEffect, useRef } from 'react';

import { useProducts } from '@/features/products/hooks/useProducts';
import { useProfile } from '@/features/profile/hooks/useProfile';
import {
  applyReminderPlan,
  currentLogouts,
} from '@/features/reminders/services/notificationService';
import { planReminders } from '@/features/reminders/utils/planReminders';

// Keeps the scheduled nudges equal to what the profile and the shelf call for, from the first start on.
export function useReminderSync() {
  const profile = useProfile().data;
  const products = useProducts().data;
  const appliedKey = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!profile || !products) {
      return;
    }
    const plan = planReminders(profile, products, new Date());
    const key = JSON.stringify(plan);
    if (key === appliedKey.current) {
      return;
    }
    appliedKey.current = key;
    const logouts = currentLogouts();
    // One swap at a time; a failed one is tried again with the next change.
    queue.current = queue.current
      .then(() => applyReminderPlan(plan, logouts))
      .catch(() => {
        if (appliedKey.current === key) {
          appliedKey.current = null;
        }
      });
  }, [profile, products]);
}
