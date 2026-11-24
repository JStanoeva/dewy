import type { NudgeSettings } from '@/features/profile/types';

// The options each nudge offers; times as the database returns them.
export const morningTimes: readonly string[] = ['07:00:00', '07:30:00', '08:00:00', '08:30:00'];
export const eveningTimes: readonly string[] = ['21:00:00', '21:30:00', '22:00:00', '22:30:00'];
export const expiryLeadDays: readonly number[] = [3, 7, 14, 30];
export const lowUsesThresholds: readonly number[] = [3, 5, 10, 20];

export const leadLabels: Record<number, string> = {
  3: '3 days',
  7: '1 week',
  14: '2 weeks',
  30: '1 month',
};

// Step 3 starts with every nudge on, at the drawn choices.
export const defaultNudges: NudgeSettings = {
  morningReminderEnabled: true,
  morningReminderTime: '08:00:00',
  eveningReminderEnabled: true,
  eveningReminderTime: '21:30:00',
  expiryAlertsEnabled: true,
  expiryLeadDays: 14,
  lowAlertsEnabled: true,
  lowUsesThreshold: 5,
};
