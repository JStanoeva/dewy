import * as Notifications from 'expo-notifications';
// Named, because ESLint's import plugin can't see this enum through the namespace.
import { AndroidImportance } from 'expo-notifications';
import { z } from 'zod';

import type {
  PlannedReminder,
  ReminderContent,
  ReminderData,
} from '@/features/reminders/utils/planReminders';

const channelId = 'reminders';

const reminderDataSchema = z.union([
  z.object({ productId: z.string() }),
  z.object({ period: z.enum(['morning', 'evening']) }),
]);

// A nudge shows as a banner even while Dewy is open; called once at startup.
export function setUpNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Android 13 also needs a channel before it shows the permission question.
async function ensureChannel() {
  try {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
    });
  } catch {
    // Expo Go refuses to make channels; a nudge then shows in Expo's fallback channel and still arrives.
  }
}

export async function hasNotificationPermission() {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// canAsk turns false once Android stops showing its question to Dewy.
export async function readNotificationPermission() {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return { allowed: granted, canAsk: canAskAgain };
}

// Android shows its question once; after a refusal the request answers no at once. A failure counts as no.
export async function requestNotificationPermission() {
  try {
    await ensureChannel();
    if (await hasNotificationPermission()) {
      return true;
    }
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

// Each logout counts up, so a swap queued or running for the account that left stops and leaves nothing behind.
let logouts = 0;

export function currentLogouts() {
  return logouts;
}

// Swaps every scheduled nudge for the plan, so a removed product or a turned-off nudge leaves nothing behind.
export async function applyReminderPlan(plan: readonly PlannedReminder[], started: number) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of plan) {
    if (logouts !== started) {
      break;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: reminder.content,
      trigger:
        reminder.trigger.kind === 'daily'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: reminder.trigger.hour,
              minute: reminder.trigger.minute,
              channelId,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminder.trigger.date,
              channelId,
            },
    });
  }
  if (logouts !== started) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export async function showReminderNow(content: ReminderContent) {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({ content, trigger: { channelId } });
}

// After a logout nothing is left: no scheduled nudge, and nothing of Dewy's in the tray.
export async function clearReminders() {
  logouts += 1;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

// Calls onTap for the tap that launched Dewy, then for each later one.
export function listenForReminderTaps(onTap: (data: ReminderData) => void) {
  function handle(response: Notifications.NotificationResponse) {
    Notifications.clearLastNotificationResponse();
    const data = reminderDataSchema.safeParse(response.notification.request.content.data);
    if (data.success) {
      onTap(data.data);
    }
  }
  const launch = Notifications.getLastNotificationResponse();
  if (launch) {
    handle(launch);
  }
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
