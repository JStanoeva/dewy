import type { Product } from '@/features/products/types';
import type { Profile } from '@/features/profile/types';
import type { Period } from '@/theme/period';
import { addMonths, formatDayMonth, parseLocalDate } from '@/utils/localDate';

// What a tap on the notification opens: Today for a ritual, the product's details otherwise.
export type ReminderData = { period: Period } | { productId: string };

export type ReminderContent = { title: string; body: string; data: ReminderData };

export type ReminderTrigger =
  { kind: 'daily'; hour: number; minute: number } | { kind: 'once'; date: Date };

export type PlannedReminder = { id: string; content: ReminderContent; trigger: ReminderTrigger };

export type ReminderSettings = Pick<
  Profile,
  | 'morningReminderEnabled'
  | 'morningReminderTime'
  | 'eveningReminderEnabled'
  | 'eveningReminderTime'
  | 'expiryAlertsEnabled'
  | 'expiryLeadDays'
>;

type ReminderProduct = Pick<Product, 'id' | 'name' | 'status' | 'openedOn' | 'paoMonths'>;

const ritualContent: Record<Period, ReminderContent> = {
  morning: {
    title: 'Morning ritual',
    body: 'Your morning steps are ready when you are.',
    data: { period: 'morning' },
  },
  evening: {
    title: 'Evening ritual',
    body: 'Time to wind down with your evening steps.',
    data: { period: 'evening' },
  },
};

const leadLabels: Record<number, string> = {
  3: '3 days',
  7: '1 week',
  14: '2 weeks',
  30: '1 month',
};

// The database's 'HH:MM:SS' as an hour and a minute.
export function reminderTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}

// Every nudge the settings and the shelf call for right now; Expiring soon only when it is still ahead.
export function planReminders(
  settings: ReminderSettings,
  products: readonly ReminderProduct[],
  now: Date,
): PlannedReminder[] {
  const morning = reminderTime(settings.morningReminderTime);
  const plan: PlannedReminder[] = [];
  if (settings.morningReminderEnabled) {
    plan.push({
      id: 'dewy-morning',
      content: ritualContent.morning,
      trigger: { kind: 'daily', ...morning },
    });
  }
  if (settings.eveningReminderEnabled) {
    plan.push({
      id: 'dewy-evening',
      content: ritualContent.evening,
      trigger: { kind: 'daily', ...reminderTime(settings.eveningReminderTime) },
    });
  }
  if (!settings.expiryAlertsEnabled) {
    return plan;
  }
  // Next to the morning reminder while it is on, so it arrives at the shelf; otherwise at 9:00.
  const at = settings.morningReminderEnabled ? morning : { hour: 9, minute: 0 };
  const lead = leadLabels[settings.expiryLeadDays] ?? `${settings.expiryLeadDays} days`;
  for (const product of products) {
    if (product.status !== 'owned' || product.openedOn === null || product.paoMonths === null) {
      continue;
    }
    const expiresOn = addMonths(product.openedOn, product.paoMonths);
    const date = parseLocalDate(expiresOn);
    date.setDate(date.getDate() - settings.expiryLeadDays);
    date.setHours(at.hour, at.minute, 0, 0);
    if (date.getTime() <= now.getTime()) {
      continue;
    }
    plan.push({
      id: `dewy-expiry-${product.id}`,
      content: {
        title: `${product.name} expires in ${lead}`,
        body: `Best used by ${formatDayMonth(expiresOn)}.`,
        data: { productId: product.id },
      },
      trigger: { kind: 'once', date },
    });
  }
  return plan;
}
