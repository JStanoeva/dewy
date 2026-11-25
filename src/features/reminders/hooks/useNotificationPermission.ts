import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  readNotificationPermission,
  requestNotificationPermission,
} from '@/features/reminders/services/notificationService';

type NotificationPermission = { allowed: boolean; canAsk: boolean };

// Read again whenever Dewy comes back to the front, since the phone's settings may have changed meanwhile.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  // A failed read keeps the last answer; the next return to the front reads it again.
  const refresh = useCallback(
    () => readNotificationPermission().then(setPermission, () => undefined),
    [],
  );

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  // Shows Android's question if it still can; true once Dewy may notify.
  const ask = useCallback(async () => {
    const granted = await requestNotificationPermission();
    await refresh();
    return granted;
  }, [refresh]);

  return { permission, ask };
}
